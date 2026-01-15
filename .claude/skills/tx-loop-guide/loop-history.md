# Loop Testing History

Track the validation status of each transaction loop.

## Status Key

| Status | Meaning |
|--------|---------|
| **Untested** | Loop has never been run |
| **Blocked** | Blocker bug prevents completion |
| **Issues Found** | Completes but has data/UX/side-effect issues |
| **Validated** | All transactions work, data is complete, UI updates correctly |

## Validation Criteria

A loop is **Validated** when:
- All transactions complete successfully
- All required data is visible at each step
- Side effects update the database correctly
- UI updates automatically (no page refresh needed)
- No blocking issues remain open

## Loop Status

### Course Loops

| Loop | Status | Last Tested | Tester | Open Issues | Notes |
|------|--------|-------------|--------|-------------|-------|
| 1: Onboarding | Issues Found | 2026-01-12 | @robertom | #28, #30 | Access Token mints successfully but UI stuck, alert keeps flashing |
| 3: Create & Publish Course | Issues Found | 2026-01-13 | @james | - | Teacher sync working, need to test full loop |
| 2: Earn Credential | Blocked | 2026-01-12 | @robertom | #29, #30 | Enrollment blocked by missing transaction data |
| 4: Assignment Revision | Untested | - | - | - | - |
| 5: Multi-Module Path | Untested | - | - | - | - |
| 6: Team Teaching Setup | Untested | - | - | - | - |

### Project Loops

| Loop | Status | Last Tested | Tester | Open Issues | Notes |
|------|--------|-------------|--------|-------------|-------|
| P1: Create & Configure Project | Validated | 2026-01-14 | @james | - | Manager sync working, draft tasks working |
| P2: Publish Tasks | Validated | 2026-01-14 | @james | - | Full loop working with sync |
| P3: Earn Project Credential | Untested | - | - | - | - |
| P4: Task Revision Flow | Untested | - | - | - | - |
| P5: Multi-Task Contribution | Untested | - | - | - | - |

## Session Log

Record each testing session here.

### 2026-01-12 — Loop 1: Onboarding

**Tester:** @robertom
**Result:** Issues Found

**Transactions:**
- [x] GENERAL_ACCESS_TOKEN_MINT — Success (on-chain) but UI stuck

**Issues Created:**
- #28 — Access Token mint UI stuck after successful transaction (blocker)
- #30 — Comprehensive feedback digest with UX issues

**Notes:**
- Transaction completed successfully on-chain (confirmed in wallet)
- UI remained stuck showing "Please sign the message in your wallet"
- Bottom-right alert notification stuck and flashing indefinitely
- Workaround: Refresh page and re-authenticate
- After refresh: Access Token and alias visible correctly
- Browser: Brave, Wallet: Eternl, Network: Preprod

**UX Findings:**
- Dashboard shows creator/teacher features to new learners prematurely
- Cost (~7.9 ADA) not shown before transaction initiation
- Alias selection flow worked well
- Navigation to minting feature was easy (center of screen)

---

### 2026-01-12 — Loop 2: Earn Credential (Enrollment Attempt)

**Tester:** @robertom
**Result:** Blocked

**Transactions:**
- [ ] COURSE_STUDENT_ASSIGNMENT_COMMIT — Failed (missing transaction data)

**Issues Created:**
- #29 — Transaction Input is invalid error blocks course enrollment (blocker)
- #30 — Comprehensive feedback digest (same as above)

**Notes:**
- Attempted to enroll in published course with modules
- User navigated through entire flow: selected module → started assignment → added evidence → locked evidence → attempted submission
- Transaction builder failed validation: missing alias, course_id, slt_hash, module_code, network_evidence_hash
- Console error: "Failed to fetch commitments" appeared before any user action
- Data flow issue between UI state and transaction builder
- Cannot proceed with enrollment testing until #29 is resolved

