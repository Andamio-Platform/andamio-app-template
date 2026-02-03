# Project Flows Definition

Step-by-step definitions of project-related user flows for E2E testing.

## Flow Overview

| Flow | Transactions | Roles | Priority | Status |
|------|-------------|-------|----------|--------|
| Browse Projects | 0 | Any | Low | Needs UI |
| Task Commitment | 1 | Contributor | Low | Needs UI |
| Claim Rewards | 1 | Contributor | Low | Needs UI |
| Manage Tasks | 1 | Manager | Low | Needs UI |

> **Note:** Project flows are currently blocked on UI implementation. These definitions document the expected behavior for when the UI is built.

---

## Flow 1: Browse Projects

### Overview
| Property | Value |
|----------|-------|
| **Name** | Browse Projects |
| **Transactions** | 0 |
| **Roles** | Any (can be unauthenticated) |
| **Status** | Blocked - needs UI |

### Steps

#### Step 1.1: Navigate to Projects

**Action:** Open projects page
**URL:** `/projects`
**Expected State:**
- Project catalog visible
- Project cards displayed
- Filter/search available

**Selectors:**
```typescript
project.catalog.container
project.catalog.projectCard
```

#### Step 1.2: View Project Cards

**Action:** Observe project listing
**Expected State:**
- Project title visible
- Task count indicator
- Contributor count

**Selectors:**
```typescript
project.catalog.projectTitle
```

#### Step 1.3: Select Project

**Action:** Click project card
**URL:** `/projects/{projectId}`
**Expected State:**
- Project detail page
- Description visible
- Task list shown

---

## Flow 2: First-Time Enrollment + Task Commitment

### Overview
| Property | Value |
|----------|-------|
| **Name** | Enroll & Commit |
| **Transactions** | 1 (`PROJECT_CONTRIBUTOR_ENROLL_COMMIT`) |
| **Roles** | New Contributor |
| **Prerequisites** | Has access token, not enrolled |
| **Status** | Blocked - needs UI |

### Steps

#### Step 2.1: View Project Tasks

**Action:** Browse available tasks
**Expected State:**
- Task list visible
- Available tasks marked
- Rewards shown

**Selectors:**
```typescript
project.detail.taskList
project.task.status.available
```

#### Step 2.2: Select Task

**Action:** Click task to view
**Expected State:**
- Task details shown
- Reward amount
- Expiration info
- "Enroll & Commit" button (new users)

**Selectors:**
```typescript
project.task.card
transaction.taskCommit.card.enrollAndCommit
```

#### Step 2.3: Initiate Enrollment

**Action:** Click "Enroll & Commit"
**Expected State:**
- Enrollment warning shown
- Transaction preparation

**Selectors:**
```typescript
transaction.taskCommit.enrollWarning
transaction.taskCommit.button.enrollAndCommit
```

#### Step 2.4: Sign Transaction

**Action:** Approve in wallet
**Expected State:**
- Wallet prompt
- Combined enroll+commit TX

#### Step 2.5: Confirmation

**Action:** Wait for confirmation
**Expected State:**
- Welcome message
- Contributor status
- Task assigned

**Selectors:**
```typescript
transaction.taskCommit.success.enrolled
```

---

## Flow 3: Task Commitment (Existing Contributor)

### Overview
| Property | Value |
|----------|-------|
| **Name** | Task Commitment |
| **Transactions** | 1 (`PROJECT_CONTRIBUTOR_TASK_COMMIT`) |
| **Roles** | Enrolled Contributor |
| **Prerequisites** | Already enrolled in project |
| **Status** | Blocked - needs UI |

### Steps

#### Step 3.1: View Available Tasks

**Action:** Browse project tasks
**Expected State:**
- Tasks filtered by availability
- "Commit" button shown

**Selectors:**
```typescript
project.task.commitButton
```

#### Step 3.2: Commit to Task

**Action:** Click Commit
**Expected State:**
- Confirmation shown
- Transaction building

**Selectors:**
```typescript
transaction.taskCommit.card.commitTask
transaction.taskCommit.button.commit
```

#### Step 3.3: Sign & Confirm

**Action:** Approve in wallet, wait for confirmation
**Expected State:**
- Standard TX flow
- Task assigned
- Deadline tracking started

**Selectors:**
```typescript
transaction.taskCommit.success.committed
```

---

## Flow 4: Commit with Reward Claim

