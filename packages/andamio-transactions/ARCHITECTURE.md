# @andamio/transactions Package Summary

## 🎯 Primary Goal

**This package MUST perfectly match the transaction specifications in Andamio Docs.**

The andamio-docs repository (`/Users/james/projects/01-projects/andamio-docs/public/yaml/`) is the authoritative source for:
- Protocol specifications (transaction structure, inputs, outputs, mints)
- Validator registry (validators, tokens, redeemers)
- Token requirements
- Transaction costs
- Protocol versioning

This package extends those specifications with API lifecycle, side effects, and UI metadata, while maintaining perfect alignment with the protocol layer.

## What Was Created

A new workspace package at `packages/andamio-transactions/` that provides unified transaction definitions for the Andamio platform.

## File Structure

```
packages/andamio-transactions/
├── package.json                    # Package configuration
├── tsconfig.json                   # TypeScript config
├── README.md                       # Comprehensive documentation
└── src/
    ├── index.ts                    # Main exports
    ├── types/
    │   ├── index.ts               # Type exports
    │   ├── schema.ts              # Core transaction schema types
    │   └── context.ts             # Submission/Confirmation context types
    ├── utils/
    │   └── protocol-reference.ts  # Protocol spec helpers and cost data
    ├── definitions/
    │   ├── index.ts               # All definition exports
    │   └── course-creator/
    │       ├── index.ts           # Course creator exports
    │       ├── mint-module-tokens.ts
    │       ├── accept-assignment.ts
    │       ├── deny-assignment.ts
    │       └── add-course-managers.ts
    └── registry.ts                # Transaction registry and lookup functions
```

## What It Does

### 1. Unifies Three Layers

**Protocol Layer (YAML specs)**
- References transaction specifications from `andamio-docs/public/yaml/transactions/`
- Links to validator registry and token requirements
- Provides protocol documentation URLs

**API Layer (This package)**
- Defines build endpoints for each transaction
- Specifies input validation schemas (Zod)
- Declares side effects on submission and confirmation
- Includes retry policies for resilience

**UI Layer (User interface)**
- Provides button text, titles, descriptions
- Links to documentation
- Success messages

### 2. Provides Type-Safe Transaction Definitions

Each transaction includes:
```typescript
{
  txType: "MINT_MODULE_TOKENS",
  role: "course-creator",

  protocolSpec: {
    version: "v1",
    id: "course-creator.mint-module-tokens",
    yamlPath: "/yaml/transactions/v1/course-creator/mint-module-tokens.yaml",
    requiredTokens: ["global-state.access-token-user", "course.course-nft"]
  },

  buildConfig: {
    inputSchema: z.object({ /* validation */ }),
    builder: { endpoint: "/v0/transactions/build/mint-module-tokens" },
    estimatedCost: { txFee: 200000, minDeposit: 2000000 }
  },

  onSubmission: {
    sideEffects: [/* Update DB on submission */]
  },

  onConfirmation: {
    sideEffects: [/* Update DB on confirmation */]
  },

  ui: {
    buttonText: "Create New Credential",
    title: "Create New Credential",
    description: [/* ... */],
    // ...
  }
}
```

### 3. Enables Declarative Side Effects

Instead of writing handler classes, you declare what should happen:

```typescript
onConfirmation: {
  sideEffects: [
    {
      endpoint: "/v0/courses/modules/mark-published",
      payloadBuilder: (ctx) => ({
        courseId: ctx.buildInputs.courseId,
        moduleCode: ctx.buildInputs.moduleCode,
        modulePolicyId: ctx.onChainData.mints?.[0]?.policyId,
        publishedOnChain: true,
        publishTxHash: ctx.txHash,
      }),
      critical: true,
      retry: { maxAttempts: 5, backoffMs: 2000 }
    }
  ]
}
```

## Implemented Transactions

### Course Creator (4 transactions)

1. **MINT_MODULE_TOKENS** - Publish a new course module/credential
   - Creates module tokens on-chain
   - Updates `Course.publishedModules` in database
   - Stores module policy ID and content hash

2. **ACCEPT_ASSIGNMENT** - Accept student submission and issue credential
   - Issues module credential to student
   - Updates assignment status to ACCEPTED
   - Updates student progress
   - Sends notification to student

3. **DENY_ASSIGNMENT** - Deny student submission with feedback
   - Updates assignment status to DENIED
   - Stores feedback for student
   - Sends notification with feedback

4. **ADD_COURSE_MANAGERS** - Add managers to a published course
   - Updates course governance on-chain
   - Adds managers to `Course.managers` in database
   - Grants manager permissions
   - Sends notifications to new managers
   - Cost: 10 ADA per manager

## Usage Examples

### In Transaction Builder (T3 App Template)

```typescript
import { getTransactionDefinition } from "@andamio/transactions";

const definition = getTransactionDefinition("MINT_MODULE_TOKENS");

// Validate inputs
const inputs = definition.buildConfig.inputSchema.parse({
  courseId: "123",
  courseCode: "CS101",
  moduleCode: "MODULE_1",
  moduleTitle: "Introduction to Programming",
  walletAddress: "addr1...",
  userAlias: "alice",
});

// Build transaction
const response = await fetch(
  `${API_BASE_URL}${definition.buildConfig.builder.endpoint}`,
  { method: "POST", body: JSON.stringify(inputs) }
);

const { unsignedCbor } = await response.json();

// Display UI
<TransactionDialog
  buttonText={definition.ui.buttonText}
  title={definition.ui.title}
  description={definition.ui.description}
  cost={definition.buildConfig.estimatedCost}
/>
```

