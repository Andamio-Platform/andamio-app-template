---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage

Audit and maintain API coverage across the three Andamio API sub-systems.

## The Three API Systems

| API | Purpose | Live Docs | Base URL |
|-----|---------|-----------|----------|
| **Atlas TX API** | Transaction building (unsigned CBOR) | [swagger.json](https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json) | `atlas-api-preprod-507341199760.us-central1.run.app` |
| **Andamio DB API** | Off-chain CRUD, auth, drafts | [doc.json](https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json) | `andamio-db-api-343753432212.us-central1.run.app` |
| **Andamioscan** | On-chain indexed data | [swagger.yaml](https://preprod.andamioscan.io/swagger.yaml) | `preprod.andamioscan.io/api` |

**Always use the live docs as source of truth.** The files in this skill directory are derived from these sources.

## Quick Reference Files

| File | Content | Auto-generated? |
|------|---------|-----------------|
| [db-api-endpoints.md](./db-api-endpoints.md) | DB API endpoint reference | Manual (from live docs) |
| [tx-api-endpoints.md](./tx-api-endpoints.md) | TX API endpoint reference | Manual (from live docs) |
| [andamioscan-endpoints.md](./andamioscan-endpoints.md) | Andamioscan endpoint reference | Manual (from live docs) |
| [api-coverage.md](./api-coverage.md) | Implementation status per endpoint | Manual tracking |
| [COVERAGE-REPORT.md](./COVERAGE-REPORT.md) | Coverage summary | **Auto-generated** |
| [coverage-report.json](./coverage-report.json) | Full coverage data | **Auto-generated** |

## Running the Audit

Generate a fresh coverage report:

```bash
node --import tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts
```

### Refreshing Andamioscan Spec

The Andamioscan spec is stored locally. Refresh and convert it:

```bash
# Download fresh YAML spec
curl -s https://preprod.andamioscan.io/swagger.yaml -o .claude/skills/audit-api-coverage/andamioscan-api-doc.yaml

# Convert to JSON for audit script
npx js-yaml .claude/skills/audit-api-coverage/andamioscan-api-doc.yaml > .claude/skills/audit-api-coverage/andamioscan-api-doc.json
```

This will:
1. Fetch live OpenAPI specs from all 3 APIs
2. Scan `src/` for DB API and Andamioscan usage
3. Scan `packages/andamio-transactions/` for TX API usage
4. Generate `COVERAGE-REPORT.md` and `coverage-report.json`

## Implementation Locations

| API | Implementation | Pattern |
|-----|----------------|---------|
| DB API | `src/hooks/api/*.ts` | React Query hooks |
| Andamioscan | `src/lib/andamioscan.ts` | Typed client functions |
| TX API | `packages/andamio-transactions/src/definitions/` | Transaction definitions |

## Workflow: Adding a New Endpoint

### 1. Check the Live Docs

Before implementing, verify the endpoint exists in the live OpenAPI spec:

```bash
# DB API - check specific endpoint
curl -s https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json | jq '.paths | keys | map(select(contains("your-endpoint")))'

# TX API - check transaction endpoints
curl -s https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json | jq '.paths | keys'
```

### 2. Implement

**For DB API endpoints:**
```typescript
// src/hooks/api/use-{resource}.ts
export function use{Resource}() {
  return useQuery({
    queryKey: ['{resource}', params],
    queryFn: async () => {
      const response = await authenticatedFetch(
        `${API_URL}/{path}`
      );
      return response.json() as {Type};
    },
  });
}
```

**For Andamioscan endpoints:**
```typescript
// src/lib/andamioscan.ts
export async function get{Resource}(params): Promise<{Type}> {
  return fetchAndamioscan(`/api/v2/{path}`);
}
```

**For TX API endpoints:**
Transaction definitions in `packages/andamio-transactions/src/definitions/`.

### 3. Update Coverage

After implementing:
1. Run the audit script to verify detection
2. Update `api-coverage.md` with the implementation status

## Interview Mode: Planning New Features

When a user needs to integrate a new endpoint, ask:

### For DB API Endpoints

1. Which route(s) will use this data?
2. Query or mutation?
3. Loading state? (skeleton, spinner)
4. Empty state? (message, CTA)
5. Error handling? (toast, inline)
6. Cache invalidation needed?

### For Andamioscan Endpoints

1. Which on-chain data is needed?
2. Polling for updates? (pending tx confirmation)
3. Indexer lag handling?

### For TX API Endpoints

1. Which transaction definition?
2. What DB API side effects?
   - onSubmit: Set PENDING_TX status
   - onConfirmation: Finalize status
3. Transaction state UI?

## Keeping Docs Updated

When the live APIs change:

1. **Run the audit script** - catches new/removed endpoints
2. **Update endpoint reference files** - only if significantly changed
3. **Update api-coverage.md** - track new implementations

**Don't manually maintain endpoint lists** - let the audit script detect drift.

## Current Stats (run script for latest)

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for current coverage.

The three APIs have approximately:
- **TX API**: 17 endpoints (transaction building)
- **DB API**: 77 endpoints (off-chain CRUD)
- **Andamioscan**: 34 endpoints (on-chain indexed data)

Total: ~128 endpoints across 3 APIs.
