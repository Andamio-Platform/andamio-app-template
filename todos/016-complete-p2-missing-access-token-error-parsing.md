---
status: complete
priority: p2
issue_id: "016"
tags: [code-review, ux, consistency]
dependencies: []
---

# Missing ACCESS_TOKEN_ERROR Parsing in ManagersManage

## Problem Statement

`teachers-update.tsx` defines `parseTeacherTxError()` (lines 22-28) to convert raw `ACCESS_TOKEN_ERROR` messages into user-friendly text ("One or more aliases could not be found on-chain..."). The `managers-manage.tsx` component performs the same kind of alias verification but passes `error?.message` directly to `TransactionStatus` without any parsing.

**Why it matters:** When a manager alias doesn't have an access token, the user sees a raw technical error instead of a helpful message.

## Findings

- **Flagged by:** Architecture strategist, TypeScript reviewer
- `teachers-update.tsx:308` uses `parseTeacherTxError(error?.message)`
- `managers-manage.tsx:325` uses `error?.message ?? null` (no parsing)
- The same `ACCESS_TOKEN_ERROR` can occur in both components since both verify aliases on-chain

## Proposed Solutions

### Option A: Extract shared error parser (Recommended)
**Pros:** DRY, consistent UX across both components
**Cons:** Slight refactor
**Effort:** Small (10 min)
**Risk:** None

Move `parseTeacherTxError` to a shared location (e.g., `~/lib/tx-errors.ts` or rename to `parseAliasTxError`) and use it in both components.

### Option B: Duplicate the function in managers-manage.tsx
**Pros:** Faster, no cross-file changes
**Cons:** More duplication in already-duplicated components
**Effort:** Small (5 min)
**Risk:** None

## Recommended Action

Option A — reduces duplication between the twin components.

## Technical Details

**Affected files:**
- `src/components/tx/managers-manage.tsx` (line 325)
- `src/components/tx/teachers-update.tsx` (lines 22-28, for extraction)

## Acceptance Criteria

- [ ] ACCESS_TOKEN_ERROR parsed into friendly message in managers-manage.tsx
- [ ] Shared parser function if using Option A
- [ ] Both components show consistent error messages

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Twin component divergence |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
