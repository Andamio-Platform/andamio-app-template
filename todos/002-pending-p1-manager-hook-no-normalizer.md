---
status: complete
priority: p1
issue_id: "002"
tags: [code-review, bug, pr-45]
dependencies: []
---

# Bug: Manager hook passes raw status without normalization

## Problem Statement

`src/hooks/api/project/use-project-manager.ts:242` passes `commitment_status` through without normalization:

```typescript
commitmentStatus: api.content?.commitment_status,
```

The `commitments/page.tsx` component filters with `c.commitmentStatus === "SUBMITTED"` (lines 282, 317, 641). If a stale React Query cache entry contains `"COMMITTED"`, it won't match `=== "SUBMITTED"` and the commitment will be **invisible** in the manager review queue.

The only safety net is the `case "COMMITTED"` in `getManagerStatusHint` (line 109), which provides a hint string but does NOT fix the filter/count/decision-button conditions.

## Findings

- **Location:** `src/hooks/api/project/use-project-manager.ts:242`
- **Impact:** Stale COMMITTED entries are invisible in manager review queue (findNextPending, pendingCount, decision buttons)
- **Root cause:** Every other project hook normalizes via PROJECT_STATUS_MAP, but the manager hook does not

## Proposed Solutions

### Option A: Add normalizer to manager hook (Recommended)
Add a `normalizeProjectCommitmentStatus()` call in the manager hook's transform function, matching `use-project-contributor.ts`.

- **Pros:** Consistent with other hooks, fixes the root cause
- **Cons:** Requires importing the normalizer function
- **Effort:** Small (2-3 lines)
- **Risk:** Low

### Option B: Add COMMITTED back to component filters as temporary safety
Add `|| c.commitmentStatus === "COMMITTED"` back to findNextPending, pendingCount, and decision condition.

- **Pros:** Quick fix
- **Cons:** Spreads legacy values back into components, contradicts PR intent
- **Effort:** Small
- **Risk:** Low but creates tech debt

## Acceptance Criteria

- [ ] Manager hook normalizes `commitment_status` through PROJECT_STATUS_MAP or equivalent
- [ ] Stale "COMMITTED" values are mapped to "SUBMITTED" before reaching components

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-23 | Created | Found during PR #45 review |

## Resources

- PR: #45
- File: `src/hooks/api/project/use-project-manager.ts:242`
- Related: `src/app/(studio)/studio/project/[projectid]/commitments/page.tsx`
