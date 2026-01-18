# API Coverage Status

> **Unified API Gateway Coverage for T3 App Template**
> Last Updated: January 18, 2026
> **Status**: ✅ V2 Migration Complete

This document tracks which API endpoints are implemented in the T3 App Template.

## Quick Reference

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| [Authentication](#authentication) | 4 | 4 | **100%** |
| [User Management](#user-management) | 4 | 0 | **0%** |
| [API Key Management](#api-key-management) | 3 | 0 | **0%** |
| [Admin Functions](#admin-functions) | 3 | 0 | **0%** |
| [Merged Courses](#merged-courses) | 8 | 8 | **100%** |
| [Merged Projects](#merged-projects) | 8 | 8 | **100%** |
| [TX: Courses](#tx-course-operations) | 6 | 6 | **100%** |
| [TX: Projects](#tx-project-operations) | 8 | 8 | **100%** |
| [TX: Instance/Global](#tx-instanceglobal-operations) | 3 | 3 | **100%** |
| **TOTAL** | **47** | **37** | **79%** |

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

**Status**: ✅ **Complete**

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/api/v2/auth/login/session` | POST | `andamio-auth.ts` → `createLoginSession()` | ✅ |
| `/api/v2/auth/login/validate` | POST | `andamio-auth.ts` → `validateSignature()` | ✅ |
| `/api/v2/auth/login` | POST | `andamio-auth.ts` → `loginWithGateway()` | ✅ |
| `/api/v2/auth/developer/account/login` | POST | `andamio-auth.ts` → `loginWithGateway()` | ✅ |

**Implementation Notes**:
- Hybrid auth: Uses legacy 2-step CIP-30 flow (session → sign → validate) for wallet verification
- Gateway login bypasses signing when access token is detected
- JWT stored in localStorage, refreshed on page load
- Response format: `{ jwt, user: { id, cardano_bech32_addr, access_token_alias } }`

---

## User Management

**Status**: ⏳ **Not needed for current features**

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/api/v1/user/me` | GET | - | ⏳ |
| `/api/v1/user/delete` | POST | - | ⏳ |
| `/api/v1/user/usage` | GET | - | ⏳ |
| `/api/v1/user/usage/daily` | POST | - | ⏳ |

---

## API Key Management

**Status**: ⏳ **Future feature** - Programmatic API access

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/api/v1/apikey/request` | POST | - | ⏳ |
| `/api/v1/apikey/delete` | POST | - | ⏳ |
| `/api/v1/apikey/rotate` | POST | - | ⏳ |

---

## Admin Functions

**Status**: ⏳ **Admin panel not implemented**

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/api/v1/admin/set-user-role` | POST | - | ⏳ |
| `/api/v1/admin/usage/user-api-usage` | POST | - | ⏳ |
| `/api/v1/admin/usage/any-user-daily-api-usage` | POST | - | ⏳ |

---

## Merged Courses

**Status**: ✅ **Complete** - All merged endpoints implemented via React Query hooks

| Endpoint | Method | Hook | Status |
|----------|--------|------|--------|
| `GET /api/v2/course/user/courses/list` | GET | `useCourses()` | ✅ |
| `GET /api/v2/course/user/course/get/{id}` | GET | `useCourse(id)` | ✅ |
| `POST /api/v2/course/owner/courses/list` | POST | `useOwnerCourses()` | ✅ |
| `POST /api/v2/course/teacher/courses/list` | POST | `useTeacherCourses()` | ✅ |
| `POST /api/v2/course/student/courses/list` | POST | `useStudentCourses()` | ✅ |
| `POST /api/v2/course/student/assignment-commitments/list` | POST | `useStudentCommitments()` | ✅ |
| `POST /api/v2/course/teacher/assignment-commitments/list` | POST | `useTeacherCommitments()` | ✅ |
| `POST /api/v2/course/owner/course/register` | POST | `useRegisterCourse()` | ✅ |

**Response Format Notes**:
- Merged endpoints return `{ data: [...], source: "merged" | "chain_only" }`
- Content is nested: `{ content: { title, code, live } }` - hooks flatten to top level
- Hooks in `src/hooks/api/use-teacher-courses.ts`, `use-student-courses.ts`, etc.

---

## Merged Projects

**Status**: ✅ **Complete** - All merged endpoints implemented via React Query hooks

| Endpoint | Method | Hook | Status |
|----------|--------|------|--------|
| `GET /api/v2/project/user/projects/list` | GET | `useProjects()` | ✅ |
| `GET /api/v2/project/user/project/get/{id}` | POST | `useProject(id)` | ✅ |
| `POST /api/v2/project/owner/projects/list` | POST | `useOwnerProjects()` | ✅ |
| `POST /api/v2/project/manager/projects/list` | POST | `useManagerProjects()` | ✅ |
| `POST /api/v2/project/contributor/projects/list` | POST | `useContributorProjects()` | ✅ |
| `POST /api/v2/project/contributor/commitments/list` | POST | `useContributorCommitments()` | ✅ |
| `POST /api/v2/project/manager/commitments/list` | POST | `useManagerCommitments()` | ✅ |
| `POST /api/v2/project/owner/project/register` | POST | `useRegisterProject()` | ✅ |

**Response Format Notes**:
- Same pattern as courses: `{ data: [...], source: "merged" | "chain_only" }`
- Content flattening handled in hooks

---

## TX: Course Operations

**Status**: ✅ **Complete** - All V2 transaction definitions and components

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /api/v2/tx/course/student/assignment/commit` | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `enroll-in-course.tsx` | ✅ |
| `POST /api/v2/tx/course/student/assignment/update` | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment-update.tsx` | ✅ |
| `POST /api/v2/tx/course/student/credential/claim` | `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential-claim.tsx` | ✅ |
| `POST /api/v2/tx/course/teacher/assignments/assess` | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assess-assignment.tsx` | ✅ |
| `POST /api/v2/tx/course/teacher/modules/manage` | `COURSE_TEACHER_MODULES_MANAGE` | `mint-module-tokens.tsx` | ✅ |
| `POST /api/v2/tx/course/owner/teachers/manage` | `COURSE_OWNER_TEACHERS_MANAGE` | `teachers-update.tsx` | ✅ |

---

## TX: Project Operations

**Status**: ✅ **Complete**

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /api/v2/tx/project/contributor/task/commit` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task-commit.tsx` | ✅ |
| `POST /api/v2/tx/project/contributor/task/action` | `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task-action.tsx` | ✅ |
| `POST /api/v2/tx/project/contributor/credential/claim` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project-credential-claim.tsx` | ✅ |
| `POST /api/v2/tx/project/manager/tasks/assess` | `PROJECT_MANAGER_TASKS_ASSESS` | `tasks-assess.tsx` | ✅ |
| `POST /api/v2/tx/project/manager/tasks/manage` | `PROJECT_MANAGER_TASKS_MANAGE` | `tasks-manage.tsx` | ✅ |
| `POST /api/v2/tx/project/owner/managers/manage` | `PROJECT_OWNER_MANAGERS_MANAGE` | `managers-manage.tsx` | ✅ |
| `POST /api/v2/tx/project/owner/contributor-blacklist/manage` | `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist-manage.tsx` | ✅ |
| `POST /api/v2/tx/project/user/treasury/add-funds` | `PROJECT_TREASURY_ADD_FUNDS` | - | ⏳ |

---

## TX: Instance/Global Operations

**Status**: ✅ **Complete**

| Endpoint | Transaction Type | Component | Status |
|----------|------------------|-----------|--------|
| `POST /api/v2/tx/global/user/access-token/mint` | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `mint-access-token-simple.tsx` | ✅ |
| `POST /api/v2/tx/instance/owner/course/create` | `INSTANCE_COURSE_CREATE` | `create-course.tsx` | ✅ |
| `POST /api/v2/tx/instance/owner/project/create` | `INSTANCE_PROJECT_CREATE` | `create-project.tsx` | ✅ |

---

## Implementation Patterns

### Making Authenticated API Calls

```typescript
import { useAndamioAuth } from "~/hooks/use-andamio-auth";

const { authenticatedFetch } = useAndamioAuth();

// In a React Query hook
const response = await authenticatedFetch(
  "/api/gateway/api/v2/course/teacher/courses/list",
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
        `/api/gateway/api/v2/resource/${id}`
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
- [V2-MIGRATION-CHECKLIST.md](./V2-MIGRATION-CHECKLIST.md) - Historical migration record

---

**Last Updated**: January 18, 2026
**Migration Status**: ✅ Complete
