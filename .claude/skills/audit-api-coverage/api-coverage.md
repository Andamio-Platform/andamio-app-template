# API Coverage Status

> **Cross-reference of Unified API Gateway endpoints vs T3 App Template implementation**
> Last Updated: January 16, 2026
> **Status**: 🔄 Migration In Progress

This document tracks which API endpoints are implemented in the T3 App Template.

## Quick Reference

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| [Authentication](#authentication-2-endpoints) | 2 | 0 | **0%** |
| [User Management](#user-management-4-endpoints) | 4 | 0 | **0%** |
| [API Key Management](#api-key-management-3-endpoints) | 3 | 0 | **0%** |
| [Admin Functions](#admin-functions-3-endpoints) | 3 | 0 | **0%** |
| [Merged Courses](#merged-courses-3-endpoints) | 3 | 0 | **0%** |
| [Merged Projects](#merged-projects-3-endpoints) | 3 | 0 | **0%** |
| [Scan: Courses](#scan-courses-4-endpoints) | 4 | 4 | **100%** |
| [Scan: Projects](#scan-projects-4-endpoints) | 4 | 4 | **100%** |
| [Scan: Transactions](#scan-transactions-1-endpoint) | 1 | 0 | **0%** |
| [TX: Courses](#tx-course-operations-6-endpoints) | 6 | 6 | **100%** |
| [TX: Projects](#tx-project-operations-4-endpoints) | 4 | 4 | **100%** |
| [TX: Instance/Global](#tx-instanceglobal-operations-3-endpoints) | 3 | 3 | **100%** |
| **TOTAL** | **40** | **21** | **53%** |

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for current counts.

---

## Migration Status

The T3 App Template is migrating from 3 separate APIs to the Unified API Gateway.

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Rewrite audit-api-coverage skill | ✅ Complete |
| Phase 1 | Environment configuration | ⏳ Pending |
| Phase 2 | Authentication flow migration | ⏳ Pending |
| Phase 3 | API client migration | ⏳ Pending |
| Phase 4 | Transaction definitions update | ⏳ Pending |
| Phase 5 | Documentation updates | ⏳ Pending |

---

## Authentication (2 endpoints)

**Status**: ⏳ **Not migrated** - Still using old DB API auth flow

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/auth/login` | POST | - | ⏳ |
| `/auth/register` | POST | - | ⏳ |

**Notes**:
- Current auth uses 2-step flow (session → validate)
- New unified endpoint uses single `/auth/login`
- Migration requires updating `src/lib/andamio-auth.ts`

---

## User Management (4 endpoints)

**Status**: ⏳ **Not migrated**

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/user/me` | GET | - | ⏳ |
| `/user/delete` | POST | - | ⏳ |
| `/user/usage` | GET | - | ⏳ |
| `/user/usage/daily` | POST | - | ⏳ |

---

## API Key Management (3 endpoints)

**Status**: ⏳ **New capability** - Not yet implemented

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/apikey/request` | POST | - | ⏳ |
| `/apikey/delete` | POST | - | ⏳ |
| `/apikey/rotate` | POST | - | ⏳ |

**Notes**: New feature for programmatic API access.

---

## Admin Functions (3 endpoints)

**Status**: ⏳ **New capability** - Not yet implemented

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/admin/set-user-role` | POST | - | ⏳ |
| `/admin/usage/user-api-usage` | POST | - | ⏳ |
| `/admin/usage/any-user-daily-api-usage` | POST | - | ⏳ |

---

## Merged Courses (3 endpoints)

**Status**: ⏳ **Not migrated** - New unified endpoints

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/api/v2/course/user/courses/list` | GET | - | ⏳ |
| `/api/v2/course/user/course/get/{policy_id}` | GET | - | ⏳ |
| `/api/v2/course/student/course-status` | POST | - | ⏳ |

**Notes**:
- These merge DB API + Andamioscan data
- Will replace separate calls to both APIs
- Requires new hooks in `src/hooks/api/`

---

## Merged Projects (3 endpoints)

**Status**: ⏳ **Not migrated** - New unified endpoints

| Endpoint | Method | Implementation | Status |
|----------|--------|----------------|--------|
| `/api/v2/project/user/projects/list` | GET | - | ⏳ |
| `/api/v2/project/user/project/{project_id}` | GET | - | ⏳ |
| `/api/v2/project/contributor/status/{project_id}/{alias}` | GET | - | ⏳ |

---

## Scan: Courses (4 endpoints)

**Status**: ✅ **Implemented** via `src/lib/andamioscan.ts`

| Endpoint | Method | Function | Status |
|----------|--------|----------|--------|
| `/v2/courses` | GET | `getAllCourses()` | ✅ |
| `/v2/courses/{course_id}/details` | GET | `getCourse()` | ✅ |
| `/v2/courses/{course_id}/students/{student_alias}/status` | GET | `getCourseStudent()` | ✅ |
| `/v2/courses/teachers/{alias}/assessments/pending` | GET | `getPendingAssessments()` | ✅ |

**Notes**: These are passthrough to Andamioscan. Base URL needs updating to gateway.

---

## Scan: Projects (4 endpoints)

**Status**: ✅ **Implemented** via `src/lib/andamioscan.ts`

| Endpoint | Method | Function | Status |
|----------|--------|----------|--------|
| `/v2/projects` | GET | `getAllProjects()` | ✅ |
| `/v2/projects/{project_id}/details` | GET | `getProject()` | ✅ |
| `/v2/projects/{project_id}/contributors/{contributor_alias}/status` | GET | `getProjectContributorStatus()` | ✅ |
| `/v2/projects/managers/{alias}/assessments/pending` | GET | `getManagerPendingAssessments()` | ✅ |

---

## Scan: Transactions (1 endpoint)

**Status**: ⏳ **Not implemented**

| Endpoint | Method | Function | Status |
|----------|--------|----------|--------|
| `/v2/transactions` | GET | - | ⏳ |

---

## TX: Course Operations (6 endpoints)

**Status**: ✅ **Complete** - All transaction definitions exist

| Endpoint | Method | Transaction Type | Component |
|----------|--------|------------------|-----------|
| `/v2/tx/course/student/assignment/commit` | POST | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `enroll-in-course.tsx` |
| `/v2/tx/course/student/assignment/update` | POST | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment-update.tsx` |
| `/v2/tx/course/student/credential/claim` | POST | `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential-claim.tsx` |
| `/v2/tx/course/teacher/assignments/assess` | POST | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assess-assignment.tsx` |
| `/v2/tx/course/teacher/modules/manage` | POST | `COURSE_TEACHER_MODULES_MANAGE` | `mint-module-tokens.tsx` |
| `/v2/tx/course/owner/teachers/manage` | POST | `COURSE_OWNER_TEACHERS_MANAGE` | `teachers-update.tsx` |

---

## TX: Project Operations (4 endpoints)

**Status**: ✅ **Complete** - All transaction definitions exist

| Endpoint | Method | Transaction Type | Component |
|----------|--------|------------------|-----------|
| `/v2/tx/project/contributor/task/commit` | POST | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task-commit.tsx` |
| `/v2/tx/project/contributor/task/action` | POST | `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task-action.tsx` |
| `/v2/tx/project/contributor/credential/claim` | POST | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project-credential-claim.tsx` |
| `/v2/tx/project/manager/tasks/assess` | POST | `PROJECT_MANAGER_TASKS_ASSESS` | `tasks-assess.tsx` |

### Additional TX Endpoints (not yet in gateway)

These transaction types have definitions but may not be exposed via gateway yet:

| Transaction Type | Component | Gateway Status |
|------------------|-----------|----------------|
| `PROJECT_OWNER_MANAGERS_MANAGE` | `managers-manage.tsx` | ⏳ TBD |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist-manage.tsx` | ⏳ TBD |
| `PROJECT_MANAGER_TASKS_MANAGE` | `tasks-manage.tsx` | ⏳ TBD |

---

## TX: Instance/Global Operations (3 endpoints)

**Status**: ✅ **Complete**

| Endpoint | Method | Transaction Type | Component |
|----------|--------|------------------|-----------|
| `/v2/tx/global/user/access-token/mint` | POST | `GLOBAL_ACCESS_TOKEN_MINT` | `mint-access-token.tsx` |
| `/v2/tx/instance/owner/course/create` | POST | `INSTANCE_COURSE_CREATE` | `create-course.tsx` |
| `/v2/tx/instance/owner/project/create` | POST | `INSTANCE_PROJECT_CREATE` | `create-project.tsx` |

---

## Implementation Reference

### Current Implementation Locations

| Category | Location | Notes |
|----------|----------|-------|
| Auth | `src/lib/andamio-auth.ts`, `src/contexts/andamio-auth-context.tsx` | Needs migration |
| Scan Client | `src/lib/andamioscan.ts` | Update base URL |
| API Hooks | `src/hooks/api/*.ts` | Add merged endpoint hooks |
| TX Definitions | `packages/andamio-transactions/src/definitions/v2/` | Base URL only |
| TX Components | `src/components/transactions/` | No changes needed |

### Environment Variable Migration

| Before | After |
|--------|-------|
| `NEXT_PUBLIC_ANDAMIO_API_URL` | `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL` |
| `ANDAMIOSCAN_API_URL` (server) | Remove |
| `ATLAS_TX_API_URL` (server) | Remove |

---

## Related Documentation

- [SKILL.md](./SKILL.md) - Skill instructions and workflow
- [unified-api-endpoints.md](./unified-api-endpoints.md) - All gateway endpoints
- [COVERAGE-REPORT.md](./COVERAGE-REPORT.md) - Auto-generated coverage report

---

**Last Updated**: January 16, 2026
**Migration Status**: 🔄 In Progress
**Maintained By**: Andamio Platform Team
