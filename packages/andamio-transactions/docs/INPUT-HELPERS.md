# Input Helper Functions

## Overview

Some Andamio transactions require complex input formatting, particularly when the transaction API expects JSON strings with specific structures. To maintain type safety and developer experience, this package exports **input helper functions** that format data from the Database API (`@andamio-platform/db-api`) into the format required by transaction endpoints.

## The Pattern

### 1. Transaction Definition with `inputHelpers` Metadata

Each transaction definition can include an `inputHelpers` field in its `buildTxConfig` that documents which helper functions should be used for complex input fields:

```typescript
export const MY_TRANSACTION: AndamioTransactionDefinition = {
  // ... other fields
  buildTxConfig: {
    inputSchema: z.object({
      simple_field: z.string(),
      complex_field: z.string(), // Requires special formatting
    }),
    builder: { type: "api-endpoint", endpoint: "/tx/..." },
    inputHelpers: {
      complex_field: {
        helperName: "formatComplexFieldForMyTransaction",
        description: "Converts database data into the required JSON format",
        example: `const data = await fetchData();
const complex_field = formatComplexFieldForMyTransaction(data);`,
      },
    },
  },
};
```

### 2. Helper Function Implementation

Helper functions are exported from the same file as their transaction definition, with:
- **Clear naming**: `format{FieldName}For{TransactionType}`
- **Full JSDoc documentation**
- **TypeScript types** from `@andamio-platform/db-api`
- **Usage examples** in the JSDoc

```typescript
/**
 * Formats X into Y format required for MY_TRANSACTION
 *
 * @param data - Input data from the database API
 * @returns JSON string representation for the transaction
 *
 * @example
 * ```typescript
 * import { formatComplexFieldForMyTransaction } from "@andamio/transactions";
 * import type { SomeOutput } from "@andamio-platform/db-api";
 *
 * const data: SomeOutput = await fetchData();
 * const formatted = formatComplexFieldForMyTransaction(data);
 * ```
 */
export function formatComplexFieldForMyTransaction(
  data: SomeTypeFromDbApi
): string {
  // Format and return JSON string
  return JSON.stringify(/* ... */);
}
```

### 3. Exports

Helper functions are exported at three levels:

1. **Transaction definition file** (e.g., `mint-module-tokens.ts`)
2. **Role index** (e.g., `definitions/course-creator/index.ts`)
3. **Main package index** (`src/index.ts`)

This makes them available via:

```typescript
// Import from main package
import { formatModuleInfosForMintModuleTokens } from "@andamio/transactions";

// Or from specific transaction file
import { formatModuleInfosForMintModuleTokens } from "@andamio/transactions/definitions/course-creator/mint-module-tokens";
```

## Example: COURSE_TEACHER_MODULES_MANAGE (V2)

### The Transaction

```typescript
export const COURSE_TEACHER_MODULES_MANAGE: AndamioTransactionDefinition = {
  txType: "COURSE_TEACHER_MODULES_MANAGE",
  role: "teacher",
  buildTxConfig: {
    inputSchema: z.object({
      alias: z.string().min(1).max(31),
      courseId: z.string().length(56),
      modulesToMint: z.array(z.object({
        slts: z.array(z.string()),
        allowedStudents_V2: z.array(z.string().length(56)),
        prerequisiteAssignments_V2: z.array(z.string().length(64)),
      })),
      modulesToUpdate: z.array(z.object({...})),
      modulesToBurn: z.array(z.string().length(64)),
      walletData: z.object({...}).optional(),
    }),
    inputHelpers: {
      modulesToMint: {
        helperName: "formatModulesToMint",
        description:
          "Formats an array of course modules into the MintModuleV2 format required by the Atlas Tx API. " +
          "Each module includes its SLTs array, allowed students, and prerequisite assignments.",
        example: `const modules = await fetchModules(courseId);
const modulesToMint = formatModulesToMint(modules);`,
      },
    },
  },
};
```

### The Helper Function

```typescript
export function formatModulesToMint(
  modules: ListCourseModulesOutput
): MintModuleV2[] {
  return modules.map((module) => ({
    slts: module.slts.map((slt) => slt.sltText),
    allowedStudents_V2: [], // Policy IDs of allowed student groups
    prerequisiteAssignments_V2: [], // SLT hashes of prerequisites
  }));
}
```

### Usage in Application Code

```typescript
import {
  getTransactionDefinition,
  formatModulesToMint,
  computeSltHash,
} from "@andamio/transactions";
import type { ListCourseModulesOutput } from "@andamio-platform/db-api";

// 1. Fetch data from database API
const modules: ListCourseModulesOutput = await fetch(
  `${API_URL}/courses/${courseId}/course-modules`
).then((r) => r.json());

// 2. Get transaction definition to see what helpers are available
const txDef = getTransactionDefinition("COURSE_TEACHER_MODULES_MANAGE");
console.log(txDef.buildTxConfig.inputHelpers?.modulesToMint);
// Shows: { helperName, description, example }

// 3. Use the helper to format complex input
const input = {
  alias: userAlias,
  courseId: courseNftPolicyId,
  modulesToMint: formatModulesToMint(modules),
  modulesToUpdate: [],
  modulesToBurn: [],
};

// 4. Validate against schema
const validated = txDef.buildTxConfig.inputSchema.parse(input);

// 5. Build transaction
const unsignedTx = await buildTransaction(validated);

// Preview module hashes before minting
modules.forEach(m => {
  const hash = computeSltHash(m.slts.map(s => s.sltText));
  console.log(`${m.moduleCode}: ${hash}`);
});
```

## Creating New Helper Functions

