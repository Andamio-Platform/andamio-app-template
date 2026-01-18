---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage

Audit and maintain API coverage for the Unified Andamio API Gateway.

## The Unified API Gateway

| Property | Value |
|----------|-------|
| **Base URL** | `https://andamio-api-gateway-168705267033.us-central1.run.app` |
| **API Docs** | [doc.json](https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/doc.json) |
| **Total Endpoints** | ~90+ |
| **T3 Coverage** | ~79% (37/47 core endpoints) |

**Always use the live docs as source of truth.** The files in this skill directory are derived from these sources.

## Endpoint Categories

The unified gateway consolidates what was previously 3 separate APIs:

| Category | Count | T3 Status | Description |
|----------|-------|-----------|-------------|
| Authentication | 4 | ✅ 100% | Login session, validate, direct login |
| User Management | 4 | ⏳ 0% | Profile and usage metrics |
| API Key Management | 3 | ⏳ 0% | API key lifecycle |
| Admin Functions | 3 | ⏳ 0% | Platform management |
| Merged Courses | 8+ | ✅ 100% | Combined off-chain + on-chain course data |
| Merged Projects | 8+ | ✅ 100% | Combined off-chain + on-chain project data |
| TX (Courses) | 6 | ✅ 100% | Course transaction building |
| TX (Projects) | 8 | ✅ 100% | Project transaction building |
| TX (Instance/Global) | 3 | ✅ 100% | Instance and global operations |

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
3. Scan `packages/andamio-transactions/` for TX definitions
4. Generate `COVERAGE-REPORT.md` and `coverage-report.json`

## Implementation Locations

| Endpoint Category | Implementation | Pattern |
|-------------------|----------------|---------|
| Auth, User, Admin | `src/lib/andamio-auth.ts`, `src/contexts/` | Auth context |
| Merged Courses/Projects | `src/hooks/api/*.ts` | React Query hooks |
| Scan (Andamioscan) | `src/lib/andamioscan.ts` | Typed client functions |
| TX (Transactions) | `packages/andamio-transactions/src/definitions/` | Transaction definitions |

## Workflow: Adding a New Endpoint

### 1. Check the Live Docs

Before implementing, verify the endpoint exists in the live OpenAPI spec:

```bash
# Check specific endpoint
curl -s https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/doc.json | jq '.paths | keys | map(select(contains("your-endpoint")))'
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
Transaction definitions in `packages/andamio-transactions/src/definitions/v2/`.

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
| Andamio DB API | `andamio-db-api-343753432212.us-central1.run.app` | `/auth/*`, `/user/*`, `/api/v2/*` |
| Andamioscan | `preprod.andamioscan.io/api` | `/v2/*` (passthrough) |
| Atlas TX API | `atlas-api-preprod-507341199760.us-central1.run.app` | `/v2/tx/*` (passthrough) |

### Key Benefits

1. **Single Base URL**: One environment variable instead of 3
2. **Merged Endpoints**: Combined off-chain + on-chain data in single calls
3. **API Key Support**: New capability for programmatic access
4. **Simplified Auth**: Single login endpoint

## Current Stats

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for current coverage.

The unified gateway has approximately **40 endpoints** across these categories:

| Category | Count |
|----------|-------|
| Auth + User + Admin + API Key | 12 |
| Merged Data (Courses + Projects) | 6 |
| Scan (On-chain indexed) | 9 |
| TX (Transaction building) | 13 |
| **Total** | **~40** |
