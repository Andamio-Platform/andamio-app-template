---
status: complete
priority: p2
issue_id: "027"
tags: [code-review, security, authorization, pr-336]
dependencies: []
---

# Missing Role Authorization on manage-learners Page

## Problem Statement

The `ManageLearnersPage` only checks `isAuthenticated` before rendering learner data. It does not verify the user is an owner or teacher of the course. The parent course editor page wraps its content in `<RequireCourseAccess>`, but this child page does not.

Any authenticated wallet holder can navigate directly to `/studio/course/{courseId}/manage-learners` and see learner aliases and assignment stats.

## Findings

- **Source**: Security Sentinel, Architecture Strategist
- **File**: `src/app/(studio)/studio/course/[coursenft]/manage-learners/page.tsx` (lines 67-80)
- **Evidence**: Page only checks `!isAuthenticated` then renders data. Compare to course editor page which uses `<RequireCourseAccess>` wrapper.
- **Existing component**: `src/components/auth/require-course-access.tsx` provides the exact wrapper needed.

## Proposed Solutions

### Option A: Wrap in RequireCourseAccess (Recommended)
Split the page into a wrapper + content component, with `RequireCourseAccess` as the gate.

- **Pros**: Consistent with course editor page pattern; defense-in-depth; reuses existing component
- **Cons**: Minor refactor to split into two components
- **Effort**: Small (10 lines changed)
- **Risk**: Low

### Option B: Check role inline after data loads
After `useCourse()` loads, check if current user is in owners/teachers list.

- **Pros**: No component split needed
- **Cons**: Duplicates RequireCourseAccess logic; inconsistent pattern
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A — wrap in `<RequireCourseAccess>` to match the parent page pattern.

## Technical Details

- **Affected files**: `src/app/(studio)/studio/course/[coursenft]/manage-learners/page.tsx`
- **Components**: `RequireCourseAccess` from `~/components/auth/require-course-access`

## Acceptance Criteria

- [ ] `ManageLearnersPage` uses `<RequireCourseAccess>` wrapper
- [ ] Unauthenticated users see ConnectWalletGate
- [ ] Authenticated non-teacher/non-owner users see "Access Denied"
- [ ] Teachers and owners see learner data as before

## Work Log

- 2026-02-24: Created from PR #336 review (Security Sentinel finding)

## Resources

- PR #336: feat(studio): redesign contributors page + View Learners
- Existing pattern: `src/app/(studio)/studio/course/[coursenft]/page.tsx` (uses RequireCourseAccess)
