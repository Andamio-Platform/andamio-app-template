# Project Status

> **Last Updated**: January 30, 2026

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
| **API Hooks Cleanup** | **🔄 In Progress** | Course ✅ / Project Studio ✅ / Component Extraction ✅ / Project Hooks ⬜ |

---

## 📌 NEXT SESSION PROMPT

> **🔴 BUG: `/course/user/modules/` endpoint returns empty for on-chain-only courses**
>
> **Status**: API team notified — awaiting fix. May need to share findings.
>
> **Summary**: Course at `/course/c30dfb349c262ec293c5e1109703988fd84a462fa1d089a1e4b5e3e4` shows
> "No modules found" even though the course has on-chain modules.
>
> **Root Cause (Gateway inconsistency)**:
> - `GET /api/v2/course/user/course/get/{id}` — returns module data in `modules[]` array (correct)
> - `GET /api/v2/course/user/modules/{id}` — returns `{"data":[]}` (empty, incorrect)
>
> The dedicated modules endpoint doesn't include on-chain-only modules (courses with no DB module records).
> The course detail endpoint merges them correctly.
>
> **Frontend impact**: `useCourseModules()` hook in `use-course-module.ts:496` calls the dedicated
> modules endpoint. The page at `course/[coursenft]/page.tsx:51` uses this hook for its module list
> and never falls back to `course.modules` from `useCourse()`.
>
> **Possible frontend workaround**: Fall back to `course.modules` when `useCourseModules` returns empty.
> Defer until API team confirms whether they'll fix the endpoint.
>
> **Verified via curl**:
> ```
> # Returns modules embedded in course (correct)
> GET /api/v2/course/user/course/get/c30dfb349c262ec293c5e1109703988fd84a462fa1d089a1e4b5e3e4
> → modules: [{slt_hash: "", slts: ["I know who the pirate LeChuck is"], created_by: "Kenny"}]
>
> # Returns empty (incorrect)
> GET /api/v2/course/user/modules/c30dfb349c262ec293c5e1109703988fd84a462fa1d089a1e4b5e3e4
> → {"data":[]}
> ```
>
> ---
>
> **🔴 BLOCKED: Sync Andamio API with Andamioscan Updates**
>
> Issue #68 (`course-module/get` endpoint returning 404) is blocked pending Gateway sync.
>
> **Action Required (andamio-api team)**:
> 1. Sync Andamio API Gateway with latest Andamioscan schema updates
> 2. Verify `/api/v2/course/user/course-module/get/{id}/{module_code}` endpoint exists
> 3. Notify T3 team when ready for re-test
>
> **After Gateway Sync**: Re-test module wizard UX (issue #68)
> - File: `src/components/studio/wizard/module-wizard.tsx:212`
> - Currently hitting 404 on module refetch after lesson load
>
> ---
>
> **Course UX Testing → Project Hooks Migration**
>
> **Immediate**: Test course system UX after hooks refactoring
> - Module wizard flow (create/edit modules, SLTs, lessons)
> - Teacher dashboard (assignment commitments)
> - Student course viewer
>
> **After UX Verified**: Continue Phase 3.9/3.10 with Project hooks
>
> 1. **Phase 3.9** - Migrate project hooks to colocated types pattern:
>    - `use-project.ts` - Move types from `src/types/project.ts` INTO hook
>    - `use-project-manager.ts` - Create camelCase types + transformers
>    - `use-project-contributor.ts` - Create camelCase types + transformers
>    - Create `use-project-content.ts` for public task queries (similar to `use-course-content.ts`)
>
> 2. **Phase 3.10** - Extract direct API calls to hooks (50+ violations in 23 files)
>
> **Tracking**:
> - Phase 3.9 progress: `.claude/skills/hooks-architect/PROGRESS.md`
> - Phase 3.10 audit: `.claude/skills/project-manager/API-CALLS-AUDIT.md`
>
> **Ask user**: "Ready to test course UX, or shall we continue with project hooks?"

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
| **Modules endpoint empty for on-chain courses** | 🔴 High | Waiting on API team | `/course/user/modules/` returns `[]` for courses with only on-chain modules; course detail endpoint has the data. May implement frontend fallback. |
| **Course UX Testing** | 🟡 Medium | Pending | All course hooks refactored, needs manual testing before project migration |
| **Project Hooks Migration** | 🟡 Medium | Pending | 3 hooks need colocated types + create `use-project-content.ts` |
| **Phase 3.10 Direct API Calls** | ✅ Done | Complete | All component `authenticatedFetch` calls extracted to hooks. Only `sitemap/page.tsx` and `pending-tx-list.tsx` remain (deferred). |

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
| **2026-02-06** | **Andamio V2 Mainnet Launch** | Upcoming |

---

## Session Archives

Detailed session notes are archived by week:

| Archive | Sessions | Period |
|---------|----------|--------|
| [2026-01-05-to-2026-01-11.md](./archived-sessions/2026-01-05-to-2026-01-11.md) | 1-4 | Go API migration, type packages, wallet auth |
| [2026-01-12-to-2026-01-18.md](./archived-sessions/2026-01-12-to-2026-01-18.md) | 5-20 | Pioneers launch, V2 Gateway, TX migration |
| [2026-01-19-to-2026-01-25.md](./archived-sessions/2026-01-19-to-2026-01-25.md) | 21-28 | TX Watcher fixes, L1 Core, taxonomy compliance, colocated types |
