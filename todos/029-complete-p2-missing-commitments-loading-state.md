---
status: complete
priority: p2
issue_id: "029"
tags: [code-review, ux, consistency, pr-336]
dependencies: []
---

# Missing Commitments Loading State in manage-contributors

## Problem Statement

The `manage-contributors` page does not destructure or check `isLoading` from `useManagerCommitments()`. If the project loads quickly but commitments are slow, users see a table with all-zero stats briefly before real numbers appear. The `manage-learners` page correctly gates on both `courseLoading || commitmentsLoading`.

## Findings

- **Source**: Architecture Strategist
- **File**: `src/app/(studio)/studio/project/[projectid]/manage-contributors/page.tsx` (line 45)
- **Evidence**: `const { data: commitments } = useManagerCommitments(projectId);` — no `isLoading` destructured
- **Compare**: `manage-learners/page.tsx` line 46: `const { data: commitments, isLoading: commitmentsLoading } = useTeacherAssignmentCommitments(courseId);`

## Proposed Solutions

### Option A: Add commitments loading gate (Recommended)
Destructure `isLoading: commitmentsLoading` and include in loading check.

- **Effort**: Small (2 lines changed)
- **Risk**: None

## Technical Details

```typescript
// Change line 45 from:
const { data: commitments } = useManagerCommitments(projectId);
// To:
const { data: commitments, isLoading: commitmentsLoading } = useManagerCommitments(projectId);

// Change line 76 from:
if (isLoading) {
// To:
if (isLoading || commitmentsLoading) {
```

## Acceptance Criteria

- [ ] Loading spinner shown until both project AND commitments data are loaded
- [ ] Matches manage-learners loading behavior

## Work Log

- 2026-02-24: Created from PR #336 review (Architecture Strategist finding)