### Overview
| Property | Value |
|----------|-------|
| **Name** | Commit & Claim Rewards |
| **Transactions** | 1 (`PROJECT_CONTRIBUTOR_COMMIT_CLAIM`) |
| **Roles** | Contributor with pending rewards |
| **Prerequisites** | Has unclaimed rewards |
| **Status** | Blocked - needs UI |

### Steps

#### Step 4.1: View Task with Pending Rewards

**Action:** Select task while having rewards
**Expected State:**
- Task details
- Rewards badge shown
- "Commit & Claim Rewards" option

**Selectors:**
```typescript
transaction.taskCommit.card.commitAndClaim
transaction.taskCommit.rewardsBadge
```

#### Step 4.2: Initiate Combined Transaction

**Action:** Click "Commit & Claim Rewards"
**Expected State:**
- Combined transaction details
- Reward amount shown

**Selectors:**
```typescript
transaction.taskCommit.button.commitAndClaim
```

#### Step 4.3: Sign & Confirm

**Action:** Approve in wallet
**Expected State:**
- Task committed
- Rewards transferred
- Balance updated

---

## Flow 5: Task Management (Manager)

### Overview
| Property | Value |
|----------|-------|
| **Name** | Manage Tasks |
| **Transactions** | 1 (`PROJECT_MANAGER_TASKS_MANAGE`) |
| **Roles** | Project Manager |
| **Prerequisites** | Manager role |
| **Status** | Blocked - needs UI |

### Steps

#### Step 5.1: Access Task Management

**Action:** Navigate to management view
**Expected State:**
- Task management UI
- Add/Remove options

**Selectors:**
```typescript
transaction.tasksManage.addTaskButton
transaction.tasksManage.removeTaskButton
```

#### Step 5.2: Add Task

**Action:** Fill task form
**Fields:**
- Task Code (`input#taskCode`)
- Content/Hash (`input#taskHash`)
- Expiration Days (`input#expiration`)
- Reward (`input#reward`)

**Selectors:**
```typescript
transaction.tasksManage.form.taskCode
transaction.tasksManage.form.taskHash
transaction.tasksManage.form.expiration
transaction.tasksManage.form.reward
```

#### Step 5.3: Submit Changes

**Action:** Click Add/Remove
**Expected State:**
- Transaction building
- Batch task update

#### Step 5.4: Confirm

**Action:** Approve in wallet
**Expected State:**
- Tasks updated
- Project state refreshed

**Selectors:**
```typescript
transaction.tasksManage.success.added
transaction.tasksManage.success.removed
```

---

## Flow 6: Contributor Dashboard

### Overview
| Property | Value |
|----------|-------|
| **Name** | View Contributions |
| **Transactions** | 0 |
| **Roles** | Contributor |
| **Status** | Blocked - needs UI |

### Steps

#### Step 6.1: Access Dashboard

**Action:** Navigate to contributions
**URL:** `/dashboard` or `/projects/my-tasks`
**Expected State:**
- Committed tasks listed
- Progress indicators
- Pending rewards summary

**Selectors:**
```typescript
project.contributor.container
project.contributor.taskList
project.contributor.rewardsSummary
```

#### Step 6.2: Track Progress

**Action:** View task status
**Expected State:**
- Deadline countdown
- Completion status
- Reward amounts

---

## Test Coverage Matrix

| Flow | Test File | Status |
|------|-----------|--------|
| Browse Projects | `browse-projects.spec.ts` | Partial (mocked) |
| Enroll & Commit | `task-commitment.spec.ts` | Partial (mocked) |
| Task Commit | `task-commitment.spec.ts` | Partial (mocked) |
| Commit + Claim | `task-commitment.spec.ts` | Partial (mocked) |
| Manage Tasks | Not implemented | Blocked |
| Dashboard | `task-commitment.spec.ts` | Partial (mocked) |

## Implementation Notes

### Current Status

Project UI is not yet implemented. Tests use mocked API responses to validate:
- Test structure is correct
- Mocks work as expected
- Selectors are defined

### When UI is Built

1. Update selectors in `e2e/helpers/selectors.ts`
2. Add `data-testid` attributes to components
3. Run tests to validate flows
4. Add visual regression tests

### Mock Data Structure

```typescript
// Project
{
  id: 'project-1',
  title: 'Test Project',
  isContributor: boolean,
  pendingRewards: string, // lovelace
  tasks: Task[]
}

// Task
{
  id: 'task-1',
  code: 'TASK_001',
  title: 'Task Title',
  status: 'available' | 'committed' | 'completed',
  reward: string, // lovelace
  expirationDays: number
}
```
