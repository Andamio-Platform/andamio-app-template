---
title: "Normalize deprecated commitment status values across client-side codebase"
date: 2026-03-23
category: logic-errors
tags:
  - status-normalization
  - deprecated-values
  - react-query-cache
  - typescript-union-types
  - silent-regression
  - andamio-protocol
  - commitment-status
severity: high
component:
  - hooks/project-contributor
  - hooks/assignment-commitment
  - hooks/student-assignment-commitments
  - hooks/course-teacher
  - hooks/project-manager
  - lib/assignment-status
  - lib/format-status
symptom: >
  Course flows displayed "Unknown" status for SUBMITTED assignments;
  manager review queue silently dropped COMMITTED entries from stale
  React Query caches; cross-domain status comparison
  ("PENDING_APPROVAL" vs project commitment values) produced
  false negatives in contributor management page.
root_cause: >
  ~30 direct string comparisons against deprecated status values
  "COMMITTED" and "PENDING_TX_SUBMIT" with no client-side
  normalization layer; STATUS_ALIASES map missing SUBMITTED entry;
  use-assignment-commitment mapped COMMITTED to raw value "SUBMITTED"
  instead of display value "PENDING_APPROVAL"; all commitment
  statuses typed as bare string preventing compile-time detection
  of stale or cross-domain mismatches.
---

# Removing Deprecated Status Values: Normalizer Pattern + Type Safety

## Problem

