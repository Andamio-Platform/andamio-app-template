---
status: pending
priority: p2
issue_id: "019"
tags: [code-review, quality, pr-341]
dependencies: []
---

# Extract Deeply Nested Ternary in Contributor Page Card Description

## Problem Statement

The card description in `contributor/page.tsx` (lines 347-361) is a 7-level nested ternary that's hard to parse. The existing file already has a `getStatusStatColor` helper function showing the preferred pattern.

**Why it matters:** Readability — fails the 5-second rule for understanding intent.

## Findings

- **TypeScript Reviewer**: Suggest `getCardDescription(status, hasClaimed)` helper function
- **Code Simplicity Reviewer**: Flagged as deeply nested, matches existing helper pattern

## Proposed Solutions

### Solution 1: Extract Helper Function (Recommended)
```typescript
function getCardDescription(status: string | null, hasClaimed: boolean): string {
  if (status === "REFUSED") return "Your work was not accepted...";
  if (status === "ACCEPTED" && hasClaimed) return "You've claimed your credential...";
  // etc.
}
```

- **Effort:** Small (< 15 min)
- **Risk:** None

## Acceptance Criteria

- [ ] Helper function replaces inline ternary
- [ ] Same behavior

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | TypeScript + Simplicity reviewers flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
