# Mem0 - Universal Memory Layer for AI Agents

**Date**: 2025-11-29
**Verdict**: STRONG candidate for Claude Agent SDK integration

---

## What is Mem0?

Mem0 ("mem-zero") provides an **intelligent memory layer** for AI agents:
- Remembers user preferences across sessions
- Adapts to individual needs over time
- Extracts, consolidates, and retrieves salient information
- Graph-based memory for complex relationships (Mem0g)

### Funding & Traction (Oct 2025)

- **$24M Series A** (Kindred Ventures, Basis Set, Peak XV, GitHub Fund, Y Combinator)
- **41,000 GitHub stars**
- **14 million downloads**
- **186 million API calls/quarter** (5x growth from Q1)

---

## Architecture: Mem0g (Graph Memory)

```
Conversation → Entity Extraction (LLM) → Relation Triplets
                                        ↓
                        Conflict Detection → Knowledge Graph Update
                                        ↓
                        Relevance Retrieval → Context Injection
```

### Memory Tiers

| Tier | Purpose | TTL |
|------|---------|-----|
| Session | Current conversation | Ephemeral |
| Short-Term | Recent interactions | 7 days |
| Long-Term | User preferences, patterns | Permanent |
| Semantic | Shared knowledge base | Permanent |

---

## Performance Claims

| Metric | Mem0 vs Baseline |
|--------|------------------|
| Accuracy | **+26%** over OpenAI Memory (LOCOMO benchmark) |
| Response Speed | **91% faster** than full-context |
| Token Usage | **90% lower** than full-context |

---

## Claude Integration Options

### Option 1: OpenMemory MCP (Local)

Mem0 provides **OpenMemory MCP** for Claude Desktop:
- Runs locally on your machine
- Private and secure
- Works across any MCP-compatible client
- Zero cloud dependency

### Option 2: Mem0 API (Cloud)

- Managed infrastructure
- 3 lines of code integration
- Scales automatically

### Option 3: Direct SDK Integration

```python
from mem0 import Memory
from anthropic import Anthropic

memory = Memory()
client = Anthropic()

# Store memory
memory.add("User prefers concise responses", user_id="user123")

# Retrieve relevant memories
relevant = memory.search("communication style", user_id="user123")
```

---

## Why Mem0 + Claude Agent SDK?

| Problem | Mem0 Solution |
|---------|---------------|
| Context window limits | Intelligent retrieval, not full dump |
| Cross-session continuity | Persistent memory layer |
| Personalization | User-specific preference tracking |
| Cost optimization | 90% token reduction |
| Relationship memory | Graph-based entity relations |

---

## Recommendation for Our Projects

### Star Atlas Agent
**STRONG FIT** - Mem0g for:
- Fleet preferences, trust progression
- Game knowledge base
- Relationship memory

### Pip (Pip)
**GOOD FIT** - Mem0 for:
- Business document context
- User communication preferences
- Cross-session financial discussions

### CodeForge
**MAYBE** - Consider for:
- User coding preferences
- Project-specific patterns
- But tools-first may be sufficient

---

## Sources

- [Mem0 GitHub](https://github.com/mem0ai/mem0)
- [Mem0 Research Paper](https://arxiv.org/abs/2504.19413)
- [OpenMemory MCP](https://mem0.ai/blog/introducing-openmemory-mcp)
- [Claude + Mem0 Tutorial (MarkTechPost)](https://www.marktechpost.com/2025/05/10/a-coding-guide-to-unlock-mem0-memory-for-anthropic-claude-bot-enabling-context-rich-conversations/)
