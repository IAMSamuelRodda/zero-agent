# Claude Subscription vs API - Cost Analysis

**Date**: 2025-11-29
**Context**: Optimizing Claude spend for agentic framework development

---

## Key Discovery: You CAN Use Subscription with Claude Code!

**Just unset `ANTHROPIC_API_KEY` and Claude Code falls back to your subscription.**

```bash
# Check current auth method
claude /status

# Force subscription use (if API key is set)
unset ANTHROPIC_API_KEY
```

Authentication priority: `ANTHROPIC_API_KEY` > OAuth token > Subscription

---

## Cost Comparison

### Your $300/month Max Subscription

**What you get with Max 20x ($200/mo)**:
- 24-40 hours of Opus 4 per week
- 200-800 Claude Code prompts per 5-hour window
- Extended thinking INCLUDED (no extra cost)

### Equivalent API Cost

| Usage Level | API Cost/Month | Subscription |
|-------------|----------------|--------------|
| Heavy (50M tokens) | $750-$3,750 | $200 |
| Power (100M tokens) | $1,500-$7,500 | $200 |
| Extreme | $5,000+ | $200 |

**Max 20x is 3-25x cheaper than API for heavy users.**

---

## API Pricing (November 2025)

| Model | Input/1M | Output/1M | With Cache | With Batch |
|-------|----------|-----------|------------|------------|
| Opus 4.5 | $5 | $25 | 90% off | 50% off |
| Opus 4 | $15 | $75 | 90% off | 50% off |
| Sonnet 4 | $3 | $15 | 90% off | 50% off |

**Maximum savings**: 95% with caching + batch processing

---

## Extended Thinking Costs

**On API**: Billed as output tokens
- 128K thinking tokens (max) = $9.60 per request (Opus 4)

**On Subscription**: Included in usage limits

**Recommendation**: Use subscription for development, API for production

---

## Recommendation for Arc Forge

```
Development:     Max subscription (unlimited experimentation)
Staging:         API with caching (test real costs)
Production:      API with optimizations (customer billing)
```

**Opus 4 as benchmark**: Use your subscription to establish quality bar, then compare against local models.

---

## Sources

- [Claude Pricing](https://www.claude.com/pricing)
- [Max 20x Review](https://www.arsturn.com/blog/claude-code-max-20x-plan-rip-off-or-worth-the-200-price-tag)
- [Using Claude Code with Max Plan](https://support.claude.com/en/articles/11145838)
