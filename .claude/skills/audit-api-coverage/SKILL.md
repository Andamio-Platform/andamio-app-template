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

### Excluded Endpoints

The audit script excludes deprecated endpoints from coverage tracking:

- **V1 Project endpoints** (`/project/public/*`, `/project/owner/*`, etc.) - Deprecated in favor of V2 (`/project-v2/*`). The T3 App Template uses only V2 Project endpoints as of January 2026.

To modify exclusions, edit `DB_API_EXCLUDE_PATTERNS` in `scripts/audit-coverage.ts`.

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

## Reviewing Partnering Repos

The Andamio platform consists of multiple repositories. When auditing API coverage, also review partnering repos for recent changes that may affect this template.

### Partnering Repositories

| Repo | Local Path | GitHub | Purpose |
|------|------------|--------|---------|
| **andamioscan** | `~/projects/01-projects/andamioscan` | `Andamio-Platform/andamioscan` | On-chain indexer |
| **atlas-api** | (remote only) | `Andamio-Platform/atlas-api` | TX building API |
| **andamio-db-api** | (remote only) | `Andamio-Platform/andamio-db-api` | Off-chain CRUD API |

### Workflow: Check for API Changes

**Step 1: Review recently closed GitHub issues**

```bash
# Andamioscan - see recently closed issues
gh issue list --repo Andamio-Platform/andamioscan --state closed --limit 10

# View specific issue details
gh issue view <issue-number> --repo Andamio-Platform/andamioscan
```

**Step 2: Check local repo for recent commits (if available)**

```bash
# If local clone exists, check recent commits
cd ~/projects/01-projects/andamioscan
git log --oneline -10
git diff HEAD~5..HEAD --stat
```

**Step 3: Refresh API specs**

```bash
# Download fresh swagger/OpenAPI specs
curl -s https://preprod.andamioscan.io/swagger.yaml -o .claude/skills/audit-api-coverage/andamioscan-api-doc.yaml
npx js-yaml .claude/skills/audit-api-coverage/andamioscan-api-doc.yaml > .claude/skills/audit-api-coverage/andamioscan-api-doc.json
```

**Step 4: Update types and implementations**

After identifying API changes:
1. Update TypeScript types in `src/lib/andamioscan.ts`
2. Update transaction definitions in `packages/andamio-transactions/`
3. Run type check to catch breaking changes

### Key Issues to Track

When reviewing GitHub issues, look for:
- **New fields added** to API responses (need to update types)
- **Deprecated fields** (need to remove usage)
- **New endpoints** (potential new integrations)
- **Bug fixes** that may unblock features

### Example: Andamioscan Issue #10

**Issue**: "Return contributor_state_id for tasks"
**Impact**: Added `contributor_state_policy_id` to task objects

**Actions taken**:
1. Updated `AndamioscanPrerequisite` type with `project_state_policy_id`
2. Updated `TaskCommit` component to pass `contributorStatePolicyId`
3. Updated transaction definition schema
4. Added helper function to extract value from on-chain task

## Current Stats (run script for latest)

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for current coverage.

The three APIs have approximately:
- **TX API**: 17 endpoints (transaction building)
- **DB API**: 77 endpoints (off-chain CRUD)
- **Andamioscan**: 34 endpoints (on-chain indexed data)

Total: ~128 endpoints across 3 APIs.
