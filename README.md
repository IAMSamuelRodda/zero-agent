# Pip - Your Helpful Finance Assistant

> **Purpose**: Project introduction and quick start guide
> **Lifecycle**: Stable (update when fundamentals change)

Get on top of your finances with simple questions and clear answers, powered by Claude.

**Live Demo**: https://app.pip.arcforge.au
**MCP Server**: https://mcp.pip.arcforge.au (for Claude.ai/ChatGPT)
**Current Work**: See [`STATUS.md`](./STATUS.md)

---

## Overview

Pip is a mobile-first Progressive Web App (PWA) that brings all your financial information together in one place. Ask questions about your money, check what's owed, and get clear insights through simple conversation.

**Key Features:**
- **Simple Questions, Clear Answers** - Ask about your money in plain English
- **Everything in One Place** - Connect your accounting, email, spreadsheets, and more
- **Actionable Advice** - Get practical insights you can actually use
- **Works Everywhere** - Smartphone, tablet, or laptop
- **Own Your Data** - Self-host or use our managed service
- **Bring Your Own Models** - Use Claude, local models, or ChatGPT
- **Zero Setup** - Use from Claude.ai or ChatGPT with one click

---

## Quick Start

### Use the Live Demo

Visit https://app.pip.arcforge.au to try Pip with your Xero account.

### Use with Claude.ai

**Requirements**: Claude Pro, Max, or Team subscription

#### Step 1: Add Custom Connector in Claude.ai

