# Andamio Template Transaction Components

> Last Updated: January 9, 2026

Andamio is a Web3 platform with many transactions happening on-chain.

This document describes the transaction component architecture for the T3 App Template.

**Design Philosophy**:
- Minimal, consistent transaction UX using shadcn/ui and Andamio components
- Type-safe transaction definitions with declarative side effects
- Automatic pending transaction monitoring

## Initial Rules

1. **Andamioscan** returns unsigned CBOR that the user needs to sign
2. We hit the tx endpoints with nice fetch requests, just like any other data
3. Completed transactions need to update our database

---

## Transaction Architecture

### Core Components

**1. Transaction Hook (`useAndamioTransaction`)**
- Wraps `useTransaction` and adds automatic side effect execution
- Accepts `AndamioTransactionDefinition` from `@andamio/transactions`
- Filters params based on definition's `txApiSchema`
- Executes `onSubmit` side effects after transaction submission
- Manages transaction state (idle, fetching, signing, submitting, success, error)
- Provides callbacks for success/error handling
- Supports partial signing via underlying `useTransaction`

**2. Base Transaction Hook (`useTransaction`)**
- Low-level hook for transaction lifecycle: fetch → sign → submit
- Integrates with Mesh SDK for wallet signing
- Supports partial signing for multi-sig transactions via `partialSign` option
- Used directly only when custom transaction handling is needed

**3. Transaction Button Component (`TransactionButton`)**
- Reusable button for initiating transactions
- Shows loading states during transaction flow
- Displays transaction status (signing, submitting, etc.)
- Uses AndamioButton with enhanced states

**4. Transaction Status Component (`TransactionStatus`)**
- Displays transaction progress/result
- Shows transaction hash in a formatted code block on success
- Provides "View on Cardano Explorer" button with external link
- Error messaging with retry option
- Uses semantic colors (success, error, info)
- Accepts custom messages for each transaction state

### Transaction Flow

```
1. User clicks TransactionButton
   ↓
2. useTransaction fetches unsigned CBOR from Andamioscan endpoint
   ↓
3. User signs transaction with wallet (Mesh SDK)
   ↓
4. useTransaction submits signed tx to blockchain
   ↓
5. On success: update database + show success state
   ↓
6. Display tx hash and Cardano explorer link
```

### Andamioscan Transaction Endpoints

Transaction endpoints can use different HTTP methods:
- **GET**: Parameters sent as query string (e.g., mint access token)
- **POST**: Parameters sent as JSON body (e.g., submit assignment)
- **Response**: Unsigned CBOR (hex string)
- **Endpoint**: `/api/andamioscan/tx/{transaction-name}`

The `useTransaction` hook automatically handles both methods based on the `method` parameter in the transaction config.

### Partial Signing (Multi-Sig Support)

For transactions that require multiple signatures (e.g., pre-signed by backend), use the `partialSign` option:

```typescript
await execute({
  endpoint: "/tx/v2/some/multi-sig-tx",
  params: { ... },
  partialSign: true,  // Preserves existing signatures when signing
  onSuccess: (result) => { ... },
});
```

When `partialSign: true`:
- The wallet adds its signature without clearing existing signatures in the CBOR
- Used when the unsigned CBOR already contains signatures from other parties
- The transaction is still submitted normally after signing

---

## Implemented Transactions (V2)

All 16 V2 transaction definitions from `@andamio/transactions` are implemented. Each component uses the `useAndamioTransaction` hook which:
- Executes `onSubmit` side effects automatically after transaction submission
- Filters transaction params based on definition schema
- Provides consistent state management and error handling

### Transaction Component Matrix

| Definition | Component | Role |
|------------|-----------|------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `mint-access-token.tsx` | general |
| `INSTANCE_COURSE_CREATE` | `create-course.tsx` | instance-owner |
| `INSTANCE_PROJECT_CREATE` | `create-project.tsx` | instance-owner |
| `COURSE_OWNER_TEACHERS_MANAGE` | `teachers-update.tsx` | course-owner |
| `COURSE_TEACHER_MODULES_MANAGE` | `mint-module-tokens.tsx` | course-teacher |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assess-assignment.tsx` | course-teacher |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `enroll-in-course.tsx` | course-student |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment-update.tsx` | course-student |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential-claim.tsx` | course-student |
| `PROJECT_OWNER_MANAGERS_MANAGE` | `managers-manage.tsx` | project-owner |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist-manage.tsx` | project-owner |
| `PROJECT_MANAGER_TASKS_MANAGE` | `tasks-manage.tsx` | project-manager |
| `PROJECT_MANAGER_TASKS_ASSESS` | `tasks-assess.tsx` | project-manager |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `project-enroll.tsx`, `task-commit.tsx` | project-contributor |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task-action.tsx` | project-contributor |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project-credential-claim.tsx` | project-contributor |

---

### Mint Access Token

**Status**: ✅ Active

**Purpose**: Mint a new Andamio Access Token NFT for the user

