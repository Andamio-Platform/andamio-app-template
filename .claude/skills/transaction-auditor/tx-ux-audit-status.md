# TX UX Audit Status Table

> **Last Updated**: 2026-02-03
> **Legend**: `---` = not tested | `pass` = confirmed working | `fail` = issue found | `n/a` = not applicable
>
> **Note**: This audit tests the **simple/happy-path case** of each TX first. Complex scenarios (e.g., combined operations in a single TX) are tracked in the **Advanced Testing Backlog** below.

| # | Transaction Type | Component | Submits? | Confirms in UX? | Off-chain Updates? | UX Refreshes? | Notes |
|---|-----------------|-----------|----------|-----------------|-------------------|---------------|-------|
| 1 | GLOBAL_GENERAL_ACCESS_TOKEN_MINT | `mint-access-token-simple.tsx` | --- | --- | --- | --- | |
| 2 | INSTANCE_COURSE_CREATE | `create-course.tsx` | pass | pass | pass | pass | Audited 2026-02-01 |
| 3 | INSTANCE_PROJECT_CREATE | `create-project.tsx` | pass | pass | pass | pass | Audited 2026-02-01. UX enhancement: post-success certificate view requested. |
| 4 | COURSE_OWNER_TEACHERS_MANAGE | `teachers-update.tsx` | pass | pass | pass | pass | Audited 2026-02-01 (simple: add or remove single teacher) |
| 5 | COURSE_TEACHER_MODULES_MANAGE | `mint-module-tokens.tsx` / `burn-module-tokens.tsx` | pass | pass | pass | pass | Audited 2026-02-01 (simple: mint-only and burn-only) |
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | `assess-assignment.tsx` | pass | pass | pass | pass | Audited 2026-02-02 (simple: single accept) |
| 7 | COURSE_STUDENT_ASSIGNMENT_COMMIT | `assignment-commitment.tsx` | pass | pass (blocked) | fail | --- | Q1 pass (backend 500 resolved). Q3 fail: Gateway confirmation handler 404 "Module not found". See issue log. |
| 8 | COURSE_STUDENT_ASSIGNMENT_UPDATE | `assignment-update.tsx` | --- | --- | --- | --- | |
| 9 | COURSE_STUDENT_CREDENTIAL_CLAIM | `user-course-status.tsx` (inline CTA) | pass | pass | pass | pass | Audited 2026-02-02. Moved from module page to course home "Your Learning Journey" card. Uses success color. |
| 10 | PROJECT_OWNER_MANAGERS_MANAGE | `managers-manage.tsx` | pass | fail (blocked) | --- | --- | Q1 pass. Q2 fail: spinner stuck forever — gateway likely not reaching `updated`. Dispatched to ops. |
| 11 | PROJECT_OWNER_BLACKLIST_MANAGE | `blacklist-manage.tsx` | --- | --- | --- | --- | |
| 12 | PROJECT_MANAGER_TASKS_MANAGE | `tasks-manage.tsx` | --- | --- | --- | --- | |
| 13 | PROJECT_MANAGER_TASKS_ASSESS | `tasks-assess.tsx` | --- | --- | --- | --- | |
| 14 | PROJECT_CONTRIBUTOR_TASK_COMMIT | `task-commit.tsx` | --- | --- | --- | --- | |
| 15 | PROJECT_CONTRIBUTOR_TASK_ACTION | `task-action.tsx` | --- | --- | --- | --- | |
| 16 | PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM | `project-credential-claim.tsx` | --- | --- | --- | --- | |
| 17 | PROJECT_USER_TREASURY_ADD_FUNDS | *no component* | n/a | n/a | n/a | n/a | Schema defined, no UI yet |

## Column Definitions

| Column | Question | Pass Criteria |
|--------|----------|---------------|
| **Submits?** | Does the TX submit without error? | User clicks submit, wallet signs, TX goes on-chain |
| **Confirms in UX?** | Does a confirmation message automatically appear? | Toast/badge shows success after `updated` state |
| **Off-chain Updates?** | Does DB data update via Gateway state machine? | Query the relevant endpoint and see updated status |
| **UX Refreshes?** | Does the UI reflect the new state without manual reload? | Cache invalidation or refetch shows fresh data inline |

## Issue Log

<!-- Record issues found during audits here -->

### ~~TX Audit Issue — COURSE_STUDENT_ASSIGNMENT_COMMIT (Q1 — RESOLVED)~~

> **Resolved 2026-02-02**: The Atlas TX API 500 error on build has been fixed backend-side. TX now builds, signs, and submits successfully.

---

### TX Audit Issue — COURSE_STUDENT_ASSIGNMENT_COMMIT (Q3 — Gateway Confirmation)

