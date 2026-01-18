# Transaction State Machine

The gateway provides dedicated endpoints for tracking pending transactions with automatic confirmation handling.

## TX State Machine Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/tx/register` | POST | Register TX after wallet submit |
| `/api/v2/tx/status/:tx_hash` | GET | Poll individual TX status |
| `/api/v2/tx/pending` | GET | Get all user's pending TXs |
| `/api/v2/tx/types` | GET | List valid TX types |

## TX States

```
pending → confirmed → updated   (success path)
pending → failed                (error after retries)
pending → expired               (exceeded TTL without confirmation)
```

### State Definitions

| State | Description |
|-------|-------------|
| `pending` | TX submitted to blockchain, awaiting confirmation |
| `confirmed` | TX confirmed on-chain, gateway processing DB updates |
| `updated` | DB updates complete, TX fully processed (terminal) |
| `failed` | TX failed after max retries (terminal) |
| `expired` | TX exceeded TTL without confirmation (terminal) |

## API Response Types

### TxStatus Response

```typescript
interface TxStatus {
  tx_hash: string;
  tx_type: string;
  state: 'pending' | 'confirmed' | 'updated' | 'failed' | 'expired';
  confirmed_at?: string;
  retry_count: number;
  last_error?: string;
}
```

### Register Request

```typescript
interface TxRegisterRequest {
  tx_hash: string;
  tx_type: string;
  metadata?: Record<string, string>; // Off-chain data (e.g., course title)
}
```

## Full Transaction Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌─────────┐
│  BUILD  │ → │  SIGN   │ → │ SUBMIT  │ → │ REGISTER │ → │  POLL   │
└─────────┘    └─────────┘    └─────────┘    └──────────┘    └─────────┘
     │              │              │              │              │
     │              │              │              │              ▼
  POST to       wallet.        wallet.       POST to       GET status
  /tx/*         signTx()      submitTx()    /tx/register   until terminal
```

1. **BUILD**: POST to `/api/v2/tx/*` endpoint → get unsigned CBOR
2. **SIGN**: User signs with wallet (`wallet.signTx(cbor, true)`)
3. **SUBMIT**: Submit to blockchain (`wallet.submitTx(signed)`) → get txHash
4. **REGISTER**: POST to `/api/v2/tx/register` with txHash and txType
5. **POLL**: GET `/api/v2/tx/status/:txHash` every 10 seconds until terminal state

## Key Implementation Notes

1. **Register immediately after submit** - Call `/tx/register` right after `wallet.submitTx()` returns
2. **Poll interval** - Check status every ~10 seconds
3. **Terminal states** - Stop polling when state is `updated`, `failed`, or `expired`
4. **Metadata required** - Instance creation TXs (course/project) need metadata for DB fields

## TX Type Mapping

| TransactionType | tx_type for Register |
|-----------------|---------------------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `access_token_mint` |
| `INSTANCE_COURSE_CREATE` | `course_create` |
| `INSTANCE_PROJECT_CREATE` | `project_create` |
| `COURSE_OWNER_TEACHERS_MANAGE` | `course_teachers_manage` |
| `COURSE_TEACHER_MODULES_MANAGE` | `course_modules_manage` |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `course_assignments_assess` |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `course_assignment_commit` |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `course_assignment_update` |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `course_credential_claim` |
| `PROJECT_OWNER_MANAGERS_MANAGE` | `project_managers_manage` |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | `project_blacklist_manage` |
| `PROJECT_MANAGER_TASKS_MANAGE` | `project_tasks_manage` |
| `PROJECT_MANAGER_TASKS_ASSESS` | `project_tasks_assess` |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `project_task_commit` |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `project_task_action` |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project_credential_claim` |
| `PROJECT_USER_TREASURY_ADD_FUNDS` | `project_treasury_add_funds` |

## See Also

- `~/hooks/use-simple-transaction.ts` - Transaction execution hook
- `~/hooks/use-tx-watcher.ts` - TX status polling hook
- `~/config/transaction-ui.ts` - TX types and endpoints
