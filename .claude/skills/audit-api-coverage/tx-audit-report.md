# Transaction API Audit Report

> **Generated**: January 14, 2026
> **Swagger Source**: `https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json`
> **Total Transactions Audited**: 16
> **Last Updated**: January 14, 2026 (fixes applied)

## Summary

| Status | Count | Transactions |
|--------|-------|-------------|
| ✅ Match | 12 | All course transactions, most project transactions |
| ⚠️ Minor Issues | 4 | Missing optional `initiator_data` in some project txs (acceptable per user) |
| ❌ Critical Mismatch | 0 | All critical issues resolved |

### Fixes Applied This Session

1. ✅ **PROJECT_MANAGER_TASKS_ASSESS** - Changed `task_decisions` from `{task_hash, outcome}` to `{alias, outcome}`
2. ✅ **COURSE_STUDENT_ASSIGNMENT_COMMIT** - Added `.max(140)` to `assignment_info`
3. ✅ **COURSE_STUDENT_ASSIGNMENT_UPDATE** - Added `.max(140)` to `assignment_info`
4. ✅ **PROJECT_CONTRIBUTOR_TASK_COMMIT** - Added `.max(140)` to `task_info`
5. ✅ **PROJECT_CONTRIBUTOR_TASK_ACTION** - Added `.max(140)` to `project_info`

### Clarifications from User

- `initiator_data` is correctly a simple address string (not WalletData object) - our implementation is correct
- Missing `initiator_data` in project transactions is acceptable (optional field)

---

## Resolved Issues

### 1. ✅ GLOBAL_ACCESS_TOKEN_MINT - `initiator_data` Type

**Status**: ✅ Resolved (no change needed)

Per user clarification, `initiator_data` is correctly a simple address string. The swagger's `WalletData` object definition may be outdated or the API accepts both formats. Our implementation is correct.

---

### 2. ✅ PROJECT_MANAGER_TASKS_ASSESS - `task_decisions` Schema

**Status**: ✅ Fixed

**Was**:
```typescript
task_decisions: z.array(z.object({
  task_hash: z.string().length(64),  // WRONG
  outcome: z.enum(["accept", "refuse", "deny"]),
}))
```

**Now**:
```typescript
task_decisions: z.array(z.object({
  alias: z.string().min(1).max(31),  // Contributor's alias (correct)
  outcome: z.enum(["accept", "refuse", "deny"]),
}))
```

---

## Missing Optional Fields

### `initiator_data` Missing From:

| Transaction | Has initiator_data? |
|-------------|---------------------|
| GLOBAL_ACCESS_TOKEN_MINT | ⚠️ Wrong type (string vs object) |
| INSTANCE_COURSE_CREATE | ✅ Yes |
| INSTANCE_PROJECT_CREATE | ✅ Yes |
| COURSE_ADMIN_TEACHERS_MANAGE | ✅ Yes |
| COURSE_TEACHER_MODULES_MANAGE | ✅ Yes |
| COURSE_STUDENT_ASSIGNMENT_COMMIT | ✅ Yes |
| COURSE_STUDENT_ASSIGNMENT_UPDATE | ✅ Yes |
| COURSE_TEACHER_ASSIGNMENTS_ASSESS | ✅ Yes |
| COURSE_STUDENT_CREDENTIAL_CLAIM | ✅ Yes |
| PROJECT_OWNER_MANAGERS_MANAGE | ❌ Missing |
| PROJECT_OWNER_BLACKLIST_MANAGE | ❌ Missing |
| PROJECT_MANAGER_TASKS_MANAGE | ❌ Missing |
| PROJECT_MANAGER_TASKS_ASSESS | ❌ Missing |
| PROJECT_CONTRIBUTOR_TASK_COMMIT | ❌ Missing |
| PROJECT_CONTRIBUTOR_TASK_ACTION | ❌ Missing |
| PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM | ❌ Missing |

### `fee_tier` Missing From:
- PROJECT_CONTRIBUTOR_TASK_COMMIT (optional in swagger)
- PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM (optional in swagger)

---

## ✅ ShortText140 Max Length - Fixed

The swagger defines `ShortText140` as max 140 characters. All fields now have proper validation:

| Transaction | Field | Validation |
|-------------|-------|------------|
| COURSE_STUDENT_ASSIGNMENT_COMMIT | `assignment_info` | ✅ `z.string().min(1).max(140)` |
| COURSE_STUDENT_ASSIGNMENT_UPDATE | `assignment_info` | ✅ `z.string().min(1).max(140)` |
| PROJECT_CONTRIBUTOR_TASK_COMMIT | `task_info` | ✅ `z.string().max(140)` |
| PROJECT_CONTRIBUTOR_TASK_ACTION | `project_info` | ✅ `z.string().max(140).optional()` |

