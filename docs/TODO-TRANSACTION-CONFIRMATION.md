# TODO: Transaction Confirmation Handling

## Current Behavior

Currently, when a user submits a transaction:
1. Transaction is built and signed
2. Transaction is submitted to the blockchain
3. We immediately show "success" and display the txHash
4. User sees success toast and TransactionStatus component

**Problem**: We're showing success as soon as the transaction is submitted, but we don't wait for blockchain confirmation. The transaction could still fail or be rejected by the network.

## Future Enhancement: Confirmation Waiting

### What We Should Do

After transaction submission, we should:

1. **Submit Transaction**
   - Get txHash from blockchain submission
   - Show "Transaction Submitted" state (not "success" yet)

2. **Poll for Confirmation**
   - Use Mesh SDK or Blockfrost to poll transaction status
   - Check for confirmations (e.g., wait for 1-3 confirmations)
   - Show loading state: "Waiting for confirmation..."

3. **Confirmed Success**
   - Once transaction is confirmed on-chain
   - Show final success state
   - Show success toast
   - Update database state if needed

4. **Handle Confirmation Failures**
   - Transaction rejected by network
   - Transaction timed out
   - Show appropriate error message
   - Allow retry

### Implementation Approach

#### Option 1: Mesh SDK Transaction Tracking
```typescript
// After submitting transaction
const txHash = await wallet.submitTx(signedTx);

// Wait for confirmation
await wallet.waitForTransaction(txHash, {
  timeout: 300000, // 5 minutes
  checkInterval: 5000, // Check every 5 seconds
});
```

#### Option 2: Blockfrost API Polling
```typescript
// Poll Blockfrost for transaction status
const waitForConfirmation = async (txHash: string) => {
  const maxAttempts = 60; // 5 minutes with 5-second intervals
  for (let i = 0; i < maxAttempts; i++) {
    const tx = await blockfrost.txs(txHash);
    if (tx && tx.block_height) {
      return true; // Confirmed!
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  throw new Error("Transaction confirmation timeout");
};
```

#### Option 3: Koios API Polling
Similar to Blockfrost but using Koios API endpoints.

### Transaction States Update

Expand the `TransactionState` type to include:
```typescript
type TransactionState =
  | "idle"
  | "fetching"
  | "signing"
  | "submitting"
  | "confirming"    // NEW: Waiting for blockchain confirmation
  | "success"       // Only after confirmation
  | "error";
```

### UI Updates

**TransactionStatus Component**:
```typescript
// New confirming state
if (state === "confirming") {
  return (
    <AndamioAlert>
      <Clock className="h-4 w-4 animate-pulse" />
      <AndamioAlertTitle>Confirming Transaction</AndamioAlertTitle>
      <AndamioAlertDescription>
        <p>Transaction submitted to blockchain</p>
        <p className="text-xs mt-2">
          Waiting for confirmation... This may take 30-60 seconds.
        </p>
        {result?.txHash && (
          <a href={result.blockchainExplorerUrl} target="_blank">
            View transaction status
          </a>
        )}
      </AndamioAlertDescription>
    </AndamioAlert>
  );
}
```

**TransactionButton**:
```typescript
stateText={{
  idle: "Submit Transaction",
  fetching: "Preparing...",
  signing: "Sign in Wallet",
  submitting: "Submitting...",
  confirming: "Confirming...",  // NEW
}}
```

### Toast Notifications

Only show success toast AFTER confirmation:
```typescript
onSuccess: async (result) => {
  // Don't show toast yet - wait for confirmation
  setState("confirming");

  try {
    await waitForConfirmation(result.txHash);

    // NOW show success toast
    toast.success("Transaction Confirmed!", {
      description: "Your transaction has been confirmed on-chain",
    });

    setState("success");
  } catch (error) {
    toast.error("Confirmation Failed", {
      description: "Transaction was submitted but confirmation timed out",
    });
    setState("error");
  }
}
```

### Configuration

Make confirmation waiting configurable:
```typescript
// In env or config
NEXT_PUBLIC_WAIT_FOR_CONFIRMATION=true
NEXT_PUBLIC_CONFIRMATION_TIMEOUT=300000  // 5 minutes
NEXT_PUBLIC_CONFIRMATION_CHECK_INTERVAL=5000  // 5 seconds
```

### Edge Cases to Handle

1. **Transaction Submitted but Node Drops It**
   - Timeout and show error
   - Allow retry

2. **Multiple Confirmations Required**
   - For high-value transactions, wait for 2-3 confirmations
   - Show progress: "1/3 confirmations"

3. **Network Congestion**
   - Transaction takes longer than expected
   - Show message: "Network is busy, this may take a few minutes"

4. **User Closes Browser**
   - Store pending transaction in localStorage
   - On return, check status and show result

### Files to Update

When implementing this:

1. **`src/hooks/use-transaction.ts`**
   - Add "confirming" state
   - Add confirmation polling logic
   - Add timeout handling

2. **`src/components/transactions/transaction-status.tsx`**
   - Add UI for "confirming" state
   - Show progress indicator

3. **`src/components/transactions/transaction-button.tsx`**
   - Add "confirming" button text
   - Keep button disabled during confirmation

4. **`src/types/transaction.ts`**
   - Update TransactionState type
   - Add confirmation config types

5. **`src/lib/blockchain.ts`** (new file)
   - Create reusable confirmation polling utilities
   - Support multiple providers (Blockfrost, Koios, etc.)

6. **All transaction components**
   - Update to handle new "confirming" state
   - Update success callbacks to only fire after confirmation

## Priority

**Medium Priority** - Current implementation works for development, but this should be added before production use.

## Related Issues

- Transaction success shown before blockchain confirmation
- No way to track transaction status after submission
- Database updates happen before on-chain confirmation

## References

- [Mesh SDK Transaction Methods](https://meshjs.dev/apis/transaction)
- [Blockfrost Transaction Endpoints](https://docs.blockfrost.io/#tag/Cardano-Transactions)
- [Koios Transaction API](https://api.koios.rest/#tag/Transactions)