When adding a new transaction that requires complex input formatting:

### Step 1: Define the Helper Function

```typescript
// In your transaction definition file (e.g., my-transaction.ts)
import type { SomeOutput } from "@andamio-platform/db-api";

/**
 * Formats [description of input] for [TRANSACTION_NAME] transaction
 *
 * @param data - [Description of input parameter]
 * @returns JSON string representation for the transaction
 *
 * @example
 * ```typescript
 * import { formatMyFieldForMyTransaction } from "@andamio/transactions";
 *
 * const data = await fetchData();
 * const formatted = formatMyFieldForMyTransaction(data);
 * ```
 */
export function formatMyFieldForMyTransaction(
  data: SomeOutput
): string {
  // Your formatting logic here
  const formatted = {
    // ... structure expected by transaction API
  };

  return JSON.stringify(formatted);
}
```

### Step 2: Add `inputHelpers` to Transaction Definition

```typescript
export const MY_TRANSACTION: AndamioTransactionDefinition = {
  // ... other fields
  buildTxConfig: {
    inputSchema: z.object({
      my_field: z.string().min(1),
      // ... other fields
    }),
    inputHelpers: {
      my_field: {
        helperName: "formatMyFieldForMyTransaction",
        description: "Clear description of what this helper does",
        example: `const data = await fetchData();
const my_field = formatMyFieldForMyTransaction(data);
const input = { my_field, /* ... */ };`,
      },
    },
  },
};
```

### Step 3: Export the Helper

```typescript
// In definitions/[role]/index.ts
export {
  MY_TRANSACTION,
  formatMyFieldForMyTransaction,
} from "./my-transaction";

// In src/index.ts (main exports)
export { formatMyFieldForMyTransaction } from "./definitions/[role]/my-transaction";
```

### Step 4: Build and Test

```bash
# Build the package to generate TypeScript declarations
npm run build

# Test in your application
import { formatMyFieldForMyTransaction } from "@andamio/transactions";
```

## Naming Conventions

### Helper Function Names

**Pattern**: `format{FieldName}For{TransactionType}`

**Examples**:
- `formatModuleInfosForMintModuleTokens` - for `module_infos` field in `MINT_MODULE_TOKENS`
- `formatAssignmentDataForCommitToAssignment` - for `assignment_data` field in `COMMIT_TO_ASSIGNMENT`
- `formatTreasuryConfigForInitProject` - for `treasury_config` field in `INIT_PROJECT`

**Guidelines**:
- Use PascalCase after `format`
- Field name should match the input field (converted to PascalCase)
- Transaction name should match the `TxName` type
- Make it immediately clear what the helper does and which transaction it's for

### `inputHelpers` Keys

**Pattern**: Use the exact field name from `inputSchema`

```typescript
inputSchema: z.object({
  module_infos: z.string().min(1), // Field name
}),
inputHelpers: {
  module_infos: { // ← Same field name
    helperName: "formatModuleInfosForMintModuleTokens",
    // ...
  },
}
```

## Benefits

### Type Safety
- Helpers use types from `@andamio-platform/db-api`
- Full compile-time checking
- Autocomplete in IDEs

### Discoverability
- `inputHelpers` metadata documents which helpers to use
- JSDoc shows up in IDE tooltips
- Examples show exact usage

### Maintainability
- Co-located with transaction definitions
- Single source of truth for formatting logic
- Easy to find and update

### DX (Developer Experience)
- No need to manually construct complex JSON strings
- Clear error messages from TypeScript
- Consistent patterns across all transactions

## TypeScript Types

The pattern uses these types from `@andamio/transactions`:

```typescript
/**
 * Helper function metadata for formatting transaction inputs
 */
export type InputHelper = {
  /** Name of the exported helper function */
  helperName: string;

  /** Description of what the helper does and when to use it */
  description: string;

  /** Optional usage example showing how to call the helper */
  example?: string;
};

/**
 * Configuration for building the transaction
 */
export type BuildTxConfig = {
  inputSchema: z.ZodSchema;
  builder: { /* ... */ };
  estimatedCost?: TransactionCost;

  /**
   * Helper functions for formatting complex input fields
   * Maps input field names to their helper function metadata
   */
  inputHelpers?: Record<string, InputHelper>;
};
```

## Future Enhancements

Potential improvements to this pattern:

### 1. Runtime Helper Access
Allow calling helpers directly from the transaction definition:

```typescript
buildTxConfig: {
  inputHelpers: {
    module_infos: {
      helperName: "formatModuleInfosForMintModuleTokens",
      description: "...",
      format: formatModuleInfosForMintModuleTokens, // ← Callable
    },
  },
}

// Usage:
const txDef = getTransactionDefinition("MINT_MODULE_TOKENS");
const formatted = txDef.buildTxConfig.inputHelpers?.module_infos.format?.(data);
```

### 2. Validation Helpers
Add helpers for validating formatted data against expected structures:

```typescript
inputHelpers: {
  module_infos: {
    helperName: "formatModuleInfosForMintModuleTokens",
    validator: moduleInfosSchema, // ← Zod schema for validation
  },
}
```

### 3. Auto-Generated Helpers
Generate helpers automatically from transaction API specs when they follow standard patterns.

## Related Documentation

- [Transaction Registry](./README.md#transaction-registry)
- [Building Transactions](./README.md#building-transactions)
- [Type Safety](./README.md#type-safety)
- [@andamio-platform/db-api Documentation](../andamio-db-api/README.md)

---

**Last Updated**: 2025-11-20
**Pattern Version**: 1.0
**Maintainer**: Andamio Platform Team
