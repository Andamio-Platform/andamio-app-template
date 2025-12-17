# API Coverage Status

> **Cross-reference of Andamio Database API endpoints vs T3 App Template implementation**
> Last Updated: December 17, 2024
> API Version: **v0** (Unstable)

This document tracks which API endpoints are implemented in the T3 App Template and which remain to be built.

---

## Coverage Summary

| Category | Available | Implemented | Coverage | Status |
|----------|-----------|-------------|----------|--------|
| Authentication | 2 | 2 | **100%** | Complete |
| Access Token | 3 | 2 | 67% | Partial |
| Course | 9 | 7 | 78% | Partial |
| Course Module | 11 | 10 | 91% | Near Complete |
| SLT | 7 | 6 | 86% | Near Complete |
| Introduction | 4 | 4 | **100%** | Complete |
| Lesson | 6 | 6 | **100%** | Complete |
| Assignment | 5 | 5 | **100%** | Complete |
| Assignment Commitment | 8 | 5 | 63% | Partial |
| Role Creation (deprecated) | 2 | 2 | **100%** | Complete |
| Contributor | 1 | 0 | **0%** | Not Started |
| Task Commitments | 7 | 1 | 14% | Minimal |
| Task Management | 4 | 4 | **100%** | Complete |
| Projects/Treasury | 3 | 3 | **100%** | Complete |
| Prerequisites | 1 | 0 | **0%** | Not Started |
| Credentials | 1 | 1 | **100%** | Complete |
| My Learning | 1 | 1 | **100%** | Complete |
| Transaction | 1 | 1 | **100%** | Complete |
| **TOTAL** | **~76** | **~60** | **~79%** | |

---

## Implementation Status by Category

### Authentication - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/auth/login/session` | POST | Implemented | `lib/andamio-auth.ts:45` |
| `/auth/login/validate` | POST | Implemented | `lib/andamio-auth.ts:85` |

### Access Token - 67% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/access-token/update-alias` | POST | Implemented | `contexts/andamio-auth-context.tsx`, `components/transactions/mint-access-token.tsx` |
| `/access-token/update-unconfirmed-tx` | POST | Implemented | `hooks/use-andamio-transaction.ts`, `hooks/use-pending-tx-watcher.ts` |
| `/access-token/unconfirmed-tx` | GET | **NOT IMPLEMENTED** | Client-side tracking used instead |

### Course - 78% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/course/list` | POST | Implemented | `hooks/use-owned-courses.ts`, `components/courses/on-chain-courses-section.tsx` |
| `/course/published` | GET | Implemented | `app/(app)/course/page.tsx` |
| `/course/get` | POST | Implemented | Multiple pages (course detail, studio) |
| `/course/update` | PATCH | Implemented | `app/(app)/studio/course/[coursenft]/page.tsx` |
| `/course/delete` | DELETE | Implemented | `app/(app)/studio/course/[coursenft]/page.tsx` |
| `/course/create-on-submit-minting-tx` | POST | Implemented | `components/courses/on-chain-courses-section.tsx` |
| `/course/unpublished-projects` | GET | Implemented | `app/(app)/studio/course/[coursenft]/page.tsx` |
| `/course/check` | POST | **NOT IMPLEMENTED** | Validation before course creation |
| `/course/confirm-minting-tx` | POST | **NOT IMPLEMENTED** | Complete course minting flow |
| `/course/import` | POST | **NOT IMPLEMENTED** | Admin course import (low priority) |

### Course Module - 91% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/course-module/list` | POST | Implemented | Multiple locations |
| `/course-module/map` | POST | Implemented | `hooks/use-owned-courses.ts` |
| `/course-module/get` | POST | Implemented | Multiple pages |
| `/course-module/create` | POST | Implemented | `components/courses/create-module-dialog.tsx`, `on-chain-modules-section.tsx` |
| `/course-module/update` | PATCH | Implemented | `app/(app)/studio/.../[modulecode]/page.tsx` |
| `/course-module/update-status` | PATCH | Implemented | `app/(app)/studio/.../[modulecode]/page.tsx` |
| `/course-module/delete` | DELETE | Implemented | `app/(app)/studio/.../[modulecode]/page.tsx` |
| `/course-module/with-assignments` | GET | Implemented | `app/(app)/studio/course/[coursenft]/page.tsx` |
| `/course-module/confirm-transaction` | POST | Implemented | `hooks/use-pending-tx-watcher.ts` |
| `/course-module/batch-update-status` | POST | **NOT IMPLEMENTED** | Bulk status updates (optimization) |
| `/course-module/batch-confirm` | POST | **NOT IMPLEMENTED** | Bulk tx confirmation (optimization) |

