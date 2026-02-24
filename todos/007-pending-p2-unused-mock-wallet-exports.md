---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, quality, pr-342]
dependencies: []
---

# 3 Unused Mock Wallet Exports

## Problem Statement

Three exported functions in `e2e/mocks/mesh-wallet-mock.ts` are never imported anywhere:
- `setMockWalletAccessToken`
- `simulateWalletConnect`
- `connectMockWalletViaUI`

**Why it matters:** YAGNI — unused exports add cognitive overhead and suggest incomplete implementation.

## Findings

- **Code Simplicity Reviewer**: 3 mock wallet exports never imported anywhere — YAGNI violation

**Location:** `e2e/mocks/mesh-wallet-mock.ts`

## Proposed Solutions

### Solution 1: Remove Unused Exports (Recommended)
Delete the three unused functions.

- **Pros:** Cleaner codebase, YAGNI
- **Cons:** May need to re-add if future specs use them
- **Effort:** Small (< 15 min)
- **Risk:** Low

### Solution 2: Mark as TODO
Add TODO comments indicating these are planned for future specs.

- **Pros:** Documents intent
- **Cons:** Still dead code
- **Effort:** Small (< 5 min)
- **Risk:** None

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `e2e/mocks/mesh-wallet-mock.ts`

## Acceptance Criteria

- [ ] Unused exports removed or documented with intent
- [ ] No import errors in existing specs

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Code simplicity reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
