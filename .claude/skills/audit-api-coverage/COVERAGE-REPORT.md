# API Coverage Report

> **Generated**: 2026-01-24
> **Base URL**: `https://dev.api.andamio.io`
> **Overall Coverage**: ~65% (~65/99 endpoints)

## Summary

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| Authentication | 6 | 6 | **100%** |
| User Management | 4 | 1 | **25%** |
| API Key Management | 6 | 6 | **100%** |
| Admin Functions | 4 | 0 | **0%** |
| Courses | 41 | ~24 | **~59%** |
| Projects | 17 | ~14 | **~82%** |
| TX: Courses | 6 | 6 | **100%** |
| TX: Projects | 8 | 8 | **100%** |
| TX: Instance/Global | 7 | 5 | **71%** |

---

## Category Details

### Fully Implemented (100%)

| Category | Notes |
|----------|-------|
| Authentication | All v2 auth endpoints in `src/lib/andamio-auth.ts` |
| API Key Management | All v2 developer API key endpoints |
| TX: Courses | All course transaction endpoints in `src/config/transaction-ui.ts` |
| TX: Projects | All project transaction endpoints in `src/config/transaction-ui.ts` |

### Partially Implemented

| Category | Coverage | Notes |
|----------|----------|-------|
| Courses | ~59% | Core CRUD done, some student/teacher endpoints pending |
| Projects | ~82% | Core CRUD done, contributor commitment endpoints pending |
| TX: Instance/Global | 71% | Instance/global TXs done, `/tx/pending` and `/tx/types` unused |
| User Management | 25% | Only `access-token-alias` used in login flow |

### Not Implemented

| Category | Notes |
|----------|-------|
| Admin Functions | Admin panel not built |

---

## Implementation Locations

| Category | Location |
|----------|----------|
| Auth | `src/lib/andamio-auth.ts` |
| API Key | `src/lib/andamio-auth.ts` |
| Courses | `src/hooks/api/use-course*.ts`, `src/hooks/api/use-slt.ts`, `src/hooks/api/use-lesson.ts` |
| Projects | `src/hooks/api/use-project.ts`, `src/hooks/api/use-*-projects.ts` |
| TX Endpoints | `src/config/transaction-ui.ts`, `src/config/transaction-schemas.ts` |

---

## How to Improve Coverage

1. **User Management**: Implement user profile and usage endpoints if needed
2. **Courses**: Add student commitment endpoints for enrollment flow
3. **Projects**: Add contributor commitment CRUD endpoints
4. **Admin**: Build admin dashboard if required

Run the audit script after adding implementations:
```bash
npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts
```

---

**Last Updated**: January 24, 2026
**Source**: [unified-api-endpoints.md](./unified-api-endpoints.md)
