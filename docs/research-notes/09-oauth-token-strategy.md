# OAuth Token Strategy for Agent Development

**Date**: 2025-11-29
**Priority**: HIGH for internal dev, FUTURE for end-users

---

## The Reality Check

| Use Case | OAuth Works? | Notes |
|----------|-------------|-------|
| Claude Code CLI | YES | Full subscription support |
| Claude Agent SDK | PARTIAL | Open issue #6536, API key preferred |
| Third-party apps | NO (policy) | Anthropic restricts this |

---

## What Works NOW: Development Mode

For YOUR development, use your Max subscription:

```bash
# Option A: CLI wrapper (simplest)
claude --print "your agent prompt"

# Option B: OAuth token for containers
export CLAUDE_CODE_OAUTH_TOKEN=$(claude setup-token)
```

This saves $3000+/month vs API during development.

---

## What's Blocked: Customer OAuth

**Anthropic Policy**:
> "Third party developers cannot apply Claude.ai rate limits for their products."

Your customers CANNOT use their Max subscription with your agents (yet).

**Monitor**: [GitHub #6536](https://github.com/anthropics/claude-code/issues/6536)

---

## Arc Forge Strategy

```
Development:  Max subscription via CLI wrapper (YOUR subscription)
Production:   API keys (CUSTOMER pays per-token)
Future:       Power user OAuth (IF Anthropic allows)
```

---

## Implementation Pattern

```python
import os
import subprocess

DEV_MODE = os.getenv("ARC_FORGE_DEV_MODE") == "true"

def invoke_claude(prompt):
    if DEV_MODE:
        # Use YOUR subscription
        return subprocess.run(
            ["claude", "--print", "-p", prompt],
            capture_output=True, text=True
        ).stdout
    else:
        # Use API (customer billing)
        from anthropic import Anthropic
        return Anthropic().messages.create(...)
```

---

## Documentation for README (Future)

```markdown
### Power Users (Future)

> OAuth subscription authentication is not currently supported
> for third-party apps per Anthropic policy. Watch for updates.
```

---

## Files Created

- `/repos/agentic-framework/docs/AUTHENTICATION.md` - Full auth strategy
- Joplin: "OAuth Token Strategy for Agent Development"
