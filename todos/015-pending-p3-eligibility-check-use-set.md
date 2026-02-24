---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, performance, pr-342]
dependencies: []
---

# checkProjectEligibility Uses .includes() Instead of Set

## Problem Statement

`checkProjectEligibility` uses `.includes()` for prerequisite matching, which is O(n) per check. A `Set` would be O(1).

**Why it matters:** Minor optimization for projects with many prerequisites.

## Proposed Solutions

### Solution 1: Use Set for Lookups
Convert the completions array to a `Set` before checking prerequisites.

- **Effort:** Small (< 15 min)
- **Risk:** None

## Acceptance Criteria

- [ ] Set-based lookup in `checkProjectEligibility`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Performance reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
