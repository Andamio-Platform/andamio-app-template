---
title: "fix: remove COMMITTED and PENDING_TX_SUBMIT status values"
type: fix
status: completed
date: 2026-03-23
---

# fix: remove COMMITTED and PENDING_TX_SUBMIT status values

## Overview

The gateway API (andamio-api#263) now normalizes project task commitment statuses at read time. Two status values are retired:

| Removed | Replaced By | Reason |
|---------|-------------|--------|
| `COMMITTED` | `SUBMITTED` | Same on-chain action (single redeemer) |
| `PENDING_TX_SUBMIT` | `PENDING_TX_COMMIT` | Submit pending state collapsed |

**Valid statuses after change:** `DRAFT`, `SUBMITTED`, `ACCEPTED`, `REFUSED`, `REWARDED`, `ABANDONED`, `PENDING_TX_COMMIT`, `PENDING_TX_ASSESS`, `PENDING_TX_CLAIM`, `PENDING_TX_LEAVE`

This was already fixed in andamio-app-v2 (Andamio-Platform/andamio-app-v2#461). This plan ports the same pattern to the template.

## Problem Statement / Motivation

The frontend still contains ~30 direct string comparisons against `"COMMITTED"` and `"PENDING_TX_SUBMIT"` across 12 files. While the gateway normalizes these server-side, stale React Query caches and any API rollback scenario would cause broken UI. Additionally, the dead code paths create confusion for developers working on the template.

## Proposed Solution

A four-phase approach matching the pattern from andamio-app-v2#461:

1. **Add normalizer mappings** in status map hooks (defensive layer)
2. **Replace direct comparisons** in components
3. **Clean up dead code** from label maps, alias maps, switch/case branches, JSDoc
4. **Regenerate types** via `npm run generate:types`

## Critical Gaps Discovered During Analysis

### Gap A: `assignment-status.ts` silent regression (CRITICAL)

`normalizeAssignmentStatus("SUBMITTED")` currently returns `"UNKNOWN"` because `SUBMITTED` is not in the `STATUS_ALIASES` map. With the gateway now sending `SUBMITTED` instead of `COMMITTED`, all course assignment flows would break — progress bars would show "Unknown" status.

**Fix:** Add `SUBMITTED: "PENDING_APPROVAL"` to `STATUS_ALIASES` in `src/lib/assignment-status.ts`, matching the behavior of the existing `COMMITTED: "PENDING_APPROVAL"` entry.

### Gap B: Semantic collapse of COMMITTED vs SUBMITTED

Previously `COMMITTED` = "joined task, no evidence yet" and `SUBMITTED` = "evidence submitted, awaiting review". The gateway now returns `SUBMITTED` for both states. UX text at `src/app/(app)/project/[projectid]/contributor/page.tsx:95` says "Visit the task page to submit evidence" for `COMMITTED` — this text becomes incorrect when mapped to `SUBMITTED`.

**Fix:** Update the card description text to be accurate for both states (e.g., "Your commitment is active. Visit the task page to view or submit evidence.").

### Gap C: Teacher hook `AWAITING_SUBMISSION` mapping

`TEACHER_STATUS_MAP` in `src/hooks/api/course/use-course-teacher.ts:236` maps `AWAITING_SUBMISSION` -> `"COMMITTED"`. Since `COMMITTED` is removed, this needs to map to `"SUBMITTED"` to maintain consistency with the new status vocabulary.

## Technical Considerations

- **React Query cache:** Users with active sessions may have stale cached data containing `COMMITTED` or `PENDING_TX_SUBMIT`. The normalizer mappings in hooks catch this at the transform layer before components see the data.
- **Rollback safety:** If the gateway API change is rolled back, normalizer mappings ensure the frontend still works. Mark legacy mappings with `// Legacy (backwards compat — remove after v2.2 confirmed)`.
- **No TypeScript enum:** The generated types use `string` for `commitment_status`, so there is no compile-time enforcement of valid values. The JSDoc comment updates automatically when types are regenerated.

## System-Wide Impact

- **Interaction graph:** Status values flow from gateway API -> React Query cache -> hook transform (normalizer) -> component render. The normalizer is the single chokepoint.
- **Error propagation:** No errors thrown for unknown statuses — normalizers use fallback (`?? upper` pass-through). Silent degradation to raw API value.
- **State lifecycle risks:** Stale React Query cache entries containing `COMMITTED` or `PENDING_TX_SUBMIT` are the primary risk. Normalizer mappings handle this.
- **API surface parity:** Three API endpoints affected: `project/contributor/commitments/list`, `project/contributor/commitment/get`, `project/manager/commitments/list`.

## Acceptance Criteria

- [x] No references to `"COMMITTED"` as a status value in any `.ts` or `.tsx` file (excluding normalizer legacy mappings)
- [x] No references to `"PENDING_TX_SUBMIT"` in any `.ts` or `.tsx` file (excluding normalizer legacy mappings)
- [x] `normalizeAssignmentStatus("SUBMITTED")` returns `"PENDING_APPROVAL"` (not `"UNKNOWN"`)
- [x] `normalizeProjectCommitmentStatus("COMMITTED")` returns `"SUBMITTED"` (via PROJECT_STATUS_MAP)
- [x] `normalizeProjectCommitmentStatus("PENDING_TX_SUBMIT")` returns `"PENDING_TX_COMMIT"` (via PROJECT_STATUS_MAP)
- [x] `TEACHER_STATUS_MAP` maps `AWAITING_SUBMISSION` to `"SUBMITTED"` (not `"COMMITTED"`)
- [ ] `npm run generate:types` runs cleanly (skipped — gateway API spec not yet updated)
- [x] `npm run build` succeeds with no type errors
- [x] UX text for the collapsed COMMITTED/SUBMITTED state is accurate for both "joined, no evidence" and "evidence submitted" scenarios

## Implementation Plan

### Phase 1: Normalizer Mappings (defensive layer)

Add legacy mappings so that even stale cached data is correctly normalized before reaching components.

**`src/hooks/api/project/use-project-contributor.ts`** — `PROJECT_STATUS_MAP`
```typescript
// Legacy (backwards compat — remove after v2.2 confirmed)
COMMITTED: "SUBMITTED",
PENDING_TX_SUBMIT: "PENDING_TX_COMMIT",
```

**`src/hooks/api/course/use-student-assignment-commitments.ts`** — `STATUS_MAP`
- Change `COMMITTED: "PENDING_APPROVAL"` to legacy comment, keep mapping

**`src/hooks/api/course/use-assignment-commitment.ts`** — `STATUS_MAP`
- Change `COMMITTED: "COMMITTED"` to `COMMITTED: "SUBMITTED"` with legacy comment

**`src/hooks/api/course/use-course-teacher.ts`** — `TEACHER_STATUS_MAP`
- Change `COMMITTED: "COMMITTED"` to `COMMITTED: "SUBMITTED"` with legacy comment
- Change `AWAITING_SUBMISSION: "COMMITTED"` to `AWAITING_SUBMISSION: "SUBMITTED"`

**`src/lib/assignment-status.ts`** — `STATUS_ALIASES`
- Add `SUBMITTED: "PENDING_APPROVAL"` (critical fix — Gap A)
- Keep `COMMITTED: "PENDING_APPROVAL"` with legacy comment

### Phase 2: Replace Direct Comparisons in Components

Replace all direct status string comparisons. Files and reference counts:

| File | COMMITTED refs | PENDING_TX_SUBMIT refs |
|------|---------------|----------------------|
| `src/app/(app)/project/[projectid]/contributor/page.tsx` | 6 | 5 |
| `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` | 2 | 3 |
| `src/app/(app)/project/[projectid]/page.tsx` | 1 | 1 |
| `src/app/(studio)/studio/project/[projectid]/page.tsx` | 1 | 0 |
| `src/app/(studio)/studio/project/[projectid]/commitments/page.tsx` | 4 | 0 |
| `src/app/(studio)/studio/project/[projectid]/draft-tasks/page.tsx` | 1 | 1 |

Replacements:
- `=== "COMMITTED"` -> `=== "SUBMITTED"`
- `=== "PENDING_TX_SUBMIT"` -> `=== "PENDING_TX_COMMIT"`
- Update `STATUS_PRIORITY` record keys
- Update filter predicates
- Update switch/case branches
- Update comments referencing old priority order

### Phase 3: Clean Up Dead Code

**`src/lib/format-status.ts`** — `COMMITMENT_STATUS_LABELS`
- Remove `COMMITTED: "Committed"` entry (line 8)
- Remove `PENDING_TX_SUBMIT: "Submitting..."` entry (line 11)
- Ensure `SUBMITTED` and `PENDING_TX_COMMIT` have correct labels

**`src/hooks/api/project/use-project-contributor.ts`**
- Update JSDoc (line 166-169) to remove COMMITTED and PENDING_TX_SUBMIT from DB values list

**`src/app/(app)/project/[projectid]/contributor/page.tsx`**
- Update UX description text for collapsed COMMITTED/SUBMITTED state (Gap B)
- Remove dead comment at line 273

**`src/app/(studio)/studio/project/[projectid]/draft-tasks/page.tsx`**
- Remove `case "COMMITTED"` and `case "PENDING_TX_SUBMIT"` from `getLifecycleFromStatus` — these now fall under `case "SUBMITTED"` and `case "PENDING_TX_COMMIT"`

### Phase 4: Regenerate Types

```bash
npm run generate:types
```

This updates the JSDoc comment at `src/types/generated/gateway.ts:2171` to reflect the new valid status values from the OpenAPI spec.

## Dependencies & Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stale React Query cache with old statuses | High (first session after deploy) | Medium (broken labels) | Phase 1 normalizer mappings |
| Gateway API rollback sends old statuses again | Low | High (broken UI) | Keep legacy normalizer mappings for one release cycle |
| `assignment-status.ts` regression (Gap A) | Certain (already broken) | High (course flows show "Unknown") | Fix in Phase 1, add SUBMITTED to STATUS_ALIASES |
| Missed string comparison in a component | Low | Medium (stale label shown) | Global search-and-verify after changes |

## Success Metrics

- `npm run build` passes
- Global search for `"COMMITTED"` and `"PENDING_TX_SUBMIT"` returns only legacy normalizer mappings (with comments indicating planned removal)
- Manual verification: contributor page, task detail page, project overview, studio commitments, and draft-tasks pages all render correct status labels

## Sources & References

- **GitHub Issue:** #44
- **API PR:** Andamio-Platform/andamio-api#263
- **App v2 fix (reference implementation):** Andamio-Platform/andamio-app-v2#461
- **App v2 plan doc:** `docs/plans/2026-03-23-fix-committed-status-removal-plan.md` in andamio-app-v2

### Files Requiring Changes (13 hand-edited + 1 auto-generated)

#### Normalizer/mapper hooks (4 files)
1. `src/hooks/api/project/use-project-contributor.ts` — PROJECT_STATUS_MAP + JSDoc
2. `src/hooks/api/course/use-student-assignment-commitments.ts` — STATUS_MAP
3. `src/hooks/api/course/use-assignment-commitment.ts` — STATUS_MAP
4. `src/hooks/api/course/use-course-teacher.ts` — TEACHER_STATUS_MAP

#### Label/alias maps (2 files)
5. `src/lib/format-status.ts` — COMMITMENT_STATUS_LABELS
6. `src/lib/assignment-status.ts` — STATUS_ALIASES (+ add SUBMITTED entry)

#### Component files (6 files)
7. `src/app/(app)/project/[projectid]/contributor/page.tsx` — 11 refs
8. `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` — 5 refs
9. `src/app/(app)/project/[projectid]/page.tsx` — 2 refs
10. `src/app/(studio)/studio/project/[projectid]/page.tsx` — 1 ref
11. `src/app/(studio)/studio/project/[projectid]/commitments/page.tsx` — 4 refs
12. `src/app/(studio)/studio/project/[projectid]/draft-tasks/page.tsx` — 2 refs

#### Auto-generated (regenerate, do not edit manually)
13. `src/types/generated/gateway.ts` — JSDoc at line 2171
