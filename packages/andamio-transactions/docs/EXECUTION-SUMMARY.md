# Side Effect Execution - Complete Summary

## Overview

We've implemented a complete system for executing transaction side effects in the Andamio platform, with clear separation of responsibilities between frontend and backend.

## Architecture

### T3 App Template (Frontend)
**Responsibility**: Execute `onSubmit` side effects immediately after transaction submission

**Features**:
- ✅ Executes side effects right after `wallet.submitTx()`
- ✅ Skips "Not implemented" endpoints automatically
- ✅ Handles non-critical failures gracefully
- ✅ Updates UI state based on results
- ✅ Provides detailed error reporting

**When**: Immediately after transaction is submitted to the blockchain

### Transaction Monitoring Service (Backend)
**Responsibility**: Execute `onConfirmation` side effects after transaction confirmation

**Features**:
- ✅ Watches blockchain for confirmations
- ✅ Executes side effects when transaction is confirmed
- ✅ Implements retry logic for failures
- ✅ Handles critical failures
- ✅ Extracts on-chain data for side effects

**When**: After transaction has been confirmed on-chain (typically 1-2 minutes)

## What Was Built

### 1. Execution Utilities (`src/execution/index.ts`)

**Core Functions**:

#### `executeOnSubmit(onSubmit, context, options)`
Main function for T3 app to execute all onSubmit side effects.

```typescript
const result = await executeOnSubmit(txDef.onSubmit, context, {
  apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL!,
  authToken: session.token,
});

// Returns:
{
  success: boolean,              // All critical effects succeeded
  results: [...],                // Individual results
  criticalErrors: [...]          // List of critical failures
}
```

#### `executeSideEffect(sideEffect, context, options)`
Executes a single side effect.

```typescript
const result = await executeSideEffect(sideEffect, context, options);

// Returns:
{
  sideEffect: {...},            // Original side effect
  success: boolean,             // Execution succeeded
  skipped: boolean,             // Was skipped ("Not implemented")
  error?: string,               // Error message if failed
  response?: any                // API response if successful
}
```

#### `shouldExecuteSideEffect(sideEffect)`
Checks if a side effect should be executed.

```typescript
if (shouldExecuteSideEffect(sideEffect)) {
  // Will execute
}
```

#### `getExecutableSideEffects(onSubmit)`
Filters out "Not implemented" side effects.

```typescript
const executable = getExecutableSideEffects(txDef.onSubmit);
console.log(`Will execute ${executable.length} side effects`);
```

### 2. Integration Documentation (`T3-INTEGRATION.md`)

**Complete guide including**:
- Architecture overview
- Quick start examples
- React hook implementation
- Component integration
- Error handling strategies
- UI feedback patterns
- Testing examples
- Best practices

**Example React Hook**:
```typescript
function useTransactionWithSideEffects() {
  const { session } = useAndamioAuth();
  const { wallet } = useCardanoWallet();

  async function executeTransaction(txDef, signedCbor, unsignedCbor, buildInputs) {
    // 1. Submit to blockchain
    const txHash = await wallet.submitTx(signedCbor);

    // 2. Create context
    const context: SubmissionContext = {
      txHash,
      signedCbor,
      unsignedCbor,
      userId: session.userId,
      walletAddress: session.walletAddress,
      buildInputs,
      timestamp: new Date(),
    };

    // 3. Execute onSubmit side effects
    const result = await executeOnSubmit(txDef.onSubmit, context, {
      apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL!,
      authToken: session.token,
    });

    return { txHash, sideEffectResult: result };
  }

  return { executeTransaction };
}
```

### 3. Comprehensive Tests (`src/execution/__tests__/execution.test.ts`)

**15 passing tests** covering:

✅ **Skipping "Not implemented" endpoints**
✅ **Successful side effect execution**
✅ **API error handling (404, 500, etc.)**
✅ **Network error handling**
✅ **Path parameter resolution errors**
✅ **Empty/undefined onSubmit handling**
✅ **Sequential execution of multiple side effects**
✅ **Critical error tracking**
✅ **Throwing on critical failure**
✅ **Continuing after non-critical failures**
✅ **Filtering executable side effects**