1. Open [Claude.ai](https://claude.ai) and sign in
2. Click your profile icon (bottom-left) → **Settings**
3. Go to **Connectors** tab
4. Click **Add Connector** → **Add custom connector**

#### Step 2: Enter Connection Details

| Field | Value |
|-------|-------|
| **Name** | `Pip by Arc Forge` |
| **URL** | `https://mcp.pip.arcforge.au` |
| **Authentication** | Select `OAuth 2.0` |
| **Client ID** | `pip-mcp-client` |
| **Client Secret** | *(provided separately with your invite)* |

Click **Add** to save.

#### Step 3: Connect Your Account

1. Click **Connect** on the Pip connector
2. You'll be redirected to the Pip sign-in page
3. **New users**: Click "Sign Up" tab, enter your email, password, and invite code
4. **Existing users**: Sign in with your email and password
5. You'll then be redirected to connect your Xero account
6. Authorize Pip to access your Xero organization
7. You'll be redirected back to Claude.ai

#### Step 4: Start Using Pip

In any Claude conversation, try:
- "Who owes me money?"
- "Show me my recent invoices"
- "What's my profit and loss this financial year?"
- "Get my balance sheet"

---

### Use with ChatGPT

**Requirements**: ChatGPT Plus ($20/month) or higher

**Important**: Memory behavior differs by subscription:
- **Business/Teams/Enterprise**: Publish connector for full memory support
- **Plus**: Memory disabled in Developer Mode (see [Memory Guide](./docs/CHATGPT-MEMORY-GUIDE.md))

#### Step 1: Enable Developer Mode

1. Open [ChatGPT](https://chat.openai.com) and sign in
2. Click your profile icon (bottom-left) → **Settings**
3. Go to **Apps & Connectors**
4. Scroll to **Advanced** section
5. Enable **Developer Mode**

#### Step 2: Add Custom Connector

1. In Apps & Connectors, click the **+** button to add a new connector
2. Fill in the connection details:

| Field | Value |
|-------|-------|
| **Name** | `Pip by Arc Forge` |
| **Description** | `Get on top of your finances - simple questions, clear answers` |
| **MCP Server URL** | `https://mcp.pip.arcforge.au` |
| **Authentication** | Select `OAuth` |
| **OAuth Client ID** | `pip-mcp-client` |
| **OAuth Client Secret** | *(provided separately with your invite)* |

3. Check "I understand and want to continue"
4. Click **Create**

#### Step 3: Connect Your Account

1. You'll see the connector in your list showing "Pip by Arc Forge"
2. The OAuth flow will redirect you to sign in/sign up
3. Connect your Xero account when prompted
4. You'll be redirected back to ChatGPT

#### Step 4: Start Using Pip

In any ChatGPT conversation (with Developer Mode badge visible), try:
- "Can you see who owes me money?"
- "Show me my Xero invoices"
- "What's my profit and loss?"
- "Get my organisation details"

---

### Available Tools

Once connected, Pip provides these tools:

**Xero Tools** (read-only):
| Category | Tools |
|----------|-------|
| **Invoices** | `get_invoices`, `get_aged_receivables`, `get_aged_payables` |
| **Reports** | `get_profit_and_loss`, `get_balance_sheet` |
| **Banking** | `get_bank_accounts`, `get_bank_transactions` |
| **Contacts** | `get_contacts`, `search_contacts` |
| **Organisation** | `get_organisation` |
| **Accounts** | `list_accounts` |

**Gmail Tools** (read-only, testing mode):
| Tool | Description |
|------|-------------|
| `search_gmail` | Search emails using Gmail query syntax |
| `get_email_content` | Get full email body and attachments |
| `download_attachment` | Download email attachment |
| `list_email_attachments` | List attachments matching query |

**Google Sheets Tools** (testing mode):
| Tool | Description |
|------|-------------|
| `google_sheets:search_spreadsheets` | Find spreadsheets by name |
| `google_sheets:read_sheet_range` | Read data from a spreadsheet range |
| `google_sheets:write_sheet_range` | Write data to a spreadsheet range |
| `google_sheets:create_spreadsheet` | Create a new spreadsheet |

**Memory Tools** (knowledge graph):
| Tool | Description |
|------|-------------|
| `create_entities` | Store people, businesses, concepts |
| `search_nodes` | Find relevant memories |
| `add_observations` | Add facts to entities |

---

### Troubleshooting

**"Configure" button instead of "Connect"** (Claude.ai)
- The OAuth flow isn't triggering. Check that you entered the correct URL ending in `/sse`

**No invoices showing when you know there are some**
- Check you're connected to the correct Xero organisation
- Invoices must be in "Authorised" status (not Draft) to appear in aged receivables

**OAuth error during sign-up**
- Ensure you have a valid invite code
- Check your email is correctly formatted

**Need an invite code?**
- Contact the Pip team at Arc Forge for beta access

### Run Locally (CLI)

```bash
# 1. Clone and setup
git clone https://github.com/IAMSamuelRodda/pip-by-arc-forge.git
cd pip-by-arc-forge
pnpm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your Anthropic API key and Xero credentials

# 3. Build packages
pnpm build

# 4. Start the server
pnpm --filter @pip/server dev

# 5. Connect to Xero
# Visit http://localhost:3000/auth/xero and authorize

# 6. Start chatting!
pnpm chat
```

See [`CHAT_GUIDE.md`](./CHAT_GUIDE.md) for detailed usage instructions.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker compose up -d

# Check health
curl http://localhost:3000/health
```

---

## Architecture

**Tech Stack:**
- **Frontend**: React + Vite (PWA)
- **Backend**: Express.js (Node.js 20+)
- **Agent**: Native Claude tool calling
- **Integration**: xero-node SDK
- **Database**: SQLite (default) or DynamoDB
- **Hosting**: Docker + Caddy (auto-HTTPS)

**Architecture Pattern:**
```
PWA (React) → Express API → Agent Orchestrator → Xero API
                  ↓               ↓
              SQLite         Claude (Anthropic)
```

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for complete details.

---

## Documentation

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - System architecture, database schema, ADRs
- [`STATUS.md`](./STATUS.md) - Current work, known issues
- [`CONTRIBUTING.md`](./CONTRIBUTING.md) - Workflow, progress tracking
- [`DEVELOPMENT.md`](./DEVELOPMENT.md) - Git workflow, CI/CD, testing
- [`CHANGELOG.md`](./CHANGELOG.md) - Release history
- [`docs/CHATGPT-MEMORY-GUIDE.md`](./docs/CHATGPT-MEMORY-GUIDE.md) - ChatGPT memory with Pip

---

## Testing

```bash
# Run all tests
pnpm test

# Unit tests only
pnpm test:unit

# E2E tests
pnpm test:e2e
```

See [`DEVELOPMENT.md`](./DEVELOPMENT.md) for complete testing setup.

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for workflow guide and best practices.

---

## License

MIT License

---

**Last Updated**: 2025-12-10
