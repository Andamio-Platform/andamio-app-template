# Direct API Calls in UX Components - Audit Report

**Last Updated:** 2026-01-28

## Summary

**Total Violations Found: 23 files with 50+ direct API calls**
- **Page files**: 17 files with API calls
- **Component files**: 6 files with API calls

These API calls should be extracted to hooks in `src/hooks/api/` to maintain proper separation of concerns.

---

## Page Files with Direct API Calls

### 1. `/src/app/(app)/project/[projectid]/[taskhash]/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 58 | `fetch()` | `/api/gateway/api/v2/project/user/task/${taskHash}` |
| 86, 352, 384 | `authenticatedFetch()` | `/api/gateway/api/v2/project/contributor/commitment/get` |

### 2. `/src/app/(app)/sitemap/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 309 | `fetch()` | `/api/gateway/api/v2/course/user/courses/list` |
| 318 | `fetch()` | `/api/gateway/api/v2/project/user/projects/list` |
| 329 | `authenticatedFetch()` | `/api/gateway/api/v2/course/owner/courses/list` |
| 343 | `authenticatedFetch()` | `/api/gateway/api/v2/project/owner/projects/list` |

### 3. `/src/app/(app)/studio/project/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 315 | `authenticatedFetch()` | `/api/gateway/api/v2/project/owner/project/register` |

### 4. `/src/app/(app)/project/[projectid]/contributor/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 230 | `authenticatedFetch()` | `/api/gateway/api/v2/project/contributor/commitment/get` |
| 334 | `fetch()` | `/api/gateway/api/v2/project/user/project/${projectId}` |
| 361 | `fetch()` (POST) | `/api/gateway/api/v2/project/user/tasks/list` |

### 5. `/src/app/(app)/studio/course/[coursenft]/teacher/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 163 | `fetch()` | `/api/gateway/api/v2/course/user/course/get/${courseNftPolicyId}` |
| 180 | `authenticatedFetch()` | `/api/gateway/api/v2/course/teacher/assignment-commitments/list` |
| 251 | `authenticatedFetch()` | `/api/gateway/api/v2/course/student/assignment-commitment/get` |

### 6. `/src/app/(app)/studio/project/[projectid]/manage-treasury/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 113 | `fetch()` | `/api/gateway/api/v2/project/user/project/${projectId}` |
| 131 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/tasks/list` |
| 593 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/task/batch-status` |
| 613 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/task/confirm-tx` |

### 7. `/src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 67 | `fetch()` | `/api/gateway/api/v2/project/user/project/${projectId}` |
| 89 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/tasks/list` |
| 138 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/task/delete` |

### 8. `/src/app/(app)/studio/project/[projectid]/draft-tasks/new/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 79 | `fetch()` | `/api/gateway/api/v2/project/user/project/${projectId}` |
| 136 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/task/create` |

### 9. `/src/app/(app)/studio/project/[projectid]/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 111 | `fetch()` | `/api/gateway/api/v2/project/user/project/${projectId}` |
| 155 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/tasks/list` |
| 207 | `authenticatedFetch()` | `/api/gateway/api/v2/project/owner/project/update` |

### 10. `/src/app/(app)/studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 85 | `fetch()` | `/api/gateway/api/v2/project/user/project/${projectId}` |
| 105 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/tasks/list` |
| 175 | `authenticatedFetch()` | `/api/gateway/api/v2/project/manager/task/update` |

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

### 4. `/src/components/tx/burn-module-tokens.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 125 | `authenticatedFetch()` | `/api/gateway/api/v2/course/teacher/course-module/update` |

### 5. `/src/components/tx/assignment-update.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 199 | `authenticatedFetch()` | `/api/gateway/api/v2/course/student/commitment/submit` |

### 6. `/src/components/tx/pending-tx-list.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 146 | `authenticatedFetch()` | `/api/gateway/api/v2/tx/pending` |

### 7. `/src/components/tx/mint-access-token-simple.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 184 | `authenticatedFetch()` | `/api/gateway/api/v2/user/access-token-alias` |

### 8. `/src/components/tx/task-commit.tsx`
| Line | Pattern | Endpoint |
|------|---------|----------|
| 273 | `authenticatedFetch()` | `/api/gateway/api/v2/project/contributor/commitment/submit` |

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
