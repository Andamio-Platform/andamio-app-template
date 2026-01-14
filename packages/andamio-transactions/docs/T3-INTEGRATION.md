# T3 App Template Integration Guide

This guide explains how to integrate transaction side effects into the T3 app template.

## Architecture Overview

### Responsibility Split

**T3 App Template (Frontend)**
- ✅ Executes `onSubmit` side effects immediately after transaction submission
- ✅ Skips "Not implemented" endpoints
- ✅ Handles non-critical failures gracefully
- ✅ Updates UI state based on results

**Transaction Monitoring Service (Backend)**
- ✅ Watches blockchain for transaction confirmations
- ✅ Executes `onConfirmation` side effects when transaction is confirmed
- ✅ Implements retry logic
- ✅ Handles critical failures

## Installation

The execution utilities are included in `@andamio/transactions`:

```bash
npm install @andamio/transactions
```

## Quick Start

### Basic Usage

```typescript
import { executeOnSubmit, getTransactionDefinition } from "@andamio/transactions";
import type { SubmissionContext } from "@andamio/transactions";

// Get transaction definition
const txDef = getTransactionDefinition("MINT_MODULE_TOKENS");

// Submit transaction
const txHash = await wallet.submitTx(signedTx);

// Create submission context
const context: SubmissionContext = {
  txHash,
  signedCbor,
  unsignedCbor,
  userId: session.userId,
  walletAddress: session.walletAddress,
  buildInputs: {
    user_access_token: "...",
    policy: "...",
    module_infos: "...",
  },
  timestamp: new Date(),
};

// Execute onSubmit side effects
const result = await executeOnSubmit(txDef.onSubmit, context, {
  apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL!,
  authToken: session.token,
});

if (!result.success) {
  console.error("Critical side effects failed:", result.criticalErrors);
}
```

## Understanding buildInputs and Schema Structure

Transaction definitions separate **transaction API parameters** from **side effect parameters** for clarity:

```typescript
import { ACCEPT_ASSIGNMENT } from "@andamio/transactions";

// Access specific schemas programmatically
const txApiSchema = ACCEPT_ASSIGNMENT.buildTxConfig.txApiSchema;
// Contains: { user_access_token, student_alias, policy }

const sideEffectSchema = ACCEPT_ASSIGNMENT.buildTxConfig.sideEffectSchema;
// Contains: { moduleCode }

const inputSchema = ACCEPT_ASSIGNMENT.buildTxConfig.inputSchema;
// Contains: ALL parameters merged (for validation)
```

**Building Inputs:**
```typescript
// Your component/hook needs to provide ALL parameters
const buildInputs = {
  // Transaction API parameters (used by blockchain transaction builder)
  user_access_token: userAccessToken,
  student_alias: studentAlias,
  policy: courseNftPolicyId,

  // Side effect parameters (NOT used by transaction API, but needed for onSubmit/onConfirmation)
  moduleCode: "M1",
};

// Validate before building transaction
const validated = ACCEPT_ASSIGNMENT.buildTxConfig.inputSchema.parse(buildInputs);
```

**At Runtime:**
All parameters are available in `buildInputs` during side effect execution, regardless of whether they came from `txApiSchema` or `sideEffectSchema`:

```typescript
// Side effect definition:
onSubmit: [{
  pathParams: {
    courseNftPolicyId: "buildInputs.policy",         // From txApiSchema
    moduleCode: "buildInputs.moduleCode",             // From sideEffectSchema
    accessTokenAlias: "buildInputs.student_alias",   // From txApiSchema
  }
}]
```

## React Hook Example

Create a custom hook for executing transactions with side effects:

```typescript
// hooks/useTransactionWithSideEffects.ts
import { useState } from "react";
import { useAndamioAuth } from "./useAndamioAuth";
import { useCardanoWallet } from "./useCardanoWallet";
import {
  executeOnSubmit,
  type AndamioTransactionDefinition,
  type SubmissionContext,
  type ExecuteOnSubmitResult,
} from "@andamio/transactions";

export function useTransactionWithSideEffects() {
  const { session } = useAndamioAuth();
  const { wallet } = useCardanoWallet();
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function executeTransaction(
    txDef: AndamioTransactionDefinition,
    signedCbor: string,
    unsignedCbor: string,
    buildInputs: Record<string, unknown>
  ) {
    setIsExecuting(true);
    setError(null);

    try {
      // 1. Submit transaction to blockchain
      const txHash = await wallet.submitTx(signedCbor);

      // 2. Create submission context
      const context: SubmissionContext = {
        txHash,
        signedCbor,
        unsignedCbor,
        userId: session!.userId,
        walletAddress: session!.walletAddress,
        buildInputs,
        timestamp: new Date(),
      };

      // 3. Execute onSubmit side effects
      const sideEffectResult = await executeOnSubmit(
        txDef.onSubmit,
        context,
        {
          apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL!,
          authToken: session!.token,
        }
      );

      // 4. Handle side effect failures
      if (!sideEffectResult.success) {
        console.warn(
          "Some side effects failed:",
          sideEffectResult.criticalErrors
        );
        // Don't throw - transaction was still submitted successfully
      }

      return {
        txHash,
        sideEffectResult,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsExecuting(false);
    }
  }

  return {
    executeTransaction,
    isExecuting,
    error,
  };
}
```

