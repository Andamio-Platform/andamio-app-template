---
status: complete
priority: p3
issue_id: "020"
tags: [code-review, ux, copy]
dependencies: []
---

# humanizeTxError Says "The user" Instead of "You"

## Problem Statement

In `use-transaction.ts:86`, `humanizeTxError()` returns "The user declined to sign the transaction." This is written from a third-person developer perspective, not from the user's perspective. The message should say "You declined to sign the transaction."

**Why it matters:** Minor UX polish — messages should address the user directly.

## Proposed Solutions

### Option A: Change to second person (Recommended)
**Effort:** Small (2 min)

```typescript
return "You declined to sign the transaction.";
```

## Technical Details

**Affected files:**
- `src/hooks/tx/use-transaction.ts` (line 86)

## Acceptance Criteria

- [ ] Error message uses "You" instead of "The user"

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Copy tone consistency |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
