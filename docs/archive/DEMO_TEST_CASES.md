# Demo Test Cases - Thursday Presentation

> **Purpose**: Prepared scenarios and expected outcomes for dental practice demo
> **Target Audience**: Small business owner (dentist) managing own books
> **Demo URL**: https://zero.rodda.xyz

---

## Pre-Demo Setup Checklist

### 1. Environment
- [ ] Xero Demo Company connected (or real test org)
- [ ] Sample business plan uploaded
- [ ] Clear browser cache/session for fresh start
- [ ] Have backup screenshots if live demo fails

### 2. Required Documents
Upload before demo:
- `dental-business-plan.txt` - Business goals, KPIs, hiring criteria

### 3. Xero Data Requirements
Ensure demo Xero org has:
- Some unpaid invoices (for "show invoices" query)
- P&L data (for "can I afford" query)
- Bank transactions (for reconciliation demo)

---

## Demo Scenarios

### Scenario 1: First Impression (Cold Start)

**Setup**: Fresh session, no Xero connected, no documents

**User Action**: Land on homepage

**Expected UI**:
- Welcome message: "G'day! I'm Pip"
- Connect Xero button visible
- Document upload accessible
- Suggestion chips: "Show my unpaid invoices", "Can I afford to hire?", etc.

**Demo Script**:
> "This is Pip - your AI bookkeeping assistant. Notice how it's asking to connect to Xero and upload business documents. Let's connect to your accounting data first."

---

### Scenario 2: Connect Xero

**User Action**: Click "Connect Xero" → OAuth flow → Return

**Expected**:
- Green indicator: "Demo Company" (or org name)
- System ready for queries

**Demo Script**:
> "Standard OAuth connection - secure, read-only access to your Xero data. Now Pip can answer questions about your actual finances."

---

### Scenario 3: Basic Xero Query (No Context)

**User Query**: "Show my unpaid invoices"

**Expected Response**:
- List of actual unpaid invoices from Xero
- Invoice numbers, amounts, due dates
- Total outstanding amount

**Success Criteria**:
- [ ] Tool called: `get_invoices` with status filter
- [ ] Response includes real data
- [ ] Plain English formatting

**Demo Script**:
> "Let's start simple - show me unpaid invoices. Pip fetches live data from Xero and presents it in plain English. No navigating through accounting software."

---

### Scenario 4: Upload Business Plan

**User Action**: Click docs button → Upload `dental-business-plan.txt`

**Expected**:
- Upload success indicator
- Document appears in panel with type "business_plan"

**Sample Business Plan Content**:
```
# Acme Dental Practice - Business Plan 2025

## Financial Goals
- Annual Revenue Target: $450,000
- Monthly Revenue Target: $37,500
- Profit Margin Goal: 25%

## Key Performance Indicators
- New patients per month: 15
- Patient retention rate: 85%
- Average treatment value: $350

## Hiring Plan
We plan to hire a full-time dental assistant if:
- Monthly revenue exceeds $40,000 for 3 consecutive months
- Budget for new hire: $55,000/year (including super)

## Cash Flow Requirements
- Minimum operating cash: $30,000
- Quarterly equipment reserve: $5,000
```

**Demo Script**:
> "Now let's add business context. I'll upload your business plan - this includes your financial goals, KPIs, and hiring criteria. Pip will use this to give you personalized advice."

---

### Scenario 5: Context-Aware Query (THE KEY DEMO)

**User Query**: "Can I afford to hire a dental assistant?"

**Expected Response**:
Should combine:
1. **Live Xero data**: Current P&L, monthly revenue, profit margin
2. **Business plan context**: $40k/month threshold, $55k budget, 3-month requirement

**Ideal Response Format**:
```
Based on your business plan and current financials:

📊 Your hiring criteria:
- Monthly revenue > $40,000 for 3 consecutive months
- Budget allocated: $55,000/year

📈 Current situation (from Xero):
- Last month revenue: $38,500
- Average monthly revenue (last 3 months): $37,200
- Current profit margin: 22%

💡 Assessment:
You're close but not quite there yet. Your revenue is about $2,800/month below your hiring threshold.

Recommendation: Focus on getting to $40k/month consistently before hiring. At current growth rate, you might hit this target in 2-3 months.

Want me to show you which service lines are driving the most revenue?
```

