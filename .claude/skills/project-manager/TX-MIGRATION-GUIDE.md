# Transaction Migration Guide

> **Migration Complete** (January 19, 2026): All transaction components have been migrated to V2. The V1 components (`useAndamioTransaction`, `AndamioTransaction`) remain in the codebase for backwards compatibility but have no active users. Hash utilities have been migrated to `~/lib/utils/`.

## Overview

This guide documents the process of migrating transaction components from the V1 approach (`useAndamioTransaction` + client-side polling) to the V2 approach (`useSimpleTransaction` + gateway auto-confirmation).

## Architecture Comparison

| Aspect | V1 (Deprecated) | V2 (Current) |
|--------|-----------------|--------------|
| Transaction Hook | `useAndamioTransaction` | `useSimpleTransaction` |
| Confirmation | Client-side Koios polling | Gateway auto-confirmation |
| DB Updates | `onSubmit`/`onConfirmation` side effects | Gateway handles via TxTypeRegistry |
| Status Tracking | `usePendingTransactions` | `useTxWatcher` |
| Config Source | `@andamio/transactions` package | `~/config/transaction-ui.ts` |

## Key Concepts

### 1. `requiresDBUpdate` Flag

Not all transactions need database tracking. The `requiresDBUpdate` flag in `TransactionUIConfig` determines the confirmation flow:

| Value | Behavior | Example |
|-------|----------|---------|
| `false` | Pure on-chain TX, no gateway registration | Access Token Mint |
| `true` | Register with gateway, poll for status | Course Create, Assignment Commit |

### 2. TX State Machine (Gateway)

For transactions that require DB updates, the gateway uses a state machine:

```
pending → confirmed → updated (success)
                   ↘ failed/expired (error)
```

- **pending**: TX submitted, awaiting on-chain confirmation
- **confirmed**: TX confirmed on-chain, processing DB updates
- **updated**: DB updates complete (terminal - success)
- **failed/expired**: Processing failed (terminal - error)

### 3. Gateway TX Type Mapping

Frontend uses `SCREAMING_SNAKE_CASE`, gateway uses `snake_case`:

```typescript
// ~/hooks/tx/use-tx-watcher.ts
export const TX_TYPE_MAP: Record<string, string> = {
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: "access_token_mint",
  INSTANCE_COURSE_CREATE: "course_create",
  // ... etc
};
```

## Migration Steps

### Step 1: Update Transaction Config

Add registration flags to the transaction type in `~/config/transaction-ui.ts`:

```typescript
INSTANCE_COURSE_CREATE: {
  buttonText: "Create Course",
  title: "Create Course",
  description: [...],
  footerLink: "...",
  footerLinkText: "Tx Documentation",
  successInfo: "Course created successfully!",
  requiresDBUpdate: true,  // ← TX needs gateway DB updates
},

// For TXs that only need on-chain confirmation (no DB writes):
GLOBAL_GENERAL_ACCESS_TOKEN_MINT: {
  // ...
  requiresDBUpdate: false,
  requiresOnChainConfirmation: true,  // ← Track on-chain only
},
```

**Registration flags**:
- `requiresDBUpdate: true` — Most TXs. Gateway monitors and updates DB.
- `requiresOnChainConfirmation: true` — Pure on-chain TXs (e.g., access token mint). Gateway tracks `pending → confirmed → updated` but does no DB writes.
- Registration happens when either flag is `true`. JWT is optional for registration.

### Step 2: Add Validation Schema

Add Zod schema in `~/config/transaction-schemas.ts`:

```typescript
const InstanceCourseCreateSchema = z.object({
  initiator_data: z.string().min(1),
  alias: z.string().min(1),
  teachers: z.array(z.string()),
});

export const TX_SCHEMAS: Partial<Record<TransactionType, z.ZodSchema>> = {
  // ... existing schemas
  INSTANCE_COURSE_CREATE: InstanceCourseCreateSchema,
};
```

### Step 3: Create/Update Component

Replace `useAndamioTransaction` with `useSimpleTransaction`:

```typescript
// Before (V1)
import { useAndamioTransaction } from "~/hooks/use-andamio-transaction";

const { state, result, execute } = useAndamioTransaction();

await execute({
  endpoint: "/tx/v2/instance/course/create",
  params: {...},
  txType: "INSTANCE_COURSE_CREATE",
});

// After (V2)
import { useSimpleTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";

const { state, result, execute, reset } = useSimpleTransaction();
const { status, isSuccess } = useTxWatcher(
  result?.requiresDBUpdate ? result.txHash : null
);

await execute({
  txType: "INSTANCE_COURSE_CREATE",
  params: {...},
});
```

