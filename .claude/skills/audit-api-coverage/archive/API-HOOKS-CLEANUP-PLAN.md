# API Hooks Cleanup Plan

> **Status**: 🚧 IN PROGRESS
> **Priority**: HIGH - Current top priority for this skill
> **Created**: January 25, 2026
> **Archive When**: All tasks completed and verified

This document tracks the cleanup work needed to bring all API hooks up to the exemplary standard established by `use-course.ts` and `use-project.ts`.

---

## Recent Changes (January 25, 2026)

### Consumer Migration to Hooks - IN PROGRESS

**Goal**: Migrate all pages and components from direct `fetch()` calls to React Query hooks.

#### Completed Migrations ✅

| File | Hooks Used | Notes |
|------|------------|-------|
| `assignment/page.tsx` | `useCourse`, `useCourseModule`, `useSLTs`, `useAssignment` | Full migration, removed all useState/useEffect patterns |
| `require-course-access.tsx` | `useOwnerCourses` | Replaced manual auth check with hook |

#### Remaining Migrations (Lower Priority)

| File | Needs | Complexity |
|------|-------|------------|
| `instructor/page.tsx` | `useCourse`, `useTeacherAssignmentCommitments` + query invalidation | High (TX handling) |
| `sitemap/page.tsx` | `useActiveCourses`, `useOwnerCourses`, `useProjects`, `useManagerProjects` | Medium (dev tool) |
| `module-wizard.tsx` | Already uses `use-module-wizard-data` internally | N/A (already hooked) |

---

### useAssignment Hook - MOVED TO use-assignment.ts

**File**: `src/hooks/api/course/use-assignment.ts` (NEW FILE)

The `useAssignment` query hook was moved from `use-course-module.ts` to its own file for consistent file organization. Each entity (SLT, Lesson, Assignment, Introduction) now has its own file with queries AND mutations.

**Exports** (from use-assignment.ts):
- `useAssignment` - Query hook for fetching assignment by courseId + moduleCode
- `useCreateAssignment` - Mutation for creating assignments
- `useUpdateAssignment` - Mutation for updating assignments
- `useDeleteAssignment` - Mutation for deleting assignments

**Types** remain in `use-course-module.ts` (owner file):
- `Assignment` interface with camelCase fields
- `transformAssignment()` function
- `assignmentKeys` query key factory

---

### Type Fix: unknown in JSX Conditionals - IMPORTANT

**Issue**: When using `&&` in JSX with `unknown` typed values, the expression can return `unknown` which is not a valid ReactNode.

```typescript
// ❌ WRONG - assignment.contentJson is unknown, can return unknown
{assignment.contentJson && (<Content />)}

// ✅ CORRECT - Coerce to boolean first
{!!assignment.contentJson && (<Content />)}
```

**Why**: The `&&` operator returns the last truthy value or first falsy value. If `contentJson` is truthy but typed as `unknown`, the expression returns `unknown` (not a boolean), which TypeScript rejects as ReactNode.

**Affected Types**: Any interface with `?: unknown` fields (like `Assignment.contentJson`)

**Fix Applied**: `assignment/page.tsx` line 176 - Changed to `!!assignment.contentJson`

---

### React Query Type Parameters - RECOMMENDED

For proper type inference, add explicit type parameters to `useQuery`:

```typescript
// Before - type inference may not work
return useQuery({
  queryFn: async (): Promise<SLT[]> => { ... },
});

// After - explicit type parameters
return useQuery<SLT[], Error>({
  queryFn: async () => { ... },
});
```

**Applied**: `useSLTs` hook now has `useQuery<SLT[], Error>` for reliable type inference.

---

### use-course-teacher.ts Source → Status Migration - COMPLETE

**File**: `src/hooks/api/course/use-course-teacher.ts`

Migrated from API's `source` field to semantic `status` field to match the pattern in `use-course.ts`.

**Changes**:
- Added `TeacherCourseStatus` type: `"synced" | "onchain_only" | "db_only"`
- Deprecated `TeacherCourseSource` as type alias (for backward compatibility)
- Added `mapSourceToStatus()` helper function
- Updated `TeacherCourse.status` and `TeacherAssignmentCommitment.status` fields
- Removed 6 debug console.log statements
- Changed "Go API:" comments to "Endpoint:"

