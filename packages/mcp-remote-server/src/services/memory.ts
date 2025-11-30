/**
 * Memory Service - Mem0 Integration
 *
 * Provides persistent memory layer for Pip using the official mem0ai package.
 * Each user has isolated memories identified by their userId.
 *
 * Configuration:
 * - Vector store: in-memory (fits 384MB VPS constraint)
 * - History: SQLite (persistent across restarts)
 * - LLM: OpenAI (for memory extraction/summarization)
 */

import { Memory as Mem0Memory } from "mem0ai/oss";
import path from "path";

// Memory instance (singleton)
let memoryInstance: Mem0Memory | null = null;

// Database path from environment (same location as main database)
const DATA_DIR = process.env.DATABASE_PATH
  ? path.dirname(process.env.DATABASE_PATH)
  : "/app/data";

/**
 * Get or create the Memory instance
 * Uses lazy initialization to avoid startup overhead
 */
export async function getMemory(): Promise<Mem0Memory> {
  if (memoryInstance) {
    return memoryInstance;
  }

  // Check for OpenAI API key (required for embeddings)
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY environment variable is required for memory features. " +
        "Mem0 uses OpenAI for embeddings and memory extraction."
    );
  }

  const historyDbPath = path.join(DATA_DIR, "pip-memory.db");

  console.log(`[Memory] Initializing Mem0 with history at: ${historyDbPath}`);

  memoryInstance = new Mem0Memory({
    version: "v1.1",
    // In-memory vector store (no Qdrant needed, fits VPS constraints)
    vectorStore: {
      provider: "memory",
      config: {
        collectionName: "pip_memories",
        dimension: 1536, // text-embedding-3-small dimension
      },
    },
    // OpenAI for embeddings
    embedder: {
      provider: "openai",
      config: {
        apiKey: process.env.OPENAI_API_KEY,
        model: "text-embedding-3-small",
      },
    },
    // OpenAI for memory extraction/summarization
    llm: {
      provider: "openai",
      config: {
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4o-mini", // Cost-effective for memory extraction
      },
    },
    // SQLite for history (persistent)
    historyDbPath,
  });

  console.log("[Memory] Mem0 initialized successfully");
  return memoryInstance;
}

/**
 * Add a memory for a user
 * Mem0 automatically extracts and summarizes key information
 */
export async function addMemory(
  userId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<{ id: string; memory: string }[]> {
  const memory = await getMemory();

  // Format as conversation message for better extraction
  const messages = [
    {
      role: "user" as const,
      content: content,
    },
  ];

  const result = await memory.add(messages, {
    userId,
    metadata: {
      source: "pip-mcp",
      ...metadata,
    },
  });

  const memories = result.results || [];
  console.log(`[Memory] Added ${memories.length} memories for user ${userId}`);
  return memories;
}

/**
 * Search for relevant memories
 * Returns memories semantically similar to the query
 */
export async function searchMemory(
  userId: string,
  query: string,
  limit: number = 5
): Promise<{ id: string; memory: string; score?: number }[]> {
  const memory = await getMemory();

  const result = await memory.search(query, {
    userId,
    limit,
  });

  const memories = result.results || [];
  console.log(
    `[Memory] Found ${memories.length} memories for user ${userId} matching: "${query.substring(0, 50)}..."`
  );
  return memories;
}

/**
 * Get all memories for a user
 */
export async function getAllMemories(
  userId: string
): Promise<{ id: string; memory: string; createdAt?: string }[]> {
  const memory = await getMemory();

  const result = await memory.getAll({
    userId,
  });

  const memories = result.results || [];
  console.log(`[Memory] Retrieved ${memories.length} total memories for user ${userId}`);
  return memories;
}

/**
 * Delete a specific memory
 */
export async function deleteMemory(userId: string, memoryId: string): Promise<boolean> {
  const memory = await getMemory();

  try {
    await memory.delete(memoryId);
    console.log(`[Memory] Deleted memory ${memoryId} for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Memory] Failed to delete memory ${memoryId}:`, error);
    return false;
  }
}

/**
 * Delete all memories for a user
 */
export async function deleteAllMemories(userId: string): Promise<boolean> {
  const memory = await getMemory();

  try {
    await memory.deleteAll({
      userId,
    });
    console.log(`[Memory] Deleted all memories for user ${userId}`);
    return true;
  } catch (error) {
    console.error(`[Memory] Failed to delete all memories for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get memory history (changes over time)
 */
export async function getMemoryHistory(
  memoryId: string
): Promise<{ id: string; memory: string; event: string; timestamp: string }[]> {
  const memory = await getMemory();

  try {
    const history = await memory.history(memoryId);
    return history;
  } catch (error) {
    console.error(`[Memory] Failed to get history for memory ${memoryId}:`, error);
    return [];
  }
}

/**
 * Get relevant memories for context injection
 * This is called before tool execution to enrich the context
 */
export async function getContextMemories(
  userId: string,
  context: string
): Promise<string | null> {
  try {
    const memories = await searchMemory(userId, context, 3);

    if (memories.length === 0) {
      return null;
    }

    const memoryText = memories
      .map((m, i) => `${i + 1}. ${m.memory}`)
      .join("\n");

    return `**Relevant memories about this user:**\n${memoryText}`;
  } catch (error) {
    // Memory service unavailable - don't block main functionality
    console.error("[Memory] Failed to get context memories:", error);
    return null;
  }
}
