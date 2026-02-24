---
status: pending
priority: p3
issue_id: "023"
tags: [code-review, quality, pr-341]
dependencies: []
---

# Make Treasury refreshData Use Promise.all for Consistency

## Problem Statement

The manage-treasury `refreshData` uses sequential `await` for two `invalidateQueries` calls, while the task detail and contributor pages use `Promise.all()`. Minor inconsistency.

## Proposed Solutions

### Solution 1: Use Promise.all
```typescript
await Promise.all([
  queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
  queryClient.invalidateQueries({ queryKey: projectManagerKeys.tasks(projectId) }),
]);
```

- **Effort:** Small (< 5 min)
- **Risk:** None

## Acceptance Criteria

- [ ] Treasury refreshData uses Promise.all

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | Performance reviewer noted |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
