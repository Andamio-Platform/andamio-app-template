# Testing Side Effects

This guide explains how to test transaction side effects (onSubmit and onConfirmation) using the provided testing utilities.

## Quick Start

```bash
# Install test dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode (recommended during development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Testing Utilities

The `@andamio/transactions` package exports testing utilities for validating side effects:

```typescript
import {
  createMockSubmissionContext,
  createMockConfirmationContext,
  testSideEffect,
  resolvePathParams,
  constructRequestBody,
  getValueFromPath,
  validateSideEffect,
} from "@andamio/transactions";
```

### Core Functions

#### `createMockSubmissionContext(overrides?)`

Creates a mock `SubmissionContext` for testing onSubmit side effects.

```typescript
const context = createMockSubmissionContext({
  txHash: "custom_tx_hash",
  buildInputs: {
    policy: "policy123",
    moduleCode: "MODULE_1",
  },
});
```

**Default values:**
- `txHash`: "abc123def456"
- `signedCbor`: "84a30081825820..."
- `unsignedCbor`: "84a30081825820..."
- `userId`: "user_123"
- `walletAddress`: "addr1qy..."
- `buildInputs`: Sample inputs for MINT_MODULE_TOKENS
- `timestamp`: Current date

#### `createMockConfirmationContext(overrides?)`

Creates a mock `ConfirmationContext` for testing onConfirmation side effects.

```typescript
const context = createMockConfirmationContext({
  onChainData: {
    mints: [
      {
        policyId: "policy123",
        assetName: "MODULE_1_hash",
        quantity: 1,
      },
    ],
  },
});
```

**Default values:**
- All SubmissionContext fields
- `blockHeight`: 1000000
- `onChainData`: Sample on-chain data with mints, metadata, outputs

#### `testSideEffect(sideEffect, context)`

Tests a complete side effect against a context. Returns validation results.

```typescript
const result = testSideEffect(sideEffect, context);

if (result.valid) {
  console.log("Endpoint:", result.resolvedEndpoint);
  console.log("Body:", result.requestBody);
} else {
  console.error("Errors:", result.errors);
}
```

**Returns:**
```typescript
{
  valid: boolean;
  errors: string[];
  resolvedEndpoint?: string;
  requestBody?: Record<string, unknown>;
}
```

#### `resolvePathParams(endpoint, pathParams, context)`

Resolves path parameters in an endpoint URL.

```typescript
const endpoint = "/course-modules/{courseNftPolicyId}/{moduleCode}/status";
const pathParams = {
  courseNftPolicyId: "buildInputs.policy",
  moduleCode: "buildInputs.moduleCode",
};

const resolved = resolvePathParams(endpoint, pathParams, context);
// => "/course-modules/policy123/MODULE_1/status"
```

#### `constructRequestBody(bodyDef, context)`

Constructs a request body from body field mappings.

```typescript
const bodyDef = {
  status: { source: "literal", value: "PENDING_TX" },
  pendingTxHash: { source: "context", path: "txHash" },
};

const body = constructRequestBody(bodyDef, context);
// => { status: "PENDING_TX", pendingTxHash: "abc123def456" }
```

#### `getValueFromPath(obj, path)`

Extracts a value from an object using dot notation. Supports array indexing.

```typescript
const obj = {
  buildInputs: { policy: "policy123" },
  mints: [{ assetName: "token1" }],
};

getValueFromPath(obj, "buildInputs.policy"); // => "policy123"
getValueFromPath(obj, "mints[0].assetName"); // => "token1"
```

#### `validateSideEffect(sideEffect, context)`

Validates a side effect definition. Returns array of error messages.

```typescript
const errors = validateSideEffect(sideEffect, context);

if (errors.length > 0) {
  console.error("Validation failed:", errors);
}
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from "vitest";
import { MINT_MODULE_TOKENS } from "../mint-module-tokens";
import {
  createMockSubmissionContext,
  testSideEffect,
} from "../../../testing";

