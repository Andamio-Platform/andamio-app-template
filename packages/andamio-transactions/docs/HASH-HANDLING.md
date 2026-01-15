# Hash Handling in Andamio Transactions

> **⚠️ DRAFT DOCUMENTATION**
>
> This is a first draft and requires review by the Andamio Platform Development Circle.
> Patterns and recommendations may change based on team feedback and evolving requirements.

> **Version**: v1 (Andamio Protocol v1)
> **Status**: Active - This document will evolve for Andamio v2

## Overview

Hashes play a critical role in the Andamio platform for ensuring content integrity and enabling verification of on-chain data. This document explains how hashes are computed, stored, and used across different transaction types.

## Core Principles

### 1. On-Chain Hash Computation

**All content hashes are computed on-chain by Cardano validators**, not in the frontend or backend code. This ensures:

- **Trustless Verification**: Hash computation is verifiable by anyone examining the transaction
- **Tamper Resistance**: Cannot be manipulated by clients or APIs
- **Blockchain Alignment**: Hashes are cryptographically linked to on-chain data

### 2. Hash Storage Pattern

The standard pattern for hash handling across transactions:

1. **Transaction Submission** (`onSubmit` hooks):
   - Hash field initialized as empty or placeholder
   - `pendingTxHash` stored to track the transaction

2. **Transaction Confirmation** (`onConfirmation` hooks):
   - Hash extracted from on-chain data
   - Stored in the database for future reference
   - Associated with the confirmed transaction

### 3. Hash Types in Use

Three primary hash patterns exist in Andamio:

- **Asset Name Hashes**: Used for token minting (e.g., module tokens, task tokens)
- **Data Hashes**: Used for content verification (e.g., assignment evidence)
- **Task ID Hashes**: Used to identify project tasks on-chain (Project V2)

## Current Hash Usage

### 1. Module Content Hashes

**Transaction**: `MINT_MODULE_TOKENS` (`packages/andamio-transactions/src/definitions/course-creator/mint-module-tokens.ts`)

**Purpose**: Hash the content of a course module to create a unique, verifiable identifier for the module token.

**Hash Computation**:
- Computed on-chain by the minting validator
- Includes: module code, SLTs (Student Learning Targets), assignment content
- Result stored in the minted token's `assetName`

**Extraction Path**: `onChainData.mints[0].assetName`

**Database Storage**: `Module.moduleHash`

**Example**:
```typescript
// In mint-module-tokens.ts
onConfirmation: [
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
      //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //          Hash extracted from the minted token's asset name
    },
  },
]
```

### 2. Assignment Evidence Hashes

**Transactions**:
- `COMMIT_TO_ASSIGNMENT` (`packages/andamio-transactions/src/definitions/student/commit-to-assignment.ts`)
- `ACCEPT_ASSIGNMENT` (`packages/andamio-transactions/src/definitions/course-creator/accept-assignment.ts`)
- `DENY_ASSIGNMENT` (`packages/andamio-transactions/src/definitions/course-creator/deny-assignment.ts`)

**Purpose**: Hash the assignment evidence to verify content integrity and prevent tampering.

**Hash Computation**:
- Computed on-chain by the validator
- Input: assignment evidence data provided by the student
- Algorithm: Typically Blake2b-256 (Cardano standard)

**Extraction Path**: `onChainData.dataHash`

**Database Storage**: `AssignmentCommitment.networkEvidenceHash`

**Example from commit-to-assignment.ts**:
```typescript
onSubmit: [
  {
    def: "Create Assignment Commitment",
    method: "POST",
    endpoint: "/assignment-commitments/{courseNftPolicyId}/{moduleCode}",
    body: {
      networkEvidenceHash: { source: "literal", value: "" },
      //                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //                   Initially empty - hash not yet computed
      pendingTxHash: { source: "context", path: "txHash" },
    },
  },
],
onConfirmation: [
  {
    def: "Confirm Assignment Commitment Transaction",
    method: "PATCH",
    endpoint: "/assignment-commitments/{courseNftPolicyId}/{moduleCode}/{accessTokenAlias}/confirm-transaction",
    body: {
      txHash: { source: "context", path: "txHash" },
      networkEvidenceHash: { source: "onChainData", path: "dataHash" },
      //                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
      //                   Hash extracted from confirmed transaction
      networkStatus: { source: "literal", value: "PENDING_APPROVAL" }
    },
  },
]
```

