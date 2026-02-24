---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, typescript, type-safety]
dependencies: []
---

# Add Union Type for Module Commitment Status

## Problem Statement

`commitmentStatus` and `networkStatus` are typed as `string | null` throughout the codebase. The new `CREDENTIAL_CLAIMED` status is a synthetic value with no compile-time type safety. Switch statements in `getAssignmentCTAConfig` and `getBannerConfig` use bare string literals. Typos in status strings would silently fall through to the default case.

**Why it matters:** With this PR adding a new synthetic status (`CREDENTIAL_CLAIMED`) and switch cases that depend on exact string matching, the absence of a union type means no compile-time guarantee that all statuses are handled consistently.

## Findings

- **TypeScript reviewer** flagged as moderate priority
- `getModuleCommitmentStatus` returns `string | null`
- `AssignmentCTAProps.commitmentStatus` is `string | null`
- `getBannerConfig` takes `networkStatus: string`
- `src/lib/assignment-status.ts` already defines `AssignmentStatus` which includes `CREDENTIAL_CLAIMED`
- `StudentCommitmentSummary.networkStatus` is `string` (from generated types)

**Evidence:**
```typescript
// No type safety on these switch cases:
function getAssignmentCTAConfig(status: string | null) {
  switch (status) {
    case "NOT_STARTED": // typo here would silently fail
    case "ASSIGNMENT_ACCEPTED":
    case "CREDENTIAL_CLAIMED":
    // ...
  }
}
```

## Proposed Solutions

### Option A: Create `ModuleCommitmentStatus` union type (Recommended)

```typescript
// In use-student-assignment-commitments.ts or a shared location
export type ModuleCommitmentStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "PENDING_APPROVAL"
  | "ASSIGNMENT_ACCEPTED"
  | "ASSIGNMENT_REFUSED"
  | "CREDENTIAL_CLAIMED";

export function getModuleCommitmentStatus(
  commitments: StudentCommitmentSummary[],
): ModuleCommitmentStatus | null { ... }
```

Then update `AssignmentCTAProps`, `getBannerConfig`, and the proposed `useModuleCommitmentStatus` hook to use this type.

- **Pros:** Compile-time safety, exhaustiveness checking, self-documenting
- **Cons:** Minor refactoring effort
- **Effort:** Small
- **Risk:** Low

### Option B: Use the existing `AssignmentStatus` type from `assignment-status.ts`

The `AssignmentStatus` type already includes `CREDENTIAL_CLAIMED`. However, it also includes many statuses not relevant to module-level commitment (e.g., `PENDING_TX_*`), so it would be less precise.

- **Pros:** No new type, reuses existing
- **Cons:** Overly broad — includes statuses that are not valid module commitment states
- **Effort:** Small
- **Risk:** Low

## Recommended Action

Option A — create a focused `ModuleCommitmentStatus` type. Can be done alongside todo #009 (hook extraction).

## Technical Details

**Affected files:**
- `src/hooks/api/course/use-student-assignment-commitments.ts` — define type, narrow return type
- `src/app/(app)/course/[coursenft]/[modulecode]/page.tsx` — update `AssignmentCTAProps`
- `src/components/learner/assignment-commitment.tsx` — update `getBannerConfig` param

## Acceptance Criteria

- [ ] `ModuleCommitmentStatus` union type exists
- [ ] `getModuleCommitmentStatus` returns `ModuleCommitmentStatus | null`
- [ ] All switch/case consumers use the typed value
- [ ] TypeScript catches typos and missing cases at compile time

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-02-24 | Created | From PR #322 code review — TypeScript reviewer |

## Resources

- PR #322: https://github.com/andamio-platform/andamio-app-v2/pull/322
- Existing type: `src/lib/assignment-status.ts` (`AssignmentStatus`)
