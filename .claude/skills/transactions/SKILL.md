---
name: transactions
description: How Cardano transactions work in Andamio — state machine, APIs, and hooks.
---

# Transactions

How to build, submit, and track Cardano transactions in Andamio apps.

## The Key Insight

**"confirmed" is NOT terminal.** The Gateway updates the database ~30 seconds after on-chain confirmation.

```
WRONG:  TX confirmed → success callback → fetch data → STALE DATA

CORRECT: TX confirmed → keep watching → DB updated → success callback → fresh data
```

## Transaction States

| State | Terminal? | What it means |
|-------|-----------|---------------|
| `pending` | No | TX submitted, waiting for blockchain |
| `confirmed` | **No** | On-chain, Gateway still processing |
| `updated` | **Yes** | DB updated — SUCCESS |
| `failed` | **Yes** | TX failed after retries |
| `expired` | **Yes** | TX exceeded 2-hour TTL |

## The Flow

```
BUILD → SIGN → SUBMIT → REGISTER → WATCH
  │       │       │         │         │
  │       │       │         │         └─ SSE stream or poll until "updated"
  │       │       │         └─ POST /api/v2/tx/register
  │       │       └─ wallet.submitTx(signed) → txHash
  │       └─ wallet.signTx(cbor, true)
  └─ POST to /api/v2/tx/* → unsigned CBOR
```

## Using the Hooks

### useTxStream (Preferred)

Real-time updates via Server-Sent Events:

```typescript
import { useTxStream } from "~/hooks/tx/use-tx-stream";

const { status, isSuccess, isFailed } = useTxStream(txHash);

// isSuccess = true when state === "updated" (DB is ready)
```

### useTxWatcher (Fallback)

Polling every 15 seconds:

```typescript
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";

const { status, isSuccess } = useTxWatcher(txHash, {
  onComplete: (status) => {
    if (status.state === "updated") {
      toast.success("Transaction complete!");
      void refetchData(); // Now safe to fetch
    }
  },
});
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/tx/register` | POST | Register TX after wallet submit |
| `/api/v2/tx/status/{hash}` | GET | Poll TX status |
| `/api/v2/tx/stream/{hash}` | GET (SSE) | Real-time state updates |
| `/api/v2/tx/pending` | GET | User's pending TXs |

## TX Types

| Action | tx_type |
|--------|---------|
| Mint access token | `access_token_mint` |
| Create course | `course_create` |
| Submit assignment | `assignment_submit` |
| Assess assignment | `assessment_assess` |
| Claim credential | `credential_claim` |
| Create project | `project_create` |
| Commit to task | `project_join` |
| Submit task work | `task_submit` |
| Assess task | `task_assess` |
| Fund treasury | `treasury_fund` |

## Common Mistakes

### Checking for "confirmed" instead of "updated"

```typescript
// WRONG - data will be stale
if (status.state === "confirmed") { refetchData(); }

// CORRECT - wait for DB update
if (status.state === "updated") { refetchData(); }
```

### Calling confirm-tx endpoints directly

The Gateway handles DB updates automatically. Just wait for `"updated"` status.

## Key Files

| File | Purpose |
|------|---------|
| `~/hooks/tx/use-tx-stream.ts` | SSE-based TX tracking |
| `~/hooks/tx/use-tx-watcher.ts` | Polling-based TX tracking |
| `~/hooks/tx/use-transaction.ts` | TX execution hook |
| `~/config/transaction-schemas.ts` | Zod validation |
| `~/config/transaction-ui.ts` | TX types and endpoints |

---

## Compound Engineering

Transaction bugs are subtle — state machine timing, SSE connection drops, stale data after "confirmed". When you solve a TX issue, document it:

```bash
/workflows:compound
```

The `docs/solutions/` directory will grow with patterns like:
- `runtime-errors/tx-stream-timeout-fallback.md`
- `logic-errors/confirmed-vs-updated-race.md`
- `integration-issues/gateway-sse-connection-reset.md`

Check there first before debugging — your answer may already exist.

---

**Last Updated**: March 2026
