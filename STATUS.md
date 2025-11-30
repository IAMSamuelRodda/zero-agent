# Pip - Project Status

> **Purpose**: Current work, active bugs, and recent changes (2-week rolling window)
> **Lifecycle**: Living (update daily/weekly during active development)

**Last Updated**: 2025-11-30
**Current Phase**: Memory Stack + Safety Hardening
**Version**: 0.2.0
**Infrastructure**: DigitalOcean VPS (shared with do-vps-prod services)

---

## Current Focus

### Phase: Mem0 Memory Stack + Safety Guardrails

**Objective**: Integrate Mem0 as universal memory layer, then harden for write operations.

**Architecture Decision** (2025-11-30):
Based on consolidated Joplin research, Pip adopts:
- **Mem0** for memory (NOT traditional RAG)
- **Lazy-MCP** for tools (already implemented)
- **Skip LangChain** (obsolete for agentic systems)
- **Defer LangGraph** (only if complex approval flows needed)

**Priority Order**:
1. ~~**spike_mem0**~~ ✅ COMPLETE - Use official `mem0ai` npm package
2. **Mem0 Memory Stack** - Implement using `mem0ai` (Epic 1.4)
3. **Safety Guardrails** - Tiered permissions before write ops (Epic 1.3)
4. **Landing Page** - Create pip.arcforge.au (Epic 1.5)

**Why this order**:
- Memory enables "Pip knows me" for dental client demo
- Safety before writes: Xero has NO user restore

### Current Priorities

#### spike_mem0: Integration Feasibility - ✅ COMPLETE
**Decision**: Use official `mem0ai` npm package with in-memory vector store + SQLite history

**Key Discovery**: Mem0 released official Node.js SDK with full TypeScript support!
- `npm install mem0ai`
- Full API parity with Python SDK
- Supports: OpenAI, Anthropic, Ollama, and 10+ other LLM providers
- Vector stores: in-memory (default), Qdrant, Chroma, Pinecone, pgvector, 20+ others
- History: SQLite (default), Supabase
- Resource impact: ~100-200MB RAM, fits 384MB VPS

**Decision Document**: `docs/research-notes/SPIKE-mem0-integration.md`

**Options Evaluated**:
| Option | Description | Verdict |
|--------|-------------|---------|
| A | OpenMemory MCP (Python) | Not feasible - Qdrant needs 1.2GB RAM |
| B | Mem0 Cloud API | Alternative for scale ($19-249/mo) |
| C | Self-hosted Mem0 (Python) | Not feasible - exceeds VPS RAM |
| D | Python subprocess | Not feasible - same RAM issues |
| E | Refactor Pip to Python | Overkill - SDK exists |
| F | Port Mem0 to TypeScript | Unnecessary - SDK exists |
| G | Community TS (mem0-ts) | Not recommended - OpenAI only, unmaintained |
| **H** | **Official mem0ai npm** | **RECOMMENDED** |

#### Mem0 Memory Stack Implementation (Priority 1 - IN PROGRESS)
| Task | Status | Notes |
|------|--------|-------|
| Install mem0ai package | ✅ Done | v2.1.38 |
| Configure Memory instance | ✅ Done | In-memory vector + SQLite history |
| Add memory operations to MCP | ✅ Done | 5 tools in memory category |
| Update system prompt | ✅ Done | Memory guidelines for Pip |
| ChatGPT memory import | ⚪ Pending | Parse conversations.json |
| Memory management UI | ⚪ Pending | PWA interface |

**Memory Tools Available**:
- `add_memory`: Store preferences, goals, context
- `search_memory`: Semantic search across memories
- `list_memories`: View all memories
- `delete_memory`: Remove by ID
- `clear_all_memories`: Reset all (with confirmation)

**Requires**: `OPENAI_API_KEY` env var for embeddings
**Guide Ready**: docs/CHATGPT-MEMORY-GUIDE.md (export instructions)

#### Safety Guardrails (Priority 2)
| Task | Status | Notes |
|------|--------|-------|
| Design safety architecture | ✅ Done | specs/SAFETY-ARCHITECTURE.md |
| Add `user_settings` table | ⚪ Pending | permission_level column |
| Add `operation_snapshots` table | ⚪ Pending | Pre-operation state capture |
| Implement permission checks | ⚪ Pending | Tool router validation |
| Add settings UI to PWA | ⚪ Pending | Permission level selector |

