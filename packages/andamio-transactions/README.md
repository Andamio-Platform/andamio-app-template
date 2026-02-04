# @andamio/transactions

> Unified transaction definition system for the Andamio platform

This package provides comprehensive specifications for all Andamio transactions, unifying protocol specs, API lifecycle, side effects, and UI metadata into a single authoritative source.

## 🎯 Primary Goal

**This package must perfectly match the transaction specifications in Andamio Docs.**

The source of truth for Andamio transactions is:
- **Protocol Specifications**: `andamio-docs/public/yaml/transactions/`
- **Validator Registry**: `andamio-docs/public/yaml/validator-registry-v*.yaml`

This package extends those specifications with API lifecycle, side effects, and UI metadata, but the protocol layer must remain perfectly aligned with the YAML files in andamio-docs.

## Overview

Andamio transactions operate across three layers:

1. **Protocol Layer** - On-chain transaction structure defined in YAML specs
2. **API Layer** - Off-chain integration with build endpoints and side effects
3. **UI Layer** - User-facing metadata and interface strings

This package brings all three layers together in strongly-typed TypeScript definitions.

## Features

- ✅ **Complete Transaction Definitions** - Protocol specs, API config, side effects, UI metadata
- ✅ **Type-Safe** - Full TypeScript support with Zod validation
- ✅ **Input Helper Functions** - Format complex inputs with type-safe helpers
- ✅ **Protocol YAML References** - Links to official protocol documentation
- ✅ **Cost Estimation** - Transaction fees and deposits from protocol specs
- ✅ **Side Effect Management** - Declarative database updates and notifications
- ✅ **Versioned Organization** - Transactions organized by protocol version (v1, v2, future v3+)
- ✅ **System/Role Organization** - V2 transactions organized by system and role
- ✅ **Extensible** - Easy to add new transactions and protocol versions

## Installation

```bash
npm install @andamio/transactions
```

## Usage

### Get a Transaction Definition

```typescript
import { getTransactionDefinition } from "@andamio/transactions";

const definition = getTransactionDefinition("MINT_MODULE_TOKENS");

// Access protocol specification
console.log(definition.protocolSpec.yamlPath);
// "/yaml/transactions/v1/course-creator/mint-module-tokens.yaml"

// Get build configuration
console.log(definition.buildTxConfig.builder.endpoint);
// "/tx/course-creator/mint-module-tokens"

// Get estimated costs
console.log(definition.buildTxConfig.estimatedCost);
// { txFee: 200000, minDeposit: 2000000 }
```

### Build a Transaction

```typescript
import { getTransactionDefinition } from "@andamio/transactions";
import { z } from "zod";

const definition = getTransactionDefinition("MINT_MODULE_TOKENS");

// Validate inputs
const inputs = {
  userAccessTokenUnit: "abc123...",
  courseNftPolicyId: "policy123...",
  moduleInfos: JSON.stringify([{ moduleCode: "MODULE_1", moduleTitle: "Introduction" }]),
};

const validInputs = definition.buildTxConfig.inputSchema.parse(inputs);

// Call the build endpoint
const response = await fetch(
  `${API_BASE_URL}${definition.buildTxConfig.builder.endpoint}`,
  {
    method: "POST",
    body: JSON.stringify(validInputs),
  }
);

const { unsignedCbor } = await response.json();
```

### Format Complex Inputs with Helper Functions

Some transactions require complex input formatting (e.g., JSON strings with specific structures). This package provides **input helper functions** to format data from the Database API into the required format:

```typescript
import {
  getTransactionDefinition,
  formatModuleInfosForMintModuleTokens,
} from "@andamio/transactions";
import type { ListCourseModulesOutput } from "@andamio-platform/db-api";

// 1. Get transaction definition
const txDef = getTransactionDefinition("MINT_MODULE_TOKENS");

// 2. Check which helpers are available
console.log(txDef.buildTxConfig.inputHelpers?.module_infos);
// {
//   helperName: "formatModuleInfosForMintModuleTokens",
//   description: "Formats an array of course modules...",
//   example: "const modules = await fetchModules(courseId)..."
// }

// 3. Fetch data from database API
const modules: ListCourseModulesOutput = await fetch(
  `${API_URL}/courses/${courseId}/course-modules`
).then((r) => r.json());

// 4. Use helper to format complex field
const inputs = {
  user_access_token: userAccessToken,
  policy: courseNftPolicyId,
  module_infos: formatModuleInfosForMintModuleTokens(modules), // ← Helper formats data
};

// 5. Validate and build
const validated = txDef.buildTxConfig.inputSchema.parse(inputs);
```

**Benefits:**
- ✅ **Type-safe** - Uses types from `@andamio-platform/db-api`
- ✅ **Discoverable** - Helper metadata in transaction definition
- ✅ **Documented** - JSDoc with examples
- ✅ **Consistent** - Standard patterns across all transactions

