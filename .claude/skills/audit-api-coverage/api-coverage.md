# API Coverage Status

> **Cross-reference of Andamio Database API endpoints vs T3 App Template implementation**
> Last Updated: December 19, 2025
> API Version: **v0** (Unstable)

This document tracks which API endpoints are implemented in the T3 App Template and which remain to be built.

---

## Coverage Summary

| Category | Available | Implemented | Coverage | Hook Coverage | Status |
|----------|-----------|-------------|----------|---------------|--------|
| Authentication | 2 | 2 | **100%** | 0% (lib) | Complete |
| Access Token | 3 | 2 | 67% | 0% | Partial |
| Course | 9 | 6 | 67% | 33% | Partial |
| Course Module | 11 | 7 | 64% | 29% | Partial |
| SLT | 7 | 4 | 57% | 50% | Partial |
| Introduction | 4 | 3 | 75% | 0% | Partial |
| Lesson | 6 | 3 | 50% | 0% | Partial |
| Assignment | 5 | 3 | 60% | 0% | Partial |
| Assignment Commitment | 6 | 5 | 83% | 0% | Near Complete |
| Role Creation (deprecated) | 2 | 2 | **100%** | 0% | Complete |
| Contributor | 1 | 0 | **0%** | 0% | Not Started |
| Task Commitments | 7 | 1 | 14% | 0% | Minimal |
| Task Management | 4 | 4 | **100%** | 0% | Complete |
| Projects/Treasury | 4 | 4 | **100%** | 0% | Complete |
| Credentials | 1 | 1 | **100%** | 0% | Complete |
| My Learning | 1 | 1 | **100%** | 0% | Complete |
| Transaction | 1 | 1 | **100%** | **100%** | Complete |
| **TOTAL** | **~74** | **~49** | **~66%** | **~8%** | |

**Note**: "Hook Coverage" indicates endpoints accessed via dedicated React Query hooks vs raw `fetch()` calls. Phase 2 will migrate all endpoints to hooks.

---

## Implementation Status by Category

### Authentication - 100% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/auth/login/session` | POST | Implemented | N/A | `lib/andamio-auth.ts` |
| `/auth/login/validate` | POST | Implemented | N/A | `lib/andamio-auth.ts` |

### Access Token - 67% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/access-token/update-alias` | POST | Implemented | No | `contexts/andamio-auth-context.tsx`, `components/transactions/mint-access-token.tsx` |
| `/access-token/update-unconfirmed-tx` | POST | Implemented | No | `hooks/use-andamio-transaction.ts`, `hooks/use-pending-tx-watcher.ts` |
| `/access-token/unconfirmed-tx` | GET | **NOT USED** | - | Client-side tracking used instead |

### Course - 67% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/course/list` | POST | Implemented | **Yes** | `hooks/use-owned-courses.ts`, multiple pages |
| `/course/published` | GET | Implemented | No | `app/(app)/course/page.tsx`, `sitemap/page.tsx` |
| `/course/get` | POST | Implemented | Partial | `hooks/use-module-wizard-data.ts`, multiple pages |
| `/course/update` | PATCH | Implemented | No | `app/(studio)/studio/course/[coursenft]/page.tsx` |
| `/course/delete` | DELETE | Implemented | No | `app/(studio)/studio/course/[coursenft]/page.tsx` |
| `/course/create-on-submit-minting-tx` | POST | Implemented | No | `components/courses/on-chain-courses-section.tsx` |
| `/course/check` | POST | **NOT USED** | - | Validation before course creation |
| `/course/confirm-minting-tx` | POST | **NOT USED** | - | Complete course minting flow |
| `/course/import` | POST | **NOT USED** | - | Admin course import (low priority) |
| `/course/unpublished-projects` | POST | **NOT USED** | - | Project prerequisite checking |

### Course Module - 64% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/course-module/list` | POST | Implemented | Partial | `hooks/use-hybrid-slts.ts`, multiple pages |
| `/course-module/map` | POST | Implemented | **Yes** | `hooks/use-owned-courses.ts` |
| `/course-module/get` | POST | Implemented | Partial | `hooks/use-module-wizard-data.ts`, multiple pages |
| `/course-module/create` | POST | Implemented | No | `components/courses/on-chain-modules-section.tsx`, `step-credential.tsx` |
| `/course-module/update` | PATCH | Implemented | No | `components/studio/wizard/steps/step-credential.tsx` |
| `/course-module/update-status` | PATCH | Implemented | No | `components/studio/wizard/steps/step-review.tsx` |
| `/course-module/confirm-transaction` | POST | Implemented | Partial | `hooks/use-pending-tx-watcher.ts` |
| `/course-module/delete` | DELETE | **NOT USED** | - | Module deletion |
| `/course-module/with-assignments` | POST | **NOT USED** | - | Assignment summary |
| `/course-module/batch-update-status` | POST | **NOT USED** | - | Bulk status updates |
| `/course-module/batch-confirm` | POST | **NOT USED** | - | Bulk tx confirmation |