The gateway API (andamio-api#263) began normalizing two project task commitment statuses at read time:

| Removed | Replaced By | Reason |
|---------|-------------|--------|
| `COMMITTED` | `SUBMITTED` | Same on-chain action (single redeemer) |
| `PENDING_TX_SUBMIT` | `PENDING_TX_COMMIT` | Submit pending state collapsed |

The frontend still contained ~30 direct string comparisons against these deprecated values across 12+ files. Three concrete symptoms surfaced:

1. **Silent regression**: `normalizeAssignmentStatus("SUBMITTED")` returned `"UNKNOWN"` because `SUBMITTED` was missing from `STATUS_ALIASES` in `assignment-status.ts`. Course progress bars showed "Unknown".
2. **Invisible queue entries**: The manager hook (`use-project-manager.ts`) had no normalizer, so stale React Query cache entries containing `"COMMITTED"` were invisible in the review queue.
3. **Cross-domain mismatch**: `manage-contributors/page.tsx` compared `commitmentStatus === "PENDING_APPROVAL"` (a course-domain value) against project commitment statuses. Always false.

## Root Cause

Two structural weaknesses enabled these bugs:

1. **No normalization chokepoint** on the manager hook. Four of five hooks normalized raw status values; the fifth passed them through raw.
2. **`commitmentStatus` typed as `string` everywhere.** The compiler could not catch stale references, cross-domain mismatches, or typos.

## Solution

### Phase 1: Defensive Normalizer Mappings

Added legacy backward-compat mappings in all 5 status map hooks so that stale cache entries are silently normalized before reaching components.

**Project domain** (`use-project-contributor.ts`):

```typescript
const PROJECT_STATUS_MAP: Record<string, string> = {
  // ... existing entries ...
  // Legacy (backwards compat -- remove after v2.2 confirmed)
  COMMITTED: "SUBMITTED",
  PENDING_TX_SUBMIT: "PENDING_TX_COMMIT",
};
```

**Course domain** (`use-assignment-commitment.ts`, `use-student-assignment-commitments.ts`):

```typescript
// Course domain maps COMMITTED to the DISPLAY value, not the raw value.
COMMITTED: "PENDING_APPROVAL",  // NOT "SUBMITTED"
```

**Critical fix** -- `assignment-status.ts`:

```typescript
// Without this, "SUBMITTED" (the new raw value from the gateway)
// falls through to "UNKNOWN" in course progress bars.
SUBMITTED: "PENDING_APPROVAL",
```

**Manager hook** (`use-project-manager.ts`) -- had no normalizer at all:

```typescript
import { normalizeProjectCommitmentStatus } from "./use-project-contributor";

// In transformManagerCommitment:
commitmentStatus: normalizeProjectCommitmentStatus(api.content?.commitment_status),
```

### Phase 2: Replace Direct Comparisons

Across 6 component files, replaced every literal comparison:

- `=== "COMMITTED"` became `=== "SUBMITTED"`
- `=== "PENDING_TX_SUBMIT"` became `=== "PENDING_TX_COMMIT"`
- Updated `STATUS_PRIORITY` records, filter predicates, `switch`/`case` branches

### Phase 3: Clean Up Dead Code

Removed `COMMITTED` and `PENDING_TX_SUBMIT` entries from `format-status.ts` label map, updated JSDoc, and merged UX text for the collapsed COMMITTED/SUBMITTED state.

### Phase 4: Type Safety via Union Type

Added `ProjectCommitmentStatus` union type and applied it to key interfaces:

```typescript
export type ProjectCommitmentStatus =
  | "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REFUSED"
  | "REWARDED" | "ABANDONED" | "AWAITING_SUBMISSION"
  | "PENDING_TX_COMMIT" | "PENDING_TX_ASSESS"
  | "PENDING_TX_CLAIM" | "PENDING_TX_LEAVE"
  | "UNKNOWN";

export interface ContributorCommitment {
  commitmentStatus?: ProjectCommitmentStatus;
  // ...
}

export interface ManagerCommitment {
  commitmentStatus?: ProjectCommitmentStatus;
  // ...
}
```

This **immediately caught a pre-existing bug**: `manage-contributors/page.tsx` compared `commitmentStatus === "PENDING_APPROVAL"` (course-domain) against project commitment status. The compiler flagged it as having no overlap with `ProjectCommitmentStatus`.

## Key Insight: Domain-Specific Status Mapping

The same raw legacy value `COMMITTED` maps to **different normalized values depending on domain**:

| Domain | `COMMITTED` maps to | Why |
|--------|---------------------|-----|
| **Project** | `"SUBMITTED"` | Raw normalized API value -- the commitment was submitted on-chain |
| **Course** | `"PENDING_APPROVAL"` | Display-layer value -- the assignment is awaiting instructor approval |

Confusing these two output domains caused the initial implementation bug where `use-assignment-commitment.ts` mapped `COMMITTED` to `"SUBMITTED"` (project-domain raw) instead of `"PENDING_APPROVAL"` (course-domain display).

## Prevention Strategies

### 1. Enforce Union Types for All Status Fields

Never use `string` for status values. Every status field must be constrained by a union type. When the backend introduces a new status value, the frontend will fail to compile until it is explicitly handled.

**Rule:** Any PR that adds a `status: string` annotation should be flagged during review.

### 2. The Normalizer-as-Chokepoint Pattern

All raw status values must pass through a single normalizer function before being used anywhere. No hook, component, or utility should interpret raw status strings directly.

```
API Response -> normalizeStatus() -> canonical status -> formatStatus() -> display label
                     ^                                        ^
               ONE function,                           ONE function,
               ONE location                            domain-aware
```

**Enforcement:** Every hook that fetches status data must call the normalizer. The manager hook missing the normalizer call is exactly the class of bug this pattern prevents.

### 3. Legacy Mapping Lifecycle

1. **Add the mapping to the normalizer first**, before removing anything else.
2. **Never remove a normalizer mapping** until you are certain no source can produce the old value (cached responses, in-flight transactions, stale browser caches).
3. **Add a deprecation comment** with a date and removal condition.
4. **Removal is a separate PR** with its own review.

### 4. Deprecation is a Two-Phase Operation

**Phase 1:** Stop producing the old value. Add the normalizer mapping. Ship this.
**Phase 2:** After confirming no source can produce the old value (which may take weeks for blockchain-backed data), remove the normalizer mapping in a separate PR.

Never combine both phases.

## Review Checklist for Status Value Migrations

- [ ] Union type updated (new value added, old value excluded)
- [ ] Normalizer updated with legacy mappings for every old value
- [ ] Every hook calls the normalizer (search and verify -- don't trust assumptions)
- [ ] Format/label function updated for all domains
- [ ] `npm run build` passes with no type errors (compile-time exhaustiveness)
- [ ] No raw status string comparisons remain (`grep` for old values)
- [ ] React Query cache staleness considered (normalizer handles stale data)
- [ ] Normalizer mapping removal deferred to a separate future PR

## Verification

1. `grep "COMMITTED"` and `grep "PENDING_TX_SUBMIT"` return only normalizer legacy mappings
2. `npm run build` passes clean -- union type enforces all comparisons
3. Course assignment flows display "Pending Review" instead of "Unknown"
4. Manager review queue shows all pending commitments including stale cache entries

## Cross-References

- **Issue:** [#44](https://github.com/Andamio-Platform/andamio-app-template/issues/44)
- **PR:** [#45](https://github.com/Andamio-Platform/andamio-app-template/pull/45)
- **API change:** [andamio-api#263](https://github.com/Andamio-Platform/andamio-api/pull/263)
- **Reference implementation (app-v2):** [andamio-app-v2#461](https://github.com/Andamio-Platform/andamio-app-v2/pull/461)
- **Plan document:** `docs/plans/2026-03-23-fix-remove-committed-pending-tx-submit-statuses-plan.md`
- **Related issue:** [#36](https://github.com/Andamio-Platform/andamio-app-template/issues/36) (API Response Envelope Standardization)
