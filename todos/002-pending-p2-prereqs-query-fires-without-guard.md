---
status: pending
priority: p2
issue_id: "002"
tags: [code-review, performance, pr-342]
dependencies: []
---

# useStudentCompletionsForPrereqs Fires Without Prerequisites Guard

## Problem Statement

`useStudentCompletionsForPrereqs` calls `useStudentCredentials` for every authenticated user, even when the project has zero prerequisites. The hook lacks an `enabled` guard that would skip the query when `project.prerequisites` is empty.

**Why it matters:** Unnecessary API calls on every project page view for users in projects with no prerequisites.

## Findings

- **Performance Reviewer**: Hook fires for all authenticated users even with zero prerequisites
- **Architecture Reviewer**: Needs `enabled: prerequisites.length > 0` guard

**Location:** Hook usage in `src/app/(app)/project/[projectid]/contributor/page.tsx` and `src/app/(app)/project/[projectid]/page.tsx`

## Proposed Solutions

### Solution 1: Add `enabled` Guard (Recommended)
Pass `enabled: project.prerequisites.length > 0` to the underlying React Query hook so it skips the API call when there are no prerequisites.

- **Pros:** Zero API calls for projects without prerequisites
- **Cons:** Requires modifying the hook's signature
- **Effort:** Small (< 30 min)
- **Risk:** Low

### Solution 2: Early Return in Hook
Have the hook return empty results immediately if prerequisites array is empty.

- **Pros:** No signature change needed
- **Cons:** Still instantiates the hook, just returns early
- **Effort:** Small (< 30 min)
- **Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `src/app/(app)/project/[projectid]/contributor/page.tsx`
- `src/app/(app)/project/[projectid]/page.tsx`
- The `useStudentCompletionsForPrereqs` hook definition

## Acceptance Criteria

- [ ] No API call fires when `project.prerequisites` is empty
- [ ] Eligibility still works correctly for projects with prerequisites
- [ ] No TypeScript errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Performance reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