### SLT (Student Learning Targets) - 57% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/slt/list` | POST | Implemented | **Yes** | `hooks/use-hybrid-slts.ts`, `hooks/use-module-wizard-data.ts` |
| `/slt/create` | POST | Implemented | No | `components/courses/on-chain-modules-section.tsx`, `step-slts.tsx` |
| `/slt/update` | PATCH | Implemented | No | `components/studio/wizard/steps/step-slts.tsx` |
| `/slt/delete` | DELETE | Implemented | No | `components/studio/wizard/steps/step-slts.tsx` |
| `/slt/get` | POST | **NOT USED** | - | Individual SLT fetch |
| `/slt/reorder` | POST | **NOT USED** | - | Drag-and-drop reordering |
| `/slt/update-index` | POST | **NOT USED** | - | Individual index update |

### Introduction - 75% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/introduction/get` | POST | Implemented | Partial | `hooks/use-module-wizard-data.ts`, `module-wizard.tsx` |
| `/introduction/create` | POST | Implemented | No | `components/studio/wizard/steps/step-introduction.tsx` |
| `/introduction/update` | POST | Implemented | No | `components/studio/wizard/steps/step-introduction.tsx` |
| `/introduction/publish` | POST | **NOT USED** | - | Publish introduction |

### Lesson - 50% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/lesson/list` | POST | Implemented | Partial | `hooks/use-module-wizard-data.ts`, multiple pages |
| `/lesson/get` | POST | Implemented | No | `app/(app)/course/.../[moduleindex]/page.tsx` |
| `/lesson/create` | POST | Implemented | No | `components/studio/wizard/steps/step-lessons.tsx` |
| `/lesson/update` | POST | **NOT USED** | - | Update lesson |
| `/lesson/delete` | POST | **NOT USED** | - | Delete lesson |
| `/lesson/publish` | POST | **NOT USED** | - | Publish lesson |

### Assignment - 60% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/assignment/get` | POST | Implemented | Partial | `hooks/use-module-wizard-data.ts`, `module-wizard.tsx` |
| `/assignment/create` | POST | Implemented | No | `components/studio/wizard/steps/step-assignment.tsx` |
| `/assignment/update` | PATCH | Implemented | No | `components/studio/wizard/steps/step-assignment.tsx` |
| `/assignment/delete` | DELETE | **NOT USED** | - | Delete assignment |
| `/assignment/publish` | POST | **NOT USED** | - | Publish assignment |

### Assignment Commitment - 83% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/assignment-commitment/list` | POST | Implemented | No | `components/learner/assignment-commitment.tsx` |
| `/assignment-commitment/update-evidence` | PATCH | Implemented | No | `components/learner/assignment-commitment.tsx` |
| `/assignment-commitment/delete` | DELETE | Implemented | No | `components/learner/assignment-commitment.tsx` |
| `/assignment-commitment/by-course` | POST | Implemented | No | `app/(app)/studio/.../instructor/page.tsx` |
| `/assignment-commitment/update-status` | PATCH | Implemented | Partial | `hooks/use-pending-tx-watcher.ts` |
| `/assignment-commitment/create` | POST | **NOT USED** | - | Learner enrollment |

### Projects/Treasury - 100% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/projects/list` | GET | Implemented | No | `app/(app)/project/page.tsx`, `sitemap/page.tsx` |
| `/projects/owned` | GET | Implemented | No | `app/(app)/sitemap/page.tsx` |
| `/projects/list-owned` | GET | Implemented | No | `app/(app)/studio/project/page.tsx` |
| `/projects/update` | PATCH | Implemented | No | `app/(app)/studio/project/[treasurynft]/page.tsx` |

### Task Management - 100% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/tasks/list` | POST | Implemented | No | Multiple project pages |
| `/tasks/create` | POST | Implemented | No | `draft-tasks/new/page.tsx` |
| `/tasks/update` | PATCH | Implemented | No | `draft-tasks/[taskindex]/page.tsx` |
| `/tasks/delete` | DELETE | Implemented | No | `draft-tasks/page.tsx` |

### Task Commitments - 14% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/task-commitments/get` | POST | Implemented | No | `project/[treasurynft]/[taskhash]/page.tsx` |
| `/task-commitments/list` | POST | **NOT USED** | - | Contributor dashboard |
| `/task-commitments/create` | POST | **NOT USED** | - | Task claiming workflow |
| `/task-commitments/update-evidence` | POST | **NOT USED** | - | Task submission |
| `/task-commitments/update-status` | POST | **NOT USED** | - | Task progress tracking |
| `/task-commitments/delete` | POST | **NOT USED** | - | Task cancellation |
| `/task-commitments/confirm-transaction` | POST | **NOT USED** | - | Task completion on-chain |

### Contributor - 0% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/contributors/create` | POST | **NOT USED** | - | Contributor onboarding |

### Credentials - 100% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/credential/list` | POST | Implemented | No | `components/learner/user-course-status.tsx` |

### My Learning - 100% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/my-learning/get` | POST | Implemented | No | `components/learner/my-learning.tsx` |