**See [INPUT-HELPERS.md](./INPUT-HELPERS.md) for complete documentation on creating and using input helpers.**

### Schema Structure: Transaction API vs Side Effect Parameters

Transaction definitions now support **programmatic separation** of transaction API parameters from side effect parameters using the `createSchemas()` helper:

```typescript
import { createSchemas } from "@andamio/transactions";

buildTxConfig: {
  ...createSchemas({
    // Transaction API inputs only (what the Atlas Tx API needs)
    txParams: z.object({
      alias: z.string().min(1).max(31),
      courseId: z.string().length(56),
      assignmentDecisions: z.array(z.object({
        alias: z.string(),
        outcome: z.enum(["accept", "refuse"]),
      })),
    }),
    // Side effect parameters (what onSubmit/onConfirmation need but API doesn't)
    sideEffectParams: z.object({
      moduleCode: z.string().min(1),
      assessmentResult: z.enum(["accept", "refuse"]),
    }),
  }),
  // Results in three schemas:
  // - txApiSchema: Only transaction API params
  // - sideEffectSchema: Only side effect params
  // - inputSchema: Merged validation schema
}
```

**Benefits:**
- ✅ **Self-Documenting** - Clear separation of concerns with labeled parameters
- ✅ **Programmatic Discovery** - Third-party developers can access `txApiSchema` and `sideEffectSchema` separately
- ✅ **Type-Safe** - Full TypeScript support for all three schema variants
- ✅ **Runtime Access** - All parameters available in `buildInputs` during side effect execution
- ✅ **Backward Compatible** - Old definitions with just `inputSchema` still work

**Example: Accessing Schemas Programmatically**
```typescript
import { COURSE_TEACHER_ASSIGNMENTS_ASSESS } from "@andamio/transactions";

// What the transaction API endpoint needs
const apiParams = COURSE_TEACHER_ASSIGNMENTS_ASSESS.buildTxConfig.txApiSchema;
// { alias, courseId, assignmentDecisions, walletData? }

// What side effects need
const sideEffectParams = COURSE_TEACHER_ASSIGNMENTS_ASSESS.buildTxConfig.sideEffectSchema;
// { moduleCode, studentAccessTokenAlias, assessmentResult }

// Combined validation
const allParams = COURSE_TEACHER_ASSIGNMENTS_ASSESS.buildTxConfig.inputSchema;
// { alias, courseId, assignmentDecisions, walletData?, moduleCode, studentAccessTokenAlias, assessmentResult }
```

**Example: Referencing in Side Effects**
```typescript
onSubmit: [{
  endpoint: "/assignment-commitments/update-status",
  body: {
    course_nft_policy_id: { source: "context", path: "buildInputs.courseId" },
    module_code: { source: "context", path: "buildInputs.moduleCode" },
    access_token_alias: { source: "context", path: "buildInputs.studentAccessTokenAlias" },
  },
}]
// At runtime, ALL params are merged into buildInputs regardless of source
```

### Execute Side Effects on Submission and Confirmation

## Architecture

**T3 App Template (Frontend)** - Executes `onSubmit` side effects:
- Immediately after user submits transaction
- Skips "Not implemented" endpoints
- Handles non-critical failures gracefully

**Transaction Monitoring Service (Backend)** - Executes `onConfirmation` side effects:
- When transaction is confirmed on-chain
- Implements retry logic
- Handles critical failures

See [T3-INTEGRATION.md](./T3-INTEGRATION.md) for complete integration guide.

## onSubmit Execution (T3 App)

```typescript
import { executeOnSubmit, getTransactionDefinition } from "@andamio/transactions";

const txDef = getTransactionDefinition("MINT_MODULE_TOKENS");

// After submitting transaction
const txHash = await wallet.submitTx(signedCbor);

// Execute onSubmit side effects
const result = await executeOnSubmit(txDef.onSubmit, context, {
  apiBaseUrl: process.env.NEXT_PUBLIC_ANDAMIO_API_URL!,
  authToken: session.token,
});

if (!result.success) {
  console.warn("Some side effects failed:", result.criticalErrors);
}
```

## Side Effect Structure

Side effects define API calls to execute when a transaction is submitted or confirmed. Each side effect includes:

- **Path parameter mapping** - Extract URL path parameters from context
- **Request body mapping** - Construct request body from context or literal values
- **Retry policy** - Configure retry behavior for failed requests

