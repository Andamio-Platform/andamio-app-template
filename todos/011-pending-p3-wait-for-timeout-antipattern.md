---
status: pending
priority: p3
issue_id: "011"
tags: [code-review, testing, pr-342]
dependencies: []
---

# connectMockWalletViaUI Uses waitForTimeout(3000) Anti-Pattern

## Problem Statement

`connectMockWalletViaUI` in `e2e/mocks/mesh-wallet-mock.ts` uses `page.waitForTimeout(3000)` — a hardcoded sleep — instead of waiting for a specific DOM condition.

**Why it matters:** Hardcoded timeouts are flaky in CI (too slow on fast machines, too fast on slow ones).

## Proposed Solutions

### Solution 1: Replace with Condition-Based Wait
Use `page.waitForSelector` or `expect(locator).toBeVisible()` instead.

- **Effort:** Small (< 30 min)
- **Risk:** Low

Note: This function is currently unused (see todo 007), so this is only relevant if the function is kept.

## Acceptance Criteria

- [ ] No `waitForTimeout` calls in mock wallet code

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