**UX Findings:**
- Enrollment flow uses unfamiliar terminology ("course state token")
- "Select Module to Begin" instruction misleading (actual requirement: submit assignment)
- Missing explanation of WHY/WHAT benefits of enrollment workflow
- "Manage SLTs" button visible to learners (should be teacher-only)
- "View Assignment" button styling unclear (document icon with text)
- Warning banner for unsaved work needs danger/warning colors
- Studio navigation inconsistent (Course Studio removes Browse links, Project Studio keeps them)
- Create Course vs Create Project UI patterns inconsistent
- Module status indicator ("101 APPROVED") meaning unclear
- Wallet disconnects on page refresh

---

### 2026-01-13 — Loop 3: Create & Publish Course (Partial)

**Tester:** @james
**Result:** Issues Found (in progress)

**Transactions:**
- [x] COURSE_ADMIN_CREATE — Previously completed (course exists on-chain)
- [ ] COURSE_TEACHER_MODULES_MANAGE — Not yet tested this session

**Issues Created:**
- None (DB API bugs fixed during session)

**Notes:**
- Focused on validating teacher sync data flow
- CourseTeachersCard component created to show on-chain vs DB teachers
- Initial sync-teachers endpoint returned "Course not found" due to:
  1. Field name mismatch (`policy_id` → `course_nft_policy_id`)
  2. Broken Preload causing query to error out
- Both issues fixed in DB API deployment
- Teacher sync now works: on-chain teachers successfully synced to database
- JWT console logging added for easier curl testing
- Next: Continue with COURSE_TEACHER_MODULES_MANAGE transaction

**Data Visibility Validated:**
- [x] On-chain teachers visible via Andamioscan API
- [x] Database teachers visible after sync
- [x] Sync status comparison working ("In Sync" badge)
- [ ] Module minting data flow — not yet tested

---

### 2026-01-14 — Loop P1+P2: Project Manager Loop (Create → Draft → Publish)

**Tester:** @james
**Result:** Validated

**Transactions:**
- [x] PROJECT_ADMIN_CREATE — Previously completed (project exists on-chain)
- [x] PROJECT_MANAGER_TASKS_MANAGE — Success (tasks published on-chain)

**Issues Created:**
- None (all issues resolved during session)

**Notes:**
This was the first complete Project Manager loop validation. Key findings:

**Resolved Issues:**
1. **Draft tasks not visible**: Manage Treasury page was using public endpoint (only returns ON_CHAIN tasks). Fixed by switching to manager endpoint with authenticatedFetch.

2. **Missing contributor_state_id**: Discovered that `project_state_policy_id` from DB IS the `contributor_state_id` for Atlas TX API. No longer need to wait for Andamioscan.

3. **Prerequisites null error (500)**: Atlas TX API requires `prerequisites` field even though undocumented. When null in Andamioscan, use empty array `[]`. When present, map course/assignment IDs to TX API format.

4. **DB not syncing after publish**: Created `syncProjectTasks()` function in `src/lib/project-task-sync.ts` to:
   - Fetch on-chain tasks from Andamioscan
   - Match to DB tasks by decoding hex content → compare to title
   - Update DB via `/project-v2/manager/task/confirm-tx` with on-chain `task_id`

**API Discoveries:**
- Prerequisites format: `[{ course_id: string, assignment_ids: string[] }]`
- On-chain task content is hex-encoded UTF-8 (max 140 chars)
- `task_id` from Andamioscan is stored as `task_hash` in DB

**Data Flow Validated:**
- [x] Project created with project_state_policy_id
- [x] Draft tasks visible in manager endpoint
- [x] Tasks published on-chain successfully
- [x] On-chain tasks visible in Andamioscan
- [x] DB synced with on-chain task_ids
- [x] Task status updated from DRAFT → ON_CHAIN

**Routes Tested:**
- `/studio/project/[projectid]/draft-tasks` — Create/edit draft tasks
- `/studio/project/[projectid]/draft-tasks/[taskindex]` — Individual task editor
- `/studio/project/[projectid]/manage-treasury` — Publish tasks on-chain

---

### Template

```markdown
### YYYY-MM-DD — Loop X: [Name]

**Tester:** @username
**Result:** Validated | Issues Found | Blocked

**Transactions:**
- [ ] Tx 1: [name] — Success/Failed
- [ ] Tx 2: [name] — Success/Failed

**Issues Created:**
- #XX — [description]

**Notes:**
[Any observations, questions, or follow-ups]
```