**Why Safety Before Writes?**: Xero has NO user restore. Must protect users from AI mistakes before adding any write capabilities.

**ChatGPT Business Option** (NEEDS VERIFICATION):
- Research suggests published connectors retain memory
- Requires Business/Teams subscription + admin access
- Flow: Admin publishes connector → users get memory without Dev Mode
- **Status**: Unverified - need to test with actual Business account

### Completed Integrations

#### Claude.ai Integration - ✅ COMPLETE
| Task | Status | Notes |
|------|--------|-------|
| MCP server deployed | ✅ Done | https://mcp.pip.arcforge.au |
| SSE endpoint working | ✅ Done | /sse with lazy-loading |
| OAuth 2.0 flow | ✅ Done | Authorization Code flow with PKCE |
| Test with Claude.ai | ✅ Done | Full OAuth flow verified working |
| Xero tools via Claude | ✅ Done | All 10 tools audited and working |
| Document connection flow | ✅ Done | README.md - step-by-step guide |

#### ChatGPT Integration - ✅ COMPLETE (memory limitation for Plus)
| Task | Status | Notes |
|------|--------|-------|
| Research MCP support | ✅ Done | Developer Mode required for setup |
| Test with ChatGPT Plus | ✅ Done | Works with zero code changes! |
| Document ChatGPT setup | ✅ Done | README.md - step-by-step guide |
| Memory in Dev Mode | ⚠️ Disabled | Security: prevents MCP accessing user data |
| Memory with Published | ⚠️ Unverified | Business/Teams: needs testing |

**ChatGPT Memory Situation** (2025-11-30):
- Developer Mode disables memory (security feature, not bug)
- **Plus users**: Need Pip memory stack (Priority 1 above)
- **Business/Teams**: Published connectors MAY retain memory (UNVERIFIED - needs testing with actual account)

---

## Quick Overview

| Aspect | Status | Notes |
|--------|--------|-------|
| **MCP Server** | 🟢 | Deployed at mcp.pip.arcforge.au |
| **Claude.ai Integration** | 🟢 | Fully validated and working |
| **ChatGPT Integration** | 🟡 | Working, but memory disabled for Plus users |
| **spike_mem0** | ✅ | COMPLETE - Use `mem0ai` npm package |
| **Mem0 Memory Stack** | 🟡 | Core tools done, import/UI pending |
| **Safety Guardrails** | 🔵 | Architecture designed, implementation pending |
| PWA Frontend | 🟢 | Live at app.pip.arcforge.au |
| Xero Integration | 🟢 | OAuth + 10 READ-ONLY tools |
| User Auth | 🟢 | Email/password + invite codes |
| Business Context | 🟢 | Document upload + context injection |

**Status Guide:** 🟢 Good | 🟡 Attention | 🔴 Critical | 🔵 In Progress | ⚪ Not Started

---

## Deployment Status

### Production Services

| Service | URL | Status |
|---------|-----|--------|
| Main App (PWA) | https://app.pip.arcforge.au | 🟢 Live |
| MCP Server | https://mcp.pip.arcforge.au | 🟢 Live |
| Landing Page | https://pip.arcforge.au | ⚪ Pending |

### MCP Server Details

- **SSE Endpoint**: https://mcp.pip.arcforge.au/sse (requires Bearer token)
- **Health Check**: https://mcp.pip.arcforge.au/health
- **OAuth Discovery**: https://mcp.pip.arcforge.au/.well-known/oauth-authorization-server
- **OAuth Authorize**: https://mcp.pip.arcforge.au/oauth/authorize (Sign In + Sign Up)
- **OAuth Token**: https://mcp.pip.arcforge.au/oauth/token

**OAuth Configuration** (for Claude.ai custom connector):
- URL: `https://mcp.pip.arcforge.au/sse`
- Client ID: `pip-mcp-client`
- Client Secret: `pip-mcp-secret-change-in-production`

**Architecture**: Lazy-loading with 2 meta-tools (85% context reduction)

**Tool Categories**:
- invoices (3): get_invoices, get_aged_receivables, get_aged_payables
- reports (2): get_profit_and_loss, get_balance_sheet
- banking (2): get_bank_accounts, get_bank_transactions
- contacts (2): get_contacts, search_contacts
- organisation (1): get_organisation

### VPS Configuration

