# Tx Loop Catalog

Reference catalog for Andamio transaction loops. Each loop represents a realistic sequence of transactions between one or more roles.

**Protocol Version:** V2 (Gateway API - January 2026)

---

## Loop 1: Onboarding

**Description:** First-time user mints an Access Token to participate in the protocol.

**Roles:** 1 (any user)

**Prerequisites:** None - this is the entry point.

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | User | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | Mint access token (~7.9 ADA) |

**Side Effects:**
- Gateway auto-confirms on-chain
- No DB update needed (pure on-chain tx)

**Notes:**
- This is required before any other loop
- The database user record is created during authentication (not this tx)
- User chooses an alias (1-31 characters) that becomes their on-chain identity

---

## Loop 2: Earn a Credential

**Description:** A student enrolls in a course, completes an assignment, gets approved by a teacher, and claims their credential.

**Roles:** 2 (Student, Teacher)

**Prerequisites:**
- Both parties have minted Access Tokens
- Course exists with at least one module on-chain
- Teacher is registered as a teacher for the course

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Student | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | Enroll and commit to assignment (~2.14 ADA) |
| 2 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept the submission (~0.21 ADA) |
| 3 | Student | `COURSE_STUDENT_CREDENTIAL_CLAIM` | Claim credential (~-1.03 ADA refund) |

**Side Effects:**

Step 1 (Enroll):
- Gateway registers TX and auto-confirms
- DB commitment created with status `PENDING_APPROVAL`

Step 2 (Assess - Accept):
- Gateway auto-updates commitment status to `ASSIGNMENT_ACCEPTED`

Step 3 (Claim):
- No database side effects (purely on-chain)

**Notes:**
- Student must prepare evidence before enrolling (Tiptap JSON content)
- Evidence becomes immutable once committed on-chain
- Teacher sees pending submissions in their dashboard

---

## Loop 3: Create and Publish Course

**Description:** An owner creates a new course, then publishes modules.

**Roles:** 1-2 (Owner, optionally separate Teacher)

**Prerequisites:**
- Owner has minted Access Token
- If separate teacher: Teacher has minted Access Token

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Owner | `INSTANCE_COURSE_CREATE` | Create course on-chain (~45.3 ADA) |
| 2 | Teacher | `COURSE_TEACHER_MODULES_MANAGE` | Mint modules (~1.86 ADA) |

**Side Effects:**

Step 1 (Create):
- Gateway registers TX
- On confirmation: Course record created in DB, `live` set to true

Step 2 (Modules Manage - Mint):
- Gateway auto-confirms
- All modules set to `ON_CHAIN` with module hash

**Notes:**
- Course policy ID comes from tx API response - frontend must extract it
- Owner who creates the course is automatically a teacher
- Modules need SLTs (Student Learning Targets) defined before minting
- Module hash is computed from SLTs using Blake2b-256

---

## Loop 4: Assignment Revision Flow

**Description:** A student submits work, gets feedback requesting revisions, resubmits, and eventually earns the credential.

**Roles:** 2 (Student, Teacher)

**Prerequisites:**
- Both parties have minted Access Tokens
- Course exists with at least one module on-chain
- Teacher is registered for the course

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Student | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | Enroll and submit initial work (~2.14 ADA) |
| 2 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Refuse - needs revision (~0.21 ADA) |
| 3 | Student | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | Resubmit with updated evidence (~0.33 ADA) |
| 4 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept the revision (~0.21 ADA) |
| 5 | Student | `COURSE_STUDENT_CREDENTIAL_CLAIM` | Claim credential (~-1.03 ADA refund) |

**Side Effects:**

Step 2 (Assess - Refuse):
- Gateway auto-updates status to `ASSIGNMENT_REFUSED`

Step 3 (Update):
- Gateway auto-updates evidence and sets status to `PENDING_APPROVAL`

**Notes:**
- Refused assignments can be revised and resubmitted
- Each revision creates a new on-chain commitment with updated evidence hash
- Good for testing the full feedback cycle

---

## Loop 5: Multi-Module Learning Path

**Description:** A student completes multiple modules in sequence before claiming their credential.

**Roles:** 2 (Student, Teacher)

**Prerequisites:**
- Both parties have minted Access Tokens
- Course exists with 2+ modules on-chain

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Student | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | Enroll, commit to Module 1 (~2.14 ADA) |
| 2 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept Module 1 (~0.21 ADA) |
| 3 | Student | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | Commit to Module 2 (~0.33 ADA) |
| 4 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept Module 2 (~0.21 ADA) |
| ... | ... | ... | Repeat for additional modules |
| N | Student | `COURSE_STUDENT_CREDENTIAL_CLAIM` | Claim credential (~-1.03 ADA refund) |

