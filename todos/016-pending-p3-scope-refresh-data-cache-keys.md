---
status: pending
priority: p3
issue_id: "016"
tags: [code-review, performance, pr-342]
dependencies: []
---

# Scope refreshData from projectContributorKeys.all to Project-Specific

## Problem Statement

`refreshData` in the contributor page invalidates `projectContributorKeys.all` which clears cache for ALL projects' contributor data, not just the current project.

**Why it matters:** Over-invalidation causes unnecessary refetches for unrelated projects.

## Proposed Solutions

### Solution 1: Use Project-Scoped Cache Key
Invalidate `projectContributorKeys.detail(projectId)` instead of `.all`.

- **Effort:** Small (< 15 min)
- **Risk:** Low — must verify key structure

## Acceptance Criteria

- [ ] Cache invalidation scoped to current project only

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Performance reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