**Status Mapping**:
| API source | → App status |
|------------|--------------|
| `"merged"` | `"synced"` |
| `"chain_only"` | `"onchain_only"` |
| `"db_only"` | `"db_only"` |

**Consumer Updates**:
- `studio/course/page.tsx` - Changed `course.source` to `course.status` with new values

---

### use-introduction.ts - CREATED

**File**: `src/hooks/api/course/use-introduction.ts` (NEW FILE)

Created mutations for Introduction CRUD (no dedicated query endpoint exists):
- `useCreateIntroduction` - Create introduction for module
- `useUpdateIntroduction` - Update introduction content
- `useDeleteIntroduction` - Delete introduction

**Types** in `use-course-module.ts`:
- `Introduction` interface
- `transformIntroduction()` function
- `introductionKeys` query key factory

---

### Previous Session:

### use-course-student.ts Audit - COMPLETE

**Audited**: January 25, 2026

**Changes**:
- Defined proper `StudentCourse` interface with camelCase fields (flattened from nested `content`)
- Added `transformStudentCourse` function that flattens nested content
- Updated `useStudentCourses` hook to return `StudentCoursesResponse` (transformed)
- Added `staleTime: 30 * 1000` to query
- Added `useInvalidateStudentCourses` hook for cache invalidation

**Interface Fields** (flattened from API response):
| App Field | API Source |
|-----------|------------|
| `courseId` | `course_id` |
| `courseAddress` | `course_address` |
| `title` | `content.title` |
| `description` | `content.description` |
| `imageUrl` | `content.image_url` |
| `isPublic` | `content.is_public` |
| `enrollmentStatus` | `enrollment_status` |
| `studentStateId` | `student_state_id` |
| `owner` | `owner` |
| `teachers` | `teachers` |
| `createdSlot` | `created_slot` |
| `createdTx` | `created_tx` |
| `source` | `source` |

**Consumer Updates** (6 files):
- `credentials/page.tsx` - Updated to use camelCase fields (`course.enrollmentStatus`, `course.courseId`, `course.title`)
- `credentials-summary.tsx` - Updated to use camelCase fields
- `enrolled-courses-summary.tsx` - Updated to use camelCase fields
- `on-chain-status.tsx` - Updated to use camelCase fields
- `my-learning.tsx` - Updated to use camelCase fields (`course.courseId`, `course.title`, `course.description`)
- `user-course-status.tsx` - Updated to use camelCase fields

**Verification**: `npm run typecheck` and `npm run lint` pass.

---

### use-lesson.ts Audit - COMPLETE

**Audited**: January 25, 2026

**Changes**:
- Import `Lesson`, `transformLesson` from `./use-course-module` (owner file pattern)
- Removed raw type imports (`LessonResponse`, `LessonListResponse`)
- `useLesson` now returns `Lesson | null` with camelCase fields
- `useCreateLesson` returns `Lesson` (transformed)
- Renamed `courseId` → `courseId` and `moduleIndex` → `sltIndex`
- Changed "Go API:" → "Endpoint:" in comments
- Added `staleTime: 30 * 1000` to queries
- Removed debug console.logs
- Updated `useLessons` JSDoc to recommend `useSLTs()` pattern (no batch endpoint exists)

