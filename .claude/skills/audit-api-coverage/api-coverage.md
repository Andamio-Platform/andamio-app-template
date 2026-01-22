# API Coverage Status

> **Unified API Gateway Coverage for T3 App Template**
> **Base URL**: `https://dev.api.andamio.io`
> Last Updated: January 22, 2026
> **Status**: Needs Review (API Updated)

This document tracks which API endpoints are implemented in the T3 App Template.

## Quick Reference

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| [Authentication](#authentication) | 6 | 2 | **33%** |
| [User Management](#user-management) | 6 | 2 | **33%** |
| [API Key Management](#api-key-management) | 6 | 0 | **0%** |
| [Admin Functions](#admin-functions) | 4 | 0 | **0%** |
| [Courses](#courses) | 37 | ~20 | **~54%** |
| [Projects](#projects) | 17 | ~12 | **~71%** |
| [TX: Courses](#tx-course-operations) | 6 | 6 | **100%** |
| [TX: Projects](#tx-project-operations) | 8 | 7 | **88%** |
| [TX: Instance/Global](#tx-instanceglobal-operations) | 7 | 6 | **86%** |
| **TOTAL** | **106** | **~55** | **~52%** |

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
- `src/hooks/api/*.ts` - React Query hooks for merged endpoints

---

## Authentication

**Status**: 🔶 **Partial** (core wallet auth implemented)

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/v2/auth/login/session` | POST | `andamio-auth.ts` → `createLoginSession()` | ✅ |
| `/v2/auth/login/validate` | POST | `andamio-auth.ts` → `validateSignature()` | ✅ |
| `/v2/auth/developer/account/login` | POST | - | ⏳ |
| `/v2/auth/developer/account/register` | POST | - | ⏳ |
| `/v2/auth/developer/register/session` | POST | - | ⏳ |
| `/v2/auth/developer/register/complete` | POST | - | ⏳ |

**Implementation Notes**:
- Core wallet auth (session/validate) is fully implemented
- Developer account endpoints are for API key users (not wallet users)
- JWT stored in localStorage, refreshed on page load

---

## User Management

**Status**: 🔶 **Partial**

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `GET /v1/user/me` | GET | - | ⏳ |
| `POST /v1/user/delete` | POST | - | ⏳ |
| `GET /v1/user/usage` | GET | - | ⏳ |
| `POST /v1/user/usage/daily` | POST | - | ⏳ |
| `POST /v2/user/access-token-alias` | POST | `andamio-auth.ts` → used in login flow | ✅ |
| `POST /v2/user/init-roles` | POST | - | ⏳ |

---

## API Key Management

**Status**: ⏳ **Not Implemented** - Future feature for programmatic access

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `POST /v2/apikey/developer/account/delete` | POST | - | ⏳ |
| `POST /v2/apikey/developer/key/request` | POST | - | ⏳ |
| `POST /v2/apikey/developer/key/delete` | POST | - | ⏳ |
| `POST /v2/apikey/developer/key/rotate` | POST | - | ⏳ |
| `GET /v2/apikey/developer/profile/get` | GET | - | ⏳ |
| `GET /v2/apikey/developer/usage/get` | GET | - | ⏳ |

---

## Admin Functions

**Status**: ⏳ **Not Implemented** - Admin panel not built

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `POST /v1/admin/set-user-role` | POST | - | ⏳ |
| `POST /v1/admin/usage/user-api-usage` | POST | - | ⏳ |
| `POST /v1/admin/usage/any-user-daily-api-usage` | POST | - | ⏳ |
| `GET /v2/admin/tx/stats` | GET | - | ⏳ |

---

## Courses

**Status**: 🔶 **Partial** - Core CRUD implemented, some new endpoints pending

### Owner Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/course/owner/courses/list` | POST | `useOwnerCourses()` | ✅ |
| `POST /v2/course/owner/course/create` | POST | `useCreateCourse()` | ✅ |
| `POST /v2/course/owner/course/register` | POST | `useRegisterCourse()` | ✅ |
| `POST /v2/course/owner/course/update` | POST | `useUpdateCourse()` | ✅ |
| `POST /v2/course/owner/teacher/add` | POST | - (DEPRECATED) | ⏳ |
| `POST /v2/course/owner/teacher/remove` | POST | - (DEPRECATED) | ⏳ |
| `POST /v2/course/owner/teachers/update` | POST | - | ⏳ |

### Teacher Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/course/teacher/courses/list` | POST | `useTeacherCourses()` | ✅ |
| `POST /v2/course/teacher/course-modules/list` | POST | `useCourseModules()` | ✅ |
| `POST /v2/course/teacher/course-module/create` | POST | `useCreateCourseModule()` | ✅ |
| `POST /v2/course/teacher/course-module/update` | POST | `useUpdateCourseModule()` | ✅ |
| `POST /v2/course/teacher/course-module/delete` | POST | `useDeleteCourseModule()` | ✅ |
| `POST /v2/course/teacher/course-module/publish` | POST | - | ⏳ NEW |
| `POST /v2/course/teacher/slt/create` | POST | `useCreateSLT()` | ✅ |
| `POST /v2/course/teacher/slt/update` | POST | `useUpdateSLT()` | ✅ |
| `POST /v2/course/teacher/slt/delete` | POST | `useDeleteSLT()` | ✅ |
| `POST /v2/course/teacher/slt/reorder` | POST | `useReorderSLTs()` | ✅ |
| `POST /v2/course/teacher/lesson/create` | POST | `useCreateLesson()` | ✅ |
| `POST /v2/course/teacher/lesson/update` | POST | `useUpdateLesson()` | ✅ |
| `POST /v2/course/teacher/lesson/delete` | POST | `useDeleteLesson()` | ✅ |
| `POST /v2/course/teacher/introduction/create` | POST | - | ⏳ NEW |
| `POST /v2/course/teacher/introduction/update` | POST | - | ⏳ NEW |
| `POST /v2/course/teacher/introduction/delete` | POST | - | ⏳ NEW |
| `POST /v2/course/teacher/assignment/create` | POST | `useCreateAssignment()` | ✅ |
| `POST /v2/course/teacher/assignment/update` | POST | `useUpdateAssignment()` | ✅ |
| `POST /v2/course/teacher/assignment/delete` | POST | `useDeleteAssignment()` | ✅ |
| `POST /v2/course/teacher/assignment-commitments/list` | POST | `useTeacherCommitments()` | ✅ |
| `POST /v2/course/teacher/assignment-commitment/review` | POST | - | ⏳ |

### Student Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/course/student/courses/list` | POST | `useStudentCourses()` | ✅ |
| `POST /v2/course/student/commitment/create` | POST | - | ⏳ |
| `POST /v2/course/student/commitment/submit` | POST | - | ⏳ |
| `POST /v2/course/student/commitment/update` | POST | - | ⏳ |
| `POST /v2/course/student/commitment/claim` | POST | - | ⏳ |
| `POST /v2/course/student/commitment/leave` | POST | - | ⏳ |
| `POST /v2/course/student/assignment-commitments/list` | POST | `useStudentCommitments()` | ✅ |
| `POST /v2/course/student/assignment-commitment/get` | POST | - | ⏳ |

### User (Public) Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `GET /v2/course/user/courses/list` | GET | `useCourses()` | ✅ |
| `GET /v2/course/user/course/get/{course_id}` | GET | `useCourse(id)` | ✅ |
| `GET /v2/course/user/modules/{course_id}` | GET | - | ⏳ |
| `GET /v2/course/user/slts/{course_id}/{module_code}` | GET | - | ⏳ |
| `GET /v2/course/user/assignment/{course_id}/{module_code}` | GET | - | ⏳ |
| `GET /v2/course/user/lesson/{course_id}/{module_code}/{slt_index}` | GET | - | ⏳ |

### Shared Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/course/shared/commitment/get` | POST | - | ⏳ |

---

## Projects

**Status**: 🔶 **Partial** - Core CRUD implemented

### Owner Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/project/owner/projects/list` | POST | `useOwnerProjects()` | ✅ |
| `POST /v2/project/owner/project/create` | POST | - | ⏳ |
| `POST /v2/project/owner/project/register` | POST | `useRegisterProject()` | ✅ |
| `POST /v2/project/owner/project/update` | POST | `useUpdateProject()` | ✅ |

### Manager Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/project/manager/projects/list` | POST | `useManagerProjects()` | ✅ |
| `POST /v2/project/manager/tasks/list` | POST | `useManagerTasks()` | ✅ |
| `GET /v2/project/manager/tasks/{policy_id}` | GET | - | ⏳ |
| `POST /v2/project/manager/task/create` | POST | `useCreateTask()` | ✅ |
| `POST /v2/project/manager/task/update` | POST | `useUpdateTask()` | ✅ |
| `POST /v2/project/manager/task/delete` | POST | `useDeleteTask()` | ✅ |
| `POST /v2/project/manager/commitments/list` | POST | `useManagerCommitments()` | ✅ |

### Contributor Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `POST /v2/project/contributor/projects/list` | POST | `useContributorProjects()` | ✅ |
| `POST /v2/project/contributor/commitments/list` | POST | `useContributorCommitments()` | ✅ |
| `POST /v2/project/contributor/commitment/create` | POST | - | ⏳ |
| `POST /v2/project/contributor/commitment/get` | POST | - | ⏳ |
| `POST /v2/project/contributor/commitment/update` | POST | - | ⏳ |
| `POST /v2/project/contributor/commitment/delete` | POST | - | ⏳ |

### User (Public) Endpoints

| Endpoint | Method | Hook/Implementation | Status |
|----------|--------|---------------------|--------|
| `GET /v2/project/user/projects/list` | GET | `useProjects()` | ✅ |
| `GET /v2/project/user/project/{project_id}` | GET | `useProject(id)` | ✅ |
| `POST /v2/project/user/tasks/list` | POST | - | ⏳ |

---

## TX: Course Operations

**Status**: ✅ **Complete** - All V2 transaction definitions

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /v2/tx/course/student/assignment/commit` | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `enroll-in-course.tsx` | ✅ |
| `POST /v2/tx/course/student/assignment/update` | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment-update.tsx` | ✅ |
| `POST /v2/tx/course/student/credential/claim` | `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential-claim.tsx` | ✅ |
| `POST /v2/tx/course/teacher/assignments/assess` | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assess-assignment.tsx` | ✅ |
| `POST /v2/tx/course/teacher/modules/manage` | `COURSE_TEACHER_MODULES_MANAGE` | `mint-module-tokens.tsx` | ✅ |
| `POST /v2/tx/course/owner/teachers/manage` | `COURSE_OWNER_TEACHERS_MANAGE` | `teachers-update.tsx` | ✅ |

---

## TX: Project Operations

**Status**: 🔶 **88%** - Treasury endpoint pending

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /v2/tx/project/contributor/task/commit` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task-commit.tsx` | ✅ |
| `POST /v2/tx/project/contributor/task/action` | `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task-action.tsx` | ✅ |
| `POST /v2/tx/project/contributor/credential/claim` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project-credential-claim.tsx` | ✅ |
| `POST /v2/tx/project/manager/tasks/assess` | `PROJECT_MANAGER_TASKS_ASSESS` | `tasks-assess.tsx` | ✅ |
| `POST /v2/tx/project/manager/tasks/manage` | `PROJECT_MANAGER_TASKS_MANAGE` | `tasks-manage.tsx` | ✅ |
| `POST /v2/tx/project/owner/managers/manage` | `PROJECT_OWNER_MANAGERS_MANAGE` | `managers-manage.tsx` | ✅ |
| `POST /v2/tx/project/owner/contributor-blacklist/manage` | `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist-manage.tsx` | ✅ |
| `POST /v2/tx/project/user/treasury/add-funds` | `PROJECT_USER_TREASURY_ADD_FUNDS` | - | ⏳ |

---

## TX: Instance/Global Operations

**Status**: 🔶 **86%** - TX types endpoint not used

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /v2/tx/global/user/access-token/mint` | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `mint-access-token-simple.tsx` | ✅ |
| `POST /v2/tx/instance/owner/course/create` | `INSTANCE_COURSE_CREATE` | `create-course.tsx` | ✅ |
| `POST /v2/tx/instance/owner/project/create` | `INSTANCE_PROJECT_CREATE` | `create-project.tsx` | ✅ |
| `POST /v2/tx/register` | - | `use-tx-watcher.ts` | ✅ |
| `GET /v2/tx/status/{tx_hash}` | - | `use-tx-watcher.ts` | ✅ |
| `GET /v2/tx/pending` | - | `use-tx-watcher.ts` | ✅ |
| `GET /v2/tx/types` | - | - | ⏳ |

---

## Implementation Patterns

### Making Authenticated API Calls

```typescript
import { useAndamioAuth } from "~/hooks/use-andamio-auth";

const { authenticatedFetch } = useAndamioAuth();

// In a React Query hook
const response = await authenticatedFetch(
  "/api/gateway/v2/course/teacher/courses/list",
  { method: "POST", body: JSON.stringify({}) }
);
const data = await response.json();
```

### Creating New API Hooks

```typescript
// src/hooks/api/use-{resource}.ts
import { useQuery } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import type { ResourceResponse } from "~/types/generated";

export function useResource(id: string) {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  return useQuery({
    queryKey: ["resource", id],
    queryFn: async () => {
      const response = await authenticatedFetch(
        `/api/gateway/v2/resource/${id}`
      );
      return response.json() as ResourceResponse;
    },
    enabled: isAuthenticated && !!id,
  });
}
```

---

## Related Documentation

- [SKILL.md](./SKILL.md) - Skill instructions and workflow
- [unified-api-endpoints.md](./unified-api-endpoints.md) - All gateway endpoints

---

**Last Updated**: January 22, 2026
**API Base URL**: `https://dev.api.andamio.io`
