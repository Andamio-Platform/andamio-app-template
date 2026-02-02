---
name: transaction-auditor
description: Sync transaction schemas with the Andamio Gateway API spec when breaking changes are published.
---

# Transaction Auditor Skill

**Purpose**: Keep the T3 App Template's transaction schemas in sync with the authoritative Andamio Gateway API specification, and ensure proper TX State Machine integration.

> **Last Updated**: 2026-01-28

## Entry Point

When `/transaction-auditor` is invoked, present a multiple-choice menu using `AskUserQuestion`:

| Option | Description |
|--------|-------------|
| **Run TX UX Audit** | Interactive interview to verify each transaction's submit, confirmation, off-chain sync, and UX refresh. See `tx-ux-audit-20260202.md`. |
| **Sync Schemas from Gateway** | Fetch the latest API spec and update local Zod schemas, TX_TYPE_MAP, and generated types. See "Audit Workflow" below. |
| **Check Terminal States** | Quick check that `TERMINAL_STATES` and `onComplete` callbacks don't treat `confirmed` as terminal. |

## When to Use

- After Andamio Gateway API releases with breaking changes
- When adding new transaction types
- When debugging transaction failures (schema mismatches)
- Before releases to ensure schema alignment
- When prompted with `/transaction-auditor`
- When TX watcher behavior seems incorrect

## Critical: TX State Machine Understanding

### "confirmed" is NOT a Terminal State

**IMPORTANT**: This is the most common source of TX-related bugs.

The `confirmed` state only means the TX is on-chain. The Gateway's DB update happens **asynchronously ~30 seconds later**. Frontend code must wait for `updated` state.

```
WRONG (causes race condition - stale data):
  Frontend sees "confirmed" → fires success callback → fetches data → gets PENDING_TX_SUBMIT

CORRECT:
  Frontend sees "confirmed" → keeps polling → Gateway updates DB → state="updated" → success callback
```

### Terminal States (Stop Polling)

| State | Terminal? | Meaning | Frontend Action |
|-------|-----------|---------|-----------------|
| `pending` | No | TX submitted, awaiting on-chain | Keep polling |
| `confirmed` | **No** | TX on-chain, Gateway processing | Keep polling |
| `updated` | **Yes** | DB update complete | Fire success callback |
| `failed` | **Yes** | TX failed after retries | Fire error callback |
| `expired` | **Yes** | TX exceeded 2hr TTL | Fire error callback |

### Correct useTxWatcher Pattern

```typescript
// src/hooks/tx/use-tx-watcher.ts
export const TERMINAL_STATES: TxState[] = ["updated", "failed", "expired"];
// NOTE: "confirmed" is NOT terminal!

// In components:
const { status, isSuccess } = useTxWatcher(txHash, {
  onComplete: (status) => {
    // "updated" means Gateway has confirmed TX AND updated DB
    if (status.state === "updated") {
      toast.success("Transaction complete!");
      void refetchData();
    } else if (status.state === "failed" || status.state === "expired") {
      toast.error(status.last_error ?? "Transaction failed");
    }
  },
});
```

### Deprecated Patterns

**DO NOT** call `confirm-tx` endpoints from the frontend. The Gateway's TX State Machine handles all DB updates automatically.

| Pattern | Status | Description |
|---------|--------|-------------|
| Frontend calls `confirm-tx` | **Deprecated** | Legacy pattern |
| Wait for `"updated"` state | **Current** | Gateway handles DB updates |

## Data Sources

### Authoritative Source

**Andamio Gateway API Spec**:
```
https://dev.api.andamio.io/api/v1/docs/doc.json
```

### Local Files to Update

| File | Purpose |
|------|---------|
| `src/config/transaction-schemas.ts` | Zod validation schemas for TX params |
| `src/config/transaction-ui.ts` | TX types, endpoints, UI strings |
| `src/hooks/tx/use-tx-watcher.ts` | `TX_TYPE_MAP` and `TERMINAL_STATES` |
| `src/types/generated/index.ts` | Type exports (after regeneration) |

### Supporting Documentation

| File | Purpose |
|------|---------|
| `.claude/skills/audit-api-coverage/tx-state-machine.md` | Complete TX State Machine docs |
| `.claude/skills/project-manager/TX-MIGRATION-GUIDE.md` | Migration patterns |

## Audit Workflow

### Step 1: Fetch Latest API Spec

