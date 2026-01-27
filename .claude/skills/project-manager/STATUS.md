# Project Status

> **Last Updated**: January 27, 2026

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
| **API Hooks Cleanup** | **🔄 In Progress** | 6/11 hooks approved |

---

## 📌 NEXT SESSION PROMPT

> **Project Route Implementation Ready**
>
> The Project route plan has been finalized. Ready to implement:
>
> 1. **Consolidate routes** - Remove `/commitments`, `/manage-treasury`, `/manage-contributors` pages
> 2. **Add dashboard tabs** - Treasury tab + Contributor Blacklist tab to `/studio/project/[projectid]`
> 3. **Verify `/manager` route** - Ensure it handles task commitment reviews (parallel to Course `/teacher`)
>
> See `ROLES-AND-ROUTES.md` for the finalized route structure.
>
> **Ask user**: "Ready to implement the Project route consolidation?"

---

## 🎯 TOP PRIORITY: API Hooks Cleanup

**Status**: Active - 6 hooks approved, 5 remaining + wizard refactored

> **⚠️ Post-Merge Follow-up (PR #90)**: Verify `--color-input` works in Tailwind v4. CLAUDE.md warns that `input` conflicts with HTML element names and may be silently ignored. Test outline buttons in dark mode (`dark:bg-input/30`, `dark:border-input`) to confirm they render correctly. If broken, rename to `--color-input-bg`.

Standardizing all API hooks to follow the exemplary pattern from `use-course.ts`. Tracking in: `.claude/skills/audit-api-coverage/API-HOOKS-CLEANUP-PLAN.md`

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

### Hook Approval Status

| Hook | Types | Status |
|------|-------|--------|
| `use-course.ts` | `Course`, `CourseDetail` | ✅ APPROVED |
| `use-course-owner.ts` | Uses Course types | ✅ APPROVED |
| `use-course-module.ts` | `CourseModule`, `SLT`, `Lesson`, `Assignment`, `Introduction` | ✅ APPROVED |
| `use-slt.ts` | Imports from use-course-module | ✅ APPROVED |
| `use-lesson.ts` | Imports from use-course-module | ✅ APPROVED |
| `use-course-student.ts` | `StudentCourse` | ✅ APPROVED |
| `use-course-teacher.ts` | `TeacherCourse`, `TeacherAssignmentCommitment` | 🔶 Needs review |
| `use-project.ts` | Has transformers in `types/project.ts` | 🔶 Move types INTO hook |
| `use-project-manager.ts` | Raw API types | ⬜ Needs migration |
| `use-project-contributor.ts` | Raw API types | ⬜ Needs migration |

### New Files Created

| File | Purpose |
|------|---------|
| `use-course-owner.ts` | Owner mutations (create, update, delete, register) |
| `use-assignment.ts` | Assignment CRUD (query + mutations) |
| `use-introduction.ts` | Introduction CRUD (mutations only) |

### Module Wizard Refactored (Pending UX Testing)

**Commit**: `74ef3f4` - wip: Refactor wizard to use hook types

- `wizard/types.ts` now imports from `~/hooks/api`
- `use-module-wizard-data.ts` composes React Query hooks (no direct fetch)
- All step components use camelCase fields
- Legacy `module-wizard.tsx` updated with transform functions

**Next**: Manual UX testing of wizard flow

---

## Recent Completions

**January 25, 2026 (Session 3)**:
- ✅ Refactored module wizard to use hook types (camelCase)
- ✅ `use-module-wizard-data.ts` now composes React Query hooks
- ✅ All 6 wizard step components updated to camelCase fields
- ✅ Added `useReorderSLT` to index.ts exports
- ✅ Created `use-assignment.ts` and `use-introduction.ts`

**January 25, 2026 (Session 2)**:
- ✅ Approved `use-course-module.ts` with CourseModuleStatus refactor
- ✅ Approved `use-slt.ts`, `use-lesson.ts`, `use-course-student.ts`
- ✅ Added `useRegisterCourseModule` hook
- ✅ Updated 15+ consumer files to camelCase

**January 25, 2026 (Session 1)**:
- ✅ Approved `use-course.ts` and `use-course-owner.ts`
- ✅ Created hook reorganization with subdirectories
- ✅ Updated skill docs for audit-api-coverage

**January 24, 2026**:
- Fixed module wizard infinite API polling
- Created HOOK-ARCHITECTURE-GUIDE.md
- Established colocated types pattern

---

## Current Blockers

| Blocker | Status | Notes |
|---------|--------|-------|
| **Module Wizard UX Testing** | Pending | Hook refactor complete (74ef3f4), needs manual testing |
| **Project Hooks Migration** | Pending | 3 project hooks need colocated types pattern |
| **Wallet Testing** | Pending | Nami, Flint, Yoroi, Lace need testing (Eternl works) |

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
