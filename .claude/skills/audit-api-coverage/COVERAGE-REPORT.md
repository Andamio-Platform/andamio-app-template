# API Coverage Report

> **Generated**: 2026-01-21T19:58:44.013Z
> **Overall Coverage**: 63% (68/108 endpoints)

## Summary

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| Authentication | 6 | 5 | **83%** |
| User Management | 6 | 1 | **17%** |
| API Key Management | 9 | 3 | **33%** |
| Admin Functions | 4 | 0 | **0%** |
| Merged Courses | 42 | 23 | **55%** |
| Merged Projects | 20 | 17 | **85%** |
| TX: Courses | 6 | 6 | **100%** |
| TX: Projects | 8 | 8 | **100%** |
| TX: Instance/Global | 7 | 5 | **71%** |

---

## Unified API Gateway

**Base URL**: `https://andamio-api-gateway-666713068234.us-central1.run.app`
**Coverage**: 68/108 (63%)

### Implemented Categories

| Category | Coverage | Notes |
|----------|----------|-------|
| TX: Courses | 6/6 (100%) | `src/config/transaction-ui.ts` |
| TX: Projects | 8/8 (100%) | `src/config/transaction-ui.ts` |

### Missing Categories

| Category | Count | Notes |
|----------|-------|-------|
| Authentication | 1 | Partially implemented |
| User Management | 5 | Partially implemented |
| API Key Management | 6 | Partially implemented |
| Admin Functions | 4 | Not implemented |
| Merged Courses | 19 | Partially implemented |
| Merged Projects | 3 | Partially implemented |
| TX: Instance/Global | 2 | Partially implemented |

### Missing Endpoints

| Method | Path |
|--------|------|
| POST | `/v1/auth/register` |
| POST | `/v1/user/delete` |
| GET | `/v1/user/me` |
| GET | `/v1/user/usage` |
| POST | `/v1/user/usage/daily` |
| POST | `/v2/user/init-roles` |
| POST | `/v2/apikey/developer/account/delete` |
| POST | `/v2/apikey/developer/key/delete` |
| POST | `/v2/apikey/developer/key/request` |
| POST | `/v2/apikey/developer/key/rotate` |
| GET | `/v2/apikey/developer/profile/get` |
| GET | `/v2/apikey/developer/usage/get` |
| POST | `/v1/admin/set-user-role` |
| POST | `/v1/admin/usage/any-user-daily-api-usage` |
| POST | `/v1/admin/usage/user-api-usage` |
| GET | `/v2/admin/tx/stats` |
| POST | `/v2/course/owner/teacher/add` |
| POST | `/v2/course/owner/teacher/remove` |
| POST | `/v2/course/shared/commitment/get` |
| POST | `/v2/course/student/assignment-commitments/list` |
| POST | `/v2/course/student/commitment/claim` |
| POST | `/v2/course/student/commitment/create` |
| POST | `/v2/course/student/commitment/leave` |
| POST | `/v2/course/student/commitment/submit` |
| POST | `/v2/course/student/commitment/update` |
| ... | *15 more endpoints* |

---

## How to Improve Coverage

1. **Authentication**: Migrate auth flow to use `/auth/login` endpoint
2. **User/Admin**: Implement new user management and admin endpoints
3. **Merged Data**: Replace separate DB API + Andamioscan calls with merged endpoints
4. **Scan Client**: Update `src/lib/andamioscan.ts` to use gateway base URL

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` after adding implementations to update coverage.