```typescript
import { getTransactionDefinition } from "@andamio/transactions";
import type { SubmissionContext, ConfirmationContext } from "@andamio/transactions";

const definition = getTransactionDefinition("MINT_MODULE_TOKENS");

// Example side effect definition:
// {
//   def: "Update Course Module Status",
//   method: "POST",
//   endpoint: "/course-modules/batch-update-status",
//   body: {
//     course_nft_policy_id: { source: "context", path: "buildInputs.courseId" },
//     status: { source: "literal", value: "PENDING_TX" },
//     pending_tx_hash: { source: "context", path: "txHash" },
//   }
// }

// When transaction is submitted, execute onSubmit side effects
if (definition.onSubmit) {
  for (const sideEffect of definition.onSubmit) {
    if (sideEffect.endpoint !== "Not implemented") {
      // Monitoring service resolves path parameters
      const resolvedEndpoint = resolvePathParams(sideEffect.endpoint, sideEffect.pathParams, submissionContext);

      // Monitoring service constructs request body
      const requestBody = constructBody(sideEffect.body, submissionContext);

      await executeApiCall({
        method: sideEffect.method,
        endpoint: resolvedEndpoint,
        body: requestBody,
        critical: sideEffect.critical,
        retry: sideEffect.retry,
      });
    }
  }
}

// When transaction is confirmed, execute onConfirmation side effects
for (const sideEffect of definition.onConfirmation) {
  const resolvedEndpoint = resolvePathParams(sideEffect.endpoint, sideEffect.pathParams, confirmationContext);
  const requestBody = constructBody(sideEffect.body, confirmationContext);

  await executeApiCall({
    method: sideEffect.method,
    endpoint: resolvedEndpoint,
    body: requestBody,
    critical: sideEffect.critical,
    retry: sideEffect.retry,
  });
}
```

#### Body Field Mapping

Three types of body field sources:

```typescript
// 1. Literal value - hardcoded value
{ source: "literal", value: "PENDING_TX" }

// 2. Context path - extract from SubmissionContext or ConfirmationContext
{ source: "context", path: "txHash" }                // context.txHash
{ source: "context", path: "buildInputs.courseId" }  // context.buildInputs.courseId

// 3. On-chain data path - extract from ConfirmationContext.onChainData
{ source: "onChainData", path: "mints[0].assetName" }     // First minted asset name
{ source: "onChainData", path: "metadata.721" }           // NFT metadata
{ source: "onChainData", path: "outputs[0].address" }     // First output address
```

### Display Transaction UI

```typescript
import { getTransactionDefinition } from "@andamio/transactions";

const definition = getTransactionDefinition("MINT_MODULE_TOKENS");

// Render transaction dialog
<Dialog>
  <Button>{definition.ui.buttonText}</Button>
  <DialogContent>
    <DialogTitle>{definition.ui.title}</DialogTitle>
    {definition.ui.description.map((p) => <p>{p}</p>)}
    <a href={definition.ui.footerLink}>
      {definition.ui.footerLinkText}
    </a>
  </DialogContent>
</Dialog>
```

### Get Transactions by Role

```typescript
import { getTransactionsByRole } from "@andamio/transactions";

const courseCreatorTxs = getTransactionsByRole("course-creator");
// [MINT_MODULE_TOKENS, ACCEPT_ASSIGNMENT, DENY_ASSIGNMENT, ADD_COURSE_MANAGERS]
```

## Transaction Structure

Each transaction definition includes:

```typescript
type AndamioTransactionDefinition = {
  // Transaction identifier
  txType: TxName;
  role: TransactionRole;

  // Protocol specification reference
  protocolSpec: {
    version: "v1" | "v2";
    id: string; // e.g., "course-creator.mint-module-tokens"
    yamlPath: string; // Path to YAML spec
    requiredTokens?: string[]; // Tokens needed to execute
  };

  // How to build the transaction
  buildTxConfig: {
    // Schema separation (new in v0.2+)
    txApiSchema?: z.ZodSchema; // Transaction API inputs only
    sideEffectSchema?: z.ZodSchema; // Side effect parameters only
    inputSchema: z.ZodSchema; // Combined schema (validates all inputs)

    builder: {
      type: "api-endpoint";
      endpoint: string; // Build endpoint
    };
    estimatedCost?: {
      txFee: number; // in lovelace
      minDeposit?: number;
      additionalCosts?: Array<{ label: string; amount: number }>;
    };
    inputHelpers?: Record<string, {
      helperName: string; // Name of exported helper function
      description: string; // What the helper does
      example?: string; // Usage example
    }>;
  };

  // Side effects on submission (optional)
  onSubmit?: Array<{
    def: string; // Human-readable description (e.g., "Update Course Module Status")
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; // HTTP method
    endpoint: string; // API endpoint with path params: "/course-modules/{courseNftPolicyId}/{moduleCode}/status"
    pathParams?: Record<string, string>; // Map path params to context: { courseNftPolicyId: "buildInputs.policy" }
    body?: Record<string, BodyField>; // Map body fields to context or literals
    critical?: boolean; // Must succeed (default: false)
    retry?: { maxAttempts: number; backoffMs: number };
  }>;

  // Side effects on confirmation
  onConfirmation: Array<{
    def: string; // Human-readable description
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; // HTTP method
    endpoint: string; // API endpoint with path params
    pathParams?: Record<string, string>; // Map path params to context
    body?: Record<string, BodyField>; // Map body fields to context or literals
    critical?: boolean; // Must succeed
    retry?: { maxAttempts: number; backoffMs: number };
  }>;

  // User interface metadata
  ui: {
    buttonText: string;
    title: string;
    description: string[];
    footerLink: string;
    footerLinkText: string;
    successInfo: string;
  };

  // Documentation links
  docs: {
    protocolDocs: string;
    apiDocs?: string;
    examples?: string[];
  };
};

// Note: Payload construction is handled by the transaction monitoring service
// based on endpoint type definitions from db-api and transaction context.
```

