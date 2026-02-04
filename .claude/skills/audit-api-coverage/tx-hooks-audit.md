# TX Hooks Audit

Audit `src/hooks/tx/` and transaction config files for consistency.

## Goal

Ensure the transaction system is consistent across all config and hook files:
1. Every `TransactionType` has entries in all required files
2. TX_TYPE_MAP correctly maps frontend types to gateway types
3. Schemas match the gateway API spec
4. Register flow is documented and followed

## TX System Architecture

```
┌───────────────────────────────────────────────────────────────────────────┐
│                         Transaction Lifecycle                              │
├───────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  1. BUILD        2. SIGN         3. SUBMIT       4. REGISTER    5. POLL  │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐ │
│  │ Gateway │    │ Wallet  │    │ Wallet  │    │ Gateway │    │ Gateway │ │
│  │ API     │───►│ Sign    │───►│ Submit  │───►│ /tx/    │───►│ /tx/    │ │
│  │ /tx/*   │    │         │    │         │    │ register│    │ status  │ │
│  └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘ │
│                                                                           │
│  Config:         Hook:          Hook:          Hook:          Hook:      │
│  transaction-    use-           use-           use-           use-       │
│  schemas.ts      transaction.ts transaction.ts tx-watcher.ts  tx-watcher │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose | Exports |
|------|---------|---------|
| `src/config/transaction-ui.ts` | UI strings and endpoints | `TransactionType`, `TRANSACTION_UI`, `TRANSACTION_ENDPOINTS` |
| `src/config/transaction-schemas.ts` | Zod validation schemas | `txSchemas`, `TxParams` |
| `src/hooks/tx/use-tx-watcher.ts` | TX registration and polling | `TX_TYPE_MAP`, `useTxWatcher`, `registerTransaction` |
| `src/hooks/tx/use-transaction.ts` | Main transaction execution | `useTransaction` |
| `src/hooks/tx/use-pending-tx-watcher.ts` | Watch all pending TXs | `usePendingTxWatcher` |
| `src/hooks/tx/use-tx-stream.ts` | SSE-based real-time TX tracking | `useTxStream` |

## Audit Checklist

### TransactionType Consistency

Every `TransactionType` must have an entry in:

| TransactionType | UI Config | Endpoint | Schema | TX_TYPE_MAP |
|-----------------|-----------|----------|--------|-------------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | ✅ | ✅ | ✅ | ✅ |
| `INSTANCE_COURSE_CREATE` | ✅ | ✅ | ✅ | ✅ |
| `INSTANCE_PROJECT_CREATE` | ✅ | ✅ | ✅ | ✅ |
| `COURSE_OWNER_TEACHERS_MANAGE` | ✅ | ✅ | ✅ | ✅ |
| `COURSE_TEACHER_MODULES_MANAGE` | ✅ | ✅ | ✅ | ✅ |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | ✅ | ✅ | ✅ | ✅ |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | ✅ | ✅ | ✅ | ✅ |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | ✅ | ✅ | ✅ | ✅ |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_OWNER_MANAGERS_MANAGE` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_MANAGER_TASKS_MANAGE` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_MANAGER_TASKS_ASSESS` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | ✅ | ✅ | ✅ | ✅ |
| `PROJECT_USER_TREASURY_ADD_FUNDS` | ✅ | ✅ | ✅ | ✅ |

### TX_TYPE_MAP Verification

The `TX_TYPE_MAP` in `use-tx-watcher.ts` must map each frontend `TransactionType` to the correct gateway `tx_type`:

| Frontend Type | Gateway Type | Notes |
|---------------|--------------|-------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `access_token_mint` | ✅ |
| `INSTANCE_COURSE_CREATE` | `course_create` | ✅ |
| `INSTANCE_PROJECT_CREATE` | `project_create` | ✅ |
| `COURSE_OWNER_TEACHERS_MANAGE` | `teachers_update` | ✅ |
| `COURSE_TEACHER_MODULES_MANAGE` | `modules_manage` | ✅ |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `assessment_assess` | ✅ |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `assignment_submit` | ✅ |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `assignment_submit` | Same as commit |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `credential_claim` | ✅ |
| `PROJECT_OWNER_MANAGERS_MANAGE` | `managers_manage` | ✅ |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | `blacklist_update` | ✅ |
| `PROJECT_MANAGER_TASKS_MANAGE` | `tasks_manage` | ✅ |
| `PROJECT_MANAGER_TASKS_ASSESS` | `task_assess` | ✅ |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `project_join` | ✅ |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `task_submit` | ✅ |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `project_credential_claim` | ✅ |
| `PROJECT_USER_TREASURY_ADD_FUNDS` | `treasury_fund` | ✅ |

