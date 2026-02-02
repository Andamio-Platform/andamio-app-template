# TX UX Audit Status Table

> **Last Updated**: 2026-02-02
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
| 7 | COURSE_STUDENT_ASSIGNMENT_COMMIT | `enroll-in-course.tsx` | fail | --- | --- | --- | Backend: Atlas TX API 500. Frontend payload correct. |
| 8 | COURSE_STUDENT_ASSIGNMENT_UPDATE | `assignment-update.tsx` | --- | --- | --- | --- | |
| 9 | COURSE_STUDENT_CREDENTIAL_CLAIM | `user-course-status.tsx` (inline CTA) | pass | pass | pass | pass | Audited 2026-02-02. Moved from module page to course home "Your Learning Journey" card. Uses success color. |
| 10 | PROJECT_OWNER_MANAGERS_MANAGE | `managers-manage.tsx` | --- | --- | --- | --- | |
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

### TX Audit Issue — COURSE_STUDENT_ASSIGNMENT_COMMIT

**Transaction**: `COURSE_STUDENT_ASSIGNMENT_COMMIT`
**Endpoint**: `POST /api/v2/tx/course/student/assignment/commit`
**Failed Check**: Q1 — TX does not submit (build error)
**Error**: `Atlas TX API error: 500 Internal Server Error` — Gateway returns 500 when forwarding to Atlas TX builder.
**Expected**: TX should build successfully and return unsigned CBOR for wallet signing.
**Request Payload** (verified correct per schema):
```json
{
  "alias": "student_001",
  "course_id": "fd68e0d150dcf57086c391f0c48553461776b75e28f316adccb003cb",
  "slt_hash": "644d83db53fa235f43eb3a9fc202b47ebd49234888e8290db40def451de4eb1e",
  "assignment_info": "90c3a363e5e789b4c9c1de2e27b16473a94e989d75750bd124388e820f8a916c"
}
```
**Frontend Status**: Payload matches schema. No frontend fix needed.
**Root Cause**: Backend Atlas TX builder failure. Possible causes: missing UTxO, module tokens not available, or validator script error.
**Component**: `src/components/learner/assignment-commitment.tsx:628-659`
**Date**: 2026-02-02

## Audit History

<!-- Record audit sessions here -->

- **2026-02-01**: #2 INSTANCE_COURSE_CREATE — all pass (submit, confirm, off-chain, UX refresh)
- **2026-02-01**: #3 INSTANCE_PROJECT_CREATE — all pass. UX enhancement: user wants a post-success "certificate" view showing project name, ID, prereqs, and owner.
- **2026-02-01**: #4 COURSE_OWNER_TEACHERS_MANAGE — all pass, simple case (add or remove single teacher)
- **2026-02-01**: #5 COURSE_TEACHER_MODULES_MANAGE — all pass, simple cases only (mint-only and burn-only tested separately)
- **2026-02-02**: #6 COURSE_TEACHER_ASSIGNMENTS_ASSESS — all pass (simple: single accept via teacher dashboard)
- **2026-02-02**: #7 COURSE_STUDENT_ASSIGNMENT_COMMIT — Q1 FAIL. Atlas TX API returns 500 on build. Frontend payload verified correct. Backend issue.
- **2026-02-02**: #9 COURSE_STUDENT_CREDENTIAL_CLAIM — all pass. Relocated from module assignment page to course home page "Your Learning Journey" card as inline CTA with completion-aware messaging. Uses success (green) color for accepted/complete states.

## Advanced Testing Backlog

Scenarios that go beyond the simple/happy-path audit above. These should be tested after all simple cases pass.

| # | TX Type | Scenario | Status | Notes |
|---|---------|----------|--------|-------|
| 4 | COURSE_OWNER_TEACHERS_MANAGE | Add + remove teachers in the same TX | `---` | Requires `teachers_to_add` and `teachers_to_remove` populated simultaneously |
| 4 | COURSE_OWNER_TEACHERS_MANAGE | Add multiple teachers at once | `---` | Batch add with multiple aliases |
| 5 | COURSE_TEACHER_MODULES_MANAGE | Mint + burn modules in the same TX | `---` | Requires `modules_to_add` and `modules_to_remove` populated simultaneously |
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | Batch assess multiple assignments in one TX | `---` | Multiple `assignment_decisions` with mixed accept/refuse outcomes |
| 6 | COURSE_TEACHER_ASSIGNMENTS_ASSESS | Refuse assignment with feedback | `---` | Verify refuse outcome and student-facing status update |