describe("MINT_MODULE_TOKENS Side Effects", () => {
  describe("onSubmit", () => {
    const context = createMockSubmissionContext({
      buildInputs: {
        policy: "policy123",
        moduleCode: "MODULE_1",
      },
    });

    it("should resolve path parameters", () => {
      const sideEffect = MINT_MODULE_TOKENS.onSubmit![0];
      const result = testSideEffect(sideEffect, context);

      expect(result.valid).toBe(true);
      expect(result.resolvedEndpoint).toBe(
        "/course-modules/policy123/MODULE_1/status"
      );
    });

    it("should construct request body", () => {
      const sideEffect = MINT_MODULE_TOKENS.onSubmit![0];
      const result = testSideEffect(sideEffect, context);

      expect(result.requestBody).toEqual({
        status: "PENDING_TX",
        pendingTxHash: context.txHash,
      });
    });
  });
});
```

### Testing Path Parameter Resolution

```typescript
it("should resolve path parameters from buildInputs", () => {
  const sideEffect = {
    def: "Test",
    method: "PATCH" as const,
    endpoint: "/courses/{policyId}/modules/{moduleCode}",
    pathParams: {
      policyId: "buildInputs.policy",
      moduleCode: "buildInputs.moduleCode",
    },
  };

  const context = createMockSubmissionContext({
    buildInputs: {
      policy: "policy_abc",
      moduleCode: "MOD_001",
    },
  });

  const resolved = resolvePathParams(
    sideEffect.endpoint,
    sideEffect.pathParams,
    context
  );

  expect(resolved).toBe("/courses/policy_abc/modules/MOD_001");
});
```

### Testing Body Construction

```typescript
describe("Request Body Construction", () => {
  it("should extract from literal values", () => {
    const body = constructRequestBody(
      {
        status: { source: "literal", value: "PENDING_TX" },
      },
      context
    );

    expect(body).toEqual({ status: "PENDING_TX" });
  });

  it("should extract from context", () => {
    const context = createMockSubmissionContext({
      txHash: "my_tx_hash",
    });

    const body = constructRequestBody(
      {
        txHash: { source: "context", path: "txHash" },
      },
      context
    );

    expect(body).toEqual({ txHash: "my_tx_hash" });
  });

  it("should extract from onChainData", () => {
    const context = createMockConfirmationContext({
      onChainData: {
        mints: [
          {
            policyId: "policy123",
            assetName: "my_asset",
            quantity: 1,
          },
        ],
      },
    });

    const body = constructRequestBody(
      {
        assetName: { source: "onChainData", path: "mints[0].assetName" },
      },
      context
    );

    expect(body).toEqual({ assetName: "my_asset" });
  });
});
```

### Testing onSubmit vs onConfirmation

```typescript
describe("Side Effect Lifecycle", () => {
  it("should use PENDING_TX status on submit", () => {
    const sideEffect = MINT_MODULE_TOKENS.onSubmit![0];
    const context = createMockSubmissionContext();

    const result = testSideEffect(sideEffect, context);

    expect(result.requestBody?.status).toBe("PENDING_TX");
  });

  it("should use ON_CHAIN status on confirmation", () => {
    const sideEffect = MINT_MODULE_TOKENS.onConfirmation[0];
    const context = createMockConfirmationContext();

    const result = testSideEffect(sideEffect, context);

    expect(result.requestBody?.status).toBe("ON_CHAIN");
  });

  it("should include pendingTxHash on submit", () => {
    const sideEffect = MINT_MODULE_TOKENS.onSubmit![0];
    const context = createMockSubmissionContext({
      txHash: "pending_tx_123",
    });

    const result = testSideEffect(sideEffect, context);

    expect(result.requestBody?.pendingTxHash).toBe("pending_tx_123");
  });

  it("should include moduleHash on confirmation", () => {
    const sideEffect = MINT_MODULE_TOKENS.onConfirmation[0];
    const context = createMockConfirmationContext({
      onChainData: {
        mints: [
          {
            policyId: "policy123",
            assetName: "confirmed_hash",
            quantity: 1,
          },
        ],
      },
    });

    const result = testSideEffect(sideEffect, context);

    expect(result.requestBody?.moduleHash).toBe("confirmed_hash");
  });
});
```

### Testing Error Cases

```typescript
describe("Error Handling", () => {
  it("should fail when required buildInputs are missing", () => {
    const sideEffect = MINT_MODULE_TOKENS.onSubmit![0];
    const context = createMockSubmissionContext({
      buildInputs: {}, // Empty - missing required fields
    });

    const result = testSideEffect(sideEffect, context);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should handle missing onChainData", () => {
    const sideEffect = MINT_MODULE_TOKENS.onConfirmation[0];
    const context = createMockConfirmationContext({
      onChainData: {
        mints: [], // Empty array
      },
    });

    const body = constructRequestBody(sideEffect.body, context);

    expect(body?.moduleHash).toBeUndefined();
  });

  it("should skip validation for not implemented endpoints", () => {
    const sideEffect = {
      def: "Not Yet Implemented",
      method: "POST" as const,
      endpoint: "Not implemented",
    };

    const context = createMockSubmissionContext();
    const result = testSideEffect(sideEffect, context);

    expect(result.valid).toBe(true);
  });
});
```

## Best Practices

### 1. Test Each Side Effect Separately

Create separate test suites for onSubmit and onConfirmation side effects:

```typescript
describe("onSubmit Side Effects", () => {
  // Test each onSubmit side effect
});