**Test Results**:
```
✓ execution.test.ts (15 tests) 4ms
✓ mint-module-tokens.test.ts (19 tests) 3ms

Test Files  2 passed (2)
     Tests  34 passed (34)
```

### 4. Updated Exports (`src/index.ts`)

All execution utilities are now exported from the main package:

```typescript
import {
  // Execution
  executeOnSubmit,
  executeSideEffect,
  shouldExecuteSideEffect,
  getExecutableSideEffects,

  // Types
  type ExecuteOnSubmitResult,
  type SideEffectExecutionResult,
  type ExecuteSideEffectOptions,
} from "@andamio/transactions";
```

## Usage Example

### Complete Flow in T3 App

```typescript
import { executeOnSubmit, getTransactionDefinition } from "@andamio/transactions";

// 1. Get transaction definition
const txDef = getTransactionDefinition("MINT_MODULE_TOKENS");

// 2. Build transaction inputs
const buildInputs = {
  user_access_token: "...",
  policy: courseNftPolicyId,
  module_infos: formatModuleInfosForMintModuleTokens(modules),
};

// 3. Build unsigned transaction
const buildResponse = await fetch(
  `${apiBaseUrl}${txDef.buildTxConfig.builder.endpoint}`,
  { method: "POST", body: JSON.stringify(buildInputs) }
);
const { unsignedCbor } = await buildResponse.json();

// 4. Sign transaction
const signedCbor = await wallet.signTx(unsignedCbor);

// 5. Submit to blockchain
const txHash = await wallet.submitTx(signedCbor);

// 6. Create submission context
const context: SubmissionContext = {
  txHash,
  signedCbor,
  unsignedCbor,
  userId: session.userId,
  walletAddress: session.walletAddress,
  buildInputs,
  timestamp: new Date(),
};

// 7. Execute onSubmit side effects
const result = await executeOnSubmit(txDef.onSubmit, context, {
  apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL!,
  authToken: session.token,
});

// 8. Handle results
if (result.success) {
  toast.success(txDef.ui.successInfo);
} else {
  toast.warning("Transaction submitted, but some updates are pending");
  console.error("Critical errors:", result.criticalErrors);
}
```

## Side Effect Behavior

### Example: MINT_MODULE_TOKENS

**onSubmit** (executed by T3 app):
```typescript
{
  def: "Update Course Module Status",
  method: "PATCH",
  endpoint: "/course-modules/{courseNftPolicyId}/{moduleCode}/status",
  pathParams: {
    courseNftPolicyId: "buildInputs.policy",
    moduleCode: "buildInputs.moduleCode",
  },
  body: {
    status: { source: "literal", value: "PENDING_TX" },
    pendingTxHash: { source: "context", path: "txHash" },
  },
}
```

**Result**:
- Endpoint: `PATCH /course-modules/policy123/MODULE_1/status`
- Body: `{ status: "PENDING_TX", pendingTxHash: "tx_hash_abc" }`
- Timing: Immediately after transaction submission

**onConfirmation** (executed by monitoring service):
```typescript
{
  def: "Update Course Module Status",
  method: "PATCH",
  endpoint: "/course-modules/{courseNftPolicyId}/{moduleCode}/status",
  pathParams: {
    courseNftPolicyId: "buildInputs.policy",
    moduleCode: "buildInputs.moduleCode",
  },
  body: {
    status: { source: "literal", value: "ON_CHAIN" },
    moduleHash: { source: "onChainData", path: "mints[0].assetName" },
  },
}
```

**Result**:
- Endpoint: `PATCH /course-modules/policy123/MODULE_1/status`
- Body: `{ status: "ON_CHAIN", moduleHash: "MODULE_1_hash" }`
- Timing: After transaction confirmation (~1-2 minutes)

## Error Handling

### Non-Critical Failures

```typescript
// Side effect is non-critical (default)
{
  def: "Update Analytics",
  method: "POST",
  endpoint: "/analytics/track",
  critical: false, // Default
}
```

**Behavior**:
- Failure is logged in results
- Other side effects continue
- `result.success` remains `true`
- UI shows success (transaction was submitted)

### Critical Failures

```typescript
// Side effect is critical
{
  def: "Update Course Module Status",
  method: "PATCH",
  endpoint: "/course-modules/{...}/status",
  critical: true, // Must succeed
}
```

