# API Coverage Report

> **Generated**: January 10, 2026
> **Total Endpoints**: 125 across 3 APIs

## Executive Summary

| API | Total Endpoints | Implemented | Coverage | Priority |
|-----|-----------------|-------------|----------|----------|
| **Andamio DB API** | 73 | 18 hooks | **25%** | High |
| **Andamio Tx API** | 16 | 16 definitions | **100%** | Complete |
| **Andamioscan** | 36 | 21 functions | **58%** | Medium |

**Overall**: 55 implementations for 125 endpoints = **44% coverage**

---

## Andamio DB API Coverage (25%)

### Implemented Hooks (18)

| Hook | Endpoint | Category |
|------|----------|----------|
| `useCourse` | `GET /course/public/course/get/{policy_id}` | Course Public |
| `usePublishedCourses` | `GET /course/public/courses/list` | Course Public |
| `useOwnedCoursesQuery` | `POST /course/owner/courses/list` | Course Owner |
| `useUpdateCourse` | `POST /course/owner/course/update` | Course Owner |
| `useDeleteCourse` | `POST /course/owner/course/delete` | Course Owner |
| `useCourseModules` | `GET /course/public/course-modules/list/{policy_id}` | Modules |
| `useCourseModule` | `GET /course/public/course-module/get/{policy_id}/{module_code}` | Modules |
| `useCourseModuleMap` | `POST /course/teacher/course-modules/list` | Modules |
| `useCreateCourseModule` | `POST /course/teacher/course-module/create` | Modules |
| `useUpdateCourseModule` | `POST /course/teacher/course-module/update` | Modules |
| `useUpdateCourseModuleStatus` | `POST /course/teacher/course-module/update-status` | Modules |
| `useSLTs` | `GET /course/public/slts/list/{policy_id}/{module_code}` | SLTs |
| `useCreateSLT` | `POST /course/teacher/slt/create` | SLTs |
| `useUpdateSLT` | `POST /course/teacher/slt/update` | SLTs |
| `useDeleteSLT` | `POST /course/teacher/slt/delete` | SLTs |
| `useLessons` | `GET /course/public/lessons/list/{policy_id}/{module_code}` | Lessons |
| `useLesson` | `GET /course/public/lesson/get/{policy_id}/{module_code}/{index}` | Lessons |
| `useCreateLesson` | `POST /course/teacher/lesson/create` | Lessons |

### Missing DB API Hooks by Priority

**HIGH - Core Course Functionality**
- `POST /course/owner/course/create` - Create course
- `POST /course/owner/course/mint` - Mint course
- `POST /course/owner/course/confirm-mint` - Confirm mint
- `POST /course/teacher/course-module/publish` - Publish module
- `POST /course/teacher/course-module/confirm-tx` - Confirm module tx

**HIGH - Assignment System**
- `GET /course/public/assignment/get/{policy_id}/{module_code}` - Get assignment
- `POST /course/teacher/assignment/create` - Create assignment
- `POST /course/teacher/assignment/update` - Update assignment
- `POST /course/student/assignment-commitment/create` - Create commitment
- `POST /course/student/assignment-commitment/update-evidence` - Update evidence
- `POST /course/teacher/assignment-commitment/review` - Review assignment
- `POST /course/teacher/assignment-commitments/list-by-course` - List commitments

**MEDIUM - User & Auth**
- `POST /user/access-token-alias` - Update alias
- `GET /user/pending-transactions` - Pending txs
- `POST /user/init-roles` - Init roles

**MEDIUM - Introductions**
- `GET /course/public/introduction/get/{policy_id}/{module_code}` - Get intro
- `POST /course/teacher/introduction/create` - Create intro
- `POST /course/teacher/introduction/update` - Update intro

**LOW - Project System** (13 endpoints)
- All project endpoints need hooks when Project System is prioritized

---

## Andamio Tx API Coverage (100%)

All 16 transaction types have definitions in `@andamio/transactions`:

| Transaction Definition | Endpoint | Component |
|-----------------------|----------|-----------|
| `GLOBAL_ACCESS_TOKEN_MINT` | `/v2/tx/global/general/access-token/mint` | `mint-access-token.tsx` |
| `COURSE_ADMIN_CREATE` | `/v2/tx/instance/owner/course/create` | `create-course.tsx` |
| `COURSE_ADMIN_TEACHERS_MANAGE` | `/v2/tx/course/owner/teachers/manage` | `teachers-update.tsx` |
| `COURSE_TEACHER_MODULES_MANAGE` | `/v2/tx/course/teacher/modules/manage` | `mint-module-tokens.tsx` |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `/v2/tx/course/teacher/assignments/assess` | `assess-assignment.tsx` |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `/v2/tx/course/student/assignment/commit` | `enroll-in-course.tsx` |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `/v2/tx/course/student/assignment/update` | `assignment-update.tsx` |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `/v2/tx/course/student/credential/claim` | `credential-claim.tsx` |
| `PROJECT_ADMIN_CREATE` | `/v2/tx/instance/owner/project/create` | `create-project.tsx` |
| `PROJECT_ADMIN_MANAGERS_MANAGE` | `/v2/tx/project/owner/managers/manage` | `managers-manage.tsx` |
| `PROJECT_ADMIN_BLACKLIST_MANAGE` | `/v2/tx/project/owner/contributor-blacklist/manage` | `blacklist-manage.tsx` |
| `PROJECT_MANAGER_TASKS_MANAGE` | `/v2/tx/project/manager/tasks/manage` | `tasks-manage.tsx` |
| `PROJECT_MANAGER_TASKS_ASSESS` | `/v2/tx/project/manager/tasks/assess` | `tasks-assess.tsx` |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `/v2/tx/project/contributor/task/commit` | `task-commit.tsx` |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `/v2/tx/project/contributor/task/action` | `task-action.tsx` |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `/v2/tx/project/contributor/credential/claim` | `project-credential-claim.tsx` |

