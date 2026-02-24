---
status: pending
priority: p3
issue_id: "010"
tags: [code-review, quality, pr-342]
dependencies: []
---

# Plan Doc Contains Stale 280-Line Spec Copy

## Problem Statement

`docs/plans/2026-02-20-pr-scoped-e2e-verification-plan.md` (488 lines) contains a ~280-line copy of the spec that duplicates the design doc. This makes it harder to determine which is the source of truth.

**Why it matters:** Duplicated specs drift over time and cause confusion.

## Proposed Solutions

### Solution 1: Trim Plan to Implementation Steps Only
Remove the spec copy and link to the design doc instead.

- **Effort:** Small (< 30 min)
- **Risk:** None

## Acceptance Criteria

- [ ] Plan doc references design doc instead of duplicating spec

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Code simplicity reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
