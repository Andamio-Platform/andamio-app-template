# API Coverage Report

> **Generated**: 2026-01-14T19:50:07.968Z
> **Overall Coverage**: 68% (96/142 endpoints)

## Summary

| API | Total | Implemented | Coverage |
|-----|-------|-------------|----------|
| Andamio DB API | 92 | 48 | **52%** |
| Andamio Tx API | 16 | 16 | **100%** |
| Andamioscan | 34 | 32 | **94%** |

---

## Andamio DB API

**Base URL**: `https://andamio-db-api-343753432212.us-central1.run.app`
**Coverage**: 48/92 (52%)

### Missing Endpoints

| Method | Path |
|--------|------|
| GET | `/health` |
| POST | `/user/init-roles` |
| GET | `/course/user/course/check/{code}` |
| POST | `/course/owner/course/create` |
| POST | `/course/owner/course/confirm-mint` |
| GET | `/course/user/course-modules/assignment-summary/{policy_id}` |
| POST | `/course/teacher/course-module/publish` |
| POST | `/course/teacher/course-module/set-pending-tx` |
| POST | `/course/teacher/course-module/confirm-tx` |
| POST | `/course/teacher/course-modules/batch-update-status` |
| POST | `/course/teacher/course-modules/batch-confirm` |
| GET | `/course/user/slt/get/{policy_id}/{module_code}/{index}` |
| POST | `/course/teacher/lesson/publish` |
| POST | `/course/teacher/lesson/delete` |
| POST | `/course/teacher/assignment/publish` |
| POST | `/course/teacher/assignment/delete` |
| POST | `/course/teacher/introduction/publish` |
| POST | `/course/teacher/introduction/delete` |
| GET | `/course/user/assignment-commitment/has-commitments/{policy_id}/{module_code}` |
| POST | `/course/teacher/assignment-commitment/review` |
| ... | *24 more endpoints* |

---

## Andamio Tx API

**Base URL**: `https://atlas-api-preprod-507341199760.us-central1.run.app`
**Coverage**: 16/16 (100%)

---

## Andamioscan

**Base URL**: `https://preprod.andamioscan.io/api`
**Coverage**: 32/34 (94%)

### Missing Endpoints

| Method | Path |
|--------|------|
| GET | `/api/v2/transactions` |
| GET | `/health` |

---

## How to Improve Coverage

1. **DB API**: Add React Query hooks in `src/hooks/api/`
2. **Andamioscan**: Add client functions in `src/lib/andamioscan.ts`
3. **Tx API**: Add transaction definitions in `packages/andamio-transactions/`

Run this script again after adding implementations to update coverage.