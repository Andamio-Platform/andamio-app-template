---
status: complete
priority: p2
issue_id: "018"
tags: [code-review, ux, architecture]
dependencies: []
---

# TransactionStatus Uses onRetry for Both Retry and Dismiss

## Problem Statement

In `transaction-status.tsx`, the error state renders both a "Try again" link (line 126) and a dismiss close button (line 131), but both call `onRetry`. The close button semantically means "dismiss this error and reset", not "retry the transaction". Callers like `teachers-update.tsx:309` pass `onRetry={() => reset()}` which just resets state — so it works, but the API is misleading.

**Why it matters:** If a future caller provides an `onRetry` that actually retries the transaction (re-executes), clicking the dismiss X would unexpectedly re-trigger the transaction. The component's contract is ambiguous.

## Findings

- **Flagged by:** Architecture strategist, Code simplicity reviewer
- Line 119-128: "Try again" link calls `onRetry`
- Line 130-139: Close button also calls `onRetry`
- Current callers only pass `reset()` for `onRetry`, so it's safe today

## Proposed Solutions

### Option A: Add separate onDismiss prop
**Pros:** Clear API contract, semantically correct
**Cons:** Adds a prop, callers need updating
**Effort:** Medium (15 min)
**Risk:** Low

### Option B: Document current behavior, defer refactor
**Pros:** No change needed now
**Cons:** Ambiguity remains
**Effort:** Small (5 min)
**Risk:** Low — all current callers are safe

## Recommended Action

Option B for now — document that `onRetry` is used for both actions, file as tech debt for when TransactionStatus gets extracted to @andamio/transactions package.

## Technical Details

**Affected files:**
- `src/components/tx/transaction-status.tsx` (lines 119-139)

## Acceptance Criteria

- [ ] Decision documented (code comment or this todo marked as deferred)
- [ ] No behavioral change needed for current callers

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Semantic mismatch in shared component API |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
