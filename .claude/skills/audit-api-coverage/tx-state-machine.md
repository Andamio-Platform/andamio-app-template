# Transaction State Machine

The gateway provides dedicated endpoints for tracking pending transactions with automatic confirmation handling.

## TX State Machine Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v2/tx/register` | POST | Register TX after wallet submit |
| `/api/v2/tx/status/{tx_hash}` | GET | Poll individual TX status |
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

| TransactionType | Gateway tx_type |
|-----------------|-----------------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `access_token_mint` |
| `INSTANCE_COURSE_CREATE` | `course_create` |
| `INSTANCE_PROJECT_CREATE` | `project_create` |
| `COURSE_OWNER_TEACHERS_MANAGE` | `teachers_update` |
| `COURSE_TEACHER_MODULES_MANAGE` | `modules_manage` |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assessment_assess` |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `assignment_submit` |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment_submit` |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential_claim` |
| `PROJECT_OWNER_MANAGERS_MANAGE` | `project_join` |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist_update` |
| `PROJECT_MANAGER_TASKS_MANAGE` | `tasks_manage` |
| `PROJECT_MANAGER_TASKS_ASSESS` | `task_assess` |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `task_submit` |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task_submit` |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project_credential_claim` |
| `PROJECT_USER_TREASURY_ADD_FUNDS` | `treasury_fund` |

**Valid Gateway tx_type values** (from API spec):
```
course_create, course_enroll, modules_manage, teachers_update,
assignment_submit, assessment_assess, credential_claim,
project_create, project_join, tasks_manage, task_submit, task_assess,
project_credential_claim, blacklist_update, treasury_fund, access_token_mint
```

## See Also

- `~/hooks/use-simple-transaction.ts` - Transaction execution hook
- `~/hooks/use-tx-watcher.ts` - TX status polling hook
- `~/config/transaction-ui.ts` - TX types and endpoints