**Transaction**: `COURSE_STUDENT_ASSIGNMENT_COMMIT`
**Gateway tx_type**: `assignment_submit`
**Endpoint**: `POST /api/v2/tx/course/student/assignment/commit`
**Failed Check**: Q3 — Off-chain data does not update after on-chain confirmation
**Error**: Gateway confirmation handler returns 404 "Module not found" when trying to update DB after on-chain confirmation.
**TX Status Response**:
```json
{
  "tx_hash": "849393e36bea1d87fecba140a1a0f14311847160fcb2bce643ecd7bc347fd97d",
  "tx_type": "assignment_submit",
  "state": "confirmed",
  "retry_count": 4,
  "last_error": "failed to confirm commitment: status 404, body: {\"code\":\"NOT_FOUND\",\"message\":\"Module not found\"}"
}
```
**Expected**: Gateway should transition from `confirmed` → `updated` after processing the `assignment_submit` confirmation handler. The module exists on-chain (TX confirmed at block) but the gateway's DB handler can't resolve it.
**Frontend Status**: Frontend code is correct. `useTxStream` and `onComplete` callback properly check for `"updated"` state. The spinner is correct behavior — the TX genuinely hasn't reached terminal state.
**Root Cause**: Gateway DB API confirmation handler for `assignment_submit` tx_type fails to find the module. Possible causes:
  - DB API `/module` lookup uses a different key than what the gateway passes
  - Module record not yet synced to DB API (race condition with module minting)
  - Module lookup expects `module_code` but receives `slt_hash` (or vice versa)
**Dispatch**:
  - **andamio-api**: Investigate the `assignment_submit` TxTypeHandler confirmation logic — why is the module lookup returning 404?
  - **db-api**: Verify the module record exists for course `fd68e0d150dcf57086c391f0c48553461776b75e28f316adccb003cb` with slt_hash `644d83db53fa235f43eb3a9fc202b47ebd49234888e8290db40def451de4eb1e`
**Component**: `src/components/learner/assignment-commitment.tsx:628-659`
**Date**: 2026-02-02

### TX Audit Issue — PROJECT_OWNER_MANAGERS_MANAGE (Q2 — Gateway Confirmation)

**Transaction**: `PROJECT_OWNER_MANAGERS_MANAGE`
**Gateway tx_type**: `managers_manage`
**Endpoint**: `POST /api/v2/tx/project/owner/managers/manage`
**Failed Check**: Q2 — Confirmation message never appears (spinner stuck forever)
**Error**: After TX submits and goes on-chain, the gateway never transitions to `updated` state. The spinner ("Confirming on blockchain...") persists indefinitely.
**Frontend Status**: Frontend code is correct. `managers-manage.tsx` uses `useTxStream`, properly checks for `"updated"` state, and has correct `TERMINAL_STATES`. The stuck spinner is correct behavior — the TX genuinely hasn't reached terminal state.
**Possible Causes**:
  - Gateway `managers_manage` TxTypeHandler confirmation logic failing (similar to #7 assignment_submit 404)
  - TX registered with wrong tx_type (verified: `managers_manage` is correct per API spec enum)
  - Gateway DB update handler not implemented for `managers_manage`
**Dispatch**: Forwarded to ops team for investigation.
**Component**: `src/components/tx/managers-manage.tsx`
**Date**: 2026-02-03

---

## Audit History

<!-- Record audit sessions here -->

- **2026-02-01**: #2 INSTANCE_COURSE_CREATE — all pass (submit, confirm, off-chain, UX refresh)
- **2026-02-01**: #3 INSTANCE_PROJECT_CREATE — all pass. UX enhancement: user wants a post-success "certificate" view showing project name, ID, prereqs, and owner.
- **2026-02-01**: #4 COURSE_OWNER_TEACHERS_MANAGE — all pass, simple case (add or remove single teacher)
- **2026-02-01**: #5 COURSE_TEACHER_MODULES_MANAGE — all pass, simple cases only (mint-only and burn-only tested separately)
- **2026-02-02**: #6 COURSE_TEACHER_ASSIGNMENTS_ASSESS — all pass (simple: single accept via teacher dashboard)
- **2026-02-02**: #7 COURSE_STUDENT_ASSIGNMENT_COMMIT — Re-test: Q1 now PASS (backend 500 resolved). Q2 PASS (spinner correctly shows, SSE stream connected). Q3 FAIL: Gateway confirmation handler returns 404 "Module not found" after 4 retries. TX stuck in `confirmed` state. Dispatched to andamio-api and db-api teams.
- **2026-02-02**: #9 COURSE_STUDENT_CREDENTIAL_CLAIM — all pass. Relocated from module assignment page to course home page "Your Learning Journey" card as inline CTA with completion-aware messaging. Uses success (green) color for accepted/complete states.
- **2026-02-03**: #10 PROJECT_OWNER_MANAGERS_MANAGE — Q1 PASS (TX builds, signs, submits). Q2 FAIL: spinner stuck forever, gateway never reaches `updated` state. Frontend code verified correct. Dispatched to ops team.

## Advanced Testing Backlog

Scenarios that go beyond the simple/happy-path audit above. These should be tested after all simple cases pass.

| # | TX Type | Scenario | Status | Notes |
|---|---------|----------|--------|-------|
| 4 | COURSE_OWNER_TEACHERS_MANAGE | Add + remove teachers in the same TX | `---` | Requires `teachers_to_add` and `teachers_to_remove` populated simultaneously |
| 4 | COURSE_OWNER_TEACHERS_MANAGE | Add multiple teachers at once | `---` | Batch add with multiple aliases |
| 5 | COURSE_TEACHER_MODULES_MANAGE | Mint + burn modules in the same TX | `---` | Requires `modules_to_add` and `modules_to_remove` populated simultaneously |
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | Batch assess multiple assignments in one TX | `---` | Multiple `assignment_decisions` with mixed accept/refuse outcomes |
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | Refuse assignment with feedback | `---` | Verify refuse outcome and student-facing status update |
