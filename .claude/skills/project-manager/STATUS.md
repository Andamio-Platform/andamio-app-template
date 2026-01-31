# Project Status

> **Last Updated**: January 31, 2026

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
| **API Hooks Cleanup** | **🔄 In Progress** | Course ✅ / Project Studio ✅ / Component Extraction ✅ / Project Hooks ⬜ |

---

## 📌 NEXT SESSION PROMPT

> **Branch: `fix/course-txs`** — Andamioscan removal complete, ready for merge or continued work.
>
> **What shipped this session**:
> - **Removed ALL direct Andamioscan calls** — `andamioscan-events.ts` deleted, zero imports remain
> - 9 files refactored to use gateway hooks (`useProject`, `useCourse`) instead of direct Andamioscan fetches
> - `project-eligibility.ts` rewritten as pure function (accepts data params, no API calls)
> - `use-event-confirmation.ts` deleted — TX State Machine handles all confirmation
> - Alias validation now uses `GET /api/v2/user/exists/{alias}` (issue #106)
> - Contributor status derived from `useProject()` data (no separate Andamioscan call)
> - All Andamioscan type re-exports removed from `types/generated/index.ts`
> - Typecheck: 0 errors | Lint: 0 errors from changed files
>
> ---
>
> **Future Work (from this session)**:
>
> | Item | Priority | Notes |
> |------|----------|-------|
> | Wire up student completions on project catalog page | 🟡 Medium | `/project` page passes `[]` for student completions — shows 0/N for projects with prerequisites. Individual project pages do full checks. Needs a `useStudentCourses()` hook or per-project detail fetch. |
> | Wire up student completions on contributor page | 🟡 Medium | `contributor/page.tsx` also passes `[]` to `checkProjectEligibility()`. Same solution needed. |
> | Update CLAUDE.md API Clients table | 🟢 Low | Remove `andamioscan-events.ts` reference — file is deleted |
> | Update CLAUDE.md Key Files section | 🟢 Low | Remove `use-event-confirmation.ts` reference — file is deleted |
> | Project hooks Phase 3.9 colocated types | 🟡 Medium | `use-project.ts` types are in good shape but `use-project-manager.ts` and `use-project-contributor.ts` still need migration |
>
> ---
>
> **Remaining Open Issues (prioritized)**:
>
> | Issue | Priority | Notes |
> |-------|----------|-------|
> | #103 - Project hooks upgrade | 🟡 Medium | Corrected analysis posted. Needs `useLeaveProject` hook (pending API endpoint confirmation). Phase 3.9 colocated types still pending. |
> | #55 - ProjectTask sync errors | 🟡 Medium | Task manage TX sync failures |
> | #32 - Extra signature after mint | 🟡 Medium | Auth flow improvement |
> | #47 - Auto-logout on wallet change | 🟢 Low | UX improvement |
> | #34 - Teacher assessment UX | 🟢 Low | Accept/Refuse button UX |
> | #29 - TX Input invalid error | 🔴 High | Blocks course enrollment |
>
> ---
>
> **🔴 BUG: `/course/user/modules/` endpoint returns empty for on-chain-only courses**
>
> **Status**: API team notified — awaiting fix.
>
> The dedicated modules endpoint doesn't include on-chain-only modules.
> The course detail endpoint merges them correctly.
> May implement frontend fallback if API team doesn't fix.
>
> ---
>
> **Next Work**: Merge branch → Update CLAUDE.md references → Continue with #103 (project hooks colocated types) or UX testing

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
| **Modules endpoint empty for on-chain courses** | 🔴 High | Waiting on API team | `/course/user/modules/` returns `[]` for on-chain-only courses. May implement frontend fallback. |
| **TX Input invalid error** (#29) | 🔴 High | Open | Blocks course enrollment |
| **Project Hooks Migration** (#103) | 🟡 Medium | In Progress | Corrected analysis posted. Need `useLeaveProject` hook + Phase 3.9 colocated types. |
| **Student completions for eligibility** | 🟡 Medium | Future | Project catalog + contributor pages pass `[]` for student completions. Need `useStudentCourses()` hook or per-project detail fetch. |
| **ProjectTask sync errors** (#55) | 🟡 Medium | Open | Task manage TX sync failures |
| **Extra signature after mint** (#32) | 🟡 Medium | Open | Auth flow improvement |
| **Update CLAUDE.md references** | 🟢 Low | Pending | Remove deleted `andamioscan-events.ts` and `use-event-confirmation.ts` from Key Files and API Clients tables |
| **Andamioscan removal** | ✅ Done | Complete | `andamioscan-events.ts` deleted, 0 imports remain. All pages use gateway hooks. |
| **Module wizard removed endpoint** (#68) | ✅ Done | Fixed | Replaced with list+filter pattern |
| **Phase 3.10 Direct API Calls** | ✅ Done | Complete | Only `sitemap/page.tsx` and `pending-tx-list.tsx` remain (deferred). |

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
| **2026-02-06** | **Andamio V2 Mainnet Launch** | Upcoming |

---

## Session Archives

Detailed session notes are archived by week:

| Archive | Sessions | Period |
|---------|----------|--------|
| [2026-01-05-to-2026-01-11.md](./archived-sessions/2026-01-05-to-2026-01-11.md) | 1-4 | Go API migration, type packages, wallet auth |
| [2026-01-12-to-2026-01-18.md](./archived-sessions/2026-01-12-to-2026-01-18.md) | 5-20 | Pioneers launch, V2 Gateway, TX migration |
| [2026-01-19-to-2026-01-25.md](./archived-sessions/2026-01-19-to-2026-01-25.md) | 21-28 | TX Watcher fixes, L1 Core, taxonomy compliance, colocated types |