### 3. Task ID Hashes (Project V2)

**Transaction**: `PROJECT_MANAGER_TASKS_MANAGE` (`packages/andamio-transactions/src/definitions/v2/project/manager/tasks-manage.ts`)

**Purpose**: Hash task data to create a unique, verifiable identifier for the task token. The `task_id` is the token name on-chain.

**Hash Computation**:
- Computed on-chain by the Plutus validator
- Uses Plutus `Constr 0` with indefinite-length arrays
- Input fields (in order): `project_content`, `expiration_time`, `lovelace_amount`, `native_assets`
- Algorithm: Blake2b-256 (32 bytes / 64 hex chars)

**Pre-computation**: Unlike other hashes, task IDs can be **pre-computed client-side** since all inputs are known before transaction submission. This enables linking transaction requests to resulting on-chain assets.

**Client-Side Usage**:
```typescript
import { computeTaskHash, verifyTaskHash, type TaskData } from "@andamio/transactions";

// Before submitting transaction
const task: TaskData = {
  project_content: "Open Task #1",
  expiration_time: 1769027280000,
  lovelace_amount: 15000000,
  native_assets: []
};

// Pre-compute the task_id that will appear on-chain
const expectedTaskId = computeTaskHash(task);

// After transaction confirms, verify on-chain task matches
const onChainTask = await getTaskFromAndamioscan(projectId, expectedTaskId);
const isValid = verifyTaskHash(task, onChainTask.task_id);
```

**Database Storage**: `Task.task_hash` (synced from on-chain data via Andamioscan)

**Note**: Task hashes follow a different pattern than module/evidence hashes. Since all task fields are known at submission time, the hash can be computed locally for verification purposes. This is particularly useful for:
- Matching TX API request data to resulting on-chain assets
- Verifying task creation succeeded with expected data
- Building task-specific URLs before confirmation

## Adding Hash Support to New Transactions

When creating a new transaction that requires content hashing, follow this pattern:

### Step 1: Define Database Fields

Add hash storage fields to your Prisma schema:

```prisma
model YourModel {
  id            String  @id @default(cuid())

  // Hash fields
  contentHash   String?  // The actual content hash
  pendingTxHash String?  // Transaction hash while pending

  // ... other fields
}
```

### Step 2: Configure Transaction Definition

In your transaction definition file:

```typescript
import type { AndamioTransactionDefinition } from "../../types";

export const YOUR_TRANSACTION: AndamioTransactionDefinition = {
  txType: "YOUR_TRANSACTION",
  role: "your-role",

  // ... protocol and build config

  onSubmit: [
    {
      def: "Create Resource with Pending Hash",
      method: "POST",
      endpoint: "/your-resource/{param}",
      body: {
        // Initialize hash as empty
        contentHash: { source: "literal", value: "" },
        pendingTxHash: { source: "context", path: "txHash" },
      },
    },
  ],

  onConfirmation: [
    {
      def: "Update Resource with Computed Hash",
      method: "PATCH",
      endpoint: "/your-resource/{param}/confirm",
      body: {
        txHash: { source: "context", path: "txHash" },

        // Extract hash from on-chain data
        // Choose the appropriate path based on your transaction type:

        // For data hashes:
        contentHash: { source: "onChainData", path: "dataHash" },

        // For token asset name hashes:
        // contentHash: { source: "onChainData", path: "mints[0].assetName" },
      },
    },
  ],
};
```

### Step 3: Document Hash Purpose

Add clear documentation in your transaction definition:

```typescript
/**
 * YOUR_TRANSACTION
 *
 * This transaction computes a hash of [describe content] to ensure
 * [describe purpose - integrity, verification, etc.].
 *
 * Hash Details:
 * - Input: [what gets hashed]
 * - Algorithm: [Blake2b-256 / other]
 * - Storage: [database field]
 * - Verification: [how it's used]
 */
```

## Hash Verification Patterns

### Client-Side Verification

While hashes are computed on-chain, clients can verify hash integrity:

```typescript
import { OnChainData } from "@andamio/transactions";

/**
 * Verify that the stored hash matches what was computed on-chain
 */
function verifyHash(
  storedHash: string,
  onChainData: OnChainData
): boolean {
  // For data hashes
  return storedHash === onChainData.dataHash;

  // For token hashes
  // return storedHash === onChainData.mints?.[0]?.assetName;
}
```

