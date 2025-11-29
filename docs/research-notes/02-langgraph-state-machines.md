# LangGraph - When State Machines Still Win

**Date**: 2025-11-29
**Verdict**: Still valuable for complex orchestration, but not always needed

---

## What LangGraph Does Well

LangGraph models agent workflows as **explicit state-machine graphs**:
- Each node = LLM call, tool call, or conditional branch
- Each edge = deterministic or agent-chosen transition
- Automatic checkpointing at every step

### Key Strengths

| Feature | Benefit |
|---------|--------|
| **Full Visibility** | No hidden prompts, transparent behavior |
| **Time-Travel Debugging** | Replay any state, inspect decisions |
| **Human-in-the-Loop** | Built-in patterns for approval gates |
| **Vendor Freedom** | Swap GPT-4o → Claude → Gemini without rewrites |
| **Production Proven** | Uber (21k engineer-hours saved), LinkedIn AI Hiring |

---

## LangGraph vs Claude Agent SDK

| Aspect | LangGraph | Claude Agent SDK |
|--------|-----------|------------------|
| **Philosophy** | You define the graph | SDK handles orchestration |
| **Abstraction** | Lower-level runtime | Higher-level harness |
| **Model Support** | 35+ models via adapters | Anthropic Claude only |
| **Use Case** | Complex, branching workflows | Autonomous, long-running agents |
| **Learning Curve** | Steeper (LCEL, state machines) | Gentler (batteries included) |

### LangChain's Own Analysis:

> "Everything you can do with Agents SDK you can do with LangGraph. Agents SDK only lets you do 10% of what you can do with LangGraph."

---

## When to Use LangGraph

✅ **Use LangGraph when:**
- Multi-step workflows with complex branching logic
- Need time-travel debugging / state inspection
- Human approval gates required
- Multi-model orchestration (not just Claude)
- Existing LangChain investment to leverage

❌ **Skip LangGraph when:**
- Simple agent with straightforward tool use
- Claude-only deployment
- Speed-to-production matters more than control
- Team unfamiliar with state machine concepts

---

## Integration with Claude Agent SDK

LangGraph and Claude Agent SDK can work together:
- Use Claude Agent SDK as the execution harness
- Use LangGraph for workflow orchestration layer
- Mem0 for cross-session memory

---

## Sources

- [LangGraph 2025 Review (NeurlCreators)](https://neurlcreators.substack.com/p/langgraph-2025-review)
- [Agent Frameworks Comparison (LangChain Blog)](https://blog.langchain.com/how-to-think-about-agent-frameworks/)
- [Building AI Engineer with LangGraph + Claude (Neurons Lab)](https://neurons-lab.com/article/building-your-own-ai-engineer/)