## Available Transactions

This package organizes transactions by protocol version. **V2 is the current production version** (recommended for new implementations). V1 is maintained for backward compatibility.

### V2 Transactions (Current - 8 implemented)

V2 consolidates the role structure and dramatically reduces transaction count compared to V1 (29 → 8 transactions).

**Structure:** `v2/{system}/{role}/`

**Naming Convention:** `{SYSTEM}_{ROLE}_{TX}` (e.g., `COURSE_STUDENT_ASSIGNMENT_COMMIT`)

#### General System (1 transaction)
- `GENERAL_ACCESS_TOKEN_MINT` - Mint access token for protocol participation (~7.9 ADA)
  - No side effects (purely on-chain action)
  - Database user records created separately when connecting to application

#### Course System (7 transactions)

**Admin** (2)
- `COURSE_ADMIN_CREATE` - Create a new course on-chain (~45.3 ADA)
  - onSubmit: `POST /courses/create-on-submit` - Create course with `title` and `course_nft_policy_id`
  - onConfirmation: `POST /courses/confirm-creation` - Set course `live` to true
  - Note: `courseNftPolicyId` comes from tx API response, frontend must extract and include in buildInputs
- `COURSE_ADMIN_TEACHERS_UPDATE` - Add/remove teachers from a course (~5.3 ADA)
  - No side effects (purely on-chain action)
  - Updates Course Governance UTxO with teacher aliases
  - Teacher access verified via Andamioscan API `/v2/courses/{course_id}`

**Teacher** (2)
- `COURSE_TEACHER_MODULES_MANAGE` - Batch manage modules (mint/update/burn) (~1.86 ADA)
  - txParams: `alias`, `courseId`, `modulesToMint[]`, `modulesToUpdate[]`, `modulesToBurn[]`, `walletData?`
  - onSubmit: `POST /course-modules/batch-update-status` - Set all modules to `PENDING_TX`
  - onConfirmation: `POST /course-modules/batch-confirm-transaction` - Set all modules to `ON_CHAIN` with `moduleHash`
  - Module hash (token name) is computed from SLTs using Blake2b-256 (see `computeSltHash()`)
- `COURSE_TEACHER_ASSIGNMENTS_ASSESS` - Assess student assignment submissions (~0.21 ADA)
  - txParams: `alias`, `courseId`, `assignmentDecisions[]` (array of `{alias, outcome}`), `walletData?`
  - onSubmit: `POST /assignment-commitments/update-status` - Set to `PENDING_TX_ASSIGNMENT_ACCEPTED` or `PENDING_TX_ASSIGNMENT_REFUSED`
  - onConfirmation: `POST /assignment-commitments/confirm-transaction` - Finalize to `ASSIGNMENT_ACCEPTED` or `ASSIGNMENT_REFUSED`
  - Conditional side effects based on `assessmentResult` (accept/refuse)

**Student** (3)
- `COURSE_STUDENT_ASSIGNMENT_COMMIT` - Enroll in a course with initial assignment commitment (~2.14 ADA)
  - txParams: `alias`, `courseId`, `commitData?` (`{sltHash, assignmentInfo}`), `walletData?`
  - onSubmit: `POST /assignment-commitments/create` - Create initial assignment commitment
  - onConfirmation: `POST /assignment-commitments/confirm-transaction` - Confirm to `PENDING_APPROVAL`
  - Assignment info hash computed using `computeAssignmentInfoHash(evidence)`
- `COURSE_STUDENT_ASSIGNMENT_UPDATE` - Update assignment or commit to new module (~0.33 ADA)
  - txParams: `alias`, `courseId`, `assignmentInfo`, `maybeNewSltHash?`, `walletData?`
  - Two modes: update existing commitment OR create new commitment for different module
  - onSubmit (update): `POST /assignment-commitments/update-evidence` - Update evidence
  - onSubmit (new): `POST /assignment-commitments/create` - Create new commitment
  - onConfirmation: `POST /assignment-commitments/confirm-transaction` - Confirm update
