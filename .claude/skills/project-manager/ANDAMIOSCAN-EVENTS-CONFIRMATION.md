# Andamioscan Events API for Transaction Confirmation

> **Created**: January 15, 2026
> **Status**: Active Pattern
> **First Implementation**: `PROJECT_CONTRIBUTOR_TASK_ACTION`

## Overview

The Andamioscan Events API provides transaction-specific confirmation endpoints that replace the generic Koios-based polling approach. Each Andamio transaction type has a dedicated event endpoint that returns structured data when the transaction is confirmed on-chain.

## Why Use Events API Instead of Koios Polling

| Aspect | Koios Polling | Andamioscan Events |
|--------|--------------|-------------------|
| **Specificity** | Generic tx status | Andamio-specific data |
| **Data Returned** | Just confirmation | Full event context (alias, IDs, etc.) |
| **Reliability** | Sometimes misses txs | Purpose-built for Andamio |
| **Latency** | Depends on poll interval | Near real-time when indexed |
| **API Calls** | Multiple polls needed | Single call when ready |

## Event Endpoints Reference

All endpoints follow the pattern: `GET /api/v2/events/{category}/{action}/{tx_hash}`

### Global Events

| Transaction | Event Endpoint | Response Model |
|-------------|----------------|----------------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | `/events/access-tokens/mint/{tx_hash}` | `UserAccessTokenMintResponse` |

### Course Events

| Transaction | Event Endpoint | Response Model |
|-------------|----------------|----------------|
| `INSTANCE_COURSE_CREATE` | `/events/courses/create/{tx_hash}` | `AdminCourseCreateResponse` |
| `COURSE_OWNER_TEACHERS_MANAGE` | `/events/teachers/update/{tx_hash}` | `AdminCourseTeachersUpdateResponse` |
| `COURSE_TEACHER_MODULES_MANAGE` | `/events/modules/manage/{tx_hash}` | `TeacherCourseModulesManageResponse` |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | `/events/assessments/assess/{tx_hash}` | `TeacherCourseAssignmentsAssessResponse` |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | `/events/enrollments/enroll/{tx_hash}` | `StudentCourseEnrollResponse` |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | `/events/assignments/submit/{tx_hash}` | `StudentCourseAssignmentSubmitResponse` |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | `/events/credential-claims/claim/{tx_hash}` | `StudentCourseCredentialClaimResponse` |

### Project Events

| Transaction | Event Endpoint | Response Model |
|-------------|----------------|----------------|
| `INSTANCE_PROJECT_CREATE` | `/events/projects/create/{tx_hash}` | `AdminProjectCreateResponse` |
| `PROJECT_MANAGER_TASKS_MANAGE` | `/events/tasks/manage/{tx_hash}` | `ManagerProjectTasksManageResponse` |
| `PROJECT_MANAGER_TASKS_ASSESS` | `/events/tasks/assess/{tx_hash}` | `ManagerProjectAssessTaskResponse` |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | `/events/projects/join/{tx_hash}` | `ContributorProjectJoinResponse` |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | `/events/tasks/submit/{tx_hash}` | `ContributorProjectSubmitTaskResponse` |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | `/events/credential-claims/project/{tx_hash}` | `ContributorProjectCredentialClaimResponse` |

### Additional Events

| Event | Endpoint | Response Model |
|-------|----------|----------------|
| Fund Treasury | `/events/treasury/fund/{tx_hash}` | `ManagerProjectFundTreasuryResponse` |

## Implementation Pattern

### 1. Add Event Type to andamioscan.ts