**Notes:**
- `COURSE_STUDENT_ASSIGNMENT_UPDATE` has two modes:
  - Update evidence for current module
  - Commit to a different module (uses `maybeNewSltHash` parameter)
- Student can complete modules in any order (unless prerequisites are set)
- Good for testing module navigation and progress tracking

---

## Loop 6: Team Teaching Setup

**Description:** An owner creates a course and adds additional teachers who can then manage content and assess students.

**Roles:** 2+ (Owner, Teacher(s))

**Prerequisites:**
- Owner has minted Access Token
- All teachers have minted Access Tokens

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Owner | `INSTANCE_COURSE_CREATE` | Create course on-chain (~45.3 ADA) |
| 2 | Owner | `COURSE_OWNER_TEACHERS_MANAGE` | Add teacher aliases (~5.3 ADA) |
| 3 | Teacher | `COURSE_TEACHER_MODULES_MANAGE` | Teacher mints modules (~1.86 ADA) |

**Side Effects:**

Step 2 (Teachers Manage):
- Gateway syncs teachers to DB automatically

**Notes:**
- Owner who creates the course is automatically a teacher
- Additional teachers are identified by their Access Token alias
- Teachers can be added or removed with subsequent `COURSE_OWNER_TEACHERS_MANAGE` transactions
- Any registered teacher can manage modules and assess assignments

---

---

# PROJECT LOOPS

The following loops test the Project/Treasury system for bounties and task-based contributions.

---

## Loop P1: Create and Configure Project

**Description:** An owner creates a new project treasury and optionally adds managers.

**Roles:** 1-2 (Owner, optionally separate Manager(s))

**Prerequisites:**
- Owner has minted Access Token
- If separate managers: Managers have minted Access Tokens

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Owner | `INSTANCE_PROJECT_CREATE` | Create project treasury on-chain |
| 2 | Owner | `PROJECT_OWNER_MANAGERS_MANAGE` | Add manager aliases (optional) |

**Side Effects:**

Step 1 (Create):
- Gateway registers TX
- On confirmation: Project record created in DB

Step 2 (Managers Manage):
- Gateway syncs managers to DB automatically

**Notes:**
- Project creation requires `partialSign: true` for multi-sig
- Owner who creates the project is automatically a manager
- Treasury NFT policy ID comes from tx API response

---

## Loop P2: Publish Tasks

**Description:** A manager creates and publishes tasks to the project for contributors.

**Roles:** 1 (Manager)

**Prerequisites:**
- Project exists on-chain (P1 completed)
- User is a registered manager for the project
- Draft tasks created in database with title, lovelace amount, expiration time

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Manager | `PROJECT_MANAGER_TASKS_MANAGE` | Mint/publish tasks on-chain |

**Side Effects:**

Step 1 (Tasks Manage - Mint):
- Gateway auto-confirms
- Tasks synced with on-chain `task_id` (stored as `task_hash` in DB)

**Notes:**
- `contributor_state_id` = `project_state_policy_id` from DB
- `prerequisites` field is REQUIRED by Atlas API (use `[]` if none)
- On-chain task content is hex-encoded UTF-8 (max 140 chars)

**Routes:**
- `/studio/project/[projectid]/draft-tasks` — View/create draft tasks
- `/studio/project/[projectid]/draft-tasks/[taskindex]` — Edit individual task

---

## Loop P3: Earn Project Credential

**Description:** A contributor enrolls in a project, commits to a task, gets approved by a manager, and claims their credential.

**Roles:** 2 (Contributor, Manager)

**Prerequisites:**
- Both parties have minted Access Tokens
- Project exists with at least one task on-chain
- Manager is registered for the project

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Contributor | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | Enroll and commit to task |
| 2 | Manager | `PROJECT_MANAGER_TASKS_ASSESS` | Accept the submission |
| 3 | Contributor | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | Claim credential |

**Side Effects:**

Step 1 (Task Commit):
- Gateway registers TX
- On confirmation: Commitment status set to `PENDING_APPROVAL`

Step 2 (Tasks Assess - Accept):
- Gateway auto-updates status to `ACCEPTED`

Step 3 (Credential Claim):
- No database side effects (purely on-chain)

**Notes:**
- Similar flow to Course credential claim
- Contributor must prepare evidence before committing
- Manager sees pending submissions in their dashboard

---

## Loop P4: Task Revision Flow

**Description:** A contributor submits work, gets feedback requesting revisions, resubmits, and eventually earns the credential.

**Roles:** 2 (Contributor, Manager)

**Prerequisites:**
- Both parties have minted Access Tokens
- Project exists with at least one task on-chain

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Contributor | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | Enroll and submit initial work |
| 2 | Manager | `PROJECT_MANAGER_TASKS_ASSESS` | Refuse - needs revision |
| 3 | Contributor | `PROJECT_CONTRIBUTOR_TASK_ACTION` | Resubmit with updated evidence |
| 4 | Manager | `PROJECT_MANAGER_TASKS_ASSESS` | Accept the revision |
| 5 | Contributor | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | Claim credential |