- `COURSE_STUDENT_CREDENTIAL_CLAIM` - Claim completed credential (~-1.03 ADA refund)
  - txParams: `alias`, `courseId`, `walletData?`
  - No side effects (purely on-chain action)
  - All assignment commitments already completed by this point

### V1 Transactions (Legacy - 8 implemented)

V1 transactions are maintained for backward compatibility with existing implementations.

**Structure:** `v1/{role}/`

**Course Creator** (3)
- `MINT_MODULE_TOKENS` - Publish a new course module/credential
- `ACCEPT_ASSIGNMENT` - Accept student submission and issue credential
- `DENY_ASSIGNMENT` - Deny student submission with feedback

**Student** (5)
- `MINT_LOCAL_STATE` - Enroll in a course
- `BURN_LOCAL_STATE` - Exit course and claim credentials
- `COMMIT_TO_ASSIGNMENT` - Commit to work on an assignment
- `UPDATE_ASSIGNMENT` - Submit evidence for assignment review
- `LEAVE_ASSIGNMENT` - Withdraw from an assignment

### Import Examples

```typescript
// Import V2 transactions (recommended - default exports)
import { COURSE_ADMIN_CREATE, COURSE_STUDENT_ASSIGNMENT_COMMIT } from "@andamio/transactions";

// Import V1 transactions explicitly
import { v1 } from "@andamio/transactions";
const { MINT_MODULE_TOKENS } = v1;

// Import version namespaces
import { v1, v2 } from "@andamio/transactions";
const v2StudentTxs = [v2.COURSE_STUDENT_ASSIGNMENT_COMMIT, v2.COURSE_STUDENT_ASSIGNMENT_UPDATE];

// Get transactions by version
import { getTransactionsByVersion } from "@andamio/transactions";
const allV2Transactions = getTransactionsByVersion("v2");
const allV1Transactions = getTransactionsByVersion("v1");

// Get transactions by version and role
import { getTransactionsByVersionAndRole } from "@andamio/transactions";
const v2StudentTxs = getTransactionsByVersionAndRole("v2", "student");
```

### Future Versions

The package is designed to support future protocol versions (v3, v4, etc.) by adding new versioned subfolders:
```
src/definitions/
├── v1/           # Legacy
├── v2/           # Current production
├── v3/           # Future
└── index.ts      # Exports all versions
```

## Development

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Testing Side Effects

This package includes comprehensive testing utilities for validating transaction side effects. See [TESTING.md](./TESTING.md) for the complete guide.

**Quick example:**

```typescript
import {
  createMockSubmissionContext,
  testSideEffect,
} from "@andamio/transactions";
import { COURSE_TEACHER_MODULES_MANAGE } from "./definitions";

const context = createMockSubmissionContext({
  buildInputs: {
    courseId: "abc123...",
    modulesToMint: [{ slts: ["I can..."], allowedStudents_V2: [], prerequisiteAssignments_V2: [] }],
  },
});

const sideEffect = COURSE_TEACHER_MODULES_MANAGE.onSubmit![0];
const result = testSideEffect(sideEffect, context);

console.log(result.resolvedEndpoint);
// => "/course-modules/batch-update-status"

console.log(result.requestBody);
// => { course_nft_policy_id: "abc123...", modules: [...], pending_tx_hash: "..." }
```

## Additional Documentation

### SLT Hashing Utility

This package provides a utility to compute module token names (hashes) from Student Learning Targets (SLTs). This matches the on-chain Plutus validator computation exactly, allowing developers to **preview module token names before running transactions**.

```typescript
import { computeSltHash, verifySltHash, isValidSltHash } from "@andamio/transactions";

// Preview the module token name BEFORE minting
const slts = [
  "I can mint an access token.",
  "I can complete an assignment to earn a credential."
];
const moduleHash = computeSltHash(slts);
// Returns: "8dcbe1b925d87e6c547bbd8071c23a712db4c32751454b0948f8c846e9246b5c"

// Verify a hash matches expected SLTs
const isValid = verifySltHash(slts, moduleHash);
// Returns: true

// Validate hash format (64 hex characters)
const validFormat = isValidSltHash(moduleHash);
// Returns: true
```

**Use Cases:**
- **Preview before minting** - Show users what their module's on-chain identifier will be
- **Validate after confirmation** - Verify the on-chain mint matches expectations
- **Look up existing modules** - Compute the hash to query if a module already exists on-chain
- **Debug mismatches** - Compare expected vs actual hashes if something goes wrong

**Algorithm:**
1. Convert each SLT string to UTF-8 bytes
2. Encode as CBOR indefinite-length array of byte strings
3. Hash with Blake2b-256 (32 bytes / 256 bits)

This matches the Plutus on-chain computation:
```haskell
sltsToBbs MintModuleV2{slts} = blake2b_256 $ serialiseData $ toBuiltinData $ map stringToBuiltinByteString slts
```

