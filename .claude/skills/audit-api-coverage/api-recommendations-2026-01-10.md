# API Recommendations - January 10, 2026

## Overview

This audit reveals a **complete API restructure** in the new Go-based Andamio DB API. The API now uses a role-based routing pattern:

```
/{system}/{role}/{resource}/{action}
```

**Systems**: `auth`, `user`, `course`, `project`
**Roles**: `public`, `owner`, `teacher`, `student`, `shared`, `manager`, `contributor`

---

## Endpoint Migration Map

### Authentication (No Changes)

| Old Path | New Path | Method | Status |
|----------|----------|--------|--------|
| `/auth/login/session` | `/auth/login/session` | POST | Same |
| `/auth/login/validate` | `/auth/login/validate` | POST | Same |

### User Management (Minor Changes)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/user/access-token-alias` | `/user/access-token-alias` | POST | Same |
| `/user/unconfirmed-tx` | `/user/unconfirmed-tx` | GET/POST | Same |
| `/creator/create` + `/learner/create` | `/user/init-roles` | POST | **MERGED** |
| `/pending-transactions` | `/user/pending-transactions` | GET | Path change |

### Course System - Public Endpoints (Major Changes)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/course/published` | `/course/public/courses/list` | GET | Path + method |
| `/course/get` (POST body) | `/course/public/course/get/{policy_id}` | GET | **Path params** |
| `/course/check` (POST body) | `/course/public/course/check/{code}` | GET | **Path params** |
| `/course-module/list` | `/course/public/course-modules/list/{policy_id}` | GET | **Path params** |
| `/course-module/get` | `/course/public/course-module/get/{policy_id}/{module_code}` | GET | **Path params** |
| `/course-module/assignment-summary` | `/course/public/course-modules/assignment-summary/{policy_id}` | GET | **Path params** |
| `/slt/list` | `/course/public/slts/list/{policy_id}/{module_code}` | GET | **Path params** |
| `/slt/get` | `/course/public/slt/get/{policy_id}/{module_code}/{index}` | GET | **Path params** |
| `/lesson/list` | `/course/public/lessons/list/{policy_id}/{module_code}` | GET | **Path params** |
| `/lesson/get` | `/course/public/lesson/get/{policy_id}/{module_code}/{index}` | GET | **Path params** |
| `/assignment/get` | `/course/public/assignment/get/{policy_id}/{module_code}` | GET | **Path params** |
| `/introduction/get` | `/course/public/introduction/get/{policy_id}/{module_code}` | GET | **Path params** |
| - | `/course/public/assignment-commitment/has-commitments/{policy_id}/{module_code}` | GET | **NEW** |

### Course System - Owner Endpoints (Major Changes)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/courses/owned` | `/course/owner/courses/list` | POST | Path change |
| `/course/create` | `/course/owner/course/create` | POST | Path change |
| `/course/update` | `/course/owner/course/update` | POST | Path + method (was PATCH) |
| `/course/delete` | `/course/owner/course/delete` | POST | Path + method (was DELETE) |
| - | `/course/owner/course/mint` | POST | **NEW** |
| - | `/course/owner/course/confirm-mint` | POST | **NEW** |