**Consumer Updates**:
- `course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Updated to use camelCase fields (`lesson.isLive`, `lesson.contentJson`, `lesson.imageUrl`, `lesson.videoUrl`)
- `step-credential.tsx` - Updated mutation call to use `courseId:` and `sltIndex:`

**Verification**: `npm run typecheck` and `npm run lint` pass.

---

### use-slt.ts Audit - COMPLETE

**Audited**: January 25, 2026

**Changes**:
- Import `SLT`, `transformSLT` from `./use-course-module` (types are colocated in owner file)
- Removed raw type imports (`SLTListResponse`, `SLTResponse`)
- `useSLTs` now returns `SLT[]` with camelCase fields
- All mutations return `SLT` or `Promise<void>` (transformed)
- Renamed `courseId` → `courseId` throughout (query keys, hooks, mutations)
- Changed "Go API:" → "Endpoint:" in comments
- Added `staleTime: 30 * 1000` to query
- Removed debug console.logs

**Consumer Updates**:
- `course/[coursenft]/[modulecode]/page.tsx` - Updated to use camelCase fields (`slt.moduleIndex`, `slt.sltText`, `lesson.imageUrl`, etc.)
- `step-credential.tsx` - Updated mutation call to use `courseId:`
- `step-slts.tsx` - Updated all 4 mutation calls to use `courseId:`

**Verification**: `npm run typecheck` and `npm run lint` pass.

---

### Module Registration Endpoint - COMPLETE ✅

**Issue**: The `CourseModuleStatus` refactor introduced the `"unregistered"` status for on-chain-only modules, but there was no API endpoint to register these modules in the database.

**Solution**: Endpoint `POST /api/v2/course/teacher/course-module/register` now exists:
- Accepts `course_id`, `course_module_code`, and `slt_hash`
- Fetches on-chain SLT data from Andamioscan
- Creates module + SLT records in DB
- Returns `RegisteredModule` with slt_count and created SLTs

**Hook Added**: `useRegisterCourseModule()` in `use-course-module.ts`

**UX Added**: Studio course page (`/studio/course/:coursenft`) On-Chain tab now shows:
- Unregistered modules with SLT preview
- Registration form with module code input
- Status badge in stats summary

**Tracking**: [andamio-api#16](https://github.com/Andamio-Platform/andamio-api/issues/16) - RESOLVED

---

### CourseModuleStatus Refactor - PENDING APPROVAL

**Major Refactor**: Replaced `source: ModuleSource` with `status: CourseModuleStatus`

The `CourseModule` interface now exposes a semantic 5-value status enum instead of the raw API `source` field:

| Status | Meaning |
|--------|---------|
| `draft` | DB only, Teacher editing, SLTs can change |
| `approved` | DB only, SLTs locked, sltHash stored, ready for TX |
| `pending_tx` | TX submitted but not confirmed |
| `active` | On-chain + DB (merged) |
| `unregistered` | On-chain only, needs DB registration |

**Status derivation logic** (from API `source` + `module_status` fields):
| source | module_status | → status |
|--------|---------------|----------|
| chain_only | * | unregistered |
| merged | * | active |
| db_only | DRAFT | draft |
| db_only | APPROVED | approved |
| db_only | PENDING_TX | pending_tx |

**Changes to use-course-module.ts**:
- Added `CourseModuleStatus` type (exported)
- Added `getModuleStatus(source, moduleStatus)` helper function
- Updated `CourseModule.status: CourseModuleStatus` (replaced `source: ModuleSource`)
- Removed `transformModuleFromCourseDetail()` function
- Removed `CourseDetailModule` interface
- Removed `ModuleSource` type (internalized)
- Removed debug console.logs from `useTeacherCourseModules` and `useCreateCourseModule`
- Fixed JSDoc example in `useCourseModuleMap` (`policyIds` → `courseIds`)

**Changes to use-course.ts**:
- Removed import of `transformModuleFromCourseDetail`
- Updated `transformCourseDetail()` with inline module mapping (modules always `status: "active"`)
- Removed unused `ApiSource` type

**Changes to index.ts**:
- Replaced `type ModuleSource` with `type CourseModuleStatus` in exports

**Consumer Updates**:
- `studio/course/[coursenft]/page.tsx` - Updated status comparisons to lowercase
- `studio/course/page.tsx` - Updated status comparisons to lowercase
- `studio-module-card.tsx` - Updated status comparisons to lowercase

**Verification**: `npm run typecheck` and `npm run lint` pass.

---

### Assignment & Introduction Types - COMPLETE

**Consistency Fix**: All four module content types now colocated in `use-course-module.ts`:

| Type | Fields | Transform |
|------|--------|-----------|
| `SLT` | id, sltId, sltText, moduleIndex, moduleCode, createdAt, updatedAt, lesson | `transformSLT()` |
| `Lesson` | id, contentJson, sltId, sltIndex, moduleCode, createdAt, updatedAt, title, description, isLive, imageUrl, videoUrl | `transformLesson()` |
| `Assignment` | id, title, contentJson, moduleCode, createdAt, updatedAt | `transformAssignment()` |
| `Introduction` | id, title, contentJson, moduleCode, createdAt, updatedAt | `transformIntroduction()` |

**Changes**:
- Added `Assignment` interface (camelCase fields)
- Added `Introduction` interface (camelCase fields)
- Added `transformAssignment()` function
- Added `transformIntroduction()` function
- Updated `CourseModule.assignment: Assignment | null` (was `unknown`)
- Updated `CourseModule.introduction: Introduction | null` (was `unknown`)
- Updated `transformCourseModule()` to transform nested entities
- Exported all transforms and types from `index.ts`

**Verification**: `npm run typecheck` and `npm run lint` pass.

---

### Deprecated Exports Removed - COMPLETE

Removed backward compatibility exports that were marked deprecated:
- `MergedCourseModule` type alias → consumers migrated to `CourseModule`
- `flattenMergedModule` function alias → consumers migrated to `transformCourseModule`

**Consumer Updates**:
- `slt-lesson-table.tsx` - Updated to use `CourseModule`
- `on-chain-slts-viewer.tsx` - Updated to use `CourseModule`

**Verification**: `npm run typecheck` and `npm run lint` pass.

---

### Previous Session: use-course-module.ts Task 6

**Task 6 Complete**: Renamed `courseId` → `courseId` throughout:
- Query key functions (list, teacherList, detail, map)
- All hook parameters (useCourseModules, useTeacherCourseModules, useCourseModule, useCourseModuleMap)
- All mutation inputs (useCreateCourseModule, useUpdateCourseModule, useUpdateCourseModuleStatus, useDeleteCourseModule)
- JSDoc examples updated

**Consumer Updates**:
- `step-credential.tsx` - Updated mutation calls to use `courseId:`
- `studio/course/[coursenft]/page.tsx` - Updated deleteModuleMutation call

### Completed Line-by-Line Review ✅

**use-course.ts** - APPROVED ✅
- Added `staleTime: 30 * 1000` to `useActiveCourses`
- Removed "merged" terminology from comments (new style rule)
- Updated `transformCourseDetail()` to use inline module mapping with `status: "active"`

**use-course-owner.ts** - APPROVED
- Added `staleTime: 30 * 1000` to `useOwnerCourses`
- Fixed `useUpdateCourse` input to use camelCase (`imageUrl`, `videoUrl`)
- Changed all "Go API:" comments to "Endpoint:"
- Migrated consumers to use hooks:
  - `create-course-dialog.tsx` → uses `useRegisterCourse`, `useUpdateCourse`
  - `create-course.tsx` → uses `useRegisterCourse`, `useUpdateCourse`
  - `studio/course/[coursenft]/page.tsx` → fixed camelCase usage

**New Documentation**:
- Added Style Rules section (no internal API terminology in comments)
- Created `ANDAMIO-IO-ONLY-HOOKS.md` for sandbox-only hooks (`useCreateCourse`, etc.)

### Hook Organization Complete

Implemented the two-tier hybrid organization from `HOOK-ORGANIZATION-PLAN.md`:

**New Files Created**:
- `use-course-owner.ts` - Owner mutations (useOwnerCourses, useCreateCourse, useUpdateCourse, useDeleteCourse, useRegisterCourse)

**Files Renamed**:
- `use-teacher-courses.ts` → `use-course-teacher.ts`
- `use-student-courses.ts` → `use-course-student.ts`
- `use-manager-projects.ts` → `use-project-manager.ts`
- `use-contributor-projects.ts` → `use-project-contributor.ts`

**Files Deleted**:
- `use-owned-courses.ts` - Legacy useState hook (consumers migrated to useOwnerCourses)

**Hooks Renamed**:
- `usePublishedCourses` → `useActiveCourses`
- `useTeacherCommitments` → `useTeacherAssignmentCommitments`
- `useOwnedCoursesQuery` → `useOwnerCourses` (moved to use-course-owner.ts)

**Query Keys Renamed** (for entity-role consistency):
- `teacherCourseKeys` → `courseTeacherKeys`
- `studentCourseKeys` → `courseStudentKeys`
- `managerProjectKeys` → `projectManagerKeys`
- `contributorProjectKeys` → `projectContributorKeys`

---

## Style Rules

Rules for all API hooks. Enforce during review.

### No Internal API Terminology in Comments

Do not expose internal API team terminology in comments or JSDoc. The word "merged" refers to the API's internal data-merging strategy (combining on-chain and off-chain data) and should not appear in app-level code comments.

**❌ Wrong:**
```typescript
// Merged endpoint: GET /api/v2/course/user/course/get/{course_id}
* Fetch all active courses (merged endpoint)
```

**✅ Correct:**
```typescript
// Endpoint: GET /api/v2/course/user/course/get/{course_id}
* Fetch all active courses
```

**Exception:** The literal string `"merged"` is fine in code when working with the API's `source` field values (e.g., `case "merged": return "active"`).

---

## Hook-by-Hook Checklist

We work through each hook one at a time. For every hook:

| Task | Description |
|------|-------------|
| **Task 0** | Remove deprecated types (migrate consumers, delete aliases) |
| **Task 1** | Define app-level types with camelCase fields |
| **Task 2** | Add transform functions (API → App) |
| **Task 3** | Export query keys object |
| **Task 4** | Ensure hooks return transformed types |
| **Task 5** | Update index.ts exports |
| **Task 6** | Rename `courseId` → `courseId` (hide Cardano implementation details) |

---

## Progress Tracker

| Hook | Task 0 | Task 1 | Task 2 | Task 3 | Task 4 | Task 5 | Task 6 | Status |
|------|--------|--------|--------|--------|--------|--------|--------|--------|
| `use-course.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **APPROVED** |
| `use-course-owner.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **APPROVED** |
| `use-course-module.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **COMPLETE** |
| `use-project.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ Exemplary |
| `use-course-teacher.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ **COMPLETE** (source→status) |
| `use-slt.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **COMPLETE** |
| `use-lesson.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **COMPLETE** |
| `use-course-student.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ **COMPLETE** |
| `use-project-manager.ts` | N/A | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | N/A | 🔶 Needs work (RENAMED) |
| `use-project-contributor.ts` | N/A | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | N/A | 🔶 Needs work (RENAMED) |

**Legend**: ✅ Done | ⬜ TODO | N/A Not applicable | **APPROVED** = Line-by-line reviewed and approved | 🔵 **PENDING API** = Awaiting backend endpoint

---

## Cross-File Dependencies

Issues that span multiple hook files. Fix when reviewing the target file.

### use-course.ts → use-course-module.ts ✅ RESOLVED (REVISED)

**Original Issue**: `transformCourseDetail` in `use-course.ts` had an inline module mapping instead of using a shared transformer.

**Original Resolution**: Created `transformModuleFromCourseDetail()` in `use-course-module.ts`.

**Revised Resolution** (CourseModuleStatus Refactor): Reverted to inline module mapping in `use-course.ts` for cleaner architectural separation:
- `use-course.ts` handles its own embedded module data (simplified on-chain view)
- `use-course-module.ts` handles module-specific endpoints only (full merged data)
- Removed `transformModuleFromCourseDetail()` from `use-course-module.ts`
- Modules from course detail always get `status: "active"` (they're from on-chain data)

**Why inline**: The course detail endpoint returns a fundamentally different shape (on-chain only, no content fields). Rather than creating a special transform function, it's cleaner for `use-course.ts` to handle its own embedded data.

---

## Open Questions (Resolve Before Implementation)

### Q1: Type Location for SLT and Lesson ✅ RESOLVED

The `SLT` and `Lesson` types already exist in `use-course-module.ts`. For Tasks 1.1 & 1.2, should we:

- **A**: Import them from use-course-module (creates dependency between hook files) ✅
- **B**: Define them locally in each hook file (duplication but no dependency)
- **C**: Extract to a shared `types/course.ts` file (new pattern, central location)

**Decision**: **Option A** - Import from the hook that owns the type.

**Rule**: Types flow UP the hierarchy. Each hook owns its primary types, and other hooks can import from it as long as imports are unidirectional (no circular dependencies).

```
use-course.ts (owns Course, CourseDetail)
    ↑ imports CourseModule
