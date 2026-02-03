# Project Status

> **Last Updated**: February 3, 2026

Current implementation status of the Andamio T3 App Template.

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 13/13 routes |
| Project System | In Progress | 10/11 routes |
| Transaction System | **100% Complete** | 17/17 V2 components |
| Gateway Migration | **Complete** | Unified V2 Gateway |
| L1 Core Package | **Complete** | `@andamio/core` created |
| Landing Page | **Complete** | Explore / Login / Register cards |
| TX Stream (SSE) | **Complete** | Real-time TX tracking with polling fallback |
| Andamioscan Removal | **✅ Complete** | `andamioscan-events.ts` deleted, 0 imports remain |
| Project Workflows | **Complete** | Owner/manager UX merged via PR #133 |
| Gateway API Sync | **Complete** | Types regenerated, SSE fix, Andamioscan regen (#139/#140) |
| **API Hooks Cleanup** | **🔄 In Progress** | Course ✅ / Project Studio ✅ / Component Extraction ✅ / Project Hooks ⬜ |

---

## 📌 NEXT SESSION PROMPT

> **What shipped this session (Feb 3, session 3)** — TX UX Audit continuation:
>
> **TX UX Audit progress: 14/17 passing** (up from 10):
> - **#8** COURSE_STUDENT_ASSIGNMENT_UPDATE — all 4 checks pass
> - **#11** PROJECT_OWNER_BLACKLIST_MANAGE — TX works e2e (Q3 n/a: no blacklist data in project detail aggregate yet)
> - **#12** PROJECT_MANAGER_TASKS_MANAGE — all 4 checks pass
>
> **Blacklist naming discussion filed**: [andamioscan#28](https://github.com/Andamio-Platform/andamioscan/issues/28) — discuss renaming "blacklist" across API/subsystems, and whether/how to expose the alias list in project detail aggregate.
>
> ---
>
> **Remaining Open Issues (prioritized)**:
>
> | Issue | Priority | Notes |
> |-------|----------|-------|
> | #118 - Cannot mint access token from preprod | 🔴 High | Bug report |
> | #103 - Project hooks upgrade | 🟡 Medium | Structural compliance ✅, **3 missing hooks**: `useAssessCommitment`, `useClaimCommitment`, `useLeaveCommitment` |
> | #55 - ProjectTask sync errors | 🟡 Medium | Task manage TX sync failures |
> | #37 - CoursePrereqsSelector improvements | 🟡 Medium | Partially addressed in PR #111 |
> | #32 - Extra signature after mint | 🟡 Medium | Auth flow improvement |
> | andamioscan#28 - Blacklist naming + data exposure | 🟡 Medium | Discuss renaming and API inclusion |
> | #47 - Auto-logout on wallet change | 🟢 Low | UX improvement |
> | #34 - Teacher assessment UX | 🟢 Low | Accept/Refuse button UX |
>
> ---
>
> **Known API bugs**:
>
> - `/course/user/modules/` returns empty for on-chain-only courses — API team notified
>
> ---
>
> **Next Work**: Continue TX UX audit — 3 remaining (#1 Access Token Mint, #13 Tasks Assess, #14-16 Contributor TXs) → #103 implement 3 missing project hooks → #118 access token mint bug

---

## 🎯 TOP PRIORITY: API Hooks Cleanup

**Status**: Course hooks ✅ COMPLETE (8 files) | Project hooks ⬜ PENDING (3 files)

Standardizing all API hooks to follow the exemplary pattern from `use-course.ts`. Tracking in: `.claude/skills/hooks-architect/PROGRESS.md`

### The Pattern (Established)

```
Gateway API (snake_case) → Hook (transform) → Component (camelCase)
```

**Key Rules**:
1. App-level types (camelCase) defined IN hook files
2. Transform functions convert API snake_case → app camelCase
3. Components import types from hooks, NEVER from `~/types/generated`
4. Clean domain names: `Course`, `CourseModule`, `SLT` - never "Merged" prefixes
5. Semantic `status` field replaces raw `source` field

### Course Hooks (✅ Complete)

| Hook | Types | Status |
|------|-------|--------|
| `use-course.ts` | `Course`, `CourseDetail` | ✅ APPROVED |
| `use-course-owner.ts` | Uses Course types | ✅ APPROVED |
| `use-course-module.ts` | `CourseModule`, `SLT`, `Lesson`, `Assignment`, `Introduction` | ✅ APPROVED |
| `use-course-content.ts` | Public queries (useSLTs, useLesson, useAssignment, useIntroduction) | ✅ APPROVED |
| `use-course-student.ts` | `StudentCourse` | ✅ APPROVED |
| `use-course-teacher.ts` | `TeacherCourse`, `TeacherAssignmentCommitment` | ✅ APPROVED |
| `use-module-wizard-data.ts` | Composition hook | ✅ APPROVED |
| `use-save-module-draft.ts` | Aggregate mutation | ✅ APPROVED |

### Project Hooks (⬜ Pending)

| Hook | Types | Status |
|------|-------|--------|
| `use-project.ts` | Has transformers in `types/project.ts` | 🔶 Move types INTO hook |
| `use-project-manager.ts` | Raw API types | ⬜ Needs migration |
| `use-project-contributor.ts` | Raw API types | ⬜ Needs migration |
| `use-project-content.ts` | (planned) | ⬜ Create for public task queries |

### Module Wizard (Pending UX Testing)

**Commit**: `74ef3f4` - wip: Refactor wizard to use hook types

- `wizard/types.ts` now imports from `~/hooks/api`
- `use-module-wizard-data.ts` composes React Query hooks (no direct fetch)
- All step components use camelCase fields

**Next**: Manual UX testing of wizard flow

---

## Recent Completions

**February 3, 2026** (TX UX Audit session 3):
- ✅ **TX #8** COURSE_STUDENT_ASSIGNMENT_UPDATE — all 4 checks pass
- ✅ **TX #11** PROJECT_OWNER_BLACKLIST_MANAGE — TX works e2e (Q3 n/a). Filed andamioscan#28 for blacklist naming + API inclusion.
- ✅ **TX #12** PROJECT_MANAGER_TASKS_MANAGE — all 4 checks pass
- ✅ **TX UX audit score: 14/17 passing** — Up from 10. Remaining: #1, #13, #14, #15, #16.

**February 3, 2026** (Prerequisites + Treasury TX — PR #152):
- ✅ **TX #17 `PROJECT_USER_TREASURY_ADD_FUNDS`** — New `treasury-add-funds.tsx` component. All 4 audit checks pass. 17/17 TX types now have UI components.
- ✅ **Shared `PrerequisiteList` component** — Resolves course titles and module names. Used on studio, public, and contributor project pages.
- ✅ **Studio project dashboard redesign** — Prerequisites + stats side-by-side, consolidated stats column, treasury balance inline.

**February 3, 2026** (Draft Task Delete Fix + TX UX Audit):
- ✅ **Draft task delete fixed** — Root cause: silent guard clauses + API didn't support deleting tasks without `task_hash`. Issue #148 simplified contract to `{ contributor_state_id, index }`. `useDeleteTask` rewritten, `handleDeleteTask` now shows explicit error messages.
- ✅ **`transformMergedTask` updated** — Uses top-level `task_index` field (per #147 API changes).
- ✅ **`transformAssets` typed** — Now uses `ApiTypesAsset { policy_id, name, amount }` instead of untyped `any`.
- ✅ **Generated types regenerated** — `v2.0.0-dev-20260203-g` with `ApiTypesAsset`, top-level `task_index`, updated `DeleteTaskRequest`.
- ✅ **TX #7 ALL PASS** — Backend 404 "Module not found" resolved. Full flow working.
- ✅ **TX #10 ALL PASS** — Backend `managers_manage` handler resolved by ops.
- ✅ **TX #6 regression fixed** — Decision cart kept visible during batch state (was unmounting on success after `e8d76ec` refactor).
- ✅ **TX UX audit score: 9/16 passing** — Up from 7. 0 backend-blocked. 7 untested.

**February 3, 2026** (Gateway API Sync + Issue Cleanup):
- ✅ **Gateway API sync** (#139, #140) — Regenerated types from latest gateway spec. `managers` field, SSE fix, `slt_hashes` in modules/manage response all integrated.
- ✅ **`slt_hashes` validation** in `mint-module-tokens.tsx` — Extracts hashes from API response, compares with client-computed Blake2b-256 hashes, logs match/mismatch to console.
- ✅ **`UnsignedTxResponse` typed** — Added `slt_hashes?: string[]` field to `use-transaction.ts`.
- ✅ **Issue #114 closed** — Managers list now reflects on-chain changes (Andamioscan regen).
- ✅ **Issue #129 closed** — Tasks disappear after edit bug already fixed (`useManagerTasks` sends `projectId` correctly).
- ✅ **Issue #130 closed** — `useManagerTasks` already uses `POST /tasks/list` with `projectId` in body.
- ✅ **Issue #103 status updated** — Structural compliance confirmed. 3 missing hooks identified: `useAssessCommitment`, `useClaimCommitment`, `useLeaveCommitment`.
- ✅ **TX UX audit** — TX #10 (PROJECT_OWNER_MANAGERS_MANAGE) audited: submits OK, gateway confirmation stuck. Dispatched to ops.

**February 2, 2026** (TX UX Audit Continuation):
- ✅ **TX #6** COURSE_TEACHER_ASSIGNMENTS_ASSESS — all pass (simple: single accept)
- ✅ **TX #7** COURSE_STUDENT_ASSIGNMENT_COMMIT — Q1 pass (backend 500 resolved), Q3 fail (gateway 404 "Module not found")
- ✅ **TX #9** COURSE_STUDENT_CREDENTIAL_CLAIM — all pass. Relocated to course home page.
- ✅ **Assignments Complete indicator** — `c1301e0` Added to studio course header
- ✅ **Pending review filter** — `33f7890` Filter to only PENDING_APPROVAL commitments

**February 1, 2026** (Enum Normalization Sweep + Student Assignment Checklist):
- ✅ **STATUS_MAP fix** (closes #115) — Student hooks mapped APPROVED/REJECTED but DB sends ACCEPTED/REFUSED. Fixed in both `use-student-assignment-commitments.ts` and `use-assignment-commitment.ts`.
- ✅ **Cross-course contamination fix** (closes #116) — Gateway ignores course_id filter, returns all commitments. Added courseId filtering to `commitmentsByModule` grouping in course detail page and UserCourseStatus.
- ✅ **Teacher mapToDisplayStatus fix** — Same enum mismatch on teacher side. Added TEACHER_STATUS_MAP with ACCEPTED/REFUSED mappings.
- ✅ **Project contributor normalization** — Added `normalizeProjectCommitmentStatus()` to handle casing inconsistency (OpenAPI says lowercase, components expect uppercase) plus legacy aliases.
- ✅ **Dead code cleanup** — Removed `|| status === "SUBMITTED"` fallback in assignment-commitment.tsx (was workaround for #115).
- ✅ **Assignment checklist** — New per-module checklist in UserCourseStatus enrolled card showing each module with its commitment status badge.
- ✅ **TX UX audit updated** — #6 COURSE_TEACHER_ASSIGNMENTS_ASSESS all pass, #7 COURSE_STUDENT_ASSIGNMENT_COMMIT fails at Atlas TX API (backend issue).

**February 1, 2026** (Project Workflows — PR #111 merged + `feat/project-tx-state-machines`):
- ✅ **PR #111 merged**: Studio redesign (own vs manage project lists), step-based project creation, prereqs selector overhaul, deposit field removed
- ✅ **TX polling reduced to 5s** — Gateway confirms in ~5s now (closes #112)
- ✅ **Single teacher/manager on create** — Aligned with gateway PR #46 to prevent TX_TOO_BIG errors
- ✅ **TeachersUpdate component** added to course owner detail page for post-create teacher management
- ✅ **ManagersManage** now receives `currentManagers` for proper alias display in project owner view
- ✅ **Owner alias always included** in project managers list (was being excluded when additional managers added)
- ✅ **tx_type mapping fixed** — `PROJECT_OWNER_MANAGERS_MANAGE` → `managers_manage` (was incorrectly `project_join`, causing SSE freeze)
- ✅ **Issue #114 filed** — Tracking managers list stale data, blocked by Andamioscan#24
- **Blocker**: Managers list doesn't update after TX because Andamioscan doesn't return `managers` in project details (unlike courses which include `teachers`)

**January 31, 2026** (Andamioscan Removal — `fix/course-txs`):
- ✅ **Removed ALL direct Andamioscan calls** — `src/lib/andamioscan-events.ts` deleted entirely
- ✅ **Deleted `use-event-confirmation.ts`** — TX confirmation handled by TX State Machine (`useTxStream`)
- ✅ **Alias validation** uses new `GET /api/v2/user/exists/{alias}` endpoint (issue #106)
- ✅ **`project-eligibility.ts`** rewritten as pure function — accepts `PrerequisiteInput[]` + `StudentCompletionInput[]` instead of fetching
- ✅ **Contributor page** (`contributor/page.tsx`) — Complete rewrite: derives status from `useProject()` data (submissions, assessments, contributors, credentials)
- ✅ **Assignment page** (`assignment/page.tsx`) — On-chain module hash matching via `useCourse()` hook instead of `getCourse()`
- ✅ **Assignment commitment** (`assignment-commitment.tsx`) — Completion check via `useCourse().pastStudents` instead of `getCourseStudent()`
- ✅ **3 studio pages** — Replaced `getProject()`/`getManagingProjects()` with `useProject()` hook data
- ✅ **Project catalog** (`/project`) — Eligibility simplified to synchronous computation from project prerequisites
- ✅ **Andamioscan type re-exports removed** from `types/generated/index.ts`
- ✅ Verification: `grep -r "andamioscan-events" src/` → 0 results | typecheck: 0 errors | lint: 0 errors
- **Future**: Wire up `StudentCompletionInput[]` on catalog + contributor pages (currently `[]`), update CLAUDE.md references

**January 31, 2026** (PR #105 - `fix/course-txs`):
- ✅ **Landing Page Redesign**: Replaced single "Enter App" button with 3-card layout (Explore / Sign In / Get Started)
  - `src/components/landing/explore-card.tsx` — Browse courses/projects without wallet
  - `src/components/landing/login-card.tsx` — Returning users: connect → auto-auth → redirect
  - `src/components/landing/register-card.tsx` — New users: connect → mint access token → redirect
  - `src/components/landing/first-login-card.tsx` — First-login ceremony with real-time TX tracking
- ✅ **TX Stream for Access Token Mint** (#101): Added `requiresOnChainConfirmation` flag to `TransactionUIConfig`. Access token mint now registers with gateway and streams `pending → confirmed → updated` via SSE.
- ✅ **JWT Guards Removed** (#104): Made JWT optional in `registerTransaction()`, removed JWT bail-out from `useTxStream`, and removed `if (jwt)` gate in `useTransaction`. Fixes pre-auth TX registration for access token mint.
- ✅ **Module Wizard Fix** (#68): Replaced removed `course-module/get` endpoint with list+filter pattern in `module-wizard.tsx`. Uses `useCourseModule` hook's approach (fetch all modules, filter by `moduleCode`).
- ✅ **Redundant Course Registration Removed** (#102): Eliminated manual `course_registration` call that duplicated gateway auto-confirmation.
- ✅ **Reward Claim Lifecycle Documented** (#103): Documented in `use-project-contributor.ts` and `use-project-manager.ts`. Path A: next-task commit auto-claims previous rewards. Path B: project exit claims final rewards.
- ✅ Issues closed: #68, #98, #101, #102, #104

**January 30, 2026**:
- ✅ **Teacher Dashboard Blocker Resolved** ([andamio-api#23](https://github.com/Andamio-Platform/andamio-api/issues/23)): API now returns full commitment history. Added client-side filter in `PendingReviewsList` to show only `PENDING_APPROVAL` items in the pending assessments card.
- ✅ **Phase 3.10 (Component Extraction)**: Extracted all direct `authenticatedFetch` calls from components into React Query hooks
  - `assignment-update.tsx` → `useSubmitEvidence()` hook
  - `burn-module-tokens.tsx` → `useUpdateCourseModuleStatus()` hook
  - `pending-reviews-summary.tsx` → `useTeacherCommitmentsQueries()` (new fan-out hook)
  - `task-commit.tsx` → `useSubmitTaskEvidence()` (new mutation hook)
  - `contributor/page.tsx` → `useContributorCommitment()` (reactive refactor)
  - `mint-access-token-simple.tsx` → `useUpdateAccessTokenAlias()` (new mutation hook)
- ✅ New hooks created:
  - `useTeacherCommitmentsQueries()` in `use-course-teacher.ts` — `useQueries` fan-out for batch commitment fetching
  - `useSubmitTaskEvidence()` in `use-project-contributor.ts` — mutation for project task evidence submission
  - `useUpdateAccessTokenAlias()` in `use-user.ts` (new file) — mutation for access token alias updates
- ✅ Only `sitemap/page.tsx` and `pending-tx-list.tsx` still use direct `authenticatedFetch` (deferred, low priority)

**January 29, 2026**:
- ✅ **Phase 3.10**: Migrated all 7 studio project pages to React Query hooks
  - `studio/project/page.tsx` — `useRegisterProject()` replaces direct `authenticatedFetch`
  - `studio/project/[projectid]/page.tsx` — `useProject`, `useManagerTasks`, `useUpdateProject`
  - `studio/project/[projectid]/draft-tasks/page.tsx` — `useProject`, `useManagerTasks`, `useDeleteTask`
  - `studio/project/[projectid]/draft-tasks/new/page.tsx` — `useProject`, `useCreateTask`
  - `studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx` — `useProject`, `useManagerTasks`, `useUpdateTask`
  - `studio/project/[projectid]/manage-treasury/page.tsx` — `useProject`, `useManagerTasks` + orchestration
- ✅ Fixed mutation hook parameters (`useDeleteTask`, `useUpdateTask`, `useCreateTask`) to match actual API parameters (`project_state_policy_id` + `index`)
- ✅ Cleaned up NullableString workarounds across all migrated pages

**January 28, 2026**:
- ✅ Completed full audit of all 11 course system hooks
- ✅ Consolidated 4 content hooks → `use-course-content.ts` (useSLTs, useLesson, useAssignment, useIntroduction)
- ✅ Approved `use-course-teacher.ts` (updated for API evidence field)
- ✅ All course hooks now follow colocated types pattern

**January 25, 2026**:
- ✅ Refactored module wizard to use hook types (camelCase)
- ✅ Approved 6 hooks (use-course, use-course-owner, use-course-module, use-slt, use-lesson, use-course-student)
- ✅ Created hook reorganization with subdirectories

**January 24, 2026**:
- Fixed module wizard infinite API polling
- Created HOOK-ARCHITECTURE-GUIDE.md
- Established colocated types pattern

---

## Current Blockers

| Blocker | Priority | Status | Notes |
|---------|----------|--------|-------|
| **Access token mint fails on preprod** (#118) | 🔴 High | Open | Bug report from preprod.app.andamio.io |
| **Project Hooks Migration** (#103) | 🟡 Medium | In Progress | Structural compliance ✅. 3 missing hooks: `useAssessCommitment`, `useClaimCommitment`, `useLeaveCommitment`. |
| **Modules endpoint empty for on-chain courses** | 🟡 Medium | Waiting on API team | `/course/user/modules/` returns `[]` for on-chain-only courses. |
| **Student completions for eligibility** | 🟡 Medium | Future | Project catalog + contributor pages pass `[]` for student completions. Need `useStudentCourses()` hook. |
| **ProjectTask sync errors** (#55) | 🟡 Medium | Open | Task manage TX sync failures |
| **Extra signature after mint** (#32) | 🟡 Medium | Open | Auth flow improvement |
| **Draft task delete** (#147, #148) | ✅ Done | Closed | Simplified to `{ contributor_state_id, index }`. Working. |
| **Assignment commit gateway 404** (TX #7) | ✅ Done | Resolved | Backend 404 "Module not found" fixed. All 4 checks pass. |
| **Managers manage stuck spinner** (TX #10) | ✅ Done | Resolved | Backend `managers_manage` handler fixed by ops. All 4 checks pass. |
| **Managers list stale after TX** (#114) | ✅ Done | Closed | Resolved by Andamioscan regen in #140 |
| **useManagerTasks wrong method** (#130) | ✅ Done | Closed | Now uses POST /tasks/list with projectId |
| **Tasks disappear after edit** (#129) | ✅ Done | Closed | project_id and cache invalidation fixed |
| **Gateway API sync** (#139, #140) | ✅ Done | Closed | Types regenerated, managers field, SSE fix |
| **STATUS_MAP enum mismatch** (#115) | ✅ Done | Closed | ACCEPTED/REFUSED mapped in student, teacher, and project hooks |
| **Cross-course contamination** (#116) | ✅ Done | Closed | courseId filter added to commitment grouping |

---

## API Coverage Summary

| Category | Coverage | Status |
|----------|----------|--------|
| TX: Courses | **100%** (6/6) | Complete |
| TX: Projects | **100%** (8/8) | Complete |
| Merged Projects | **85%** (17/20) | Good |
| Authentication | **83%** (5/6) | Good |
| TX: Instance/Global | **71%** (5/7) | Minor gaps |
| Merged Courses | **55%** (23/42) | 19 missing |
| **Overall** | **63%** (68/108) | - |

> Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.

**API Source of Truth**:
- **Gateway URL**: `https://andamio-api-gateway-666713068234.us-central1.run.app`
- **OpenAPI Spec**: `https://andamio-api-gateway-666713068234.us-central1.run.app/api/v1/docs/doc.json`

---

## System Status

### Course System (15/15 Routes)

**Public (Learner)** - 5 routes:
- `/course` - Course catalog
- `/course/[coursenft]` - Course detail with modules
- `/course/[coursenft]/[modulecode]` - Module detail with SLTs/lessons
- `/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson detail
- `/course/[coursenft]/[modulecode]/assignment` - Assignment with commitment flow

**Studio (Creator)** - 10 routes:
- `/studio` - Studio home dashboard
- `/studio/course` - Course management dashboard
- `/studio/course/[coursenft]` - Course editor
- `/studio/course/[coursenft]/teacher` - Instructor dashboard
- `/studio/course/[coursenft]/[modulecode]` - Module editor
- `/studio/course/[coursenft]/[modulecode]/slts` - SLT management
- `/studio/course/[coursenft]/[modulecode]/assignment` - Assignment editor
- `/studio/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson editor
- `/studio/course/[coursenft]/[modulecode]/introduction` - Introduction editor

### Project System (10/11 Routes)

**Public (Contributor)** - 4/4 routes:
- `/project` - Project catalog
- `/project/[projectid]` - Project detail with tasks
- `/project/[projectid]/contributor` - Contributor dashboard
- `/project/[projectid]/[taskhash]` - Task detail with commitment

**Studio (Manager/Owner)** - 6/7 routes:
- `/studio/project` - Project management
- `/studio/project/[projectid]` - Project dashboard (with Treasury + Blacklist tabs)
- `/studio/project/[projectid]/manager` - Manager dashboard - reviews task commitments
- `/studio/project/[projectid]/draft-tasks` - Task list management
- `/studio/project/[projectid]/draft-tasks/new` - Create new task
- `/studio/project/[projectid]/draft-tasks/[taskindex]` - Edit existing task
- `/studio/project/[projectid]/transaction-history` - **Planned**

### Transaction Components (16/16 Complete)

All transaction components are complete. See `TRANSACTION-COMPONENTS.md` for details.

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 15.x | Framework |
| @tanstack/react-query | ^5.x | Data fetching |
| @meshsdk/core | ^2.x | Cardano wallet |
| @tiptap/react | ^2.x | Rich text editor |
| @dnd-kit/core | ^6.x | Drag and drop |

---

## Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-01-09 | Go API Migration Complete | Complete |
| 2026-01-14 | Andamio Pioneers Launch | Complete |
| 2026-01-17/18 | V2 Gateway API Migration | Complete |
| 2026-01-21 | L1 Core Package + TX Fixes | Complete |
| 2026-01-24 | **Course Side Colocated Types** | Complete |
| 2026-01-31 | **Landing Page + TX Stream + Bug Fixes** (PR #105) | Complete |
| 2026-02-01 | **Project Workflows** (PR #111) + owner/manager fixes | Complete |
| 2026-02-03 | **Gateway API Sync + TX UX Audit** — 6 issues closed, types regen | Complete |
| 2026-02-03 | **Draft Task Delete Fix** — #147/#148, typed assets, TX audit 9/16 | Complete |
| **2026-02-06** | **Andamio V2 Mainnet Launch** | Upcoming |

---

## Session Archives

Detailed session notes are archived by week:

| Archive | Sessions | Period |
|---------|----------|--------|
| [2026-01-05-to-2026-01-11.md](./archived-sessions/2026-01-05-to-2026-01-11.md) | 1-4 | Go API migration, type packages, wallet auth |
| [2026-01-12-to-2026-01-18.md](./archived-sessions/2026-01-12-to-2026-01-18.md) | 5-20 | Pioneers launch, V2 Gateway, TX migration |
| [2026-01-19-to-2026-01-25.md](./archived-sessions/2026-01-19-to-2026-01-25.md) | 21-28 | TX Watcher fixes, L1 Core, taxonomy compliance, colocated types |
