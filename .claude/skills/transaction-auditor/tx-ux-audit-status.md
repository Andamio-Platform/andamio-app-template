# TX UX Audit Status Table

> **Last Updated**: 2026-02-04
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
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | `teacher/page.tsx` (batch) | pass | pass (fixed) | pass | pass (fixed) | Audited 2026-02-03. Regression from e8d76ec refactor: decision cart unmounted on success because `pendingDecisions` cleared before "done" UI shown. Fixed by keeping cart visible during batch state. |
| 7 | COURSE_STUDENT_ASSIGNMENT_COMMIT | `assignment-commitment.tsx` | pass | pass | pass | pass | Audited 2026-02-03. All 4 checks pass — backend 404 "Module not found" issue resolved. |
| 8 | COURSE_STUDENT_ASSIGNMENT_UPDATE | `assignment-update.tsx` | pass | pass | pass | pass | Audited 2026-02-03. All 4 checks pass. |
| 9 | COURSE_STUDENT_CREDENTIAL_CLAIM | `user-course-status.tsx` (inline CTA) | pass | pass | pass | pass | Audited 2026-02-02. Moved from module page to course home "Your Learning Journey" card. Uses success color. |
| 10 | PROJECT_OWNER_MANAGERS_MANAGE | `managers-manage.tsx` | pass | pass | pass | pass | Audited 2026-02-03. All 4 checks pass — backend `managers_manage` handler resolved by ops. |
| 11 | PROJECT_OWNER_BLACKLIST_MANAGE | `blacklist-manage.tsx` | pass | pass | n/a | pass | Audited 2026-02-03. TX works e2e. Off-chain: no blacklist data in project detail yet (andamioscan#28). |
| 12 | PROJECT_MANAGER_TASKS_MANAGE | `tasks-manage.tsx` | pass | pass | pass | pass | Audited 2026-02-03. All 4 checks pass. |
| 13 | PROJECT_MANAGER_TASKS_ASSESS | `tasks-assess.tsx` | pass | pass | pass | pass | Audited 2026-02-04. All 4 checks pass. |
| 14 | PROJECT_CONTRIBUTOR_TASK_COMMIT | `task-commit.tsx` | pass | pass | pass | pass | Audited 2026-02-04. All 4 checks pass — indexer blocker resolved. |
| 15 | PROJECT_CONTRIBUTOR_TASK_ACTION | `task-action.tsx` | --- | --- | --- | --- | Unblocked by #14. Final tests pending — include in general UX testing. |
| 16 | PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM | `project-credential-claim.tsx` | --- | --- | --- | --- | Unblocked by #14. Final tests pending — include in general UX testing. |
| 17 | PROJECT_USER_TREASURY_ADD_FUNDS | `treasury-add-funds.tsx` | pass | pass | pass | pass | Audited 2026-02-03. All 4 checks pass on first test. |

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

### ~~TX Audit Issue — COURSE_STUDENT_ASSIGNMENT_COMMIT (Q3 — RESOLVED)~~

> **Resolved 2026-02-03**: Gateway 404 "Module not found" issue in the `assignment_submit` confirmation handler has been fixed backend-side. All 4 checks now pass.

### ~~TX Audit Issue — PROJECT_OWNER_MANAGERS_MANAGE (Q2 — RESOLVED)~~

> **Resolved 2026-02-03**: Gateway `managers_manage` handler fixed by ops team. All 4 checks now pass.

---

### ~~TX Audit Issue — PROJECT_CONTRIBUTOR_TASK_COMMIT (Q2-Q4 — RESOLVED)~~

> **Resolved 2026-02-04**: Andamioscan indexer now returning contributor data. All 4 checks pass. #15 and #16 are now unblocked.

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
- **2026-02-03**: #7 COURSE_STUDENT_ASSIGNMENT_COMMIT — Re-test: ALL PASS. Backend 404 "Module not found" issue resolved. Full flow working: submit → confirm → off-chain update → UX refresh.
- **2026-02-03**: #10 PROJECT_OWNER_MANAGERS_MANAGE — Re-test: ALL PASS. Backend `managers_manage` handler resolved by ops. Full flow working.
- **2026-02-03**: #6 COURSE_TEACHER_ASSIGNMENTS_ASSESS — Regression from `e8d76ec` two-panel refactor. Decision cart (including progress spinner and "done" message) was gated on `pendingDecisions.size > 0`. After successful batch submit, decisions are cleared → cart unmounts → success message never visible. Fixed: cart now also visible when `batchState !== "idle"`.
- **2026-02-03**: #17 PROJECT_USER_TREASURY_ADD_FUNDS — New component created. All 4 checks pass on first test.
- **2026-02-03**: #12 PROJECT_MANAGER_TASKS_MANAGE — All 4 checks pass. Submit, confirm, off-chain update, and UX refresh all working.
- **2026-02-03**: #8 COURSE_STUDENT_ASSIGNMENT_UPDATE — All 4 checks pass.
- **2026-02-03**: #11 PROJECT_OWNER_BLACKLIST_MANAGE — Q1 PASS, Q2 PASS, Q3 N/A (no blacklist data in project detail aggregate yet — andamioscan#28), Q4 PASS. TX works e2e.
- **2026-02-03**: #12 PROJECT_MANAGER_TASKS_MANAGE — All 4 checks pass.
- **2026-02-03**: #14 PROJECT_CONTRIBUTOR_TASK_COMMIT — Q1 PASS (TX builds, signs, submits on-chain). Q2-Q4 BLOCKED: Andamioscan indexer not returning contributor data, so gateway state machine cannot complete. Scheduled for retry 2026-02-04.
- **2026-02-04**: #13 PROJECT_MANAGER_TASKS_ASSESS — All 4 checks pass.
- **2026-02-04**: #14 PROJECT_CONTRIBUTOR_TASK_COMMIT — Re-test: ALL PASS. Indexer blocker resolved. Full flow working: submit → confirm → off-chain update → UX refresh.
- **2026-02-04**: #15 PROJECT_CONTRIBUTOR_TASK_ACTION — Unblocked. Deferred to general UX testing round.
- **2026-02-04**: #16 PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM — Unblocked. Deferred to general UX testing round.

## Advanced Testing Backlog

Scenarios that go beyond the simple/happy-path audit above. These should be tested after all simple cases pass.

| # | TX Type | Scenario | Status | Notes |
|---|---------|----------|--------|-------|
| 4 | COURSE_OWNER_TEACHERS_MANAGE | Add + remove teachers in the same TX | `---` | Requires `teachers_to_add` and `teachers_to_remove` populated simultaneously |
| 4 | COURSE_OWNER_TEACHERS_MANAGE | Add multiple teachers at once | `---` | Batch add with multiple aliases |
| 5 | COURSE_TEACHER_MODULES_MANAGE | Mint + burn modules in the same TX | `---` | Requires `modules_to_add` and `modules_to_remove` populated simultaneously |
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | Batch assess multiple assignments in one TX | `---` | Multiple `assignment_decisions` with mixed accept/refuse outcomes |
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | Refuse assignment with feedback | `---` | Verify refuse outcome and student-facing status update |
| 11 | PROJECT_OWNER_BLACKLIST_MANAGE | Show current blacklist in UX after refresh | `blocked` | Needs blacklist data in project detail aggregate (andamioscan#28). Pass `currentBlacklist` prop once API available. |
