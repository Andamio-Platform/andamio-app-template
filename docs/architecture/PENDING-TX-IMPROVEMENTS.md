# Pending Transaction Watcher - Improvements Over Previous Implementation

## Comparison: Old vs New

### Old Implementation (`andamio-platform`)

**Architecture:**
```typescript
// User-level tracking
User {
  unconfirmedTx: string?  // Single transaction hash
}

Learner {
  pendingEnrollmentTxHash: string?
}

Contributor {
  pendingEnrollmentTxHash: string?
}

// Manual checking via tRPC mutations
checkUserUnconfirmedTxs()
checkLearnerUnconfirmedTxs()
checkContributorUnconfirmedTxs()
```

**Problems:**

1. **Limited to One Transaction per User**
   - Each user/learner/contributor can only track ONE pending transaction
   - New transactions overwrite previous ones
   - Can't handle parallel transactions (e.g., minting multiple modules)

2. **User-Initiated Polling**
   - User must manually call check endpoints
   - Requires UI to implement polling logic
   - Inconsistent across different pages

3. **Tight Coupling**
   ```typescript
   // Business logic mixed with blockchain queries
   async checkUserUnconfirmedTxs() {
     const user = await db.user.findFirst(...);
     const utxo = await maestro.fetchUTxOs(user.unconfirmedTx);
     await updateAssignmentCommitmentStatus(...);
     await updateTaskCommitmentStatus(...);
     await updateCourseModuleStatus(...);
     await updateTaskStatus(...);
   }
   ```

4. **No Retry Logic**
   - If API call fails, transaction state is lost
   - No error handling for failed updates

5. **Complex Status Mapping**
   ```typescript
   // Manual switch statements for each entity type
   switch (pendingAssignmentTx.networkStatus) {
     case "PENDING_TX_ADD_INFO":
       updatedStatus = "PENDING_APPROVAL";
       break;
     case "PENDING_TX_COMMITMENT_MADE":
       updatedStatus = "PENDING_APPROVAL";
       break;
     // ... 20+ more cases
   }
   ```

6. **No Persistence**
   - Pending transactions lost on page refresh
   - User must re-initiate check after navigation

---

### New Implementation (`andamio-t3-app-template`)

**Architecture:**
```typescript
// Entity-level tracking (already exists in schema)
Module {
  pendingTxHash: string?
  status: ModuleStatus  // Includes PENDING_TX
}

// Client-side watcher (temporary until backend service)
usePendingTxWatcher({
  pollInterval: 30000,
  onConfirmation: (tx) => { /* auto-update */ }
})
```

**Improvements:**

### 1. **Multi-Transaction Support**

Track unlimited pending transactions simultaneously:

```typescript
const pending = [
  {
    id: "module-MODULE_1",
    txHash: "abc123...",
    entityType: "module",
    entityId: "MODULE_1",
  },
  {
    id: "module-MODULE_2",
    txHash: "def456...",
    entityType: "module",
    entityId: "MODULE_2",
  },
  {
    id: "assignment-ASSIGN_1",
    txHash: "ghi789...",
    entityType: "assignment",
    entityId: "ASSIGN_1",
  },
];
```

**Before:** ❌ Only 1 transaction per user
**After:** ✅ Unlimited concurrent transactions

---

### 2. **Automatic Polling**

No user action required - automatic background monitoring:

```tsx
// Add to root layout once
<PendingTxWatcher pollInterval={30000} />

// Transactions automatically tracked after submission
<AndamioTransaction
  definition={MINT_MODULE_TOKENS}
  onSuccess={(result) => {
    // Transaction automatically added to watch list
  }}
/>
```

**Before:** ❌ User must manually trigger checks
**After:** ✅ Fully automatic background monitoring

---

### 3. **Separation of Concerns**

Clean architecture with separated layers:

```
┌─────────────────────────────────────┐
│  Blockchain Layer                   │
│  - cardano-indexer.ts               │
│  - Koios API integration            │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Business Logic Layer               │
│  - use-pending-tx-watcher.ts        │
│  - Process confirmations            │
│  - Execute side effects             │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Presentation Layer                 │
│  - pending-tx-watcher.tsx           │
│  - User notifications               │
│  - Visual indicators                │
└─────────────────────────────────────┘
```

**Before:** ❌ Mixed concerns in single file
**After:** ✅ Clean separation, easy to test and maintain

