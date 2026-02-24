---
status: pending
priority: p2
issue_id: "004"
tags: [code-review, architecture, pr-342]
dependencies: []
---

# hasClaimed Logic Duplicated Across 3 Pages

## Problem Statement

The `hasClaimed` detection pattern — cross-referencing `project.credentialClaims` for the user's alias — is duplicated across three pages:
1. `src/app/(app)/project/[projectid]/page.tsx`
2. `src/app/(app)/project/[projectid]/contributor/page.tsx`
3. `src/app/(app)/project/[projectid]/[taskhash]/page.tsx`

**Why it matters:** Duplicated business logic means bug fixes must be applied in multiple places. A shared hook would centralize this.

## Findings

- **Architecture Reviewer**: Recommend extracting `useProjectContributorStatus` hook
- **Code Simplicity Reviewer**: Duplication acceptable in different contexts but worth extracting

**Location:** All three files listed above

## Proposed Solutions

### Solution 1: Extract `useProjectContributorStatus` Hook (Recommended)
Create a shared hook that encapsulates `hasClaimed`, `isEnrolled`, and `contributorStatus` logic.

- **Pros:** Single source of truth, DRY, easier to test
- **Cons:** New abstraction to maintain
- **Effort:** Medium (1-2 hours)
- **Risk:** Low

### Solution 2: Leave As-Is for Now
The duplication is across pages with different data shapes and contexts. Can revisit later.

- **Pros:** No change, no risk
- **Cons:** Continued duplication
- **Effort:** None
- **Risk:** None

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `src/app/(app)/project/[projectid]/page.tsx`
- `src/app/(app)/project/[projectid]/contributor/page.tsx`
- `src/app/(app)/project/[projectid]/[taskhash]/page.tsx`

## Acceptance Criteria

- [ ] Shared hook exists with `hasClaimed` logic
- [ ] All three pages use the shared hook
- [ ] No behavior changes
- [ ] TypeScript compiles without errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Architecture reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