**Behavior**:
- Failure is logged in `criticalErrors`
- Other side effects continue
- `result.success` becomes `false`
- UI should warn user

### "Not Implemented" Endpoints

```typescript
{
  def: "Update User Pending Transactions",
  method: "POST",
  endpoint: "Not implemented",
}
```

**Behavior**:
- Automatically skipped
- `result.skipped = true`
- No API call made
- No error logged

## Testing

### Mock Execution

```typescript
import { executeSideEffect, createMockSubmissionContext } from "@andamio/transactions";

const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true }),
});

const result = await executeSideEffect(sideEffect, context, {
  apiBaseUrl: "http://localhost:4000/api/v0",
  authToken: "mock_token",
  fetchImpl: mockFetch, // Custom fetch for testing
});

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

## Benefits

✅ **Clear Separation** - Frontend and backend responsibilities are well-defined
✅ **Type Safety** - Full TypeScript support throughout
✅ **Error Handling** - Graceful handling of failures
✅ **Testability** - Comprehensive test utilities
✅ **Skip Logic** - Automatic handling of "Not implemented" endpoints
✅ **Flexibility** - Critical vs non-critical side effects
✅ **Documentation** - Complete guides and examples
✅ **Production Ready** - Tested and validated

## Files Created

```
packages/andamio-transactions/
├── src/
│   ├── execution/
│   │   ├── index.ts                        # Execution utilities
│   │   └── __tests__/
│   │       └── execution.test.ts           # Tests (15 tests)
│   └── index.ts                             # Updated exports
├── T3-INTEGRATION.md                        # Integration guide
├── EXECUTION-SUMMARY.md                     # This file
└── README.md                                # Updated with execution info
```

## Next Steps for T3 App

1. **Install Package**
   ```bash
   npm install @andamio/transactions
   ```

2. **Create Hook**
   - Implement `useTransactionWithSideEffects` hook
   - See `T3-INTEGRATION.md` for complete example

3. **Update Components**
   - Replace manual API calls with `executeOnSubmit`
   - Add proper error handling
   - Update UI feedback

4. **Test**
   - Test with "Not implemented" endpoints
   - Test critical vs non-critical failures
   - Monitor success rates

## API Reference

### `executeOnSubmit(onSubmit, context, options)`

**Parameters**:
- `onSubmit`: Array of side effects from transaction definition (optional)
- `context`: `SubmissionContext` with transaction details
- `options`: `ExecuteSideEffectOptions` with API URL and auth token

**Returns**: `ExecuteOnSubmitResult`
```typescript
{
  success: boolean,
  results: SideEffectExecutionResult[],
  criticalErrors: string[]
}
```

### `executeSideEffect(sideEffect, context, options)`

**Parameters**:
- `sideEffect`: Single side effect to execute
- `context`: `SubmissionContext`
- `options`: `ExecuteSideEffectOptions`

**Returns**: `SideEffectExecutionResult`
```typescript
{
  sideEffect: SideEffect,
  success: boolean,
  skipped: boolean,
  error?: string,
  response?: any
}
```

### `shouldExecuteSideEffect(sideEffect)`

**Parameters**:
- `sideEffect`: Side effect to check

**Returns**: `boolean` - `false` for "Not implemented", `true` otherwise

### `getExecutableSideEffects(onSubmit)`

**Parameters**:
- `onSubmit`: Array of side effects (optional)

**Returns**: `SideEffect[]` - Filtered array excluding "Not implemented"

## Summary

We now have a complete, type-safe, tested system for executing transaction side effects:

- ✅ **34 tests passing** (19 side effect + 15 execution)
- ✅ **Complete documentation** (README, T3-INTEGRATION, TESTING)
- ✅ **Production-ready utilities** (executeOnSubmit, executeSideEffect, etc.)
- ✅ **Clear architecture** (Frontend onSubmit, Backend onConfirmation)
- ✅ **Error handling** (Critical, non-critical, not implemented)
- ✅ **React integration** (Example hooks and components)

The T3 app template can now properly execute onSubmit side effects immediately after transaction submission, while the backend monitoring service will handle onConfirmation side effects after confirmation! 🎉
