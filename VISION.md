# Pip - Vision

**Get on top of your finances.**

Ask questions about your money and get plain-English answers instantly. Stop digging through multiple apps—just ask.

*Connects your accounting, email, spreadsheets, and more (modular MCP architecture).*

---

## Target Persona: People Who Want Financial Clarity

Pip is designed for **people who blur the line between business and personal finances**—self-employed folks, freelancers, and side-hustlers who mix their money and need clarity without complexity.

**Example Person**: *Freelance contractor or self-employed tradesperson*
- Earns good income but mixes it with personal spending
- Uses one bank account for everything (no separate accounts)
- Wants to know: "How much can I actually spend?"
- Needs simple answers, not accounting jargon
- Values clarity over perfect categorization

**Key Insight**: These people don't want to become accountants. They want someone to tell them "you made $X this week, you can safely spend $Y, and $Z needs to stay for tax."

---

## Core Value Proposition

### The Problem We Solve

People mixing income and personal spending face a daily question: **"What can I actually spend?"**

Your bank balance lies to you. It includes:
- Money owed to the tax office
- Upcoming expenses you haven't paid yet
- Payments that haven't cleared
- Everything mixed together

**Current solutions don't work:**
- Accounting software: Too complicated, designed for accountants
- Separate accounts: Extra friction, fees, and hassle
- Spreadsheets: Time-consuming and easy to forget
- Accountants: Expensive, only help a few times a year

### What Pip Does

Pip acts as the **intelligent layer** between messy reality and clear understanding:

1. **Understands Your Situation**: Learns your patterns, typical transactions, spending habits
2. **Categorizes Smartly**: "That $89 at Bunnings? Probably work-related"
3. **Tells You What's Real**: "Your balance is $15,000 but you can safely spend $3,200"
4. **Speaks Plain English**: No jargon, just answers to real questions

### The "Available Balance" Concept

The killer feature is the **intelligent available balance**—what the user can actually spend personally:

```
Bank Balance:           $15,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GST Liability:          -$2,200
Income Tax Reserve:     -$4,500
Upcoming Expenses:      -$800
Business Buffer:        -$1,500
                        ────────
Pending Income:         +$2,500
Disputed/Uncertain:     -$500
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Available Personal:     $8,000
Safe to Spend Today:    $3,200
```

---

## Philosophy

We believe helpful finance assistants should:
- ✅ **Respect user freedom** - Own your data, choose your LLM provider
- ✅ **Enable privacy** - Self-host on your infrastructure if you want
- ✅ **Avoid vendor lock-in** - Use Anthropic, OpenAI, local models, or any future LLM
- ✅ **Charge for value** - Pay for convenience and infrastructure, not for code
- ✅ **Meet users where they are** - Don't force "proper" business practices

We don't believe in:
- ❌ **Extracting rent** - No forced subscriptions for basic features
- ❌ **Data silos** - Your financial data should stay where you want it
- ❌ **Artificial limitations** - If you run it yourself, use it however you want
- ❌ **Black box software** - All code is open, auditable, and forkable
- ❌ **Judgment** - Don't lecture about separate accounts or "proper" bookkeeping

## What We Build

**Open Source Platform**:
- Full codebase released under MIT license
- Self-hostable with Docker or your own cloud
- Works with ANY LLM backend (API keys, or local models)
- Database: SQLite (PostgreSQL planned via abstraction layer)

**Managed Service** (Optional):
- We run the infrastructure so you don't have to
- One bill, zero DevOps, automatic updates
- Pay for convenience, not code access

**Intelligent Financial Layer**:
- **Transaction Categorization**: Intelligent business vs personal classification
- **Available Balance**: Real-time "what can I spend?" calculations
- **Tax Reserving**: Automatic GST/income tax set-asides
- **Plain English Reports**: No accounting jargon

**Integration Architecture**:
- Deep integrations via MCP (accounting, email, spreadsheets)
- Agent workflows optimized for financial management tasks
- Extensible connector system for future services