- **Provider**: DigitalOcean (production-syd1)
- **IP**: 170.64.169.203
- **Containers**: pip-app (384MB), pip-mcp (256MB)
- **Database**: SQLite with daily backups
- **Cost**: $0/month (shared droplet)

---

## Known Issues

See **ISSUES.md** for detailed tracking.

**Summary**: 0 Critical | 1 High (safety guardrails) | 3 Medium | 3 Low

---

## Next Steps (Priority Order)

### Immediate (This Week)

1. **Mem0 Memory Stack Implementation** (Epic 1.4) - NOW READY
   - Install `mem0ai` package in mcp-remote-server
   - Configure Memory with in-memory vector store + SQLite
   - Add memory tools (add, search, list, delete)
   - Inject relevant memories into MCP tool context
   - ChatGPT memory import endpoint
   - Memory management UI in PWA

2. **Safety Guardrails Implementation** (Epic 1.3)
   - Add database tables (user_settings, operation_snapshots)
   - Implement permission checks in tool router
   - Add settings UI to PWA

### After Memory + Safety

3. **Landing Page** (Epic 1.5)
   - Create pip.arcforge.au
   - What is Pip? + How to connect (Claude.ai/ChatGPT/PWA)
   - Arc Forge branding, dark theme

### Future

4. Voice Mode (Milestone 2)
5. Write operations (create/update invoices) - requires safety guardrails first
6. Additional accounting platform support
7. Verify ChatGPT Business published connector memory behavior

---

## Recent Achievements

### 2025-11-30: Mem0 Memory Tools Implemented!
- **IMPLEMENTATION**: Core memory functionality now working
  - Installed `mem0ai` v2.1.38 (official Node.js SDK)
  - Created memory service with in-memory vector + SQLite history
  - Added 5 memory tools to MCP: add, search, list, delete, clear_all
  - Updated system prompt with memory guidelines for Pip
- **TOOLS READY**: Memory category now discoverable via get_tools_in_category
- **PENDING**: ChatGPT memory import endpoint, PWA memory management UI

### 2025-11-30: spike_mem0 COMPLETE - Key Discovery!
- **DISCOVERY**: Official `mem0ai` npm package provides native TypeScript support!
  - Eliminates need for Python, subprocess, or refactoring
  - Full API parity with Python SDK
  - Supports: OpenAI, Anthropic, Ollama, 10+ LLM providers
  - Vector stores: in-memory, Qdrant, Chroma, Pinecone, pgvector, 20+ others
- **DECISION**: Use `mem0ai` with in-memory vector store + SQLite history
  - Resource impact: ~100-200MB RAM (fits 384MB VPS)
  - Decision document: `docs/research-notes/SPIKE-mem0-integration.md`
- **OPTIONS REJECTED**:
  - OpenMemory MCP: Qdrant needs 1.2GB RAM
  - Self-hosted Python: Exceeds VPS constraints
  - mem0-ts community port: OpenAI-only, unmaintained
- **UNBLOCKED**: Epic 1.4 (Mem0 Memory Stack) ready for implementation

### 2025-11-30: Mem0 Architecture Decision + Spike Created
- **ARCHITECTURE**: Consolidated Joplin research → adopted Mem0 as memory layer
  - Skip traditional RAG (Mem0 + tools approach instead)
  - Skip LangChain (obsolete for agentic systems)
  - Defer LangGraph (only if complex approval flows needed)
- **EPIC 1.4**: Restructured from "Memory Import" → "Mem0 Memory Stack"
- **RESEARCH**: ChatGPT memory behavior confirmed
  - Developer Mode disables memory (security feature)
  - Published connectors in Business/Teams MAY retain memory (UNVERIFIED)
- **CREATED**: docs/CHATGPT-MEMORY-GUIDE.md - user guide for memory options
- **CLEANUP**: ISSUES.md now open-only, resolved → CHANGELOG.md

### 2025-11-29: Safety Architecture + ChatGPT Validated
- **DESIGN**: Created safety guardrails architecture (specs/SAFETY-ARCHITECTURE.md)
  - Tiered permissions: Read-only (default) → Create drafts → Approve/Update → Delete/Void
  - Pre-operation snapshots for audit trail
  - Dynamic tool visibility based on user permission level
