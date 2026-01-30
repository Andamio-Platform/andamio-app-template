# Transaction State Machine

The Andamio Gateway provides a TX State Machine that handles transaction lifecycle from submission through confirmation and database updates.

> **Last Updated**: 2026-01-30
> **Source**: Gateway API team REPL note on race condition fix

## Critical Understanding

### "confirmed" is NOT Terminal

**IMPORTANT**: The `confirmed` state only means the TX is on-chain. The Gateway's DB update happens **asynchronously ~30 seconds later**.

```
WRONG (causes race condition):
  Frontend sees "confirmed" → fires success callback → fetches data → gets stale data

CORRECT:
  Frontend sees "confirmed" → keeps polling → Gateway updates DB → state="updated" → success callback
```

### Terminal States

Only these states are terminal (stop polling):

| State | Terminal? | Meaning |
|-------|-----------|---------|
| `pending` | No | TX submitted, awaiting on-chain confirmation |
| `confirmed` | **No** | TX on-chain, Gateway processing DB update |
| `updated` | **Yes** | DB update complete - SUCCESS |
| `failed` | **Yes** | TX failed after max retries - ERROR |
| `expired` | **Yes** | TX exceeded TTL (2 hours) - ERROR |

## TX State Machine Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/tx/register` | POST | Register TX after wallet submit |
| `/api/v2/tx/status/{tx_hash}` | GET | Poll individual TX status |
| `/api/v2/tx/stream/{tx_hash}` | GET (SSE) | Real-time state updates via Server-Sent Events |
| `/api/v2/tx/pending` | GET | Get all user's pending TXs |
| `/api/v2/tx/types` | GET | List valid TX types |

