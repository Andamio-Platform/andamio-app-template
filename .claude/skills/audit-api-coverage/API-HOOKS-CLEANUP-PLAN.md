# API Hooks Cleanup Plan

> **Status**: 🚧 IN PROGRESS
> **Priority**: HIGH - Current top priority for this skill
> **Created**: January 25, 2026
> **Archive When**: All tasks completed and verified

This document tracks the cleanup work needed to bring all API hooks up to the exemplary standard established by `use-course.ts` and `use-project.ts`.

---

## Recent Changes (January 25, 2026)

### Completed Line-by-Line Review ✅

**use-course.ts** - APPROVED
- Added `staleTime: 30 * 1000` to `useActiveCourses`
- Removed "merged" terminology from comments (new style rule)
- Cross-file issue noted: inline module transform should use shared `transformModule` (fix when reviewing use-course-module.ts)

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
| **Task 6** | Rename `courseNftPolicyId` → `courseId` (hide Cardano implementation details) |

---

## Progress Tracker

| Hook | Task 0 | Task 1 | Task 2 | Task 3 | Task 4 | Task 5 | Task 6 | Status |
|------|--------|--------|--------|--------|--------|--------|--------|--------|
| `use-course.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **APPROVED** |
| `use-course-owner.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ **APPROVED** |
| `use-course-module.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | ⬜ | 🔶 Needs Task 6 |
| `use-project.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ Exemplary |
| `use-course-teacher.ts` | N/A | ✅ | ✅ | ✅ | ✅ | ✅ | N/A | ✅ Complete (RENAMED) |
| `use-slt.ts` | N/A | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | 🔶 Needs work |
| `use-lesson.ts` | N/A | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | 🔶 Needs work |
| `use-course-student.ts` | N/A | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | N/A | 🔶 Needs work (RENAMED) |
| `use-project-manager.ts` | N/A | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | N/A | 🔶 Needs work (RENAMED) |
| `use-project-contributor.ts` | N/A | ⬜ | ⬜ | ✅ | ⬜ | ⬜ | N/A | 🔶 Needs work (RENAMED) |

**Legend**: ✅ Done | ⬜ TODO | N/A Not applicable | **APPROVED** = Line-by-line reviewed and approved

---

## Cross-File Dependencies

Issues that span multiple hook files. Fix when reviewing the target file.

### use-course.ts → use-course-module.ts

**Issue**: `transformCourseDetail` in `use-course.ts` (lines 154-163) has an inline module mapping instead of using `transformModule` from `use-course-module.ts`.

**Why**: The course detail endpoint returns modules in a different shape than the module endpoints, so the inline transform was a pragmatic choice. However, this creates inconsistency.

**Fix when reviewing use-course-module.ts**:
1. Ensure `transformModule` can handle both shapes (or create a `transformModuleFromCourseDetail` variant)
2. Update `use-course.ts` to import and use the shared transformer
3. This ensures `CourseDetail.modules` has identical structure to standalone module queries

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
| ✅ Exemplary | 4 | use-course.ts, use-course-owner.ts, use-course-module.ts, use-project.ts |
| ✅ Complete | 1 | use-course-teacher.ts |
| 🔶 Needs Work | 5 | use-slt.ts, use-lesson.ts, use-course-student.ts, use-project-manager.ts, use-project-contributor.ts |

---

## Cleanup Tasks

### Phase 1: Type Consolidation (High Priority)

These hooks need app-level types and transformers.

#### Task 1.1: Fix use-slt.ts

**File**: `src/hooks/api/course/use-slt.ts`

**Current Issue**: Returns raw `SLTListResponse` and `SLTResponse` from generated types.

**Solution**: Reuse `SLT` type and `transformSLT` from `use-course-module.ts`, or define local versions.

**Changes Needed**:
- [ ] Import or define app-level `SLT` interface
- [ ] Add `transformSLT` function (or import from use-course-module)
- [ ] Update `useSLTs` to return `SLT[]` instead of raw types
- [ ] Export `SLT` type from this file

