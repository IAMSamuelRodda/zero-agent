# Pip - Project Status

> **Purpose**: Current state snapshot (2-week rolling window)
> **Lifecycle**: Living (update daily/weekly during active development)

**Last Updated**: 2025-11-30
**Current Phase**: Memory A/B Testing Setup
**Version**: 0.2.0

---

## Quick Overview

| Aspect | Status | Notes |
|--------|--------|-------|
| **MCP Server** | 🟢 | Live at mcp.pip.arcforge.au |
| **Claude.ai** | 🟢 | Fully validated |
| **ChatGPT** | 🟡 | Working, memory disabled for Plus |
| **Memory Option A** | 🔵 | mem0 + Claude LLM (on feature/memory-mem0-ollama) |
| **Memory Option B** | 🔵 | MCP-native (on feature/memory-mcp-native) |
| **Safety Guardrails** | 🟢 | Complete (all tasks done) |
| **PWA Frontend** | 🟢 | Live at app.pip.arcforge.au |
| **Xero Integration** | 🟢 | 10 READ-ONLY tools |

**Legend**: 🟢 Good | 🟡 Attention | 🔴 Critical | 🔵 In Progress

---

## Current Focus

**Objective**: A/B test two memory approaches, then deploy winner.

### A/B Testing Architecture (In Progress)

Both options implemented on separate branches for parallel testing:

| Option | Branch | Approach | API Cost | ChatGPT |
|--------|--------|----------|----------|---------|
| **A** | `feature/memory-mem0-ollama` | Server-side LLM extraction | ~$0.001/req | ❌ Blocked |
| **B** | `feature/memory-mcp-native` | Client LLM extraction | $0 | ✅ Works |

**Deployment Plan** (requires merge coordination):
- `mcp-a.pip.arcforge.au` → Option A
- `mcp-b.pip.arcforge.au` → Option B
- `mcp.pip.arcforge.au` → Winner after testing

### Branch Status

**feature/memory-mcp-native (Option B)** - ✅ Implementation Complete
- `memory-native.ts` service created
- Local embeddings via @xenova/transformers (all-MiniLM-L6-v2)
- Entity/observation/relation storage schema added
- 9 MCP tools: store_entity, store_observation, store_relation, search_memory, get_entity, list_entities, delete_entity, clear_all_memories, memory_stats
- System prompt updated for client-side fact extraction
- A/B variant fields added to users & invite_codes tables
- **Builds successfully** ✅

**feature/memory-mem0-ollama (Option A)** - Being developed on do-vps-prod
- mem0ai npm package integration
- Claude LLM for extraction + Ollama for embeddings

### IMPORTANT: Merge Coordination Required

⚠️ Both branches modify shared files. Merge must be coordinated:
- `packages/core/src/database/types.ts` (MemoryVariant type)
- `packages/core/src/database/providers/sqlite.ts` (schema changes)
- `packages/mcp-remote-server/src/index.ts` (tool registry)

See `specs/BLUEPRINT-feature-memory-ab-testing-20251130.yaml` for full A/B testing plan.

### Safety Guardrails - ✅ COMPLETE
- Tiered permission model implemented
- Database tables: `user_settings`, `operation_snapshots`
- Permission checks enforced at tool execution
- Dynamic tool visibility based on permission level

### Next Steps (Post-Merge)

1. Merge Option B into a deployable state
2. Create `docker-compose.ab-testing.yml` for dual deployment
3. Configure Caddy for A/B subdomains
4. Deploy both variants for blind testing

---

## Deployment Status

| Service | URL | Health |
|---------|-----|--------|
| PWA | https://app.pip.arcforge.au | 🟢 |
| MCP Server | https://mcp.pip.arcforge.au | 🟢 |
| Landing Page | https://pip.arcforge.au | ⚪ Pending |

**VPS**: DigitalOcean Sydney (170.64.169.203)
**Containers**: pip-app (384MB), pip-mcp (256MB)

---

## Known Issues

See **ISSUES.md** for full details.

| ID | Priority | Summary |
|----|----------|---------|
| issue_008 | P1 | Memory A/B testing in progress |
| issue_005 | P1 | ChatGPT memory disabled in Dev Mode |
| issue_000 | P1 | Business context layer completion |

**Counts**: 0 Critical | 1 High (blocking) | 3 Medium | 3 Low

---

## Recent Achievements (Last 2 Weeks)

### 2025-11-30
- Option B (MCP-native) implementation complete on feature/memory-mcp-native
- Local embeddings via @xenova/transformers integrated
- Entity/observation/relation memory model implemented
- 9 memory MCP tools created
- A/B testing infrastructure designed

### 2025-11-29
- Safety architecture designed (`specs/SAFETY-ARCHITECTURE.md`)
- ChatGPT integration validated (zero code changes needed)
- Xero tools audit complete (10 tools hardened)
- Full rebrand: zero-agent → pip
- OAuth security hardening + sign-up flow

### 2025-11-28
- User authentication with invite codes
- Business context layer (document upload)
- Demo completed with dental practice owner

---

## Next Steps

1. **Coordinate A/B merge** - merge both memory branches
2. **Deploy A/B testing** - dual containers with separate subdomains
3. **Run blind tests** - multiple users on each variant
4. **Create landing page** (pip.arcforge.au)

---

## References

- `PROGRESS.md` - Detailed task tracking (milestones, epics, features)
- `ISSUES.md` - Bug and improvement tracking
- `ARCHITECTURE.md` - System design and ADRs
- `CHANGELOG.md` - Release history
- `specs/BLUEPRINT-feature-memory-ab-testing-20251130.yaml` - A/B testing plan

---

**Archive Policy**: Items older than 2 weeks move to CHANGELOG.md [Unreleased] section.
