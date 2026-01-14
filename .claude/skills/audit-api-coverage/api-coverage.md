# API Coverage Status

> **Cross-reference of all Andamio API endpoints vs T3 App Template implementation**
> Last Updated: January 11, 2026
> **Status**: ✅ Go API Migration Complete

This document tracks which API endpoints are implemented in the T3 App Template.

## Quick Reference

| API | Total | Implemented | Coverage |
|-----|-------|-------------|----------|
| [Andamio DB API](#andamio-db-api-87-endpoints) | 87 | 49 endpoints | **56%** |
| [Andamio Tx API](#andamio-tx-api-16-endpoints) | 16 | 16 definitions | **100%** |
| [Andamioscan](#andamioscan-34-endpoints) | 34 | 32 functions | **94%** |
| **TOTAL** | **137** | **97** | **71%** |

Run `node --import tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for current counts.
See [COVERAGE-REPORT.md](./COVERAGE-REPORT.md) for the latest auto-generated report.

---

## Go API Migration Status

**✅ COMPLETE** - All endpoints in the T3 App Template have been migrated to use the new Go API RESTful structure.

### Migration Summary

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Core hooks (course, module, SLT, lesson) | ✅ Complete |
| Phase 2 | Wizard step components | ✅ Complete |
| Phase 3 | Project page endpoints | ✅ Complete |
| Phase 4 | Learner component endpoints | ✅ Complete |
| Phase 5 | Misc endpoints | ✅ Complete |

---

## Andamio Tx API (16 Endpoints)

**Status**: **100% Complete**

All transaction types have definitions in `@andamio/transactions` and UI components in `src/components/transactions/`.

| Transaction | Component |
|-------------|-----------|
| `GLOBAL_ACCESS_TOKEN_MINT` | `mint-access-token.tsx` |
| `COURSE_ADMIN_CREATE` | `create-course.tsx` |
| `COURSE_ADMIN_TEACHERS_MANAGE` | `teachers-update.tsx` |
| `COURSE_TEACHER_MODULES_MANAGE` | `mint-module-tokens.tsx` |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assess-assignment.tsx` |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `enroll-in-course.tsx` |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment-update.tsx` |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential-claim.tsx` |
| `PROJECT_ADMIN_CREATE` | `create-project.tsx` |
| `PROJECT_ADMIN_MANAGERS_MANAGE` | `managers-manage.tsx` |
| `PROJECT_ADMIN_BLACKLIST_MANAGE` | `blacklist-manage.tsx` |
| `PROJECT_MANAGER_TASKS_MANAGE` | `tasks-manage.tsx` |
| `PROJECT_MANAGER_TASKS_ASSESS` | `tasks-assess.tsx` |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task-commit.tsx` |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task-action.tsx` |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project-credential-claim.tsx` |

---

## Andamioscan (34 Endpoints)

**Status**: **94% Complete** (32/34)

Implementation in `src/lib/andamioscan.ts`. Hooks in `src/hooks/use-andamioscan.ts`.

### Implemented (32)

**Core Data Endpoints (17)**

| Endpoint | Function |
|----------|----------|
| `/api/v2/courses` | `getAllCourses()` |
| `/api/v2/courses/{id}/details` | `getCourse(id)` |
| `/api/v2/courses/{id}/students/{alias}/status` | `getCourseStudent(id, alias)` |
| `/api/v2/courses/teachers/{alias}/assessments/pending` | `getPendingAssessments(alias)` |
| `/api/v2/projects` | `getAllProjects()` |
| `/api/v2/projects/{id}/details` | `getProject(id)` |
| `/api/v2/projects/{id}/contributors/{alias}/status` | `getProjectContributorStatus(id, alias)` |
| `/api/v2/projects/managers/{alias}/assessments/pending` | `getManagerPendingAssessments(alias)` |
| `/api/v2/users/{alias}/state` | `getUserGlobalState(alias)` |
| `/api/v2/users/{alias}/courses/teaching` | `getCoursesOwnedByAlias(alias)` |
| `/api/v2/users/{alias}/courses/enrolled` | `getEnrolledCourses(alias)` |
| `/api/v2/users/{alias}/courses/completed` | `getCompletedCourses(alias)` |
| `/api/v2/users/{alias}/courses/owned` | `getOwnedCourses(alias)` |
| `/api/v2/users/{alias}/projects/contributing` | `getContributingProjects(alias)` |
| `/api/v2/users/{alias}/projects/managing` | `getManagingProjects(alias)` |
| `/api/v2/users/{alias}/projects/owned` | `getOwnedProjects(alias)` |
| `/api/v2/users/{alias}/projects/completed` | `getCompletedProjects(alias)` |

**Event Confirmation Endpoints (15)** - Used via polling patterns

| Endpoint | Transaction Type |
|----------|------------------|
| `/api/v2/events/access-tokens/mint/{tx_hash}` | GLOBAL_ACCESS_TOKEN_MINT |
| `/api/v2/events/courses/create/{tx_hash}` | COURSE_ADMIN_CREATE |
| `/api/v2/events/teachers/update/{tx_hash}` | COURSE_ADMIN_TEACHERS_MANAGE |
| `/api/v2/events/modules/manage/{tx_hash}` | COURSE_TEACHER_MODULES_MANAGE |
| `/api/v2/events/enrollments/enroll/{tx_hash}` | COURSE_STUDENT_ASSIGNMENT_COMMIT |
| `/api/v2/events/assignments/submit/{tx_hash}` | COURSE_STUDENT_ASSIGNMENT_UPDATE |
| `/api/v2/events/assessments/assess/{tx_hash}` | COURSE_TEACHER_ASSIGNMENTS_ASSESS |
| `/api/v2/events/credential-claims/claim/{tx_hash}` | COURSE_STUDENT_CREDENTIAL_CLAIM |
| `/api/v2/events/projects/create/{tx_hash}` | PROJECT_ADMIN_CREATE |
| `/api/v2/events/projects/join/{tx_hash}` | PROJECT_CONTRIBUTOR_TASK_COMMIT |
| `/api/v2/events/tasks/manage/{tx_hash}` | PROJECT_MANAGER_TASKS_MANAGE |
| `/api/v2/events/tasks/submit/{tx_hash}` | PROJECT_CONTRIBUTOR_TASK_ACTION |
| `/api/v2/events/tasks/assess/{tx_hash}` | PROJECT_MANAGER_TASKS_ASSESS |
| `/api/v2/events/credential-claims/project/{tx_hash}` | PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM |
| `/api/v2/events/treasury/fund/{tx_hash}` | Treasury funding |

### Not Implemented (2)

| Endpoint | Description |
|----------|-------------|
| `/api/v2/transactions` | Paginated transaction list |
| `/health` | Health check endpoint |

Note: All 15 event endpoints are now considered implemented via the `src/lib/andamioscan.ts` client polling patterns.

---

## Andamio DB API (87 Endpoints)

**Status**: **56% Implemented** (49/87)

The Go API uses **role-based routing**:

```
/{system}/{role}/{resource}/{action}
```

**Systems**: `auth`, `user`, `course`, `project`
**Roles**: `public`, `owner`, `teacher`, `student`, `shared`, `manager`, `contributor`

---

## Coverage Summary

| Category | Total Endpoints | Implemented | Status |
|----------|-----------------|-------------|--------|
| Health & Authentication | 3 | 2 | ✅ Mostly Complete |
| User Management | 4 | 3 | ✅ Migrated |
| Course Public | 11 | 8 | ✅ Migrated |
| Course Owner | 7 | 5 | ✅ Migrated |
| Course Teacher | 22 | 14 | ✅ Migrated |
| Course Student | 6 | 4 | ✅ Migrated |
| Course Shared | 3 | 2 | ✅ Migrated |
| Project Public | 3 | 2 | ✅ Migrated |
| Project Owner | 4 | 3 | ✅ Migrated |
| Project Manager | 7 | 4 | ✅ Migrated |
| Project Contributor | 6 | 2 | ⚠️ Partial |
| Project Shared | 1 | 0 | ⏳ Not Started |
| **TOTAL** | **88** | **50** | **57%** |

*Run the automated coverage script for precise, up-to-date counts.*

---

## Endpoint Implementation Status

### Authentication ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/auth/login/session` | POST | `andamio-auth.ts` | ✅ |
| `/auth/login/validate` | POST | `andamio-auth.ts` | ✅ |

### User Management ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/user/access-token-alias` | POST | `andamio-auth-context.tsx` | ✅ |
| `/user/unconfirmed-tx` | GET/POST | `use-andamio-transaction.ts` | ✅ |
| `/user/init-roles` | POST | `andamio-auth-context.tsx` | ✅ |
| `/user/pending-transactions` | GET | `use-pending-transactions.ts` | ✅ |

### Course Public ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/course/public/courses/list` | GET | `use-course.ts` | ✅ |
| `/course/public/course/get/{id}` | GET | `use-course.ts` | ✅ |
| `/course/public/course/check/{code}` | GET | - | ⏳ |
| `/course/public/course-modules/list/{id}` | GET | `use-course-module.ts` | ✅ |
| `/course/public/course-module/get/{id}/{code}` | GET | `use-course-module.ts` | ✅ |
| `/course/public/course-modules/assignment-summary/{id}` | GET | - | ⏳ |
| `/course/public/slts/list/{id}/{code}` | GET | `use-slt.ts` | ✅ |
| `/course/public/slt/get/{id}/{code}/{index}` | GET | - | ⏳ |
| `/course/public/lessons/list/{id}/{code}` | GET | `use-lesson.ts` | ✅ |
| `/course/public/lesson/get/{id}/{code}/{index}` | GET | `use-lesson.ts` | ✅ |
| `/course/public/assignment/get/{id}/{code}` | GET | `use-module-wizard-data.ts` | ✅ |
| `/course/public/introduction/get/{id}/{code}` | GET | `use-module-wizard-data.ts` | ✅ |
| `/course/public/assignment-commitment/has-commitments/{id}/{code}` | GET | - | ⏳ |

### Course Owner ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/course/owner/courses/list` | POST | `use-course.ts`, `use-owned-courses.ts` | ✅ |
| `/course/owner/course/create` | POST | - | ⏳ |
| `/course/owner/course/update` | POST | `use-course.ts` | ✅ |
| `/course/owner/course/delete` | POST | `use-course.ts` | ✅ |
| `/course/owner/course/mint` | POST | `on-chain-courses-section.tsx` | ✅ |
| `/course/owner/course/confirm-mint` | POST | - | ⏳ |
| `/course/owner/course/sync-teachers` | POST | `course-teachers-card.tsx` | ✅ |

### Course Teacher ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/course/teacher/course-modules/list` | POST | `use-course-module.ts` | ✅ |
| `/course/teacher/course-module/create` | POST | `use-course-module.ts` | ✅ |
| `/course/teacher/course-module/update` | POST | `use-course-module.ts` | ✅ |
| `/course/teacher/course-module/delete` | POST | - | ⏳ |
| `/course/teacher/course-module/update-status` | POST | `use-course-module.ts` | ✅ |
| `/course/teacher/course-module/update-code` | POST | - | ⏳ |
| `/course/teacher/course-module/publish` | POST | - | ⏳ |
| `/course/teacher/course-module/set-pending-tx` | POST | - | ⏳ |
| `/course/teacher/course-module/confirm-tx` | POST | `use-pending-tx-watcher.ts` | ✅ |
| `/course/teacher/course-modules/batch-update-status` | POST | - | ⏳ |
| `/course/teacher/course-modules/batch-confirm` | POST | - | ⏳ |
| `/course/teacher/slt/create` | POST | `use-slt.ts` | ✅ |
| `/course/teacher/slt/update` | POST | `use-slt.ts` | ✅ |
| `/course/teacher/slt/update-index` | POST | - | ⏳ |
| `/course/teacher/slt/delete` | POST | `use-slt.ts` | ✅ |
| `/course/teacher/slts/batch-update-indexes` | POST | `step-slts.tsx` | ✅ |
| `/course/teacher/lesson/create` | POST | `use-lesson.ts` | ✅ |
| `/course/teacher/lesson/update` | POST | `step-lessons.tsx` | ✅ |
| `/course/teacher/lesson/publish` | POST | - | ⏳ |
| `/course/teacher/lesson/delete` | POST | - | ⏳ |
| `/course/teacher/assignment/create` | POST | `step-assignment.tsx` | ✅ |
| `/course/teacher/assignment/update` | POST | `step-assignment.tsx` | ✅ |
| `/course/teacher/assignment/publish` | POST | - | ⏳ |
| `/course/teacher/assignment/delete` | POST | - | ⏳ |
| `/course/teacher/introduction/create` | POST | `step-introduction.tsx` | ✅ |
| `/course/teacher/introduction/update` | POST | `step-introduction.tsx` | ✅ |
| `/course/teacher/introduction/publish` | POST | - | ⏳ |
| `/course/teacher/introduction/delete` | POST | - | ⏳ |
| `/course/teacher/assignment-commitments/list-by-course` | POST | `instructor/page.tsx` | ✅ |
| `/course/teacher/assignment-commitment/review` | POST | - | ⏳ |

### Course Student ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/course/student/courses` | POST | `my-learning.tsx` | ✅ |
| `/course/student/course-status` | POST | `user-course-status.tsx` | ✅ |
| `/course/student/assignment-commitments/list-by-course` | POST | `assignment-commitment.tsx` | ✅ |
| `/course/student/assignment-commitment/create` | POST | - | ⏳ |
| `/course/student/assignment-commitment/update-evidence` | POST | `assignment-commitment.tsx` | ✅ |
| `/course/student/assignment-commitment/delete` | POST | `assignment-commitment.tsx` | ✅ |

### Course Shared ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/course/shared/assignment-commitment/get` | POST | - | ⏳ |
| `/course/shared/assignment-commitment/update-status` | POST | `use-pending-tx-watcher.ts` | ✅ |
| `/course/shared/assignment-commitment/confirm-transaction` | POST | - | ⏳ |

### Project Public ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/project/public/treasury/list` | POST | `project/page.tsx` | ✅ |
| `/project/public/tasks/list/{id}` | GET | `[treasurynft]/page.tsx` | ✅ |
| `/project/public/prerequisite/list` | GET | - | ⏳ |

### Project Owner ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/project/owner/treasury/list-owned` | POST | `studio/project/page.tsx` | ✅ |
| `/project/owner/treasury/update` | POST | `[treasurynft]/page.tsx` | ✅ |
| `/project/owner/treasury/mint` | POST | - | ⏳ |
| `/project/owner/treasury/confirm-mint` | POST | - | ⏳ |
| `/project/owner/task/delete` | POST | `draft-tasks/page.tsx` | ✅ |

### Project Manager ✅

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/project/manager/task/create` | POST | `draft-tasks/new/page.tsx` | ✅ |
| `/project/manager/task/update` | POST | `[taskindex]/page.tsx` | ✅ |
| `/project/manager/task/delete` | POST | - | ⏳ |
| `/project/manager/task/batch-update-status` | POST | - | ⏳ |
| `/project/manager/task/batch-confirm` | POST | - | ⏳ |
| `/project/manager/commitment/update-status` | POST | - | ⏳ |
| `/project/manager/commitment/confirm-transaction` | POST | - | ⏳ |

### Project Contributor ⚠️

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/project/contributor/commitment/get` | POST | `[taskhash]/page.tsx` | ✅ |
| `/project/contributor/commitment/create` | POST | - | ⏳ |
| `/project/contributor/commitment/update-evidence` | POST | - | ⏳ |
| `/project/contributor/commitment/update-status` | POST | - | ⏳ |
| `/project/contributor/commitment/delete` | POST | - | ⏳ |
| `/project/contributor/commitment/confirm-transaction` | POST | - | ⏳ |

### Project Shared ⏳

| Endpoint | Method | Hook/File | Status |
|----------|--------|-----------|--------|
| `/project/shared/contributor/create` | POST | - | ⏳ |

---

## Hook Reference

### Implemented Hooks (Updated for Go API)

| Hook | Endpoints Used |
|------|----------------|
| `useCourse` | `/course/public/course/get/{id}` |
| `usePublishedCourses` | `/course/public/courses/list` |
| `useOwnedCoursesQuery` | `/course/owner/courses/list` |
| `useUpdateCourse` | `/course/owner/course/update` |
| `useDeleteCourse` | `/course/owner/course/delete` |
| `useCourseModules` | `/course/public/course-modules/list/{id}` |
| `useCourseModule` | `/course/public/course-module/get/{id}/{code}` |
| `useCourseModuleMap` | `/course/teacher/course-modules/list` |
| `useCreateCourseModule` | `/course/teacher/course-module/create` |
| `useUpdateCourseModule` | `/course/teacher/course-module/update` |
| `useUpdateCourseModuleStatus` | `/course/teacher/course-module/update-status` |
| `useSLTs` | `/course/public/slts/list/{id}/{code}` |
| `useCreateSLT` | `/course/teacher/slt/create` |
| `useUpdateSLT` | `/course/teacher/slt/update` |
| `useDeleteSLT` | `/course/teacher/slt/delete` |
| `useLessons` | `/course/public/lessons/list/{id}/{code}` |
| `useLesson` | `/course/public/lesson/get/{id}/{code}/{index}` |
| `useCreateLesson` | `/course/teacher/lesson/create` |
| `usePendingTransactions` | `/user/pending-transactions` |

---

## Related Documentation

- [SKILL.md](./SKILL.md) - Skill instructions and workflow
- [db-api-endpoints.md](./db-api-endpoints.md) - DB API endpoint reference
- [tx-api-endpoints.md](./tx-api-endpoints.md) - TX API endpoint reference
- [andamioscan-endpoints.md](./andamioscan-endpoints.md) - Andamioscan endpoint reference
- [COVERAGE-REPORT.md](./COVERAGE-REPORT.md) - Auto-generated coverage report

---

**Last Updated**: January 14, 2026
**Migration Status**: ✅ Complete
**Maintained By**: Andamio Platform Team