### SLT (Student Learning Targets) - 86% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/slt/list` | POST | Implemented | Multiple pages, `hooks/use-hybrid-slts.ts` |
| `/slt/create` | POST | Implemented | `on-chain-modules-section.tsx`, `hybrid-slt-status.tsx`, SLTs page |
| `/slt/update` | PATCH | Implemented | `app/(app)/studio/.../slts/page.tsx` |
| `/slt/delete` | DELETE | Implemented | `app/(app)/studio/.../slts/page.tsx` |
| `/slt/reorder` | POST | Implemented | `app/(app)/studio/.../slts/page.tsx` |
| `/slt/get` | POST | Implemented | `app/(app)/studio/.../slts/page.tsx` |
| `/slt/update-index` | POST | **NOT IMPLEMENTED** | Using reorder instead |

### Introduction - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/introduction/get` | POST | Implemented | `app/(app)/studio/.../introduction/page.tsx:116` |
| `/introduction/create` | POST | Implemented | `app/(app)/studio/.../introduction/page.tsx:237` |
| `/introduction/update` | POST | Implemented | `app/(app)/studio/.../introduction/page.tsx:198` |
| `/introduction/publish` | POST | Implemented | `app/(app)/studio/.../introduction/page.tsx:275` |

### Lesson - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/lesson/list` | POST | Implemented | `app/(app)/course/.../[modulecode]/page.tsx`, SLTs page |
| `/lesson/get` | POST | Implemented | Module viewer and editor pages |
| `/lesson/create` | POST | Implemented | `app/(app)/studio/.../[moduleindex]/page.tsx:250` |
| `/lesson/update` | POST | Implemented | `app/(app)/studio/.../[moduleindex]/page.tsx:197` |
| `/lesson/delete` | POST | Implemented | `app/(app)/studio/.../[moduleindex]/page.tsx:304` |
| `/lesson/publish` | POST | Implemented | `app/(app)/studio/.../[moduleindex]/page.tsx:342` |

### Assignment - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/assignment/get` | POST | Implemented | Assignment viewer and editor pages |
| `/assignment/create` | POST | Implemented | `app/(app)/studio/.../assignment/page.tsx:273` |
| `/assignment/update` | PATCH | Implemented | `app/(app)/studio/.../assignment/page.tsx:232` |
| `/assignment/delete` | DELETE | Implemented | `app/(app)/studio/.../assignment/page.tsx:314` |
| `/assignment/publish` | POST | Implemented | `app/(app)/studio/.../assignment/page.tsx:351` |

### Assignment Commitment - 63% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/assignment-commitment/list` | POST | Implemented | `components/learner/assignment-commitment.tsx` |
| `/assignment-commitment/update-evidence` | PATCH | Implemented | `components/learner/assignment-commitment.tsx` |
| `/assignment-commitment/delete` | DELETE | Implemented | `components/learner/assignment-commitment.tsx` |
| `/assignment-commitment/by-course` | POST | Implemented | `app/(app)/studio/.../instructor/page.tsx` |
| `/assignment-commitment/update-status` | PATCH | Implemented | `hooks/use-pending-tx-watcher.ts` |
| `/assignment-commitment/create` | POST | **NOT IMPLEMENTED** | Learner enrollment flow |
| `/assignment-commitment/has-any` | POST | **NOT IMPLEMENTED** | Deprecated endpoint |
| `/assignment-commitment/review` | POST | **NOT IMPLEMENTED** | Instructor grading workflow |

### Projects/Treasury - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/projects/list` | POST | Implemented | `app/(app)/project/page.tsx`, `sitemap/page.tsx` |
| `/projects/list-owned` | POST | Implemented | `app/(app)/studio/project/page.tsx` |
| `/projects/update` | POST | Implemented | `app/(app)/studio/project/[treasurynft]/page.tsx` |