### Transaction - 100% Complete

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/transaction/pending-transactions` | GET | Implemented | **Yes** | `hooks/use-pending-transactions.ts`, `hooks/use-pending-tx-watcher.ts` |

### Role Creation (Deprecated) - In Use

| Endpoint | Method | Status | Hook | Location |
|----------|--------|--------|------|----------|
| `/creator/create` | POST | Implemented | No | `contexts/andamio-auth-context.tsx` |
| `/learner/create` | POST | Implemented | No | `contexts/andamio-auth-context.tsx` |

---

## React Query Hook Coverage

Currently, only **4 dedicated hooks** wrap API endpoints:

| Hook | Endpoints Covered | React Query |
|------|-------------------|-------------|
| `useOwnedCourses` | `/course/list`, `/course-module/map` | No (useState) |
| `usePendingTransactions` | `/transaction/pending-transactions` | No (useState) |
| `useHybridSlts` | `/slt/list`, `/course-module/list` | No (useState) |
| `useModuleWizardData` | Multiple read endpoints | No (useState) |

**Phase 2 Goal**: Migrate all endpoints to React Query hooks for:
- Automatic caching and deduplication
- Background refetching
- Optimistic updates
- Proper error/loading states

---

## Priority Implementation Gaps

### High Priority (Core Flow Blockers)

| Endpoint | Impact | Use Case |
|----------|--------|----------|
| `/assignment-commitment/create` | Learner UX | Allow learners to enroll in assignments |
| `/lesson/update` | Creator UX | Allow editing existing lessons |
| `/lesson/publish` | Creator UX | Control lesson visibility |
| `/assignment/publish` | Creator UX | Control assignment visibility |

### Medium Priority (Contributor Features)

| Endpoint | Impact | Use Case |
|----------|--------|----------|
| `/task-commitments/create` | Contributor | Claim tasks from projects |
| `/task-commitments/list` | Contributor | View claimed tasks dashboard |
| `/task-commitments/update-evidence` | Contributor | Submit work for review |
| `/task-commitments/update-status` | Contributor | Track task progress |
| `/task-commitments/confirm-transaction` | Blockchain | Confirm task completion |
| `/contributors/create` | Contributor | Register as contributor |

### Low Priority (Optimization/Admin)

| Endpoint | Impact | Use Case |
|----------|--------|----------|
| `/course-module/batch-update-status` | Performance | Bulk operations |
| `/course-module/batch-confirm` | Performance | Bulk confirmations |
| `/course/check` | UX | Course code validation |
| `/course/import` | Admin | Bulk course import |
| `/slt/reorder` | UX | Drag-and-drop SLT ordering |

---

## User Journey Coverage

### Creator Journey - 85% Complete

```
Create Course     Implemented  /course/create-on-submit-minting-tx
Add Modules       Implemented  /course-module/create
Define SLTs       Implemented  /slt/create
Create Lessons    Implemented  /lesson/create
Edit Lessons      NOT IMPL     /lesson/update ← NEEDED
Create Assignment Implemented  /assignment/create
Publish           NOT IMPL     /lesson/publish, /assignment/publish ← NEEDED
Review Students   Implemented  /assignment-commitment/by-course
```

### Learner Journey - 80% Complete

```
Browse Courses    Implemented  /course/published
View Course       Implemented  /course/get
View Lessons      Implemented  /lesson/get
Start Assignment  NOT IMPL     /assignment-commitment/create ← NEEDED
Submit Work       Implemented  /assignment-commitment/update-evidence
Track Progress    Implemented  /credential/list, /my-learning/get
```

### Contributor Journey - 20% Complete

```
Browse Projects   Implemented  /projects/list
View Tasks        Implemented  /tasks/list
Claim Task        NOT IMPL     /task-commitments/create ← NEEDED
Submit Work       NOT IMPL     /task-commitments/update-evidence ← NEEDED
Track Progress    NOT IMPL     /task-commitments/list ← NEEDED
```

### Project Manager Journey - 100% Complete

```
List Projects     Implemented  /projects/list-owned
Create Tasks      Implemented  /tasks/create
Update Tasks      Implemented  /tasks/update
Delete Tasks      Implemented  /tasks/delete
Update Project    Implemented  /projects/update
```

---

## Phase 2 Migration Targets

The following endpoints need to be migrated from raw `fetch()` to React Query hooks:

### Priority 1: High-traffic read endpoints
- `/course/published` - Course catalog
- `/course/get` - Course detail pages
- `/course-module/list` - Module listings
- `/lesson/list` - Lesson listings
- `/projects/list` - Project catalog

### Priority 2: Authenticated data
- `/credential/list` - Learner progress
- `/my-learning/get` - Dashboard data
- `/assignment-commitment/list` - Learner commitments
- `/assignment-commitment/by-course` - Instructor view

### Priority 3: Write operations (mutations)
- All create/update/delete operations

---

## Related Documentation

- [API-ENDPOINT-REFERENCE.md](./api-endpoint-reference.md) - Full endpoint documentation
- [data-sources.md](./data-sources.md) - API systems overview
- [query-patterns.md](./query-patterns.md) - React Query patterns

---

**Last Updated**: December 19, 2025
**Maintained By**: Andamio Platform Team
