# Issues Tracking

> **Purpose**: Track **open** bugs, improvements, technical debt, and risks
> **Lifecycle**: Living (add when issues arise, remove when resolved)
> **Resolved Issues**: Move to `CHANGELOG.md` under the appropriate version's "Fixed" section

**Last Updated**: 2025-12-10 (Comprehensive Projects audit: issue_042-049 - isolation bugs, missing features)

---

## Status Guide

| Status | Meaning |
|--------|---------|
| 🔴 Open | Issue identified, not yet started |
| 🟡 In Progress | Actively being worked on |
| 🟢 Resolved | Fixed and verified |
| 🔵 Blocked | Cannot proceed due to external factors |
| ⚠️ Flagged | Needs decomposition or spike before implementation |

## Priority Guide

| Priority | Meaning |
|----------|---------|
| P0 | Critical - System broken, must fix immediately |
| P1 | High - Significant impact, fix this week |
| P2 | Medium - Should fix, can wait for next sprint |
| P3 | Low - Nice to have, backlog |

---

## Open Issues

### Priority Decisions

#### issue_008: Memory Architecture Decision
- **Status**: ✅ Resolved (Option B deployed - native memory)
- **Priority**: - (Complete)
- **Component**: `packages/pip-mcp`
- **Resolved**: 2025-11-30
- **Description**: Choose between two memory architectures for Pip
- **Resolution**:
  - **Option A (mem0)**: REJECTED - SQLite crashes in Docker/Alpine
  - **Option B (native)**: SELECTED - Text-based search, works in Alpine
  - Memory tools verified working on both Claude.ai and ChatGPT
- **Technical Details**:
  - Uses `memory-native.ts` with better-sqlite3
  - Text-based search (semantic search deferred)
  - 5 tools: add_memory, search_memory, list_memories, delete_memory, delete_all_memories

---

### Bugs

#### issue_010: Mem0 SQLite CANTOPEN in Docker (RESOLVED)
- **Status**: 🟢 Resolved (Switched to Option B native memory)
- **Priority**: - (Complete)
- **Component**: `packages/pip-mcp` (memory-native.ts)
- **Discovered**: 2025-11-30
- **Resolved**: 2025-11-30
- **Description**: Mem0's internal SQLite throws `SQLITE_CANTOPEN` regardless of configuration, crashing the MCP server.
- **Root Cause**: mem0ai library has internal SQLite that fails in Docker/Alpine
- **Additional Issue**: @xenova/transformers requires glibc (onnxruntime), but Alpine uses musl
- **Resolution**:
  - Switched to Option B (native memory implementation)
  - Removed @xenova/transformers import (crashes Alpine at import time)
  - Implemented text-based search instead of semantic/embedding search
  - Memory tools now functional with better-sqlite3
- **Trade-offs**:
  - Text search instead of semantic search (less intelligent matching)
  - Embeddings available if we switch to Debian-based Docker image
- **Commits**:
  - `d508336` - Initial Option B implementation with table creation
  - `3c839bd` - Remove @xenova/transformers import to fix Alpine crash
- **Notes**: Report to https://github.com/mem0ai/mem0/issues when time permits.

---

### Improvements

#### issue_018: Memory Management UI + User Edit Tracking
- **Status**: 🟢 Merged into Epic 2.1
- **Priority**: - (Absorbed)
- **Component**: `packages/pip-mcp`, `packages/pwa-app`
- **Description**: Add "Manage memory" UI and track user explicit edit requests separately from auto-extracted memory.
- **Resolution**: Merged into Epic 2.1 (feature_2_1_2 through feature_2_1_5) on 2025-12-01
- **See**: PROGRESS.md → Epic 2.1 for detailed tasks
- **UX Reference**: `specs/spike-outputs/UX-PATTERNS-CLAUDE-AI-REFERENCE-20251201.md` Pattern 0.7

#### issue_039: Google Sheets OAuth Routes + MCP Tools Implementation
- **Status**: 🔴 Open
- **Priority**: P1 (High - required before Google verification)
- **Component**: `packages/pip-mcp`
- **Created**: 2025-12-09
- **Blocker For**: Google OAuth app verification submission
- **Description**: Implement Google Sheets OAuth flow and MCP tools to enable spreadsheet read/write functionality
- **Prerequisites Complete**:
  - [x] Google Sheets API enabled in Cloud Console
  - [x] Google Drive API enabled in Cloud Console
  - [x] Redirect URI added: `https://mcp.pip.arcforge.au/integrations/sheets/callback`
  - [x] OAuth scopes added to consent screen: `spreadsheets`, `drive.readonly`
  - [x] Safety/permission infrastructure (tools mapped in `safety.ts`)
  - [x] Database types support `google_sheets` provider
  - [x] Integrations Hub displays Sheets status (currently "Coming Soon")
- **Implementation Required**:
  - [ ] OAuth routes in `packages/pip-mcp/src/index.ts`:
    - `POST /integrations/sheets` - Start Google Sheets OAuth
    - `GET /integrations/sheets/callback` - Handle OAuth callback
    - `POST /integrations/sheets/disconnect` - Revoke tokens
  - [ ] Replace "Coming Soon" button with working Connect/Disconnect in Integrations Hub
  - [ ] Google Sheets service (`packages/pip-mcp/src/services/sheets.ts`):
    - `getSheetsClient(userId)` - Get authenticated client with auto-refresh
    - Token refresh handling (reuse Gmail pattern)
  - [ ] MCP Tools implementation (14 tools defined in safety.ts):
    - **Level 0 (Read-Only)**: `read_sheet_range`, `get_sheet_metadata`, `search_spreadsheets`, `list_sheets`, `get_spreadsheet_revisions`
    - **Level 1 (Write)**: `write_sheet_range`, `append_sheet_rows`, `update_cell`, `create_spreadsheet`, `add_sheet`
    - **Level 2 (Delete)**: `clear_range`, `delete_sheet`, `delete_rows`, `delete_columns`, `trash_spreadsheet`
- **Acceptance Criteria**:
  - [ ] User can connect Google Sheets from Integrations Hub
  - [ ] User can disconnect Google Sheets
  - [ ] `read_sheet_range` tool works with spreadsheet URL/ID
  - [ ] Permission levels enforced (default read-only)
  - [ ] Tokens stored in `oauth_tokens` table with `provider='google_sheets'`
- **Complexity**: 3.0/5 (Medium - OAuth pattern exists, tools need implementation)
- **Reference**:
  - `specs/GOOGLE-SHEETS-INTEGRATION-PLAN.md` (detailed design)
  - Gmail OAuth implementation in `index.ts` (pattern to follow)

#### issue_042: CRITICAL - Chats Created in Wrong Project (Cross-Project Leakage)
- **Status**: 🟢 Resolved
- **Priority**: - (Fixed)
- **Component**: `packages/pwa-app/src/pages/ProjectDetailPage.tsx`, `packages/pwa-app/src/store/projectStore.ts`
- **Created**: 2025-12-10
- **Description**: Chats created in one project appear in other projects. Root cause is stale `currentProjectId` state and missing state synchronization.
- **Symptom**: User creates chat in "Embark Earthworks" project, but chat also appears in "Horizon Pro Dental" project page.
- **Root Causes Identified**:

  **Bug 1: ProjectDetailPage doesn't set currentProjectId on entry**
  - When user navigates to `/projects/:projectId`, the page loads but never calls `setCurrentProject(projectId)`
  - The `currentProjectId` in store remains stale from previous navigation
  - File: `ProjectDetailPage.tsx` - missing useEffect to sync current project

  **Bug 2: currentProjectId is persisted but not updated consistently**
  - `currentProjectId` is persisted in localStorage (`partialize` in projectStore)
  - This causes stale project context to survive page refreshes
  - If user visits Project A, closes browser, then visits Project B, `currentProjectId` might still be A

  **Bug 3: Race condition in chat creation flow**
  - `handleNewProjectChat` calls `newChat(projectId)` which sets `currentProjectId`
  - But navigation to `/` happens immediately after
  - ChatPage picks up pending message and sends via `sendMessage()`
  - `sendMessage()` reads `currentProjectId` which might have been changed by other operations

  **Bug 4: loadProjects() auto-sets currentProjectId**
  - When projects are loaded, if no current project set, it auto-selects default/first project
  - This can override the intended project context unexpectedly
  - Lines 44-55 in `projectStore.ts`

- **Impact**:
  - Data isolation violation - chats appear in wrong projects
  - Memory context pollution - project-specific memories might leak across projects
  - User confusion about which project a chat belongs to

- **Fix Strategy**:
  1. **Immediate**: Add `useEffect` to ProjectDetailPage to set `currentProjectId` on entry
  2. **Short-term**: Pass `projectId` explicitly through chat creation flow, don't rely on global state
  3. **Long-term**: Refactor to remove global `currentProjectId` dependency; use explicit projectId parameter everywhere

- **Resolution** (2025-12-10):
  - **Fix 1**: Added useEffect to ProjectDetailPage to sync URL projectId with global currentProjectId
  - **Fix 2**: Modified loadProjects() to only clear currentProjectId if project was deleted (don't auto-select)
  - **Fix 3**: Removed auto-set logic from createProject()
  - Files: ProjectDetailPage.tsx, projectStore.ts
- **Acceptance Criteria**:
  - [x] Chat created in Project A only appears in Project A
  - [x] Switching projects immediately updates currentProjectId
  - [x] Page refresh maintains correct project context
  - [x] No cross-project memory pollution
- **Complexity**: 2.5/5 (Medium - requires careful state management refactoring)
- **Related**: issue_041 (Add to Project action)

#### issue_043: Memory System Not Fully Project-Isolated
- **Status**: 🟡 Partial
- **Priority**: P1 (High - data isolation)
- **Component**: `packages/agent-core/src/orchestrator.ts`, `packages/agent-core/src/tools/memory-tools.ts`
- **Created**: 2025-12-10
- **Description**: Memory system has project isolation in database queries but requires explicit projectId passing which isn't happening consistently.
- **Current State**:
  - Database queries correctly filter by `project_id` (see `getMemoryContext` and memory tools)
  - BUT: `processMessage` passes `request.projectId` but this might be undefined/wrong
  - Memory tools accept `projectId` as optional parameter - LLM must decide to pass it
- **Issues**:
  - Chat route receives `projectId` from request body, passed to orchestrator ✓
  - Orchestrator passes `projectId` to `getMemoryContext` ✓
  - BUT: Memory tools (`read_memory`, `search_memory`) rely on LLM to pass projectId
  - If LLM doesn't pass projectId, queries default to `project_id IS NULL` (global scope)
- **Risk**: Memory from Project A could leak to Project B if projectId not consistently passed
- **Fix Strategy**: Auto-inject projectId into tool execution context, don't rely on LLM parameter
- **Complexity**: 2.0/5 (Low-Medium)

#### issue_044: Remove Global currentProjectId Dependency
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - architectural improvement)
- **Component**: `packages/pwa-app/src/store/projectStore.ts`, `packages/pwa-app/src/store/chatStore.ts`
- **Created**: 2025-12-10
- **Description**: Global `currentProjectId` state causes subtle bugs and race conditions. Should be refactored to explicit parameter passing.
- **Current Problems**:
  - Multiple places set `currentProjectId` (newChat, loadProjects, setCurrentProject)
  - Timing of these operations can cause unexpected state
  - Persisted state survives page refreshes inappropriately
  - `sendMessage` reads global state instead of receiving explicit parameter
