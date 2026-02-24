---
status: pending
priority: p2
issue_id: "017"
tags: [code-review, architecture, pr-341]
dependencies: []
---

# Extract useProjectEligibility Hook to Eliminate 3-File Duplication

## Problem Statement

The prerequisite eligibility derivation pattern (~12 lines) is duplicated nearly identically across three page components:
1. `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` (lines 95-109)
2. `src/app/(app)/project/[projectid]/contributor/page.tsx` (lines 94-109)
3. `src/app/(app)/project/[projectid]/page.tsx` (lines 67-80)

Each does: extract `prereqCourseIds` → call `useStudentCompletionsForPrereqs` → derive `prerequisites` → compute `eligibility` via `checkProjectEligibility`.

**Why it matters:** If eligibility semantics change (e.g., new prerequisite types, different auth gating), three files must be updated in lockstep. Unanimously flagged by Architecture, TypeScript, and Simplicity reviewers.

## Findings

- **Architecture Reviewer**: Extract `useProjectEligibility(projectId)` — encapsulates chain of prereqCourseIds → completions hook → eligibility check
- **TypeScript Reviewer**: 12 lines of identical boilerplate across 3 files
- **Code Simplicity Reviewer**: ~36 lines across 3 files → ~3 lines each + ~20-line shared hook = ~24 LOC net reduction

## Proposed Solutions

### Solution 1: Shared Hook (Recommended)
Create `src/hooks/api/project/use-project-eligibility.ts`:

```typescript
export function useProjectEligibility(projectId: string) {
  const { isAuthenticated } = useAndamioAuth();
  const { data: project } = useProject(projectId);
  // ... prereqCourseIds, completions, eligibility derivation
  return { eligibility, prerequisites, completions, isLoading };
}
```

- **Pros:** Single source of truth, DRY, ~24 LOC reduction, natural home for `hasClaimed` too
- **Cons:** New file to maintain
- **Effort:** Small (< 1 hour)
- **Risk:** Low

## Acceptance Criteria

- [ ] Shared hook exists at `src/hooks/api/project/use-project-eligibility.ts`
- [ ] All three pages use the shared hook
- [ ] No behavior changes
- [ ] TypeScript compiles without errors

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | Unanimously flagged by 3/7 review agents |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
