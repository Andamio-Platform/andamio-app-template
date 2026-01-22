---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage

Audit and maintain API coverage for the Unified Andamio API Gateway.

## The Unified API Gateway

| Property | Value |
|----------|-------|
| **Base URL** | `https://dev.api.andamio.io` |
| **API Docs** | [Swagger UI](https://dev.api.andamio.io/api/v1/docs/index.html) |
| **OpenAPI Spec** | [doc.json](https://dev.api.andamio.io/api/v1/docs/doc.json) |
| **Total Endpoints** | 106 |

**Always use the live docs as source of truth.** The files in this skill directory are derived from these sources.

## Endpoint Categories

The unified gateway uses two API versions:
- **v1** (`/v1/*`): Admin, user management endpoints
- **v2** (`/v2/*`): Auth, courses, projects, transactions, API key management

| Category | Count | Description |
|----------|-------|-------------|
| Admin Functions | 4 | Platform management |
| User Management | 6 | Profile and access token management |
| Authentication | 6 | Login session, validate, developer auth (v2) |
| API Key Management | 6 | Developer API key lifecycle (v2) |
| Courses | 37 | Course CRUD, modules, SLTs, assignments |
| Projects | 17 | Project CRUD, tasks, commitments |
| TX (Courses) | 6 | Course transaction building |
| TX (Projects) | 8 | Project transaction building |
| TX (Instance/Global) | 7 | Instance, global, and TX state machine |
| TX (Admin) | 1 | TX state machine stats |

## Quick Reference Files

| File | Content | Auto-generated? |
|------|---------|-----------------|
| [unified-api-endpoints.md](./unified-api-endpoints.md) | All gateway endpoints | Manual (from live docs) |
| [api-coverage.md](./api-coverage.md) | Implementation status per endpoint | Manual tracking |
| [COVERAGE-REPORT.md](./COVERAGE-REPORT.md) | Coverage summary | **Auto-generated** |
| [coverage-report.json](./coverage-report.json) | Full coverage data | **Auto-generated** |

## Running the Audit

Generate a fresh coverage report:

```bash
npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts
```

This will:
1. Fetch live OpenAPI spec from the gateway
2. Scan `src/` for API client usage
3. Generate `COVERAGE-REPORT.md` and `coverage-report.json`

## Implementation Locations

| Endpoint Category | Implementation | Pattern |
|-------------------|----------------|---------|
| Auth, User, Admin | `src/lib/andamio-auth.ts`, `src/contexts/` | Auth context |
| Merged Courses/Projects | `src/hooks/api/*.ts` | React Query hooks |
| TX (Transactions) | `src/config/transaction-schemas.ts`, `src/config/transaction-ui.ts` | TX State Machine |

## Workflow: Adding a New Endpoint

### 1. Check the Live Docs

Before implementing, verify the endpoint exists in the live OpenAPI spec:

```bash
# Check specific endpoint
curl -s https://dev.api.andamio.io/api/v1/docs/doc.json | jq '.paths | keys | map(select(contains("your-endpoint")))'
```

### 2. Implement

**For Auth/User endpoints:**
```typescript
// src/lib/andamio-auth.ts or context
const response = await fetch(
  `${env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}/v2/auth/login/session`,
  { method: 'POST', body: JSON.stringify(payload) }
);
```

**For Merged Data endpoints (courses/projects):**
```typescript
// src/hooks/api/use-{resource}.ts
export function use{Resource}() {
  return useQuery({
    queryKey: ['{resource}', params],
    queryFn: async () => {
      const response = await authenticatedFetch(
        `/api/gateway/v2/course/user/courses/list`
      );
      return response.json() as MergedCourseList;
    },
  });
}
```

**For TX endpoints:**
Transaction schemas in `src/config/transaction-schemas.ts` and UI config in `src/config/transaction-ui.ts`.

### 3. Update Coverage

After implementing:
1. Run the audit script to verify detection
2. Update `api-coverage.md` with the implementation status

## Interview Mode: Planning New Features

When a user needs to integrate a new endpoint, ask:

### For Auth/User Endpoints

1. Is this a login flow change or user management?
2. Does it affect the global auth context?
3. Error handling strategy?

### For Merged Data Endpoints

1. Which route(s) will use this data?
2. Query or mutation?
3. Loading state? (skeleton, spinner)
4. Empty state? (message, CTA)
5. Error handling? (toast, inline)
6. Cache invalidation needed?

### For TX Endpoints

1. Which transaction definition?
2. What side effects on confirmation?
   - onSubmit: Set PENDING_TX status
   - onConfirmation: Finalize status
3. Transaction state UI?

## Keeping Docs Updated

When the gateway API changes:

1. **Run the audit script** - catches new/removed endpoints
2. **Update unified-api-endpoints.md** - only if significantly changed
3. **Update api-coverage.md** - track new implementations

**Don't manually maintain endpoint lists** - let the audit script detect drift.

## API History

### January 2026 Update

The API base URL changed from Cloud Run to a custom domain:

| Old | New |
|-----|-----|
| `https://andamio-api-gateway-666713068234.us-central1.run.app` | `https://dev.api.andamio.io` |

Key changes:
- v1 auth and API key endpoints removed (replaced by v2 developer endpoints)
- New wallet-based developer registration flow
- New introduction CRUD endpoints for courses
- New course module publish endpoint

## Current Stats

The unified gateway has **106 endpoints** across these categories:

| Category | Count |
|----------|-------|
| Admin | 4 |
| User (v1 + v2) | 6 |
| Auth (v2) | 6 |
| API Key (v2) | 6 |
| Courses | 37 |
| Projects | 17 |
| TX (Course + Project + Instance/Global + Admin) | 22 |
| **Total** | **106** |

### Path Structure

- `/v1/*` - Admin and user management endpoints
- `/v2/*` - Everything else (auth, apikey, courses, projects, transactions)
