# Philip (Dad) Beta Tester Setup Guide

> **Status**: Ready for onboarding
> **Prerequisites**: ✅ All completed (GPU config, rate limiting, model selector)
> **Estimated Time**: 10 minutes

---

## Overview

Philip will be the first beta tester with access to local GPU models via Tailscale. This setup ensures:
- ✅ No cost to Arc Forge (uses local GPU, not paid APIs)
- ✅ Fast responses (<2s) with ultra-light models
- ✅ Safe testing environment with rate limiting
- ✅ Full app features (memory, projects, tools)

---

## Admin Setup (You)

### Step 1: Create Invite Code

SSH into production and create the invite code:

```bash
ssh arcforge-prod

# Connect to database via Node.js (since sqlite3 CLI not in container)
docker exec -it pip-app node -e "
const { createDatabaseProviderFromEnv } = require('@pip/core');
(async () => {
  const db = await createDatabaseProviderFromEnv();
  await db.db.prepare(\`
    INSERT INTO invite_codes (code, created_by, created_at)
    VALUES (?, 'system', ?)
  \`).run('PHILIP-BETA-2025', Date.now());
  console.log('✓ Invite code created: PHILIP-BETA-2025');
})();
"
```

**Alternative**: Use the Pip PWA admin panel (when built) or direct SQL via backup copy.

---

### Step 2: Share Credentials with Philip

Send Philip:
1. **Invite Code**: `PHILIP-BETA-2025`
2. **Signup URL**: https://app.pip.arcforge.au
3. **What to expect**: "You'll have access to a local AI model that responds quickly. It's less capable than Claude but perfect for testing the app."

---

### Step 3: Assign Beta Tester Flag (After Signup)

Once Philip creates his account:

```bash
# Get Philip's user_id
docker exec -it pip-app node -e "
const { createDatabaseProviderFromEnv } = require('@pip/core');
(async () => {
  const db = await createDatabaseProviderFromEnv();
  const user = await db.getUserByEmail('philip@example.com'); // Replace with real email
  console.log('User ID:', user?.id);
})();
"

# Assign beta_tester flag
docker exec -it pip-app node -e "
const { createDatabaseProviderFromEnv } = require('@pip/core');
(async () => {
  const db = await createDatabaseProviderFromEnv();
  await db.db.prepare(\`
    UPDATE users
    SET feature_flags = ?,
        subscription_tier = 'free'
    WHERE email = ?
  \`).run(JSON.stringify(['beta_tester']), 'philip@example.com'); // Replace email
  console.log('✓ Beta tester flag assigned');
})();
"
```

---

### Step 4: Verify Setup

Test the configuration:

1. **Log in as Philip** (use his credentials)
2. **Check model selector**:
   - Should show: `Qwen 2.5 0.5B (Local)`, `Qwen 2.5 3B (Local)`
   - Should NOT show: Claude Opus, Claude Sonnet, Claude Haiku
3. **Send test message**: "What is 2+2?"
4. **Verify**:
   - Response time < 2 seconds ✓
   - Response quality acceptable ✓
   - No errors in logs ✓

---

## Philip's Experience

### What Philip Gets

**Access:**
- ✅ Local GPU models (qwen2.5:0.5b, qwen2.5:3b)
- ✅ Full app features (memory, projects, tools, chat history)
- ✅ Fast responses (<2s for loaded models)

**Restrictions:**
- ❌ No access to paid API models (Opus/Sonnet/Haiku)
- ⚠️  Rate limit: 100,000 tokens/day (~75 conversations)
- ⚠️  Model quality: Good for testing, not as capable as Claude

### Model Capabilities

**qwen2.5:0.5b (Default)**:
- Ultra-light (397MB VRAM)
- Response time: 75ms
- Best for: Basic Q&A, simple tasks, app testing

**qwen2.5:3b (Alternative)**:
- Better quality (1.9GB VRAM)
- Response time: ~200ms
- Best for: More complex queries, longer responses

---

## Instructions for Philip

### Getting Started

