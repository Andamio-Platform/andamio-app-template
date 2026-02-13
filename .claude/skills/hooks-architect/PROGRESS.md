# Hook Implementation Status

> **Last Updated**: February 13, 2026

## Summary

All hooks now follow the colocated types pattern.

| Domain | Hooks | Status |
|--------|-------|--------|
| Course | 8 files | ✅ Complete |
| Project | 4 files | ✅ Complete |

---

## Course Hooks (8 files)

| Hook | Types | Status |
|------|-------|--------|
| `use-course.ts` | `Course`, `CourseDetail` | ✅ |
| `use-course-owner.ts` | (imports from use-course) | ✅ |
| `use-course-module.ts` | `CourseModule`, `SLT`, `Lesson`, `Assignment`, `Introduction` | ✅ |
| `use-course-content.ts` | Public queries | ✅ |
| `use-course-student.ts` | `StudentCourse` | ✅ |
| `use-course-teacher.ts` | `TeacherCourse`, `TeacherAssignmentCommitment` | ✅ |
| `use-module-wizard-data.ts` | Composition hook | ✅ |
| `use-save-module-draft.ts` | Aggregate mutation | ✅ |

---

## Project Hooks (4 files)

| Hook | Types | Status |
|------|-------|--------|
| `use-project.ts` | `Project`, `ProjectDetail`, `Task`, `TaskCommitment` | ✅ |
| `use-project-owner.ts` | (imports from use-project) | ✅ |
| `use-project-manager.ts` | `ManagerProject`, `ManagerCommitment`, `PendingAssessment` | ✅ |
| `use-project-contributor.ts` | `ContributorProject`, `ContributorCommitment` | ✅ |

---

## Pattern Summary

All hooks follow these rules:

1. **App-level types** defined in hook files (camelCase)
2. **Transform functions** convert API snake_case → app camelCase
3. **Query keys** exported as `entityKeys` objects
4. Components import types from hooks, never from `~/types/generated`
