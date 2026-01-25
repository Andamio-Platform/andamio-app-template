# Andamio Template Transaction Components

> Last Updated: January 24, 2026

Andamio is a Web3 platform with many transactions happening on-chain.

This document describes the transaction component architecture for the T3 App Template.

**Design Philosophy**:
- Minimal, consistent transaction UX using shadcn/ui and Andamio components
- Type-safe transaction parameters with Zod validation
- Gateway auto-confirmation for DB updates (no client-side polling)

## Initial Rules

1. **Gateway API** returns unsigned CBOR that the user needs to sign
2. We hit the tx endpoints with nice fetch requests, just like any other data
3. Completed transactions need to update our database via **gateway auto-confirmation**

---

## Transaction Architecture (V2)

All transaction components use the V2 architecture with gateway auto-confirmation.

### Core Components

**1. Transaction Hook (`useSimpleTransaction`)**
- Simplified hook for transaction lifecycle: build → sign → submit → register
- Validates params using Zod schemas from `~/config/transaction-schemas.ts`
- Registers TXs with gateway for auto-confirmation (when `requiresDBUpdate: true`)
- Manages transaction state (idle, fetching, signing, submitting, success, error)
- Returns `result.requiresDBUpdate` flag for UI conditional rendering

**2. TX Watcher Hook (`useTxWatcher`)**
- Polls gateway `/api/v2/tx/status/:hash` for confirmation status
- Handles TX state machine: `pending → confirmed → updated`
- Provides `isSuccess` boolean and `status` object
- Calls `onComplete` callback when TX reaches terminal state

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

### Transaction Flow (V2)

```
1. User clicks TransactionButton
   ↓
2. useSimpleTransaction validates params with Zod schema
   ↓
3. Fetch unsigned CBOR from gateway endpoint
   ↓
4. User signs transaction with wallet (Mesh SDK)
   ↓
5. Submit signed tx to blockchain
   ↓
6. Register TX with gateway (if requiresDBUpdate)
   ↓
7. useTxWatcher polls for confirmation status
   ↓
8. Gateway auto-updates DB when confirmed
   ↓
9. Display success state
```

### Gateway Transaction Endpoints

Transaction endpoints are accessed via the unified gateway proxy:
- **Method**: POST (all transaction endpoints)
- **Parameters**: Sent as JSON body
- **Response**: Unsigned CBOR (hex string)
- **Endpoint**: `/api/gateway/v2/tx/{category}/{role}/{transaction-name}`

Example endpoint paths:
- `/api/gateway/v2/tx/global/user/access-token/mint`
- `/api/gateway/v2/tx/course/student/assignment/commit`
- `/api/gateway/v2/tx/project/contributor/task/commit`

The `useTransaction` hook handles transaction building and submission via the gateway.

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

All 16 V2 transactions are implemented using the gateway auto-confirmation pattern. Each component uses `useSimpleTransaction` + `useTxWatcher` which:
- Validates params using Zod schemas from `~/config/transaction-schemas.ts`
- Registers TXs with gateway for automatic DB updates
- Provides consistent state management and error handling
- Displays gateway confirmation status (pending → confirmed → updated)

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
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task-commit.tsx` | project-contributor |
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
3. `useSimpleTransaction` validates params and fetches unsigned CBOR from gateway
4. User signs with wallet
5. Transaction submitted to blockchain
6. No gateway registration (pure on-chain TX with `requiresDBUpdate: false`)
7. Manual JWT handling updates user's alias and stores new JWT
8. Auth context refreshed

**Components**:
- `src/hooks/use-simple-transaction.ts` - Simplified transaction hook
- `src/components/transactions/transaction-button.tsx` - Reusable tx button
- `src/components/transactions/transaction-status.tsx` - Status display
- `src/components/transactions/mint-access-token.tsx` - Mint token UI

**Special Note**: This is a pure on-chain transaction (`requiresDBUpdate: false`). No gateway registration or polling needed - success is shown immediately after wallet submission.

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
4. `useSimpleTransaction` validates params and builds transaction
5. User signs with wallet, TX submitted to blockchain
6. TX registered with gateway for auto-confirmation
7. `useTxWatcher` polls until status is "updated"
8. Gateway auto-updates database with enrollment record

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

### Project Contributor Transactions (V2 Model)

**Status**: ✅ Active

The Project Contributor flow uses **only 3 transactions** for the entire lifecycle:

| Transaction | API Endpoint | Purpose |
|-------------|--------------|---------|
| **COMMIT** | `/v2/tx/project/contributor/task/commit` | Enroll + Claim Previous Rewards + Commit to New Task |
| **ACTION** | `/v2/tx/project/contributor/task/action` | Update Evidence OR Cancel Commitment |
| **CLAIM** | `/v2/tx/project/contributor/credential/claim` | Unenroll + Get Credential + Claim Final Rewards |

**Key Insight**: There is NO separate "enroll" transaction. COMMIT handles:
1. Enrolling the contributor (if not already enrolled)
2. Claiming rewards from previous approved task (if any)
3. Committing to a new task

**Reward Distribution**:
- Rewards are claimed automatically with COMMIT (continue contributing) or CLAIM (leave project)
- No separate "claim rewards" transaction needed

**Components**:
- `src/components/transactions/task-commit.tsx` - Enrollment AND subsequent commits (single component)
- `src/components/transactions/task-action.tsx` - Update evidence or cancel commitment
- `src/components/transactions/project-credential-claim.tsx` - Leave project and get credential

**Note**: `project-enroll.tsx` is **deprecated** - use `task-commit.tsx` for all commit scenarios.

**Reward Distribution**:
- **Continue contributing (COMMIT)**: Rewards from previous approved task claimed automatically, contributor stays enrolled
- **Leave project (CLAIM)**: Rewards claimed, contributor unenrolled, credential minted

**UI States**:
| State | Available Actions |
|-------|-------------------|
| Not enrolled | COMMIT ("Enroll & Commit") |
| Committed (pending review) | ACTION ("Update Evidence" or "Cancel") |
| Task approved | COMMIT (next task) or CLAIM (leave with credential) |

**Used In**:
- `/project/[projectid]/contributor` - Contributor dashboard

---

## Package Architecture

**T3 App Template** (this app):
- `useSimpleTransaction` hook - transaction lifecycle (build → sign → submit → register)
- `useTxWatcher` hook - gateway confirmation polling
- `~/config/transaction-ui.ts` - UI strings, endpoints, `requiresDBUpdate` flags
- `~/config/transaction-schemas.ts` - Zod validation schemas for params
- `TransactionButton`, `TransactionStatus` - UI components
- 16 transaction-specific components
- Hash utilities at `~/lib/utils/` (migrated from `@andamio/transactions`)

**`@andamio/transactions` Package** (local, deprecated):
- CBOR decoder utilities
- V1 transaction definitions (deprecated - used only by legacy components)

**Key Files**:
```typescript
// Transaction hooks (V2)
import { useSimpleTransaction } from "~/hooks/use-simple-transaction";
import { useTxWatcher } from "~/hooks/use-tx-watcher";

// Configuration
import { TRANSACTION_UI, TRANSACTION_ENDPOINTS } from "~/config/transaction-ui";
import { txSchemas, type TxParams } from "~/config/transaction-schemas";

// Hash utilities (local)
import { computeAssignmentInfoHash } from "~/lib/utils/assignment-info-hash";
import { computeSltHashDefinite } from "~/lib/utils/slt-hash";
import { computeTaskHash } from "~/lib/utils/task-hash";
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