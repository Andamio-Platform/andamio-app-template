# Contributor Transaction Model

> **Last Updated**: January 14, 2026

This document describes the on-chain transaction model for Project Contributors in Andamio V2.

---

## Overview

The Project Contributor flow uses **only 3 transactions** for the entire contributor lifecycle:

| Transaction | API Endpoint | Purpose |
|-------------|--------------|---------|
| **COMMIT** | `/v2/tx/project/contributor/task/commit` | Enroll + Claim Previous Rewards + Commit to New Task |
| **ACTION** | `/v2/tx/project/contributor/task/action` | Update Evidence OR Cancel Commitment |
| **CLAIM** | `/v2/tx/project/contributor/credential/claim` | Unenroll + Get Credential + Claim Final Rewards |

---

## Transaction Details

### 1. COMMIT (The Multi-Purpose Transaction)

**Definition**: `PROJECT_CONTRIBUTOR_TASK_COMMIT`

**What it does**:
1. **Enrolls** the contributor in the project (if not already enrolled)
2. **Claims rewards** from previous approved task (if any)
3. **Commits** to a new task with evidence

**When to use**:
- First time contributing to a project (enrollment)
- After a task is approved, to start a new task (while staying enrolled)

**Key insight**: There is NO separate "enroll" transaction. COMMIT handles both enrollment and subsequent task commitments.

**Reward flow**:
- If contributor has an approved task from before, rewards are claimed automatically during the next COMMIT
- This keeps the contributor enrolled while claiming their earned rewards

### 2. ACTION (Evidence & Cancellation)

**Definition**: `PROJECT_CONTRIBUTOR_TASK_ACTION`

**What it does**:
- Update evidence for current commitment
- Cancel current commitment (abandon task)

**When to use**:
- Contributor wants to update their submission evidence
- Contributor wants to abandon the current task

**Note**: This is NOT for assessment - managers use `PROJECT_MANAGER_TASKS_ASSESS` for that.

### 3. CLAIM (Exit with Credential)

**Definition**: `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM`

**What it does**:
1. **Claims rewards** from last approved task (if any)
2. **Unenrolls** from the project
3. **Mints credential** token to contributor's global state

**When to use**:
- Contributor is done with the project and wants their credential
- Contributor has completed enough tasks and wants to leave

**Key insight**: This is the ONLY way to get the project credential. Once claimed, the contributor is no longer enrolled and cannot commit to more tasks without re-enrolling (via another COMMIT).

---

## Reward Distribution Flow

Rewards are distributed in two scenarios:

### Scenario 1: Continue Contributing (COMMIT)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Contributor completes Task A                             │
│ 2. Manager approves Task A                                  │
│ 3. Contributor COMMITs to Task B                            │
│    └── Rewards from Task A are claimed automatically        │
│    └── Contributor stays enrolled                           │
│    └── New commitment to Task B is created                  │
└─────────────────────────────────────────────────────────────┘
```

### Scenario 2: Leave Project (CLAIM)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Contributor completes Task A                             │
│ 2. Manager approves Task A                                  │
│ 3. Contributor CLAIMs credential                            │
│    └── Rewards from Task A are claimed automatically        │
│    └── Contributor is unenrolled                            │
│    └── Project credential minted to global state            │
└─────────────────────────────────────────────────────────────┘
```

---

## UI Implications

### Contributor Dashboard States

| State | Available Actions | UI Description |
|-------|-------------------|----------------|
| **Not enrolled** | COMMIT | "Enroll & Commit" - Select task, add evidence, submit |
| **Committed (pending review)** | ACTION | "Update Evidence" or "Cancel" - Waiting for manager |
| **Task approved (has rewards)** | COMMIT or CLAIM | "Commit to Next Task" (claims rewards, stays enrolled) OR "Claim Credential" (claims rewards, leaves project) |
| **No pending task** | COMMIT or CLAIM | Same as above |

### Key UX Points

1. **No separate enroll step**: The first COMMIT enrolls the contributor automatically
2. **Rewards are bundled**: Contributors don't need a separate "claim rewards" action - rewards come with COMMIT or CLAIM
3. **Credential = exit**: Claiming a credential means leaving the project
4. **Choice after approval**: Approved contributors choose between continuing (COMMIT) or leaving (CLAIM)

---

## Component Mapping

| UI Component | Transaction Definition | Use Case |
|--------------|----------------------|----------|
| `TaskCommit` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | Both enrollment AND subsequent commits |
| `TaskAction` | `PROJECT_CONTRIBUTOR_TASK_ACTION` | Update evidence, cancel commitment |
| `ProjectCredentialClaim` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | Leave project with credential |

**Note**: `ProjectEnroll` component is **deprecated** - use `TaskCommit` for all commit scenarios including first enrollment.

---

## How It Works Section (For User-Facing Copy)

### Simple Version

> **How Contributing Works**
>
> 1. **Commit to a Task** - Select a task, describe your approach, and commit on-chain
> 2. **Complete the Work** - Do the task and update your evidence as needed
> 3. **Get Reviewed** - A manager reviews and approves, refuses, or denies your work
> 4. **Earn Rewards** - Approved work earns you rewards (claimed on next commit or when leaving)
> 5. **Keep Going or Claim** - Commit to more tasks, or claim your project credential and leave

### Detailed Version

> **The Contributor Journey**
>
> **Starting Out**
> When you commit to your first task, you're automatically enrolled in the project. No separate enrollment step needed!
>
> **Working on Tasks**
> After committing, complete your task and update your evidence if needed. A project manager will review your submission.
>
> **Getting Rewards**
> When your task is approved, rewards become available. You'll receive them automatically when you either:
> - **Commit to another task** (continue contributing)
> - **Claim your credential** (leave the project)
>
> **Moving On**
> When you're ready to leave, claim your project credential. This mints a proof-of-contribution token to your wallet and releases any pending rewards.

---

## Related Documentation

- `TRANSACTION-COMPONENTS.md` - Component details and implementation
- `project-local-state.md` - Project routes and sitemap
- `packages/andamio-transactions/src/definitions/v2/project/contributor/` - Transaction definitions