### Task Management - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/tasks/list` | POST | Implemented | Project pages, studio project pages |
| `/tasks/create` | POST | Implemented | `app/(app)/studio/.../draft-tasks/new/page.tsx` |
| `/tasks/update` | POST | Implemented | `app/(app)/studio/.../draft-tasks/[taskindex]/page.tsx` |
| `/tasks/delete` | DELETE | Implemented | `app/(app)/studio/.../draft-tasks/page.tsx` |

### Task Commitments - 14% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/task-commitments/get` | POST | Implemented | `app/(app)/project/[treasurynft]/[taskhash]/page.tsx` |
| `/task-commitments/list` | POST | **NOT IMPLEMENTED** | Contributor dashboard |
| `/task-commitments/create` | POST | **NOT IMPLEMENTED** | Task claiming workflow |
| `/task-commitments/update-evidence` | POST | **NOT IMPLEMENTED** | Task submission |
| `/task-commitments/update-status` | POST | **NOT IMPLEMENTED** | Task progress tracking |
| `/task-commitments/delete` | POST | **NOT IMPLEMENTED** | Task cancellation |
| `/task-commitments/confirm-transaction` | POST | **NOT IMPLEMENTED** | Task completion on-chain |

### Contributor - 0% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/contributors/create` | POST | **NOT IMPLEMENTED** | Contributor onboarding |

### Prerequisites - 0% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/prerequisites/list-on-chain` | POST | **NOT IMPLEMENTED** | Prerequisite validation |

### Credentials - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/credential/list` | POST | Implemented | `components/learner/user-course-status.tsx` |

### My Learning - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/my-learning/get` | POST | Implemented | `components/learner/my-learning.tsx` |

### Transaction - 100% Complete

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/transaction/pending-transactions` | GET | Implemented | `hooks/use-pending-transactions.ts`, `hooks/use-pending-tx-watcher.ts` |

### Role Creation (Deprecated) - In Use

| Endpoint | Method | Status | Location |
|----------|--------|--------|----------|
| `/creator/create` | POST | Implemented | `contexts/andamio-auth-context.tsx` |
| `/learner/create` | POST | Implemented | `contexts/andamio-auth-context.tsx` |

---

## Priority Implementation Gaps

### High Priority (Core Flow Blockers)

| Endpoint | Impact | Use Case |
|----------|--------|----------|
| `/course/confirm-minting-tx` | Blockchain | Complete course creation confirmation |
| `/assignment-commitment/create` | Learner UX | Allow learners to enroll in assignments |
| `/assignment-commitment/review` | Instructor UX | Allow instructors to grade submissions |

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
| `/prerequisites/list-on-chain` | UX | Prerequisite checking |
| `/access-token/unconfirmed-tx` | Server-side | Replace client tracking |

---

## User Journey Coverage

### Creator Journey - 95% Complete

```
Create Course     Implemented  /course/create-on-submit-minting-tx
Add Modules       Implemented  /course-module/create
Define SLTs       Implemented  /slt/create
Create Lessons    Implemented  /lesson/create
Create Assignment Implemented  /assignment/create
Publish           Implemented  /assignment/publish
Review Students   Implemented  /assignment-commitment/by-course
Grade Students    NOT IMPL     /assignment-commitment/review ← NEEDED
```

### Learner Journey - 70% Complete

```
Browse Courses    Implemented  /course/published
View Course       Implemented  /course/get
View Lessons      Implemented  /lesson/get
Start Assignment  NOT IMPL     /assignment-commitment/create ← NEEDED
Submit Work       Implemented  /assignment-commitment/update-evidence
Track Progress    Implemented  /credential/list, /my-learning/get
```

### Contributor Journey - 30% Complete

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

## Related Documentation

- [API-ENDPOINT-REFERENCE.md](./API-ENDPOINT-REFERENCE.md) - Full endpoint documentation
- [SITEMAP.md](../SITEMAP.md) - Route and page mapping
- [sitemaps/README.md](../sitemaps/README.md) - API systems overview

---

**Last Updated**: December 17, 2024
**Maintained By**: Andamio Platform Team