- **Proposed Architecture**:
  - Remove `currentProjectId` from persisted state (or scope persistence to UI preference only)
  - `sendMessage(content, options: { sessionId?, projectId?, model? })`
  - Project context derived from URL (`/projects/:projectId`) not global store
  - Chat component receives projectId as prop, not from global state
- **Benefits**: Eliminates race conditions, clearer data flow, easier to debug
- **Complexity**: 3.0/5 (Medium-High - significant refactoring)

#### issue_045: Missing Project Breadcrumb Navigation in Chat Page
- **Status**: 🔴 Open
- **Priority**: P1 (High - core navigation UX)
- **Component**: `packages/pwa-app/src/pages/ChatPage.tsx`, `packages/pwa-app/src/components/ChatHeader.tsx`
- **Created**: 2025-12-10
- **Description**: When viewing a chat that belongs to a project, there's no breadcrumb showing "Project Name / Chat Name" and no way to navigate back to the project.
- **Blueprint Reference**: `specs/BLUEPRINT-feature-projects-ux-rework-20251210.yaml` lines 96-98
  ```yaml
  level_4_chat:
    elements:
      - "Breadcrumb: Project Name / Chat Name (if in project)"
  ```
- **Current State**:
  - ChatHeader only shows chat title
  - No project context visible in chat view
  - No navigation back to parent project
  - `loadChat` doesn't store `projectId` in chatStore state
  - ChatPage doesn't have access to current chat's projectId
- **Implementation**:
  - [ ] Add `currentProjectId` to chatStore state
  - [ ] Update `loadChat` to store `session.projectId`
  - [ ] Update ChatHeader to accept optional `projectId` and `projectName`
  - [ ] Add breadcrumb: "← Project Name" clickable link when in project
  - [ ] Breadcrumb navigates to `/projects/:projectId`
- **Mockup**:
  ```
  [← Embark Earthworks] / Research Embarkearthwor...  ⋮
  ```
- **Complexity**: 1.5/5 (Low - straightforward UI addition)

#### issue_046: Missing Project Detail Right Sidebar
- **Status**: 🔴 Open
- **Priority**: P1 (High - core Projects UX feature)
- **Component**: `packages/pwa-app/src/pages/ProjectDetailPage.tsx`
- **Created**: 2025-12-10
- **Description**: ProjectDetailPage is missing the right sidebar with Instructions, Files, and Memory sections per Claude.ai pattern.
- **Blueprint Reference**: `specs/BLUEPRINT-feature-projects-ux-rework-20251210.yaml` lines 256-267
  ```yaml
  ProjectDetailSidebar:
    sections:
      - name: "Memory"
        content: "Project-specific memory summary"
      - name: "Instructions"
        content: "System prompt textarea"
      - name: "Files"
        content: "List of uploaded docs"
  ```
- **Current State**:
  - Instructions exist but in a collapsible header panel (gear icon toggle)
  - No Files section at all
  - No Memory section at all
  - No right sidebar layout
- **Implementation**:
  - [ ] Create `ProjectDetailSidebar` component
  - [ ] Add right sidebar to ProjectDetailPage layout (responsive)
  - [ ] **Instructions Section**:
    - Move from header panel to sidebar
    - Auto-save on blur
    - Show character count
  - [ ] **Files Section**:
    - List uploaded documents for this project
    - Upload button (reuse existing Docs upload)
    - Delete file action
    - Filter `business_context` by `project_id`
  - [ ] **Memory Section**:
    - Show memory entities scoped to this project
    - Display count and recent learnings
    - Link to full memory view
  - [ ] Mobile: Sidebar as collapsible panel or bottom sheet
- **Dependencies**:
  - Need `project_id` column in `business_context` table (may not exist)
  - Memory tables already have `project_id` support
- **Complexity**: 3.5/5 (Medium-High - new component, file upload integration)

#### issue_047: Project Instructions Not Integrated with AI
- **Status**: 🔴 Open
- **Priority**: P1 (High - core functionality)
- **Component**: `packages/agent-core/src/orchestrator.ts`, `packages/server/src/routes/chat.ts`
- **Created**: 2025-12-10
- **Description**: Project instructions are saved to database but NOT used in AI system prompt. Instructions field is purely cosmetic currently.
- **Current State**:
  - Instructions saved to `projects.instructions` column ✓
  - Instructions displayed in UI for editing ✓
  - BUT: `buildSystemPrompt` in orchestrator doesn't receive or use project instructions
  - Chat API passes `projectId` but not `instructions`
  - Orchestrator doesn't fetch project to get instructions
- **Flow Gap**:
  ```
  Current:  ChatPage → API → Orchestrator → buildSystemPrompt (no project instructions)
  Required: ChatPage → API → Orchestrator → fetch project → buildSystemPrompt (WITH instructions)
  ```
- **Implementation**:
  - [ ] Orchestrator: Add method to get project by ID
  - [ ] `processMessage`: If `projectId` provided, fetch project and get instructions
  - [ ] `buildSystemPrompt`: Accept `projectInstructions` parameter
  - [ ] Inject project instructions into system prompt:
    ```
    ## Project Context
    You are working within the "{projectName}" project.
    Project Instructions: {instructions}
    ```
  - [ ] Consider: Should project instructions override or supplement global instructions?
- **Acceptance Criteria**:
  - [ ] Instructions in project settings affect AI responses
  - [ ] AI mentions project context when relevant
  - [ ] Instructions are project-specific (don't leak to other projects)
- **Complexity**: 2.0/5 (Low-Medium - straightforward integration)

#### issue_048: Missing Project-Scoped File Upload
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - enhances Projects feature)
- **Component**: `packages/pwa-app`, `packages/server`, `packages/core`
- **Created**: 2025-12-10
- **Description**: Files (business documents) cannot be uploaded to specific projects. All docs are global.
- **Current State**:
  - `business_context` table exists but may not have `project_id` column
  - Docs upload feature exists in ChatInputArea (global)
  - No project-scoped upload UI
- **Implementation**:
  - [ ] Add `project_id` column to `business_context` table (if missing)
  - [ ] Update upload API to accept optional `projectId`
  - [ ] Create project Files section in ProjectDetailSidebar
  - [ ] Filter business context by project in AI context retrieval
  - [ ] Show project files separately from global files
- **Complexity**: 2.5/5 (Medium)

#### issue_049: Missing Project-Scoped Memory Display
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - enhances Projects feature)
- **Component**: `packages/pwa-app/src/pages/ProjectDetailPage.tsx`
- **Created**: 2025-12-10
- **Description**: No UI to view/manage project-specific memory (what Pip has learned about this project).
- **Current State**:
  - Memory tables have `project_id` column ✓
  - `getMemoryContext` filters by `project_id` ✓
  - Memory tools support `projectId` parameter ✓
  - BUT: No UI to view project memory
  - Settings page has global Memory section (not project-scoped)
- **Implementation**:
  - [ ] Create `ProjectMemoryPanel` component
  - [ ] Fetch memory entities filtered by `project_id`
  - [ ] Display in ProjectDetailSidebar Memory section
  - [ ] Show entity count, recent observations
  - [ ] Optional: Allow deleting project-specific memories
- **Complexity**: 2.0/5 (Low-Medium - data exists, need UI)

#### issue_041: Implement "Add to Project" Chat Action
- **Status**: 🔴 Open
- **Priority**: P1 (High - core Projects UX feature)
- **Component**: `packages/pwa-app`, `packages/server`
- **Created**: 2025-12-10
- **Description**: Implement the "Add to project" action in chat context menus to move existing chats into projects.
- **Current State**:
  - "Add to project" button exists in `ChatActionsMenu` component
  - Handler is a TODO no-op: `handleAddToProject = (_chatSessionId: string) => { /* TODO */ }`
  - Backend endpoint exists: `PATCH /api/sessions/:id/project`
- **Behavior**:
  - Chat can be in ONE place only (exclusive assignment):
    - **General** (no project) - `projectId: null`
    - **Specific project** - `projectId: <uuid>`
  - Moving to a project removes it from "General"
  - Moving to "General" (or "Remove from project") removes project association
- **Implementation**:
  - [ ] Create `ProjectPicker` component (dropdown/modal to select target project)
  - [ ] Wire "Add to project" action to show ProjectPicker
  - [ ] Call `api.moveToProject(sessionId, projectId)` on selection
  - [ ] Add "Remove from project" option (sets `projectId: null`)
  - [ ] Refresh chat list after move
  - [ ] Show project badge on chat items in sidebar
- **UI Locations**:
  - Sidebar chat context menu (3-dot menu)
  - ChatHeader actions menu
  - ChatsPage chat row actions
- **Acceptance Criteria**:
  - [ ] Can move chat from General → Project
  - [ ] Can move chat from Project → different Project
  - [ ] Can move chat from Project → General (remove from project)
  - [ ] Chat list refreshes after move
  - [ ] Project badge updates in sidebar
- **Complexity**: 2.0/5 (Low-Medium - backend exists, need UI picker)
- **Related**: Projects UX Rework (commit 7a67b27)

#### issue_040: Add Streamable HTTP Transport to MCP Server
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - infrastructure modernization)
- **Component**: `packages/pip-mcp`
- **Created**: 2025-12-10
- **Description**: Implement the new Streamable HTTP transport alongside existing SSE transport for improved infrastructure compatibility and features.
- **Background**:
  - MCP deprecated HTTP+SSE transport, replaced with Streamable HTTP (protocol version 2025-03-26)
  - SSE uses two endpoints (`/sse` + `/message`), Streamable HTTP uses single endpoint
  - Streamable HTTP benefits: resumability, better proxy/load balancer support, session management
- **Current State** (Legacy SSE):
  - Two separate endpoints: `/sse` (GET, event stream) and `/message` (POST, client requests)
  - Works with Claude.ai and ChatGPT
  - Issues with some proxies, load balancers, serverless platforms
- **Target State** (Dual Transport):
  - Keep SSE endpoints for backward compatibility (ChatGPT may still use SSE)
  - Add Streamable HTTP endpoint (`/` or `/mcp`)
  - Single endpoint handles both GET and POST
  - Session management via `Mcp-Session-Id` header
  - Resumability via `Last-Event-ID` header
- **Benefits of Streamable HTTP**:
  - Single endpoint - simpler architecture
  - Bi-directional communication - servers can send notifications
  - Resumability - reconnect and resume after broken connections
  - Better infrastructure support - works with standard HTTP tooling, CDNs
  - Stateless-friendly - can work without persistent connections
- **Implementation**:
  - [ ] Upgrade MCP SDK to TypeScript SDK 1.10.0+ (if not already)
  - [ ] Add Streamable HTTP transport endpoint
  - [ ] Implement session ID tracking via headers
  - [ ] Add `Last-Event-ID` support for resumability
  - [ ] Keep legacy SSE endpoints (`/sse`, `/message`) for backward compatibility
  - [ ] Test with Claude.ai and ChatGPT
- **Acceptance Criteria**:
  - [ ] Streamable HTTP endpoint responds to POST with JSON-RPC
  - [ ] Session ID tracking works across requests
  - [ ] Legacy SSE endpoints still work for existing clients
  - [ ] Claude.ai connects successfully via Streamable HTTP
  - [ ] ChatGPT connects via SSE (fallback)
