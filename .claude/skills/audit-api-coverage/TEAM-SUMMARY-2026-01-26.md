# API Hooks Team Summary

**Date**: Monday, January 26, 2026
**Status**: Course hooks complete, Project hooks ready for implementation

---

## What Changed

Over the past week, we completed a major cleanup of the API hooks layer. The hooks are now the standardized interface between the Andamio Gateway API and our React components.

### Documentation Reorganized

| Before | After |
|--------|-------|
| 8 docs, some overlapping | 7 focused docs + archive |
| Active work plans mixed with reference | Completed plans archived for reference |
| Outdated status in multiple places | Single source of truth in `HOOKS-STATUS.md` |

**Archived** (still available in `archive/`):
- `API-HOOKS-CLEANUP-PLAN.md` - Detailed task log
- `HOOK-ORGANIZATION-PLAN.md` - Organization strategy

### Course Hooks: COMPLETE

All 10 course hook files now follow a consistent pattern:

```
src/hooks/api/course/
├── use-course.ts              # Core types + public queries
├── use-course-owner.ts        # Owner mutations
├── use-course-teacher.ts      # Teacher queries + mutations
├── use-course-student.ts      # Student queries + mutations
├── use-course-module.ts       # Module types + CRUD
├── use-slt.ts                 # SLT queries + mutations
├── use-lesson.ts              # Lesson queries + mutations
├── use-assignment.ts          # Assignment query + mutations
├── use-introduction.ts        # Introduction mutations
└── use-module-wizard-data.ts  # Composite UI hook
```

**Key improvements**:
- All types use camelCase fields (no more `course_id`, now `courseId`)
- Transform functions convert API → App types
- Semantic status values (`"active"` instead of `"merged"`)
- Query keys exported for cache management
- Consumer components migrated to hooks

---

## The Rules

### 1. Hooks Are the Interface

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Gateway API   │ ──► │     HOOKS       │ ──► │   Components    │
│  (snake_case)   │     │ (transformers)  │     │  (camelCase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

Components should **never** see raw API types. All data flows through hooks.

### 2. Type Ownership

Each hook file owns its types. Other hooks import from owners.

```
use-course.ts           → owns Course, CourseDetail, CourseStatus
use-course-module.ts    → owns CourseModule, SLT, Lesson, Assignment, Introduction
use-course-teacher.ts   → owns TeacherCourse, TeacherAssignmentCommitment
use-course-student.ts   → owns StudentCourse
use-project.ts          → owns Project, Task, TaskCommitment
```

**Rules**:
1. Import types from owner, don't duplicate.
2. Imports flow UP the hierarchy only (no circular dependencies). `use-course.ts` can import from `use-course-module.ts`, but not vice versa.

### 3. Status Pattern (source → status)

The API returns a `source` field (`"merged"`, `"chain_only"`, `"db_only"`). We transform this to semantic status values:

| API source | App status | Meaning |
|------------|------------|---------|
| `"merged"` | `"active"` | On-chain + DB, fully operational |
| `"chain_only"` | `"unregistered"` | On-chain but needs DB registration |
| `"db_only"` | `"draft"` | DB only, not yet on-chain |

For complex entities (CourseModule), we combine `source` with `module_status` to get 5-value status: `"draft"`, `"approved"`, `"pending_tx"`, `"active"`, `"unregistered"`.

### 4. Naming Conventions

| Convention | Example |
|------------|---------|
| camelCase fields | `courseId`, `moduleCode`, `sltText` |
| Flatten nested content | `title` not `content.title` |
| Use `courseId` not `courseId` | Hide Cardano implementation details |
| Semantic status names | `"active"` not `"merged"` |

### 5. Hook File Structure

Every hook file should have these sections:

```typescript
// 1. App-Level Types
export interface Course { ... }
export type CourseStatus = "draft" | "active" | "unregistered";

// 2. Transform Functions
export function transformCourse(item: ApiType): Course { ... }

// 3. Query Keys
export const courseKeys = {
  all: ["courses"] as const,
  detail: (id: string) => [...courseKeys.all, "detail", id] as const,
};

// 4. Query Hooks
export function useCourse(id: string) { ... }

// 5. Mutation Hooks
export function useUpdateCourse() { ... }
```

---

## What's Next

### Review Request: Course Hooks

The Course hooks cleanup is complete and ready for team review. Please review the following files and provide feedback on the patterns, naming conventions, and type transformations:

**Core files to review**:
- `src/hooks/api/course/use-course.ts` - Exemplary pattern
- `src/hooks/api/course/use-course-module.ts` - Type ownership (SLT, Lesson, Assignment, Introduction)
- `src/hooks/api/course/use-course-teacher.ts` - Role-based hook with status pattern

Once approved, we'll apply the same patterns to Project hooks.

---

### Next: Project Hooks Cleanup

Two project hooks need the same camelCase conversion we did for courses:

| Hook | Work Needed | Template |
|------|-------------|----------|
| `use-project-manager.ts` | camelCase types + transformers | Follow `use-course-teacher.ts` |
| `use-project-contributor.ts` | camelCase types + transformers | Follow `use-course-student.ts` |

**Estimated effort**: 2-4 hours total

**Steps**:
1. Define `ManagerProject`, `ManagerCommitment` with camelCase fields
2. Add `transformManagerProject()`, `transformManagerCommitment()` functions
3. Update hooks to return transformed types
4. Update consumer components to use camelCase fields

### Future: Missing Commitment Hooks

These hooks are needed for complete user flows but aren't urgent:

**High Priority**:
- `useCreateStudentCommitment` - Student enrollment
- `useSubmitStudentCommitment` - Assignment submission
- `useClaimCredential` - Credential claim
- `useReviewAssignment` - Teacher assessment
- `useCreateTaskCommitment` - Project task commitment

**Medium Priority**:
- `useUpdateTeachers` - Owner teacher management
- Student commitment update/leave hooks
- Contributor commitment CRUD hooks

---

## Key Documentation

| Document | Purpose |
|----------|---------|
| `SKILL.md` | Main entry point for this skill |
| `HOOKS-STATUS.md` | Current implementation status |
| `api-hooks-audit.md` | Pattern guide and checklist |
| `api-coverage.md` | Endpoint-by-endpoint coverage |
| `archive/` | Completed work plans for reference |

---

## Questions?

Reach out to James or run `/audit-api-coverage` to see current status and get guided through any fixes.