### Course System - Teacher Endpoints (NEW ROLE)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/course-modules/list` (batch) | `/course/teacher/course-modules/list` | POST | Path change |
| `/course-module/create` | `/course/teacher/course-module/create` | POST | Path change |
| `/course-module/update` | `/course/teacher/course-module/update` | POST | Path + method |
| `/course-module/delete` | `/course/teacher/course-module/delete` | POST | Path + method |
| `/course-module/update-status` | `/course/teacher/course-module/update-status` | POST | Path + method |
| - | `/course/teacher/course-module/update-code` | POST | **NEW** |
| - | `/course/teacher/course-module/publish` | POST | **NEW** |
| - | `/course/teacher/course-module/set-pending-tx` | POST | **NEW** |
| - | `/course/teacher/course-module/confirm-tx` | POST | **NEW** |
| - | `/course/teacher/course-modules/batch-update-status` | POST | **NEW** |
| - | `/course/teacher/course-modules/batch-confirm` | POST | **NEW** |
| `/slt/create` | `/course/teacher/slt/create` | POST | Path change |
| `/slt/update` | `/course/teacher/slt/update` | POST | Path + method |
| `/slt/delete` | `/course/teacher/slt/delete` | POST | Path + method |
| `/slt/reorder` | `/course/teacher/slts/batch-update-indexes` | POST | Path + renamed |
| - | `/course/teacher/slt/update-index` | POST | **NEW** |
| `/lesson/create` | `/course/teacher/lesson/create` | POST | Path change |
| `/lesson/update` | `/course/teacher/lesson/update` | POST | Path change |
| `/lesson/delete` | `/course/teacher/lesson/delete` | POST | Path change |
| `/lesson/publish` | `/course/teacher/lesson/publish` | POST | Path change |
| `/assignment/create` | `/course/teacher/assignment/create` | POST | Path change |
| `/assignment/update` | `/course/teacher/assignment/update` | POST | Path change |
| `/assignment/delete` | `/course/teacher/assignment/delete` | POST | Path change |
| `/assignment/publish` | `/course/teacher/assignment/publish` | POST | Path change |
| `/introduction/create` | `/course/teacher/introduction/create` | POST | Path change |
| `/introduction/update` | `/course/teacher/introduction/update` | POST | Path change |
| `/introduction/delete` | `/course/teacher/introduction/delete` | POST | Path change |
| `/introduction/publish` | `/course/teacher/introduction/publish` | POST | Path change |
| `/assignment-commitment/by-course` | `/course/teacher/assignment-commitments/list-by-course` | POST | Path change |
| - | `/course/teacher/assignment-commitment/review` | POST | **NEW** |

### Course System - Student Endpoints (NEW ROLE)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/assignment-commitment/list` | `/course/student/assignment-commitments/list-by-course` | POST | Path change |
| - | `/course/student/assignment-commitment/create` | POST | **NEW** |
| `/assignment-commitment/update-evidence` | `/course/student/assignment-commitment/update-evidence` | POST | Path change |
| `/assignment-commitment/delete` | `/course/student/assignment-commitment/delete` | POST | Path change |
| `/learner/my-learning` | `/course/student/courses` | POST | Path change |
| - | `/course/student/course-status` | POST | **NEW** |

### Course System - Shared Endpoints (NEW ROLE)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| - | `/course/shared/assignment-commitment/get` | POST | **NEW** |
| `/assignment-commitment/update-status` | `/course/shared/assignment-commitment/update-status` | POST | Path change |
| `/assignment-commitment/confirm-transaction` | `/course/shared/assignment-commitment/confirm-transaction` | POST | Path change |

### Project System - Public Endpoints (Major Changes)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/projects/list` | `/project/public/treasury/list` | POST | Path change |
| `/tasks/list` | `/project/public/task/list/{treasury_nft_policy_id}` | GET | **Path params** |
| - | `/project/public/prerequisite/list` | GET | **NEW** |

### Project System - Owner Endpoints (Major Changes)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/projects/list-owned` | `/project/owner/treasury/list-owned` | POST | Path change |
| `/projects/update` | `/project/owner/treasury/update` | POST | Path + method |
| - | `/project/owner/treasury/mint` | POST | **NEW** |
| - | `/project/owner/treasury/confirm-mint` | POST | **NEW** |

### Project System - Manager Endpoints (NEW ROLE)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/tasks/create` | `/project/manager/task/create` | POST | Path change |
| `/tasks/update` | `/project/manager/task/update` | POST | Path change |
| `/tasks/delete` | `/project/manager/task/delete` | POST | Path change |
| - | `/project/manager/task/batch-update-status` | POST | **NEW** |
| - | `/project/manager/task/batch-confirm` | POST | **NEW** |
| - | `/project/manager/commitment/update-status` | POST | **NEW** |
| - | `/project/manager/commitment/confirm-transaction` | POST | **NEW** |

### Project System - Contributor Endpoints (NEW ROLE)

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/task-commitments/get` | `/project/contributor/commitment/get` | POST | Path change |
| - | `/project/contributor/commitment/create` | POST | **NEW** |
| - | `/project/contributor/commitment/update-evidence` | POST | **NEW** |
| - | `/project/contributor/commitment/update-status` | POST | **NEW** |
| - | `/project/contributor/commitment/delete` | POST | **NEW** |
| - | `/project/contributor/commitment/confirm-transaction` | POST | **NEW** |

### Project System - Shared Endpoints

| Old Path | New Path | Method | Change Type |
|----------|----------|--------|-------------|
| `/contributors/create` | `/project/shared/contributor/create` | POST | Path change |

---

## Breaking Changes Summary

### 1. All Public Endpoints Use Path Parameters
The biggest change is that **all public/read endpoints now use GET with path parameters** instead of POST with body:

```typescript
// OLD
const response = await fetch(`${API_URL}/course/get`, {
  method: "POST",
  body: JSON.stringify({ course_nft_policy_id: courseId }),
});