use-course-module.ts (owns CourseModule, SLT, Lesson)
    ↑ can be imported by
use-slt.ts, use-lesson.ts (no owned types, use imports)
```

---

### Q2: What to Do with use-owned-courses.ts ✅ RESOLVED

This hook returns `moduleCounts` in addition to courses. The React Query version (`useOwnedCoursesQuery`) doesn't have this.

**Decision**: **Option C** - Deleted the file. Consumers migrated to `useOwnerCourses` from `use-course-owner.ts`. Module counts temporarily disabled in consuming components with TODO comments to add a separate `useModuleCounts` hook if needed.

---

### Q3: PR Strategy

Should we implement all fixes in one PR, or break into smaller PRs per phase?

- **A**: One PR for all phases (faster, but larger review)
- **B**: One PR per phase (3 PRs, incremental)
- **C**: One PR per task (6 PRs, most granular)

**Decision**: _TBD_

---

## Audit Summary

Audited **11 files** in `src/hooks/api/` (after reorganization).

| Status | Count | Files |
|--------|-------|-------|
| ✅ APPROVED | 2 | use-course.ts, use-course-owner.ts |
| ✅ Complete | 7 | use-course-module.ts, use-course-teacher.ts, use-slt.ts, use-lesson.ts, use-assignment.ts, use-introduction.ts, use-course-student.ts |
| ✅ Exemplary | 1 | use-project.ts |
| 🔶 Needs Work | 2 | use-project-manager.ts, use-project-contributor.ts |

---

## Cleanup Tasks

### Phase 1: Type Consolidation (High Priority)

These hooks need app-level types and transformers.

#### Task 1.1: Fix use-slt.ts ✅ COMPLETE

**File**: `src/hooks/api/course/use-slt.ts`

**Solution**: Imported `SLT` type and `transformSLT` from `use-course-module.ts` (owner file pattern).

**Changes Made**:
- [x] Import `SLT`, `transformSLT` from use-course-module
- [x] Update `useSLTs` to return `SLT[]` with transformation
- [x] Update all mutations to use `courseId` instead of `courseId`
- [x] Add `staleTime: 30 * 1000`
- [x] Remove debug console.logs
- [x] Update "Go API:" → "Endpoint:" comments

---

#### Task 1.2: Fix use-lesson.ts ✅ COMPLETE

**File**: `src/hooks/api/course/use-lesson.ts`

**Solution**: Imported `Lesson` type and `transformLesson` from `use-course-module.ts` (owner file pattern).

**Changes Made**:
- [x] Import `Lesson`, `transformLesson` from use-course-module
- [x] Update `useLesson` to return `Lesson | null` with transformation
- [x] Update `useCreateLesson` to return `Lesson`
- [x] Rename `courseId` → `courseId` and `moduleIndex` → `sltIndex`
- [x] Add `staleTime: 30 * 1000`
- [x] Remove debug console.logs
- [x] Update "Go API:" → "Endpoint:" comments

---

#### Task 1.3: Fix use-course-student.ts ✅ COMPLETE

**File**: `src/hooks/api/course/use-course-student.ts`

**Solution**: Defined proper `StudentCourse` interface with flattened `content` fields.

**Changes Made**:
- [x] Define proper `StudentCourse` interface with camelCase fields
- [x] Add `transformStudentCourse` function (flattens nested content)
- [x] Update `useStudentCourses` to apply transformation
- [x] Export transformer and type
- [x] Add `staleTime: 30 * 1000`
- [x] Add `useInvalidateStudentCourses` hook

---

### Phase 2: Project Hooks Cleanup (Medium Priority)

These hooks work but use snake_case in their type definitions.

#### Task 2.1: Fix use-project-manager.ts

**File**: `src/hooks/api/project/use-project-manager.ts`

**Current Issue**: `ManagerProject` and `ManagerCommitment` interfaces use snake_case:
```typescript
export interface ManagerProject {
  project_id: string;           // Should be projectId
  project_address?: string;     // Should be projectAddress
  // ...
}
```

**Changes Needed**:
- [ ] Convert `ManagerProject` fields to camelCase
- [ ] Convert `ManagerCommitment` fields to camelCase
- [ ] Add `transformManagerProject` function
- [ ] Add `transformManagerCommitment` function
- [ ] Export transformers
- [ ] Remove inline flattening in hook

**Estimated Complexity**: Medium

---

#### Task 2.2: Fix use-project-contributor.ts

**File**: `src/hooks/api/project/use-project-contributor.ts`

**Current Issue**: `ContributorProject` interface uses snake_case.

**Changes Needed**:
- [ ] Convert `ContributorProject` fields to camelCase
- [ ] Add `transformContributorProject` function
- [ ] Export transformer

**Estimated Complexity**: Medium

---

### Phase 3: Variable Naming (Task 6)

#### Task 3.1: Rename courseId → courseId

**Files requiring Task 6**:
- `use-course-module.ts` - 50+ occurrences
- `use-slt.ts` - 20+ occurrences
- `use-lesson.ts` - 15+ occurrences
- `use-module-wizard-data.ts` - 10+ occurrences

**Implementation**: Mechanical find-replace, but test after each file.

---

### Phase 4: Missing Hooks (Future Work)

These hooks are needed for complete user flows but can be added incrementally.

#### High Priority (Core User Flows)

| Endpoint | Hook Name | Purpose | Status |
|----------|-----------|---------|--------|
| `POST /course/teacher/course-module/register` | `useRegisterCourseModule` | Register on-chain module in DB | ✅ Done |
| `POST /course/teacher/lesson/update` | `useUpdateLesson` | Update lesson content | ✅ Done |
| `POST /course/teacher/lesson/delete` | `useDeleteLesson` | Delete lesson | ✅ Done |
| `POST /course/teacher/assignment/create` | `useCreateAssignment` | Create assignment | ✅ Done |
| `POST /course/teacher/assignment/update` | `useUpdateAssignment` | Update assignment | ✅ Done |
| `POST /course/teacher/assignment/delete` | `useDeleteAssignment` | Delete assignment | ✅ Done |
| `POST /course/teacher/introduction/create` | `useCreateIntroduction` | Create introduction | ✅ Done |
| `POST /course/teacher/introduction/update` | `useUpdateIntroduction` | Update introduction | ✅ Done |
| `POST /course/teacher/introduction/delete` | `useDeleteIntroduction` | Delete introduction | ✅ Done |
| `POST /course/student/commitment/create` | `useCreateStudentCommitment` | Student enrollment | ⬜ TODO |
| `POST /course/student/commitment/submit` | `useSubmitStudentCommitment` | Assignment submission | ⬜ TODO |
| `POST /course/student/commitment/claim` | `useClaimCredential` | Claim credential | ⬜ TODO |
| `POST /course/teacher/assignment-commitment/review` | `useReviewAssignment` | Teacher assessment | ⬜ TODO |
| `POST /project/contributor/commitment/create` | `useCreateTaskCommitment` | Task commitment | ⬜ TODO |
| `POST /project/contributor/commitments/list` | `useContributorCommitments` | List own commitments | ⬜ TODO |

#### Medium Priority (Management)

| Endpoint | Hook Name | Purpose |
|----------|-----------|---------|
| `POST /course/owner/teachers/update` | `useUpdateTeachers` | Manage teachers |
| `POST /project/manager/task/create` | `useCreateTask` | Create task |
| `POST /project/manager/task/update` | `useUpdateTask` | Update task |

---

## Implementation Order

Recommended order based on dependencies and impact:

1. **Task 1.1** (use-slt.ts) - Quick win, types exist
2. **Task 1.2** (use-lesson.ts) - Quick win, types exist
3. **Task 1.3** (use-course-student.ts) - Needed for my-learning
4. **Task 2.1** (use-project-manager.ts) - Needed for project studio
5. **Task 2.2** (use-project-contributor.ts) - Needed for contributions view
6. **Task 3.1** (courseId → courseId) - API taxonomy alignment

---

## Completion Criteria

This plan is complete when:

- [ ] All hook files follow the exemplary pattern from use-course.ts
- [ ] All exported types use camelCase fields
- [ ] All hooks export transformers
- [ ] No hooks return raw API types to components
- [x] ~~Deprecated files are removed or marked~~ (use-owned-courses.ts deleted)
- [x] ~~Index exports are updated~~ (completed during reorganization)

---

## Notes for Future Reference

### Current Hook Structure

After reorganization, the hook files are organized as:

```
src/hooks/api/course/
├── use-course.ts              # Core types + PUBLIC queries only
├── use-course-owner.ts        # Owner mutations
├── use-course-teacher.ts      # Teacher queries + mutations (source→status complete)
├── use-course-student.ts      # Student queries + mutations
├── use-course-module.ts       # Module types + CRUD (owns SLT, Lesson, Assignment, Introduction types)
├── use-slt.ts                 # SLT queries + CRUD mutations
├── use-lesson.ts              # Lesson queries + CRUD mutations
├── use-assignment.ts          # Assignment query + CRUD mutations (NEW)
├── use-introduction.ts        # Introduction CRUD mutations (NEW)
└── use-module-wizard-data.ts  # Composite UI hook

