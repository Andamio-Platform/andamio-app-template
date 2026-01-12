# Pending Transaction Watcher

Automatic monitoring and confirmation of blockchain transactions in the T3 App Template.

## Overview

The Pending Transaction Watcher provides automatic monitoring of submitted blockchain transactions and updates entity status when transactions are confirmed on-chain.

**Key Features:**
- ✅ Automatic polling of blockchain for transaction confirmations
- ✅ Status updates via API when transactions confirm
- ✅ Toast notifications for user feedback
- ✅ LocalStorage persistence (survives page refreshes)
- ✅ Error handling and retry logic
- ✅ Zero configuration required for standard transactions

**Note:** This is a temporary client-side solution. In production, this functionality should be moved to a backend monitoring service for better reliability and scalability.

## Architecture

```
┌─────────────────────────────────────────┐
│  User submits transaction               │
│  (e.g., Mint Module Tokens)             │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  onSubmit Side Effects Execute          │
│  - Status → PENDING_TX                  │
│  - Save pendingTxHash                   │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  PendingTxWatcher Added to Watch List   │
│  - Stored in localStorage               │
│  - Polling starts (30s interval)        │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Koios API Polling                      │
│  - Check transaction status every 30s   │
│  - Wait for confirmations > 0           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  Transaction Confirmed!                 │
│  - Extract on-chain data                │
│  - Execute onConfirmation (future)      │
│  - Update status: PENDING_TX → ON_CHAIN │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│  User Notification                      │
│  - Toast: "Transaction Confirmed"       │
│  - Page refreshes automatically         │
│  - Remove from watch list               │
└─────────────────────────────────────────┘
```

## Components

### 1. Blockchain Indexer (`lib/cardano-indexer.ts`)

Provides blockchain query functionality using the Koios API (free, no API key required).

**Functions:**
- `checkTransactionConfirmation(txHash)` - Check if transaction is confirmed
- `getTransactionOutputs(txHash)` - Get UTxOs for a transaction
- `extractOnChainData(txHash)` - Extract on-chain data for side effects
- `checkTransactionsBatch(txHashes)` - Check multiple transactions in parallel

**Example:**
```typescript
import { checkTransactionConfirmation } from "~/lib/cardano-indexer";

const confirmation = await checkTransactionConfirmation(txHash);
if (confirmation.confirmed) {
  console.log(`Confirmed with ${confirmation.confirmations} confirmations`);
}
```

### 2. Pending Tx Watcher Hook (`hooks/use-pending-tx-watcher.ts`)

React hook for monitoring pending transactions.

**Features:**
- Automatic polling at configurable intervals
- LocalStorage persistence
- Retry logic for failed API calls
- Callbacks for confirmation and errors

**Example:**
```typescript
const { pendingTransactions, addPendingTx, checkNow } = usePendingTxWatcher({
  pollInterval: 30000, // 30 seconds
  onConfirmation: (tx, confirmation) => {
    console.log("Transaction confirmed:", tx.txHash);
    router.refresh();
  },
});

// Add a pending transaction
addPendingTx({
  id: `module-${moduleCode}`,
  txHash: "abc123...",
  entityType: "module",
  entityId: moduleCode,
  context: { courseNftPolicyId, moduleCode },
  submittedAt: new Date(),
});
```

### 3. PendingTxWatcher Component (`components/pending-tx-watcher.tsx`)

Global React component that provides context and UI for pending transaction monitoring.

**Features:**
- Provides context for accessing watcher from anywhere
- Shows visual indicator when checking transactions
- Automatic toast notifications
- Page refresh on confirmation

## Setup

### 1. Add to Root Layout

Add the `PendingTxWatcher` component to your root layout:

```tsx
// app/layout.tsx
import { PendingTxWatcher } from "~/components/pending-tx-watcher";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Add PendingTxWatcher to monitor transactions globally */}
        <PendingTxWatcher pollInterval={30000} enabled={true}>
          {children}
        </PendingTxWatcher>
      </body>
    </html>
  );
}
```

### 2. Track Pending Transactions in Components

Use the `useTrackPendingTx` hook in transaction components:

```tsx
import { useTrackPendingTx } from "~/components/pending-tx-watcher";

function MintModuleTokens() {
  const { trackPendingTx } = useTrackPendingTx();

  const handleSuccess = async (result: { txHash: string }) => {
    // Track the pending transaction
    trackPendingTx({
      id: `module-${moduleCode}`,
      txHash: result.txHash,
      entityType: "module",
      entityId: moduleCode,
      context: {
        courseNftPolicyId,
        moduleCode,
      },
    });
  };

  return (
    <AndamioTransaction
      definition={MINT_MODULE_TOKENS}
      inputs={{ ... }}
      onSuccess={handleSuccess}
    />
  );
}
```

### 3. (Optional) Automatic Integration

The `AndamioTransaction` component can be updated to automatically track pending transactions. See the integration section below.

## Entity Types Supported

Currently supported entity types:

| Entity Type | Status Flow | Handler |
|-------------|-------------|---------|
| **module** | PENDING_TX → ON_CHAIN | ✅ Implemented |
| **access-token** | (pending) → confirmed | ✅ Implemented (uses `refreshAuth()` instead of page refresh) |
| **course** | Created on submit | ✅ Implemented |
| **project** | Created on submit | ✅ Implemented |
| assignment | PENDING_TX → ... | 🔄 TODO |
| task | PENDING_TX → ON_CHAIN | 🔄 TODO |
| assignment-commitment | PENDING_TX_* → ... | ✅ Implemented |
| task-commitment | PENDING_TX → ... | 🔄 TODO |

### Adding Support for New Entity Types

To add support for a new entity type:

1. **Add handler in `use-pending-tx-watcher.ts`:**

```typescript
const processConfirmed[EntityType] = useCallback(
  async (tx: PendingTransaction, onChainData: Record<string, unknown>) => {
    const { entityId } = tx.context;

    // Extract data from on-chain
    const someData = onChainData.mints?.[0]?.assetName;

    // Update entity status via API (Andamio API uses POST for all mutations)
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/[entity-endpoint]/confirm-transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tx_hash: tx.txHash,
          someData,
        }),
      }
    );

    // Handle response...
  },
  [authenticatedFetch]
);
```

2. **Add case in `processConfirmedTransaction`:**

```typescript
switch (tx.entityType) {
  case "module":
    await processConfirmedModule(tx, onChainData);
    break;
  case "your-entity-type":
    await processConfirmedYourEntityType(tx, onChainData);
    break;
}
```

## Configuration

### Polling Interval

Adjust the polling interval based on your needs:

```tsx
<PendingTxWatcher
  pollInterval={60000} // 1 minute (less frequent checks)
  enabled={true}
/>
```

**Recommended Values:**
- Development: 10000 (10 seconds) - faster feedback
- Production: 30000 (30 seconds) - balance between UX and API usage
- Low priority: 60000 (1 minute) - minimal API calls

### Enable/Disable

Conditionally enable the watcher:

```tsx
<PendingTxWatcher
  enabled={isAuthenticated} // Only watch when user is logged in
  pollInterval={30000}
/>
```

### Custom Callbacks

Handle confirmation events:

```tsx
const { addPendingTx } = usePendingTxWatcher({
  onConfirmation: (tx, confirmation) => {
    console.log(`Transaction ${tx.txHash} confirmed!`);
    // Custom logic (analytics, notifications, etc.)
  },
  onError: (tx, error) => {
    console.error(`Failed to process ${tx.txHash}:`, error);
    // Error reporting, user notification, etc.
  },
});
```

## User Experience

### Visual Indicators

**During Polling:**
```
┌────────────────────────────────────┐
│ ⚫ Checking 1 pending transaction...│
└────────────────────────────────────┘
```

**On Confirmation:**
```
┌────────────────────────────────────┐
│ ✅ Transaction Confirmed           │
│    Your module transaction has     │
│    been confirmed on-chain with    │
│    2 confirmations.                │
└────────────────────────────────────┘
```

**On Error:**
```
┌────────────────────────────────────┐
│ ❌ Transaction Processing Failed   │
│    Failed to process confirmed     │
│    transaction. Please refresh     │
│    the page manually.              │
└────────────────────────────────────┘
```

### Module Status Badge

Show pending status in UI:

```tsx
{module.status === "PENDING_TX" && (
  <Badge variant="warning" className="gap-1">
    <Clock className="h-3 w-3 animate-pulse" />
    Pending Confirmation
  </Badge>
)}
```

With transaction link:

```tsx
{module.pendingTxHash && (
  <a
    href={`https://cardanoscan.io/transaction/${module.pendingTxHash}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-xs text-muted-foreground hover:underline"
  >
    View Transaction ↗
  </a>
)}
```

## LocalStorage Persistence

Pending transactions are automatically saved to localStorage and restored on page load:

**Storage Key:** `andamio-pending-transactions`

**Data Structure:**
```json
[
  {
    "id": "module-MODULE_1",
    "txHash": "abc123def456...",
    "entityType": "module",
    "entityId": "MODULE_1",
    "context": {
      "courseNftPolicyId": "policy123...",
      "moduleCode": "MODULE_1"
    },
    "submittedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Benefits:**
- Survives page refreshes
- Survives browser restarts
- Shared across tabs (same origin)

**Limitations:**
- Lost if user clears browser data
- Not synced across devices
- Limited to ~5-10MB total

## Error Handling

### Retry Logic

Failed API calls are automatically retried:

- **Default Max Retries:** 3
- **Behavior:** If max retries exceeded, transaction is removed from watch list
- **Notification:** User receives error toast

### Blockchain Query Errors

If Koios API is unavailable:

- **Behavior:** Error is logged, polling continues for other transactions
- **Fallback:** None (temporary client-side solution)

### Status Update Errors

If API endpoint returns error:

- **Behavior:** Retry up to max retries
- **User Notification:** Error toast after max retries
- **Action Required:** User may need to manually update status

## API Usage

### Koios API

**Endpoint:** `https://api.koios.rest/api/v1`

**Rate Limits:**
- Free tier: 100 requests/minute
- No API key required for basic usage

**Endpoints Used:**
- `GET /tx_status?_tx_hashes={hash}` - Check transaction status
- `GET /tx_utxos?_tx_hashes={hash}` - Get transaction outputs

**Cost:** FREE ✅

### Alternative Indexers

To switch to a different indexer (Blockfrost, Maestro, etc.), update `cardano-indexer.ts`:

```typescript
// Example: Blockfrost
const BLOCKFROST_API_BASE = "https://cardano-mainnet.blockfrost.io/api/v0";
const BLOCKFROST_API_KEY = env.NEXT_PUBLIC_BLOCKFROST_KEY;

export async function checkTransactionConfirmation(txHash: string) {
  const response = await fetch(`${BLOCKFROST_API_BASE}/txs/${txHash}`, {
    headers: {
      "project_id": BLOCKFROST_API_KEY,
    },
  });
  // Parse response...
}
```

## Testing

### Manual Testing

1. **Submit a transaction** (e.g., Mint Module Tokens)
2. **Verify pending state:**
   - Check module status is `PENDING_TX`
   - Check `pendingTxHash` is set
   - Check localStorage contains transaction
3. **Wait for confirmation:**
   - Watch console for polling logs
   - Wait ~1-2 minutes for transaction to confirm
4. **Verify confirmation:**
   - Toast notification appears
   - Module status updates to `ON_CHAIN`
   - Transaction removed from localStorage

### Simulated Testing

Test without blockchain:

```typescript
// Temporarily modify checkTransactionConfirmation
export async function checkTransactionConfirmation(txHash: string) {
  // Simulate immediate confirmation
  return {
    txHash,
    confirmed: true,
    confirmations: 1,
    blockHeight: 1000000,
  };
}
```

## Migration to Backend

When moving this functionality to a backend service:

### Backend Service Requirements

1. **Persistent Storage:** Database to track pending transactions
2. **Scheduled Jobs:** Cron job or worker to poll blockchain
3. **Webhook Support:** Optional webhooks for instant notifications
4. **Service Authentication:** API endpoint that bypasses PENDING_TX protection

### Migration Steps

1. **Create backend monitoring service:**
   ```typescript
   // Backend job (runs every 30 seconds)
   async function checkPendingTransactions() {
     const pending = await db.module.findMany({
       where: { status: "PENDING_TX" }
     });

     for (const module of pending) {
       const confirmation = await checkTransactionConfirmation(
         module.pendingTxHash
       );

       if (confirmation.confirmed) {
         await updateModuleToOnChain(module, confirmation);
       }
     }
   }
   ```

2. **Update API endpoints:**
   - Add service authentication
   - Allow service to bypass PENDING_TX protection

3. **Remove client-side watcher:**
   - Remove `PendingTxWatcher` from layout
   - Remove localStorage persistence
   - Keep UI indicators for PENDING_TX status

4. **Add webhook support (optional):**
   - Subscribe to blockchain events
   - Instant updates instead of polling

## Troubleshooting

### Transactions Not Being Monitored

**Check:**
1. Is `PendingTxWatcher` added to layout?
2. Is watcher `enabled={true}`?
3. Check console for errors
4. Verify localStorage contains transaction

### Status Not Updating

**Check:**
1. Is transaction actually confirmed on blockchain?
2. Check console for API errors
3. Verify authentication token is valid
4. Check API endpoint permissions

### High API Usage

**Solutions:**
1. Increase `pollInterval` (e.g., 60000 = 1 minute)
2. Disable watcher when user is inactive
3. Move to backend monitoring service

---

## PENDING_TX Status Protection

When an entity has a `PENDING_TX` status, it indicates a blockchain transaction has been submitted but not yet confirmed. During this period, **only the blockchain confirmation service should be able to update the status** - users should not be able to make changes.

This protection prevents data inconsistencies where a user might change status while a transaction is being confirmed on-chain.

### Backend Protection (API Layer)

Add validation in status update endpoints to prevent user updates when status is `PENDING_TX`:

```typescript
// Before updating status
if (currentStatus === "PENDING_TX") {
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Cannot update status while transaction is pending. Only blockchain confirmation can update PENDING_TX status.",
  });
}
```

**Key Points:**
- Use `FORBIDDEN` error code (403)
- Provide clear error message explaining why the update is blocked
- This check should happen **before** status transition validation
- Only the monitoring/confirmation service should bypass this check

### Frontend Protection (UI Layer)

Disable status controls and show informative message when status is `PENDING_TX`:

```tsx
<Select
  value={status}
  onValueChange={setStatus}
  disabled={entity?.status === "PENDING_TX"}
>
  {/* ... options */}
</Select>

{entity?.status === "PENDING_TX" && (
  <Alert>
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Status is locked while transaction is pending. Only blockchain
      confirmation can update from PENDING_TX to ON_CHAIN.
    </AlertDescription>
  </Alert>
)}
```

**Key Points:**
- Disable form controls (don't just hide them)
- Show clear explanation of why controls are disabled
- Display transaction hash with link to blockchain explorer
- Provide visual indicator (Alert/Badge) that status is locked

### Entities with PENDING_TX Protection

| Entity | Status Field | Protection Status |
|--------|--------------|-------------------|
| Course Module | `status: PENDING_TX` | ✅ Implemented |
| Assignment Commitment | `networkStatus: PENDING_TX_*` | 🔄 TODO |
| Task | `status: PENDING_TX` | 🔄 TODO |
| Task Commitment | `status: PENDING_TX` | 🔄 TODO |

### Implementation Checklist

When adding status update functionality for entities with pending transaction states:

**Backend (API):**
- [ ] Add validation check for `PENDING_TX` status before processing updates
- [ ] Use `FORBIDDEN` error code with clear message
- [ ] Place check **before** status transition validation
- [ ] Document that only monitoring service should bypass this check

**Frontend (UI):**
- [ ] Disable status form controls when status is `PENDING_TX`
- [ ] Show Alert/message explaining status is locked
- [ ] Display pending transaction hash with blockchain explorer link
- [ ] Update save/submit button to be disabled when status is locked

---

## Summary

The Pending Transaction Watcher provides a simple, temporary solution for monitoring blockchain transactions in the T3 App Template:

- ✅ Zero configuration for standard transactions
- ✅ Automatic status updates when confirmed
- ✅ Persists across page refreshes
- ✅ User-friendly notifications
- ✅ Free blockchain API (Koios)
- ✅ PENDING_TX protection prevents user modifications during pending state

For production applications, migrate this functionality to a backend monitoring service for improved reliability and scalability.