**Success Criteria**:
- [ ] References business plan hiring criteria ($40k, $55k)
- [ ] Pulls live P&L data from Xero
- [ ] Provides clear yes/no recommendation
- [ ] Offers actionable next steps

**Demo Script**:
> "Here's where Pip really shines. I'm asking a complex question that requires both accounting data AND business context. Watch how Pip combines your Xero financials with your business plan to give a real answer - not just numbers, but a recommendation."

---

### Scenario 6: Goal Tracking Query

**User Query**: "Am I on track for my revenue goals this year?"

**Expected Response**:
Should combine:
1. **Business plan**: $450k annual target, $37,500/month target
2. **Xero data**: YTD revenue, monthly trend

**Ideal Response Format**:
```
Let me check your progress against your 2025 revenue goal of $450,000:

📊 Year-to-date (11 months):
- Target YTD: $412,500 (11 × $37,500)
- Actual YTD: $395,000
- Variance: $17,500 below target (4% under)

📈 Monthly trend:
- Average monthly revenue: $35,909
- Last month: $38,500 (above target!)

💡 Assessment:
You're slightly behind target, but your recent months are trending up. To hit $450,000, you'd need $55,000 in December - which is ambitious.

Realistic adjusted target: $433,000-$440,000 (still a great year!)

Would you like to see which months underperformed?
```

**Success Criteria**:
- [ ] References $450k annual goal from business plan
- [ ] Calculates YTD from Xero
- [ ] Provides variance analysis
- [ ] Offers realistic assessment

---

### Scenario 7: Cash Flow Query

**User Query**: "Do I have enough cash to buy new equipment?"

**Expected Response**:
Should reference:
1. **Business plan**: $30k minimum operating cash, $5k quarterly reserve
2. **Xero data**: Current bank balance, upcoming payables

**Demo Script**:
> "Another context-aware question. Pip knows from your business plan that you need $30k minimum operating cash and $5k quarterly equipment reserve. It'll check your actual cash position before giving advice."

---

## Fallback Demo (If Live Fails)

### Screenshots to Prepare
1. Homepage with welcome message
2. Xero connected state
3. Unpaid invoices response
4. Business plan uploaded
5. "Can I afford to hire?" response

### Backup Narrative
> "Due to [connectivity issue], let me show you screenshots from our testing. Here you can see..."

---

## Post-Demo Questions (Anticipated)

### Q: "Is this secure?"
**A**: "Yes - we use OAuth 2.0 (same as when you login with Google). We only request read-only access. Your business documents stay encrypted and are never shared."

### Q: "How much does it cost?"
**A**: "We're in beta - free during testing. Target pricing is around $29-49/month after launch, much less than a bookkeeper."

### Q: "Can it write to Xero?"
**A**: "Currently read-only for safety. We're adding invoice creation and reconciliation assistance in the next phase."

### Q: "What about MYOB/QuickBooks?"
**A**: "Xero first (most popular in Australia), MYOB next, then QuickBooks."

### Q: "Can I talk to it?"
**A**: "Voice mode is coming soon - you'll be able to ask questions by voice while driving or in the clinic."

---

## Success Metrics for Demo

| Metric | Target |
|--------|--------|
| Queries work first try | 4/5+ |
| Response time | <10 seconds |
| User says "that's useful" | Yes |
| User asks about pricing/availability | Yes |
| Follow-up meeting requested | Yes |

---

## Demo Day Checklist

### Morning Of
- [ ] Test live environment (https://zero.rodda.xyz)
- [ ] Verify Xero connection active
- [ ] Upload fresh business plan
- [ ] Run through all 5 scenarios
- [ ] Prepare backup screenshots
- [ ] Charge laptop
- [ ] Test internet connection at venue

### During Demo
- [ ] Start with Scenario 1 (cold start)
- [ ] Build up to Scenario 5 (key demo)
- [ ] Leave time for questions
- [ ] Capture feedback notes

### After Demo
- [ ] Document feedback in Joplin
- [ ] Update STATUS.md with outcomes
- [ ] Schedule follow-up if interested
