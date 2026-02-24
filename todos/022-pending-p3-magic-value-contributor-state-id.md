---
status: pending
priority: p3
issue_id: "022"
tags: [code-review, quality, pr-341]
dependencies: []
---

# Replace "0".repeat(56) Magic Value with Named Constant

## Problem Statement

`contributorStateId` falls back to `"0".repeat(56)` in two places (task detail line 209, contributor page line 489). This is a magic sentinel value — it's unclear what happens when the TX component receives it.

**Why it matters:** If the transaction fails with this value, the button should be disabled. If it's a valid no-op, the constant should be named.

## Proposed Solutions

### Solution 1: Named Constant
```typescript
const EMPTY_CONTRIBUTOR_STATE_ID = "0".repeat(56);
```

- **Effort:** Small (< 15 min)
- **Risk:** None

## Acceptance Criteria

- [ ] Magic value replaced with named constant
- [ ] Behavior documented in comment

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