src/hooks/api/project/
├── use-project.ts             # Core types + PUBLIC queries
├── use-project-manager.ts     # Manager queries + mutations (RENAMED)
└── use-project-contributor.ts # Contributor queries + mutations (RENAMED)
```

### Why camelCase?

- TypeScript convention
- Prevents confusion between API types and app types
- Components never need to know about snake_case
- Transformers are the single point of conversion

### Type Colocation Pattern

Types should be colocated with their hooks:
- `use-course.ts` exports `Course`, `CourseDetail`, `transformCourse`
- `use-project.ts` exports `Project`, `Task`, `transformProject`

This avoids circular dependencies and makes imports predictable.

### Status Pattern (source → status)

The API returns a `source` field indicating data origin. Transformers convert this to semantic `status`.

#### Simple Status (3-value)

For entities where `source` alone determines status (Course, Project):

```typescript
export type CourseStatus = "draft" | "active" | "unregistered";

function getStatusFromSource(source: string | undefined): CourseStatus {
  switch (source) {
    case "merged": return "active";       // On-chain + DB = fully operational
    case "chain_only": return "unregistered"; // On-chain but needs DB registration
    case "db_only":
    default: return "draft";              // DB only, not yet on-chain
  }
}
```

#### Complex Status (5-value)

For entities with additional lifecycle states (CourseModule):

```typescript
export type CourseModuleStatus =
  | "draft"        // DB only, Teacher editing, SLTs can change
  | "approved"     // DB only, SLTs locked, sltHash stored, ready for TX
  | "pending_tx"   // TX submitted but not confirmed
  | "active"       // On-chain + DB (merged)
  | "unregistered" // On-chain only, needs DB registration