- **CHATGPT**: Validated working with zero code changes
  - Same MCP server works for both Claude.ai and ChatGPT
  - Discovered: Memory disabled when MCP connectors used (Developer Mode security)
  - Workaround: Export ChatGPT memories → upload to Pip context layer
- **RESEARCH**: Xero has NO user-accessible restore - critical finding for safety design

### 2025-11-29: Xero Tools Audit & Bug Fixes
- **BUG FIX**: Aged receivables/payables tools now correctly find unpaid invoices
  - Root cause: Xero API `where` clause unreliable with combined filters
  - Fix: Use `statuses` array parameter + fallback code filtering
- **AUDIT**: All 10 Xero tools reviewed and hardened
  - `getInvoices`: Fixed status filtering (was using broken where clause)
  - `getBankAccounts`: Added fallback filter for Type=="BANK"
  - `searchContacts`: Added fallback filter for name search
  - All tools: Improved error message extraction from Xero API
- **VALIDATED**: Claude.ai integration fully working end-to-end
  - Successfully shows $1,500 overdue invoice from Embark Earthworks

### 2025-11-29: OAuth Security Hardening & Sign-Up Flow
- **SECURITY**: Removed insecure /login endpoint (P0 vulnerability)
- Added OAuth discovery endpoint (/.well-known/oauth-authorization-server)
- Implemented bcrypt password verification
- Created unified OAuth flow with Xero connection
- Added Sign In + Sign Up tabbed interface
- Sign Up requires one-time invite code (beta access control)
- SSE endpoint now requires authentication (returns 401 to trigger OAuth)
- Added VPS SSH details to CLAUDE.md
- Created docs/INVITE-CODES.md for beta code tracking

### 2025-11-29: Repo Cleanup & Documentation
- Fixed CONTRIBUTING.md with proper workflow guide
- Organized docs/ folder (archived outdated files)
- Updated priorities: Claude.ai first, ChatGPT second

### 2025-11-29: Full Pip Rebrand
- Renamed repo from zero-agent to pip
- Updated all package names (@pip/*)
- Updated VPS deployment (/opt/pip)
- Version bumped to 0.2.0

### 2025-11-29: MCP Remote Server
- Deployed mcp.pip.arcforge.au
- Implemented lazy-loading (85% context reduction)
- Added OAuth 2.0 for Claude.ai integration

### 2025-11-28: User Authentication
- Email/password auth with invite codes
- Per-user data isolation
- Admin CLI for code management

---

## Business Context

### Target Avatar
**Primary**: Small business owner managing own books
- Owner-operator, 0-5 employees
- $100k-$500k/year revenue
- Using Xero, stressed about BAS/GST
- Core pain: "I didn't start this business to do bookkeeping"

### Distribution Strategy

| Platform | Priority | Status | Cost to Us |
|----------|----------|--------|------------|
| **Claude.ai MCP** | HIGH | 🟢 Working | $0 LLM |
| **ChatGPT App** | HIGH | 🟢 Working | $0 LLM |
| PWA (standalone) | MEDIUM | 🟢 Live | API costs |
| Self-hosted | LOW | 🟢 Ready | $0 |

**Key Insight**: MCP distribution = users bring their own LLM subscription = $0 inference costs for Arc Forge.

**ChatGPT Memory**:
- **Plus users**: Memory disabled in Dev Mode → need Pip memory stack (Priority 2)
- **Business/Teams**: Published connector MAY enable memory (UNVERIFIED - needs testing)

### Secured Domains
- askpip.au (secured)
- app.pip.arcforge.au (live - PWA)
- mcp.pip.arcforge.au (live - MCP server)
- pip.arcforge.au (reserved for landing page)

---

## References

- `PROGRESS.md` - Detailed task tracking
- `ISSUES.md` - Bug and improvement tracking
- `ARCHITECTURE.md` - System design and ADRs
- `specs/SAFETY-ARCHITECTURE.md` - Xero API safety guardrails design
- `docs/CHATGPT-MEMORY-GUIDE.md` - ChatGPT memory + Pip user guide
- `docs/research-notes/SPIKE-mem0-integration.md` - Mem0 integration decision (spike_mem0)
- `docs/research-notes/SPIKE-pip-inside-claude-chatgpt.md` - MCP strategy research
- `docs/research-notes/PATTERN-lazy-loading-mcp-tools.md` - Context optimization pattern

---

**Note**: Archive items older than 2 weeks to keep document focused.
