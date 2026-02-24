---
status: complete
priority: p2
issue_id: "028"
tags: [code-review, security, authorization, pr-336]
dependencies: []
---

# Missing Role Authorization on manage-contributors Page

## Problem Statement

The `ManageContributorsPage` only checks `isAuthenticated` before rendering. It does not verify the user is a manager of the project. While `useManagerCommitments` uses an authenticated manager endpoint (which may enforce role access at the API level), the frontend should apply a consistent authorization gate.

## Findings

- **Source**: Security Sentinel, Architecture Strategist
- **File**: `src/app/(studio)/studio/project/[projectid]/manage-contributors/page.tsx` (lines 67-74)
- **Evidence**: Page only checks `!isAuthenticated`. The `useProject()` hook is a public endpoint, so contributor aliases are visible. `useManagerCommitments` is manager-scoped, but if it returns empty for non-managers the page still renders with zero stats (confusing UX).
- **Note**: No `RequireProjectAccess` component exists yet (unlike `RequireCourseAccess` for courses).

## Proposed Solutions

### Option A: Create RequireProjectAccess component (Recommended)
Create a new `RequireProjectAccess` wrapper following the `RequireCourseAccess` pattern. Check if the authenticated user appears in `project.managers`.

- **Pros**: Consistent architecture; reusable for other project management pages
- **Cons**: New component to create
- **Effort**: Medium (~50 lines, mirroring RequireCourseAccess)
- **Risk**: Low

### Option B: Inline manager check after project loads
After `useProject()` returns, check if the authenticated user's alias is in `project.managers` array.

- **Pros**: Quick fix, no new component
- **Cons**: Not reusable; pattern diverges from course pages
- **Effort**: Small
- **Risk**: Low

## Recommended Action

Option A — create `RequireProjectAccess` for pattern consistency.

## Technical Details

- **Affected files**: `src/app/(studio)/studio/project/[projectid]/manage-contributors/page.tsx`
- **New file**: `src/components/auth/require-project-access.tsx`
- **Reference**: `src/components/auth/require-course-access.tsx`

## Acceptance Criteria

- [ ] `ManageContributorsPage` uses role-based authorization wrapper
- [ ] Non-manager authenticated users see "Access Denied"
- [ ] Project managers see contributor data as before

## Work Log

- 2026-02-24: Created from PR #336 review (Security Sentinel finding)

## Resources

- PR #336: feat(studio): redesign contributors page + View Learners
- Reference pattern: `src/components/auth/require-course-access.tsx`
