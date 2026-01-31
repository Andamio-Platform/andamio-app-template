# Direct API Calls in UX Components - Audit Report

**Last Updated:** 2026-01-31

## Andamioscan Removal (2026-01-31)

**All direct Andamioscan calls have been eliminated.** The file `src/lib/andamioscan-events.ts` was deleted and `src/hooks/tx/use-event-confirmation.ts` was removed. All pages now use gateway hooks (`useProject`, `useCourse`, etc.) exclusively.

**Remaining future work**:
- Wire up `StudentCompletionInput[]` on project catalog + contributor pages (currently `[]`)
- Create `useStudentCourses()` hook for prerequisite eligibility checking across projects

---

## Summary

**Total Violations Found: 23 files with 50+ direct API calls**
- **Page files**: 17 files with API calls
- **Component files**: 6 files with API calls

**Migrated (Phase 3.10)**: 8 page files + 6 component files migrated to React Query hooks

**Page Files**:
- ✅ `project/[projectid]/[taskhash]/page.tsx` (3 calls → hooks)
- ✅ `project/[projectid]/contributor/page.tsx` (3 calls → hooks, reactive refactor)
- ✅ `studio/project/page.tsx` (1 call → hook)
- ✅ `studio/project/[projectid]/page.tsx` (3 calls → hooks)
- ✅ `studio/project/[projectid]/draft-tasks/page.tsx` (3 calls → hooks)
- ✅ `studio/project/[projectid]/draft-tasks/new/page.tsx` (2 calls → hooks)
- ✅ `studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx` (3 calls → hooks)
- ✅ `studio/project/[projectid]/manage-treasury/page.tsx` (2 calls → hooks, batch-status/confirm-tx remain)

**Component Files**:
- ✅ `components/tx/assignment-update.tsx` → `useSubmitEvidence()`
- ✅ `components/tx/burn-module-tokens.tsx` → `useUpdateCourseModuleStatus()`
- ✅ `components/dashboard/pending-reviews-summary.tsx` → `useTeacherCommitmentsQueries()`
- ✅ `components/tx/task-commit.tsx` → `useSubmitTaskEvidence()`
- ✅ `components/tx/mint-access-token-simple.tsx` → `useUpdateAccessTokenAlias()`

**New Hooks Created**:
- ✅ `useTeacherCommitmentsQueries()` in `use-course-teacher.ts` (useQueries fan-out)
- ✅ `useSubmitTaskEvidence()` in `use-project-contributor.ts` (mutation)
- ✅ `useUpdateAccessTokenAlias()` in `use-user.ts` (new file, mutation)

**Remaining**: 2 deferred files (`sitemap/page.tsx`, `pending-tx-list.tsx`) + studio pages with direct calls (teacher, module wizard, learner components)

---

## Page Files with Direct API Calls

### 1. `/src/app/(app)/project/[projectid]/[taskhash]/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useTask(taskHash)` | `fetch()` GET `/project/user/task/${taskHash}` |
| `useProject(projectId)` | `getProject()` Andamioscan call for contributor_state_policy_id |
| `useContributorCommitment(projectId, taskHash)` | `authenticatedFetch()` POST `/project/contributor/commitment/get` |
| `queryClient.invalidateQueries()` | Manual refetch in onSuccess |

### 2. `/src/app/(app)/sitemap/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 309 | `fetch()` | `/api/gateway/api/v2/course/user/courses/list` |
| 318 | `fetch()` | `/api/gateway/api/v2/project/user/projects/list` |
| 329 | `authenticatedFetch()` | `/api/gateway/api/v2/course/owner/courses/list` |
| 343 | `authenticatedFetch()` | `/api/gateway/api/v2/project/owner/projects/list` |

### 3. `/src/app/(app)/studio/project/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useRegisterProject()` | `authenticatedFetch()` POST `/project/owner/project/register` |
| `registerProject.isPending` | Manual `isSubmitting` state |

### 4. `/src/app/(app)/project/[projectid]/contributor/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useProject(projectId)` | `fetch()` GET `/project/user/project/${projectId}` |
| `useProjectTasks(contributorStateId)` | `fetch()` POST `/project/user/tasks/list` |
| `useContributorCommitment(projectId, lookupTaskHash)` | `authenticatedFetch()` POST `/project/contributor/commitment/get` (reactive refactor: orchestration sets `lookupTaskHash` state, hook fetches reactively) |

