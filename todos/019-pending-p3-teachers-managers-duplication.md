---
status: pending
priority: p3
issue_id: "019"
tags: [code-review, architecture, duplication]
dependencies: []
---

# ~280 Lines Duplicated Between TeachersUpdate and ManagersManage

## Problem Statement

`teachers-update.tsx` (367 lines) and `managers-manage.tsx` (384 lines) share ~280 lines of nearly identical code: optimistic state management, useTxStream confirmation handling, interactive badge rendering, AliasListInput integration, pending changes summary, gateway confirmation UI, cost breakdown, and submit button. The only meaningful differences are:
- Teachers has a min-1 guard (at least one teacher must remain)
- Teachers has `parseTeacherTxError`
- Managers shows a project owner badge
- Different TX type and param names

**Why it matters:** Bugs in one component (like the missing `reset()` in managers) don't get fixed in the other. Changes require updating two files identically. This is tech debt that will compound as more team management components are added.

## Proposed Solutions

### Option A: Extract shared TeamManageCard component
**Pros:** Single implementation, bugs fixed once, consistent UX
**Cons:** Higher effort, needs careful API design for the differences
**Effort:** Large (2-3 hours)
**Risk:** Medium — needs to accommodate teacher vs manager differences

### Option B: Keep as-is, fix bugs individually
**Pros:** No refactor risk, each component is self-contained
**Cons:** Duplication persists, divergence will continue
**Effort:** None now
**Risk:** Low immediate, high long-term

## Recommended Action

Option A when a third team management component is needed (YAGNI for now). Track for future extraction to @andamio/transactions package.

## Technical Details

**Affected files:**
- `src/components/tx/teachers-update.tsx`
- `src/components/tx/managers-manage.tsx`

## Acceptance Criteria

- [ ] Decision documented: extract when third use case appears or during package extraction

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Classic twin-component duplication |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
