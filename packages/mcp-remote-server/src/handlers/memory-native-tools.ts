/**
 * Memory Native Tool Handlers (Option B)
 *
 * MCP tool handlers for the MCP-native memory system where:
 * - Client LLM (Claude.ai/ChatGPT) extracts facts from conversation
 * - Server stores structured entities, observations, and relations
 * - All processing is local ($0 API cost)
 */

import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
  getMemoryNativeService,
  type EntityType,
  type Importance,
} from "../services/memory-native.js";

// ============================================================================
// Tool Definitions (for lazy-loading registry)
// ============================================================================

export const memoryNativeToolDefinitions = [
  {
    category: "memory",
    name: "store_entity",
    description: `Store an entity (person, business, concept, event) that the user mentions.
Use this when the user talks about: their business, employees, clients, suppliers, goals, or important events.
If the entity already exists, new observations will be added to it.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name of the entity (e.g., 'Acme Corp', 'John Smith', 'Q2 Hiring Goal')",
        },
        entity_type: {
          type: "string",
          enum: ["person", "business", "concept", "event", "other"],
          description: "Type of entity: person (employee/client), business (company), concept (goal/plan), event (meeting/deadline)",
        },
        observations: {
          type: "array",
          items: { type: "string" },
          description: "Facts about this entity (e.g., ['Works as accountant', 'Started March 2024'])",
        },
      },
      required: ["name", "entity_type"],
    },
  },
  {
    category: "memory",
    name: "store_observation",
    description: `Add a fact/observation about an existing entity.
Use this when the user shares new information about something Pip already knows.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        entity_name: {
          type: "string",
          description: "Name of the entity to add observation to",
        },
        observation: {
          type: "string",
          description: "The fact to store (be specific: 'Revenue target: $500k by Dec 2025' not 'has revenue goals')",
        },
        importance: {
          type: "string",
          enum: ["critical", "important", "normal", "temporary"],
          description: "How important is this fact? critical = always recall, temporary = short-term",
        },
      },
      required: ["entity_name", "observation"],
    },
  },
  {
    category: "memory",
    name: "store_relation",
    description: `Store a relationship between two entities.
Use this when the user describes connections: ownership, employment, partnerships, locations.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        from_entity: {
          type: "string",
          description: "Source entity name (e.g., 'John Smith')",
        },
        to_entity: {
          type: "string",
          description: "Target entity name (e.g., 'Acme Corp')",
        },
        relation_type: {
          type: "string",
          description: "Type of relationship (e.g., 'works_for', 'owns', 'located_in', 'supplies_to')",
        },
      },
      required: ["from_entity", "to_entity", "relation_type"],
    },
  },
  {
    category: "memory",
    name: "search_memory",
    description: `Search Pip's memory for relevant information.
ALWAYS call this before answering questions about the user's business, team, or goals.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "What to search for (e.g., 'hiring plans', 'client payment terms', 'business goals')",
        },
        limit: {
          type: "number",
          description: "Maximum results to return (default: 5)",
        },
      },
      required: ["query"],
    },
  },
  {
    category: "memory",
    name: "get_entity",
    description: `Get all information about a specific entity.
Use this when you need complete context about a person, business, or concept.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name of the entity to retrieve",
        },
        include_relations: {
          type: "boolean",
          description: "Include relationships with other entities (default: true)",
        },
      },
      required: ["name"],
    },
  },
  {
    category: "memory",
    name: "list_entities",
    description: `List all entities Pip knows about for this user.
Use this to give an overview of what Pip remembers.`,
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
  {
    category: "memory",
    name: "delete_entity",
    description: `Delete an entity and all its observations.
Use with caution - this removes all information about the entity.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        name: {
          type: "string",
          description: "Name of the entity to delete",
        },
      },
      required: ["name"],
    },
  },
  {
    category: "memory",
    name: "clear_all_memories",
    description: `Delete ALL memories for this user. Cannot be undone.`,
    inputSchema: {
      type: "object" as const,
      properties: {
        confirm: {
          type: "boolean",
          description: "Must be true to confirm deletion",
        },
      },
      required: ["confirm"],
    },
  },
  {
    category: "memory",
    name: "memory_stats",
    description: `Get statistics about Pip's memory for this user.`,
    inputSchema: {
      type: "object" as const,
      properties: {},
    },
  },
];

// ============================================================================
// Tool Execution Handlers
// ============================================================================