- **Complexity**: 2.5/5 (Medium - SDK support exists, need dual transport)
- **References**:
  - [MCP Specification - Transports](https://spec.modelcontextprotocol.io/specification/basic/transports/)
  - [Why MCP Switched to Streamable HTTP](https://dev.to/punkpeye/sse-vs-streamable-http-why-mcp-switched-transport-protocols-4fcn)
  - [Cloudflare Agents - Transport](https://developers.cloudflare.com/cloudflare-for-platforms/agents/model-context-protocol/transport/)
- **Notes**: Keep legacy SSE for redundancy - ChatGPT and some platforms may still require SSE. Streamable HTTP gives us modern infrastructure benefits.

#### issue_038: MCP Server Custom Icon Not Displayed in Claude.ai
- **Status**: 🔵 Blocked (Claude.ai client-side)
- **Priority**: P3 (Low - cosmetic, waiting on client support)
- **Component**: `packages/pip-mcp/src/index.ts`
- **Created**: 2025-12-09
- **Description**: Pip logo icon added to MCP server initialization but not appearing in Claude.ai tool calls
- **Server-Side Implementation** (Complete):
  - MCP SDK upgraded to v1.24.3 (icons support)
  - `icons` field added to Server initialization with base64 SVG data URI
  - Follows SEP-973 icons specification
- **Blocking Issue**:
  - [GitHub Issue #1040](https://github.com/modelcontextprotocol/modelcontextprotocol/issues/1040) - Icon support is still an open feature request
  - Claude.ai/Claude Desktop clients don't render custom server icons yet
  - Generic sparkle icon shown for all custom connectors
- **Resolution**: Waiting on Claude.ai to implement icon rendering
- **Action**: Monitor GitHub issue #1040 for updates; no further work needed on our side
- **Not a browser cache issue** - reconnecting establishes fresh SSE connection

#### issue_036: Collapsible Thinking + Tool Call Visibility (Claude Code Pattern)
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - UX transparency)
- **Component**: `packages/pwa-app`, `packages/server`
- **Created**: 2025-12-03
- **Description**: Stream and display reasoning model thinking + tool calls in collapsible UI, matching Claude Code terminal UX.
- **Current State**:
  - `<think>` blocks from qwq/deepseek models shown raw in response
  - No visibility into tool calls (what tool, what input, what output)
  - User has no insight into "what Pip is doing"
- **Target Pattern** (Claude Code terminal):
  - **Thinking**: Collapsed by default, expandable accordion showing model reasoning
  - **Tool Calls**: Card showing tool name, input parameters, response data
  - **Progress**: "Tinkering... (28s)" with real-time status
- **UI Components Needed**:
  1. `ThinkingCollapsible.tsx` - Parse `<think>...</think>`, render in accordion
  2. `ToolCallCard.tsx` - Show tool name + input + output in expandable card
  3. Response parsing to extract thinking blocks and tool metadata
- **Backend Changes**:
  - Return tool call metadata in chat response (tool name, input, output)
  - Consider SSE for streaming thinking/progress updates
- **Acceptance Criteria**:
  - [ ] Parse `<think>` blocks from model responses
  - [ ] Render thinking in collapsible component (collapsed by default)
  - [ ] Display tool calls with name, input, and result
  - [ ] Tool cards expandable to show full details
  - [ ] Works with both cloud models (Claude) and local models (qwq, deepseek)
- **Complexity**: 2.5/5 (Medium)
- **Reference**: Claude Code terminal "Tinkering..." UX with expandable details

#### issue_037: Intelligent Business vs Personal Expense Separation
- **Status**: ⚠️ Vision (needs spikes before implementation)
- **Priority**: P2 (Future - Milestone 3+)
- **Component**: `packages/agent-core`, `packages/pip-mcp`, `packages/pwa-app`
- **Created**: 2025-12-09
- **Blueprint**: `specs/BLUEPRINT-feature-expense-separation-20251209.yaml`
- **Description**: Core differentiating feature - AI-powered categorization of transactions as business or personal for users operating from mixed accounts.
- **Target User**:
  - Sole traders running business from personal bank account
  - Needs to know "What can I actually spend personally?"
  - Doesn't want to maintain separate accounts or become an accountant
  - Values simple answers over perfect categorization
- **Core Concept**: "Available Balance"
  ```
  Bank Balance - GST Liability - Tax Reserve - Business Expenses = Available Personal
  ```
- **Key Capabilities** (Planned):
  1. **Pattern Learning**: Recognize recurring business vs personal expenses
  2. **Confidence Tiers**: Auto-categorize (high), suggest (medium), ask (low)
  3. **Tax Reserving**: Calculate GST/income tax reserves automatically
  4. **Plain English**: "You made $2,500 but $400 is GST" not accounting jargon
- **Design Principles**:
  - Start permissive, tighten with learning
  - Memory over manual (goal: zero manual categorization)
  - Progressive disclosure (simple answer first, details on demand)
  - No judgment (information, not budgeting lectures)
- **Spikes Required** (before implementation):
  - [ ] `spike_3_1_0`: Transaction Categorization ML/Heuristics Approach (5 days)
  - [ ] `spike_3_1_1`: Bank Feed Integration Architecture (3 days)
  - [ ] `spike_3_1_2`: Tax Calculation Accuracy (3 days)
- **Implementation Phases**:
  - Phase 1 (M3): Transaction analysis + categorization
  - Phase 2 (M4): Learning system + feedback loop
  - Phase 3 (M5): Available balance calculator
  - Phase 4 (Future): Proactive intelligence
- **Risks**:
  - Tax calculation inaccuracy (users make decisions on wrong numbers)
  - Categorization errors compound over time
  - Privacy concerns with transaction analysis
- **Related**:
  - `VISION.md`: "Future Direction: Intelligent Expense Separation"
  - Avatar: Arc Forge Business Planning (repos/arcforge-business-planning)
  - `issue_034`: Skills System (could provide expense analysis skills)
- **Notes**: DO NOT implement until Milestone 2 complete and spikes assessed. This is vision-level planning.

#### issue_035: Ollama Reasoning Model Context Length Configuration
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - performance optimization)
- **Component**: Local Ollama setup
- **Created**: 2025-12-03
- **Description**: Reasoning models (DeepSeek-R1, QwQ) need increased context length for optimal performance. Default 4096 is insufficient for chain-of-thought reasoning.
- **Models to Pull** (RTX 4090 24GB):
  - `deepseek-r1:32b` - Best reasoning within 24GB (~20GB VRAM, ~22 tok/s)
  - `deepseek-r1:14b` - Faster alternative (~10GB VRAM, ~45 tok/s)
  - `qwq:32b` - Alternative reasoning model (~20GB VRAM, ~20 tok/s)
- **Configuration Required**:
  ```
  # Create Modelfile for each reasoning model
  FROM deepseek-r1:32b
  PARAMETER num_ctx 16384

  # Then: ollama create deepseek-r1-16k -f Modelfile
  ```
- **Additional Optimization**:
  - Set `OLLAMA_KV_CACHE_TYPE=q8_0` (q4_0 may reduce reasoning quality)
  - Flash Attention should be enabled
- **Acceptance Criteria**:
  - [ ] Pull deepseek-r1:32b, deepseek-r1:14b, qwq:32b
  - [ ] Create Modelfiles with 16k context for each
  - [ ] Test reasoning quality with extended context
  - [ ] Update Pip app to show new models in selector
- **Reference**: [DeepSeek R1 on RTX 4090](https://www.jamesflare.com/ollama-deepseek-r1-distill/)

#### issue_017: Ollama Model Warm-Up Strategy
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - UX improvement)
- **Component**: `packages/pwa-app`, LiteLLM proxy
- **Description**: Ollama models have ~14s cold start (loading into GPU). Need to investigate pre-warming strategies.
- **Context**:
  - Cold start: ~14s (model loading into VRAM)
  - Warm latency: ~238ms (excellent)
- **Investigation Areas**:
  - [ ] Trigger model warm-up when user selects Ollama model in dropdown
  - [ ] Background warm-up while user is typing (if message is long)
  - [ ] Keep model loaded with periodic ping (prevent unload)
  - [ ] Display "warming up..." indicator in UI
- **Acceptance Criteria**:
  - [ ] Measure actual cold/warm latency with integrated PWA
  - [ ] Determine if 14s cold start is acceptable or needs mitigation
  - [ ] If needed, implement pre-warming strategy
- **Notes**: Defer implementation until Ollama is integrated into PWA. Test real-world UX first.

#### issue_016: Light/Dark Mode Theme Support
- **Status**: 🔴 Open
- **Priority**: P3 (Low - future enhancement)
- **Component**: All frontend packages (`packages/pwa-app`, `packages/pip-mcp`, `landing-page.html`)
- **Description**: Add light/dark mode toggle with CSS variables for easy theme switching
- **Current State**: All pages use hardcoded dark theme colors
- **Target State**: CSS variables with theme toggle, respects system preference
- **Acceptance Criteria**:
  - [ ] Extract colors to CSS variables (already partially done in landing page)
  - [ ] Add theme toggle in settings
  - [ ] Persist theme preference in localStorage
  - [ ] Respect `prefers-color-scheme` media query
  - [ ] Consistent theming across all pages (PWA, MCP login, landing)
- **Notes**: Low priority - current dark theme is consistent with brand. Implement when user feedback requests it.

#### issue_022: Enhanced "Thinking" Indicator (Claude Code Pattern)
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - UX engagement)
- **Component**: `packages/pwa-app`, `packages/server`
- **Description**: Current "Checking your data... (Xs)" is too generic. Users want visibility into what Pip is actually doing.
- **Reference**: Claude Code shows dynamic status updates:
  - Tool being called: "Bash(git status && git diff)"
  - Action description: "Updating STATUS.md..."
  - Thinking indicator: "Thinking..." with duration
  - Progress steps: Shows sequence of operations
- **Current State**:
  - Static "Checking your data..." message
  - Only shows elapsed time
  - No visibility into tools being called
- **Target State**:
  - Show tool name when Xero API is called (e.g., "Fetching invoices...")
  - Show operation context (e.g., "Analyzing P&L report...")
  - Stream status updates from backend
  - Consider: SSE for real-time status updates
- **Implementation Options**:
  - Option A: Server-sent events (SSE) for streaming status
  - Option B: Polling endpoint for status updates
  - Option C: WebSocket connection for bidirectional updates
- **Acceptance Criteria**:
  - [ ] Design status message schema (tool, action, duration)
  - [ ] Backend emits status events during processing
  - [ ] Frontend displays dynamic status messages
  - [ ] Shows specific tool/operation being performed
  - [ ] Elapsed time per operation (not just total)
- **Complexity**: 2.5-3.0/5 (Medium - requires streaming infrastructure)
- **Notes**: Makes the tool feel more responsive and trustworthy. Users see Pip is "working" not "stuck".

#### issue_025: Header Cleanup + Claude.ai Layout Pattern
- **Status**: 🟢 Resolved
- **Priority**: - (Complete)
- **Component**: `packages/pwa-app`
- **Created**: 2025-12-02
- **Resolved**: 2025-12-02
- **Description**: Refactor layout to follow Claude.ai/ChatGPT patterns for cleaner UX.
- **Acceptance Criteria**:
  - [x] Tighten logo + tagline spacing in header (removed tagline)
  - [x] Move ProjectSwitcher into sidebar
  - [x] Move docs indicator into sidebar
  - [x] Add profile circle (bottom-left) with dropdown (settings, account, logout)
  - [x] Center chat input on new chat (empty state with golden ratio positioning)
  - [x] Move chat input to bottom after first message
  - [x] Header shows only: logo, title, Xero connection status
- **Components Created/Updated**:
  - `ProfileDropdown.tsx` - New component for user avatar + dropdown
  - `ChatSidebar.tsx` - Added ProjectSwitcher, docs button, ProfileDropdown
  - `ProjectSwitcher.tsx` - Added `inSidebar` prop
  - `ChatPage.tsx` - Simplified header, centered empty state, conditional footer
- **Documentation**: Updated `docs/UI-UX-DESIGN-PHILOSOPHY.md` with Layout Patterns section
- **Reference**: Claude.ai desktop layout, ChatGPT sidebar pattern

#### issue_026: Sidebar UX Improvements (Claude.ai Pattern)
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - UX polish)
- **Component**: `packages/pwa-app` (ChatSidebar.tsx)
- **Created**: 2025-12-02
- **Description**: Implement Claude.ai sidebar UX patterns for better chat management
- **Current Problems**:
  1. Chat list stacks up fast with no way to collapse
  2. Collapsed sidebar shows multiple chat icons (should be single icon)
  3. Docs icon at bottom instead of top
  4. No starred/bookmarked chats feature
  5. No pagination for large chat lists