### In Transaction Monitoring Service (andamio-db-api)

```typescript
import { getTransactionDefinition } from "@andamio/transactions";

async function onTransactionConfirmed(txHash: string, tx: PendingTransaction) {
  const definition = getTransactionDefinition(tx.txType);

  // Build confirmation context
  const context: ConfirmationContext = {
    txHash,
    signedCbor: tx.signedCbor,
    buildInputs: tx.buildInputs,
    userId: tx.userId,
    walletAddress: tx.walletAddress,
    blockHeight: 12345678,
    timestamp: new Date(),
    onChainData: await extractOnChainData(txHash),
  };

  // Execute side effects in order
  for (const sideEffect of definition.onConfirmation.sideEffects) {
    const payload = sideEffect.payloadBuilder(context);

    await executeSideEffect(sideEffect.endpoint, payload, {
      critical: sideEffect.critical,
      retry: sideEffect.retry,
    });
  }
}
```

## Integration with Existing Systems

### Perfect Alignment with andamio-docs Protocol Specs

**Critical Requirement**: Every transaction definition MUST match its corresponding YAML specification.

```typescript
protocolSpec: {
  version: "v1",  // Must match YAML location (v1/ or v2/)
  id: "course-creator.mint-module-tokens",  // Must match YAML filename
  yamlPath: "/yaml/transactions/v1/course-creator/mint-module-tokens.yaml",
  requiredTokens: ["global-state.access-token-user", "course.course-nft"]  // From YAML metadata.requires_tokens
}
```

This links to: `/Users/james/projects/01-projects/andamio-docs/public/yaml/transactions/v1/course-creator/mint-module-tokens.yaml`

**Validation Checklist**:
- ✅ Transaction ID matches YAML `id` field
- ✅ Role matches YAML `metadata.role`
- ✅ Required tokens match YAML `metadata.requires_tokens`
- ✅ Costs match YAML `metadata.estimated_cost`
- ✅ Protocol version matches YAML directory (v1/ or v2/)
- ✅ Side effects extract data that matches YAML outputs/mints

### Uses Cost Data from YAML Metadata

Extracted from `metadata.estimated_cost` in YAML files and converted to lovelace:
- `MINT_MODULE_TOKENS`: 0.2 ADA tx fee + 2 ADA min deposit
- `ACCEPT_ASSIGNMENT`: 0.2 ADA tx fee
- `ADD_COURSE_MANAGERS`: 0.2 ADA tx fee + 10 ADA per manager

### Matches Existing UI Metadata

Based on `/Users/james/projects/01-projects/andamio-platform/andamio-platform/src/components/cardano/tx/andamio-transaction-list.ts`

## Next Steps

### 1. Add More Transactions

Create definitions for:
- General: `MINT_ACCESS_TOKEN`, `PUBLISH_TX`
- Student: `MINT_LOCAL_STATE`, `COMMIT_TO_ASSIGNMENT`, etc.
- Contributor: `MINT_PROJECT_STATE`, `COMMIT_PROJECT`, etc.
- Project Creator: `MINT_TREASURY_TOKEN`, `ACCEPT_PROJECT`, etc.
- Admin: `INIT_COURSE`, `ADD_COURSE_CREATORS`, etc.

### 2. Implement Transaction Monitoring Service

Build the service that:
1. Polls blockchain for transaction confirmations
2. Loads transaction definition from registry
3. Executes side effects with retry logic
4. Handles critical vs non-critical failures

### 3. Integrate with andamio-db-api

Add this package as a dependency:
```json
{
  "dependencies": {
    "@andamio/transactions": "workspace:*"
  }
}
```

### 4. Integrate with andamio-t3-app-template

Use for:
- Transaction building
- Input validation
- UI rendering
- Cost estimation

### 5. Generate YAML from TypeScript

Create a script to export transaction definitions to YAML format for consistency with protocol specs.

### 6. Migrate to andamio-docs

When ready:
1. Move package to `andamio-docs/packages/andamio-transactions/`
2. Publish to npm as `@andamio/transactions`
3. Update consumers to use published package

## Development Commands

```bash
# Install dependencies
npm install

# Build the package
npm run build:tx

# Watch mode (auto-rebuild on changes)
npm run dev:tx

# Type check
npm run type-check --workspace=@andamio/transactions
```

## Benefits

1. **Single Source of Truth** - All transaction info in one place
2. **Type Safety** - Full TypeScript support end-to-end
3. **Declarative Side Effects** - No imperative handler code
4. **Protocol Alignment** - References official YAML specs
5. **Extensible** - Easy to add new transactions
6. **Maintainable** - Changes propagate automatically
7. **Testable** - Can validate definitions and side effects

## Summary

This package provides the foundation for a robust, type-safe transaction system that unifies protocol specifications, API integration, and user interface metadata. It will enable the transaction monitoring service and provide a consistent developer experience across the platform.