export async function executeMemoryNativeTool(
  userId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  try {
    const memory = await getMemoryNativeService();

    switch (toolName) {
      case "store_entity": {
        const { name, entity_type, observations } = args as {
          name: string;
          entity_type: EntityType;
          observations?: string[];
        };

        const entity = await memory.createEntity(
          userId,
          name,
          entity_type,
          observations
        );

        const obsText =
          entity.observations.length > 0
            ? `\nObservations:\n${entity.observations.map((o) => `- ${o.observation}`).join("\n")}`
            : "";

        return {
          content: [
            {
              type: "text",
              text: `Stored entity: **${entity.name}** (${entity.entityType})${obsText}`,
            },
          ],
        };
      }

      case "store_observation": {
        const { entity_name, observation, importance } = args as {
          entity_name: string;
          observation: string;
          importance?: Importance;
        };

        // First, find the entity
        const entity = await memory.getEntity(userId, entity_name, false);
        if (!entity) {
          return {
            content: [
              {
                type: "text",
                text: `Entity "${entity_name}" not found. Use store_entity first to create it.`,
              },
            ],
            isError: true,
          };
        }

        const obs = await memory.addObservation(
          entity.id,
          observation,
          importance || "normal"
        );

        return {
          content: [
            {
              type: "text",
              text: `Added observation to **${entity_name}**: "${obs.observation}" (importance: ${obs.importance})`,
            },
          ],
        };
      }

      case "store_relation": {
        const { from_entity, to_entity, relation_type } = args as {
          from_entity: string;
          to_entity: string;
          relation_type: string;
        };

        const relation = await memory.createRelation(
          userId,
          from_entity,
          to_entity,
          relation_type
        );

        if (!relation) {
          return {
            content: [
              {
                type: "text",
                text: `Could not create relation. Make sure both entities exist: "${from_entity}" and "${to_entity}". Use store_entity to create them first.`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Stored relation: **${from_entity}** → *${relation_type}* → **${to_entity}**`,
            },
          ],
        };
      }

      case "search_memory": {
        const { query, limit } = args as { query: string; limit?: number };

        const results = await memory.searchMemory(userId, query, limit || 5);

        if (results.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No memories found matching "${query}".`,
              },
            ],
          };
        }

        // Group results by entity for cleaner output
        const byEntity = new Map<string, { entity: typeof results[0]["entity"]; observations: string[] }>();
        for (const r of results) {
          const key = r.entity.name;
          if (!byEntity.has(key)) {
            byEntity.set(key, { entity: r.entity, observations: [] });
          }
          byEntity.get(key)!.observations.push(
            `- ${r.observation.observation} (relevance: ${(r.score * 100).toFixed(0)}%)`
          );
        }

        const output = Array.from(byEntity.values())
          .map((e) => `**${e.entity.name}** (${e.entity.entityType}):\n${e.observations.join("\n")}`)
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `**Memories matching "${query}":**\n\n${output}`,
            },
          ],
        };
      }

      case "get_entity": {
        const { name, include_relations } = args as {
          name: string;
          include_relations?: boolean;
        };

        const entity = await memory.getEntity(
          userId,
          name,
          include_relations !== false
        );

        if (!entity) {
          return {
            content: [
              {
                type: "text",
                text: `Entity "${name}" not found.`,
              },
            ],
          };
        }

        let output = `**${entity.name}** (${entity.entityType})\n`;

        if (entity.observations.length > 0) {
          output += `\nObservations:\n`;
          output += entity.observations
            .map((o) => `- ${o.observation} [${o.importance}]`)
            .join("\n");
        } else {
          output += `\n(No observations stored)`;
        }

        if (entity.relations && entity.relations.length > 0) {
          output += `\n\nRelations:\n`;
          output += entity.relations
            .map((r) =>
              r.direction === "from"
                ? `- → *${r.type}* → ${r.entity.name}`
                : `- ← *${r.type}* ← ${r.entity.name}`
            )
            .join("\n");
        }

        return {
          content: [
            {
              type: "text",
              text: output,
            },
          ],
        };
      }

      case "list_entities": {
        const entities = await memory.listEntities(userId);

        if (entities.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "I don't have any entities stored for you yet. Share something about your business, team, or goals!",
              },
            ],
          };
        }

        const byType = new Map<EntityType, string[]>();
        for (const e of entities) {
          if (!byType.has(e.entityType)) {
            byType.set(e.entityType, []);
          }
          byType.get(e.entityType)!.push(e.name);
        }

        const output = Array.from(byType.entries())
          .map(([type, names]) => `**${type}**: ${names.join(", ")}`)
          .join("\n");

        return {
          content: [
            {
              type: "text",
              text: `**All entities (${entities.length}):**\n${output}`,
            },
          ],
        };
      }

      case "delete_entity": {
        const { name } = args as { name: string };

        const success = await memory.deleteEntity(userId, name);

        return {
          content: [
            {
              type: "text",
              text: success
                ? `Deleted entity: "${name}" and all its observations.`
                : `Entity "${name}" not found.`,
            },
          ],
        };
      }

      case "clear_all_memories": {
        const { confirm } = args as { confirm: boolean };

        if (!confirm) {
          return {
            content: [
              {
                type: "text",
                text: "Please confirm by setting confirm=true to delete all memories.",
              },
            ],
          };
        }

        await memory.clearUserMemory(userId);

        return {
          content: [
            {
              type: "text",
              text: "All memories have been cleared. Starting fresh!",
            },
          ],
        };
      }

      case "memory_stats": {
        const stats = await memory.getMemoryStats(userId);

        return {
          content: [
            {
              type: "text",
              text: `**Memory Statistics:**
- Entities: ${stats.entityCount}
- Observations: ${stats.observationCount}
- Relations: ${stats.relationCount}`,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown memory tool: ${toolName}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    console.error(`Memory native tool error (${toolName}):`, error);
    return {
      content: [
        {
          type: "text",
          text: `Error executing ${toolName}: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ],
      isError: true,
    };
  }
}