- **Target Pattern** (Claude.ai sidebar):
  - **Sections**: Starred → Recents (collapsible)
  - **Hide toggle**: "Hide" text on hover, collapses Recents section
  - **Lazy loading**: Show ~20 recent chats, then "All chats" button
  - **All chats page**: Full list with search, metadata, "+ New chat" button
  - **Collapsed state**: Single icons for each section, not per-chat
- **Acceptance Criteria**:
  - [ ] Add "Bookmarked" section (starred chats at top)
  - [ ] Add collapsible "Recents" section with hover-to-show "Hide" toggle
  - [ ] Limit visible chats (~20), add "All chats" button at bottom
  - [ ] Create `/chats` page with search, full list, metadata
  - [ ] Collapsed state: single chat icon → expands sidebar
  - [ ] Move docs icon to top section (below New chat)
  - [ ] Add bookmark/star action to chat context menu
- **Complexity**: 2.5/5 (Medium)
- **Reference**: Claude.ai sidebar screenshots (Hide toggle, Starred, All chats page)

#### issue_027: Rich Projects Feature (Claude.ai Pattern)
- **Status**: ⚠️ Flagged (needs spike)
- **Priority**: P1 (High - differentiator)
- **Component**: `packages/pwa-app`, `packages/server`, `packages/core`
- **Created**: 2025-12-02
- **Description**: Implement full Claude.ai Projects pattern with dedicated workspaces
- **Current State**:
  - Basic project CRUD
  - Project switcher in sidebar
  - Sessions filtered by projectId
- **Target Pattern** (Claude.ai):
  - Projects list view (search, sort, cards)
  - Project detail view with:
    - Project-specific chat list
    - Context files (upload/manage)
    - Memory (project-scoped)
    - Instructions (system prompt override)
    - New chat button within project
  - Project folder icon in sidebar (like Claude.ai)
- **Acceptance Criteria**:
  - [ ] Projects list page with cards
  - [ ] Project detail page layout
  - [ ] Project-specific file uploads
  - [ ] Project-specific memory isolation
  - [ ] Project-specific instructions/prompts
  - [ ] Sidebar: folder icon → projects list
- **Complexity**: 4.0/5 (High - significant architecture)
- **Spike Required**: Research Claude.ai Projects implementation patterns
- **Reference**: Claude.ai Projects UI (screenshots provided)

#### issue_028: Connectors Menu (Multi-Integration Pattern)
- **Status**: 🟡 In Progress (spike complete)
- **Priority**: P0 (Critical - demo blocker for dental client)
- **Component**: `packages/pwa-app`, `packages/server`, `packages/pip-mcp`
- **Created**: 2025-12-02
- **Spike Complete**: 2025-12-03
- **Description**: Move from "Xero-only" to multi-connector architecture
- **Research Output**: `specs/spike-outputs/GOOGLE-WORKSPACE-INTEGRATION-RESEARCH-20251203.md`
- **Current State**:
  - Xero is hardcoded as primary/only connector
  - Connection status in header
- **Target Pattern** (Claude.ai):
  - Connectors menu in chat input area (+ icon dropdown)
  - Toggle individual connectors on/off per chat
  - Manage connectors page (add/remove/configure)
  - Per-connector, per-tool permissions (see issue_030)
  - Per-project default connectors

### Priority: Gmail First (Dental Demo Critical Path)

**Use Case**: Dental practice receives POs, invoices, and documents via email. Pip must:
1. Search emails for invoices/POs (by sender, subject, date)
2. Extract PDF/image attachments
3. Parse attachment contents (reuse existing PDF parsing)
4. Serve content to user for financial queries

**⚠️ CRITICAL FINDING: Gmail Scope Classification (Corrected)**

| Scope | Category | Verification |
|-------|----------|-------------|
| `gmail.labels` | Non-Sensitive | Minimal |
| `gmail.send` | **Sensitive** | 3-5 days |
| `gmail.readonly` | **⚠️ RESTRICTED** | CASA annual audit |
| `gmail.modify` | **⚠️ RESTRICTED** | CASA annual audit |

**CASA Security Assessment Reality**:
- Annual third-party security audit required for production
- Cost: Tier 2 ($500-$4,500), Tier 3 ($15,000-$75,000+)
- Timeline: Several weeks for initial verification
- **NO workarounds** for apps storing restricted scope data on servers

**Demo Strategy (Recommended)**:
1. **Keep app in Testing mode** - bypasses CASA requirement
2. **Add dental practice email(s) as test users** (max 100 users)
3. **Full Gmail functionality** - no CASA needed for testing
4. **7-day refresh token expiry** - acceptable for demo, re-auth weekly
5. **Validate product-market fit** before investing in CASA

**Alternative: Google Workspace Domain-Wide Delegation**:
If dental practice uses Google Workspace (not personal Gmail):
- Service account with domain-wide delegation
- Admin configures permissions (no user consent flow)
- **No CASA required** for internal apps
- Scopes granted at admin level

**Gmail MCP Tools** (Priority Order):
```typescript
1. search_gmail(query, maxResults?)
   // "from:supplier@dental.com has:attachment filename:pdf after:2025/01/01"
   // Returns: [{id, subject, from, date, hasAttachments}]

2. get_email_content(messageId)
   // Returns: {subject, from, to, date, body, attachments: [{id, filename, mimeType, size}]}

3. download_attachment(messageId, attachmentId)
   // Returns: base64 content or parsed text (if PDF/image)
   // Reuse existing PDF parsing from document upload

4. list_email_attachments(query?, maxResults?)
   // Convenience: Search + extract attachment metadata in one call
   // "Show me all invoice PDFs from last month"
```

**Gmail Implementation Plan**:
1. **Database**: Add `provider_user_id`, `provider_metadata` to `oauth_tokens`
2. **OAuth**: `/auth/google/gmail` route with `gmail.readonly` scope
3. **Service**: `getGmailClient()` with auto-refresh (reuse Xero pattern)
4. **MCP Tools**: Implement 4 Gmail tools above
5. **PDF Parsing**: Integrate existing document parsing for attachments
6. **UI**: "Connect Gmail" in Settings, show in connectors menu

**Revised Phased Implementation**:
- **Phase 1: Gmail Read-Only** (1-2 weeks) ← PRIORITY
  - OAuth flow + token storage
  - 4 Gmail MCP tools
  - Attachment download + PDF parsing
  - UI: Connect Gmail button
- Phase 2: Drive + Sheets (2-3 weeks)
- Phase 3: Write operations + permissions UI (1 week)

- **Acceptance Criteria** (Gmail Phase - Testing Mode):
  - [ ] Database schema: `provider_user_id`, `provider_metadata` columns
  - [ ] Google OAuth route (`/auth/google/gmail`) with `gmail.readonly` scope
  - [ ] `getGmailClient()` service with auto-refresh (handle 7-day token expiry)
  - [ ] Gmail MCP tools: `search_gmail`, `get_email_content`, `download_attachment`, `list_email_attachments`
  - [ ] PDF/image attachment parsing (reuse document upload logic)
  - [ ] UI: Connect Gmail in Settings (with "Testing mode" indicator)
  - [ ] Add dental practice email(s) to Google Cloud Console test users
  - [ ] Privacy policy update for Gmail data disclosure
- **Risks**:
  - **100-user cap** (testing mode limit) - sufficient for demo phase
  - **7-day refresh token expiry** (testing mode) - users re-auth weekly, acceptable for demo
  - **CASA cost for production** ($4,500+/year) - defer until PMF validated
  - **Google Workspace alternative** - if client uses Workspace, domain-wide delegation bypasses CASA