The hash is **deterministic** - the same SLTs will always produce the same hash, matching exactly what the Plutus validator computes on-chain.

### Task Hash Utility

For Project V2 tasks, the `task_id` stored on-chain is a hash of the task data. This utility allows you to **pre-compute task IDs before running transactions** and verify on-chain task IDs match expected values.

```typescript
import {
  computeTaskHash,
  verifyTaskHash,
  isValidTaskHash,
  debugTaskCBOR,
  type TaskData
} from "@andamio/transactions";

// Compute task ID before or after transaction
const task: TaskData = {
  project_content: "Open Task #1",
  expiration_time: 1769027280000,
  lovelace_amount: 15000000,
  native_assets: []  // Array of [policyId.tokenName, quantity] tuples
};
const taskId = computeTaskHash(task);
// Returns: "c4c6affd3a575d56dc98f0e172928b5c5dd170ce13b1db4a9ae82f2d07223cb2"

// Verify a hash matches expected task data
const isValid = verifyTaskHash(task, taskId);
// Returns: true

// Validate hash format (64 hex characters)
const validFormat = isValidTaskHash(taskId);
// Returns: true

// Debug: inspect CBOR encoding before hashing
const cbor = debugTaskCBOR(task);
// Returns hex string of Plutus-serialized data
```

**Use Cases:**
- **Pre-compute task IDs** - Know the on-chain identifier before publishing tasks
- **Verify on-chain data** - Confirm published tasks have expected IDs
- **Link TX requests to results** - Match transaction request data to resulting on-chain assets
- **Debug hash mismatches** - Inspect CBOR encoding when troubleshooting

**Algorithm:**
1. Encode task as Plutus `Constr 0` with fields: `[project_content, expiration_time, lovelace_amount, native_assets]`
2. Use indefinite-length CBOR arrays (matching Plutus serialization)
3. Hash with Blake2b-256 (32 bytes / 64 hex chars)

This matches the Plutus on-chain computation exactly - the same task data always produces the same hash.

### CBOR Transaction Decoder

Decode Cardano transaction CBOR to extract mints, outputs, inputs, and metadata. Uses `@meshsdk/core-cst` under the hood.

**Who Uses This:** The **frontend (T3 App Template)** is the primary user. The transaction API returns `unsignedTxCBOR` in its response - this decoder lets the frontend inspect what's in it before asking the user to sign.

**Who Does NOT Need This:**
- **Transaction API** - It builds the CBOR, doesn't need to decode it
- **DB API** - Only handles database records, never touches CBOR
- **Transaction Monitoring Service** - Would query Koios/Blockfrost for confirmed tx data

**Practical Reality:** For most Andamio transactions, the decoder is a **nice-to-have** rather than essential:
- Module hashes can be pre-computed with `computeSltHash(slts)` before calling the tx API
- Evidence hashes are computed with `computeAssignmentInfoHash(evidence)` before submission
- Transaction ID comes back after signing

The decoder is most valuable for **transaction preview UI** and **debugging**.

```typescript
import {
  decodeTransactionCbor,
  extractMints,
  extractMintsByPolicy,
  extractAssetNames,
  extractTxId
} from "@andamio/transactions";

// From tx API response
const { unsignedTxCBOR } = await response.json();

// Decode full transaction for preview UI
const decoded = decodeTransactionCbor(unsignedTxCBOR);
console.log(`Fee: ${Number(decoded.fee) / 1_000_000} ADA`);
console.log(`Minting ${decoded.mints.length} tokens`);
console.log(decoded.outputs);   // Where ADA/tokens are going

// Extract just mints
const mints = extractMints(unsignedTxCBOR);
// => [{ policyId: "abc...", assetName: "moduleHash...", quantity: 1n }]

// Filter by policy ID
const moduleMints = extractMintsByPolicy(unsignedTxCBOR, modulePolicy);

// Get just asset names (module hashes)
const moduleHashes = extractAssetNames(unsignedTxCBOR, modulePolicy);

// Get transaction ID
const txId = extractTxId(unsignedTxCBOR);
```

**Use Cases:**

1. **Transaction Preview UI** - Show users exactly what they're signing (fee, mints, destinations)
2. **Validation** - Verify the tx API built what you expected before signing
3. **Debugging** - Inspect transaction contents when troubleshooting
4. **Verification** - Cross-check that extracted data matches pre-computed values

**Note:** For module hashes, prefer pre-computing with `computeSltHash(slts)` since you know the SLTs before building the transaction. Use `extractAssetNames()` for verification or when SLTs aren't readily available.

### Batch Module Management Helpers

For `COURSE_TEACHER_MODULES_MANAGE`, helper functions format request bodies for batch side effect operations:

```typescript
import {
  formatBatchUpdateStatusBody,
  formatBatchConfirmBody,
  computeSltHash,
} from "@andamio/transactions";

// onSubmit: Set modules to PENDING_TX
const updateBody = formatBatchUpdateStatusBody(
  courseId,                    // "abc123..." (56-char hex policy ID)
  ["MODULE_1", "MODULE_2"],    // module codes being managed
  txHash                       // from wallet.submitTx()
);
await fetch('/course-modules/batch-update-status', {
  method: 'POST',
  body: JSON.stringify(updateBody),
});

// onConfirmation: Get module hashes and confirm
// Pre-compute hashes (preferred - known at submission time)
const moduleHashes = modulesToMint.map(m => computeSltHash(m.slts));

// Create confirmation body
const confirmBody = formatBatchConfirmBody(
  courseId,                    // "abc123..."
  ["MODULE_1", "MODULE_2"],    // module codes (same order as when minting)
  txHash,                      // confirmed transaction hash
  moduleHashes                 // array of module hashes (same order)
);
await fetch('/course-modules/batch-confirm-transaction', {
  method: 'POST',
  body: JSON.stringify(confirmBody),
});
```

**Note:** Module codes and hashes must be passed in the same order as they appear in `modulesToMint`.

### Assignment Info Hash Utility

For assignment commitments, the `assignmentInfo` stored on-chain is a hash of the evidence content. The full evidence (Tiptap JSON) is stored in the database, while only the hash goes on-chain for compact storage and tamper-evidence.

```typescript
import {
  computeAssignmentInfoHash,
  verifyAssignmentInfoHash,
  verifyEvidenceDetailed,
  isValidAssignmentInfoHash
} from "@andamio/transactions";

// When submitting an assignment
const evidence = {
  type: "doc",
  content: [
    { type: "paragraph", content: [{ type: "text", text: "My submission..." }] }
  ]
};
const assignmentInfoHash = computeAssignmentInfoHash(evidence);
// Use this hash in the transaction's commitData.assignmentInfo

// Later, verify database evidence matches on-chain commitment
const isValid = verifyAssignmentInfoHash(dbEvidence, onChainHash);

// For debugging, get detailed verification results
const result = verifyEvidenceDetailed(dbEvidence, onChainHash);
console.log(result.message);
// "Evidence matches on-chain commitment" or error details

// Validate hash format (64 hex characters)
isValidAssignmentInfoHash(hash); // true/false
```

**Normalization Rules:**
- Object keys sorted alphabetically (for deterministic JSON)
- Strings trimmed of leading/trailing whitespace
- Arrays preserve order, items normalized recursively
- `undefined` converted to `null`

This ensures the same evidence always produces the same hash, regardless of JSON key ordering.

### Evidence Locking Behavior (UX Guidance)

Once a student commits evidence to an assignment (via `COURSE_STUDENT_ASSIGNMENT_COMMIT` or `COURSE_STUDENT_ASSIGNMENT_UPDATE`), the evidence becomes **immutable from a blockchain perspective**. The on-chain commitment stores a hash of the evidence (`assignmentInfo`), so any modification would cause a mismatch.

**UX Implementation Requirements:**

1. **Lock evidence editor after commitment** - When `network_status` transitions to `PENDING_TX_*` or any committed state, the evidence editor should become read-only. Display a message like "Evidence locked - awaiting assessment" or "Evidence committed on-chain".

2. **Hash validation on storage** - The database API validates that `network_evidence_hash` matches the computed hash of evidence content when:
   - Creating a new assignment commitment
   - Updating evidence (before commitment)

   This prevents storing evidence that doesn't match what was committed on-chain.

3. **Status-based editability:**
   ```typescript
   const isEditable = (status: AssignmentCommitmentStatus) => {
     // Only editable before any commitment
     return status === "DRAFT" || status === "NEEDS_REVISION";
   };
   ```

4. **Visual indicators:**
   - Show a lock icon when evidence is committed
   - Display the evidence hash for transparency
   - Link to on-chain verification via Andamioscan

**Why this matters:** The assignment info hash creates a tamper-evident record. If someone edits database evidence after commitment, verification will fail because the hash won't match. This ensures the evidence a teacher assesses is exactly what the student committed.

### Hash Handling Guide

**[HASH-HANDLING.md](./HASH-HANDLING.md)** - Comprehensive guide to content hash handling across Andamio transactions.

This document explains:
- How content hashes are computed on-chain by validators
- Hash storage patterns in transaction definitions
- Current hash usage (module tokens, assignment evidence)
- Adding hash support to new transactions
- Best practices and security considerations

**Key concepts:**
- Hashes are computed on-chain, never client-side
- Two-step pattern: submission (empty hash) → confirmation (extract hash from on-chain data)
- Hash immutability enforcement
- Integration with database API hash storage

### Input Helper Functions

