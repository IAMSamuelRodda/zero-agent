# Pip - Progress Tracking

> **Purpose**: Detailed project tracking with milestones, epics, features, and tasks
> **Lifecycle**: Living (update on task completion, status changes)

**Last Updated**: 2025-11-29
**Current Phase**: MCP Integration Validation

---

## Progress Summary

| Metric | Value |
|--------|-------|
| Current Focus | Claude.ai MCP Integration |
| Phase | Validation |
| Milestones Complete | 1/3 (Core Platform) |
| Overall | MVP deployed, validating distribution |

---

## Milestone 0: Core Platform (Complete)

**Status**: ✅ Complete
**Completed**: 2025-11-28

### Summary
- VPS deployment with Docker + Caddy
- Express server with API routes
- PWA frontend with chat interface
- Xero OAuth integration
- User authentication with invite codes
- Business context layer (document upload)
- Daily SQLite backups

---

## Milestone 1: MCP Distribution (Current)

**Status**: 🔵 In Progress
**Objective**: Distribute Pip via Claude.ai and ChatGPT instead of standalone PWA

### Why MCP Distribution?
- Users bring their own LLM subscription = $0 inference cost for us
- Built-in distribution via Claude.ai/ChatGPT ecosystems
- Users stay in familiar interface (no new app to learn)

---

### Epic 1.1: Claude.ai Integration

**Status**: ✅ Complete (validated working)
**Priority**: HIGH (do this first)

#### feature_1_1_1: MCP Remote Server
**Status**: ✅ Complete

| Task | Status | Notes |
|------|--------|-------|
| Create mcp-remote-server package | ✅ | packages/mcp-remote-server |
| SSE transport | ✅ | /sse endpoint |
| Lazy-loading (2 meta-tools) | ✅ | 85% context reduction |
| 10 Xero tools | ✅ | invoices, reports, banking, contacts, org |
| Multi-tenant sessions | ✅ | JWT auth per connection |
| Deploy to VPS | ✅ | mcp.pip.arcforge.au |

#### feature_1_1_2: Authentication
**Status**: ✅ Complete

| Task | Status | Notes |
|------|--------|-------|
| JWT token generation | ✅ | 30-day expiry |
| Login page (/login) | ✅ | Generates token URL |
| OAuth 2.0 flow | ✅ | For apps that support it |
| Bearer token in SSE | ✅ | Authorization header support |

#### feature_1_1_3: Validation & Testing
**Status**: ✅ Complete (basic) / 🔵 Comprehensive testing pending

| Task | Status | Notes |
|------|--------|-------|
| Test with Claude.ai | ✅ Done | OAuth flow working |
| Verify all 10 tools work | ✅ Done | Tools audited and fixed |
| Test Xero data retrieval | ✅ Done | $1,500 overdue invoice found |
| Document issues/fixes | ✅ Done | See ISSUES.md |
| **Comprehensive tool testing** | ⚪ Future | Test all tools with edge cases |

**Comprehensive Testing Checklist** (deferred):
- [ ] `get_invoices`: Test all status filters (DRAFT, AUTHORISED, PAID, VOIDED)
- [ ] `get_aged_receivables`: Test with 0, 1, many invoices
- [ ] `get_aged_payables`: Test with 0, 1, many bills
- [ ] `get_profit_and_loss`: Test date ranges, empty periods
- [ ] `get_balance_sheet`: Test different dates
- [ ] `get_bank_accounts`: Test with 0, 1, many accounts
- [ ] `get_bank_transactions`: Test limits, empty results
- [ ] `get_contacts`: Test limits, pagination
- [ ] `search_contacts`: Test partial matches, no matches, special chars
- [ ] `get_organisation`: Basic validation

#### feature_1_1_4: User Documentation
**Status**: ⚪ Not Started

| Task | Status | Notes |
|------|--------|-------|
| Connection guide | ⚪ Pending | How to add to Claude.ai |
| Troubleshooting guide | ⚪ Pending | Common issues |
| Example queries | ⚪ Pending | What to ask Pip |

---

### Epic 1.2: ChatGPT Integration

**Status**: 🔵 In Progress (Claude.ai validated, now ChatGPT)
**Priority**: HIGH (current focus)