- **Complexity**: 3.5/5 (Medium-High - OAuth + PDF parsing already exists)
- **Estimate**: 1-2 weeks for Gmail MVP (Testing Mode)
- **Reference**:
  - `specs/spike-outputs/GOOGLE-WORKSPACE-INTEGRATION-RESEARCH-20251203.md`
  - [Gmail API Scopes](https://developers.google.com/workspace/gmail/api/auth/scopes)
  - [CASA Assessment](https://appdefensealliance.dev/casa)

#### issue_030: Per-Tool Permissions (Claude.ai Pattern)
- **Status**: 🟡 In Progress (Phase 1 Complete)
- **Priority**: P1 (High - security + UX improvement)
- **Component**: `packages/pwa-app`, `packages/server`, `packages/pip-mcp`
- **Created**: 2025-12-02
- **Phase 1 Completed**: 2025-12-09 (Per-Connector Permissions - Backend)
- **Description**: Replace single "safety level" dropdown with per-tool three-tier permissions

**Phase 1 Complete (Per-Connector Permissions)**:
- ✅ `connector_permissions` table with (user_id, connector, permission_level)
- ✅ Database methods: getConnectorPermission, upsertConnectorPermission, etc.
- ✅ Safety service uses per-connector permission levels
- ✅ Tool visibility filtered per-connector at MCP level
- ✅ API endpoints: GET/PUT/DELETE /api/settings/connectors/:connector
- ✅ Programmatic denial at tool execution (not just prompt instructions)
- ✅ Default is Level 0 (read-only) for ALL connectors

**Phase 2 TODO (Per-Tool Granularity)**:
- [ ] Per-tool permissions within each connector (vs per-connector level)
- [ ] Three-tier toggle: Always allow / Needs approval / Blocked
- [ ] PWA settings UI for connector permissions
- [ ] PWA settings UI for per-tool permissions (future)

- **Current State** (after Phase 1):
  - Per-connector permission levels (Xero, Gmail, Google Sheets)
  - Each connector can have different level (e.g., Sheets=Write, Xero=Read-Only)
  - Within a connector, all tools at/below that level are enabled
- **Target Pattern** (Claude.ai Tool Permissions):
  - **Three tiers per tool**: Always allow ✓ / Needs approval 👆 / Blocked ⊘
  - **Per-connector view**: Inside each connector (Xero), show all its MCP tools
  - **Full tool list**: Show actual tool names, not lazy-mcp interface
  - **Section separators**: Safety levels become visual groupings with warnings
    - Safe (read-only tools)
    - Moderate (create/draft tools)
    - Serious (update/approve tools) - with warning
    - Extreme (delete/void tools) - with strong warning
- **UI Layout**:
  ```
  Xero                                    [Uninstall]
  ─────────────────────────────────────────────────
  Tool permissions           [Always allow ▼]

  ── Safe ──────────────────────────────────────
  get_invoices                    [✓] [👆] [⊘]
  get_bank_transactions           [✓] [👆] [⊘]
  get_profit_loss                 [✓] [👆] [⊘]

  ── Moderate ──────────────────────────────────
  create_invoice_draft            [✓] [👆] [⊘]

  ── Serious ⚠️ ─────────────────────────────────
  approve_invoice                 [✓] [👆] [⊘]
  update_invoice                  [✓] [👆] [⊘]

  ── Extreme ⛔ ─────────────────────────────────
  void_invoice                    [✓] [👆] [⊘]
  delete_invoice                  [✓] [👆] [⊘]
  ```
- **Database Changes**:
  - New `tool_permissions` table: (user_id, connector, tool_name, permission)
  - permission: 'always' | 'approval' | 'blocked'
- **Acceptance Criteria**:
  - [ ] Design tool_permissions schema
  - [ ] Create connector detail page with full tool list
  - [ ] Three-tier toggle component per tool
  - [ ] Section separators with safety level labels + warnings
  - [ ] "Always allow" bulk dropdown (sets all tools)
  - [ ] MCP server checks permissions before tool execution
  - [ ] "Needs approval" shows confirmation dialog before execution
- **Complexity**: 3.5/5 (Medium-High)
- **Replaces**: Current safety level dropdown (issue_004 enhancement)
- **Reference**: Claude.ai connector tool permissions UI (screenshot provided)

#### issue_033: Chat Input Area Redesign (Claude.ai Pattern)
- **Status**: 🟢 Resolved
- **Priority**: P0 (Critical - top priority UX upgrade)
- **Component**: `packages/pwa-app` (ChatPage.tsx, ChatInputArea.tsx)
- **Created**: 2025-12-02
- **Resolved**: 2025-12-02
- **Description**: Redesign chat input area to match Claude.ai pattern with contextual icons and menus
- **Implementation**:
  - Created `ChatInputArea.tsx` component (~450 lines)
  - Integrated into ChatPage.tsx (replaces both empty state and footer inputs)
  - Build passes, TypeScript compiles cleanly
- **Components Built**:
  1. **AttachmentButton** (`+` icon) - File picker menu with "Upload file" option
  2. **AttachmentMenu** - Dropdown menu for attachment options
  3. **ToolsMenu** (`≡` icon) - Dropdown with:
     - Use style → submenu (Normal, Formal, Concise, Explanatory, Learning)
     - Memory toggle with visual on/off state
     - Connectors section showing Xero status
     - Settings link
  4. **AttachmentPreview** - File cards above input with [×] dismiss
  5. **ModelSelector** - Placeholder dropdown (shows "Claude" with chevron)
- **Acceptance Criteria**:
  - [x] `+` attachment button with menu (Upload file, Use project)
  - [x] `≡` tools menu with feature toggles and connectors
  - [x] Attachment preview area with hover-dismiss
  - [x] Quick toggle (Memory toggle in tools menu)
  - [x] Model selector dropdown placeholder (right side)
  - [x] Tooltips on all icon buttons
  - [x] Settings access via tools menu
- **Remaining Work** (future issues):
  - Actual file upload backend integration (Epic 2.4)
  - Model selector with actual model switching (per spike_m2_004)
  - Quick toggle buttons outside menu (if needed)
  - Voice input/output icons (spike_m2_005)
- **Consolidates**:
  - Epic 2.4 (Per-Chat Document Upload) - UI ready, backend needed
  - issue_028 (Connectors Menu) - Xero status shown in tools menu
- **Complexity**: 3.5/5 (Medium-High - multiple components)
- **Files Changed**:
  - `packages/pwa-app/src/components/ChatInputArea.tsx` (NEW)
  - `packages/pwa-app/src/pages/ChatPage.tsx` (modified)

#### issue_034: Skills System - Report Templates & Agent Capabilities
- **Status**: 🔴 Open
- **Priority**: P1 (High - differentiator feature)
- **Component**: `packages/core`, `packages/server`, `packages/pwa-app`
- **Created**: 2025-12-02
- **Description**: Implement a skills system (like Claude Code) for report templates and agent capabilities that users can activate and customize.
- **Inspiration**: Claude Code's skills system where specialized knowledge/workflows can be loaded on demand
- **Two-Tier Architecture**:
  ```
  ┌─────────────────────────────────────────────────────────┐
  │  SYSTEM SKILLS (curated by maintainers)                 │
  │  ├── report-profit-loss     (P&L report template)       │
  │  ├── report-cash-flow       (Cash flow analysis)        │
  │  ├── report-aged-receivables (Outstanding invoices)     │
  │  ├── report-monthly-summary  (Month-end summary)        │
  │  ├── report-tax-preparation  (BAS/tax ready report)     │
  │  └── analysis-can-i-afford   (Affordability check)      │
  ├─────────────────────────────────────────────────────────┤
  │  USER SKILLS (personal customizations)                  │
  │  ├── my-weekly-summary      (custom weekly format)      │
  │  ├── client-invoice-style   (branded invoice format)    │
  │  └── earthworks-kpi-report  (project-specific KPIs)     │
  └─────────────────────────────────────────────────────────┘
  ```
- **Skill Structure**:
  ```typescript
  interface Skill {
    id: string;
    name: string;
    description: string;
    scope: 'system' | 'user';
    userId?: string;           // null for system skills
    projectId?: string;        // optional project scope
    triggerPhrases: string[];  // "make me a P&L report", "show profit and loss"
    promptTemplate: string;    // System prompt injection
    outputFormat?: string;     // Markdown template for consistent output
    requiredTools?: string[];  // Xero tools needed
    createdAt: number;
    updatedAt: number;
  }
  ```
- **Example System Skill** (P&L Report):
  ```yaml
  id: report-profit-loss
  name: Profit & Loss Report
  triggerPhrases:
    - "P&L report"
    - "profit and loss"
    - "income statement"
  promptTemplate: |
    When generating a P&L report, follow this structure:
    1. Fetch data using get_profit_and_loss tool
    2. Present in this format:
       ## Profit & Loss: {period}
       ### Revenue
       - {line items with amounts}
       ### Expenses
       - {line items with amounts}
       ### Summary
       - **Gross Profit**: {amount}
       - **Net Profit**: {amount}
       - **Profit Margin**: {percentage}
    3. Include trend comparison if previous period available
    4. Highlight unusual variances (>20% change)
  ```
- **User Skill Creation Flow**:
  1. User creates skill in Settings → Skills
  2. Define trigger phrases and output format
  3. Optionally scope to specific project
  4. Skill injected into system prompt when triggered
- **Agent Integration**:
  - On message, check for skill trigger phrases
  - If matched, inject skill's promptTemplate into system prompt
  - Track skill usage for analytics ("level up" metrics)
- **UI Components**:
  - Settings → Skills page (list, create, edit, delete)
  - Skill cards with enable/disable toggle
  - "Skill activated" indicator in chat when skill is used
  - Skill marketplace (future - community sharing)
- **Database Schema**:
  ```sql
  CREATE TABLE skills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    scope TEXT NOT NULL CHECK (scope IN ('system', 'user')),
    user_id TEXT,
    project_id TEXT,
    trigger_phrases TEXT NOT NULL,  -- JSON array
    prompt_template TEXT NOT NULL,
    output_format TEXT,
    required_tools TEXT,            -- JSON array
    enabled BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (project_id) REFERENCES projects(id)
  );
  ```
- **Acceptance Criteria**:
  - [ ] Design skills schema and seed system skills
  - [ ] Skill trigger detection in agent orchestrator
  - [ ] System prompt injection when skill activated
  - [ ] Skills settings page (CRUD for user skills)
  - [ ] System skills displayed (read-only, enable/disable)
  - [ ] "Skill used" indicator in chat response
  - [ ] Usage tracking for analytics
- **Starter System Skills**:
  1. `report-profit-loss` - P&L with variance analysis
  2. `report-cash-flow` - Cash flow statement
  3. `report-aged-receivables` - Outstanding invoices by age
  4. `report-monthly-summary` - Month-end financial summary
  5. `analysis-can-i-afford` - "Can I afford X?" decision framework
- **Complexity**: 3.5/5 (Medium-High - new subsystem)
- **Spike Required**: Research Claude Code skills implementation patterns
- **Future Extensions**:
  - Skill marketplace (share/import from other users)
  - Skill versioning
  - Skill dependencies (one skill can use another)
  - AI-assisted skill creation ("Create a skill that...")

#### issue_031: Memory Query Schema Mismatch
- **Status**: 🟢 Resolved
- **Priority**: - (Complete)
- **Component**: `packages/pip-mcp/src/services/memory.ts`
- **Created**: 2025-12-02
- **Resolved**: 2025-12-02
- **Description**: Memory operations failing with "no such column: content"
- **Root Cause**: Code referenced `content` but schema uses `observation` column
- **Resolution**: Changed all `content` → `observation` in SQL queries (SELECT, INSERT, DELETE) and schema definition
- **Scope**: All CRUD operations - createEntities, addObservations, deleteObservations, deleteUserEdit, getUserEdits
- **Discovered via**: Claude.ai MCP connector testing (read issue found first, then write issue discovered during testing)

#### issue_029: MCP Auth Flow - Missing OAuth Env Vars
- **Status**: 🟢 Resolved
- **Priority**: - (Complete)
- **Component**: `packages/pip-mcp`, `deploy/deploy.sh`
- **Created**: 2025-12-02
- **Resolved**: 2025-12-02
- **Description**: MCP OAuth flow returning `invalid_client` error
- **Root Causes Found**:
  1. Email typo: User registered as `samuelroda` but typing `samuelrodda`
  2. Missing env vars: `MCP_OAUTH_CLIENT_ID` and `MCP_OAUTH_CLIENT_SECRET` not passed to container
- **Resolution**:
  - Fixed email in database
  - Added OAuth env vars to `deploy/deploy.sh` for pip-mcp container
- **Commit**: `b46a301`

#### issue_023: Edge Cases - Empty Chat + Memory Retrieval
- **Status**: 🟢 Resolved
- **Priority**: - (Complete)
- **Component**: `packages/server`, `packages/agent-core`
- **Discovered**: 2025-12-02
- **Resolved**: 2025-12-10
- **Description**: Multiple edge cases discovered during testing that need investigation.
- **Symptoms** (reported):
  1. **Empty chat delete fails**: Created a chat, didn't use it. Tried to delete → got error.
  2. **Memory not retrieved**: User has existing memory entry but Pip says "This is our first conversation".
- **Resolution**:
  - Both issues confirmed working correctly as of 2025-12-10
  - Empty chat delete: Works (no repro)
  - Memory retrieval: Works - pip-mcp creates correct schema with `project_id` column, memory is retrieved and injected into system prompt
- **Technical Note**: The `core` package schema was missing `project_id` in memory_entities, but pip-mcp creates the correct schema with `project_id`, so the orchestrator query works correctly.
- **Related**: Epic 2.1 (Memory Architecture), Epic 2.2 (Chat History)

#### issue_024: DESIGN.md Enhancement - Visual Reference Workflow
- **Status**: 🔴 Open
- **Priority**: P3 (Low - future enhancement for new projects)
- **Component**: `docs/UI-UX-DESIGN-PHILOSOPHY.md`, `docs/DESIGN.md`
- **Created**: 2025-12-02
- **Description**: Implement visual reference-based design direction workflow for future frontend projects.
- **Context**:
  - `blueprint-workflow-orchestrator` v2.2.0 added Step 1b: Design Direction
  - Playwright MCP added to lazy-mcp for visual exploration
  - Visual references > text descriptions for establishing design language
- **Workflow** (from orchestrator):
  1. Ask user for 2-3 design examples (URLs or screenshots)
  2. Use Playwright (CLI preferred, MCP fallback) to explore websites
  3. Extract visual patterns: typography, colors, layout, components
  4. Pass `design_references` to DESIGN.md population step
  5. Validate against `improving-visuals` anti-slop checklist
- **For Pip PWA**:
  - [ ] Create `DESIGN.md` document capturing current design system
  - [ ] Document arc-* color palette and token mapping
  - [ ] Extract typography choices (JetBrains Mono, etc.)
  - [ ] Document component patterns (buttons, forms, cards)
  - [ ] Add anti-slop checklist validation
- **Tools Available**:
  - Playwright CLI: `playwright screenshot <url> screenshot.png --full-page`
  - Playwright MCP: `browser_navigate`, `browser_take_screenshot`, `browser_snapshot`
- **Related Skills**:
  - `frontend-aesthetics` (proactive anti-slop guidance)
  - `improving-visuals` (8-dimension rubric assessment)
- **Notes**: Apply to Pip when doing major UI work. For now, current design works well.

#### issue_021: Verify Response Styles in Chat
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - feature validation)
- **Component**: `packages/agent-core`, `packages/pwa-app`
- **Description**: Test that Response Styles actually modify Pip's chat responses as intended.
- **Test Plan**:
  - [ ] Set style to "Formal" → Ask a question → Verify professional tone, no contractions
  - [ ] Set style to "Concise" → Ask same question → Verify shorter, bullet-point response
  - [ ] Set style to "Explanatory" → Ask same question → Verify detailed reasoning
  - [ ] Set style to "Learning" → Ask same question → Verify educational tone, defines terms
  - [ ] Set style back to "Normal" → Verify default balanced response
- **Notes**: UI dropdown deployed and working (verified 2025-12-02). Need manual testing of actual response behavior.

#### issue_003: Email Verification for Sign-Up
- **Status**: 🔴 Open
- **Priority**: P3 (Low - deferred)
- **Component**: `packages/pip-mcp` (OAuth sign-up)
- **Description**: Add email verification before account activation
- **Options**:
  - Resend (3000/month free)
  - SendGrid (100/day free)
  - Postmark (100/month free)
- **Acceptance Criteria**:
  - [ ] User signs up → receives verification email
  - [ ] User clicks link → account activated
  - [ ] Cannot use Pip until verified
- **Notes**: Deferred - invite codes provide sufficient access control for beta. Implement before public launch.

#### issue_004: Safety Guardrails for Write Operations
- **Status**: ✅ Resolved
- **Priority**: P2 (Complete)
- **Component**: `packages/pip-mcp`, `packages/core`, `packages/server`, `packages/pwa-app`
- **Spec**: `specs/SAFETY-ARCHITECTURE.md`
- **Description**: Implement tiered permission model to prevent AI from accidentally destroying Xero data
- **Why Critical**: Xero has NO user-accessible restore. Deleted/voided data is permanently lost.
- **Implementation Complete** (2025-11-30):
  - `packages/core/src/database/types.ts`: UserSettings, OperationSnapshot types
  - `packages/core/src/database/providers/sqlite.ts`: Tables + CRUD methods
  - `packages/pip-mcp/src/services/safety.ts`: Permission check service
  - `packages/pip-mcp/src/index.ts`: Tool execution guards + visibility filtering
  - `packages/server/src/routes/settings.ts`: API endpoints for settings
  - `packages/pwa-app/src/pages/SettingsPage.tsx`: Settings UI with permission level selector
- **Acceptance Criteria**:
  - [x] Database tables: user_settings, operation_snapshots
  - [x] Permission levels: Read-only (default), Create drafts, Approve/Update, Delete/Void
  - [x] Pre-operation snapshots (data model ready)
  - [x] Dynamic tool visibility based on permission level
  - [x] Settings UI in PWA
- **Resolution**: All safety guardrails implemented. Users can configure permission levels via PWA settings page.

#### issue_005: ChatGPT Memory Disabled in Developer Mode
- **Status**: ✅ Resolved (Native memory works)
- **Priority**: - (Complete)
- **Component**: `packages/pip-mcp` (memory-native.ts)
- **Resolved**: 2025-11-30
- **Description**: ChatGPT disables memory when MCP connectors are used in Developer Mode
- **Solution**: Implemented native memory with text-based search (bypasses ChatGPT memory limitation)
- **Acceptance Criteria**:
  - [x] Research memory approaches (mem0, SQLite, vector DB) - spike_mem0 COMPLETE
  - [x] Add memory tools to MCP - DEPLOYED (add, search, list, delete, delete_all)
  - [x] **Test memory tools via Claude.ai** - WORKING (80% relevance)
  - [x] **Test memory tools via ChatGPT Dev Mode** - WORKING (80% relevance)
  - [ ] Add memory management UI to PWA (deferred)
- **Notes**: Memory stack enables "Pip knows me" for Plus users. ChatGPT requires meta-tool pattern.

#### issue_006: Google Docs Integration
- **Status**: 🔴 Open
- **Priority**: P3 (Low - future enhancement)
- **Component**: `packages/pip-mcp`
- **Description**: Allow users to connect Google Docs to Pip for business context
- **Use Case**: Users store business plans, KPIs, meeting notes in Google Docs. Connecting these would enrich Pip's context without manual file uploads.
- **Acceptance Criteria**:
  - [ ] Google OAuth integration
  - [ ] Google Docs API read access
  - [ ] Document sync/indexing
  - [ ] Context injection from connected docs
- **Notes**: Common request - many SMBs use Google Workspace. Consider Google Drive broader integration.

#### issue_009: Interactive Demo Mode with Xero Demo Organisation
- **Status**: 🔴 Open
- **Priority**: P2 (Medium - improves landing page conversion)
- **Component**: `packages/pip-mcp`, `landing-page.html`
- **Description**: Add interactive demo using Xero's demo organisation data so visitors can try Pip without connecting their own Xero
- **Use Case**: Landing page "See Demo" button could let users ask real questions against sample data, reducing friction to understand value
- **Research Required**:
  - [ ] How to access Xero Demo Company API (read-only)
  - [ ] Can we use a shared demo org or need per-session?
  - [ ] Rate limits on demo org queries
- **Acceptance Criteria**:
  - [ ] "Try Demo" button on landing page
  - [ ] Pre-authenticated demo session with sample Xero data
  - [ ] Users can ask questions without sign-up
  - [ ] Clear indication this is demo data, not their real books
- **Notes**: Xero provides demo companies for testing. This could dramatically improve landing page conversion by showing real value before sign-up.

#### issue_007: Nextcloud Integration
- **Status**: 🔴 Open
- **Priority**: P3 (Low - future enhancement)
- **Component**: `packages/pip-mcp`
- **Description**: Allow users to connect Nextcloud for business context (open source alternative)
- **Use Case**: Support open source community who prefer self-hosted solutions. Nextcloud is popular for privacy-conscious businesses.
- **Acceptance Criteria**:
  - [ ] Nextcloud OAuth/API integration
  - [ ] Document sync from Nextcloud Files
  - [ ] Support for Nextcloud Notes
  - [ ] Context injection from connected docs
- **Notes**: Aligns with Pip's self-hostable philosophy. Good for privacy-focused users and FOSS community.

#### issue_000: Business Context Layer
- **Status**: 🟡 In Progress (Blueprint created)
- **Priority**: P1
- **Component**: `packages/agent-core`
- **Blueprint Reference**: Epic 1 (features 1.1-1.4)
- **Description**: Add business context ingestion so agent can answer questions requiring both financial data AND business knowledge
- **Acceptance Criteria**:
  - [ ] Document upload/ingestion mechanism (feature_1_1)
  - [ ] Context chunking & summarization (feature_1_2)
  - [ ] Context injection into prompts (feature_1_3)
  - [ ] Can answer: "Can I afford to hire?", "Am I on track for goals?" (feature_1_4)
- **Notes**: Core differentiator vs JAX (Xero AI). Full blueprint at `specs/BLUEPRINT.yaml`

#### issue_001: PWA Connect Button Loading State
- **Status**: 🔴 Open
- **Priority**: P2
- **Component**: `packages/pwa-app`
- **Description**: Connect to Xero button needs better visual feedback during OAuth flow
- **Acceptance Criteria**:
  - [ ] Loading spinner during redirect
  - [ ] Disable button while connecting
  - [ ] Clear error state display
- **Notes**: Basic implementation exists, needs polish before demo

#### issue_002: Chat Message Timestamps
- **Status**: 🔴 Open
- **Priority**: P3
- **Component**: `packages/pwa-app`
- **Description**: Add timestamps to chat messages for better UX
- **Acceptance Criteria**:
  - [ ] Display relative time (e.g., "2 min ago")
  - [ ] Show full timestamp on hover
  - [ ] Consistent formatting
- **Notes**: Low priority, nice-to-have for demo

---

### Milestone 2 Features (Planned 2025-12-01)

*Blueprint: `specs/BLUEPRINT-project-milestone2-ux-personality-20251201.yaml`*

#### issue_011: Memory Architecture Refactor (Epic 2.1)
- **Status**: 🟢 Resolved
- **Priority**: - (Complete)
- **Resolved**: 2025-12-01
- **Component**: `packages/pip-mcp` (memory.ts, memory-tools.ts)
- **Blueprint**: feature_2_1_1 through feature_2_1_5
- **UX Reference**: `specs/spike-outputs/UX-PATTERNS-CLAUDE-AI-REFERENCE-20251201.md` (Pattern 0.7)
- **Description**: Align memory implementation with Anthropic + Claude.ai patterns.
- **Analysis Complete** (2025-12-01):
  - Current `memory.ts` (~394 lines) already aligns with Anthropic approach ✅
  - Knowledge graph structure (entities, relations, observations) ✅
  - Text-based search working ✅
  - User/project isolation built in ✅
- **Gap Identified**: Missing Claude.ai UI/UX patterns:
  - `is_user_edit` flag on observations
  - `memory_summaries` table for prose summaries
  - Summary generation (on-demand/nightly)
  - Memory management API + UI
  - Detection of explicit user requests ("remember that...")
- **Acceptance Criteria**:
  - [x] Review Anthropic MCP Memory Server reference implementation
  - [x] Audit current memory-native.ts (renamed to memory.ts)
  - [x] Document Claude.ai Pattern 0.7 (single memory with tracked edits)
  - [x] Add `is_user_edit` column to observations
  - [x] Create `memory_summaries` table
  - [x] Implement Memory Management API
  - [x] Build Memory Management UI
  - [x] Integration testing on Claude.ai + ChatGPT
- **Complexity**: 2.0-2.8/5 (Medium)
- **Resolution**: All features deployed. Memory Management UI accessible via Settings → Manage memory. See commits `8394d02`, `2566a3d`.

#### issue_012: Chat History (Epic 2.2)
- **Status**: 🟢 Resolved
- **Priority**: - (Complete)
- **Resolved**: 2025-12-01
- **Component**: `packages/server`, `packages/pwa-app`, `packages/core`
- **Blueprint**: feature_2_2_1, feature_2_2_2
- **Description**: Persistent conversation history with vertical tabs sidebar (standard UX pattern like Claude.ai)
- **Acceptance Criteria**:
  - [x] Extend sessions table (title, preview_text columns)
  - [x] Chat title auto-generation from first user message (~50 chars)
  - [x] API endpoints: GET /api/sessions, GET/:id, PATCH/:id, DELETE/:id
  - [x] Collapsible left sidebar component (ChatSidebar.tsx)
  - [x] Chat list with metadata (title, preview, relative timestamp)
  - [x] New chat (+) and delete actions
  - [x] Chat switching with state persistence (Zustand store)
- **Complexity**: 2.5-3.0/5 (Medium-High)
- **Resolution**: Deployed with collapsible sidebar following Claude.ai Pattern 0. See commit `9699c96`.

#### issue_013: Projects Feature (Epic 2.3)
- **Status**: ✅ Resolved
- **Priority**: P1 (High - differentiator)
- **Component**: `packages/server`, `packages/pwa-app`, `packages/core`, `packages/agent-core`
- **Blueprint**: feature_2_3_1 through feature_2_3_4
- **Description**: Isolated context per project/client. Global context still applies, but project-specific details don't bleed across projects. Like Claude.ai Projects with cross-project reference capability.
- **Use Cases**:
  - Different Xero organizations per project
  - Client isolation for accountants
  - Project-specific memory and documents
- **Acceptance Criteria**:
  - [x] Projects schema design and CRUD operations (SQLite)
  - [x] Projects REST API (`/api/projects/*`)
  - [x] Project switcher dropdown in header (ProjectSwitcher.tsx)
  - [x] Session filtering by projectId
  - [x] **Chat ↔ Project Integration** (2025-12-02)
    - Chat API accepts projectId parameter
    - Sessions created with project scope
    - Chat list filters by current project
    - Project switch refreshes chat list
  - [x] **Project Settings Page** (2025-12-02)
    - Collapsible panel in Settings (/settings#projects)
    - Inline editing (name, description)
    - Color picker (8 presets)
    - Set default / delete with confirmation
  - [ ] Multi-Xero org support (per-project OAuth tokens) - **deferred to future**
  - [ ] Cross-project reference capability - **deferred to future** (spike complete)
  - [ ] Project context indicator in chat UI - **nice-to-have**
- **Complexity**: 2.2-3.2/5
- **Spike**: spike_m2_001 for cross-project reference patterns
- **Resolution**: Core projects feature complete. Multi-Xero org and cross-project reference deferred to future work.
- **Commits**: `609c952` - Initial implementation (schema, API, UI)

#### issue_014: Per-Chat Document Upload (Epic 2.4)
- **Status**: 🔴 Open (spike complete - ready to implement)
- **Priority**: P2 (Medium - UX improvement)
- **Component**: `packages/pwa-app`, `packages/pip-mcp`
- **Blueprint**: feature_2_4_1 through feature_2_4_3
- **Description**: Plus (+) icon in chat for attachments (standard UX pattern). Document preview below chat input field.
- **Spike**: spike_m2_002 ✅ COMPLETE - Decision: Keep React, use react-dropzone
- **Acceptance Criteria**:
  - [x] Complete React refactor assessment spike first
  - [ ] Design session_documents schema and storage strategy
  - [ ] File upload API with validation and size limits
  - [ ] Plus (+) icon attachment button with drag-and-drop (use react-dropzone)
  - [ ] Document preview component below chat input
  - [ ] Documents list in sidebar with download/delete
- **Complexity**: 2.0-2.8/5 (Medium)
- **Unblocked By**: spike_m2_002 (2025-12-01)

#### issue_015: Pip's Voice/Personality (Epic 2.5)
- **Status**: 🔵 Deferred (replaced by issue_020)
- **Priority**: P3 (Future - not MVP critical)
- **Component**: `packages/pip-mcp` (system prompts), `packages/core/src/personalities/`
- **Blueprint**: feature_2_5_1 through feature_2_5_5
- **Description**: Switchable character personalities that can change mid-chat without losing context.
- **Spike Complete** (spike_m2_003): ✅
  - Literary analysis, Grok modes research, personality schema defined
  - Adelaide and Pippin profiles created in `packages/core/src/personalities/`
  - `buildPersonalityPrompt()` function implemented
- **Option A - Adelaide Bookkeeper**: Professional, approachable, no jargon
- **Option B - Pippin (LOTR-inspired)**: Playful, warm, surprisingly competent
- **Deferred Reason** (2025-12-02):
  - "Personality" terminology is assumptive - implies the tool has its own character
  - Could scare off business users who want a reliable assistant, not an employee to understand
  - Better approach: Start with neutral "Styles" (issue_020), personality can layer on top later
- **Preserved Assets**:
  - `packages/core/src/personalities/adelaide.ts` - Profile for future use
  - `packages/core/src/personalities/pippin.ts` - Profile for future use
  - `buildPersonalityPrompt()` infrastructure ready
- **Notes**: Not deleted - deferred to post-Styles implementation. Could become premium feature.

#### issue_020: Response Styles (Claude.ai Pattern)
- **Status**: 🟢 Complete
- **Priority**: - (Deployed)
- **Resolved**: 2025-12-02
- **Component**: `packages/pwa-app`, `packages/server`, `packages/core`, `packages/agent-core`
- **Description**: Implement response style selector modeled after Claude.ai's style system (Formal, Explanatory, Concise, Learning, Normal).
- **Rationale**:
  - "Styles" puts control in user's hands (vs "Personality" which implies AI character)
  - More neutral/professional for business tool
  - Could integrate with memory in future (remember style preferences)
  - Direct user request - standard UX pattern from Claude.ai
- **Reference**: Claude.ai Settings → Response Styles dropdown
- **Styles Implemented**:
  - **Normal** (default): Balanced, natural responses
  - **Formal**: Professional tone, complete sentences
  - **Concise**: Brief, to-the-point answers
  - **Explanatory**: Detailed with context and reasoning
  - **Learning**: Educational, explains concepts
- **Acceptance Criteria**:
  - [x] Add `response_style` column to user_settings table
  - [x] Create style definitions (system prompt modifiers)
  - [x] Style selector in Settings page (dropdown matching Claude.ai UI)
  - [x] Apply style to system prompt in agent orchestrator
  - [x] Persist style preference per user
  - [ ] Optional: Quick style toggle in chat header (deferred)
- **Complexity**: 2.0/5 (Low-Medium - simpler than full personality system)
- **Implementation**:
  - `packages/core/src/styles/index.ts` - Style definitions with prompt modifiers
  - `packages/core/src/database/types.ts` - ResponseStyleId type
  - `packages/core/src/database/providers/sqlite.ts` - Migration + CRUD
  - `packages/server/src/routes/settings.ts` - GET /api/settings/styles endpoint
  - `packages/pwa-app/src/pages/SettingsPage.tsx` - Dropdown selector
  - `packages/agent-core/src/orchestrator.ts` - Style injection into system prompt
- **Commit**: `e897c44`

---

## Flagged Items (From Blueprint Assessment)

Items flagged by `improving-plans` skill as requiring decomposition or spike tasks before implementation.

### ⚠️ flag_001: Chunking Strategy Implementation
- **Status**: ⚠️ Flagged for decomposition
- **Task ID**: task_1_2_1
- **Complexity**: 3.5/5 (High)
- **Component**: `packages/agent-core/src/context`
- **Reason**: Uncertainty=4 around optimal chunking strategy
- **Decomposition Pattern**: Spike/Investigation First (Pattern 4)
- **Required Spike**: task_1_2_0 (Chunking Strategy Spike)
- **Acceptance Criteria**:
  - [ ] Complete task_1_2_0 spike first
  - [ ] Test chunking strategies with real documents
  - [ ] Reduce uncertainty from 4 → 2 before implementation
- **Notes**: Do NOT implement until spike completes and approach is validated

### ⚠️ flag_002: Chatterbox Self-Hosting Setup
- **Status**: ⚠️ Flagged for decomposition
- **Task ID**: task_3_2_1
- **Complexity**: 3.5/5 (High)
- **Component**: `packages/server/src/voice`
- **Reason**: Risk=4 due to VPS 384MB memory constraint
- **Decomposition Pattern**: Spike/Investigation First (Pattern 4)
- **Required Spike**: task_3_2_0 (Chatterbox Deployment Feasibility Spike)
- **Acceptance Criteria**:
  - [ ] Complete task_3_2_0 spike first
  - [ ] Test Chatterbox on VPS (CPU-only, 384MB constraint)
  - [ ] Decision: shared VPS vs dedicated instance vs cloud GPU
- **Notes**: High risk - may need fallback to cloud TTS API if VPS insufficient

---

## Spike Tasks Required

Research/investigation tasks that must complete before dependent implementation tasks.

### Milestone 2 Spikes

#### spike_m2_001: Cross-Project Reference Capability Research
- **Status**: ✅ Complete
- **Duration**: 2 days (completed in <1 day)
- **Completed**: 2025-12-01
- **Priority**: - (Done - unblocks feature_2_3_3)
- **Reduces Uncertainty For**: task_2_3_3_1, task_2_3_3_2
- **Blueprint**: `specs/BLUEPRINT-spike-cross-project-reference-20251201.yaml`
- **Description**: Research patterns for cross-project data access (like Claude Code referencing other repos)
- **Research Sources**: Claude Code (`--add-dir`), VS Code (multi-root workspaces), Notion (relations), Xero (multi-org), SaaS multi-tenant patterns
- **Deliverables**:
  - [x] Research report: `docs/research-notes/SPIKE-m2-001-cross-project-patterns.md`
  - [x] API design: `specs/spike-outputs/CROSS-PROJECT-API-DESIGN-20251201.md`
  - [x] POC: `search_nodes` tool extended with `projectIds` parameter
- **Key Decisions**:
  - **Pattern**: Query-time project parameter (like Claude Code's explicit paths)
  - **Access**: Read-only, owner-only (MVP)
  - **Validation**: Max 5 projects per query
  - **Ownership check**: TODO when Projects feature implemented
- **Uncertainty**: Reduced from 4 → 2 ✅

#### spike_m2_002: React.js Refactor Assessment for File Uploads
- **Status**: ✅ Complete
- **Duration**: 2 days (completed in 1)
- **Completed**: 2025-12-01
- **Priority**: - (Done - unblocks feature_2_4_2, feature_2_4_3)
- **Reduces Uncertainty For**: feature_2_4_2, feature_2_4_3
- **Blueprint**: feature_4_1 spike
- **Description**: Evaluate current Vite PWA architecture's file upload capabilities vs React refactor
- **Deliverables**:
  - [x] Analysis of current Vite PWA file upload capabilities
  - [x] Cost-benefit analysis: React refactor vs incremental enhancement
  - [x] Recommendation with implementation approach
- **Decision**: **KEEP REACT** - No framework migration needed
- **Key Findings**:
  - ChatGPT uses React + Next.js
  - Claude Code uses TypeScript + React (Ink) + Bun
  - Anthropic hiring requires "React development expertise"
  - Migration cost (3-5 weeks) not justified
- **File Upload Recommendation**: react-dropzone for + icon UX
- **Output**: `docs/research-notes/SPIKE-m2-002-react-refactor-assessment.md`

#### spike_m2_004: Multi-Model LLM Architecture Research
- **Status**: ✅ Complete
- **Duration**: 1 day (time-boxed 3-5 days)
- **Completed**: 2025-12-01
- **Priority**: - (Done - foundation for multi-model support)
- **Reduces Uncertainty For**: Future multi-model support implementation
- **Blueprint**: `specs/archive/BLUEPRINT-spike-multi-model-architecture-20251201.yaml`
- **Description**: Research optimal architecture for LiteLLM proxy, Tailscale+Ollama connectivity, PWA model selector, and model-agnostic MCP design.
- **Deliverables**:
  - [x] Architecture Decision Document (LiteLLM strategy, Tailscale pattern, PWA integration)
  - [x] LiteLLM Configuration POC (Anthropic + OpenAI + Ollama routing)
  - [x] Tailscale + Ollama Connectivity Test (latency measurements, offline handling)
  - [x] PWA Model Selector Mockup (UI/UX design, state management)
  - [x] Cost/Performance Comparison Matrix (5+ models, function calling support)
- **Outputs**:
  - `specs/spike-outputs/ADR-MULTI-MODEL-ARCHITECTURE-20251201.md`
  - `specs/spike-outputs/COST-PERFORMANCE-MATRIX-20251201.md`
  - `specs/spike-outputs/PWA-MODEL-SELECTOR-DESIGN-20251201.md`
  - `/opt/litellm/` on VPS - LiteLLM proxy with 5 models
- **Key Findings**:
  - LiteLLM standalone with host networking (for Tailscale access)
  - Ollama warm latency: 238ms (excellent), cold: 14s (needs warm-up strategy)
  - MCP server is already model-agnostic, no changes needed
  - Recommendations: Claude Sonnet 4 (primary), Haiku (fast), GPT-4o (fallback), Ollama (offline)
- **Follow-up**: issue_017 - Ollama Model Warm-Up Strategy

#### spike_m2_005: Voice Input/Output Research (STT/TTS)
- **Status**: 🔴 Not Started
- **Duration**: 2-3 days (time-boxed)
- **Priority**: P3 (Future - nice-to-have)
- **Reduces Uncertainty For**: issue_033 (voice input icon)
- **Description**: Research speech-to-text and text-to-speech options for voice interaction
- **Research Areas**:
  - **STT Options**:
    - Whisper (OpenAI) - local vs API
    - Whisper.cpp - CPU-optimized local inference
    - Browser Web Speech API - zero dependency
  - **TTS Options**:
    - Chatterbox (resemble-ai) - open source, natural voice
    - ElevenLabs API - high quality, paid
    - Browser Speech Synthesis API - zero dependency
  - **Integration Questions**:
    - Real-time vs batch transcription?
    - VPS processing vs client-side?
    - Latency requirements for conversational UX?
- **Deliverables**:
  - [ ] STT comparison matrix (quality, latency, cost, local vs cloud)
  - [ ] TTS comparison matrix (naturalness, latency, cost)
  - [ ] Recommended architecture (where processing happens)
  - [ ] POC: Whisper + Chatterbox integration
- **Blocks**: Voice features in issue_033

#### spike_m2_003: Character Voice Methodology Research
- **Status**: ✅ Complete
- **Duration**: 1 day (estimated 3 days)
- **Completed**: 2025-12-01
- **Priority**: - (Done - unblocks feature_2_5_2, feature_2_5_3)
- **Reduces Uncertainty For**: feature_2_5_2, feature_2_5_3, feature_2_5_4
- **Blueprint**: feature_5_1 spike
- **Description**: Research how to objectively define character personalities for LLM system prompts
- **Deliverables**:
  - [x] Literary analysis of character voice techniques from novels
  - [x] Grok speech modes comparison and pattern identification
  - [x] Voice profile schema and prompt structure template
  - [x] Test implementation with Adelaide and Pippin profiles
- **Output**: `docs/research-notes/SPIKE-character-voice-methodology.md`
- **Implementation**:
  - `packages/core/src/database/types.ts` - Personality types
  - `packages/core/src/personalities/adelaide.ts` - Adelaide profile
  - `packages/core/src/personalities/pippin.ts` - Pippin profile
  - `packages/core/src/personalities/index.ts` - buildPersonalityPrompt()

---

### Legacy Spikes

### spike_001: Chunking Strategy Spike (DEPRIORITIZED)
- **Status**: 🟡 Deprioritized (Mem0 may replace need)
- **Task ID**: task_1_2_0
- **Duration**: 2 days
- **Priority**: P3 (was P1 - Mem0 adoption may eliminate need)
- **Reduces Uncertainty For**: task_1_2_1 (Chunking Strategy Implementation)
- **Deliverables**:
  - [ ] Test semantic chunking with real business documents
  - [ ] Compare fixed-size vs paragraph-based vs heading-based
  - [ ] Determine optimal chunk size (target: 2000 chars with overlap)
  - [ ] Decision document with recommendation
- **Acceptance Criteria**:
  - Uncertainty reduced from 4 → 2 for subsequent tasks
  - Clear chunking algorithm selected with rationale
- **Note**: May be unnecessary if Mem0 handles document context. Evaluate after spike_mem0.

### spike_002: Whisper Deployment Strategy Spike
- **Status**: 🔴 Open
- **Task ID**: task_3_1_0
- **Duration**: 2 days
- **Priority**: P2 (blocks feature_3_1)
- **Reduces Uncertainty For**: task_3_1_2 (Whisper STT Endpoint)
- **Deliverables**:
  - [ ] Test Whisper API latency and cost ($0.006/min)
  - [ ] Test self-hosted Whisper on VPS (memory usage, latency)
  - [ ] Decision matrix: API vs self-hosted
  - [ ] Recommendation document
- **Acceptance Criteria**:
  - Clear decision on Whisper deployment approach
  - Performance benchmarks documented

### spike_003: Chatterbox Deployment Feasibility Spike
- **Status**: 🔴 Open
- **Task ID**: task_3_2_0
- **Duration**: 3 days
- **Priority**: P2 (blocks feature_3_2)
- **Reduces Uncertainty For**: task_3_2_1 (Chatterbox Self-Hosting Setup)
- **Deliverables**:
  - [ ] Test Chatterbox on VPS (CPU-only, 384MB constraint)
  - [ ] Measure latency and memory usage
  - [ ] Evaluate: shared VPS vs dedicated ($5-20/mo) vs cloud GPU ($0.10/hr)
  - [ ] Cost comparison document
  - [ ] Decision document with recommendation
- **Acceptance Criteria**:
  - Clear deployment approach selected
  - Fallback plan if VPS insufficient (e.g., ElevenLabs API)

---

## Technical Debt

#### debt_004: ESLint v9 Flat Config Migration
- **Status**: 🔴 Open
- **Priority**: P3 (Low - lint works locally with IDE plugins)
- **Component**: All packages
- **Description**: ESLint upgraded to v9 which requires flat config (`eslint.config.js`) instead of `.eslintrc.*`
- **Current State**: `pnpm lint` fails across all packages with "ESLint couldn't find an eslint.config.(js|mjs|cjs) file"
- **Acceptance Criteria**:
  - [ ] Migrate each package to eslint.config.js format
  - [ ] Verify `pnpm lint` passes across monorepo
- **Reference**: https://eslint.org/docs/latest/use/configure/migration-guide
- **Notes**: TypeScript compilation (`pnpm build`) provides primary type safety. Lint is secondary quality gate.

#### debt_003: Legacy "pip" Naming Convention
- **Status**: 🟢 Resolved
- **Priority**: - (Complete)
- **Resolved**: 2025-12-01
- **Component**: Multiple (Docker, database, documentation)
- **Description**: Project was rebranded from "Pip" to "Pip" but legacy naming persisted
- **Resolution**:
  - [x] Created `deploy/migrate-naming.sh` for data migration
  - [x] Renamed Docker containers: `pip` → `pip-app`, `pip-mcp`
  - [x] Updated database path: `pip.db` → `pip.db`
  - [x] Updated volume: `pip-data` → `pip-data`
  - [x] Removed unused `pip-network`
  - [x] Updated `deploy/deploy.sh` with new naming
  - [x] Updated `CLAUDE.md` with correct paths
- **Commits**: `24e7419` - migration scripts, `33e3571` - deploy script

#### debt_001: No Formal Test Coverage
- **Status**: 🔴 Open
- **Priority**: P2
- **Component**: All packages
- **Description**: Project relies on manual testing only
- **Acceptance Criteria**:
  - [ ] Unit tests for agent-core
  - [ ] Integration tests for Xero client
  - [ ] E2E tests for PWA
- **Notes**: Defer until after user demo validation

#### debt_002: Legacy GitHub Issues Cleanup
- **Status**: 🟢 Resolved
- **Priority**: P3
- **Description**: 157 legacy GitHub issues from deprecated AWS blueprint
- **Resolution**: All closed 2025-11-27, now using PROGRESS.md + ISSUES.md

---

## Risk Registry

Risks identified during blueprint complexity assessment.

### risk_000: Xero API Pricing Changes (Updated 2025-12-04)
- **Severity**: Medium (was High)
- **Probability**: Certain (pricing change confirmed)
- **Impact**: Free tier drops from 25 → 5 connections on March 2, 2026
- **New Pricing Model** (effective March 2, 2026):
  | Tier | Monthly | Connections | Rate Limit |
  |------|---------|-------------|------------|
  | Starter | Free | 5 | 1,000/day/org |
  | Core | $35 AUD | 50 | 5,000/day/org |
  | Plus | $245 AUD | 1,000 | 5,000/day/org |
- **Key Dates**:
  - Dec 4, 2025: New policy terms (AI/ML training prohibition) - NO IMPACT on Pip
  - Mar 2, 2026: Pricing migration begins (30-day notice before our migration)
- **Mitigation**:
  - Track connected Xero orgs in database
  - Budget $35 AUD/month ($420/year) for Core tier when >5 users
  - No app approval needed - just add payment method for Core tier
- **Acceptance Criteria**:
  - [ ] Add user count check before Xero OAuth
  - [ ] Display upgrade prompt when approaching 5 connections
  - [ ] Track connected org count in admin dashboard
  - [ ] Add payment method to Xero Developer Portal before March 2026
- **Timeline**: Monitor before March 2026; upgrade to Core if >5 beta users
- **AI/ML Policy**: Does NOT affect Pip - we use LLMs for inference, not training
- **Reference**:
  - https://developer.xero.com/pricing
  - `docs/research-notes/XERO-API-PRICING-CHANGES-20251204.md`

### risk_001: VPS Memory Constraint
- **Severity**: High
- **Probability**: Medium
- **Impact**: Cannot self-host Chatterbox TTS
- **Mitigation**: spike_003 (Chatterbox Feasibility Spike)
- **Contingency**: Use cloud TTS API (ElevenLabs $0.18/1000 chars)

### risk_002: Demo Incomplete
- **Severity**: Medium
- **Probability**: Low
- **Impact**: Thursday demo fails to show Business Context Layer
- **Mitigation**: Prioritize features 1.1, 1.3, task 1.4.2 (demo critical path)
- **Contingency**: Demo existing Xero features + explain context vision

### risk_003: Voice Latency Too High
- **Severity**: Medium
- **Probability**: Medium
- **Impact**: Voice conversations feel sluggish (>2s latency)
- **Mitigation**: Performance testing at each pipeline stage
- **Contingency**: Accept higher latency for MVP; optimize post-launch

---

## References

- `CONTRIBUTING.md` - Documentation workflow guide
- `CHANGELOG.md` - Where resolved issues go
- `STATUS.md` - Current work snapshot