### 5. `/src/app/(app)/studio/course/[coursenft]/teacher/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 163 | `fetch()` | `/api/gateway/api/v2/course/user/course/get/${courseNftPolicyId}` |
| 180 | `authenticatedFetch()` | `/api/gateway/api/v2/course/teacher/assignment-commitments/list` |
| 251 | `authenticatedFetch()` | `/api/gateway/api/v2/course/student/assignment-commitment/get` |

### 6. `/src/app/(app)/studio/project/[projectid]/manage-treasury/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useProject(projectId)` | `fetch()` GET `/project/user/project/${projectId}` |
| `useManagerTasks(contributorStateId)` | `authenticatedFetch()` POST `/project/manager/tasks/list` |
| `queryClient.invalidateQueries()` | Manual `fetchData()` in onSuccess callbacks |
| Note: Andamioscan orchestration + batch-status/confirm-tx calls remain as useEffect (transaction-specific) |

### 7. `/src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useProject(projectId)` | `fetch()` GET `/project/user/project/${projectId}` |
| `useManagerTasks(contributorStateId)` | `authenticatedFetch()` POST `/project/manager/tasks/list` |
| `useDeleteTask()` | `authenticatedFetch()` POST `/project/manager/task/delete` |

### 8. `/src/app/(app)/studio/project/[projectid]/draft-tasks/new/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useProject(projectId)` | `fetch()` GET `/project/user/project/${projectId}` |
| `useCreateTask()` | `authenticatedFetch()` POST `/project/manager/task/create` |

### 9. `/src/app/(app)/studio/project/[projectid]/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useProject(projectId)` | `fetch()` GET `/project/user/project/${projectId}` |
| `useManagerTasks(contributorStateId)` | `authenticatedFetch()` POST `/project/manager/tasks/list` |
| `useUpdateProject()` | `authenticatedFetch()` POST `/project/owner/project/update` |
| `queryClient.invalidateQueries()` | Manual `fetchProjectAndTasks()` in onSuccess |

### 10. `/src/app/(app)/studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useProject(projectId)` | `fetch()` GET `/project/user/project/${projectId}` |
| `useManagerTasks(contributorStateId)` | `authenticatedFetch()` POST `/project/manager/tasks/list` |
| `useUpdateTask()` | `authenticatedFetch()` POST `/project/manager/task/update` |

### 11. `/src/app/(studio)/studio/course/[coursenft]/[modulecode]/page.tsx`
- Module wizard page (needs verification)

---

## Component Files with Direct API Calls

### 1. `/src/components/learner/assignment-commitment.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 252 | `authenticatedFetch()` | `/api/gateway/api/v2/course/student/assignment-commitment/get` |
| 596, 773 | `authenticatedFetch()` | `/api/gateway/api/v2/course/student/commitment/submit` |

### 2. `/src/components/studio/wizard/steps/step-review.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 139 | `authenticatedFetch()` | `/api/gateway/api/v2/course/teacher/course-module/update` |

### 3. `/src/components/studio/wizard/module-wizard.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 125 | `fetch()` | `/api/gateway/api/v2/course/user/slts/${courseNftPolicyId}/${moduleCode}` |
| 137 | `fetch()` | `/api/gateway/api/v2/course/user/assignment/${courseNftPolicyId}/${moduleCode}` |
| 162 | `fetch()` (loop) | `/api/gateway/api/v2/course/user/lesson/${courseNftPolicyId}/${moduleCode}/${sltIndex}` |
| 211 | `fetch()` | `/api/gateway/api/v2/course/user/course-module/get/${courseNftPolicyId}/${moduleCode}` |

### 4. `/src/components/tx/burn-module-tokens.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useUpdateCourseModuleStatus()` | `authenticatedFetch()` POST `/course/teacher/course-module/update` |

### 5. `/src/components/tx/assignment-update.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useSubmitEvidence()` | `authenticatedFetch()` POST `/course/student/commitment/submit` |

### 6. `/src/components/tx/pending-tx-list.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 146 | `authenticatedFetch()` | `/api/gateway/api/v2/tx/pending` |

