# API Coverage Report

> **Generated**: 2026-01-16T18:06:40.494Z
> **Overall Coverage**: 56% (25/45 endpoints)

## Summary

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| Authentication | 2 | 1 | **50%** |
| User Management | 5 | 1 | **20%** |
| API Key Management | 3 | 0 | **0%** |
| Admin Functions | 3 | 0 | **0%** |
| Merged Courses | 3 | 0 | **0%** |
| Merged Projects | 3 | 0 | **0%** |
| Scan: Courses | 4 | 4 | **100%** |
| Scan: Projects | 4 | 4 | **100%** |
| Scan: Transactions | 1 | 0 | **0%** |
| TX: Courses | 6 | 6 | **100%** |
| TX: Projects | 8 | 7 | **88%** |
| TX: Instance/Global | 3 | 2 | **67%** |

---

## Unified API Gateway

**Base URL**: `https://dev-api.andamio.io`
**Coverage**: 25/45 (56%)

### Implemented Categories

| Category | Coverage | Notes |
|----------|----------|-------|
| Scan: Courses | 4/4 (100%) | `src/lib/andamioscan.ts` |
| Scan: Projects | 4/4 (100%) | `src/lib/andamioscan.ts` |
| TX: Courses | 6/6 (100%) | `packages/andamio-transactions/src/definitions/v2/course/owner/teachers-manage.ts` |

### Missing Categories

| Category | Count | Notes |
|----------|-------|-------|
| Authentication | 1 | Partially implemented |
| User Management | 4 | Partially implemented |
| API Key Management | 3 | Not implemented |
| Admin Functions | 3 | Not implemented |
| Merged Courses | 3 | Not implemented |
| Merged Projects | 3 | Not implemented |
| Scan: Transactions | 1 | Not implemented |
| TX: Projects | 1 | Partially implemented |
| TX: Instance/Global | 1 | Partially implemented |

### Missing Endpoints

| Method | Path |
|--------|------|
| POST | `/auth/register` |
| POST | `/user/delete` |
| GET | `/user/me` |
| GET | `/user/usage` |
| POST | `/user/usage/daily` |
| POST | `/apikey/delete` |
| POST | `/apikey/request` |
| POST | `/apikey/rotate` |
| POST | `/admin/set-user-role` |
| POST | `/admin/usage/any-user-daily-api-usage` |
| POST | `/admin/usage/user-api-usage` |
| POST | `/api/v2/course/student/course-status` |
| GET | `/api/v2/course/user/course/get/{policy_id}` |
| GET | `/api/v2/course/user/courses/list` |
| GET | `/api/v2/project/contributor/status/{project_id}/{alias}` |
| GET | `/api/v2/project/user/project/{project_id}` |
| GET | `/api/v2/project/user/projects/list` |
| GET | `/v2/transactions` |
| POST | `/v2/tx/project/user/treasury/add-funds` |
| POST | `/v2/tx/global/user/access-token/mint` |

---

## How to Improve Coverage

1. **Authentication**: Migrate auth flow to use `/auth/login` endpoint
2. **User/Admin**: Implement new user management and admin endpoints
3. **Merged Data**: Replace separate DB API + Andamioscan calls with merged endpoints
4. **Scan Client**: Update `src/lib/andamioscan.ts` to use gateway base URL

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` after adding implementations to update coverage.