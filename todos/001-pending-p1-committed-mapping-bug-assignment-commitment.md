---
status: complete
priority: p1
issue_id: "001"
tags: [code-review, bug, pr-45]
dependencies: []
---

# Bug: COMMITTED maps to "SUBMITTED" instead of "PENDING_APPROVAL" in use-assignment-commitment.ts

## Problem Statement

In `src/hooks/api/course/use-assignment-commitment.ts:133`, the legacy mapping `COMMITTED: "SUBMITTED"` is incorrect. This STATUS_MAP maps raw DB values to **display values** (PENDING_APPROVAL, ASSIGNMENT_ACCEPTED, etc.). The string `"SUBMITTED"` is a raw DB value, not a display value in this hook's vocabulary.

If stale cached data contains `COMMITTED`, it becomes `networkStatus: "SUBMITTED"` — but a fresh API response with `SUBMITTED` becomes `networkStatus: "PENDING_APPROVAL"` (line 126). These are different display values for the same logical state.

**Found by:** 3 independent reviewers (TypeScript, Simplicity, Architecture)

## Findings

- **Location:** `src/hooks/api/course/use-assignment-commitment.ts:133`
- **Current:** `COMMITTED: "SUBMITTED"`
- **Expected:** `COMMITTED: "PENDING_APPROVAL"` (matching `use-student-assignment-commitments.ts:67`)
- **Impact:** Course assignment detail page shows "Submitted" instead of "Pending Review" for stale cached COMMITTED values

## Proposed Solutions

### Option A: Fix the mapping (Recommended)
Change `COMMITTED: "SUBMITTED"` to `COMMITTED: "PENDING_APPROVAL"`.

- **Pros:** One-line fix, consistent with the other course hook
- **Cons:** None
- **Effort:** Small (1 line)
- **Risk:** None

## Acceptance Criteria

- [ ] `COMMITTED` maps to `"PENDING_APPROVAL"` in `use-assignment-commitment.ts`
- [ ] Consistent with `use-student-assignment-commitments.ts:67`

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-23 | Created | Found during PR #45 review by 3 independent agents |

## Resources

- PR: #45
- File: `src/hooks/api/course/use-assignment-commitment.ts:133`
