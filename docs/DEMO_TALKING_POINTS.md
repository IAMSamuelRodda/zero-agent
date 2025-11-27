# Zero Agent - Demo Talking Points

## Demo Script for Dental Practice Owner

**Meeting**: Thursday 10am (next week)
**Goal**: Validate product-market fit, gather feedback

---

## Opening (2 min)

"Zero Agent is an AI assistant that connects to your Xero accounting and lets you ask questions in plain English - no need to navigate menus or run reports manually."

---

## Demo Flow (15 min)

### 1. Connect to Xero (1 min)
- Show the PWA at https://zero.rodda.xyz
- Click "Connect Xero"
- Authorize with their Xero account
- Show the green "Connected" indicator

### 2. Basic Questions (3 min)

**Try these queries:**
```
"What organisation am I connected to?"
"Show my unpaid invoices"
"How many customers do I have?"
```

**Talking points:**
- Natural language - no need to learn accounting software
- Instant answers vs clicking through menus
- Works on phone, tablet, or desktop

### 3. Cash Flow Insight (4 min)

**Key demo queries:**
```
"Who owes me money?"
"Show me aged receivables"
"Which invoices are over 30 days overdue?"
"Search for patient Smith"
```

**Talking points:**
- Aged receivables shows who owes money and how long
- Critical for cash flow management
- Can search for specific patients/customers

### 4. Financial Overview (3 min)

**Try:**
```
"Show my profit and loss for this month"
"What's my bank balance?"
"Show recent bank transactions"
```

**Talking points:**
- Quick financial health check
- No need to run reports manually
- Get answers while on the go

### 5. Supplier Management (2 min)

**Try:**
```
"Who do I owe money to?"
"Show aged payables"
```

**Talking points:**
- Track what you owe suppliers
- Plan payment timing

### 6. Mobile Use Case (2 min)

- Show PWA on phone (add to home screen)
- "Check your numbers between patients"
- "Quick cash flow check while commuting"

---

## Key Questions to Ask

1. **Pain validation:**
   - "How do you currently check this information?"
   - "How often do you look at aged receivables?"
   - "What's most frustrating about Xero for you?"

2. **Feature interest:**
   - "What other questions would you want to ask?"
   - "What would save you the most time?"

3. **Pricing:**
   - "Would you pay $29/month for this?"
   - "What features would justify that price?"

4. **Distribution:**
   - "Would you prefer this as a mobile app?"
   - "Do other practice owners you know struggle with this?"

---

## Current Tool Capabilities

| Tool | Description |
|------|-------------|
| `get_invoices` | List invoices by status (draft, paid, overdue) |
| `get_invoice` | Get details of specific invoice |
| `get_contacts` | List customers/suppliers |
| `search_contacts` | Find specific customer/patient |
| `get_organisation` | Company details |
| `get_profit_and_loss` | P&L report for date range |
| `get_balance_sheet` | Balance sheet at date |
| `get_aged_receivables` | Who owes money, aging buckets |
| `get_aged_payables` | What you owe, aging buckets |
| `get_bank_transactions` | Recent bank activity |
| `get_bank_accounts` | Bank account balances |

---

## Handling Objections

**"I can just look in Xero"**
- "Yes, but how long does it take to find aged receivables?"
- "Zero Agent answers in seconds, from your phone"

**"Is my data secure?"**
- "We use Xero's official OAuth - we never see your password"
- "Your data stays in Xero, we just query it"
- "You can disconnect at any time"

**"What about creating invoices?"**
- "That's coming soon"
- "For now we focus on insight and visibility"

---

## Follow-up

- Ask if they'd be a beta tester
- Offer 3-month free trial
- Ask for referrals to other practice owners
