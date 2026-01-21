---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage

Audit and maintain API coverage for the Unified Andamio API Gateway.

## The Unified API Gateway

| Property | Value |
|----------|-------|
| **Base URL** | `https://andamio-api-gateway-666713068234.us-central1.run.app` |
| **API Docs** | [doc.json](https://andamio-api-gateway-666713068234.us-central1.run.app/api/v1/docs/doc.json) |
| **Total Endpoints** | 108 |
| **T3 Coverage** | 63% (68/108 endpoints) |

**Always use the live docs as source of truth.** The files in this skill directory are derived from these sources.

## Endpoint Categories

The unified gateway uses two API versions:
- **v1** (`/v1/*`): Legacy auth, user, admin, API key endpoints
- **v2** (`/v2/*`): Courses, projects, transactions, and new auth

| Category | Count | T3 Status | Description |
|----------|-------|-----------|-------------|
| Authentication | 6 | 🔶 83% | Login session, validate, direct login (v1 & v2) |
| User Management | 6 | 🔶 17% | Profile and access token management |
| API Key Management | 9 | 🔶 33% | API key lifecycle (v1 & v2) |
| Admin Functions | 4 | ⏳ 0% | Platform management |
| Courses | 42 | 🔶 55% | Course CRUD, modules, SLTs, assignments |
| Projects | 20 | 🔶 85% | Project CRUD, tasks, commitments |
| TX (Courses) | 6 | ✅ 100% | Course transaction building |
| TX (Projects) | 8 | ✅ 100% | Project transaction building |
| TX (Instance/Global) | 7 | 🔶 71% | Instance, global, and TX state machine |

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
| Scan (Andamioscan) | `src/lib/andamioscan.ts` | Typed client functions |
| TX (Transactions) | `src/config/transaction-schemas.ts`, `src/config/transaction-ui.ts` | TX State Machine |

## Workflow: Adding a New Endpoint

### 1. Check the Live Docs

Before implementing, verify the endpoint exists in the live OpenAPI spec:

```bash
# Check specific endpoint
curl -s https://andamio-api-gateway-666713068234.us-central1.run.app/api/v1/docs/doc.json | jq '.paths | keys | map(select(contains("your-endpoint")))'
```

### 2. Implement

**For Auth/User endpoints:**
```typescript
// src/lib/andamio-auth.ts or context
const response = await fetch(
  `${env.NEXT_PUBLIC_ANDAMIO_GATEWAY_URL}/auth/login`,
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
        `${GATEWAY_URL}/api/v2/course/user/courses/list`
      );
      return response.json() as MergedCourseList;
    },
  });
}
```

**For Scan endpoints (on-chain data):**
```typescript
// src/lib/andamioscan.ts
export async function getAllCourses(): Promise<CourseList> {
  return fetchGateway(`/v2/courses`);
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

### For Scan Endpoints (On-chain Data)

1. Which on-chain data is needed?
2. Polling for updates? (pending tx confirmation)
3. Indexer lag handling?

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

## Migration from 3 APIs

The unified gateway consolidates what was previously:

| Old API | Old Base URL | New Gateway Path |
|---------|--------------|------------------|
| Andamio DB API | `andamio-db-api-343753432212.us-central1.run.app` | `/v1/*`, `/v2/course/*`, `/v2/project/*` |
| Andamioscan | `preprod.andamioscan.io/api` | Removed (merged into course/project endpoints) |
| Atlas TX API | `atlas-api-preprod-507341199760.us-central1.run.app` | `/v2/tx/*` |

### Key Benefits

1. **Single Base URL**: One environment variable instead of 3
2. **Merged Endpoints**: Combined off-chain + on-chain data in single calls
3. **API Key Support**: New capability for programmatic access
4. **Simplified Auth**: Single login endpoint
5. **Cleaner Paths**: `/v1/*` and `/v2/*` without `/api` prefix

## Current Stats

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for current coverage.

The unified gateway has **108 endpoints** across these categories:

| Category | Count |
|----------|-------|
| Auth (v1 + v2) | 6 |
| User (v1 + v2) | 6 |
| API Key (v1 + v2) | 9 |
| Admin (v1 + v2) | 4 |
| Courses | 42 |
| Projects | 20 |
| TX (Course + Project + Instance/Global) | 21 |
| **Total** | **108** |

### Path Structure

- `/v1/*` - Legacy endpoints (auth, user, admin, apikey)
- `/v2/*` - V2 endpoints (courses, projects, transactions, new auth)