// NEW
const response = await fetch(
  `${API_URL}/course/public/course/get/${courseId}`
);
```

### 2. Role-Based Route Prefixes
All endpoints now include a role in the path:
- `/course/public/*` - Unauthenticated read operations
- `/course/owner/*` - Course owner operations
- `/course/teacher/*` - Course content creator operations
- `/course/student/*` - Learner operations
- `/course/shared/*` - Operations accessible by multiple roles

### 3. Merged Role Initialization
`/creator/create` and `/learner/create` are now merged into `/user/init-roles` which initializes all applicable roles at once.

### 4. New Transaction Confirmation Patterns
New batch operations and explicit confirmation endpoints:
- `/course/teacher/course-modules/batch-update-status`
- `/course/teacher/course-modules/batch-confirm`
- `/project/manager/task/batch-update-status`
- `/project/manager/task/batch-confirm`

---

## Files Requiring Updates

### High Priority (Core Functionality)

1. **`src/lib/andamio-auth.ts`**
   - Update auth endpoints (unchanged)

2. **`src/contexts/andamio-auth-context.tsx`**
   - Line 57: `/user/access-token-alias` - OK
   - Lines 97, 117: `/creator/create`, `/learner/create` → `/user/init-roles`

3. **`src/hooks/use-pending-transactions.ts`**
   - Line 46: `/pending-transactions` → `/user/pending-transactions`

4. **`src/hooks/use-owned-courses.ts`**
   - Line 73: `/courses/owned` → `/course/owner/courses/list`
   - Line 93: `/course-modules/list` → `/course/teacher/course-modules/list`

5. **`src/hooks/api/use-course.ts`**
   - Line 73: `/course/get` → `/course/public/course/get/{policy_id}` (GET)
   - Line 114: `/course/published` → `/course/public/courses/list` (GET)
   - Line 157: `/courses/owned` → `/course/owner/courses/list`
   - Line 209: `/course/update` → `/course/owner/course/update`
   - Line 268: `/course/delete` → `/course/owner/course/delete`

6. **`src/hooks/api/use-course-module.ts`**
   - Line 64: `/course-module/list` → `/course/public/course-modules/list/{policy_id}` (GET)
   - Line 105: `/course-module/get` → `/course/public/course-module/get/{policy_id}/{module_code}` (GET)
   - Line 153: `/course-modules/list` → `/course/teacher/course-modules/list`
   - Line 207: `/course-module/create` → `/course/teacher/course-module/create`
   - Line 252: `/course-module/update` → `/course/teacher/course-module/update`
   - Line 304: `/course-module/update-status` → `/course/teacher/course-module/update-status`

7. **`src/hooks/api/use-lesson.ts`**
   - Line 49: `/lesson/list` → `/course/public/lessons/list/{policy_id}/{module_code}` (GET)
   - Line 98: `/lesson/get` → `/course/public/lesson/get/{policy_id}/{module_code}/{index}` (GET)
   - Line 149: `/lesson/create` → `/course/teacher/lesson/create`

8. **`src/hooks/api/use-slt.ts`**
   - Line 49: `/slt/list` → `/course/public/slts/list/{policy_id}/{module_code}` (GET)
   - Line 94: `/slt/create` → `/course/teacher/slt/create`
   - Line 149: `/slt/update` → `/course/teacher/slt/update`
   - Line 194: `/slt/delete` → `/course/teacher/slt/delete`

### Medium Priority (Components)

9. **`src/components/learner/my-learning.tsx`**
   - Line 62: `/learner/my-learning` → `/course/student/courses`

10. **`src/components/learner/assignment-commitment.tsx`**
    - Line 165: `/assignment-commitment/list` → `/course/student/assignment-commitments/list-by-course`
    - Line 264: `/assignment-commitment/update-evidence` → `/course/student/assignment-commitment/update-evidence`
    - Line 303: `/assignment-commitment/delete` → `/course/student/assignment-commitment/delete`

11. **`src/app/(app)/project/page.tsx`**
    - Line 42: `/projects/list` → `/project/public/treasury/list`

### Lower Priority (Page Components)

Multiple page components in `src/app/` that make direct API calls need updating.

---

## Recommendations

### 1. Create URL Builder Utilities

Create a centralized URL builder to handle the new path parameter patterns:

```typescript
// src/lib/api-urls.ts
export const apiUrls = {
  course: {
    public: {
      get: (policyId: string) => `/course/public/course/get/${policyId}`,
      list: () => '/course/public/courses/list',
      modules: (policyId: string) => `/course/public/course-modules/list/${policyId}`,
      module: (policyId: string, moduleCode: string) =>
        `/course/public/course-module/get/${policyId}/${moduleCode}`,
      // etc.
    },
    owner: {
      list: () => '/course/owner/courses/list',
      create: () => '/course/owner/course/create',
      // etc.
    },
    teacher: {
      // etc.
    },
    student: {
      // etc.
    },
  },
  project: {
    // etc.
  },
};
```

### 2. Update All Hooks to React Query

This is a good opportunity to migrate all remaining `useState`-based hooks to React Query hooks with proper caching.

### 3. Batch Role Initialization

Update auth context to call `/user/init-roles` once instead of making two separate calls.

### 4. Consider Response Type Updates

The new API may have different response shapes. Review `@andamio/db-api` types to ensure alignment.

### 5. Add Request Parameter Validation

Since public endpoints now use path parameters, add validation to prevent undefined/null values from creating invalid URLs.

---

## New Endpoints to Implement

The following endpoints are **new in the Go API** and should be implemented:

### Course System
- `/course/public/assignment-commitment/has-commitments/{policy_id}/{module_code}` - Check if module has commitments
- `/course/owner/course/mint` - Mint course NFT
- `/course/owner/course/confirm-mint` - Confirm course minting tx
- `/course/teacher/course-module/update-code` - Rename module code
- `/course/teacher/course-module/publish` - Publish module
- `/course/teacher/course-module/set-pending-tx` - Set pending tx hash
- `/course/teacher/course-module/confirm-tx` - Confirm module tx
- `/course/teacher/course-modules/batch-update-status` - Batch status update
- `/course/teacher/course-modules/batch-confirm` - Batch confirmation
- `/course/teacher/slt/update-index` - Update single SLT index
- `/course/teacher/assignment-commitment/review` - Teacher reviews commitment
- `/course/student/assignment-commitment/create` - Student creates commitment
- `/course/student/course-status` - Get student's status in a course
- `/course/shared/assignment-commitment/get` - Get specific commitment

### Project System
- `/project/public/prerequisite/list` - List prerequisites
- `/project/owner/treasury/mint` - Mint treasury NFT
- `/project/owner/treasury/confirm-mint` - Confirm treasury minting tx
- `/project/manager/task/batch-update-status` - Batch task status update
- `/project/manager/task/batch-confirm` - Batch task confirmation
- `/project/manager/commitment/update-status` - Update commitment status
- `/project/manager/commitment/confirm-transaction` - Confirm commitment tx
- `/project/contributor/commitment/create` - Create task commitment
- `/project/contributor/commitment/update-evidence` - Update evidence
- `/project/contributor/commitment/update-status` - Update status
- `/project/contributor/commitment/delete` - Delete commitment
- `/project/contributor/commitment/confirm-transaction` - Confirm tx

---

## Removed/Deprecated Endpoints

The following endpoints from the old API are **no longer needed**:

- `/credential/list` - Replaced by course status endpoints
- `/my-learning/get` - Replaced by `/course/student/courses`
- Individual role creation endpoints - Merged into `/user/init-roles`

---

## Estimated Effort

| Task | Files | Estimated Scope |
|------|-------|-----------------|
| Update auth context | 1 | Small |
| Update all hooks | 7 | Medium |
| Update components | 15+ | Large |
| Update page components | 20+ | Large |
| Create URL builder | 1 | Small |
| Add new hooks for new endpoints | 10+ | Medium |
| Update types from @andamio/db-api | - | Depends on package update |

**Total**: This is a significant migration that touches most of the codebase. Recommend doing it in phases:

1. **Phase 1**: Update URL builder and core hooks
2. **Phase 2**: Update authentication and user management
3. **Phase 3**: Update course system endpoints
4. **Phase 4**: Update project system endpoints
5. **Phase 5**: Add new endpoint support

---

## Questions for Review

1. Does `@andamio/db-api` package need updating to match the new API response types?
2. Should we maintain backwards compatibility during migration or do a clean cut?
3. Are there any changes to authentication/JWT format in the new API?
4. What is the deployment timeline for the new API?

---

**Generated**: January 10, 2026
**Audited By**: Claude Code API Coverage Audit Skill