### Step 4: Update UI for Confirmation Status

Handle both pure on-chain and gateway-confirmed flows:

```tsx
// Determine success type
const isPureOnChainSuccess = state === "success" && result && !result.requiresDBUpdate;

// Gateway polling status (only for TXs that need DB updates)
{state === "success" && result?.requiresDBUpdate && !isSuccess && (
  <div>Confirming on blockchain... {status?.state}</div>
)}

// Success (either pure on-chain or gateway confirmed)
{(isPureOnChainSuccess || isSuccess) && (
  <div>Transaction complete!</div>
)}
```

### Step 5: Remove Side Effects

Remove any `onSubmit` or `onConfirmation` side effects - the gateway handles these automatically:

```typescript
// Before (V1) - Side effects in transaction definition
onSubmit: async (txHash, params) => {
  await fetch("/api/db/update", {...});
},
onConfirmation: async (txHash, params) => {
  await fetch("/api/db/finalize", {...});
},

// After (V2) - No side effects needed
// Gateway handles DB updates via TxTypeRegistry
```

## Files to Update

For each transaction type, update these files:

| File | Changes |
|------|---------|
| `~/config/transaction-ui.ts` | Add `requiresDBUpdate` flag |
| `~/config/transaction-schemas.ts` | Add Zod validation schema |
| `~/hooks/tx/use-tx-watcher.ts` | Add TX_TYPE_MAP entry (if not exists) |
| Component file | Use `useSimpleTransaction` + `useTxWatcher` |

## Transaction Types Checklist

| TX Type | requiresDBUpdate | Migrated |
|---------|------------------|----------|
| GLOBAL_GENERAL_ACCESS_TOKEN_MINT | `false` | ✅ |
| INSTANCE_COURSE_CREATE | `true` | ✅ |
| INSTANCE_PROJECT_CREATE | `true` | ✅ |
| COURSE_OWNER_TEACHERS_MANAGE | `true` | ✅ |
| COURSE_TEACHER_MODULES_MANAGE | `true` | ✅ |
| COURSE_TEACHER_ASSIGNMENTS_ASSESS | `true` | ✅ |
| COURSE_STUDENT_ASSIGNMENT_COMMIT | `true` | ✅ |
| COURSE_STUDENT_ASSIGNMENT_UPDATE | `true` | ✅ |
| COURSE_STUDENT_CREDENTIAL_CLAIM | `true` | ✅ |
| PROJECT_OWNER_MANAGERS_MANAGE | `true` | ✅ |
| PROJECT_OWNER_BLACKLIST_MANAGE | `true` | ✅ |
| PROJECT_MANAGER_TASKS_MANAGE | `true` | ✅ |
| PROJECT_MANAGER_TASKS_ASSESS | `true` | ✅ |
| PROJECT_CONTRIBUTOR_TASK_COMMIT | `true` | ✅ |
| PROJECT_CONTRIBUTOR_TASK_ACTION | `true` | ✅ |
| PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM | `true` | ✅ |
| PROJECT_USER_TREASURY_ADD_FUNDS | `true` | ⏳ |

> **Note**: All 16 core transaction components have been migrated to V2 as of January 18, 2026.
> Treasury transactions are pending backend implementation.

## Reference Implementation

See `MintAccessTokenSimple` for a complete example:
- **Component**: `~/components/transactions/mint-access-token-simple.tsx`
- **Hook**: `~/hooks/tx/use-transaction.ts`
- **Watcher**: `~/hooks/tx/use-tx-watcher.ts`

## API Endpoints

- **Build TX**: `POST /api/gateway/api/v2/tx/{endpoint}`
- **Register TX**: `POST /api/gateway/api/v2/tx/register`
- **Check Status**: `GET /api/gateway/api/v2/tx/status/{txHash}`
- **List Pending**: `GET /api/gateway/api/v2/tx/pending`

See `~/.claude/skills/audit-api-coverage/tx-state-machine.md` for full API documentation.

## Testing

1. **Pure on-chain TX** (e.g., Access Token Mint):
   - Should show success immediately after wallet submission
   - No gateway polling
   - Verify token appears in wallet

2. **Gateway-tracked TX** (e.g., Course Create):
   - Should register with gateway after submission
   - Poll for status (pending → confirmed → updated)
   - Verify DB record created

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Button unresponsive | Missing wallet address | Ensure wallet is connected, get address from `useWallet()` |
| "Registering transaction..." stuck | TX doesn't need DB updates | Set `requiresDBUpdate: false` |
| 404 on TX build | Endpoint not found | Check `TRANSACTION_ENDPOINTS` mapping |
| Status never updates | Registration failed | Check JWT is available, endpoint is correct |
