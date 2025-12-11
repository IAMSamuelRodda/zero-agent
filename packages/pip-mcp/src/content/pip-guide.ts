/**
 * Pip Guide Content
 *
 * On-demand context injection for helping users understand how Pip works.
 * Content is organized by topic and loaded only when requested.
 */

export type GuideTopic =
  | "overview"
  | "settings"
  | "connectors"
  | "permissions"
  | "memory"
  | "troubleshooting";

export const GUIDE_TOPICS: GuideTopic[] = [
  "overview",
  "settings",
  "connectors",
  "permissions",
  "memory",
  "troubleshooting",
];

/**
 * Guide content organized by topic
 */
export const guideContent: Record<GuideTopic, string> = {
  overview: `# Pip Overview

Pip helps you get on top of your finances by connecting all your financial information in one place. Ask simple questions, get clear answers.

## What Pip Can Do

**With Xero connected:**
- View invoices, aged receivables/payables
- Generate profit & loss and balance sheet reports
- Check bank account balances and transactions
- Search and manage contacts
- Create draft invoices (with permission)

**With Gmail connected:**
- Search emails for invoices and receipts
- Download email attachments
- Find supplier communications

**With Google Sheets connected:**
- Read and write spreadsheet data
- Create new spreadsheets
- Append data to existing sheets

## Key Concepts

1. **Permission Levels** - Control what Pip can do (read-only by default)
2. **Connectors** - External services Pip can access (Xero, Gmail, Sheets)
3. **Memory** - Pip remembers things about you across conversations

## Getting Help

Ask Pip about specific topics:
- "How do I connect Xero?"
- "What are permission levels?"
- "How does Pip's memory work?"
`,

  settings: `# Pip Settings Guide

Access settings at: https://app.pip.arcforge.au/settings

## Permission Levels

Controls what Pip can do with your connected services. Each connector has its own permission level.

| Level | Name | What Pip Can Do |
|-------|------|-----------------|
| 0 | Read-Only | View data only. No changes possible. (Default) |
| 1 | Create | Create drafts and new records. Drafts need manual approval. |
| 2 | Update | Approve drafts, update existing records, record payments. |
| 3 | Full Access | Delete and void records. Use with caution - some actions are irreversible. |

**Recommendation:** Start with Read-Only (Level 0) and upgrade only when needed.

## Response Style

Choose how Pip communicates:
- **Concise** - Brief, to-the-point responses
- **Detailed** - More explanation and context
- **Formal** - Professional tone for business contexts

## Vacation Mode

When enabled, Pip is restricted to read-only operations across all connectors until the specified date. Useful when you're away and want to prevent accidental changes.

## How to Change Settings

1. Go to https://app.pip.arcforge.au/settings
2. Click on the setting you want to change
3. Select new value
4. Changes save automatically

Or tell Pip: "Take me to settings" and I'll provide the link.
`,

  connectors: `# Connectors Guide

Connectors link Pip to external services. Manage them at: https://app.pip.arcforge.au/settings → Manage Connectors

## Available Connectors

### Xero (Accounting)
**What it enables:** Invoice management, financial reports, bank transactions, contact management.

**To connect:**
1. Go to Settings → Manage Connectors
2. Click "Connect" next to Xero
3. Sign in to your Xero account
4. Select which organization to connect
5. Authorize Pip's access

**Token expiry:** Access tokens expire after 30 minutes (auto-refreshed). Refresh tokens expire after 60 days of inactivity.

### Gmail (Email)
**What it enables:** Search emails, read content, download attachments (invoices, receipts).

**To connect:**
1. Go to Settings → Manage Connectors
2. Click "Connect" next to Gmail
3. Sign in to your Google account
4. Authorize read-only email access

**Note:** Gmail integration is in testing mode (limited to 100 users). Refresh tokens expire after 7 days.

### Google Sheets (Spreadsheets)
**What it enables:** Read/write spreadsheet data, create spreadsheets, search files.

**To connect:**
1. Go to Settings → Manage Connectors
2. Click "Connect" next to Google Sheets
3. Sign in to your Google account
4. Authorize spreadsheet and drive access

**Note:** In testing mode. Tokens expire after 7 days.

## Disconnecting

1. Go to Settings → Manage Connectors
2. Click "Disconnect" next to the service
3. Tokens are deleted immediately

You can reconnect anytime by clicking "Connect" again.
`,

  permissions: `# Permissions Guide

Pip uses a tiered permission system to keep your data safe. Each connector (Xero, Gmail, Sheets) has its own permission level.

## Permission Levels Explained

### Level 0: Read-Only (Default)
- View invoices, reports, contacts
- Search emails and spreadsheets
- Download attachments
- **Cannot** create, modify, or delete anything

### Level 1: Create/Write
- Everything in Level 0, plus:
- Create draft invoices (require manual approval in Xero)
- Create contacts
- Write to spreadsheets
- Create new spreadsheets

### Level 2: Update/Approve
- Everything in Level 1, plus:
- Approve draft invoices
- Update existing invoices and contacts
- Record payments
- Delete spreadsheet rows/columns

### Level 3: Full Access (Xero only)
- Everything in Level 2, plus:
- Void invoices (irreversible in Xero)
- Delete contacts
- Delete draft invoices

**Warning:** Xero has no user-accessible restore. Voided/deleted data cannot be recovered.

## Per-Connector Permissions

You can set different permission levels for each service:
- Xero: Read-Only (safe for viewing finances)
- Gmail: Read-Only (only option currently)
- Sheets: Create (to write expense tracking data)

## Changing Permissions

1. Go to https://app.pip.arcforge.au/settings
2. Find "Safety Settings" section
3. Select the permission level you want
4. Confirm if upgrading to a higher level

## Best Practices

1. **Start with Read-Only** - Upgrade only when you need write access
2. **Use Level 1 for routine tasks** - Drafts provide a safety net
3. **Reserve Level 3 for emergencies** - Void/delete are permanent
4. **Enable Vacation Mode** when traveling - Forces read-only globally
`,

  memory: `# Memory Guide

Pip remembers things about you and your business across conversations. This helps provide more relevant and personalized assistance.

## What Pip Remembers

- **Preferences:** "I prefer weekly cash flow updates"
- **Business context:** "We're a landscaping company with 3 crews"
- **Goals:** "I want to hire my first employee by Q2"
- **Key facts:** "Our main supplier is ABC Supplies"

## How Memory Works

1. **Automatic capture:** When you share important context, Pip saves it
2. **Search before answering:** Pip checks memories for relevant context
3. **Cross-session persistence:** Memories persist between conversations

## Managing Memory

Access memory settings at: https://app.pip.arcforge.au/settings → Manage Memory

**View memories:** See all stored memories with their sources and dates.

**Edit memories:** Update incorrect or outdated information.

**Delete memories:** Remove specific memories you don't want stored.

**Clear all:** Delete all memories to start fresh.

## Memory Best Practices

**Do share:**
- Business structure and team size
- Regular clients and suppliers
- Financial goals and preferences
- Industry-specific context

**Pip won't store:**
- Sensitive financial data (bank details, passwords)
- Raw transaction data (that stays in Xero)
- Temporary information

## Telling Pip What to Remember

You can explicitly ask:
- "Remember that our fiscal year ends in June"
- "Note that Sarah handles accounts payable"
- "Keep in mind we invoice on the 1st of each month"

Or Pip will naturally pick up on repeated context.
`,

  troubleshooting: `# Troubleshooting Guide

## Common Issues

### "Session expired" or "Authentication required"

**Cause:** Your Pip session has expired (sessions last ~24 hours).

**Fix in Claude.ai:**
1. Click profile icon (bottom-left) → Settings
2. Go to Connectors tab
3. Find "Pip by Arc Forge"
4. Click ⋮ menu → Reconnect

### "Xero not connected"

**Cause:** Xero OAuth tokens have expired or were never set up.

**Fix:**
1. Visit https://app.pip.arcforge.au/settings
2. Click "Manage Connectors"
3. Click "Connect" next to Xero
4. Complete the authorization flow

### "Xero token expired"

**Cause:** Refresh tokens expire after 60 days of inactivity.

**Fix:** Same as above - reconnect Xero through Manage Connectors.

### "Gmail/Sheets token expired"

**Cause:** In testing mode, Google tokens expire after 7 days.

**Fix:** Reconnect through Manage Connectors. This is a temporary limitation until Google verification is complete.

### "Permission denied" for a tool

**Cause:** Your permission level is too low for that operation.

**Fix:**
1. Go to https://app.pip.arcforge.au/settings
2. Find Safety Settings
3. Upgrade to the required level
4. Try the operation again

### Tools not showing up

**Cause:** The connector may not be set up, or permissions restrict visibility.

**Fix:**
1. Ensure the relevant connector is connected
2. Check your permission level (some tools require Level 1+)
3. Try reconnecting the Pip connector in Claude.ai

## Getting More Help

- **App issues:** Visit https://app.pip.arcforge.au
- **Connection issues:** Try disconnecting and reconnecting
- **Feature requests:** Contact Arc Forge support

## Quick Diagnostic

Ask Pip:
- "What connectors do I have set up?"
- "What's my permission level for Xero?"
- "Can you check my Xero connection?"
`,
};

/**
 * Get guide content for a specific topic
 */
export function getGuideContent(topic: GuideTopic): string {
  return guideContent[topic];
}

/**
 * Get all available topics with descriptions
 */
export function getTopicList(): Array<{ topic: GuideTopic; description: string }> {
  return [
    { topic: "overview", description: "What Pip is and what it can do" },
    { topic: "settings", description: "How to configure Pip (permission levels, response style)" },
    { topic: "connectors", description: "Connecting Xero, Gmail, and Google Sheets" },
    { topic: "permissions", description: "Understanding permission levels and safety" },
    { topic: "memory", description: "How Pip remembers things about you" },
    { topic: "troubleshooting", description: "Common issues and how to fix them" },
  ];
}