---

### 4. **Retry Logic with Error Handling**

Graceful handling of failures:

```typescript
const watcher = usePendingTxWatcher({
  maxRetries: 3,
  onError: (tx, error) => {
    console.error(`Failed after 3 retries:`, error);
    // User notification
    // Error reporting
  },
});
```

**Retry Flow:**
```
1. API call fails
2. Retry 1 (wait for next poll)
3. Retry 2 (wait for next poll)
4. Retry 3 (wait for next poll)
5. Max retries → Remove from watch list + notify user
```

**Before:** ❌ No retry logic
**After:** ✅ Automatic retries with max limit

---

### 5. **Side Effects Integration**

Uses the declarative side effects system:

```typescript
// Transaction definition
MINT_MODULE_TOKENS = {
  onSubmit: [
    {
      def: "Update Module Status",
      method: "PATCH",
      endpoint: "/course-module/update-status",
      body: {
        status: { source: "literal", value: "PENDING_TX" },
        pendingTxHash: { source: "context", path: "txHash" },
      },
    },
  ],
  onConfirmation: [
    {
      def: "Update Module Status",
      method: "PATCH",
      endpoint: "/course-module/update-status",
      body: {
        status: { source: "literal", value: "ON_CHAIN" },
        moduleHash: { source: "onChainData", path: "mints[0].assetName" },
      },
    },
  ],
};
```

**Status Updates:**
```
Submit → onSubmit → PENDING_TX
Confirm → onConfirmation → ON_CHAIN
```

**Before:** ❌ Hardcoded switch statements
**After:** ✅ Declarative side effects

---

### 6. **LocalStorage Persistence**

Survives page refreshes and navigation:

```typescript
// Automatically saved to localStorage
localStorage.getItem("andamio-pending-transactions");

// Restored on page load
useEffect(() => {
  const stored = localStorage.getItem("andamio-pending-transactions");
  setPendingTransactions(JSON.parse(stored));
}, []);
```

**Before:** ❌ Lost on refresh
**After:** ✅ Persists across sessions

---

### 7. **Free Blockchain API**

No API key required for basic usage:

```typescript
// Koios (free, no API key)
const response = await fetch(
  "https://api.koios.rest/api/v1/tx_status?_tx_hashes=${txHash}"
);
```

**API Comparison:**

| Provider | Free Tier | API Key Required | Rate Limit |
|----------|-----------|------------------|------------|
| Koios | ✅ Yes | ❌ No | 100 req/min |
| Maestro | ❌ No | ✅ Yes | Varies |
| Blockfrost | ⚠️ Limited | ✅ Yes | 50 req/day |

**Before:** ⚠️ Maestro (requires API key)
**After:** ✅ Koios (free, no key)

---

### 8. **Better User Experience**

Automatic notifications and visual feedback:

```tsx
// Toast notifications
toast.success("Transaction Confirmed", {
  description: "Your module transaction has been confirmed with 2 confirmations.",
});

// Visual indicator
{watcherState.isChecking && (
  <div className="fixed bottom-4 right-4">
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
      Checking 1 pending transaction...
    </div>
  </div>
)}
```

**Before:** ❌ No automatic notifications
**After:** ✅ Toast notifications + visual indicators

---

### 9. **Configurable & Extensible**

Easy to customize and extend:

```typescript
// Adjust polling interval
<PendingTxWatcher pollInterval={60000} /> // 1 minute

// Conditional enabling
<PendingTxWatcher enabled={isAuthenticated} />

// Custom callbacks
const watcher = usePendingTxWatcher({
  onConfirmation: (tx) => {
    // Custom analytics
    analytics.track("Transaction Confirmed", { txHash: tx.txHash });
    // Custom notifications
    sendSlackNotification(tx);
  },
});

// Add new entity types
switch (tx.entityType) {
  case "module":
    await processConfirmedModule(tx, onChainData);
    break;
  case "my-new-entity":
    await processConfirmedMyNewEntity(tx, onChainData);
    break;
}
```

**Before:** ❌ Hardcoded logic
**After:** ✅ Fully configurable

---

### 10. **Migration Path to Backend**

Designed for easy migration to backend service:

```typescript
// Current: Client-side polling
usePendingTxWatcher({ pollInterval: 30000 });

// Future: Backend service
// 1. Keep UI components (status badges, alerts)
// 2. Remove polling logic
// 3. Backend monitors transactions
// 4. WebSocket/SSE for real-time updates (optional)
```

