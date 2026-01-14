# Transaction Auditor Skill

**Purpose**: Audit and maintain transaction definitions in `packages/andamio-transactions` against the authoritative Atlas TX API swagger specification.

## When to Use

- After Atlas TX API schema changes
- When adding new transaction definitions
- When debugging transaction failures (schema mismatches)
- Before releases to ensure schema alignment
- When prompted with `/transaction-auditor` or asked to audit transactions

## Data Sources

### Authoritative Source
- **Atlas TX API Swagger**: `https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json`

### Local Definitions
- **Package Location**: `packages/andamio-transactions/src/definitions/v2/`
- **Export Index**: `packages/andamio-transactions/src/definitions/v2/index.ts`

### Previous Audit Reports
- **Audit Report**: `.claude/skills/audit-api-coverage/tx-audit-report.md`

## V2 Transactions (16 total)

| Category | Count | Transactions |
|----------|-------|--------------|
| Global General | 1 | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` |
| Instance | 2 | `INSTANCE_COURSE_CREATE`, `INSTANCE_PROJECT_CREATE` |
| Course Owner | 1 | `COURSE_OWNER_TEACHERS_MANAGE` |
| Course Teacher | 2 | `COURSE_TEACHER_MODULES_MANAGE`, `COURSE_TEACHER_ASSIGNMENTS_ASSESS` |
| Course Student | 3 | `COURSE_STUDENT_ASSIGNMENT_COMMIT`, `COURSE_STUDENT_ASSIGNMENT_UPDATE`, `COURSE_STUDENT_CREDENTIAL_CLAIM` |
| Project Owner | 2 | `PROJECT_OWNER_MANAGERS_MANAGE`, `PROJECT_OWNER_BLACKLIST_MANAGE` |
| Project Manager | 2 | `PROJECT_MANAGER_TASKS_MANAGE`, `PROJECT_MANAGER_TASKS_ASSESS` |
| Project Contributor | 3 | `PROJECT_CONTRIBUTOR_TASK_COMMIT`, `PROJECT_CONTRIBUTOR_TASK_ACTION`, `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` |

## Audit Workflow

### Step 1: Fetch Swagger Schema

```bash
curl -s https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json | jq '.paths' > /tmp/swagger-paths.json
```

Or use WebFetch tool to retrieve and analyze the swagger.

### Step 2: Map Endpoints to Definitions

Each transaction definition specifies its endpoint in `buildTxConfig.builder.endpoint`:

| Definition | Endpoint |
|------------|----------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `/v2/tx/global/general/access-token/mint` |
| `INSTANCE_COURSE_CREATE` | `/v2/tx/instance/owner/course/create` |
| `INSTANCE_PROJECT_CREATE` | `/v2/tx/instance/owner/project/create` |
| `COURSE_OWNER_TEACHERS_MANAGE` | `/v2/tx/course/owner/teachers/manage` |
| `COURSE_TEACHER_MODULES_MANAGE` | `/v2/tx/course/teacher/modules/manage` |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `/v2/tx/course/teacher/assignments/assess` |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `/v2/tx/course/student/assignment/commit` |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `/v2/tx/course/student/assignment/update` |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `/v2/tx/course/student/credential/claim` |
| `PROJECT_OWNER_MANAGERS_MANAGE` | `/v2/tx/project/owner/managers/manage` |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | `/v2/tx/project/owner/blacklist/manage` |
| `PROJECT_MANAGER_TASKS_MANAGE` | `/v2/tx/project/manager/tasks/manage` |
| `PROJECT_MANAGER_TASKS_ASSESS` | `/v2/tx/project/manager/tasks/assess` |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `/v2/tx/project/contributor/task/commit` |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `/v2/tx/project/contributor/task/action` |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `/v2/tx/project/contributor/credential/claim` |

### Step 3: Compare Schemas

For each transaction definition, compare:

1. **Field Names**: Does `txParams` schema match swagger request body properties?
2. **Field Types**: Do Zod types match swagger types?
3. **Constraints**: Are `.min()`, `.max()`, `.length()` constraints correct?
4. **Required vs Optional**: Does optionality match?
5. **Enums**: Do `z.enum()` values match swagger enum definitions?

### Step 4: Identify Common Issues

Based on previous audits, watch for:

| Issue | Example | Fix |
|-------|---------|-----|
| Wrong field name | `task_hash` vs `alias` in task_decisions | Update field name |
| Missing max length | `ShortText140` fields need `.max(140)` | Add `.max(140)` |
| Wrong array item schema | `task_decisions: [{alias, outcome}]` not `[{task_hash, outcome}]` | Update schema |
| Missing optional fields | `initiator_data`, `fee_tier` | Add with `.optional()` |
| Extra fields not in swagger | `deposit_value` in project create | Verify or remove |

### Step 5: Update Definitions

When fixing issues:

1. **Read the definition file** first
2. **Update the Zod schema** in `buildTxConfig.txApiSchema` (via `createSchemas`)
3. **Update JSDoc comments** if the API contract changed
4. **Rebuild the package**: `cd packages/andamio-transactions && npm run build`
5. **Update the audit report** in `.claude/skills/audit-api-coverage/tx-audit-report.md`

## Swagger Type Reference

Common types in Atlas TX API swagger:

```typescript
// Alias: User's access token alias
type Alias = string; // 1-31 chars, pattern: ^[a-zA-Z0-9_]+$

