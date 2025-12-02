# Development Workflow

> **Purpose**: Git workflow, CI/CD pipelines, and pre-commit checklist
> **Lifecycle**: Stable (update when processes change)

---

## Git Workflow

**Model**: Simple (main only)

Fast prototyping phase - direct commits to main, manual VPS deployment.

### Development Flow

```bash
# Start work
git pull origin main

# Develop and commit directly to main
git add .
git commit -m "[type]: description"
git push origin main

# Deploy to VPS (manual)
ssh root@170.64.169.203 "cd /opt/pip && git pull && docker compose up -d --build"

# Verify deployment
curl https://app.pip.arcforge.au/health
curl https://mcp.pip.arcforge.au/health
```

### Commit Message Types
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `refactor:` - Code changes that neither fix bugs nor add features
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### When to Upgrade to Standard Tier (main + dev)
- Multiple developers need release isolation
- Production stability becomes critical
- Need staging environment for testing

See `CONTRIBUTING.md` for workflow tier definitions

---

## Pre-Commit Checklist

Before every commit:

```bash
# 1. Build to verify TypeScript compilation (primary quality gate)
pnpm build

# 2. Review changes
git diff --staged

# 3. Verify commit message includes issue reference (if applicable)

# Note: pnpm lint currently fails - see debt_004 (ESLint v9 migration)
# Note: pnpm test has no tests yet - see debt_001 in ISSUES.md
```

---

## CI/CD Workflows

### Current State: Manual Deployment

Simple tier uses manual VPS deployment via deploy script.

```bash
# Deploy to production VPS (recommended)
ssh root@170.64.169.203 "cd /opt/pip && ./deploy/deploy.sh"

# Or manually:
ssh root@170.64.169.203
cd /opt/pip && git pull
./deploy/deploy.sh
```

The deploy script (`deploy/deploy.sh`):
1. Sources `.env` for secrets
2. Pulls latest code
3. Rebuilds ALL containers
4. Runs health checks

**Backups**: Daily at 3am UTC to `/opt/backups/pip/` (14-day retention)

### Future: Automated Workflows

When upgrading to Standard tier, add these workflows:

| Workflow | Triggers | Purpose |
|----------|----------|---------|
| **validate.yml** | All pushes | Linting, formatting, type checking |
| **test.yml** | All pushes | Unit + integration tests |
| **deploy.yml** | Push to main | Build + deploy to VPS |

### Branch Protection (When Needed)

**enforce-main-pr-source.yml** - For Standard tier
- Enforce main ONLY accepts PRs from `dev`
- Not needed for Simple tier (direct commits)

---

## Environment Setup

### Prerequisites
- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- Xero Developer Account (for OAuth credentials)
- Anthropic API Key (for LLM)

### Installation
```bash
# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys and credentials

# Start development servers
pnpm dev
```

---

## Testing

### Unit Tests
```bash
pnpm test
```

### E2E Tests
```bash
# Not yet implemented - see debt_001 in ISSUES.md
```

### Test Organization
- Unit tests: `packages/*/src/**/*.test.ts`
- E2E tests: `packages/*/e2e/**/*.spec.ts` (planned)

---

## Troubleshooting

### Common Issues

**pnpm install fails with peer dependency errors**
```bash
# Use --shamefully-hoist flag
pnpm install --shamefully-hoist
```

**Docker build fails on Apple Silicon**
```bash
# Build for linux/amd64
docker build --platform linux/amd64 -t pip-app .
```

**Xero OAuth callback fails**
```bash
# Ensure XERO_REDIRECT_URI matches your callback URL
# Check service worker isn't intercepting /auth/callback
```

---

## Database Migrations

### Migration Checklist

**Before any database migration:**

1. **Take manual backup FIRST**
   ```bash
   ssh root@170.64.169.203
   /opt/backups/backup-pip.sh  # Creates timestamped backup
   ```

2. **Verify user counts**
   ```bash
   sqlite3 /var/lib/docker/volumes/pip-data/_data/pip.db 'SELECT COUNT(*) FROM users;'
   ```

3. **Run migration** (e.g., schema changes, naming changes)

4. **Verify user counts match** after migration

5. **Test login** with a real account before deleting old resources

6. **Only then** remove old volumes/databases

### Lessons Learned (2025-12-01)

**Incident**: User account lost during pip → pip naming migration

**What went wrong:**
- Migration script ran correctly
- Old volume deleted without verifying user data migrated
- Backup script was using old container name (no recent backups)

**Preventive measures added:**
- Updated backup script to use `pip` naming
- Extended backup retention: 7 → 14 days
- Added this checklist to documentation

**Recovery options (when data is lost):**
- Check `/opt/backups/pip/` for recent backups
- User must re-register with invite code if no backup exists

---

**Last Updated**: 2025-12-02
