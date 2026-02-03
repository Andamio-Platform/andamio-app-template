# Hook Implementation Progress

> **Tracking Phase 3.9 (API Hooks Cleanup) and Phase 3.10 (Extract Direct API Calls)**

---

## Phase 3.9: API Hooks Cleanup

**Goal**: Standardize all API hooks to the colocated types pattern.

### Status Summary

| Hook | camelCase Types | Transformer | Status |
|------|-----------------|-------------|--------|
| `use-course.ts` | Yes | Yes | APPROVED |
| `use-course-owner.ts` | (imports) | (imports) | APPROVED |
| `use-course-module.ts` | Yes | Yes | APPROVED |
| `use-course-content.ts` | (imports) | (imports) | APPROVED |
| `use-course-student.ts` | Yes | Yes | APPROVED |
| `use-course-teacher.ts` | Yes | Yes | APPROVED |
| `use-module-wizard-data.ts` | (composition) | N/A | APPROVED |
| `use-save-module-draft.ts` | (mutation) | Yes | APPROVED |
| `use-project.ts` | Yes (in types/project.ts) | Yes | NEEDS WORK |
| `use-project-manager.ts` | No (snake_case) | Inline only | NEEDS WORK |
| `use-project-contributor.ts` | No (snake_case) | None | NEEDS WORK |

### Course System Audit Complete (8 hook files)

All course system hooks follow the colocated types pattern correctly:
- Type ownership is clean with no duplicate definitions
- Proper import chains from owner files
- camelCase fields throughout
- Transform functions for API → app type conversion

**Consolidation (2026-01-28):** Combined `use-slt.ts`, `use-lesson.ts`, `use-assignment.ts`, `use-introduction.ts` into single `use-course-content.ts` for public read-only content queries.

### Remaining Work

#### 1. Migrate `use-project.ts`

**Current state**: Types defined in separate `src/types/project.ts` file.

**Action needed**:
- [ ] Move `Project`, `ProjectDetail`, `Task`, `TaskCommitment` types INTO hook file
- [ ] Move `transformProjectDetail`, `transformMergedTask`, `transformApiCommitment` INTO hook file
- [ ] Delete `src/types/project.ts`
- [ ] Update imports in consumer files

#### 2. Migrate `use-project-manager.ts`

**Current state**: Returns snake_case types directly from API.

**Action needed**:
- [ ] Define `ManagerProject` type with camelCase fields
- [ ] Define `ManagerCommitment` type with camelCase fields
- [ ] Create `transformManagerProject()` function
- [ ] Create `transformManagerCommitment()` function
- [ ] Update hooks to use transformers
- [ ] Update consumer components to use camelCase

**Consumer components to update**:
- `src/app/(app)/studio/project/[projectid]/page.tsx`
- `src/app/(app)/studio/project/[projectid]/manager/page.tsx`
- `src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx`

#### 3. Migrate `use-project-contributor.ts`

**Current state**: Returns snake_case types directly from API.

**Action needed**:
- [ ] Define `ContributorProject` type with camelCase fields
- [ ] Create `transformContributorProject()` function
- [ ] Update hooks to use transformer
- [ ] Update consumer components

**Consumer components to update**:
- `src/app/(app)/project/[projectid]/contributor/page.tsx`

---

## Phase 3.10: Extract Direct API Calls

**Goal**: Move all direct `fetch()` and `authenticatedFetch()` calls from components/pages into hooks.

### Audit Summary

**Total violations found**: 23 files with 50+ direct API calls
- Page files: 17
- Component files: 6

### Priority 1: High (Most Duplicated)

#### Project user/task data (5+ pages)

| Location | Endpoint | New Hook |
|----------|----------|----------|
| `project/[projectid]/[taskhash]/page.tsx` | GET `/project/user/task/${taskHash}` | ✅ `useTask(taskHash)` (new hook) |
| `project/[projectid]/contributor/page.tsx` | GET `/project/user/project/${projectId}` | ✅ `useProject()` |
| `project/[projectid]/contributor/page.tsx` | POST `/project/user/tasks/list` | ✅ `useProjectTasks(contributorStateId)` |
| `studio/project/[projectid]/page.tsx:111` | GET `/project/user/project/${projectId}` | Already exists: `useProject()` |
| Multiple studio pages | GET `/project/user/project/${projectId}` | Use `useProject()` |

**Status**: [x] Complete (public pages + studio pages)

#### Manager tasks list (4+ pages)

| Location | Endpoint | New Hook |
|----------|----------|----------|
| `studio/project/[projectid]/page.tsx:155` | POST `/project/manager/tasks/list` | `useManagerTasks(projectId)` |
| `studio/project/[projectid]/draft-tasks/page.tsx:89` | POST `/project/manager/tasks/list` | (same) |
| `studio/project/[projectid]/draft-tasks/new/page.tsx:79` | (needs project) | Use `useProject()` |
| `studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx:105` | POST `/project/manager/tasks/list` | (same) |