### 7. `/src/components/tx/mint-access-token-simple.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useUpdateAccessTokenAlias()` | `authenticatedFetch()` POST `/user/access-token-alias` |

### 8. `/src/components/tx/task-commit.tsx` ✅ MIGRATED
| Hook | Replaces |
|------|----------|
| `useSubmitTaskEvidence()` | `authenticatedFetch()` POST `/project/contributor/commitment/submit` |

---

## Endpoints Requiring New Hooks

### Project Domain (needs `use-project-tasks.ts`, `use-contributor.ts`, `use-manager.ts`)
- `GET /project/user/task/${taskHash}` - Get single task
- `POST /project/user/tasks/list` - List tasks (public)
- `POST /project/contributor/commitment/get` - Get contributor commitment
- `POST /project/contributor/commitment/submit` - Submit task evidence
- `POST /project/manager/tasks/list` - List manager tasks
- `POST /project/manager/task/create` - Create task
- `POST /project/manager/task/update` - Update task
- `POST /project/manager/task/delete` - Delete task
- `POST /project/manager/task/batch-status` - Batch status update
- `POST /project/manager/task/confirm-tx` - Confirm transaction
- `POST /project/owner/project/register` - Register project
- `POST /project/owner/project/update` - Update project

### Course Domain (extend existing hooks)
- `POST /course/teacher/assignment-commitments/list` - List assignment commitments
- `POST /course/teacher/course-module/update` - Update module status
- `POST /course/student/assignment-commitment/get` - Get student commitment
- `POST /course/student/commitment/submit` - Submit evidence

### Transaction Domain (needs `use-pending-tx.ts`)
- `GET /tx/pending` - Get pending transactions

### User Domain (needs `use-user.ts`)
- `POST /user/access-token-alias` - Update access token alias

---

## Refactoring Priority

### High Priority (Most Duplicated)
1. **Project user/task data** - Fetched in 5+ pages
2. **Manager tasks list** - Fetched in 4+ pages
3. **Contributor commitment** - Fetched in 3+ pages/components
4. **Student commitment submit** - Called in 3+ components

### Medium Priority
5. Teacher assignment commitments
6. Module update (teacher)
7. Project registration/update

### Lower Priority (Single Use)
8. Pending TX list
9. Access token alias update
10. Sitemap data fetching

---

## Implementation Plan

### New Hooks to Create

1. **`src/hooks/api/project/use-project-tasks.ts`**
   - `useProjectTask(taskHash)` - Get single task
   - `useProjectTasksList(projectId)` - List public tasks

2. **`src/hooks/api/project/use-contributor.ts`**
   - `useContributorCommitment(projectId)` - Get commitment
   - `useSubmitTaskEvidence()` - Mutation for submitting evidence

3. **`src/hooks/api/project/use-manager.ts`**
   - `useManagerTasks(projectId)` - List manager tasks
   - `useCreateTask()` - Create task mutation
   - `useUpdateTask()` - Update task mutation
   - `useDeleteTask()` - Delete task mutation
   - `useBatchTaskStatus()` - Batch status mutation
   - `useConfirmTaskTx()` - Confirm TX mutation

4. **`src/hooks/api/project/use-owner.ts`**
   - `useRegisterProject()` - Register project mutation
   - `useUpdateProject()` - Update project mutation

5. **`src/hooks/api/course/use-teacher.ts`** (extend existing)
   - `useTeacherAssignmentCommitments(courseId)` - List commitments
   - `useUpdateModuleStatus()` - Update module mutation

6. **`src/hooks/api/course/use-student.ts`** (extend existing)
   - `useStudentAssignmentCommitment(courseId, moduleCode)` - Get commitment
   - `useSubmitAssignmentEvidence()` - Submit evidence mutation

7. **`src/hooks/api/use-pending-tx.ts`**
   - `usePendingTransactions()` - List pending TXs

8. **`src/hooks/api/use-user.ts`**
   - `useUpdateAccessTokenAlias()` - Update alias mutation

---

## Related Skills

When refactoring these, use:
- `/audit-api-coverage api-hooks` - For hook implementation patterns
- `/typescript-types-expert` - For proper type handling
- `/react-query-auditor` - For React Query best practices
