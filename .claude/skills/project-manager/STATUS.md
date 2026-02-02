# Project Status

> **Last Updated**: February 1, 2026

Current implementation status of the Andamio T3 App Template.

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 13/13 routes |
| Project System | In Progress | 10/11 routes |
| Transaction System | **100% Complete** | 16/16 V2 components |
| Gateway Migration | **Complete** | Unified V2 Gateway |
| L1 Core Package | **Complete** | `@andamio/core` created |
| Landing Page | **Complete** | Explore / Login / Register cards |
| TX Stream (SSE) | **Complete** | Real-time TX tracking with polling fallback |
| Andamioscan Removal | **✅ Complete** | `andamioscan-events.ts` deleted, 0 imports remain |
| Project Workflows | **In Progress** | Owner/manager UX on `feat/project-tx-state-machines` |
| **API Hooks Cleanup** | **🔄 In Progress** | Course ✅ / Project Studio ✅ / Component Extraction ✅ / Project Hooks ⬜ |

---

## 📌 NEXT SESSION PROMPT

> **Branch: `feat/project-tx-state-machines`** — Enum normalization sweep + student assignment checklist.
>
> **What shipped this session**:
>
> **Bug fixes** (4 commits):
> - `84d74f8` — fix: correct STATUS_MAP enum values (ACCEPTED/REFUSED) and filter commitments by courseId (closes #115, #116)
> - `ee4afee` — fix: normalize commitment status enums across teacher and project hooks
>   - Teacher hook: `mapToDisplayStatus` now maps ACCEPTED/REFUSED (was only APPROVED/REJECTED)
>   - Project contributor hook: added `normalizeProjectCommitmentStatus()` with uppercase normalization and legacy aliases
>   - Assignment commitment: removed dead `"SUBMITTED"` fallback check
>
> **Feature**:
> - `5cce140` — feat: add per-module assignment checklist to enrolled course status card (UserCourseStatus)
>
> **Docs**:
> - `e2844fe` — docs: update TX UX audit status for assignment assess and commit
>
> ---
>
> **Enum audit findings** (all fixed this session):
>
> | Issue | Location | Problem | Fix |
> |-------|----------|---------|-----|
> | #115 (closed) | Student STATUS_MAP (2 files) | ACCEPTED/REFUSED not mapped | Added mappings + legacy aliases |
> | #116 (closed) | Course page + UserCourseStatus | Cross-course commitment contamination | Added courseId filter |
> | Issue B | Teacher `mapToDisplayStatus` | Same as #115 but teacher-side | Added TEACHER_STATUS_MAP |
> | Issue C | Student vs teacher vocabulary | Different display strings (ASSIGNMENT_ACCEPTED vs ACCEPTED) | Documented — intentional per-role vocabulary |
> | Issue D | Project contributor hook | Raw status passthrough, casing mismatch | Added `normalizeProjectCommitmentStatus()` |
> | Issue F | `assignment-commitment.tsx` | Dead `"SUBMITTED"` fallback | Removed |
>
> ---
>
> **Remaining Open Issues (prioritized)**:
>
> | Issue | Priority | Notes |
> |-------|----------|-------|
> | #114 - Managers list stale after TX | 🔴 High | **Blocked by** Andamioscan#24 — revisit Monday Feb 2 |
> | #103 - Project hooks upgrade | 🟡 Medium | Colocated types still pending for project hooks |
> | #55 - ProjectTask sync errors | 🟡 Medium | Task manage TX sync failures |
> | #37 - CoursePrereqsSelector improvements | 🟡 Medium | Partially addressed in PR #111 |
> | #32 - Extra signature after mint | 🟡 Medium | Auth flow improvement |
> | #47 - Auto-logout on wallet change | 🟢 Low | UX improvement |
> | #34 - Teacher assessment UX | 🟢 Low | Accept/Refuse button UX |
>
> ---
>
> **Known API bugs**:
>
> - `/course/user/modules/` returns empty for on-chain-only courses — API team notified, awaiting fix
> - `COURSE_STUDENT_ASSIGNMENT_COMMIT` TX build returns 500 from Atlas TX API — backend issue, frontend payload verified correct
>
> ---
>
> **Next Work**: Continue `/transaction-auditor` TX UX audit (priority #1) → #103 project hooks colocated types → Merge branch after DB updates land → #114 managers list (Monday Feb 2)

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
| **Managers list stale after TX** (#114) | 🔴 High | Blocked | Andamioscan#24 — revisit Monday Feb 2 |
| **Atlas TX API 500 on assignment commit** | 🔴 High | Backend | `COURSE_STUDENT_ASSIGNMENT_COMMIT` TX build fails at Atlas. Frontend payload verified correct. Waiting for DB updates. |
| **Modules endpoint empty for on-chain courses** | 🟡 Medium | Waiting on API team | `/course/user/modules/` returns `[]` for on-chain-only courses. May implement frontend fallback. |
| **Project Hooks Migration** (#103) | 🟡 Medium | In Progress | Colocated types still pending for `use-project-manager.ts` and `use-project-contributor.ts`. |
| **Student completions for eligibility** | 🟡 Medium | Future | Project catalog + contributor pages pass `[]` for student completions. Need `useStudentCourses()` hook. |
| **ProjectTask sync errors** (#55) | 🟡 Medium | Open | Task manage TX sync failures |
| **Extra signature after mint** (#32) | 🟡 Medium | Open | Auth flow improvement |
| **Update CLAUDE.md references** | 🟢 Low | Pending | Remove deleted `andamioscan-events.ts` and `use-event-confirmation.ts` from Key Files and API Clients tables |
| **STATUS_MAP enum mismatch** (#115) | ✅ Done | Closed | ACCEPTED/REFUSED mapped in student, teacher, and project hooks |
| **Cross-course contamination** (#116) | ✅ Done | Closed | courseId filter added to commitment grouping |
| **TX polling intervals** (#112) | ✅ Done | Fixed | Reduced to 5s to match gateway speed |
| **tx_type mapping** (#113) | ✅ Done | On branch | Fix committed on `feat/project-tx-state-machines`, will close on merge |
| **Single teacher/manager on create** | ✅ Done | On branch | Aligned with gateway PR #46 |

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
| **2026-02-06** | **Andamio V2 Mainnet Launch** | Upcoming |

---

## Session Archives

Detailed session notes are archived by week:

| Archive | Sessions | Period |
|---------|----------|--------|
| [2026-01-05-to-2026-01-11.md](./archived-sessions/2026-01-05-to-2026-01-11.md) | 1-4 | Go API migration, type packages, wallet auth |
| [2026-01-12-to-2026-01-18.md](./archived-sessions/2026-01-12-to-2026-01-18.md) | 5-20 | Pioneers launch, V2 Gateway, TX migration |
| [2026-01-19-to-2026-01-25.md](./archived-sessions/2026-01-19-to-2026-01-25.md) | 21-28 | TX Watcher fixes, L1 Core, taxonomy compliance, colocated types |
