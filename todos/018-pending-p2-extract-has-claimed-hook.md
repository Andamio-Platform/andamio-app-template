---
status: pending
priority: p2
issue_id: "018"
tags: [code-review, architecture, pr-341]
dependencies: ["017"]
---

# Extract hasClaimed Logic from 3 Pages into Shared Hook

## Problem Statement

The `hasClaimed` detection pattern — cross-referencing `project.credentialClaims` for the user's alias — is duplicated across three pages with slightly different implementations:
1. Task detail: `project.credentialClaims.some((c) => c.alias === alias)` (useMemo)
2. Contributor: `credentialCount > 0` (derived from filtered credentials)
3. Project detail: `(project.credentialClaims ?? []).some((c) => c.alias === alias)` (inline in useMemo)

**Why it matters:** Semantically identical logic with divergent implementations. If "claimed" semantics change, three files need updating.

## Findings

- **Architecture Reviewer**: Recommend extracting to shared hook, could live inside `useProjectEligibility`
- **Security Reviewer**: Confirmed all three are safe — both data sources server-authoritative

## Proposed Solutions

### Solution 1: Include in useProjectEligibility (Recommended)
Add `hasClaimed` to the return value of the `useProjectEligibility` hook from todo 017.

- **Pros:** No additional file, natural co-location with eligibility
- **Cons:** Couples two concepts
- **Effort:** Small (< 30 min)
- **Risk:** Low

### Solution 2: Standalone useHasClaimed Hook
Separate hook at `src/hooks/api/project/use-has-claimed.ts`.

- **Pros:** Single responsibility
- **Cons:** Yet another small hook file
- **Effort:** Small (< 30 min)
- **Risk:** Low

## Acceptance Criteria

- [ ] Single source of truth for hasClaimed logic
- [ ] All three pages use the shared implementation
- [ ] No behavior changes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | Architecture reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