```typescript
// Response type from YAML definitions
export type AndamioscanTaskSubmitEvent = {
  tx_hash: string;
  slot: number;
  alias: string;
  project_id: string;
  task: AndamioscanTask;
  content: string;
};

// Fetch function
export async function getTaskSubmitEvent(
  txHash: string
): Promise<AndamioscanTaskSubmitEvent | null> {
  try {
    return await fetchAndamioscan<AndamioscanTaskSubmitEvent>(
      `/v2/events/tasks/submit/${txHash}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null; // Not confirmed yet
    }
    throw error;
  }
}
```

### 2. Poll Until Confirmed

```typescript
export async function waitForTaskSubmitConfirmation(
  txHash: string,
  maxAttempts = 30,
  intervalMs = 2000
): Promise<AndamioscanTaskSubmitEvent | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const event = await getTaskSubmitEvent(txHash);
    if (event) {
      return event;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  return null; // Timeout
}
```

### 3. Use in Transaction Side Effects

```typescript
// In onConfirmation side effect
const event = await waitForTaskSubmitConfirmation(txHash);
if (event) {
  // Transaction confirmed - execute DB side effects
  await confirmCommitment(event.task.task_id, txHash);
}
```

## Transaction Type to Event Mapping

This mapping is used to determine which event endpoint to poll for each transaction type:

```typescript
const TX_TO_EVENT_MAP: Record<string, string> = {
  // Global
  "GLOBAL_GENERAL_ACCESS_TOKEN_MINT": "/events/access-tokens/mint",

  // Course
  "INSTANCE_COURSE_CREATE": "/events/courses/create",
  "COURSE_OWNER_TEACHERS_MANAGE": "/events/teachers/update",
  "COURSE_TEACHER_MODULES_MANAGE": "/events/modules/manage",
  "COURSE_TEACHER_ASSIGNMENTS_ASSESS": "/events/assessments/assess",
  "COURSE_STUDENT_ASSIGNMENT_COMMIT": "/events/enrollments/enroll",
  "COURSE_STUDENT_ASSIGNMENT_UPDATE": "/events/assignments/submit",
  "COURSE_STUDENT_CREDENTIAL_CLAIM": "/events/credential-claims/claim",

  // Project
  "INSTANCE_PROJECT_CREATE": "/events/projects/create",
  "PROJECT_MANAGER_TASKS_MANAGE": "/events/tasks/manage",
  "PROJECT_MANAGER_TASKS_ASSESS": "/events/tasks/assess",
  "PROJECT_CONTRIBUTOR_TASK_COMMIT": "/events/projects/join",
  "PROJECT_CONTRIBUTOR_TASK_ACTION": "/events/tasks/submit",
  "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM": "/events/credential-claims/project",
};
```

## Response Data Usage

The event response provides rich context that can be used in side effects:

```typescript
// Example: Task Submit Event Response
{
  "tx_hash": "7aafcc755f157c23...",
  "slot": 112798441,
  "alias": "student_002",
  "project_id": "37dd2fdb31584ced...",
  "task": {
    "task_id": "cb8bf02cf3873afe...",
    "content": "4578616d706c65...",
    "lovelace": 15000000,
    ...
  },
  "content": "33373537633665..." // Evidence hash (hex)
}
```

This data can:
- Verify the transaction was for the expected user (`alias`)
- Extract on-chain identifiers (`task_id`, `project_id`)
- Access the evidence hash for validation
- Get the slot number for ordering/timestamps

## Error Handling

```typescript
// 404 = Transaction not yet indexed (keep polling)
// 200 = Transaction confirmed (proceed with side effects)
// 5xx = Andamioscan issue (retry with backoff)

async function getEventWithRetry(
  txHash: string,
  eventPath: string,
  maxRetries = 3
): Promise<unknown | null> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetchAndamioscan(`${eventPath}/${txHash}`);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("404")) {
          return null; // Not confirmed yet - expected
        }
        if (error.message.includes("5")) {
          // Server error - retry with backoff
          await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
          continue;
        }
      }
      throw error;
    }
  }
  return null;
}
```

## Testing

Test any event endpoint with curl:

```bash
curl https://preprod.andamioscan.io/api/v2/events/tasks/submit/{TX_HASH}
```

Expected response when confirmed:
```json
{
  "tx_hash": "...",
  "slot": 112798441,
  "alias": "student_002",
  ...
}
```

Expected response when not yet confirmed:
```
404 page not found
```

## Migration from PendingTxWatcher

The existing `PendingTxWatcher` component uses Koios to poll for transaction confirmation. To migrate to Andamioscan Events:

1. **Keep PendingTxWatcher for UI feedback** - Shows user that tx is pending
2. **Use Events API for side effects** - More reliable for DB updates
3. **Deprecate Koios-based confirmation** - Over time, shift all confirmation logic to Events API

## Files to Update When Adding New Event Support

1. `src/lib/andamioscan.ts` - Add type and fetch function
2. `src/lib/andamioscan-events.ts` - Add to polling utilities (new file)
3. Transaction definition's `onConfirmation` - Use event-based confirmation
4. This document - Update mapping table

## Related Documentation

- `.claude/skills/audit-api-coverage/andamioscan-api-doc.yaml` - Full API spec
- `.claude/skills/project-manager/CONTRIBUTOR-TRANSACTION-MODEL.md` - Contributor tx flow
- `src/lib/andamioscan.ts` - Client implementation