## Full Transaction Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌──────────────┐
│  BUILD  │ → │  SIGN   │ → │ SUBMIT  │ → │ REGISTER │ → │ STREAM/POLL  │
└─────────┘    └─────────┘    └─────────┘    └──────────┘    └──────────────┘
     │              │              │              │              │
     │              │              │              │              ▼
  POST to       wallet.        wallet.       POST to       SSE stream (preferred)
  /tx/*         signTx()      submitTx()    /tx/register   or poll until "updated"
```

### Step-by-Step

1. **BUILD**: POST to `/api/v2/tx/*` endpoint → get unsigned CBOR
2. **SIGN**: User signs with wallet (`wallet.signTx(cbor, true)`)
3. **SUBMIT**: Submit to blockchain (`wallet.submitTx(signed)`) → get txHash
4. **REGISTER**: POST to `/api/v2/tx/register` with txHash and txType
5. **STREAM** (preferred): SSE via `GET /api/v2/tx/stream/:txHash` — real-time state pushes until terminal
6. **POLL** (fallback): GET `/api/v2/tx/status/:txHash` every 15 seconds until `updated`, `failed`, or `expired`

## Gateway Backend Processing

Understanding what happens on the Gateway side helps explain why `confirmed` is not terminal:

### Timeline (successful TX)

```
├─ t=0     User submits TX, frontend calls /tx/register
├─ t=0     Gateway stores TX with state="pending"
│
├─ t=30s   Gateway polls Andamioscan, sees TX on-chain
├─ t=30s   Gateway state → "confirmed"
├─ t=30s   Gateway adds TX to confirmation queue
│
├─ t=60s   Background job processes confirmation queue
├─ t=60s   Gateway calls DB API (e.g., /course-v2/gateway/assignment-commitment/confirm)
├─ t=60s   DB status transitions (e.g., PENDING_TX_SUBMIT → SUBMITTED)
├─ t=60s   Gateway state → "updated"
│
└─ t=60s   Frontend sees "updated", fires onComplete, fetches fresh data
```

### TX Type Handlers

Each TX type has a registered handler that knows how to update the DB:

| tx_type | Handler Updates |
|---------|-----------------|
| `assignment_submit` | Calls `/course-v2/gateway/assignment-commitment/confirm` |
| `task_submit` | Calls `/project/contributor/commitment/confirm-tx` |
| `course_create` | Registers course in DB |
| `modules_manage` | Updates module status |
| `assessment_assess` | Updates assessment results |

## Frontend Implementation

### useTxWatcher Hook (Polling)

The `useTxWatcher` hook in `src/hooks/tx/use-tx-watcher.ts` handles polling:

```typescript
// Terminal states - only these stop polling
export const TERMINAL_STATES: TxState[] = ["updated", "failed", "expired"];

// isSuccess only true when DB is updated
isSuccess: status?.state === "updated",
```

### useTxStream Hook (SSE — Preferred)

The `useTxStream` hook in `src/hooks/tx/use-tx-stream.ts` is a drop-in replacement that uses SSE:

```typescript
// Same consumer API as useTxWatcher
const { status, isSuccess, isFailed } = useTxStream(txHash);
```

**Advantages over polling**:
- Near-instant state transitions (~0s vs 15s latency)
- Single held connection instead of repeated HTTP requests
- Automatic fallback to polling if SSE connection fails

**SSE event types** (defined in `src/types/tx-stream.ts`):
- `state` — Initial state snapshot on connect
- `state_change` — Pushed on each state transition
- `complete` — Terminal state reached, connection closes

### onComplete Callback

The `onComplete` callback should only trigger on `updated`:

```typescript
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

## Deprecated Patterns

### DO NOT Call confirm-tx Endpoints

The pattern of calling `confirm-tx` endpoints directly from the frontend is **deprecated**:

| Pattern | Status | Description |
|---------|--------|-------------|
| Frontend calls `confirm-tx` | **Deprecated** | Frontend calls DB directly |
| TX State Machine | **Current** | Gateway handles DB updates automatically |

The Gateway's TX State Machine already handles all DB updates. The frontend just needs to wait for `"updated"` status.

### Legacy Code Reference

Some older components (like project contributor pages) still have `confirmCommitmentTransaction()` calls. These are legacy and should not be replicated in new code.

## API Response Types

### TxStatus Response

```typescript
interface TxStatus {
  tx_hash: string;
  tx_type: string;
  state: 'pending' | 'confirmed' | 'updated' | 'failed' | 'expired';
  confirmed_at?: string;
  retry_count: number;
  last_error?: string;
}
```

### Register Request

```typescript
interface TxRegisterRequest {
  tx_hash: string;
  tx_type: string;
  metadata?: Record<string, string>; // Off-chain data (e.g., course title)
}
```

## TX Type Mapping

| TransactionType | Gateway tx_type |
|-----------------|-----------------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `access_token_mint` |
| `INSTANCE_COURSE_CREATE` | `course_create` |
| `INSTANCE_PROJECT_CREATE` | `project_create` |
| `COURSE_OWNER_TEACHERS_MANAGE` | `teachers_update` |
| `COURSE_TEACHER_MODULES_MANAGE` | `modules_manage` |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assessment_assess` |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `assignment_submit` |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment_submit` |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential_claim` |
| `PROJECT_OWNER_MANAGERS_MANAGE` | `project_join` |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist_update` |
| `PROJECT_MANAGER_TASKS_MANAGE` | `tasks_manage` |
| `PROJECT_MANAGER_TASKS_ASSESS` | `task_assess` |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task_submit` |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task_submit` |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project_credential_claim` |
| `PROJECT_USER_TREASURY_ADD_FUNDS` | `treasury_fund` |

**Valid Gateway tx_type values** (from API spec):
```
course_create, course_enroll, modules_manage, teachers_update,
assignment_submit, assessment_assess, credential_claim,
project_create, project_join, tasks_manage, task_submit, task_assess,
project_credential_claim, blacklist_update, treasury_fund, access_token_mint
```

## Common Issues

### Issue: Data shows stale status after TX success

**Symptom**: Assignment shows `PENDING_TX_SUBMIT` instead of `SUBMITTED` after TX confirms.

**Cause**: Frontend was checking for `confirmed` state, which fires before DB update.

**Fix**: Only trigger success on `updated` state:
```typescript
// WRONG
if (status.state === "confirmed" || status.state === "updated") { ... }

// CORRECT
if (status.state === "updated") { ... }
```

### Issue: Polling never stops

**Symptom**: Frontend keeps polling forever.

**Cause**: TX type not in `TX_TYPE_MAP`, or Gateway handler not implemented.

**Fix**: Check that the TX type is properly mapped and the Gateway has a handler.

## See Also

- `~/hooks/tx/use-tx-stream.ts` - SSE-based TX state tracking (preferred)
- `~/hooks/tx/use-tx-watcher.ts` - Polling-based TX state tracking (fallback)
- `~/hooks/tx/use-transaction.ts` - Transaction execution hook
- `~/types/tx-stream.ts` - SSE event type definitions
- `~/lib/tx-polling-fallback.ts` - Polling fallback utility
- `~/app/api/gateway-stream/[...path]/route.ts` - SSE proxy route
- `~/config/transaction-ui.ts` - TX types and endpoints
- `~/config/transaction-schemas.ts` - Zod validation schemas