---

## Extra Fields in Our Definitions

### INSTANCE_PROJECT_CREATE

**Our definition includes**:
```typescript
deposit_value: z.array(z.tuple([z.string(), z.number()]))
```

**Swagger `CreateProjectTxRequest` does NOT include `deposit_value`** in required or optional fields.

This may indicate swagger is out of date, or we're including an extra field.

---

## Detailed Audit Results

### Global System (1)

| Tx | Status | Issues |
|----|--------|--------|
| GLOBAL_ACCESS_TOKEN_MINT | ✅ | `initiator_data` as string is correct |

### Instance System (2)

| Tx | Status | Issues |
|----|--------|--------|
| INSTANCE_COURSE_CREATE | ✅ | Matches swagger |
| INSTANCE_PROJECT_CREATE | ⚠️ | Has `deposit_value` not in swagger (may be swagger outdated) |

### Course Management (6)

| Tx | Status | Issues |
|----|--------|--------|
| COURSE_ADMIN_TEACHERS_MANAGE | ✅ | Matches swagger |
| COURSE_TEACHER_MODULES_MANAGE | ✅ | Matches swagger |
| COURSE_STUDENT_ASSIGNMENT_COMMIT | ✅ | Fixed - `.max(140)` added |
| COURSE_STUDENT_ASSIGNMENT_UPDATE | ✅ | Fixed - `.max(140)` added |
| COURSE_TEACHER_ASSIGNMENTS_ASSESS | ✅ | Matches swagger |
| COURSE_STUDENT_CREDENTIAL_CLAIM | ✅ | Matches swagger |

### Project Management (7)

| Tx | Status | Issues |
|----|--------|--------|
| PROJECT_ADMIN_MANAGERS_MANAGE | ✅ | Optional `initiator_data` not required |
| PROJECT_ADMIN_BLACKLIST_MANAGE | ✅ | Optional `initiator_data` not required |
| PROJECT_MANAGER_TASKS_MANAGE | ✅ | Optional `initiator_data` not required |
| PROJECT_MANAGER_TASKS_ASSESS | ✅ | Fixed - `task_decisions` now uses `alias` |
| PROJECT_CONTRIBUTOR_TASK_COMMIT | ✅ | Fixed - `.max(140)` added to `task_info` |
| PROJECT_CONTRIBUTOR_TASK_ACTION | ✅ | Fixed - `.max(140)` added to `project_info` |
| PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM | ✅ | Optional fields not required |

---

## Recommended Fixes

### ✅ Completed

1. ✅ **PROJECT_MANAGER_TASKS_ASSESS**: Fixed - changed `task_hash` to `alias` in `task_decisions`
2. ✅ **GLOBAL_ACCESS_TOKEN_MINT**: No change needed - `initiator_data` as string is correct
3. ✅ **ShortText140 fields**: Added `.max(140)` to all affected fields

### Optional (Low Priority)

4. ⏳ Add `initiator_data` optional field to project transaction definitions (optional, not blocking)
5. ⏳ Add `fee_tier` optional field to TASK_COMMIT and CREDENTIAL_CLAIM (optional)
6. ⏳ **INSTANCE_PROJECT_CREATE**: Verify if `deposit_value` is needed (may be swagger out of date)

---

## Appendix: Swagger Type Definitions

### WalletData
```typescript
{
  used_addresses: GYAddressBech32[];  // Array of bech32 addresses
  change_address: GYAddressBech32;    // Single bech32 address
}
```

### Alias
```typescript
string  // 1-31 chars, alphanumeric + underscore, pattern: ^[a-zA-Z0-9_]+$
```

### GYMintingPolicyId
```typescript
string  // 56-char hex string
```

### SltHash / TaskHash
```typescript
string  // 64-char hex string, pattern: ^[a-fA-F0-9]{64}$
```

### ShortText140
```typescript
string  // Max 140 characters
```

### ListValue
```typescript
Array<[string, number]>  // [asset_class, quantity] tuples
```

### ProjectData
```typescript
{
  project_content: ShortText140;  // Task description text
  expiration_time: number;        // Unix timestamp in milliseconds
  lovelace_amount: number;
  native_assets: ListValue;
}
```

### ProjectOutcome
```typescript
{
  alias: Alias;                           // Contributor's alias
  outcome: "accept" | "refuse" | "deny";
}
```

### AssignmentOutcome
```typescript
{
  alias: Alias;                    // Student's alias
  outcome: "accept" | "refuse";
}
```

---

*Last Updated: January 14, 2026*