**Definition**: `GLOBAL_GENERAL_ACCESS_TOKEN_MINT`

**Atlas API Endpoint**: `POST /v2/tx/global/general/access-token/mint`

**Parameters**:
- `initiator_data` (string): User's Cardano wallet address (bech32 format)
- `alias` (string): Desired access token alias (1-31 alphanumeric chars)

**Flow**:
1. User enters desired alias on dashboard
2. Click "Mint Access Token" button
3. `useAndamioTransaction` fetches unsigned CBOR from Atlas API
4. User signs with wallet
5. Transaction submitted to blockchain
6. `onSubmit` side effects executed (set pending tx)
7. Manual JWT handling updates user's alias and stores new JWT
8. Auth context refreshed

**Components**:
- `src/hooks/use-andamio-transaction.ts` - Transaction hook with side effects
- `src/components/transactions/transaction-button.tsx` - Reusable tx button
- `src/components/transactions/transaction-status.tsx` - Status display
- `src/components/transactions/mint-access-token.tsx` - Mint token UI

**Special Note**: Uses hybrid approach - `useAndamioTransaction` for standardized side effects, but manually handles JWT storage since the endpoint returns a new JWT.

**Used In**:
- Dashboard page - for users without access token

---

### Enroll in Course

**Status**: ✅ Active

**Purpose**: Enroll a learner in a course with an initial module commitment

**Definition**: `COURSE_STUDENT_ASSIGNMENT_COMMIT`

**Atlas API Endpoint**: `POST /v2/tx/course/student/assignment/commit`

**Parameters**:
- `alias` (string): User's access token alias
- `course_id` (string): Course NFT Policy ID
- `slt_hash` (string): Module SLT hash (64 char hex)
- `assignment_info` (string): Evidence hash

**Flow**:
1. User visits course page and selects a module
2. User provides initial evidence for the module
3. Click "Enroll & Submit" button
4. `useAndamioTransaction` builds and submits transaction
5. Course state token minted to user's wallet
6. Side effects update database with enrollment record

**Components**:
- `src/components/transactions/enroll-in-course.tsx` - Enrollment UI with module selection

**Used In**:
- `/course/[coursenft]` - Course detail page

---

### Assignment Update

**Status**: ✅ Active

**Purpose**: Update assignment evidence for an existing module commitment

**Definition**: `COURSE_STUDENT_ASSIGNMENT_UPDATE` or `COURSE_STUDENT_ASSIGNMENT_COMMIT`

**Components**:
- `src/components/transactions/assignment-update.tsx` - Supports both update and new commitment modes

**Note**: Component uses `isNewCommitment` prop to switch between `ASSIGNMENT_UPDATE` (updating existing) and `ASSIGNMENT_COMMIT` (new module commitment).

---

### Project Enrollment

**Status**: ✅ Active

**Purpose**: Enroll a contributor in a project with initial task commitment

**Definition**: `PROJECT_CONTRIBUTOR_TASK_COMMIT`

**Components**:
- `src/components/transactions/project-enroll.tsx` - Initial project enrollment
- `src/components/transactions/task-commit.tsx` - Subsequent task commitments

**Used In**:
- `/project/[treasurynft]/contributor` - Contributor dashboard
- `/project/[treasurynft]/[taskhash]` - Task detail page

---

## Package Architecture

**`@andamio/transactions` Package** (already exists):
- Transaction definitions with schemas and side effects
- Side effect execution utilities (`executeOnSubmit`, `executeOnConfirmation`)
- Input helper functions (hash computation, etc.)
- Types for definitions and contexts

**T3 App Template** (this app):
- `useAndamioTransaction` hook - integrates definitions with wallet
- `useTransaction` hook - base transaction lifecycle
- `TransactionButton`, `TransactionStatus` - UI components
- 16 transaction-specific components

**Exports from `@andamio/transactions`**:
```typescript
// V2 Definitions (16 total)
export { GLOBAL_GENERAL_ACCESS_TOKEN_MINT } from "./definitions/v2/global";
export { INSTANCE_COURSE_CREATE, INSTANCE_PROJECT_CREATE } from "./definitions/v2/instance";
export { COURSE_OWNER_TEACHERS_MANAGE, ... } from "./definitions/v2/course";
export { PROJECT_OWNER_MANAGERS_MANAGE, ... } from "./definitions/v2/project";

// Execution utilities
export { executeOnSubmit, executeOnConfirmation } from "./execution";

// Input helpers
export { computeAssignmentInfoHash, computeModuleInfoHash } from "./utils";

// Types
export type { AndamioTransactionDefinition, SubmissionContext } from "./types";
```

---

## Development Notes

- Use semantic colors for all transaction states
- All components should work with light/dark mode
- Transaction buttons should be disabled during signing/submission
- Always show clear error messages
- **Always use TransactionStatus to display successful transactions with txHash**
- Provide tx hash links to Cardano explorer on success
- Custom success messages can be provided via the `messages` prop
- TransactionStatus automatically shows/hides based on transaction state