```bash
# Get all TX-related paths
curl -s "https://dev.api.andamio.io/api/v1/docs/doc.json" \
  | jq -r '.paths | keys[]' | grep "/api/v2/tx/" | sort

# Get specific request schemas
curl -s "https://dev.api.andamio.io/api/v1/docs/doc.json" \
  | jq '[.definitions | to_entries[] | select(.key | contains("TxRequest"))] | from_entries'
```

### Step 2: Compare Schemas

For each transaction type, compare the API spec against `src/config/transaction-schemas.ts`:

| Check | Description |
|-------|-------------|
| Field names | Do local field names match API exactly? |
| Field types | Do Zod types match swagger types? |
| Required vs optional | Does optionality match? |
| Nested objects | Do array item schemas match? |
| Enums | Do enum values match? |

### Step 3: Check TX Type Mapping

Compare `TX_TYPE_MAP` in `src/hooks/tx/use-tx-watcher.ts` against the API's `tx_type` enum:

```bash
# Get valid tx_type values from API
curl -s "https://dev.api.andamio.io/api/v1/docs/doc.json" \
  | jq '.definitions["tx_state_handlers.RegisterPendingTxRequest"].properties.tx_type.enum'
```

### Step 4: Verify Terminal States

Ensure `TERMINAL_STATES` in `use-tx-watcher.ts` does NOT include `"confirmed"`:

```typescript
// CORRECT
export const TERMINAL_STATES: TxState[] = ["updated", "failed", "expired"];

// WRONG - will cause race conditions
export const TERMINAL_STATES: TxState[] = ["confirmed", "updated", "failed", "expired"];
```

### Step 5: Regenerate Types

After confirming API changes, regenerate TypeScript types:

```bash
npm run generate:types
```

This fetches the latest OpenAPI spec and generates `src/types/generated/gateway.ts`.

### Step 6: Update Local Schemas

Update these files in order:

1. **`src/types/generated/index.ts`** - Add/update type exports
2. **`src/config/transaction-schemas.ts`** - Update Zod schemas
3. **`src/hooks/tx/use-tx-watcher.ts`** - Update `TX_TYPE_MAP`
4. **Components** - Fix any type errors from schema changes

### Step 7: Audit onComplete Callbacks

Search for incorrect `confirmed` checks in components:

```bash
# Find all useTxWatcher usages checking for "confirmed"
grep -r 'status\.state === "confirmed"' src/components/
```

All matches should be updated to only check for `"updated"`.

### Step 8: Verify Changes

```bash
npm run typecheck
npm run build
```

Fix any type errors in components that use the updated schemas.

### Step 9: Update Documentation

Update these docs to reflect changes:
- `.claude/skills/audit-api-coverage/tx-state-machine.md`
- `.claude/skills/project-manager/TX-MIGRATION-GUIDE.md`

## Transaction Types (17 total)

| Category | TransactionType | Gateway tx_type | Endpoint |
|----------|-----------------|-----------------|----------|
| Global | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `access_token_mint` | `/api/v2/tx/global/user/access-token/mint` |
| Instance | `INSTANCE_COURSE_CREATE` | `course_create` | `/api/v2/tx/instance/owner/course/create` |
| Instance | `INSTANCE_PROJECT_CREATE` | `project_create` | `/api/v2/tx/instance/owner/project/create` |
| Course Owner | `COURSE_OWNER_TEACHERS_MANAGE` | `teachers_update` | `/api/v2/tx/course/owner/teachers/manage` |
| Course Teacher | `COURSE_TEACHER_MODULES_MANAGE` | `modules_manage` | `/api/v2/tx/course/teacher/modules/manage` |
| Course Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assessment_assess` | `/api/v2/tx/course/teacher/assignments/assess` |
| Course Student | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `assignment_submit` | `/api/v2/tx/course/student/assignment/commit` |
| Course Student | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment_submit` | `/api/v2/tx/course/student/assignment/update` |
| Course Student | `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential_claim` | `/api/v2/tx/course/student/credential/claim` |
| Project Owner | `PROJECT_OWNER_MANAGERS_MANAGE` | `project_join` | `/api/v2/tx/project/owner/managers/manage` |
| Project Owner | `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist_update` | `/api/v2/tx/project/owner/contributor-blacklist/manage` |
| Project Manager | `PROJECT_MANAGER_TASKS_MANAGE` | `tasks_manage` | `/api/v2/tx/project/manager/tasks/manage` |
| Project Manager | `PROJECT_MANAGER_TASKS_ASSESS` | `task_assess` | `/api/v2/tx/project/manager/tasks/assess` |
| Project Contributor | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task_submit` | `/api/v2/tx/project/contributor/task/commit` |
| Project Contributor | `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task_submit` | `/api/v2/tx/project/contributor/task/action` |
| Project Contributor | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project_credential_claim` | `/api/v2/tx/project/contributor/credential/claim` |
| Project User | `PROJECT_USER_TREASURY_ADD_FUNDS` | `treasury_fund` | `/api/v2/tx/project/user/treasury/add-funds` |

