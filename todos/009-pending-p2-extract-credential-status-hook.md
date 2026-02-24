---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, architecture, typescript, DRY]
dependencies: []
---

# Extract Credential-Aware Status Derivation into Reusable Hook

## Problem Statement

The `CREDENTIAL_CLAIMED` detection logic (cross-referencing `useStudentCredentials()` with `useStudentAssignmentCommitments()`) lives only in the module detail page (`page.tsx`). Two other pages that consume `getModuleCommitmentStatus` do NOT perform this cross-reference, creating inconsistent status display:

- `/course/[coursenft]/[modulecode]/page.tsx` — shows "Credential Earned" (has cross-reference)
- `/course/[coursenft]/page.tsx` — shows "Assignment Accepted" (no cross-reference)
- `/course/[coursenft]/[modulecode]/assignment/page.tsx` — shows "Assignment Accepted" (no cross-reference)

A student navigating from the course outline to the module page sees contradictory states.

**Why it matters:** UX inconsistency confuses users and violates DRY. The `hasClaimedModuleCredential` helper is buried in a page file instead of being shared.

## Findings

- **4 of 7 review agents** flagged this: Architecture, TypeScript, Agent-Native, and Simplicity reviewers
- Architecture reviewer identified the exact three pages with inconsistent status
- The pattern already exists in `use-student-completions-for-prereqs.ts` which composes `useStudentCredentials()` with domain logic
- `src/lib/assignment-status.ts` already defines `CREDENTIAL_CLAIMED` as a valid `AssignmentStatus`

**Evidence:**
```typescript
// Module page (page.tsx:72-92) — has credential cross-reference
const moduleCommitmentStatus = useMemo(() => {
  // ...cross-references credentials...
  if (hasClaimedCredential) return "CREDENTIAL_CLAIMED";
  return commitmentStatus;
}, [studentCommitments, studentCredentials, moduleCode, courseId]);

// Course outline (page.tsx:207) — does NOT cross-reference
const status = getModuleCommitmentStatus(moduleCommitments);
// Will show ASSIGNMENT_ACCEPTED even when credential is claimed
```

## Proposed Solutions

### Option A: Extract `useModuleCommitmentStatus` hook (Recommended)

Create a composed hook that encapsulates the credential cross-reference:

```typescript
// src/hooks/api/course/use-module-commitment-status.ts
export function useModuleCommitmentStatus(courseId: string, moduleCode: string) {
  const { isAuthenticated } = useAndamioAuth();
  const { data: commitments } = useStudentAssignmentCommitments(
    isAuthenticated ? courseId : undefined,
  );
  const { data: credentials } = useStudentCredentials();

  return useMemo(() => {
    if (!commitments) return null;
    const filtered = commitments.filter(
      (c) => c.courseId === courseId && c.moduleCode === moduleCode,
    );
    const status = getModuleCommitmentStatus(filtered);
    if (status === "ASSIGNMENT_ACCEPTED") {
      if (hasClaimedModuleCredential(credentials ?? [], courseId, moduleCode)) {
        return "CREDENTIAL_CLAIMED";
      }
    }
    return status;
  }, [commitments, credentials, courseId, moduleCode]);
}
```

Move `hasClaimedModuleCredential` to `~/lib/credential-utils.ts` or co-locate with the hook.

- **Pros:** Consistent status everywhere, follows existing `use-student-completions-for-prereqs` pattern, reduces page component responsibility
- **Cons:** Slightly more abstraction
- **Effort:** Small
- **Risk:** Low — pure refactoring, no behavior change

### Option B: Fix at the API level

Request that the Gateway API's commitment endpoint cross-reference credential data and return `CREDENTIAL_CLAIMED` when appropriate.

- **Pros:** Single source of truth, eliminates client-side joins entirely
- **Cons:** Requires API team coordination, longer timeline
- **Effort:** Medium (API change + frontend simplification)
- **Risk:** Low

## Recommended Action

Option A now (frontend consistency), Option B tracked as a separate API issue.

## Technical Details

**Affected files:**
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx` — extract logic from here
- `src/app/(app)/course/[coursenft]/page.tsx` — consume the new hook
- `src/app/(app)/course/[coursenft]/[modulecode]/assignment/page.tsx` — consume the new hook
- New: `src/hooks/api/course/use-module-commitment-status.ts`
- New or modified: `src/lib/credential-utils.ts` (move `hasClaimedModuleCredential`)

## Acceptance Criteria

- [ ] All three pages show consistent "Credential Earned" status after credential claim
- [ ] `hasClaimedModuleCredential` is in a shared location, not buried in page.tsx
- [ ] New hook follows the `use-student-completions-for-prereqs` pattern
- [ ] No new network requests (hooks deduplicate via React Query)

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-02-24 | Created | From PR #322 code review — 4/7 agents flagged |

## Resources

- PR #322: https://github.com/andamio-platform/andamio-app-v2/pull/322
- Related pattern: `src/hooks/api/course/use-student-completions-for-prereqs.ts`
- Assignment status types: `src/lib/assignment-status.ts`