### Schema Validation

Each schema in `transaction-schemas.ts` must:

| Check | Description |
|-------|-------------|
| ☐ Match API spec | Field names match gateway request body |
| ☐ Required fields present | alias, initiator_data, entity IDs |
| ☐ Proper Zod types | policyIdSchema (56 chars), hashSchema (64 chars) |
| ☐ walletDataSchema for multi-addr | used_addresses + change_address |

### Register Flow

After `wallet.submitTx()`, the app must:

1. **Call `registerTransaction()`** with:
   - `txHash` from submit result
   - `txType` mapped via `getGatewayTxType()`
   - `jwt` from auth context
   - Optional `metadata` for off-chain data

2. **Start polling** with `useTxWatcher(txHash)`

3. **Handle terminal states**:
   - `confirmed` or `updated`: Success, invalidate caches
   - `failed` or `expired`: Show error

## Register Request Details

The register endpoint is critical for the gateway to track transactions:

```typescript
// POST /api/v2/tx/register
interface TxRegisterRequest {
  tx_hash: string;      // Transaction hash from wallet
  tx_type: string;      // Gateway tx_type (e.g., "course_create")
  metadata?: Record<string, string>;  // Optional off-chain data
}
```

**When to register:**
- Always register TXs where `requiresDBUpdate: true` (see `TRANSACTION_UI`)
- Skip registration for `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` (pure on-chain)

**Metadata examples:**
```typescript
// Course creation
metadata: { course_title: "My Course" }

// Assignment submission
metadata: { course_id: "abc123", module_code: "101" }
```

## Interactive Audit Process

When running this audit, I will:

1. **Read all config files** and extract defined types
2. **Cross-reference** to ensure consistency
3. **Check gateway API spec** for schema accuracy
4. **Report mismatches** with specific locations
5. **Ask before fixing**:
   - "TX_TYPE_MAP missing entry for X. Add it?"
   - "Schema for Y doesn't match API spec. Update?"

## Common Issues

### Issue: Missing TX_TYPE_MAP Entry

**Symptom**: Transaction submits but gateway returns 400 on register

**Fix**: Add mapping to `TX_TYPE_MAP`:
```typescript
// In use-tx-watcher.ts
export const TX_TYPE_MAP: Record<string, GatewayTxType> = {
  // ... existing entries
  NEW_TRANSACTION_TYPE: "gateway_type_name",
};
```

### Issue: Schema Mismatch

**Symptom**: Validation fails before submit, or gateway rejects request

**Fix**: Update schema in `transaction-schemas.ts` to match API spec

### Issue: Missing Registration

**Symptom**: Transaction confirms on-chain but DB not updated

**Fix**: Ensure `registerTransaction()` is called after `submitTx()`

## Sync with Gateway API

When the gateway API publishes breaking changes, use the **transaction-auditor** skill for the full sync workflow:

```
Run /transaction-auditor
```

See [transaction-auditor SKILL.md](../transaction-auditor/SKILL.md) for:
- Step-by-step sync workflow
- Commands to fetch and compare API spec
- Common schema patterns
- Changelog integration

### Quick Sync Commands

```bash
# Fetch latest spec
curl -s https://dev.api.andamio.io/api/v1/docs/doc.json > /tmp/spec.json

# Get TX request schemas
cat /tmp/spec.json | jq '[.definitions | to_entries[] | select(.key | contains("TxRequest"))]'

# Get valid tx_type enum values
cat /tmp/spec.json | jq '.definitions["tx_state_handlers.RegisterPendingTxRequest"].properties.tx_type.enum'

# Regenerate types
npm run generate:types

# Type check
npm run typecheck
```

---

**Last Updated**: January 24, 2026