**Status**: [ ] Not started

#### Contributor commitment (3+ locations)

| Location | Endpoint | New Hook |
|----------|----------|----------|
| `project/[projectid]/[taskhash]/page.tsx` | POST `/project/contributor/commitment/get` | ✅ `useContributorCommitment(projectId, taskHash)` |
| `project/[projectid]/contributor/page.tsx:230` | POST `/project/contributor/commitment/get` | 🔶 Remains as `fetchDbCommitment` (called with dynamic task hashes from Andamioscan) |

**Status**: [x] Complete (task detail + contributor page reactive refactor)

### Priority 2: Medium

#### Teacher assignment commitments

| Location | Endpoint | New Hook |
|----------|----------|----------|
| `studio/course/[coursenft]/teacher/page.tsx:180` | POST `/course/teacher/assignment-commitments/list` | Already exists: `useTeacherAssignmentCommitments()` |
| `studio/course/[coursenft]/teacher/page.tsx:251` | POST `/course/student/assignment-commitment/get` | `useStudentCommitment(courseId, moduleCode)` |

**Status**: [ ] Not started

#### Module update (teacher)

| Location | Endpoint | Action |
|----------|----------|--------|
| `components/studio/wizard/steps/step-review.tsx:139` | POST `/course/teacher/course-module/update` | Use `useUpdateCourseModule()` |
| `components/tx/burn-module-tokens.tsx:125` | POST `/course/teacher/course-module/update` | ✅ `useUpdateCourseModuleStatus()` |

**Status**: [x] burn-module-tokens.tsx migrated; step-review.tsx pending

#### Project registration/update

| Location | Endpoint | New Hook |
|----------|----------|----------|
| `studio/project/page.tsx:315` | POST `/project/owner/project/register` | `useRegisterProject()` |
| `studio/project/[projectid]/page.tsx:207` | POST `/project/owner/project/update` | `useUpdateProject()` |

**Status**: [ ] Not started

### Priority 3: Lower (Single Use)

#### Pending TX list

| Location | Endpoint | New Hook |
|----------|----------|----------|
| `components/tx/pending-tx-list.tsx:146` | GET `/tx/pending` | `usePendingTransactions()` |

**Status**: [ ] Not started

#### Access token alias

| Location | Endpoint | New Hook |
|----------|----------|----------|
| `components/tx/mint-access-token-simple.tsx:184` | POST `/user/access-token-alias` | ✅ `useUpdateAccessTokenAlias()` |

**Status**: [x] Complete — new `use-user.ts` hook file created

#### Sitemap data

| Location | Endpoint | Action |
|----------|----------|--------|
| `sitemap/page.tsx:309,318,329,343` | Multiple list endpoints | Create composite `useSitemapData()` |

**Status**: [ ] Not started

---

## New Hooks to Create

### Project Domain

| Hook | File | Methods |
|------|------|---------|
| `useTask(taskHash)` | `use-project-tasks.ts` | Query single task |
| `useProjectTasks(projectId)` | `use-project-tasks.ts` | List project tasks |
| `useContributorCommitment(projectId)` | `use-contributor.ts` | Get contributor commitment |
| `useSubmitTaskEvidence()` | `use-contributor.ts` | Submit task evidence mutation |
| `useManagerTasks(projectId)` | `use-manager.ts` | List manager tasks |
| `useCreateTask()` | `use-manager.ts` | Create task mutation |
| `useUpdateTask()` | `use-manager.ts` | Update task mutation |
| `useDeleteTask()` | `use-manager.ts` | Delete task mutation |
| `useBatchTaskStatus()` | `use-manager.ts` | Batch status mutation |
| `useConfirmTaskTx()` | `use-manager.ts` | Confirm TX mutation |
| `useRegisterProject()` | `use-project-owner.ts` | Register project mutation |
| `useUpdateProject()` | `use-project-owner.ts` | Update project mutation |

### Course Domain (Extensions)

| Hook | File | Methods |
|------|------|---------|
| `useStudentCommitment(courseId, moduleCode)` | `use-course-student.ts` | Get student commitment |
| `useSubmitAssignmentEvidence()` | `use-course-student.ts` | Submit evidence mutation |

### Utility Domain

| Hook | File | Methods |
|------|------|---------|
| `usePendingTransactions()` | `use-pending-tx.ts` | List pending TXs |
| `useUpdateAccessTokenAlias()` | `use-user.ts` | Update alias mutation |

---

## Completion Log

### February 3, 2026

