# API Hooks Implementation Status

> **Last Updated**: January 26, 2026
> **Summary**: Course hooks COMPLETE, Project hooks need camelCase conversion

This document summarizes the current status of API hooks as the interface layer between the Andamio Gateway API and the app.

---

## Overview

The app uses React Query hooks as the primary interface with the Andamio API. Hooks serve as a transformation layer that:

1. **Fetches data** from the gateway API (snake_case responses)
2. **Transforms** to app-level types (camelCase)
3. **Caches** for performance and deduplication
4. **Provides mutations** with automatic cache invalidation

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Gateway API   │ ──► │     HOOKS       │ ──► │   Components    │
│  (snake_case)   │     │ (transformers)  │     │  (camelCase)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Course Hooks: COMPLETE

All 10 course-related hook files follow the exemplary pattern established by `use-course.ts`.

| File | Types | Transformer | Keys | Status |
|------|-------|-------------|------|--------|
| `use-course.ts` | Course, CourseDetail, CourseStatus | transformCourse, transformCourseDetail | courseKeys | APPROVED |
| `use-course-owner.ts` | (imports from use-course) | (imports from use-course) | courseOwnerKeys | APPROVED |
| `use-course-teacher.ts` | TeacherCourse, TeacherAssignmentCommitment, TeacherCourseStatus | transformTeacherCourse, transformTeacherCommitment | courseTeacherKeys | COMPLETE |
| `use-course-student.ts` | StudentCourse | transformStudentCourse | courseStudentKeys | COMPLETE |
| `use-course-module.ts` | CourseModule, CourseModuleStatus, SLT, Lesson, Assignment, Introduction | transformCourseModule, transformSLT, transformLesson, transformAssignment, transformIntroduction | courseModuleKeys | COMPLETE |
| `use-slt.ts` | (imports from use-course-module) | (imports from use-course-module) | sltKeys | COMPLETE |
| `use-lesson.ts` | (imports from use-course-module) | (imports from use-course-module) | lessonKeys | COMPLETE |
| `use-assignment.ts` | (imports from use-course-module) | (imports from use-course-module) | assignmentKeys | COMPLETE |
| `use-introduction.ts` | (imports from use-course-module) | (imports from use-course-module) | introductionKeys | COMPLETE |
| `use-module-wizard-data.ts` | ModuleWizardData | - | - | COMPLETE (composite hook) |

### What "COMPLETE" Means

- App-level types with camelCase fields
- Transform functions that convert API → App types
- Query keys for cache management
- Hooks return transformed types (not raw API types)
- Cache invalidation on mutations
- `courseId` used consistently (not `courseNftPolicyId`)
- Source→Status semantic conversion (e.g., API `source: "merged"` → App `status: "active"`)

### Type Ownership

Types are colocated with their owner hook:

| Owner File | Types Owned |
|------------|-------------|
| `use-course.ts` | Course, CourseDetail, CourseStatus |
| `use-course-module.ts` | CourseModule, CourseModuleStatus, SLT, Lesson, Assignment, Introduction |
| `use-course-teacher.ts` | TeacherCourse, TeacherCourseStatus, TeacherAssignmentCommitment |
| `use-course-student.ts` | StudentCourse |

Other hooks import from owners (no circular dependencies).

---

## Project Hooks: IN PROGRESS

2 of 3 project hook files need the camelCase type conversion.

| File | Types | Transformer | Keys | Status |
|------|-------|-------------|------|--------|
| `use-project.ts` | Project, Task, TaskCommitment | transformProjectDetail, transformMergedTask | projectKeys | EXEMPLARY |
| `use-project-manager.ts` | ManagerProject, ManagerCommitment (snake_case) | Inline only | projectManagerKeys | NEEDS WORK |
| `use-project-contributor.ts` | ContributorProject (snake_case) | None | projectContributorKeys | NEEDS WORK |

### Work Needed for Project Hooks

**`use-project-manager.ts`:**
- Convert `ManagerProject` fields to camelCase
- Convert `ManagerCommitment` fields to camelCase
- Add `transformManagerProject()` function
- Add `transformManagerCommitment()` function
- Export transformers

**`use-project-contributor.ts`:**
- Convert `ContributorProject` fields to camelCase
- Add `transformContributorProject()` function
- Export transformer

### Readiness for Implementation

| Criteria | Status |
|----------|--------|
| Pattern established (`use-project.ts`) | Ready |
| Types defined in generated types | Ready |
| API endpoints documented | Ready |
| Consumer components identified | Needs audit |

**Estimated effort**: Medium (2-4 hours) - follow `use-course-teacher.ts` as template.

---

## Transaction Hooks: COMPLETE

All transaction types have consistent entries across config files.

| Category | TransactionTypes | Status |
|----------|------------------|--------|
| Global | 1 (access token mint) | COMPLETE |
| Instance | 2 (course/project create) | COMPLETE |
| Course | 6 | COMPLETE |
| Project | 8 | COMPLETE |

See [tx-hooks-audit.md](./tx-hooks-audit.md) for the full TX consistency matrix.

---

## API Coverage Summary

| Category | Total Endpoints | Hooked | Coverage |
|----------|-----------------|--------|----------|
| Authentication | 6 | 6 | **100%** |
| API Key | 6 | 6 | **100%** |
| Courses | 41 | ~28 | **~68%** |
| Projects | 17 | ~14 | **~82%** |
| TX: All | 21 | 21 | **100%** |
| Admin | 4 | 0 | **0%** |
| User Mgmt | 4 | 1 | **25%** |

**Overall**: ~67% of endpoints have hooks (higher for commonly-used endpoints).

See [api-coverage.md](./api-coverage.md) for endpoint-by-endpoint status.

---

## Next Steps

### Immediate (Project Hooks Cleanup)

1. Apply camelCase type conversion to `use-project-manager.ts`
2. Apply camelCase type conversion to `use-project-contributor.ts`
3. Update consumer components to use camelCase fields

### Future (Missing Hooks)

**High Priority** (needed for complete user flows):
- `useCreateStudentCommitment` - Student enrollment
- `useSubmitStudentCommitment` - Assignment submission
- `useClaimCredential` - Credential claim
- `useReviewAssignment` - Teacher assessment
- `useCreateTaskCommitment` - Project task commitment

See [api-coverage.md](./api-coverage.md) for the full list of unhooked endpoints.

---

## Archived Work Plans

Completed work plans are preserved in [archive/](./archive/) for team reference:

| File | Content |
|------|---------|
| `API-HOOKS-CLEANUP-PLAN.md` | Detailed task tracking for the Course hooks cleanup (January 2026) |
| `HOOK-ORGANIZATION-PLAN.md` | Two-tier hybrid organization strategy (approved and implemented) |

---

**Last Updated**: January 26, 2026
