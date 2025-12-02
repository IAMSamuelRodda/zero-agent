# Pip - Invite Codes

> **Purpose**: Track beta invite codes for controlled access
> **Lifecycle**: Living (update when codes are created or used)

**Last Updated**: 2025-11-29

---

## Overview

Pip is in private beta. Users need an invite code to sign up.
- Codes are **single-use** (one code = one account)
- Codes can have expiration dates (optional)
- Codes are validated during OAuth sign-up flow

---

## Active Invite Codes

| Code | Status | Used By | Created |
|------|--------|---------|---------|
| V3Y8KPNM | ✅ Used | test@example.com | 2025-11-28 |
| 7HWJX9QT | 🟢 Available | - | 2025-11-28 |
| LRTE4BS6 | 🟢 Available | - | 2025-11-28 |
| F2NMC8KJ | 🟢 Available | - | 2025-11-28 |
| 9XPRW5HY | 🟢 Available | - | 2025-11-28 |
| QBZE3NU7 | 🟢 Available | - | 2025-11-28 |
| K6DJHS2V | 🟢 Available | - | 2025-11-28 |
| YAMC4PWT | 🟢 Available | - | 2025-11-28 |
| 5TNVG8RZ | 🟢 Available | - | 2025-11-28 |
| E9HWBJ3L | 🟢 Available | - | 2025-11-28 |

**Total**: 10 codes (1 used, 9 available)

---

## How to Create New Codes

Via the main app admin CLI:
```bash
# SSH to VPS
ssh root@170.64.169.203

# Generate codes via admin CLI (if available)
docker exec pip-app pnpm admin generate-codes 5

# Or manually insert into database
sqlite3 /var/lib/docker/volumes/pip-data/_data/pip.db \
  "INSERT INTO invite_codes (code, created_at) VALUES ('NEWCODE01', strftime('%s','now') * 1000);"
```

---

## How to Check Code Status

```bash
ssh root@170.64.169.203
sqlite3 /var/lib/docker/volumes/pip-data/_data/pip.db \
  "SELECT code, used_by, created_at FROM invite_codes;"
```

---

## Xero 25-User Limit

**Important**: Xero limits unapproved apps to 25 connected organizations.

- Track connected Xero orgs separately from user accounts
- One user may connect multiple Xero orgs
- Apply for Xero app approval before hitting limit

See `ISSUES.md` → `risk_000` for mitigation plan.