**Migration Steps:**
1. Create backend monitoring service
2. Add cron job to check pending transactions
3. Remove `PendingTxWatcher` from layout
4. Keep PENDING_TX UI indicators
5. Add webhook support (optional)

**Before:** ❌ Tightly coupled to tRPC
**After:** ✅ Clear migration path

---

## Code Comparison

### Old: Checking Pending Transactions

```typescript
// OLD: Manual tRPC call from UI
const checkTx = api.pendingTxCheck.checkUserUnconfirmedTxs.useMutation();

useEffect(() => {
  const interval = setInterval(() => {
    checkTx.mutate(); // User must implement polling
  }, 30000);
  return () => clearInterval(interval);
}, []);
```

### New: Automatic Monitoring

```tsx
// NEW: Add once to layout
<PendingTxWatcher />

// Transactions automatically tracked
<AndamioTransaction
  definition={MINT_MODULE_TOKENS}
  onSuccess={(result) => {
    // Auto-tracked, auto-monitored
  }}
/>
```

---

### Old: Status Update Logic

```typescript
// OLD: Hardcoded switch statement
const updateAssignmentCommitmentStatus = async (db, pendingTxHash) => {
  const pendingTxs = await db.assignmentCommitment.findMany({
    where: { pendingTxHash },
  });

  for (const tx of pendingTxs) {
    let updatedStatus;
    switch (tx.networkStatus) {
      case "PENDING_TX_ADD_INFO":
        updatedStatus = "PENDING_APPROVAL";
        break;
      case "PENDING_TX_COMMITMENT_MADE":
        updatedStatus = "PENDING_APPROVAL";
        break;
      case "PENDING_TX_CLAIM_CREDENTIAL":
        updatedStatus = "CREDENTIAL_CLAIMED";
        break;
      // ... 20+ more cases
    }

    await db.assignmentCommitment.update({
      where: { id: tx.id },
      data: {
        pendingTxHash: null,
        networkStatus: updatedStatus,
      },
    });
  }
};
```

### New: Declarative Side Effects

```typescript
// NEW: Side effect definition
onConfirmation: [
  {
    def: "Update Module Status",
    method: "PATCH",
    endpoint: "/course-module/update-status",
    body: {
      status: { source: "literal", value: "ON_CHAIN" },
      moduleHash: { source: "onChainData", path: "mints[0].assetName" },
    },
  },
];

// Execution handled automatically
const onChainData = await extractOnChainData(txHash);
await executeOnConfirmation(definition.onConfirmation, context, options);
```

---

## Summary

### Key Improvements

| Feature | Old | New |
|---------|-----|-----|
| Concurrent Transactions | ❌ 1 per user | ✅ Unlimited |
| Automatic Polling | ❌ Manual | ✅ Automatic |
| Persistence | ❌ None | ✅ localStorage |
| Retry Logic | ❌ None | ✅ 3 retries |
| Side Effects | ❌ Hardcoded | ✅ Declarative |
| Notifications | ❌ None | ✅ Toast + Visual |
| Free API | ⚠️ Maestro | ✅ Koios |
| Separation of Concerns | ❌ Mixed | ✅ Layered |
| Extensibility | ❌ Limited | ✅ High |
| Migration Path | ❌ None | ✅ Clear |

### Benefits

✅ **Better UX** - Automatic monitoring, notifications, persistence
✅ **More Reliable** - Retry logic, error handling
✅ **More Scalable** - Multiple concurrent transactions
✅ **More Maintainable** - Separated concerns, declarative
✅ **More Flexible** - Configurable, extensible
✅ **Lower Cost** - Free blockchain API
✅ **Future-Proof** - Easy migration to backend

### Migration from Old to New

If migrating an existing application:

1. **Keep database schema** - `pendingTxHash` fields already exist
2. **Remove tRPC endpoints** - Remove `pendingTxCheckRouter`
3. **Add watcher component** - Add `<PendingTxWatcher />` to layout
4. **Update transaction components** - Use `useTrackPendingTx()` hook
5. **Remove manual polling** - Delete old polling logic
6. **Test thoroughly** - Verify all entity types work

---

The new implementation provides a more robust, user-friendly, and maintainable solution for monitoring pending blockchain transactions in the T3 App Template.
