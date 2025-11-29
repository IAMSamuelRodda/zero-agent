# Lazy-MCP - Context Window Optimization

**Date**: 2025-11-29
**Verdict**: Critical for scaling MCP tool libraries

---

## The Problem

At session startup, Claude Code loads ALL configured MCP servers and tools:

- **~400-500 tokens per tool definition**
- **50 tools = 20,000-25,000 tokens** consumed before conversation begins
- **54% context consumption at startup** in some configurations
- Makes advanced use cases impossible

---

## The Solution: Lazy Loading

### voicetreelab/lazy-mcp

Lazy MCP exposes **two meta-tools** for on-demand exploration:

1. **get_tools_in_category** - Browse available tool categories
2. **execute_tool** - Call a specific tool when needed

```
Without Lazy-MCP:
┌─────────────────────────────────────────┐
│ Startup: Load ALL 50 tool definitions   │  ← 25,000 tokens
│ Conversation: Limited remaining context │
└─────────────────────────────────────────┘

With Lazy-MCP:
┌─────────────────────────────────────────┐
│ Startup: Load 2 meta-tools only         │  ← ~1,000 tokens
│ Runtime: Fetch tool schemas on-demand   │
│ Conversation: Full context available    │
└─────────────────────────────────────────┘
```

### Results

| Metric | Improvement |
|--------|-------------|
| Initial Token Reduction | **95%** (108k → ~5k) |
| Available Conversation Tokens | **195k** vs 92k |
| Startup Time | Significantly faster |

---

## Hierarchical Tool Management

### Proposed MCP Protocol Extension

```json
{
  "capabilities": {
    "hierarchical": true,
    "lazyLoading": true,
    "dynamicRegistration": true
  }
}
```

This enables:
- **Category-based organization** - Group related tools
- **On-demand schema loading** - Only fetch when needed
- **Dynamic registration** - Add/remove tools at runtime

---

## Architecture for Large MCP Libraries

```
┌─────────────────────────────────────────────────────────────┐
│                      Lazy-MCP Proxy                          │
├─────────────────────────────────────────────────────────────┤
│  Category: joplin (11 tools)                                │
│  Category: todoist (12 tools)                               │
│  Category: calendar (7 tools)                               │
│  Category: filesystem (15 tools)                            │
│  Category: github (20 tools)                                │
│  ... (100+ tools organized in categories)                   │
├─────────────────────────────────────────────────────────────┤
│  Exposed to LLM:                                            │
│  - get_tools_in_category(path)                              │
│  - execute_tool(tool_path, arguments)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Why This Matters for Our Architecture

### Massive MCP Library Strategy

Instead of RAG for code search, use a **comprehensive MCP tool library**:

| MCP Server | Purpose |
|------------|---------|
| filesystem | File operations |
| git | Version control |
| github | Issues, PRs, projects |
| joplin | Note-taking |
| todoist | Task management |
| xero | Accounting |
| browser | Web automation |
| database | SQL operations |
| ... | Extensible |

### Benefits Over RAG

1. **Live Data** - Always current, no stale embeddings
2. **Exact Operations** - Not approximations
3. **Actions + Retrieval** - Can read AND write
4. **Standard Protocol** - Interoperable across LLMs

---

## Recommendation

1. **Use lazy-mcp** for any deployment with >10 MCP tools
2. **Organize tools hierarchically** by domain
3. **Prefer MCP tools over RAG** for dynamic data
4. **Keep RAG only for** static document collections

---

## Sources

- [Lazy-MCP GitHub](https://github.com/voicetreelab/lazy-mcp)
- [Claude Code Issue #7336 - Lazy Loading Request](https://github.com/anthropics/claude-code/issues/7336)
- [MCP Hierarchical Tool Management Discussion](https://github.com/orgs/modelcontextprotocol/discussions/532)
- [OpenMCP Lazy Loading Blog](https://www.open-mcp.org/blog/lazy-loading-input-schemas)
