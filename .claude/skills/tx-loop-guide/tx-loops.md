# Tx Loop Catalog

Reference catalog for Andamio transaction loops. Each loop represents a realistic sequence of transactions between one or more roles.

**Protocol Version:** V2 (current production)

---

## Loop 1: Onboarding

**Description:** First-time user mints an Access Token to participate in the protocol.

**Roles:** 1 (any user)

**Prerequisites:** None - this is the entry point.

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | User | `GENERAL_ACCESS_TOKEN_MINT` | Mint access token (~7.9 ADA) |

**Side Effects:**
- On confirmation: User can now participate in courses

**Notes:**
- This is required before any other loop
- The database user record is created separately when connecting to the app (not part of this tx)
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
| 1 | Student | `COURSE_STUDENT_ENROLL` | Enroll and commit to assignment (~2.14 ADA) |
| 2 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept the submission (~0.21 ADA) |
| 3 | Student | `COURSE_STUDENT_CREDENTIAL_CLAIM` | Claim credential (~-1.03 ADA refund) |

**Side Effects:**

Step 1 (Enroll):
- onSubmit: Create assignment commitment in database
- onConfirmation: Set commitment status to `PENDING_APPROVAL`

Step 2 (Assess - Accept):
- onSubmit: Set status to `PENDING_TX_ASSIGNMENT_ACCEPTED`
- onConfirmation: Set status to `ASSIGNMENT_ACCEPTED`

Step 3 (Claim):
- No database side effects (purely on-chain)

**Notes:**
- Student must prepare evidence before enrolling (Tiptap JSON content)
- Evidence becomes immutable once committed on-chain
- Teacher sees pending submissions in their dashboard

---

## Loop 3: Create and Publish Course

**Description:** An admin creates a new course, then a teacher (or the admin as teacher) publishes modules.

**Roles:** 1-2 (Admin, optionally separate Teacher)

**Prerequisites:**
- Admin has minted Access Token
- If separate teacher: Teacher has minted Access Token

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Admin | `COURSE_ADMIN_CREATE` | Create course on-chain (~45.3 ADA) |
| 2 | Teacher | `COURSE_TEACHER_MODULES_MANAGE` | Mint modules (~1.86 ADA) |

**Side Effects:**

Step 1 (Create):
- onSubmit: Create course record with title and policy ID
- onConfirmation: Set course `live` to true

Step 2 (Modules Manage - Mint):
- onSubmit: Set all modules to `PENDING_TX`
- onConfirmation: Set all modules to `ON_CHAIN` with module hash

**Notes:**
- Course policy ID comes from tx API response - frontend must extract it
- Admin who creates the course is automatically a teacher
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
| 1 | Student | `COURSE_STUDENT_ENROLL` | Enroll and submit initial work (~2.14 ADA) |
| 2 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Refuse - needs revision (~0.21 ADA) |
| 3 | Student | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | Resubmit with updated evidence (~0.33 ADA) |
| 4 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept the revision (~0.21 ADA) |
| 5 | Student | `COURSE_STUDENT_CREDENTIAL_CLAIM` | Claim credential (~-1.03 ADA refund) |

**Side Effects:**

Step 2 (Assess - Refuse):
- onSubmit: Set status to `PENDING_TX_ASSIGNMENT_REFUSED`
- onConfirmation: Set status to `ASSIGNMENT_REFUSED`

Step 3 (Update):
- onSubmit: Update evidence in database
- onConfirmation: Set status to `PENDING_APPROVAL`

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
| 1 | Student | `COURSE_STUDENT_ENROLL` | Enroll, commit to Module 1 (~2.14 ADA) |
| 2 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept Module 1 (~0.21 ADA) |
| 3 | Student | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | Commit to Module 2 (~0.33 ADA) |
| 4 | Teacher | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Accept Module 2 (~0.21 ADA) |
| ... | ... | ... | Repeat for additional modules |
| N | Student | `COURSE_STUDENT_CREDENTIAL_CLAIM` | Claim credential (~-1.03 ADA refund) |

**Side Effects:**

Step 3 (Update - new module):
- onSubmit: Create new assignment commitment for Module 2
- onConfirmation: Set commitment status to `PENDING_APPROVAL`

**Notes:**
- `COURSE_STUDENT_ASSIGNMENT_UPDATE` has two modes:
  - Update evidence for current module
  - Commit to a different module (uses `maybeNewSltHash` parameter)
- Student can complete modules in any order (unless prerequisites are set)
- Good for testing module navigation and progress tracking

---

## Loop 6: Team Teaching Setup

**Description:** An admin creates a course and adds additional teachers who can then manage content and assess students.

**Roles:** 2+ (Admin, Teacher(s))

**Prerequisites:**
- Admin has minted Access Token
- All teachers have minted Access Tokens

**Transactions:**

| Step | Role | Transaction | Description |
|------|------|-------------|-------------|
| 1 | Admin | `COURSE_ADMIN_CREATE` | Create course on-chain (~45.3 ADA) |
| 2 | Admin | `COURSE_ADMIN_TEACHERS_UPDATE` | Add teacher aliases (~5.3 ADA) |
| 3 | Teacher | `COURSE_TEACHER_MODULES_MANAGE` | Teacher mints modules (~1.86 ADA) |

**Side Effects:**

Step 2 (Teachers Update):
- No database side effects (purely on-chain)
- Teacher access verified via Andamioscan API

**Notes:**
- Admin who creates the course is automatically a teacher
- Additional teachers are identified by their Access Token alias
- Teachers can be added or removed with subsequent `TEACHERS_UPDATE` transactions
- Any registered teacher can manage modules and assess assignments

---

## Quick Reference: All V2 Transactions

| Transaction | Role | Typical Cost | Has Side Effects |
|-------------|------|--------------|------------------|
| `GENERAL_ACCESS_TOKEN_MINT` | Any | ~7.9 ADA | No |
| `COURSE_ADMIN_CREATE` | Admin | ~45.3 ADA | Yes |
| `COURSE_ADMIN_TEACHERS_UPDATE` | Admin | ~5.3 ADA | No |
| `COURSE_TEACHER_MODULES_MANAGE` | Teacher | ~1.86 ADA | Yes |
| `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | Teacher | ~0.21 ADA | Yes |
| `COURSE_STUDENT_ENROLL` | Student | ~2.14 ADA | Yes |
| `COURSE_STUDENT_ASSIGNMENT_UPDATE` | Student | ~0.33 ADA | Yes |
| `COURSE_STUDENT_CREDENTIAL_CLAIM` | Student | ~-1.03 ADA | No |

---

## Testing Tips

**For solo testing:**
- Use multiple browser profiles (e.g., Chrome profiles) with different wallets
- Or use a multi-account wallet (e.g., Eternl) and switch accounts
- Each account needs its own Access Token

**For pair testing:**
- One person plays Student, one plays Teacher/Admin
- Great for catching UX issues in handoff moments
- Can test realistic timing and notification flows

**What to watch for:**
- Loading states during transaction building
- Confirmation feedback after submission
- Status updates appearing correctly
- Error handling for failed transactions
- Navigation clarity between steps
