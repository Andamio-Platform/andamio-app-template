---
status: pending
priority: p3
issue_id: "031"
tags: [code-review, simplicity, performance, pr-336]
dependencies: []
---

# Merge totalAccepted into Main Stats useMemo

## Problem Statement

Both `manage-learners` and `manage-contributors` have a separate `totalAccepted` useMemo that iterates all values of the stats Map. This could be computed as a running counter inside the main stats-building loop, eliminating an extra memo and iteration.

## Findings

- **Source**: Code Simplicity Reviewer
- **Files**:
  - `src/app/(studio)/studio/course/[coursenft]/manage-learners/page.tsx` (lines 68-71)
  - `src/app/(studio)/studio/project/[projectid]/manage-contributors/page.tsx` (lines 62-65)

## Proposed Solutions

Return `{ stats, totalAccepted }` from the main useMemo with `accepted` as a running counter.

- **Effort**: Small (~4 lines changed per file)
- **Risk**: None

## Acceptance Criteria

- [ ] `totalAccepted` computed inside main stats memo in both files
- [ ] Separate `totalAccepted` useMemo removed from both files

## Work Log

- 2026-02-24: Created from PR #336 review (Simplicity finding)