- [x] `useDeleteTask` rewritten per issue #148 — simplified to `{ contributor_state_id, index }` contract
  - Removed `task_hash` and `project_id` parameters (API no longer requires them for draft deletion)
  - Removed `computeTaskHash` workaround from create/update/delete hooks
  - Draft tasks page `handleDeleteTask` now shows explicit error messages instead of silently returning
- [x] `transformMergedTask` updated — uses top-level `task_index` field from API (per #147)
- [x] `transformAssets` typed — uses `ApiTypesAsset { policy_id, name, amount }` instead of untyped `any`
- [x] Generated types regenerated to `v2.0.0-dev-20260203-g`

### January 30, 2026

- [x] SSE Transaction Streaming: Implemented `useTxStream()` as drop-in replacement for `useTxWatcher`
  - `src/hooks/tx/use-tx-stream.ts` — SSE connection + high-level hook with polling fallback
  - `src/types/tx-stream.ts` — Event types (`TxStateEvent`, `TxStateChangeEvent`, `TxCompleteEvent`)
  - `src/lib/tx-polling-fallback.ts` — `pollUntilTerminal()` for SSE failure fallback
  - `src/app/api/gateway-stream/[...path]/route.ts` — Dedicated SSE proxy (streams raw body)
  - Uses `fetch` + `ReadableStream` (not `EventSource`) for `X-API-Key` header support
- [x] Phase 3.10 (Component Extraction): Extracted all direct `authenticatedFetch` calls from 6 components into hooks
  - `assignment-update.tsx` → `useSubmitEvidence()` (existing hook)
  - `burn-module-tokens.tsx` → `useUpdateCourseModuleStatus()` (existing hook)
  - `pending-reviews-summary.tsx` → `useTeacherCommitmentsQueries()` (new fan-out hook)
  - `task-commit.tsx` → `useSubmitTaskEvidence()` (new mutation)
  - `contributor/page.tsx` → `useContributorCommitment()` (reactive refactor replacing imperative `fetchDbCommitment`)
  - `mint-access-token-simple.tsx` → `useUpdateAccessTokenAlias()` (new mutation)
- [x] New hooks created:
  - `useTeacherCommitmentsQueries()` in `use-course-teacher.ts` — `useQueries` fan-out for batch commitment fetching
  - `useSubmitTaskEvidence()` in `use-project-contributor.ts` — mutation for task evidence submission
  - `useUpdateAccessTokenAlias()` in `use-user.ts` (new file) — mutation for access token alias
- [x] Only `sitemap/page.tsx` and `pending-tx-list.tsx` remain with direct `authenticatedFetch` (deferred)

### January 29, 2026

- [x] Phase 3.10: Migrated `project/[projectid]/[taskhash]/page.tsx` (4 direct calls → 3 hooks)
  - Created `useTask(taskHash)` hook in `use-project.ts`
  - Updated `transformMergedTask` to include `tokens` from `assets`
  - Added `task` query key to `projectKeys`
  - Replaced all `fetch()`/`authenticatedFetch()` with `useTask`, `useProject`, `useContributorCommitment`
  - Replaced manual refetch in onSuccess with `queryClient.invalidateQueries`
- [x] Phase 3.10: Migrated `project/[projectid]/contributor/page.tsx` (3 direct calls → 2 hooks + 1 remaining)
  - Replaced project fetch with `useProject(projectId)` hook
  - Replaced tasks fetch with `useProjectTasks(contributorStateId)` hook
  - Restructured `fetchData()` into declarative hooks + orchestration `useEffect`
  - Added `refreshData()` for onSuccess callbacks (invalidates queries + re-triggers orchestration)
  - Remaining: `fetchDbCommitment` still uses `authenticatedFetch` (dynamic task hashes from Andamioscan)

### January 28, 2026

- [x] Phase 3.9 Course System audit complete (8 hook files)
  - `use-course.ts` - Core course type owner
  - `use-course-module.ts` - Module type owner (SLT, Lesson, Assignment, Introduction)
  - `use-course-owner.ts` - Owner role hooks
  - `use-course-teacher.ts` - Teacher role hooks (updated for API evidence field)
  - `use-course-student.ts` - Student role hooks
  - `use-course-content.ts` - Consolidated public content queries (SLTs, Lessons, Assignments, Introductions)
  - `use-module-wizard-data.ts` - Composition hook
  - `use-save-module-draft.ts` - Aggregate mutation hook
- [ ] Phase 3.9 Project System migration pending (0/3 hooks)
- [x] Phase 3.10 public project pages migrated (2/2 pages, 6 of 7 direct calls extracted)
- [ ] Phase 3.10 studio project pages pending (6 files, 18 calls)

**Notes**:
- Debug console.log statements in `use-course-module.ts` and `use-save-module-draft.ts` intentionally kept for merge/status debugging
- Plan: Use similar `use-project-content.ts` pattern for public project content when implementing project hooks

---

**Last Updated**: February 3, 2026
