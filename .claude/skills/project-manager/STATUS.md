# Project Status

> **Last Updated**: January 24, 2026

Current implementation status of the Andamio T3 App Template.

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 15/15 routes |
| Project System | In Progress | 10/13 routes |
| Transaction System | **100% Complete** | 16/16 V2 components |
| Gateway Migration | **Complete** | Unified V2 Gateway |
| L1 Core Package | **Complete** | `@andamio/core` created |
| **Colocated Types Pattern** | **Course Side Complete** | Project side pending |

---

## 🎯 TOP PRIORITY: Formalize Hook Architecture Pattern

**Status**: Active - Course side complete, need to document and apply to all hooks

The **Colocated Types Pattern** has been successfully implemented for Course hooks. This pattern MUST be formalized and applied consistently to ALL hooks.

### The Pattern (Established)

```
Gateway API (snake_case) → Hook (transform) → Component (camelCase)
```

**Key Rules**:
1. App-level types (camelCase) are defined IN hook files, not separate type files
2. Transform functions convert API snake_case to app camelCase
3. Components import types from hooks, NEVER from `~/types/generated`
4. Clean domain names: `Course`, `CourseModule`, `Task` - never "Merged" or "Flattened" prefixes
5. The `source` field indicates data origin, not the type name

### Course Hooks (✅ Complete)

| Hook | Types | Transform Functions | Status |
|------|-------|-------------------|--------|
| `use-course.ts` | `Course`, `CourseDetail`, `CourseSource` | `transformCourse()`, `transformCourseDetail()` | ✅ Complete |
| `use-course-module.ts` | `CourseModule`, `SLT`, `Lesson`, `ModuleSource` | `transformCourseModule()`, `transformSLT()`, `transformLesson()` | ✅ Complete |
| `use-teacher-courses.ts` | `TeacherCourse`, `TeacherAssignmentCommitment`, `TeacherCourseWithModules` | `transformTeacherCourse()`, `transformTeacherCommitment()` | ✅ Complete |
| `use-owned-courses.ts` | Uses `Course` from use-course | Uses `transformCourse()` | ✅ Complete |

**Deprecated aliases added for backward compatibility**:
- `FlattenedCourseListItem` → `Course`
- `FlattenedCourseDetail` → `CourseDetail`
- `MergedCourseModule` → `CourseModule`

### Project Hooks (⬜ Needs Migration)

| Hook | Current State | Action Needed |
|------|---------------|---------------|
| `use-project.ts` | Has transformers in `types/project.ts` | Move types INTO hook |
| `use-contributor-projects.ts` | Raw API types | Add colocated types + transforms |
| `use-manager-projects.ts` | Raw API types | Add colocated types + transforms |

### Other Hooks (⬜ Not Started)

| Hook | Current State | Action Needed |
|------|---------------|---------------|
| `use-slt.ts` | Raw API types | Add `SLT` type + `transformSLT()` |
| `use-lesson.ts` | Raw API types | Add `Lesson` type + `transformLesson()` |
| `use-student-courses.ts` | Raw API types | Add `StudentCourse` type + transform |

### Next Steps (Prioritized)

1. **Document the pattern formally** in HOOK-ARCHITECTURE-GUIDE.md
2. **Delete `src/types/project.ts`** - migrate types into `use-project.ts`
3. **Apply pattern to remaining hooks**
4. **Audit pages for raw fetch() calls** - replace with hooks

---

## Recent Completions

**January 24, 2026 (Session 2)**:
- ✅ Migrated `use-course.ts` to colocated types pattern (camelCase)
- ✅ Migrated `use-course-module.ts` to colocated types pattern
- ✅ Migrated `use-teacher-courses.ts` to colocated types pattern
- ✅ Updated 10+ component files to use new camelCase field names
- ✅ Fixed all TypeScript errors (build passes)
- ✅ Established rule: "App-level types use clean domain names - never 'Merged' or 'Flattened' prefixes"

**January 24, 2026 (Session 1)**:
- Fixed module wizard infinite API polling (dependency loop in `use-module-wizard-data.ts`)
- Added `transformMergedTask()` function in `types/project.ts`
- Added `useProjectTasks()` hook in `use-project.ts`
- Created `HOOK-ARCHITECTURE-GUIDE.md` tracking document

**January 23, 2026**:
- **Merged Endpoint Type Migration**: API v2.0.0 response shape changes
- Created flattening layer (`flattenCourseListItem`, `FlattenedCourseListItem`)
- **Developer Auth V2 Migration**: Two-step wallet-verified registration
- Replaced deprecated `andamioscan.ts` with minimal `andamioscan-events.ts`

---

## Current Blockers

| Blocker | Status | Notes |
|---------|--------|-------|
| **SLT Endpoints Schema Mismatch** | Blocking | SLT create/update/delete expect camelCase. [GitHub Issue #3](https://github.com/Andamio-Platform/andamio-api/issues/3) |
| **Project V2 Task Update/Delete** | Blocking | API returns 404 for existing tasks |
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
- `/studio/course/[coursenft]/instructor` - Instructor dashboard
- `/studio/course/[coursenft]/[modulecode]` - Module editor
- `/studio/course/[coursenft]/[modulecode]/slts` - SLT management
- `/studio/course/[coursenft]/[modulecode]/assignment` - Assignment editor
- `/studio/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson editor
- `/studio/course/[coursenft]/[modulecode]/introduction` - Introduction editor

### Project System (10/13 Routes)

**Public (Contributor)** - 4/4 routes:
- `/project` - Project catalog
- `/project/[projectid]` - Project detail with tasks
- `/project/[projectid]/contributor` - Contributor dashboard
- `/project/[projectid]/[taskhash]` - Task detail with commitment

**Studio (Manager)** - 6/9 routes:
- `/studio/project` - Project management
- `/studio/project/[projectid]` - Project dashboard
- `/studio/project/[projectid]/manager` - Manager dashboard
- `/studio/project/[projectid]/draft-tasks` - Task list management
- `/studio/project/[projectid]/draft-tasks/new` - Create new task
- `/studio/project/[projectid]/draft-tasks/[taskindex]` - Edit existing task
- `/studio/project/[projectid]/manage-treasury` - **Planned**
- `/studio/project/[projectid]/manage-contributors` - **Planned**
- `/studio/project/[projectid]/commitments` - **Planned**

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
