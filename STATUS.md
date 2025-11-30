# Pip - Project Status

> **Purpose**: Current state snapshot (2-week rolling window)
> **Lifecycle**: Living (update daily/weekly during active development)

**Last Updated**: 2025-11-30 (Night)
**Current Phase**: MVP Complete - Ready for Beta Users
**Version**: 0.3.3

---

## Quick Overview

| Aspect | Status | Notes |
|--------|--------|-------|
| **MCP Server** | 🟢 | Live at mcp.pip.arcforge.au |
| **Claude.ai** | 🟢 | Fully validated (Xero + Memory tools) |
| **ChatGPT** | 🟢 | Fully validated (Xero + Memory tools) |
| **Memory Stack** | 🟢 | Option B (native, text-based search) |
| **Safety Guardrails** | 🟢 | Complete (tiered permissions) |
| **PWA Frontend** | 🟢 | Live at app.pip.arcforge.au |
| **Landing Page** | 🟢 | Live at pip.arcforge.au |
| **Xero Integration** | 🟢 | 10 READ-ONLY tools verified |

**Legend**: 🟢 Good | 🟡 Attention | 🔴 Critical | 🔵 In Progress

---

## Current Focus

**Objective**: Onboard beta users and gather feedback.

### Just Completed (2025-11-30 Late Evening)

1. **Memory System Fixed (issue_010)** ✅
   - Option A (mem0) crashed with `SQLITE_CANTOPEN` - mem0ai bug in Docker/Alpine
   - Option B (native) crashed with `ld-linux-x86-64.so.2` - onnxruntime needs glibc
   - **Solution**: Removed @xenova/transformers, use text-based search
   - Memory tools now working with better-sqlite3
   - Trade-off: Text search vs semantic search (acceptable for MVP)

2. **Technical Fixes** ✅
   - memory-native.ts creates its own tables on init
   - Embedding code commented out (Alpine/musl incompatible)
   - Fixed getAllMemories bug (was calling wrong method)
   - Server starts cleanly without crashes

3. **Previous Session** ✅
   - Claude.ai OAuth and Xero tools fully working
   - Login page UI fixed (centered, no emoji)
   - Landing page live

### Test Results

- [x] Memory tools via Claude.ai (`add_memory`, `search_memory`) - **WORKING**
  - `add_memory`: Stored "I like invoices on Monday" (category: preference)
  - `search_memory`: Found with 80% relevance for query "invoices Monday"
- [x] Memory tools via ChatGPT - **WORKING**
  - Requires meta-tool pattern: `get_tools_in_category` → `execute_tool`
  - `add_memory`: Stored "I like financial reports on the weekend"
  - `search_memory`: Found with 80% relevance

---

## Deployment Status

| Service | URL | Health |
|---------|-----|--------|
| Landing Page | https://pip.arcforge.au | 🟢 |
| PWA | https://app.pip.arcforge.au | 🟢 |
| MCP Server | https://mcp.pip.arcforge.au | 🟢 |

**VPS**: DigitalOcean Sydney (170.64.169.203)
**Containers**: pip-app, pip-mcp (memory-enabled)
**Ollama**: Running as systemd service with nomic-embed-text

---

## Test Results (2025-11-30)

### All Tests Passed ✅

| Platform | Memory Add | Memory Search | Xero Tools |
|----------|------------|---------------|------------|
| **Claude.ai** | ✅ Working | ✅ 80% relevance | ✅ All 10 tools |
| **ChatGPT** | ✅ Working | ✅ 80% relevance | ✅ All 10 tools |

**Notes**:
- Claude.ai: Direct tool calls (native MCP support)
- ChatGPT: Requires meta-tool pattern (`get_tools_in_category` → `execute_tool`)
- Memory uses text-based search (semantic search disabled for Alpine compatibility)

---

## Known Issues

| ID | Priority | Summary | Status |
|----|----------|---------|--------|
| issue_010 | - | Mem0 SQLite crash in Docker | ✅ Resolved (switched to native) |
| issue_008 | - | Memory architecture decision | ✅ Resolved (Option B deployed) |
| issue_005 | - | ChatGPT memory in Dev Mode | ✅ Resolved (native memory works) |
| issue_004 | - | Safety guardrails | ✅ Complete |

---

## Recent Achievements (Last 2 Weeks)

### 2025-11-30 (Evening Session)
- Landing page deployed at pip.arcforge.au
- OAuth debounce fix for double-submit prevention
- Login button UX: "Sign In" → "Signing In..." with disabled state
- MCP session persistence fix (60s keep-alive)
- user_settings table migration added
- **Claude.ai Xero tools verified working**

### 2025-11-30 (Morning)
- Branch cleanup: consolidated 3 feature branches into main
- Memory A/B architecture implemented (mem0 + native options)
- VPS Ollama installed and configured
- Fixed mem0ai TypeScript error (`url` vs `ollamaBaseUrl`)

### 2025-11-29
- Safety architecture implemented (tiered permissions)
- ChatGPT integration validated
- Xero tools audit complete (10 tools hardened)
- Full rebrand: zero-agent → pip

### 2025-11-28
- User authentication with invite codes
- Business context layer (document upload)
- Demo completed with dental practice owner

---

## Next Steps

1. **Onboard beta users** - Share with trusted users for feedback
2. **Monitor production** - Watch for errors, memory usage
3. **Iterate on UX** - Based on user feedback
4. **Consider Debian Docker** - If semantic search is needed later

---

## References

- `PROGRESS.md` - Detailed task tracking
- `ISSUES.md` - Bug and improvement tracking
- `ARCHITECTURE.md` - System design and ADRs
- `CHANGELOG.md` - Release history
- `specs/BLUEPRINT-feature-memory-ab-testing-20251130.yaml` - A/B test spec

---

**Archive Policy**: Items older than 2 weeks move to CHANGELOG.md [Unreleased] section.
