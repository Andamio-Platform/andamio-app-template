# Project Status

> **Last Updated**: January 21, 2026

Current implementation status of the Andamio T3 App Template.

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 15/15 routes |
| Project System | In Progress | 10/13 routes |
| Transaction System | **100% Complete** | 16/16 V2 components |
| Gateway Migration | **Complete** | Unified V2 Gateway |
| L1 Core Package | **Complete** | `@andamio/core` created |

---

## Current Focus: Layered Architecture L2/L3

**Status**: Phase 1 Complete, Ready for Phase 2

**Completed (L1 Core)**:
- `@andamio/core` package with hashing utilities and constants
- TX Watcher confirmation fixes (21 files updated)
- Gateway taxonomy compliance (41 files fixed)
- NullableString type helper utilities

**Next Steps (L2 Integration)**:
1. [ ] Reorganize hooks into `course/` and `project/` subdirectories
2. [ ] Remove deprecated `andamioscan.ts` (1497 lines)
3. [ ] Clean up remaining V1 patterns

---

## Current Blockers

| Blocker | Status | Notes |
|---------|--------|-------|
| **SLT Endpoints Schema Mismatch** | Blocking | SLT create/update/delete expect camelCase. [GitHub Issue #3](https://github.com/Andamio-Platform/andamio-api/issues/3) |
| **Project V2 Task Update/Delete** | Blocking | API returns 404 for existing tasks |
| **@andamio/transactions NPM** | Waiting | Available locally via workspace link |
| **Wallet Testing** | Pending | Nami, Flint, Yoroi, Lace need testing (Eternl works) |

**Resolved Recently**:
- OpenAPI NullableString Typing → Client-side fix with `getString()` utility
- Course Creation Metadata → Auto-registration works (Gateway v2.0.0-preprod-20260119-e)
- TX Watcher Confirmation → Added "confirmed" to terminal states

---

## API Coverage Summary

| Category | Coverage | Status |
|----------|----------|--------|
| TX: Courses | **100%** (6/6) | Complete |
| TX: Projects | **100%** (8/8) | Complete |
| Merged Projects | **85%** (17/20) | Good |
| Authentication | **83%** (5/6) | Good |
| TX: Instance/Global | **71%** (5/7) | Minor gaps |
| Merged Courses | **55%** (23/42) | 19 missing |
| **Overall** | **63%** (68/108) | - |

> Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.

**API Source of Truth**:
- **Gateway URL**: `https://andamio-api-gateway-666713068234.us-central1.run.app`
- **OpenAPI Spec**: `https://andamio-api-gateway-666713068234.us-central1.run.app/api/v1/docs/doc.json`

---

## System Status

### Course System (15/15 Routes)

**Public (Learner)** - 5 routes:
- `/course` - Course catalog
- `/course/[coursenft]` - Course detail with modules
- `/course/[coursenft]/[modulecode]` - Module detail with SLTs/lessons
- `/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson detail
- `/course/[coursenft]/[modulecode]/assignment` - Assignment with commitment flow

**Studio (Creator)** - 10 routes:
- `/studio` - Studio home dashboard
- `/studio/course` - Course management dashboard
- `/studio/course/[coursenft]` - Course editor
- `/studio/course/[coursenft]/instructor` - Instructor dashboard
- `/studio/course/[coursenft]/[modulecode]` - Module editor
- `/studio/course/[coursenft]/[modulecode]/slts` - SLT management
- `/studio/course/[coursenft]/[modulecode]/assignment` - Assignment editor
- `/studio/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson editor
- `/studio/course/[coursenft]/[modulecode]/introduction` - Introduction editor

### Project System (10/13 Routes)

**Public (Contributor)** - 4/4 routes:
- `/project` - Project catalog
- `/project/[projectid]` - Project detail with tasks
- `/project/[projectid]/contributor` - Contributor dashboard
- `/project/[projectid]/[taskhash]` - Task detail with commitment

**Studio (Manager)** - 6/9 routes:
- `/studio/project` - Project management
- `/studio/project/[projectid]` - Project dashboard
- `/studio/project/[projectid]/manager` - Manager dashboard
- `/studio/project/[projectid]/draft-tasks` - Task list management
- `/studio/project/[projectid]/draft-tasks/new` - Create new task
- `/studio/project/[projectid]/draft-tasks/[taskindex]` - Edit existing task
- `/studio/project/[projectid]/manage-treasury` - **Planned**
- `/studio/project/[projectid]/manage-contributors` - **Planned**
- `/studio/project/[projectid]/commitments` - **Planned**

### Transaction Components (16/16 Complete)

**Global**:
| Component | Definition | Status |
|-----------|------------|--------|
| `mint-access-token.tsx` | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | Hybrid (manual JWT) |

**Course System** (6):
| Component | Definition |
|-----------|------------|
| `create-course.tsx` | `INSTANCE_COURSE_CREATE` |
| `teachers-update.tsx` | `COURSE_OWNER_TEACHERS_MANAGE` |
| `mint-module-tokens.tsx` | `COURSE_TEACHER_MODULES_MANAGE` |
| `assess-assignment.tsx` | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` |
| `enroll-in-course.tsx` | `COURSE_STUDENT_ASSIGNMENT_COMMIT` |
| `assignment-update.tsx` | `COURSE_STUDENT_ASSIGNMENT_UPDATE` |
| `credential-claim.tsx` | `COURSE_STUDENT_CREDENTIAL_CLAIM` |

**Project System** (9):
| Component | Definition |
|-----------|------------|
| `create-project.tsx` | `INSTANCE_PROJECT_CREATE` |
| `managers-manage.tsx` | `PROJECT_OWNER_MANAGERS_MANAGE` |
| `blacklist-manage.tsx` | `PROJECT_OWNER_BLACKLIST_MANAGE` |
| `tasks-manage.tsx` | `PROJECT_MANAGER_TASKS_MANAGE` |
| `tasks-assess.tsx` | `PROJECT_MANAGER_TASKS_ASSESS` |
| `project-enroll.tsx` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` |
| `task-commit.tsx` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` |
| `task-action.tsx` | `PROJECT_CONTRIBUTOR_TASK_ACTION` |
| `project-credential-claim.tsx` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` |

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 15.x | Framework |
| @tanstack/react-query | ^5.x | Data fetching |
| @meshsdk/core | ^2.x | Cardano wallet |
| @tiptap/react | ^2.x | Rich text editor |
| @dnd-kit/core | ^6.x | Drag and drop |

---

## Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-01-09 | Go API Migration Complete | Complete |
| 2026-01-14 | Andamio Pioneers Launch | Complete |
| 2026-01-17/18 | V2 Gateway API Migration | Complete |
| 2026-01-21 | L1 Core Package + TX Fixes | Complete |
| **2026-02-06** | **Andamio V2 Mainnet Launch** | Upcoming |

---

## Session Archives

Detailed session notes are archived by week:

| Archive | Sessions | Period |
|---------|----------|--------|
| [2026-01-05-to-2026-01-11.md](./archived-sessions/2026-01-05-to-2026-01-11.md) | 1-4 | Go API migration, type packages, wallet auth |
| [2026-01-12-to-2026-01-18.md](./archived-sessions/2026-01-12-to-2026-01-18.md) | 5-20 | Pioneers launch, V2 Gateway, TX migration |
| [2026-01-19-to-2026-01-25.md](./archived-sessions/2026-01-19-to-2026-01-25.md) | 21-28 | TX Watcher fixes, L1 Core, taxonomy compliance |
