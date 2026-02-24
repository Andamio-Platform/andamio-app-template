---
status: pending
priority: p3
issue_id: "022"
tags: [code-review, cleanup]
dependencies: []
---

# Dead console.log Callbacks in onSuccess/onError

## Problem Statement

Both `teachers-update.tsx:129-134` and `managers-manage.tsx:147-152` pass `onSuccess` and `onError` callbacks to `execute()` that only contain `console.log`/`console.error` statements. These are debugging leftovers that add no value since the hook itself logs errors via `txLogger`.

**Why it matters:** Minor cleanup — dead debugging code.

## Proposed Solutions

### Option A: Remove the callbacks
**Effort:** Small (5 min)

The `useTransaction` hook already handles all success/error logic (toasts, state, logging). These callbacks are unnecessary.

## Technical Details

**Affected files:**
- `src/components/tx/teachers-update.tsx` (lines 129-134)
- `src/components/tx/managers-manage.tsx` (lines 147-152)

## Acceptance Criteria

- [ ] Dead console.log callbacks removed from both components

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Debugging leftover |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
