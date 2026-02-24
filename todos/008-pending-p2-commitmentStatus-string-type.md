---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, typescript, pr-342]
dependencies: []
---

# commitmentStatus Typed as String Instead of Discriminated Union

## Problem Statement

`commitmentStatus` is typed as `string | undefined` rather than a discriminated union of known status values (e.g., `"ACCEPTED" | "COMMITTED" | "COMPLETED" | undefined`).

**Why it matters:** Loose string typing loses the benefit of TypeScript's exhaustiveness checking and allows invalid status comparisons to compile without error.

## Findings

- **TypeScript Reviewer**: `commitmentStatus` typed as `string | undefined` instead of discriminated union

**Location:** `src/app/(app)/project/[projectid]/contributor/page.tsx`

## Proposed Solutions

### Solution 1: Define Status Union Type (Recommended)
Create a `CommitmentStatus` type from the known API values and use it throughout.

- **Pros:** Type safety, exhaustiveness checking, IDE autocomplete
- **Cons:** Must keep in sync with API types
- **Effort:** Small (< 30 min)
- **Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `src/app/(app)/project/[projectid]/contributor/page.tsx`
- Possibly `src/types/generated/` if type needs adding

## Acceptance Criteria

- [ ] `commitmentStatus` uses discriminated union type
- [ ] All comparisons type-checked
- [ ] No TypeScript errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | TypeScript reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
