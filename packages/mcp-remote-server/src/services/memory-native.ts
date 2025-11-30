/**
 * MCP-Native Memory Service (Option B)
 *
 * Implements a Memento-style memory system where:
 * - Client LLM (Claude.ai/ChatGPT) handles fact extraction
 * - Server stores structured entities, observations, and relations
 * - Local embeddings via @xenova/transformers (BGE-M3 model)
 * - $0 API cost - all processing is local
 */

import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";
import Database from "better-sqlite3";

// ============================================================================
// Types
// ============================================================================

export type EntityType = "person" | "business" | "concept" | "event" | "other";
export type Importance = "critical" | "important" | "normal" | "temporary";

export interface MemoryEntity {
  id: string;
  userId: string;
  name: string;
  entityType: EntityType;
  createdAt: number;
  updatedAt: number;
}

export interface MemoryObservation {
  id: string;
  entityId: string;
  observation: string;
  importance: Importance;
  embedding?: number[];
  createdAt: number;
  updatedAt: number;
}

export interface MemoryRelation {
  id: string;
  userId: string;
  fromEntityId: string;
  toEntityId: string;
  relationType: string;
  createdAt: number;
}

export interface EntityWithObservations extends MemoryEntity {
  observations: MemoryObservation[];
  relations?: {
    type: string;
    direction: "from" | "to";
    entity: MemoryEntity;
  }[];
}

export interface SearchResult {
  entity: MemoryEntity;
  observation: MemoryObservation;
  score: number;
}

// ============================================================================
// Memory Native Service
// ============================================================================

export class MemoryNativeService {
  private db: Database.Database | null = null;
  private embedder: FeatureExtractionPipeline | null = null;
  private embedderLoading: Promise<FeatureExtractionPipeline> | null = null;
  private dbPath: string;