**Status**: Complete - All transactions have definitions and UI components

---

## Andamioscan Coverage (58%)

### Implemented Functions (21)

| Function | Endpoint | Used In |
|----------|----------|---------|
| `getAllCourses` | `/api/v2/courses` | Course catalog |
| `getCourse` | `/api/v2/courses/{id}/details` | Course detail, studio |
| `getCourseStudents` | (via getCourse) | Instructor page |
| `getCourseStudent` | `/api/v2/courses/{id}/students/{alias}/status` | Student progress |
| `getUserGlobalState` | `/api/v2/users/{alias}/state` | Dashboard |
| `isUserEnrolled` | (via getUserGlobalState) | Enrollment check |
| `getUserCredentials` | (via getUserGlobalState) | Credentials page |
| `isModuleOnChain` | (via getCourse) | Module status |
| `getCoursesOwnedByAlias` | `/api/v2/users/{alias}/courses/teaching` | Studio |
| `getEnrolledCourses` | `/api/v2/users/{alias}/courses/enrolled` | My Learning |
| `getCompletedCourses` | `/api/v2/users/{alias}/courses/completed` | My Learning |
| `getOwnedCourses` | `/api/v2/users/{alias}/courses/owned` | Studio |
| `getCoursesOwnedByAliasWithDetails` | (composite) | Studio |
| `getPendingAssessments` | `/api/v2/courses/teachers/{alias}/assessments/pending` | Instructor |
| `getAllProjects` | `/api/v2/projects` | Projects list |
| `getProject` | `/api/v2/projects/{id}/details` | Project detail |
| `getContributingProjects` | `/api/v2/users/{alias}/projects/contributing` | Dashboard |
| `getManagingProjects` | `/api/v2/users/{alias}/projects/managing` | Dashboard |
| `getOwnedProjects` | `/api/v2/users/{alias}/projects/owned` | Studio |
| `getCompletedProjects` | `/api/v2/users/{alias}/projects/completed` | Dashboard |
| `getProjectContributorStatus` | `/api/v2/projects/{id}/contributors/{alias}/status` | Contributor |
| `getManagerPendingAssessments` | `/api/v2/projects/managers/{alias}/assessments/pending` | Manager |

### Missing Andamioscan Functions

**HIGH - Event Endpoints (16 endpoints)**
These replace Koios polling for transaction confirmation:

| Event Endpoint | Transaction Type |
|----------------|------------------|
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
| `/api/v2/events/treasury/fund/{tx_hash}` | (not implemented) |

**MEDIUM - Transactions List**
- `/api/v2/transactions` - Paginated transaction history

---

## Recommendations

### Priority 1: DB API Hooks for Course System

Create React Query hooks for the assignment workflow:
1. `useAssignment` - Get assignment content
2. `useCreateAssignment` / `useUpdateAssignment` - Teacher operations
3. `useAssignmentCommitments` - Teacher list view
4. `useCreateCommitment` / `useUpdateCommitmentEvidence` - Student operations
5. `useIntroduction` - Module introductions

### Priority 2: Event Endpoint Integration

Replace Koios polling with Andamioscan event endpoints:
1. Add event client functions to `src/lib/andamioscan.ts`
2. Update transaction confirmation logic in `use-andamio-transaction.ts`
3. Remove Koios dependency for transaction confirmation

### Priority 3: Cache Invalidation Audit

Verify React Query invalidation after mutations:
- `useUpdateCourse` should invalidate `courseKeys.detail(id)`
- `useUpdateCourseModule` should invalidate `courseModuleKeys.list(courseId)`
- Transaction components should invalidate related queries on success

### Priority 4: Project System Hooks

When Project System is prioritized, create hooks for:
- Treasury management (4 endpoints)
- Task management (5 endpoints)
- Commitment management (8 endpoints)

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total API Endpoints | 125 |
| Total Implementations | 55 |
| Overall Coverage | 44% |
| DB API Coverage | 25% (18/73) |
| Tx API Coverage | 100% (16/16) |
| Andamioscan Coverage | 58% (21/36) |
| Event Endpoints Implemented | 0/16 |

---

*Generated by audit-api-coverage skill*
