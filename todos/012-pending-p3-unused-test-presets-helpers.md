---
status: pending
priority: p3
issue_id: "012"
tags: [code-review, testing, pr-342]
dependencies: []
---

# testPresets and testHelpers in Auth Fixtures Unused

## Problem Statement

`testPresets` and `testHelpers` are exported from `e2e/fixtures/auth.fixture.ts` but never imported anywhere.

**Why it matters:** Unused exports add cognitive overhead.

## Proposed Solutions

### Solution 1: Remove Unused Exports
Delete if not planned for immediate use.

- **Effort:** Small (< 15 min)
- **Risk:** None

## Acceptance Criteria

- [ ] No unused exports in auth fixtures

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