  // BGE-M3 produces 1024-dim embeddings, but we'll use a smaller model for VPS
  // all-MiniLM-L6-v2 produces 384-dim embeddings and is much lighter
  private readonly MODEL_NAME = "Xenova/all-MiniLM-L6-v2";
  private readonly EMBEDDING_DIM = 384;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.DATABASE_PATH || "./data/pip.db";
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  async initialize(): Promise<void> {
    // Initialize database
    this.db = new Database(this.dbPath);
    this.db.pragma("journal_mode = WAL");

    // Ensure foreign keys are enabled
    this.db.pragma("foreign_keys = ON");

    // Create memory tables if they don't exist
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_entities (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        entity_type TEXT NOT NULL DEFAULT 'other',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_entities_user ON memory_entities(user_id);
      CREATE INDEX IF NOT EXISTS idx_entities_name ON memory_entities(user_id, name);

      CREATE TABLE IF NOT EXISTS memory_observations (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        observation TEXT NOT NULL,
        importance TEXT NOT NULL DEFAULT 'normal',
        embedding TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (entity_id) REFERENCES memory_entities(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_observations_entity ON memory_observations(entity_id);

      CREATE TABLE IF NOT EXISTS memory_relations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        from_entity_id TEXT NOT NULL,
        to_entity_id TEXT NOT NULL,
        relation_type TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (from_entity_id) REFERENCES memory_entities(id) ON DELETE CASCADE,
        FOREIGN KEY (to_entity_id) REFERENCES memory_entities(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_relations_user ON memory_relations(user_id);
    `);

    console.log(`✓ MemoryNative connected to: ${this.dbPath}`);

    // Skip embedding model loading in Docker Alpine (onnxruntime glibc issue)
    // Semantic search will fallback to text matching
    console.log(`[Memory Native] Embeddings disabled (Alpine/glibc compatibility)`);
  }

  private async loadEmbedder(): Promise<FeatureExtractionPipeline> {
    if (this.embedder) return this.embedder;
    if (this.embedderLoading) return this.embedderLoading;

    console.log(`Loading embedding model: ${this.MODEL_NAME}...`);

    this.embedderLoading = pipeline("feature-extraction", this.MODEL_NAME, {
      quantized: true, // Use quantized model for smaller memory footprint
    });

    this.embedder = await this.embedderLoading;
    this.embedderLoading = null;

    console.log(`✓ Embedding model loaded: ${this.MODEL_NAME}`);
    return this.embedder;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // ============================================================================
  // Embedding Operations
  // ============================================================================

  async generateEmbedding(text: string): Promise<number[]> {
    const embedder = await this.loadEmbedder();
    const result = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(result.data as Float32Array);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // ============================================================================
  // Entity Operations
  // ============================================================================

  async createEntity(
    userId: string,
    name: string,
    entityType: EntityType,
    observations?: string[]
  ): Promise<EntityWithObservations> {
    if (!this.db) throw new Error("Database not initialized");

    const now = Date.now();
    const entityId = crypto.randomUUID();

    // Check if entity already exists for this user
    const existing = this.db
      .prepare(
        `SELECT id FROM memory_entities WHERE user_id = ? AND LOWER(name) = LOWER(?)`
      )
      .get(userId, name) as { id: string } | undefined;

    if (existing) {
      // Add observations to existing entity
      if (observations && observations.length > 0) {
        for (const obs of observations) {
          await this.addObservation(existing.id, obs);
        }
      }
      return this.getEntity(userId, name, true) as Promise<EntityWithObservations>;
    }

    // Create new entity
    this.db
      .prepare(
        `INSERT INTO memory_entities (id, user_id, name, entity_type, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(entityId, userId, name, entityType, now, now);

    // Add observations
    const addedObservations: MemoryObservation[] = [];
    if (observations && observations.length > 0) {
      for (const obs of observations) {
        const observation = await this.addObservation(entityId, obs);
        addedObservations.push(observation);
      }
    }

    return {
      id: entityId,
      userId,
      name,
      entityType,
      createdAt: now,
      updatedAt: now,
      observations: addedObservations,
    };
  }

  async getEntity(
    userId: string,
    name: string,
    includeRelations = false
  ): Promise<EntityWithObservations | null> {
    if (!this.db) throw new Error("Database not initialized");

    const row = this.db
      .prepare(
        `SELECT * FROM memory_entities WHERE user_id = ? AND LOWER(name) = LOWER(?)`
      )
      .get(userId, name) as any;

    if (!row) return null;

    const entity: MemoryEntity = {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      entityType: row.entity_type as EntityType,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    // Get observations
    const obsRows = this.db
      .prepare(
        `SELECT * FROM memory_observations WHERE entity_id = ? ORDER BY importance DESC, created_at DESC`
      )
      .all(row.id) as any[];

    const observations: MemoryObservation[] = obsRows.map((o) => ({
      id: o.id,
      entityId: o.entity_id,
      observation: o.observation,
      importance: o.importance as Importance,
      embedding: o.embedding
        ? Array.from(new Float32Array(o.embedding.buffer))
        : undefined,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }));

    const result: EntityWithObservations = {
      ...entity,
      observations,
    };

    // Get relations if requested
    if (includeRelations) {
      result.relations = await this.getRelationsForEntity(userId, row.id);
    }

    return result;
  }

  async getEntityById(entityId: string): Promise<MemoryEntity | null> {
    if (!this.db) throw new Error("Database not initialized");

    const row = this.db
      .prepare(`SELECT * FROM memory_entities WHERE id = ?`)
      .get(entityId) as any;

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      name: row.name,
      entityType: row.entity_type as EntityType,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listEntities(userId: string): Promise<MemoryEntity[]> {
    if (!this.db) throw new Error("Database not initialized");

    const rows = this.db
      .prepare(
        `SELECT * FROM memory_entities WHERE user_id = ? ORDER BY updated_at DESC`
      )
      .all(userId) as any[];

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      entityType: row.entity_type as EntityType,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async deleteEntity(userId: string, name: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const result = this.db
      .prepare(
        `DELETE FROM memory_entities WHERE user_id = ? AND LOWER(name) = LOWER(?)`
      )
      .run(userId, name);

    return result.changes > 0;
  }

  // ============================================================================
  // Observation Operations
  // ============================================================================

  async addObservation(
    entityId: string,
    observation: string,
    importance: Importance = "normal"
  ): Promise<MemoryObservation> {
    if (!this.db) throw new Error("Database not initialized");

    // Check for duplicate/similar observation
    const existing = this.db
      .prepare(
        `SELECT id FROM memory_observations
         WHERE entity_id = ? AND LOWER(observation) = LOWER(?)`
      )
      .get(entityId, observation) as { id: string } | undefined;

    if (existing) {
      // Update existing observation's timestamp
      const now = Date.now();
      this.db
        .prepare(`UPDATE memory_observations SET updated_at = ? WHERE id = ?`)
        .run(now, existing.id);

      const row = this.db
        .prepare(`SELECT * FROM memory_observations WHERE id = ?`)
        .get(existing.id) as any;

      return {
        id: row.id,
        entityId: row.entity_id,
        observation: row.observation,
        importance: row.importance as Importance,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    // Skip embedding generation (Alpine/glibc compatibility)
    // Using text-based search instead of semantic search
    this.db
      .prepare(
        `INSERT INTO memory_observations (id, entity_id, observation, importance, embedding, created_at, updated_at)
         VALUES (?, ?, ?, ?, NULL, ?, ?)`
      )
      .run(id, entityId, observation, importance, now, now);

    // Update entity's updated_at
    this.db
      .prepare(`UPDATE memory_entities SET updated_at = ? WHERE id = ?`)
      .run(now, entityId);

    return {
      id,
      entityId,
      observation,
      importance,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateObservationImportance(
    observationId: string,
    importance: Importance
  ): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    const now = Date.now();
    this.db
      .prepare(
        `UPDATE memory_observations SET importance = ?, updated_at = ? WHERE id = ?`
      )
      .run(importance, now, observationId);
  }

  async deleteObservation(observationId: string): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const result = this.db
      .prepare(`DELETE FROM memory_observations WHERE id = ?`)
      .run(observationId);

    return result.changes > 0;
  }

  // ============================================================================
  // Relation Operations
  // ============================================================================

  async createRelation(
    userId: string,
    fromEntityName: string,
    toEntityName: string,
    relationType: string
  ): Promise<MemoryRelation | null> {
    if (!this.db) throw new Error("Database not initialized");

    // Get entity IDs
    const fromEntity = this.db
      .prepare(
        `SELECT id FROM memory_entities WHERE user_id = ? AND LOWER(name) = LOWER(?)`
      )
      .get(userId, fromEntityName) as { id: string } | undefined;

    const toEntity = this.db
      .prepare(
        `SELECT id FROM memory_entities WHERE user_id = ? AND LOWER(name) = LOWER(?)`
      )
      .get(userId, toEntityName) as { id: string } | undefined;

    if (!fromEntity || !toEntity) {
      return null; // Entities must exist
    }

    // Check if relation already exists
    const existing = this.db
      .prepare(
        `SELECT id FROM memory_relations
         WHERE user_id = ? AND from_entity_id = ? AND to_entity_id = ? AND LOWER(relation_type) = LOWER(?)`
      )
      .get(userId, fromEntity.id, toEntity.id, relationType);

    if (existing) {
      return null; // Relation already exists
    }

    const now = Date.now();
    const id = crypto.randomUUID();

    this.db
      .prepare(
        `INSERT INTO memory_relations (id, user_id, from_entity_id, to_entity_id, relation_type, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(id, userId, fromEntity.id, toEntity.id, relationType, now);

    return {
      id,
      userId,
      fromEntityId: fromEntity.id,
      toEntityId: toEntity.id,
      relationType,
      createdAt: now,
    };
  }

  async getRelationsForEntity(
    userId: string,
    entityId: string
  ): Promise<
    { type: string; direction: "from" | "to"; entity: MemoryEntity }[]
  > {
    if (!this.db) throw new Error("Database not initialized");

    const relations: { type: string; direction: "from" | "to"; entity: MemoryEntity }[] = [];

    // Relations where this entity is the source
    const fromRelations = this.db
      .prepare(
        `SELECT r.relation_type, e.* FROM memory_relations r
         JOIN memory_entities e ON r.to_entity_id = e.id
         WHERE r.user_id = ? AND r.from_entity_id = ?`
      )
      .all(userId, entityId) as any[];

    for (const row of fromRelations) {
      relations.push({
        type: row.relation_type,
        direction: "from",
        entity: {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          entityType: row.entity_type as EntityType,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    }

    // Relations where this entity is the target
    const toRelations = this.db
      .prepare(
        `SELECT r.relation_type, e.* FROM memory_relations r
         JOIN memory_entities e ON r.from_entity_id = e.id
         WHERE r.user_id = ? AND r.to_entity_id = ?`
      )
      .all(userId, entityId) as any[];

    for (const row of toRelations) {
      relations.push({
        type: row.relation_type,
        direction: "to",
        entity: {
          id: row.id,
          userId: row.user_id,
          name: row.name,
          entityType: row.entity_type as EntityType,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      });
    }

    return relations;
  }

  async deleteRelation(
    userId: string,
    fromEntityName: string,
    toEntityName: string,
    relationType: string
  ): Promise<boolean> {
    if (!this.db) throw new Error("Database not initialized");

    const fromEntity = this.db
      .prepare(
        `SELECT id FROM memory_entities WHERE user_id = ? AND LOWER(name) = LOWER(?)`
      )
      .get(userId, fromEntityName) as { id: string } | undefined;

    const toEntity = this.db
      .prepare(
        `SELECT id FROM memory_entities WHERE user_id = ? AND LOWER(name) = LOWER(?)`
      )
      .get(userId, toEntityName) as { id: string } | undefined;

    if (!fromEntity || !toEntity) return false;

    const result = this.db
      .prepare(
        `DELETE FROM memory_relations
         WHERE user_id = ? AND from_entity_id = ? AND to_entity_id = ? AND LOWER(relation_type) = LOWER(?)`
      )
      .run(userId, fromEntity.id, toEntity.id, relationType);

    return result.changes > 0;
  }

  // ============================================================================
  // Search Operations
  // ============================================================================

  async searchMemory(
    userId: string,
    query: string,
    limit = 10
  ): Promise<SearchResult[]> {
    if (!this.db) throw new Error("Database not initialized");

    // Text-based search (embeddings disabled for Alpine compatibility)
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Get all observations for this user
    const rows = this.db
      .prepare(
        `SELECT o.*, e.name as entity_name, e.entity_type, e.user_id
         FROM memory_observations o
         JOIN memory_entities e ON o.entity_id = e.id
         WHERE e.user_id = ?`
      )
      .all(userId) as any[];

    // Calculate text similarity scores
    const results: SearchResult[] = [];

    for (const row of rows) {
      const obsLower = row.observation.toLowerCase();

      // Simple text matching score
      let matchCount = 0;
      for (const word of queryWords) {
        if (obsLower.includes(word)) matchCount++;
      }

      // Skip if no matches
      if (matchCount === 0 && !obsLower.includes(queryLower)) continue;

      // Score: exact phrase match = 1.0, word matches = proportion
      let score = obsLower.includes(queryLower) ? 1.0 : (matchCount / Math.max(queryWords.length, 1)) * 0.8;

      // Apply importance weighting
      const importanceWeight =
        row.importance === "critical"
          ? 1.2
          : row.importance === "important"
          ? 1.1
          : row.importance === "temporary"
          ? 0.8
          : 1.0;

      results.push({
        entity: {
          id: row.entity_id,
          userId: row.user_id,
          name: row.entity_name,
          entityType: row.entity_type as EntityType,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        observation: {
          id: row.id,
          entityId: row.entity_id,
          observation: row.observation,
          importance: row.importance as Importance,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
        score: score * importanceWeight,
      });
    }

    // Sort by score and return top results
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit);
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  async getMemoryStats(userId: string): Promise<{
    entityCount: number;
    observationCount: number;
    relationCount: number;
  }> {
    if (!this.db) throw new Error("Database not initialized");

    const entityCount = (
      this.db
        .prepare(`SELECT COUNT(*) as count FROM memory_entities WHERE user_id = ?`)
        .get(userId) as { count: number }
    ).count;

    const observationCount = (
      this.db
        .prepare(
          `SELECT COUNT(*) as count FROM memory_observations o
           JOIN memory_entities e ON o.entity_id = e.id
           WHERE e.user_id = ?`
        )
        .get(userId) as { count: number }
    ).count;

    const relationCount = (
      this.db
        .prepare(`SELECT COUNT(*) as count FROM memory_relations WHERE user_id = ?`)
        .get(userId) as { count: number }
    ).count;

    return { entityCount, observationCount, relationCount };
  }

  async clearUserMemory(userId: string): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    // Delete in order due to foreign keys
    this.db
      .prepare(`DELETE FROM memory_relations WHERE user_id = ?`)
      .run(userId);

    this.db
      .prepare(
        `DELETE FROM memory_observations WHERE entity_id IN
         (SELECT id FROM memory_entities WHERE user_id = ?)`
      )
      .run(userId);

    this.db
      .prepare(`DELETE FROM memory_entities WHERE user_id = ?`)
      .run(userId);
  }
}

// Singleton instance
let memoryNativeInstance: MemoryNativeService | null = null;

export async function getMemoryNativeService(): Promise<MemoryNativeService> {
  if (!memoryNativeInstance) {
    memoryNativeInstance = new MemoryNativeService();
    await memoryNativeInstance.initialize();
  }
  return memoryNativeInstance;
}

// ============================================================================
// Mem0-Compatible Interface (for Option B compatibility)
// ============================================================================

/**
 * Add a memory - compatible with mem0 interface
 * Creates an entity named "user_preferences" and adds the content as an observation
 */
export async function addMemory(
  userId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<{ id: string; memory: string }[]> {
  const service = await getMemoryNativeService();

  // Get or create a "user_preferences" entity for this user
  let entity = await service.getEntity(userId, "user_preferences");
  if (!entity) {
    entity = await service.createEntity(userId, "user_preferences", "person");
  }

  // Add the memory as an observation
  const importance = (metadata?.category === "critical" ? "critical" : "normal") as Importance;
  const observation = await service.addObservation(entity.id, content, importance);

  console.log(`[Memory Native] Added memory for user ${userId}: ${content.substring(0, 50)}...`);

  return [{ id: observation.id, memory: observation.observation }];
}

/**
 * Search memories - compatible with mem0 interface
 */
export async function searchMemory(
  userId: string,
  query: string,
  limit: number = 5
): Promise<{ id: string; memory: string; score?: number }[]> {
  const service = await getMemoryNativeService();

  const results = await service.searchMemory(userId, query, limit);

  console.log(`[Memory Native] Found ${results.length} memories for user ${userId}`);

  return results.map((r) => ({
    id: r.observation.id,
    memory: r.observation.observation,
    score: r.score,
  }));
}

/**
 * Get all memories for a user - compatible with mem0 interface
 */
export async function getAllMemories(
  userId: string
): Promise<{ id: string; memory: string; createdAt?: string }[]> {
  const service = await getMemoryNativeService();

  // Get user_preferences entity with observations
  const entity = await service.getEntity(userId, "user_preferences");
  if (!entity || !entity.observations) {
    return [];
  }

  const memories = entity.observations.map((obs) => ({
    id: obs.id,
    memory: obs.observation,
    createdAt: new Date(obs.createdAt).toISOString(),
  }));

  console.log(`[Memory Native] Retrieved ${memories.length} memories for user ${userId}`);

  return memories;
}

/**
 * Delete a specific memory - compatible with mem0 interface
 */
export async function deleteMemory(userId: string, memoryId: string): Promise<boolean> {
  const service = await getMemoryNativeService();

  const result = await service.deleteObservation(memoryId);

  console.log(`[Memory Native] Deleted memory ${memoryId} for user ${userId}: ${result}`);

  return result;
}

/**
 * Delete all memories for a user - compatible with mem0 interface
 */
export async function deleteAllMemories(userId: string): Promise<boolean> {
  const service = await getMemoryNativeService();

  try {
    await service.clearUserMemory(userId);
    console.log(`[Memory Native] Cleared all memories for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Memory Native] Failed to clear memories:`, error);
    return false;
  }
}