**Subscription Requirements** (researched 2025-11-29):
- **Minimum**: ChatGPT Plus ($20/month) - has Developer Mode with MCP support
- ChatGPT Pro ($200/month) - also has MCP support
- ChatGPT Team/Enterprise - has MCP with admin controls

**How it works**: Users enable Developer Mode (Settings → Connectors → Advanced → Developer mode), then add our MCP server URL as a custom connector.

| Task | Status | Notes |
|------|--------|-------|
| Research subscription requirements | ✅ | Plus ($20/mo) minimum |
| Research MCP in ChatGPT | ✅ | Developer Mode required |
| Test with ChatGPT Plus | ⚪ Pending | Need subscription |
| Adapt server if needed | ⚪ Pending | May need tweaks |
| Document ChatGPT setup | ⚪ Pending | |

**References**:
- [OpenAI MCP Docs](https://platform.openai.com/docs/mcp)
- [ChatGPT MCP Support Guide](https://apidog.com/blog/chatgpt-mcp-support/)

---

### Epic 1.3: Landing Page

**Status**: ⚪ Not Started
**Priority**: MEDIUM (after both integrations work)

| Task | Status | Notes |
|------|--------|-------|
| Create pip.arcforge.au | ⚪ Pending | |
| What is Pip section | ⚪ Pending | One-liner + value prop |
| How to use section | ⚪ Pending | Claude.ai / ChatGPT / PWA options |
| Arc Forge branding | ⚪ Pending | Dark theme |

---

## Milestone 2: Voice Mode & Premium (Future)

**Status**: ⚪ Not Started
**Timeline**: After MCP distribution validated

### Epic 2.1: Voice Mode
- Speech-to-Text (Whisper)
- Text-to-Speech (Chatterbox)
- WebSocket conversation flow
- Voice UI in PWA

### Epic 2.2: Enhanced Features
- Relationship progression (colleague → partner → friend)
- Extended memory with semantic search
- Premium subscription tiers

---

## Archived Milestones

### Demo (2025-11-28)
**Status**: ✅ Complete

The Thursday demo with dental practice owner has been completed. Demo materials archived to `docs/archive/`.

---

## Progress Changelog

### 2025-11-29 - Claude.ai Validated, ChatGPT Next

**Achievements**:
- Claude.ai MCP integration fully validated and working
- Full Xero tools audit completed (10 tools fixed/hardened)
- $1,500 overdue invoice successfully retrieved via Claude.ai

**Next Priority**: ChatGPT integration
- Minimum subscription: ChatGPT Plus ($20/month)
- Requires Developer Mode enabled
- Same MCP server should work (may need minor tweaks)

**Deferred**: Comprehensive tool testing checklist added to feature_1_1_3

### 2025-11-29 - Documentation Cleanup

**Changes**:
- Fixed CONTRIBUTING.md with proper workflow guide
- Organized docs/ folder (archived outdated files to docs/archive/)
- Updated STATUS.md with correct priorities (Claude.ai → ChatGPT → Landing page)
- Simplified PROGRESS.md to focus on MCP integration

**Priority Clarification**:
1. Claude.ai integration validation (FIRST)
2. ChatGPT integration (after Claude works)
3. Landing page (after both work)

### 2025-11-29 - Full Pip Rebrand

- Renamed repo from zero-agent to pip
- Updated all @pip/* package names
- Updated VPS deployment
- Version 0.2.0

### 2025-11-29 - MCP Remote Server Deployed

- Created packages/mcp-remote-server
- Deployed to mcp.pip.arcforge.au
- Lazy-loading implemented (85% context reduction)
- OAuth 2.0 + token URL authentication

### 2025-11-28 - User Authentication

- Email/password with invite codes
- Per-user data isolation
- Admin CLI for code management

### 2025-11-28 - Business Context Layer

- Document upload API
- PDF/TXT/MD/DOCX parsing
- Context injection into prompts
- Deployed to VPS

---

## References

- `STATUS.md` - Current state (2-week window)
- `ISSUES.md` - Bugs, improvements, risks
- `ARCHITECTURE.md` - System design and ADRs
- `docs/research-notes/SPIKE-pip-inside-claude-chatgpt.md` - MCP strategy
