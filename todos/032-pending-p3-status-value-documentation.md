---
status: pending
priority: p3
issue_id: "032"
tags: [code-review, documentation, consistency, pr-336]
dependencies: []
---

# Add Status Value Documentation Comments

## Problem Statement

The `useManagerCommitments` hook passes raw API status values while `useTeacherAssignmentCommitments` maps `SUBMITTED` to `PENDING_APPROVAL`. Both pages defensively check for both values (`SUBMITTED || PENDING_APPROVAL`), but without comments this is confusing — in manage-learners, the `SUBMITTED` check is dead code (teacher hook already maps it). In manage-contributors, the `PENDING_APPROVAL` check may be dead code.

## Findings

- **Source**: TypeScript Reviewer, Architecture Strategist
- **Files**:
  - `src/app/(studio)/studio/course/[coursenft]/manage-learners/page.tsx` (lines 55-56)
  - `src/app/(studio)/studio/project/[projectid]/manage-contributors/page.tsx` (lines 54-55)

## Proposed Solutions

Add brief comments in each page's useMemo noting which status values the hook actually provides and why both are checked defensively.

- **Effort**: Small (2 comment lines per file)
- **Risk**: None

## Acceptance Criteria

- [ ] Comment in manage-learners noting teacher hook maps SUBMITTED -> PENDING_APPROVAL
- [ ] Comment in manage-contributors noting manager hook passes raw status values

## Work Log

- 2026-02-24: Created from PR #336 review (TypeScript + Architecture findings)