**[INPUT-HELPERS.md](./INPUT-HELPERS.md)** - Complete guide to creating and using input helper functions for complex transaction parameters.

### Testing Guide

**[TESTING.md](./TESTING.md)** and **[TESTING-SUMMARY.md](./TESTING-SUMMARY.md)** - Comprehensive testing utilities and patterns for validating transaction side effects.

### T3 Integration

**[T3-INTEGRATION.md](./T3-INTEGRATION.md)** - Guide for integrating this package with T3 Stack applications.

### Execution Summary

**[EXECUTION-SUMMARY.md](./EXECUTION-SUMMARY.md)** - Details on transaction execution lifecycle and side effect processing.

## Integration with andamio-docs

### ⚠️ Critical Requirement: Perfect Alignment

**This package MUST perfectly match the protocol specifications in andamio-docs.**

The andamio-docs repository is the authoritative source for:
- Transaction structure (inputs, outputs, mints, withdraws)
- Token requirements (`metadata.requires_tokens`)
- Transaction costs (`metadata.estimated_cost`)
- Transaction roles and categories
- Protocol versioning (v1, v2)

### Protocol Specification Structure

**andamio-docs** (source of truth):
```
andamio-docs/content/docs/protocol/
├── v1/transactions/               # Protocol v1 transactions
│   ├── general/
│   ├── course-creator/
│   ├── student/
│   └── ...
└── v2/transactions/               # Protocol v2 transactions
    ├── general/
    │   └── mint-access-token.mdx
    └── course/
        ├── admin/
        │   ├── create.mdx
        │   └── teachers-update.mdx
        ├── teacher/
        │   ├── modules-manage.mdx
        │   └── assignments-assess.mdx
        └── student/
            ├── enroll.mdx
            ├── assignment-update.mdx
            └── credential-claim.mdx
```

**This package** (extends protocol specs with API/UI):
```
src/definitions/
├── v1/                            # V1 transactions (legacy)
│   ├── course-creator/
│   │   ├── mint-module-tokens.ts
│   │   ├── accept-assignment.ts
│   │   └── deny-assignment.ts
│   └── student/
│       ├── mint-local-state.ts
│       ├── burn-local-state.ts
│       └── ...
└── v2/                            # V2 transactions (current)
    ├── general/                   # Cross-system transactions
    │   └── access-token-mint.ts   # GENERAL_ACCESS_TOKEN_MINT
    └── course/                    # Course system
        ├── admin/
        │   ├── create.ts          # COURSE_ADMIN_CREATE
        │   └── teachers-update.ts # COURSE_ADMIN_TEACHERS_UPDATE
        ├── teacher/
        │   ├── modules-manage.ts      # COURSE_TEACHER_MODULES_MANAGE
        │   └── assignments-assess.ts  # COURSE_TEACHER_ASSIGNMENTS_ASSESS
        └── student/
            ├── assignment-commit.ts   # COURSE_STUDENT_ASSIGNMENT_COMMIT
            ├── assignment-update.ts   # COURSE_STUDENT_ASSIGNMENT_UPDATE
            └── credential-claim.ts    # COURSE_STUDENT_CREDENTIAL_CLAIM
```

### How This Package Extends Protocol Specs

Each transaction definition includes a `protocolSpec` that references the YAML file:

```typescript
protocolSpec: {
  version: "v1",
  id: "course-creator.mint-module-tokens",
  yamlPath: "/yaml/transactions/v1/course-creator/mint-module-tokens.yaml",
  requiredTokens: ["global-state.access-token-user", "course.course-nft"]
}
```

**The protocol layer (YAML) defines WHAT happens on-chain.**
**This package defines HOW to integrate with APIs and databases.**

### Validation Against Protocol Specs

When implementing transactions:

1. ✅ **Check YAML first** - Always reference the protocol YAML
2. ✅ **Match token requirements** - Use `metadata.requires_tokens` from YAML
3. ✅ **Use correct costs** - Extract from `metadata.estimated_cost` in YAML
4. ✅ **Verify protocol version** - Ensure correct v1/v2 reference
5. ✅ **Validate on-chain data** - Side effects should extract data that matches YAML outputs

### Keeping in Sync

When protocol specs change in andamio-docs:
1. Update `protocolSpec.yamlPath` if files move
2. Update `requiredTokens` if token requirements change
3. Update costs in `utils/protocol-reference.ts`
4. Update side effects if on-chain structure changes (mints, outputs, etc.)

## Development

This package is embedded in the Andamio T3 App Template at:
`andamio-app-v2/packages/andamio-transactions/`

This allows direct editing of transaction definitions without publishing. The main app's `package.json` references it via `"@andamio/transactions": "file:packages/andamio-transactions"`.

**Future**: This package will be published to npm as `@andamio/transactions` for use in other projects.

## License

MIT