**Side Effects:**

Step 2 (Assess - Refuse):
- Gateway auto-updates status to `REFUSED`

Step 3 (Task Action - Update):
- Gateway auto-updates evidence and sets status to `PENDING_APPROVAL`

**Notes:**
- Tests the full feedback cycle for projects
- Refused tasks can be revised and resubmitted

---

## Loop P5: Multi-Task Contribution

**Description:** A contributor completes multiple tasks in a project before claiming credentials.

**Roles:** 2 (Contributor, Manager)

**Prerequisites:**
- Both parties have minted Access Tokens
- Project exists with 2+ tasks on-chain

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Contributor | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | Enroll, commit to Task 1 |
| 2 | Manager | `PROJECT_MANAGER_TASKS_ASSESS` | Accept Task 1 |
| 3 | Contributor | `PROJECT_CONTRIBUTOR_TASK_ACTION` | Commit to Task 2 |
| 4 | Manager | `PROJECT_MANAGER_TASKS_ASSESS` | Accept Task 2 |
| ... | ... | ... | Repeat for additional tasks |
| N | Contributor | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | Claim credential |

**Notes:**
- Contributors can work on multiple tasks
- Each accepted task can earn a separate credential
- Good for testing task navigation and progress tracking

---

## Loop P6: Fund Project Treasury

**Description:** Any user adds funds to a project treasury to enable task rewards.

**Roles:** 1 (Any User)

**Prerequisites:**
- User has minted Access Token
- Project exists on-chain

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | User | `PROJECT_USER_TREASURY_ADD_FUNDS` | Add ADA to project treasury |

**Side Effects:**

Step 1 (Add Funds):
- Gateway registers TX
- On confirmation: Treasury balance updated in DB

**Notes:**
- Any user can fund a project treasury (not limited to owner/manager)
- Funds become available for task rewards
- Treasury balance is visible on the project dashboard
- Good for testing treasury visibility and fund management

---

## Quick Reference: All V2 Transactions

### Global

| Transaction | Role | Has Side Effects |
|-------------|------|------------------|
| `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | Any | No (pure on-chain) |

### Course Transactions

| Transaction | Role | Has Side Effects |
|-------------|------|------------------|
| `INSTANCE_COURSE_CREATE` | Owner | Yes |
| `COURSE_OWNER_TEACHERS_MANAGE` | Owner | Yes (syncs teachers) |
| `COURSE_TEACHER_MODULES_MANAGE` | Teacher | Yes |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Teacher | Yes |
| `COURSE_STUDENT_ASSIGNMENT_COMMIT` | Student | Yes |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | Student | Yes |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | Student | No |

### Project Transactions

| Transaction | Role | Has Side Effects |
|-------------|------|------------------|
| `INSTANCE_PROJECT_CREATE` | Owner | Yes |
| `PROJECT_OWNER_MANAGERS_MANAGE` | Owner | Yes (syncs managers) |
| `PROJECT_OWNER_BLACKLIST_MANAGE` | Owner | No |
| `PROJECT_MANAGER_TASKS_MANAGE` | Manager | Yes |
| `PROJECT_MANAGER_TASKS_ASSESS` | Manager | Yes |
| `PROJECT_CONTRIBUTOR_TASK_COMMIT` | Contributor | Yes |
| `PROJECT_CONTRIBUTOR_TASK_ACTION` | Contributor | Yes |
| `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | Contributor | No |
| `PROJECT_USER_TREASURY_ADD_FUNDS` | Any User | Yes |

---

## V2 Transaction Flow

All transactions use the simplified V2 flow with Gateway auto-confirmation:

```
1. BUILD    →  POST /api/v2/tx/{endpoint}  →  Get unsigned_tx
2. SIGN     →  wallet.signTx(unsigned_tx)  →  Get signed_tx
3. SUBMIT   →  wallet.submitTx(signed_tx)  →  Get tx_hash
4. CONFIRM  →  Gateway auto-confirms via TxTypeRegistry
```

**No manual TX registration or polling needed** - the Gateway handles confirmation and DB updates automatically.

---

## Testing Tips

**For solo testing:**
- Use multiple browser profiles (e.g., Chrome profiles) with different wallets
- Or use a multi-account wallet (e.g., Eternl) and switch accounts
- Each account needs its own Access Token

**For pair testing:**
- One person plays Student, one plays Teacher/Manager
- Great for catching UX issues in handoff moments
- Can test realistic timing and notification flows

**What to watch for:**
- Loading states during transaction building
- Confirmation feedback after submission
- Status updates appearing correctly
- Error handling for failed transactions
- Navigation clarity between steps
