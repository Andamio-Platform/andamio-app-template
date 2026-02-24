---
status: pending
priority: p2
issue_id: "003"
tags: [code-review, performance, pr-342]
dependencies: []
---

# Earned Rewards Calculation Has O(n*m) Complexity

## Problem Statement

The earned rewards calculation in `contributor/page.tsx` uses a nested `.find()` inside `.reduce()`, resulting in O(n*m) time complexity where n = commitments and m = tasks.

**Why it matters:** While acceptable at current scale, this will degrade as projects grow with more tasks and commitments.

## Findings

- **Performance Reviewer**: Nested `.find()` inside `.reduce()` is O(n*m) — should use Map for O(n+m)

**Location:** `src/app/(app)/project/[projectid]/contributor/page.tsx` — earned rewards reduce block

## Proposed Solutions

### Solution 1: Pre-index Tasks with Map (Recommended)
Build a `Map<taskHash, task>` before the reduce, then look up by hash in O(1).

- **Pros:** O(n+m) instead of O(n*m), clean pattern
- **Cons:** Slightly more code
- **Effort:** Small (< 30 min)
- **Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `src/app/(app)/project/[projectid]/contributor/page.tsx`

## Acceptance Criteria

- [ ] Earned rewards calculation uses Map-based lookup
- [ ] Same output as current implementation
- [ ] No TypeScript errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Performance reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
