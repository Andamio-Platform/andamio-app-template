---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage and Performance

## Introduction

The Andamio T3 App Template integrates with **three API sub-systems**. This skill audits API coverage and performance across all three.

## The Three API Sub-Systems

| API | Purpose | Endpoints | Base URL |
|-----|---------|-----------|----------|
| **Andamio DB API** | Off-chain CRUD, user data, drafts | 87 | `https://andamio-db-api-343753432212.us-central1.run.app` |
| **Andamio Tx API** | Transaction building (unsigned CBOR) | 16 | `https://atlas-api-preprod-507341199760.us-central1.run.app` |
| **Andamioscan** | On-chain indexed data, events | 34 | `https://preprod.andamioscan.io/api` |

**Total: 137 endpoints across 3 APIs** (as of January 2026 - run script for current counts)

## OpenAPI Documentation URLs

| API | Swagger/OpenAPI URL |
|-----|---------------------|
| DB API | [/docs/doc.json](https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json) |
| Tx API | [/swagger.json](https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json) |
| Andamioscan | [/api](https://preprod.andamioscan.io/api) (download OpenAPI Document) |

## API Documentation Files

| File | Content |
|------|---------|
| [db-api-endpoints.md](./db-api-endpoints.md) | Full Andamio DB API endpoint reference (73 endpoints) |
| [tx-api-endpoints.md](./tx-api-endpoints.md) | Full Andamio Tx API endpoint reference (16 endpoints) |
| [andamioscan-endpoints.md](./andamioscan-endpoints.md) | Full Andamioscan endpoint reference (36 endpoints) |
| [andamioscan-api-doc.json](./andamioscan-api-doc.json) | Raw OpenAPI spec for Andamioscan |
| [api-coverage.md](./api-coverage.md) | Coverage matrix showing hook/component usage |
| [data-sources.md](./data-sources.md) | Architecture overview and data flow |

## Rules

1. **DB API** endpoints must be called via custom hooks in `src/hooks/api/`
2. **Andamioscan** endpoints must be called via `src/lib/andamioscan.ts` client
3. **Tx API** endpoints are called via `@andamio/transactions` package definitions
4. Types must be imported from `@andamio/db-api-types` - never define API types locally
5. API response data should be cached and re-used via React Query

## Automated Coverage Audit

Run the automated coverage script to get accurate, machine-verified coverage data:

```bash
npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts
```

### What the Script Does

1. **Fetches live OpenAPI specs** from all 3 API endpoints
2. **Scans implementation code** for endpoint usage patterns:
   - DB API: Searches `src/` for `ANDAMIO_API_URL` patterns
   - Tx API: Scans `packages/andamio-transactions/` for builder endpoints
   - Andamioscan: Parses `src/lib/andamioscan.ts` for client functions
3. **Generates reports**:
   - `coverage-report.json` - Machine-readable with full endpoint details
   - `COVERAGE-REPORT.md` - Human-readable summary with missing endpoints

### Output Example

```
📈 COVERAGE SUMMARY
==================================================

  DB API:      49/87 (56%)
  Tx API:      16/16 (100%)
  Andamioscan: 32/34 (94%)

  TOTAL:       97/137 (71%)
```

### Generated Report Files

| File | Description |
|------|-------------|
| [COVERAGE-REPORT.md](./COVERAGE-REPORT.md) | Human-readable coverage summary |
| [coverage-report.json](./coverage-report.json) | Full JSON with endpoint-level details |

The JSON report includes for each endpoint:
- `path` - API endpoint path
- `method` - HTTP method
- `implemented` - Boolean coverage status
- `implementationLocation` - File where endpoint is called (if implemented)

## Instructions - Phase 1: Check Coverage (Manual)

### 1. Pull Latest OpenAPI Specs

```bash
# DB API
curl https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json

# Tx API
curl https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json

# Andamioscan - download from UI at https://preprod.andamioscan.io/api
```

### 2. Compare to Local Docs

Check the endpoint files against fetched specs. Update any mismatches.

### 3. Review Implementation Coverage

| API | Implementation Location | Pattern |
|-----|------------------------|---------|
| DB API | `src/hooks/api/*.ts` | React Query hooks |
| Andamioscan | `src/lib/andamioscan.ts` | Typed client functions |
| Tx API | `@andamio/transactions` | Transaction definitions |

### 4. Update Coverage Matrix

For each endpoint, document:
- Hook/function name
- Components that use it
- Routes that use it

### 5. Generate Coverage Report

Output a coverage report with:
- Total endpoints per API
- Implemented endpoints
- Coverage percentage
- Missing endpoints

## Instructions - Phase 2: Audit Performance

### 1. Identify Redundant Queries

- Look for duplicate fetches of same data
- Check if list endpoints can replace detail fetches
- Review cache key strategies

### 2. Review Caching Strategy

- Verify React Query cache keys are consistent
- Check invalidation after mutations
- Ensure stale time is appropriate

### 3. Make Recommendations

Document:
- Redundant queries to consolidate
- Missing endpoints that would improve efficiency
- Cache invalidation improvements needed

## Instructions - Phase 3: Implementation Planning (Interview)

When the user wants to implement a new endpoint integration, use this interview-based workflow.

### Step 1: Identify the API and Endpoint

Ask the user:
1. **Which API?** DB API, Tx API, or Andamioscan?
2. **What feature?** What UX goal are they trying to achieve?

Then suggest relevant endpoints from the documentation files.

### Step 2: Interview Questions by API Type

#### For DB API Endpoints (React Query Hooks)

```
1. Which route(s) will use this data?
2. Is this a query (read) or mutation (write)?
3. For queries:
   - What loading state? (skeleton, spinner, shimmer)
   - What empty state? ("No data", "Create first X", hide section)
   - What error state? (inline alert, toast, error boundary)
   - Should it auto-refresh? (refetch interval, or manual only)
4. For mutations:
   - What optimistic update behavior?
   - Which queries should invalidate on success?
   - What success/error feedback? (toast, inline message)
```

#### For Andamioscan Endpoints (Client Functions)

```
1. Which route(s) will use this on-chain data?
2. Is this for:
   - User state (enrollments, credentials, progress)
   - Entity details (course, project)
   - Event confirmation (transaction tracking)
3. What loading state? (skeleton, spinner)
4. What empty state? (no on-chain data yet, not enrolled, etc.)
5. What error state? (indexer lag message, retry button)
6. Should it poll for updates? (for pending transactions)
```

#### For Tx API Endpoints (Transaction Definitions)

```
1. Which transaction type is this for?
2. Does a definition exist in @andamio/transactions?
3. What UI component will trigger this transaction?
4. Side effects needed:
   - onSubmit: What DB API calls after tx submission?
   - onConfirmation: What updates after blockchain confirms?
5. What transaction states to show?
   - Building (preparing tx)
   - Signing (wallet prompt)
   - Submitting (sending to chain)
   - Pending (waiting for confirmation)
   - Confirmed (success)
   - Failed (error with retry option)
```

### Step 3: Create Implementation Plan

Based on the interview, document:

```markdown
## Implementation Plan: [Feature Name]

### Endpoint
- API: [DB API / Andamioscan / Tx API]
- Path: [endpoint path]
- Method: [GET/POST]
- Parameters: [required params]

### Implementation

**[For DB API]**
- Hook: `src/hooks/api/use-[resource].ts`
- Hook name: `use[Resource]()` or `use[Action][Resource]()`
- Query key: `[resource]Keys.[method](params)`

**[For Andamioscan]**
- Client function: `src/lib/andamioscan.ts`
- Function name: `get[Resource](params)`
- Hook (optional): `src/hooks/use-andamioscan.ts`

**[For Tx API]**
- Definition: `@andamio/transactions` - `[TX_TYPE]`
- Component: `src/components/transactions/[tx-name].tsx`
- Side effects: onSubmit → [DB calls], onConfirmation → [DB calls]

### UX Integration
- Route(s): [/path/to/page]
- Component(s): [ComponentName]

### State Handling
- Loading: [skeleton/spinner/shimmer]
- Empty: [message and/or CTA]
- Error: [inline alert/toast/boundary] + [retry: yes/no]

### Cache Strategy
- Stale time: [duration]
- Invalidation: [which queries on success]
- Refetch: [on mount / interval / manual]
```

### Step 4: Update Documentation

After planning:
1. Add endpoint to `api-coverage.md` as "Planned"
2. Note target route/component
3. After implementation, update to "Implemented"

---

## Common UX Patterns

### Loading States
| Pattern | Use For |
|---------|---------|
| Skeleton | Cards, lists, tables - shows layout shape |
| Spinner | Buttons, small areas, inline loading |
| Shimmer | Text content, paragraphs |

### Empty States
| Pattern | Use For |
|---------|---------|
| Celebratory | Task completion ("All caught up!") |
| Informative | Neutral state ("No data yet") |
| Action-oriented | Onboarding ("Create your first X") |

### Error States
| Pattern | Use For |
|---------|---------|
| Inline Alert | Non-blocking, shows in content area |
| Toast | Temporary notification, auto-dismisses |
| Error Boundary | Full page error for critical failures |
| Retry Button | Allow user to attempt request again |

### Transaction States
| State | UI |
|-------|-----|
| Idle | Primary action button |
| Building | Disabled button + "Preparing..." |
| Signing | Modal/overlay + "Check your wallet" |
| Submitting | Progress indicator + "Submitting..." |
| Pending | Status badge + "Waiting for confirmation" |
| Confirmed | Success toast + updated data |
| Failed | Error alert + "Try again" button |

---

## Output Format

1. Update documentation files in this directory
2. Generate coverage report: `api-coverage-report-{date}.md`
3. Summary in Claude REPL with:
   - Coverage percentages per API
   - Key gaps identified
   - Priority recommendations

For implementation planning (Phase 3):
1. Create implementation plan in conversation
2. Update `api-coverage.md` with planned endpoints
3. After implementation, mark as implemented