function getModuleStatus(source: string | undefined, moduleStatus: string | undefined): CourseModuleStatus {
  if (source === "chain_only") return "unregistered";
  if (source === "merged") return "active";
  // DB-only modules: derive from module_status
  switch (moduleStatus?.toUpperCase()) {
    case "APPROVED": return "approved";
    case "PENDING_TX": return "pending_tx";
    default: return "draft";
  }
}
```

**Apply this pattern** whenever an API endpoint returns a `source` field.

For complex status (e.g., CourseModule, Assignment Commitments), combine `source` with API-returned status fields.

### API-Taxonomy Alignment (Task 6)

The api-taxonomy mandates hiding Cardano implementation details from app code:

> **Must transform backend `course_nft_policy_id` → `course_id`**
> Use `course_id` and `project_id` (not `course_policy_id`, `project_policy_id`)

**Variable Naming Rule**: Use `courseId` not `courseId` in all hook code.

### When to Archive This Document

Once all tasks are complete:
1. Update `api-hooks-audit.md` with final status
2. Move this file to `archived-sessions/` or delete
3. Update SKILL.md to remove priority notice

---

**Last Updated**: January 25, 2026 (Source→Status migration complete in use-course-teacher.ts; file organization consolidated - useAssignment moved to use-assignment.ts, use-introduction.ts created; all course hooks complete; 2 project hooks remaining)