### Using the Hook in a Component

```typescript
// components/MintModuleTokensDialog.tsx
import { useState } from "react";
import { useTransactionWithSideEffects } from "@/hooks/useTransactionWithSideEffects";
import { getTransactionDefinition } from "@andamio/transactions";

export function MintModuleTokensDialog() {
  const { executeTransaction, isExecuting } = useTransactionWithSideEffects();
  const [txHash, setTxHash] = useState<string | null>(null);

  async function handleMintTokens() {
    try {
      const txDef = getTransactionDefinition("MINT_MODULE_TOKENS");

      // Build inputs (from form or props)
      const buildInputs = {
        user_access_token: userAccessToken,
        policy: courseNftPolicyId,
        module_infos: formatModuleInfosForMintModuleTokens(modules),
      };

      // Build transaction (call your build endpoint)
      const buildResponse = await fetch(
        `${apiBaseUrl}${txDef.buildTxConfig.builder.endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildInputs),
        }
      );
      const { unsignedCbor } = await buildResponse.json();

      // Sign transaction
      const signedCbor = await wallet.signTx(unsignedCbor);

      // Execute transaction with side effects
      const result = await executeTransaction(
        txDef,
        signedCbor,
        unsignedCbor,
        buildInputs
      );

      setTxHash(result.txHash);

      // Show success message
      toast.success(txDef.ui.successInfo);
    } catch (error) {
      toast.error("Transaction failed");
      console.error(error);
    }
  }

  return (
    <Dialog>
      <DialogContent>
        <DialogTitle>Mint Module Tokens</DialogTitle>
        <DialogDescription>
          This will mint tokens for your course modules on-chain.
        </DialogDescription>

        <Button onClick={handleMintTokens} disabled={isExecuting}>
          {isExecuting ? "Processing..." : "Mint Tokens"}
        </Button>

        {txHash && (
          <div>
            Transaction submitted: <code>{txHash}</code>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

## Advanced Usage

### Custom Error Handling

```typescript
const result = await executeOnSubmit(txDef.onSubmit, context, options);

// Check individual side effect results
for (const sideEffectResult of result.results) {
  if (sideEffectResult.skipped) {
    console.log(`Skipped: ${sideEffectResult.sideEffect.def}`);
  } else if (!sideEffectResult.success) {
    console.error(
      `Failed: ${sideEffectResult.sideEffect.def}`,
      sideEffectResult.error
    );
  } else {
    console.log(
      `Success: ${sideEffectResult.sideEffect.def}`,
      sideEffectResult.response
    );
  }
}
```

### Throw on Critical Failures

```typescript
// This will throw an error if any critical side effect fails
try {
  await executeOnSubmit(txDef.onSubmit, context, {
    apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL!,
    authToken: session.token,
    throwOnCriticalFailure: true, // ⚠️ Throws on critical failures
  });
} catch (error) {
  // Handle critical failure
  console.error("Critical side effect failed:", error);
}
```

### Filter Executable Side Effects

```typescript
import { getExecutableSideEffects } from "@andamio/transactions";

const txDef = getTransactionDefinition("MINT_MODULE_TOKENS");

// Get only side effects that will be executed (skips "Not implemented")
const executableEffects = getExecutableSideEffects(txDef.onSubmit);

console.log(`Will execute ${executableEffects.length} side effects`);
```

### Check if Side Effect Should Execute

```typescript
import { shouldExecuteSideEffect } from "@andamio/transactions";

const sideEffect = txDef.onSubmit![0];

if (shouldExecuteSideEffect(sideEffect)) {
  console.log("This side effect will be executed");
} else {
  console.log("This side effect will be skipped");
}
```

## Error Handling Strategy

### Non-Critical Failures

Non-critical side effects that fail will be logged but won't prevent the transaction from completing:

```typescript
// Side effect marked as non-critical (default)
{
  def: "Update Analytics",
  method: "POST",
  endpoint: "/analytics/track",
  critical: false, // or omitted (defaults to false)
}
```

**Behavior:**
- Failure is logged
- Transaction continues
- UI shows success (transaction was submitted)
- User is not blocked

### Critical Failures

Critical side effects must succeed for the transaction to be considered successful:

```typescript
// Side effect marked as critical
{
  def: "Update Course Module Status",
  method: "PATCH",
  endpoint: "/course-modules/{courseNftPolicyId}/{moduleCode}/status",
  critical: true, // Must succeed
}
```

**Behavior:**
- Failure is logged and returned in `criticalErrors`
- Transaction was still submitted to blockchain
- UI should warn user that post-processing failed
- User may need to retry or contact support

## UI Feedback Patterns

### Success State

```typescript
if (result.success) {
  toast.success(txDef.ui.successInfo);
  // All side effects succeeded
}
```

### Partial Success State

```typescript
if (!result.success && result.criticalErrors.length > 0) {
  toast.warning(
    "Transaction submitted, but some updates failed. Please refresh the page."
  );
  // Transaction submitted, but critical side effects failed
}
```

### Complete Failure State

```typescript
try {
  await executeTransaction(...);
} catch (error) {
  toast.error("Transaction failed to submit");
  // Transaction was not submitted to blockchain
}
```

## Testing

### Mock Side Effect Execution

```typescript
import { executeSideEffect } from "@andamio/transactions";
import { createMockSubmissionContext } from "@andamio/transactions";

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});

const result = await executeSideEffect(
  sideEffect,
  createMockSubmissionContext(),
  {
    apiBaseUrl: "http://localhost:4000/api/v0",
    authToken: "mock_token",
    fetchImpl: mockFetch,
  }
);

expect(result.success).toBe(true);
expect(mockFetch).toHaveBeenCalledWith(
  "http://localhost:4000/api/v0/course-modules/policy123/MODULE_1/status",
  expect.objectContaining({
    method: "PATCH",
    headers: expect.objectContaining({
      Authorization: "Bearer mock_token",
    }),
  })
);
```

## Best Practices

### 1. Always Handle Errors Gracefully

Don't let side effect failures prevent transaction submission:

```typescript
try {
  const txHash = await wallet.submitTx(signedCbor);

  // Execute side effects AFTER transaction is submitted
  try {
    await executeOnSubmit(txDef.onSubmit, context, options);
  } catch (error) {
    // Log error but don't fail the transaction
    console.error("Side effects failed:", error);
  }

  return txHash;
} catch (error) {
  // This is a real transaction failure
  throw error;
}
```

### 2. Show Clear UI Feedback

```typescript
// ✅ Good
toast.success("Transaction submitted successfully!");
if (!sideEffectResult.success) {
  toast.warning("Some updates are pending. Please refresh in a moment.");
}

// ❌ Bad
if (!sideEffectResult.success) {
  toast.error("Transaction failed!"); // Transaction actually succeeded!
}
```

### 3. Log Side Effect Results

```typescript
// Log for debugging
console.log("Side effect results:", {
  success: result.success,
  executed: result.results.filter((r) => !r.skipped).length,
  skipped: result.results.filter((r) => r.skipped).length,
  failed: result.results.filter((r) => !r.success && !r.skipped).length,
  criticalErrors: result.criticalErrors,
});
```

### 4. Consider Retry Logic

```typescript
async function executeWithRetry(
  txDef: AndamioTransactionDefinition,
  context: SubmissionContext,
  options: ExecuteSideEffectOptions,
  maxRetries = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    const result = await executeOnSubmit(txDef.onSubmit, context, options);

    if (result.success) {
      return result;
    }

    // Wait before retry (exponential backoff)
    await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
  }

  throw new Error("Side effects failed after retries");
}
```

## API Reference

See the [main README](./README.md) for complete API documentation of:

- `executeOnSubmit()`
- `executeSideEffect()`
- `shouldExecuteSideEffect()`
- `getExecutableSideEffects()`

## Next Steps

1. Implement the `useTransactionWithSideEffects` hook in your T3 app
2. Update existing transaction flows to use `executeOnSubmit`
3. Add proper error handling and UI feedback
4. Test with "Not implemented" endpoints
5. Monitor side effect success rates in production
