# API Coverage Status

> **Unified API Gateway Coverage for T3 App Template**
> **Base URL**: `https://dev.api.andamio.io`
> Last Updated: January 26, 2026

This document tracks which API endpoints are implemented in the T3 App Template.

## Quick Reference

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| [Authentication](#authentication) | 6 | 6 | **100%** |
| [User Management](#user-management) | 4 | 1 | **25%** |
| [API Key Management](#api-key-management) | 6 | 6 | **100%** |
| [Admin Functions](#admin-functions) | 4 | 0 | **0%** |
| [Courses](#courses) | 41 | ~28 | **~68%** |
| [Projects](#projects) | 17 | ~14 | **~82%** |
| [TX: Courses](#tx-course-operations) | 6 | 6 | **100%** |
| [TX: Projects](#tx-project-operations) | 8 | 8 | **100%** |
| [TX: Instance/Global](#tx-instanceglobal-operations) | 7 | 6 | **86%** |
| **TOTAL** | **~99** | **~70** | **~71%** |

---

## Architecture Overview

All API calls flow through a single gateway proxy:

```
Browser → /api/gateway/[...path] → Unified Gateway → Response
                ↓
        Adds X-API-Key header
        Caches GET requests (30s)
```

**Key Files**:
- `src/app/api/gateway/[...path]/route.ts` - Unified proxy
- `src/lib/gateway.ts` - Gateway client utilities
- `src/lib/andamio-auth.ts` - Authentication flow
- `src/hooks/api/course/*.ts` - Course React Query hooks
- `src/hooks/api/project/*.ts` - Project React Query hooks

---

## Authentication

**Status**: **COMPLETE** (all auth endpoints implemented)

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/v2/auth/login/session` | POST | `andamio-auth.ts` → `createLoginSession()` | DONE |
| `/v2/auth/login/validate` | POST | `andamio-auth.ts` → `validateSignature()` | DONE |
| `/v2/auth/developer/account/login` | POST | `andamio-auth.ts` → `loginWithGateway()` | DONE |
| `/v2/auth/developer/register/session` | POST | `andamio-auth.ts` → `createDevRegisterSession()` | DONE |
| `/v2/auth/developer/register/complete` | POST | `andamio-auth.ts` → `completeDevRegistration()` | DONE |

---

## User Management

**Status**: **Partial** (25%)

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `GET /v1/user/me` | GET | - | TODO |
| `POST /v1/user/delete` | POST | - | TODO |
| `GET /v1/user/usage` | GET | - | TODO |
| `POST /v1/user/usage/daily` | POST | - | TODO |
| `POST /v2/user/access-token-alias` | POST | used in login flow | DONE |

---

## API Key Management

**Status**: **COMPLETE** - All v2 API key endpoints implemented

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `POST /v2/apikey/developer/key/request` | POST | `andamio-auth.ts` → `requestApiKey()` | DONE |
| `POST /v2/apikey/developer/key/rotate` | POST | `andamio-auth.ts` → `rotateApiKey()` | DONE |
| `POST /v2/apikey/developer/key/delete` | POST | `andamio-auth.ts` → `deleteApiKey()` | DONE |
| `GET /v2/apikey/developer/profile/get` | GET | `andamio-auth.ts` → `getDeveloperProfile()` | DONE |
| `GET /v2/apikey/developer/usage/get` | GET | `andamio-auth.ts` → `getDeveloperUsage()` | DONE |
| `POST /v2/apikey/developer/account/delete` | POST | `andamio-auth.ts` → `deleteDeveloperAccount()` | DONE |

---

## Admin Functions

**Status**: **Not Implemented** - Admin panel not built

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `POST /v1/admin/set-user-role` | POST | - | TODO |
| `POST /v1/admin/usage/user-api-usage` | POST | - | TODO |
| `POST /v1/admin/usage/any-user-daily-api-usage` | POST | - | TODO |
| `GET /v2/admin/tx/stats` | GET | - | TODO |

---

## Courses

**Status**: **Partial** (~68%) - Core CRUD and module management complete

### Owner Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/course/owner/courses/list` | POST | `useOwnerCourses()` | DONE |
| `POST /v2/course/owner/course/create` | POST | `useCreateCourse()` | DONE |
| `POST /v2/course/owner/course/register` | POST | `useRegisterCourse()` | DONE |
| `POST /v2/course/owner/course/update` | POST | `useUpdateCourse()` | DONE |
| `POST /v2/course/owner/teacher/add` | POST | - (DEPRECATED) | SKIP |
| `POST /v2/course/owner/teacher/remove` | POST | - (DEPRECATED) | SKIP |
| `POST /v2/course/owner/teachers/update` | POST | - | TODO |

### Teacher Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/course/teacher/courses/list` | POST | `useTeacherCourses()` | DONE |
| `POST /v2/course/teacher/course-modules/list` | POST | `useTeacherCourseModules()` | DONE |
| `POST /v2/course/teacher/course-module/create` | POST | `useCreateCourseModule()` | DONE |
| `POST /v2/course/teacher/course-module/register` | POST | `useRegisterCourseModule()` | DONE |
| `POST /v2/course/teacher/course-module/update` | POST | `useUpdateCourseModule()` | DONE |
| `POST /v2/course/teacher/course-module/delete` | POST | `useDeleteCourseModule()` | DONE |
| `POST /v2/course/teacher/course-module/publish` | POST | - | TODO |
| `POST /v2/course/teacher/slt/create` | POST | `useCreateSLT()` | DONE |
| `POST /v2/course/teacher/slt/update` | POST | `useUpdateSLT()` | DONE |
| `POST /v2/course/teacher/slt/delete` | POST | `useDeleteSLT()` | DONE |
| `POST /v2/course/teacher/slt/reorder` | POST | `useReorderSLTs()` | DONE |
| `POST /v2/course/teacher/lesson/create` | POST | `useCreateLesson()` | DONE |
| `POST /v2/course/teacher/lesson/update` | POST | `useUpdateLesson()` | DONE |
| `POST /v2/course/teacher/lesson/delete` | POST | `useDeleteLesson()` | DONE |
| `POST /v2/course/teacher/introduction/create` | POST | `useCreateIntroduction()` | DONE |
| `POST /v2/course/teacher/introduction/update` | POST | `useUpdateIntroduction()` | DONE |
| `POST /v2/course/teacher/introduction/delete` | POST | `useDeleteIntroduction()` | DONE |
| `POST /v2/course/teacher/assignment/create` | POST | `useCreateAssignment()` | DONE |
| `POST /v2/course/teacher/assignment/update` | POST | `useUpdateAssignment()` | DONE |
| `POST /v2/course/teacher/assignment/delete` | POST | `useDeleteAssignment()` | DONE |
| `POST /v2/course/teacher/assignment-commitments/list` | POST | `useTeacherAssignmentCommitments()` | DONE |
| `POST /v2/course/teacher/assignment-commitment/review` | POST | - | TODO |

### Student Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/course/student/courses/list` | POST | `useStudentCourses()` | DONE |
| `POST /v2/course/student/commitment/create` | POST | - | TODO |
| `POST /v2/course/student/commitment/submit` | POST | - | TODO |
| `POST /v2/course/student/commitment/update` | POST | - | TODO |
| `POST /v2/course/student/commitment/claim` | POST | - | TODO |
| `POST /v2/course/student/commitment/leave` | POST | - | TODO |
| `POST /v2/course/student/assignment-commitments/list` | POST | `useStudentCommitments()` | DONE |
| `POST /v2/course/student/assignment-commitment/get` | POST | - | TODO |

### User (Public) Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `GET /v2/course/user/courses/list` | GET | `useActiveCourses()` | DONE |
| `GET /v2/course/user/course/get/{course_id}` | GET | `useCourse(id)` | DONE |
| `GET /v2/course/user/modules/{course_id}` | GET | `useCourseModules()` | DONE |
| `GET /v2/course/user/slts/{course_id}/{module_code}` | GET | `useSLTs()` | DONE |
| `GET /v2/course/user/assignment/{course_id}/{module_code}` | GET | `useAssignment()` | DONE |
| `GET /v2/course/user/lesson/{course_id}/{module_code}/{slt_index}` | GET | `useLesson()` | DONE |

---

## Projects

**Status**: **Partial** (~82%) - Core CRUD complete

### Owner Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/project/owner/projects/list` | POST | `useOwnerProjects()` | DONE |
| `POST /v2/project/owner/project/create` | POST | - | TODO |
| `POST /v2/project/owner/project/register` | POST | `useRegisterProject()` | DONE |
| `POST /v2/project/owner/project/update` | POST | `useUpdateProject()` | DONE |

### Manager Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/project/manager/projects/list` | POST | `useManagerProjects()` | DONE |
| `POST /v2/project/manager/tasks/list` | POST | `useManagerTasks()` | DONE |
| `GET /v2/project/manager/tasks/{policy_id}` | GET | - | TODO |
| `POST /v2/project/manager/task/create` | POST | `useCreateTask()` | DONE |
| `POST /v2/project/manager/task/update` | POST | `useUpdateTask()` | DONE |
| `POST /v2/project/manager/task/delete` | POST | `useDeleteTask()` | DONE |
| `POST /v2/project/manager/commitments/list` | POST | `useManagerCommitments()` | DONE |

### Contributor Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/project/contributor/projects/list` | POST | `useContributorProjects()` | DONE |
| `POST /v2/project/contributor/commitments/list` | POST | `useContributorCommitments()` | DONE |
| `POST /v2/project/contributor/commitment/create` | POST | - | TODO |
| `POST /v2/project/contributor/commitment/get` | POST | - | TODO |
| `POST /v2/project/contributor/commitment/update` | POST | - | TODO |
| `POST /v2/project/contributor/commitment/delete` | POST | - | TODO |

### User (Public) Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `GET /v2/project/user/projects/list` | GET | `useProjects()` | DONE |
| `GET /v2/project/user/project/{project_id}` | GET | `useProject(id)` | DONE |
| `POST /v2/project/user/tasks/list` | POST | - | TODO |

---

## TX: Course Operations

**Status**: **COMPLETE** - All course transaction endpoints

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /v2/tx/course/student/assignment/commit` | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `enroll-in-course.tsx` | DONE |
| `POST /v2/tx/course/student/assignment/update` | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment-update.tsx` | DONE |
| `POST /v2/tx/course/student/credential/claim` | `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential-claim.tsx` | DONE |
| `POST /v2/tx/course/teacher/assignments/assess` | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assess-assignment.tsx` | DONE |
| `POST /v2/tx/course/teacher/modules/manage` | `COURSE_TEACHER_MODULES_MANAGE` | `mint-module-tokens.tsx` | DONE |
| `POST /v2/tx/course/owner/teachers/manage` | `COURSE_OWNER_TEACHERS_MANAGE` | `teachers-update.tsx` | DONE |

---

## TX: Project Operations

**Status**: **COMPLETE** - All project transaction endpoints

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /v2/tx/project/contributor/task/commit` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task-commit.tsx` | DONE |
| `POST /v2/tx/project/contributor/task/action` | `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task-action.tsx` | DONE |
| `POST /v2/tx/project/contributor/credential/claim` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project-credential-claim.tsx` | DONE |
| `POST /v2/tx/project/manager/tasks/assess` | `PROJECT_MANAGER_TASKS_ASSESS` | `tasks-assess.tsx` | DONE |
| `POST /v2/tx/project/manager/tasks/manage` | `PROJECT_MANAGER_TASKS_MANAGE` | `tasks-manage.tsx` | DONE |
| `POST /v2/tx/project/owner/managers/manage` | `PROJECT_OWNER_MANAGERS_MANAGE` | `managers-manage.tsx` | DONE |
| `POST /v2/tx/project/owner/contributor-blacklist/manage` | `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist-manage.tsx` | DONE |
| `POST /v2/tx/project/user/treasury/add-funds` | `PROJECT_USER_TREASURY_ADD_FUNDS` | `treasury-fund.tsx` | DONE |

---

## TX: Instance/Global Operations

**Status**: **86%** - Core TX types complete

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /v2/tx/global/user/access-token/mint` | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `mint-access-token-simple.tsx` | DONE |
| `POST /v2/tx/instance/owner/course/create` | `INSTANCE_COURSE_CREATE` | `create-course.tsx` | DONE |
| `POST /v2/tx/instance/owner/project/create` | `INSTANCE_PROJECT_CREATE` | `create-project.tsx` | DONE |
| `POST /v2/tx/register` | - | `use-tx-watcher.ts` | DONE |
| `GET /v2/tx/status/{tx_hash}` | - | `use-tx-watcher.ts` | DONE |
| `GET /v2/tx/pending` | - | `use-tx-watcher.ts` | DONE |
| `GET /v2/tx/types` | - | - | UNUSED |

---

## Implementation Locations

| Category | Location |
|----------|----------|
| Auth | `src/lib/andamio-auth.ts` |
| API Key | `src/lib/andamio-auth.ts` |
| Course Hooks | `src/hooks/api/course/*.ts` |
| Project Hooks | `src/hooks/api/project/*.ts` |
| TX Config | `src/config/transaction-ui.ts`, `src/config/transaction-schemas.ts` |
| TX Hooks | `src/hooks/tx/*.ts` |

---

## How to Improve Coverage

1. **Courses**: Add student commitment hooks for enrollment flow
2. **Projects**: Add contributor commitment CRUD hooks
3. **User Management**: Implement profile and usage endpoints if needed
4. **Admin**: Build admin dashboard if required

Run the audit script after adding implementations:
```bash
npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts
```

---

## Related Documentation

- [HOOKS-STATUS.md](./HOOKS-STATUS.md) - Hook implementation patterns and status
- [unified-api-endpoints.md](./unified-api-endpoints.md) - All gateway endpoints

---

**Last Updated**: January 26, 2026
**API Base URL**: `https://dev.api.andamio.io`