## TX State Machine Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/tx/register` | POST | Register TX after wallet submit |
| `/api/v2/tx/status/{tx_hash}` | GET | Poll TX status (every 15s) |
| `/api/v2/tx/pending` | GET | List user's pending TXs |
| `/api/v2/tx/types` | GET | Get valid tx_type values |

## Gateway Backend Processing

Understanding the Gateway's TX State Machine helps debug issues:

```
├─ t=0     User submits TX, frontend calls /tx/register
├─ t=0     Gateway stores TX with state="pending"
│
├─ t=30s   Gateway polls Andamioscan, sees TX on-chain
├─ t=30s   Gateway state → "confirmed"
├─ t=30s   Gateway adds TX to confirmation queue
│
├─ t=60s   Background job processes confirmation queue
├─ t=60s   Gateway calls DB API (UpdateDB handler for tx_type)
├─ t=60s   DB status transitions (e.g., PENDING_TX_SUBMIT → SUBMITTED)
├─ t=60s   Gateway state → "updated"
│
└─ t=60s   Frontend sees "updated", fires onComplete, fetches fresh data
```

## Common Schema Patterns

### API Type → Zod Schema

```typescript
// Alias (1-31 chars, alphanumeric + underscore)
alias: z.string().min(1).max(31)

// Policy ID (56 char hex)
course_id: z.string().length(56)
project_id: z.string().length(56)

// Hash (64 char hex)
slt_hash: z.string().length(64)
task_hash: z.string().length(64)

// Short text (max 140 chars)
assignment_info: z.string().max(140)
project_info: z.string().max(140)

// Wallet data (optional)
initiator_data: z.object({
  used_addresses: z.array(z.string()),
  change_address: z.string(),
}).optional()

// Value (asset tuples)
deposit_value: z.array(z.tuple([z.string(), z.number()]))

// Outcome (string, not enum - API accepts any)
outcome: z.string()
```

## Common Issues

### Issue: Data shows stale status after TX success

**Symptom**: Assignment shows `PENDING_TX_SUBMIT` instead of `SUBMITTED`.

**Cause**: Frontend checking for `confirmed` state, which fires before DB update.

**Fix**: Only trigger success on `updated`:
```typescript
// WRONG
if (status.state === "confirmed" || status.state === "updated") { ... }

// CORRECT
if (status.state === "updated") { ... }
```

### Issue: Polling never stops

**Symptom**: Frontend keeps polling forever.

**Cause**: TX type not in `TX_TYPE_MAP`, or Gateway handler not implemented.

**Fix**: Verify TX type mapping and Gateway handler exists.

## Changelog Integration

When Andamio Gateway publishes a new version:

1. **Read the changelog/release notes** for breaking changes
2. **Identify affected schemas** by matching endpoint paths
3. **Run this skill** to sync schemas
4. **Verify TERMINAL_STATES** doesn't include `confirmed`
5. **Test transactions** to verify compatibility

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `audit-api-coverage` | Shares `tx-state-machine.md` documentation |
| `documentarian` | Triggers doc updates after schema changes |
| `review-pr` | Delegates TX-related PR reviews to this skill |
| `project-manager` | Updates TX-MIGRATION-GUIDE.md |

## Quick Reference Commands

```bash
# Regenerate types from gateway spec
npm run generate:types

# Type check after changes
npm run typecheck

# Find incorrect "confirmed" checks
grep -r 'status\.state === "confirmed"' src/components/

# Get all TX request schemas from API
curl -s "https://dev.api.andamio.io/api/v1/docs/doc.json" \
  | jq '[.definitions | to_entries[] | select(.key | contains("TxRequest"))] | from_entries'

# Get tx_type enum values
curl -s "https://dev.api.andamio.io/api/v1/docs/doc.json" \
  | jq '.definitions["tx_state_handlers.RegisterPendingTxRequest"].properties.tx_type.enum'
```