## Business Model

**Free** (Self-Hosted):
- All features, unlimited usage
- You run infrastructure, bring your own LLM
- Community support via GitHub

**Managed Hosting**:
- We run everything (hosting, database, updates)
- Priority email support

**Enterprise**:
- Managed infrastructure + managed AI included
- Custom integrations available

**Revenue Philosophy**:
- Charge for what costs us to run (AWS, support time)
- Don't charge for code (it's open source)


## Why Open Source?

**For Users**:
- Trust through transparency (audit the code)
- Privacy for sensitive financial data (self-host)
- No vendor lock-in (fork and modify freely)
- Future-proof (community maintains even if we don't)

**For Us**:
- Community contributions improve the product
- Brand reputation attracts managed hosting customers
- Compete on quality and service, not artificial scarcity

## Differentiation

**Others**: "Pay us to use our app and loose everything if you stop paying us."
**Us**: "Here's the code. Use it however you want. We'll run it for you if convenient. If you stop, you can set up your own."

Our competitive advantages:
1. **Integration depth** (multi-service MCP architecture)
2. **LLM flexibility** (no vendor lock-in)
3. **Community trust** (open source = transparent)
4. **Deployment choice** (self-host OR managed)
5. **Real-world understanding** (designed for messy reality, not textbook accounting)

---

## Future Direction: Intelligent Expense Separation

### The Vision

Pip will learn to intelligently categorize transactions as business or personal without requiring users to maintain separate accounts or manually tag every transaction.

**Core Capabilities** (Planned):

1. **Pattern Learning**
   - Recognize recurring business expenses (fuel, Bunnings, equipment hire)
   - Learn personal spending patterns (groceries, restaurants, streaming)
   - Understand context-dependent merchants (Bunnings = business for tradies, personal for homeowners)

2. **Confidence-Based Categorization**
   - High confidence: Auto-categorize silently
   - Medium confidence: Suggest with one-tap confirm
   - Low confidence: Ask the user
   - Learn from corrections to improve over time

3. **Smart Tax Reserving**
   - Calculate GST liability in real-time
   - Estimate income tax based on earnings pattern
   - Set aside reserves automatically ("virtual envelopes")
   - Alert when reserves are low or spending is high

4. **The Dashboard Question**
   - Single number: "You can safely spend $X"
   - Breakdown on tap: Where the money is allocated
   - Trends: "You've been spending more on personal lately"
   - Warnings: "GST is due in 3 weeks, reserve looks tight"

### Design Principles for This Feature

1. **Start permissive, tighten with learning** - Don't block users from spending their money. Provide information, not friction.

2. **Memory over manual** - Every correction teaches Pip. The goal is zero manual categorization within months.

3. **Plain English always** - "You made $2,500 today but $400 is GST" not "Revenue recognition with BAS liability accrual"

4. **Progressive disclosure** - Simple answer first, details for those who want them

5. **No judgment** - "You spent $800 on personal this week" not "You overspent your budget"

### Implementation Approach (Future)

**Phase 1: Transaction Analysis** (Milestone 3+)
- Bank feed categorization with confidence scoring
- Pattern detection for recurring transactions
- Basic business vs personal heuristics

**Phase 2: Learning System** (Milestone 4+)
- User feedback loop (confirm/correct)
- Memory of categorization decisions
- Per-user pattern learning

**Phase 3: Available Balance** (Milestone 5+)
- Real-time "safe to spend" calculation
- Tax reserving with BAS alignment
- Dashboard widget for quick glance

**Phase 4: Proactive Intelligence** (Future)
- Spending alerts and trends
- Tax deadline reminders
- Cash flow predictions

---

## License

MIT - Maximum freedom to use, modify, and distribute.

---

**Built for small business owners who'd rather run their business than manage their books.**

*Last updated: 2025-12-09*