describe("onConfirmation Side Effects", () => {
  // Test each onConfirmation side effect
});
```

### 2. Use Realistic Test Data

Create contexts that match real transaction data:

```typescript
const context = createMockSubmissionContext({
  buildInputs: {
    policy: "actual_policy_format_56_chars",
    moduleCode: "ACTUAL_MODULE_CODE_FORMAT",
  },
  txHash: "actual_cardano_tx_hash_format",
});
```

### 3. Test Boundary Cases

- Empty arrays in onChainData
- Missing optional fields
- Multiple mints/outputs
- Invalid context paths

### 4. Compare onSubmit vs onConfirmation

Test that side effects behave differently at different lifecycle stages:

```typescript
it("should use different status values", () => {
  const onSubmit = MINT_MODULE_TOKENS.onSubmit![0];
  const onConfirmation = MINT_MODULE_TOKENS.onConfirmation[0];

  expect(onSubmit.body?.status.value).toBe("PENDING_TX");
  expect(onConfirmation.body?.status.value).toBe("ON_CHAIN");
});
```

### 5. Validate Against OpenAPI Spec

For complete validation, check that:
- Endpoints exist in the db-api OpenAPI spec
- HTTP methods match
- Request body fields match the schema
- Path parameters are correct

## Example: Complete Test Suite

See `src/definitions/course-creator/__tests__/mint-module-tokens.test.ts` for a complete example that tests:

- ✅ Path parameter resolution
- ✅ Request body construction
- ✅ Literal value handling
- ✅ Context data extraction
- ✅ onChainData extraction
- ✅ Error handling
- ✅ "Not implemented" endpoints
- ✅ Comparison between onSubmit and onConfirmation

## Running the Tests

```bash
# Run all tests
npm test

# Run tests for a specific file
npm test mint-module-tokens

# Run tests in watch mode
npm run test:watch

# Run tests with UI (great for debugging)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Continuous Integration

Add to your CI pipeline:

```yaml
- name: Run Tests
  run: |
    cd packages/andamio-transactions
    npm install
    npm test
```

## Next Steps

1. Write tests for each new transaction definition
2. Test all side effects (onSubmit and onConfirmation)
3. Add tests for edge cases and error scenarios
4. Maintain test coverage above 80%
5. Update tests when transaction definitions change
