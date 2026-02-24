---
status: complete
priority: p1
issue_id: "001"
tags: [code-review, quality, performance, pr-342]
dependencies: []
---

# Dead Eligibility Code in Task Detail Page

## Problem Statement

The task detail page (`src/app/(app)/project/[projectid]/[taskhash]/page.tsx`) imports and computes eligibility data (`useStudentCompletionsForPrereqs`, `checkProjectEligibility`, `isEligibilityLoading`, `eligibility`) but **never uses any of it in the JSX**. The `PrerequisiteList` component and `CourseIcon` are also imported but unused.

This is **not just dead code** — it fires an unnecessary API call (`useStudentCredentials` via `useStudentCompletionsForPrereqs`) for every authenticated user viewing any task, even projects with zero prerequisites. This wastes bandwidth and increases page load time.

**Why it matters:** Every task page view triggers an avoidable network request. This was unanimously flagged by the TypeScript, Performance, Architecture, and Code Simplicity reviewers.

## Findings

- **TypeScript Reviewer**: `isEligibilityLoading`, `eligibility`, `PrerequisiteList`, `CourseIcon` imported but never used in JSX output
- **Performance Reviewer**: `useStudentCredentials` fires for all authenticated users even when project has zero prerequisites
- **Architecture Reviewer**: `useStudentCompletionsForPrereqs` added but never wired into conditional rendering
- **Code Simplicity Reviewer**: Dead code fires unnecessary API call — classic YAGNI violation

**Location:** `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` — lines added in PR #342

## Proposed Solutions

### Solution 1: Remove Dead Code (Recommended)
Remove all unused imports and the `useStudentCompletionsForPrereqs` hook call. If eligibility gating is needed on the task page later, it can be re-added when the JSX actually uses it.

- **Pros:** Eliminates unnecessary API call, simplifies page, follows YAGNI
- **Cons:** Will need to re-add if eligibility UI is planned for task page
- **Effort:** Small (< 30 min)
- **Risk:** Low

### Solution 2: Wire Eligibility Into Task UI
Actually use the eligibility data to gate the commit button or show prerequisite status on the task page.

- **Pros:** Completes the apparent original intent of the code
- **Cons:** May not be desired UX — task page may intentionally show tasks without gating
- **Effort:** Medium (1-2 hours)
- **Risk:** Medium — requires UX decision

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `src/app/(app)/project/[projectid]/[taskhash]/page.tsx`

**Unused imports to remove:**
- `useStudentCompletionsForPrereqs`
- `checkProjectEligibility`
- `PrerequisiteList`
- `CourseIcon`

**Unused variables to remove:**
- `isEligibilityLoading`
- `eligibility`
- The entire `useStudentCompletionsForPrereqs(...)` hook call

## Acceptance Criteria

- [x] No unused imports remain in task detail page
- [x] `useStudentCompletionsForPrereqs` hook call removed (no unnecessary API request)
- [x] Page still renders correctly with all existing functionality
- [x] TypeScript compiles without errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Unanimously flagged by 4/7 review agents |
| 2026-02-24 | Fixed: removed dead imports + hook call | Solution 1 applied — removed `useStudentCompletionsForPrereqs`, `checkProjectEligibility`, `PrerequisiteList`, `CourseIcon`, and all derived variables |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
- File: `src/app/(app)/project/[projectid]/[taskhash]/page.tsx`