**Estimated Complexity**: Low (types already exist in use-course-module.ts)

---

#### Task 1.2: Fix use-lesson.ts

**File**: `src/hooks/api/course/use-lesson.ts`

**Current Issue**: Returns raw `LessonResponse` from generated types.

**Solution**: Reuse `Lesson` type and `transformLesson` from `use-course-module.ts`, or define local versions.

**Changes Needed**:
- [ ] Import or define app-level `Lesson` interface
- [ ] Add `transformLesson` function (or import from use-course-module)
- [ ] Update `useLesson` to return `Lesson` instead of raw type
- [ ] Export `Lesson` type from this file

**Estimated Complexity**: Low (types already exist in use-course-module.ts)

---

#### Task 1.3: Fix use-course-student.ts

**File**: `src/hooks/api/course/use-course-student.ts`

**Current Issue**: Type alias points directly to API type:
```typescript
export type StudentCourse = OrchestrationStudentCourseListItem;
```

**Changes Needed**:
- [ ] Define proper `StudentCourse` interface with camelCase fields
- [ ] Add `transformStudentCourse` function
- [ ] Update `useStudentCourses` to apply transformation
- [ ] Export transformer

**Estimated Complexity**: Medium

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

#### Task 3.1: Rename courseNftPolicyId → courseId

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

| Endpoint | Hook Name | Purpose |
|----------|-----------|---------|
| `POST /course/student/commitment/create` | `useCreateStudentCommitment` | Student enrollment |
| `POST /course/student/commitment/submit` | `useSubmitStudentCommitment` | Assignment submission |
| `POST /course/student/commitment/claim` | `useClaimCredential` | Claim credential |
| `POST /course/teacher/assignment-commitment/review` | `useReviewAssignment` | Teacher assessment |
| `POST /project/contributor/commitment/create` | `useCreateTaskCommitment` | Task commitment |
| `POST /project/contributor/commitments/list` | `useContributorCommitments` | List own commitments |

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
6. **Task 3.1** (courseNftPolicyId → courseId) - API taxonomy alignment

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
├── use-course-owner.ts        # Owner mutations (NEW)
├── use-course-teacher.ts      # Teacher queries + mutations (RENAMED)
├── use-course-student.ts      # Student queries + mutations (RENAMED)
├── use-course-module.ts       # Module entity CRUD
├── use-slt.ts                 # SLT entity CRUD
├── use-lesson.ts              # Lesson entity CRUD
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

The API returns a `source` field indicating data origin. Transformers convert this to semantic `status`:

```typescript
export type CourseStatus = "draft" | "active" | "unregistered";
// Also applies to Projects: ProjectStatus = "draft" | "active" | "unregistered"

function getStatusFromSource(source: string | undefined): CourseStatus {
  switch (source) {
    case "merged": return "active";       // On-chain + DB = fully operational
    case "chain_only": return "unregistered"; // On-chain but needs DB registration
    case "db_only":
    default: return "draft";              // DB only, not yet on-chain
  }
}
```

**Apply this pattern** whenever an API endpoint returns a `source` field.

For complex status (e.g., Assignment Commitments), combine `source` with API-returned status fields.

### API-Taxonomy Alignment (Task 6)

The api-taxonomy mandates hiding Cardano implementation details from app code:

> **Must transform backend `course_nft_policy_id` → `course_id`**
> Use `course_id` and `project_id` (not `course_policy_id`, `project_policy_id`)

**Variable Naming Rule**: Use `courseId` not `courseNftPolicyId` in all hook code.

### When to Archive This Document

Once all tasks are complete:
1. Update `api-hooks-audit.md` with final status
2. Move this file to `archived-sessions/` or delete
3. Update SKILL.md to remove priority notice

---

**Last Updated**: January 25, 2026 (Hook organization complete, file renames, use-owned-courses.ts deleted)