1. **Sign Up**:
   - Go to https://app.pip.arcforge.au
   - Use invite code: `PHILIP-BETA-2025`
   - Create your account

2. **First Chat**:
   - Click "New Chat" or start typing
   - Model selector shows local models only
   - Try: "Hello! Can you tell me about yourself?"

3. **Features to Try**:
   - **Memory**: The AI remembers context across conversations
   - **Projects**: Organize chats by project/topic
   - **Chat History**: See past conversations in left sidebar
   - **Response Styles**: Change how the AI responds (Settings → Style)

### What to Test

**Priority 1 - Basic Functionality**:
- [ ] Sign up and log in
- [ ] Send messages and get responses
- [ ] Response speed (<2 seconds?)
- [ ] Response quality (good enough for testing?)

**Priority 2 - Features**:
- [ ] Create a new project
- [ ] Add memory via Settings
- [ ] Rename a chat
- [ ] Delete a chat
- [ ] Change response style

**Priority 3 - Edge Cases**:
- [ ] Very long messages (500+ words)
- [ ] Multiple rapid messages
- [ ] Switching between projects
- [ ] Browser refresh (session persistence)

### Reporting Issues

When you find issues, note:
1. What you were trying to do
2. What happened
3. What you expected to happen
4. Screenshot if possible

Send to: [Your preferred contact method]

---

## Troubleshooting

### Philip Can See Paid Models

**Cause**: Beta tester flag not assigned correctly.

**Fix**:
```bash
# Check current flags
docker exec -it pip-app node -e "
const { createDatabaseProviderFromEnv } = require('@pip/core');
(async () => {
  const db = await createDatabaseProviderFromEnv();
  const user = await db.getUserByEmail('philip@example.com');
  console.log('Feature flags:', user?.featureFlags);
  console.log('Subscription tier:', user?.subscriptionTier);
})();
"

# Re-assign if needed (see Step 3)
```

### Slow Response Times (>3 seconds)

**Cause**: Model not kept in VRAM.

**Check**:
```bash
curl http://100.64.0.2:11434/api/tags
```

**Fix**: Models stay loaded with `keep_alive: -1` (already configured).

### Rate Limit Hit

**Cause**: Philip exceeded 100k tokens/day.

**Check**:
```bash
docker exec -it pip-app node -e "
const { createDatabaseProviderFromEnv } = require('@pip/core');
(async () => {
  const db = await createDatabaseProviderFromEnv();
  const dateBucket = new Date().toISOString().split('T')[0];
  const usage = await db.getTokenUsage('philip-user-id', 'qwen2.5:0.5b', dateBucket);
  console.log('Tokens used today:', usage.totalTokens);
})();
"
```

**Fix**: Wait for reset at midnight UTC, or temporarily increase limit in `access-control.ts`.

---

## Metrics to Track

**Performance**:
- [ ] Average response time
- [ ] Model load time (first request)
- [ ] Concurrent user capacity

**Usage**:
- [ ] Daily token consumption
- [ ] Most used features
- [ ] Error rate

**Feedback**:
- [ ] User satisfaction (Philip's feedback)
- [ ] Bug reports
- [ ] Feature requests

---

## Rollout Plan

**Phase 1**: Philip only (current)
- Learn from single beta tester
- Fix critical bugs
- Stabilize local GPU setup

**Phase 2**: 2-3 more beta testers
- Test concurrent GPU usage
- Validate rate limiting
- Gather diverse feedback

**Phase 3**: Wider beta (10-20 users)
- Consider paid tier access
- Add model selection flexibility
- Scale GPU infrastructure if needed

---

## Success Criteria

Philip's onboarding is successful when:
- ✅ Philip can sign up and chat successfully
- ✅ Response times consistently <2 seconds
- ✅ No access to paid models (cost protection verified)
- ✅ Rate limiting works (no token abuse)
- ✅ Philip provides initial feedback
- ✅ No critical bugs in first week

---

**Last Updated**: 2025-12-10
**Owner**: Samuel Rodda
**Status**: Ready for execution