### Database Verification

The database API should validate that:
1. Hash fields are only updated via blockchain confirmation endpoints
2. Hashes match the transaction hash provided for verification
3. Hash updates are immutable once set

## Future Considerations (Andamio v2)

This hash handling system is designed to be reusable and extensible. Expected changes in v2:

### 1. Additional Hash Types

- **Project Milestone Hashes**: Verify project deliverables
- **Governance Proposal Hashes**: Ensure proposal integrity
- **Credential Hashes**: Link credentials to specific achievements

### 2. Enhanced Verification

- **Multi-Hash Support**: Multiple hashes per transaction
- **Hash Chains**: Link related transactions through hash references
- **Off-Chain Verification**: Tools for verifying hashes without blockchain access

### 3. Helper Functions

Future additions to `@andamio/transactions` utilities:

```typescript
// Planned helper functions

/**
 * Extract hash from on-chain data based on transaction type
 */
export function extractHash(
  txType: string,
  onChainData: OnChainData
): string | undefined;

/**
 * Verify hash matches expected pattern
 */
export function verifyHashFormat(hash: string): boolean;

/**
 * Compare stored hash with on-chain data
 */
export function compareHash(
  stored: string,
  onChain: OnChainData,
  hashType: "data" | "asset"
): boolean;
```

## Type Reference

### OnChainData Type

The `OnChainData` type (from `src/types/context.ts`) includes all hash-related fields:

```typescript
export type OnChainData = {
  // Token minting - hash in assetName
  mints?: Array<{
    policyId: string;
    assetName: string;  // ← Module hashes stored here
    quantity: number;
  }>;

  // ... other fields

  // Content verification hash
  dataHash?: string;  // ← Assignment evidence hashes stored here
};
```

### Database Hash Fields

Current hash fields in the database schema:

```prisma
// Module content hash
model Module {
  moduleHash    String?  // Hash of module content from minted token
  pendingTxHash String?  // Transaction hash while minting
}

// Assignment evidence hash
model AssignmentCommitment {
  networkEvidenceHash String?  // Hash of assignment evidence
  pendingTxHash       String?  // Transaction hash while submitting
}
```

## Best Practices

### 1. Never Compute Hashes Client-Side for Storage

❌ **Don't**:
```typescript
// Never do this - hash should come from blockchain
const hash = computeHash(content);
await api.updateHash(hash);
```

✅ **Do**:
```typescript
// Let the blockchain compute it, then extract it
const { onChainData } = await confirmTransaction(txHash);
const hash = onChainData.dataHash;
```

### 2. Always Use Pending Transaction Pattern

❌ **Don't**:
```typescript
// Don't store hash before transaction confirms
await api.createResource({ hash: "..." });
```

✅ **Do**:
```typescript
// Use the two-step pattern
onSubmit: [{
  body: {
    hash: { source: "literal", value: "" },
    pendingTxHash: { source: "context", path: "txHash" }
  }
}],
onConfirmation: [{
  body: {
    hash: { source: "onChainData", path: "dataHash" }
  }
}]
```

### 3. Document Hash Purpose and Usage

Every transaction using hashes should clearly document:
- What content is being hashed
- Why the hash is needed
- How the hash will be used/verified
- Where the hash is stored

### 4. Handle Missing Hashes Gracefully

```typescript
// Hashes might be undefined during pending state
if (resource.contentHash) {
  // Verify with on-chain hash
} else if (resource.pendingTxHash) {
  // Transaction pending - hash not yet available
} else {
  // Resource not yet on-chain
}
```

## Related Documentation

- **OnChainData Type**: `src/types/context.ts`
- **Transaction Definitions**: `src/definitions/`
- **Database Schema**: `@andamio-platform/db-api` - `prisma/schema.prisma`
- **Protocol Specifications**: `andamio-docs/public/yaml/transactions/`

## Questions or Issues?

This hash handling system will evolve. If you're adding a new transaction type and unsure about hash handling:

1. Check existing transaction definitions for similar patterns
2. Review this document for applicable patterns
3. Document your use case for future reference
4. Consider whether your hash needs match existing patterns or require new approaches

**Remember**: The goal is reusability and consistency, not perfection. Document your approach so it can inform future iterations in Andamio v2.
