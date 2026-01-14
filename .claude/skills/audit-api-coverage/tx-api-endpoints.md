# Andamio Tx API Endpoints

> **Base URL**: `https://atlas-api-preprod-507341199760.us-central1.run.app`
> **Docs**: [/swagger.json](https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json)
> **Total Endpoints**: 16

## Summary by Category

| Category | Count | Description |
|----------|-------|-------------|
| Global | 1 | Access token minting |
| Instance | 2 | Course and project creation |
| Course | 6 | Teachers, modules, assignments, credentials |
| Project | 7 | Managers, blacklist, tasks, credentials |

## Purpose

The Tx API builds **unsigned transaction CBOR** for Cardano blockchain operations. The T3 App:
1. Calls Tx API with transaction parameters
2. Receives unsigned CBOR
3. Signs with user's wallet (Mesh SDK)
4. Submits to blockchain

## Transaction Definitions

Transactions are defined in `@andamio/transactions` package. Each definition specifies:
- `buildTxConfig.builderEndpoint` - The Tx API endpoint path
- `buildTxConfig.inputSchema` - Zod schema for request validation
- `onSubmit` / `onConfirmation` - Side effect API calls

---

## Global System (1)

| Method | Path | Transaction Definition |
|--------|------|------------------------|
| POST | `/v2/tx/global/general/access-token/mint` | `GLOBAL_ACCESS_TOKEN_MINT` |

**Purpose**: Mint a new Andamio access token for any user

## Instance System (2)

| Method | Path | Transaction Definition |
|--------|------|------------------------|
| POST | `/v2/tx/instance/owner/course/create` | `COURSE_ADMIN_CREATE` |
| POST | `/v2/tx/instance/owner/project/create` | `PROJECT_ADMIN_CREATE` |

**Purpose**: Initialize new courses and projects on-chain

## Course Management (6)

| Method | Path | Transaction Definition |
|--------|------|------------------------|
| POST | `/v2/tx/course/owner/teachers/manage` | `COURSE_ADMIN_TEACHERS_MANAGE` |
| POST | `/v2/tx/course/teacher/modules/manage` | `COURSE_TEACHER_MODULES_MANAGE` |
| POST | `/v2/tx/course/teacher/assignments/assess` | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` |
| POST | `/v2/tx/course/student/assignment/commit` | `COURSE_STUDENT_ASSIGNMENT_COMMIT` |
| POST | `/v2/tx/course/student/assignment/update` | `COURSE_STUDENT_ASSIGNMENT_UPDATE` |
| POST | `/v2/tx/course/student/credential/claim` | `COURSE_STUDENT_CREDENTIAL_CLAIM` |

**Purpose**: All course-related on-chain operations

## Project Management (7)

| Method | Path | Transaction Definition |
|--------|------|------------------------|
| POST | `/v2/tx/project/owner/managers/manage` | `PROJECT_ADMIN_MANAGERS_MANAGE` |
| POST | `/v2/tx/project/owner/contributor-blacklist/manage` | `PROJECT_ADMIN_BLACKLIST_MANAGE` |
| POST | `/v2/tx/project/manager/tasks/manage` | `PROJECT_MANAGER_TASKS_MANAGE` |
| POST | `/v2/tx/project/manager/tasks/assess` | `PROJECT_MANAGER_TASKS_ASSESS` |
| POST | `/v2/tx/project/contributor/task/commit` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` |
| POST | `/v2/tx/project/contributor/task/action` | `PROJECT_CONTRIBUTOR_TASK_ACTION` |
| POST | `/v2/tx/project/contributor/credential/claim` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` |

**Purpose**: All project-related on-chain operations

---

## Integration Pattern

```typescript
import { getTransactionDefinition } from "@andamio/transactions";

// Get transaction definition
const txDef = getTransactionDefinition("COURSE_STUDENT_ASSIGNMENT_COMMIT");

// Build transaction
const response = await fetch(
  `${ATLAS_TX_API_URL}${txDef.buildTxConfig.builderEndpoint}`,
  {
    method: "POST",
    body: JSON.stringify(txInput),
  }
);

// Sign and submit with wallet
const unsignedCbor = await response.json();
const signedCbor = await wallet.signTx(unsignedCbor);
const txHash = await wallet.submitTx(signedCbor);

// Execute side effects
await executeSideEffects(txDef.onSubmit, txHash, context);
```

---

*Last Updated: January 14, 2026*