// GYMintingPolicyId: Policy ID (NFT identifier)
type GYMintingPolicyId = string; // 56 char hex

// SltHash / TaskHash: Content hash
type SltHash = string; // 64 char hex, pattern: ^[a-fA-F0-9]{64}$

// ShortText140: Short text field
type ShortText140 = string; // Max 140 characters

// ListValue: ADA and native assets
type ListValue = Array<[string, number]>; // [asset_class, quantity] tuples

// AssignmentOutcome
type AssignmentOutcome = {
  alias: string;  // Student's alias
  outcome: "accept" | "refuse";
};

// ProjectOutcome
type ProjectOutcome = {
  alias: string;  // Contributor's alias
  outcome: "accept" | "refuse" | "deny";
};

// WalletData (for initiator_data)
type WalletData = {
  used_addresses: string[];  // GYAddressBech32[]
  change_address: string;    // GYAddressBech32
};
```

## Definition File Structure

Each definition file follows this pattern:

```typescript
import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "category.subcategory.action";
const txName = "TX_NAME" as const;

export const TX_NAME: AndamioTransactionDefinition = {
  txType: txName,
  role: "role-name",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["token-type"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - must match swagger request body
      txParams: z.object({
        field1: z.string().min(1).max(31),  // Alias
        field2: z.string().length(56),       // PolicyId
        // ... more fields
      }),
      // Side effect parameters - NOT sent to API
      sideEffectParams: z.object({
        // ... fields for onSubmit/onConfirmation
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/v2/tx/..." },
    estimatedCost: getProtocolCost(protocolId),
  },
  onSubmit: [...],
  onConfirmation: [...],
  ui: {...},
  docs: {...},
};
```

## Audit Report Format

After completing an audit, update `.claude/skills/audit-api-coverage/tx-audit-report.md`:

```markdown
## Summary

| Status | Count | Transactions |
|--------|-------|--------------|
| Match | N | List... |
| Minor Issues | N | List... |
| Critical Mismatch | N | List... |

### Fixes Applied

1. **TX_NAME** - Description of fix

### Detailed Results

#### Category (N transactions)

| Tx | Status | Issues |
|----|--------|--------|
| TX_NAME | / / | Description |
```

## Integration with Other Skills

- **audit-api-coverage**: Shares the `tx-audit-report.md` output
- **documentarian**: Updates BACKLOG.md when suggesting this skill
- **review-pr**: Delegates to this skill for transaction-related changes

## Quick Commands

```bash
# Build transactions package after changes
cd packages/andamio-transactions && npm run build

# Type check
cd packages/andamio-transactions && npm run type-check

# Run tests
cd packages/andamio-transactions && npm test
```
