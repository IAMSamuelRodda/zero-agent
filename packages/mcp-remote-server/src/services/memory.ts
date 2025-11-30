/**
 * Memory Service Router
 *
 * Routes to the appropriate memory implementation based on MEMORY_VARIANT env var:
 * - "mem0" (default): Uses mem0 + Claude LLM + Ollama embeddings (Option A)
 * - "native": Uses MCP-native entity storage + local embeddings (Option B)
 *
 * Note: Option A and B have different interfaces:
 * - Option A: add_memory, search_memory, list_memories, delete_memory, clear_all
 * - Option B: store_entity, store_observation, store_relation, search_memory, get_entity, delete_entity
 *
 * The tool registration in index.ts handles the interface differences.
 * This router provides the underlying service functions.
 */

// For now, always export mem0 implementation
// When Option B is deployed, index.ts will conditionally load the appropriate tools
export * from "./memory-mem0.js";

// Environment variable for A/B selection (used by index.ts for tool registration)
export const MEMORY_VARIANT = process.env.MEMORY_VARIANT || "mem0";
