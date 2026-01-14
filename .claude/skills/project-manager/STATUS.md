# Project Status

> **Last Updated**: January 14, 2026 (Session 7 - Transaction Schema Audit + Design System)

Current implementation status of the Andamio T3 App Template.

---

## API Coverage Summary (All 3 Sub-Systems)

| API | Endpoints | Implemented | Coverage | Priority |
|-----|-----------|-------------|----------|----------|
| **Andamio DB API** | 88 | 50 | **57%** | High |
| **Andamio Tx API** | 16 | 16 definitions | **100%** | Complete |
| **Andamioscan** | 34 | 32 functions | **94%** | Low |
| **Overall** | **138** | **98** | **71%** | - |

> Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.
> Full report: `.claude/skills/audit-api-coverage/COVERAGE-REPORT.md`

### API Source of Truth

**IMPORTANT**: The `andamio-db-api/` directory in the monorepo is **deprecated** for reference purposes.

**Always use the deployed API schema as the source of truth:**
- **OpenAPI Spec**: https://andamio-db-api-343753432212.us-central1.run.app/docs/doc.json
- **Swagger UI**: https://andamio-db-api-343753432212.us-central1.run.app/docs

When implementing new endpoints or debugging API issues, fetch the live schema rather than reading local code.

---

## Current Blockers

| Blocker | Status | Impact |
|---------|--------|--------|
| **@andamio/transactions NPM Publish** | Waiting | Latest V2 definitions available locally via workspace link, but NPM package not yet published |
| **Andamio DB API (Go Rewrite)** | ✅ **Deployed** | Go API now live on Cloud Run; T3 App endpoints migrated |
| **Wallet Authentication** | ✅ **Eternl Fixed** | Eternl auth working; other wallets need testing |
| **Andamioscan Coverage** | ✅ **94% Complete** | 32/34 endpoints implemented (only `/health` and `/transactions` missing) |
| **Assignment System Hooks** | Partial | Some assignment/commitment endpoints still need React Query hooks |

**Workarounds in Place**:
- Using workspace symlink for `@andamio/transactions` (local development works)
- Andamioscan polling patterns handle transaction confirmation

**Testing Needed**:
- Wallet authentication with: Nami, Flint, Yoroi, Lace, Vespr (some may return bech32 directly, some hex)

---

## Upcoming Milestones

| Date | Milestone | Impact on Template |
|------|-----------|-------------------|
| **2026-01-09 (Thu)** | Go API Migration Complete | ✅ 50+ endpoints migrated |
| **2026-01-10 (Fri)** | API Coverage Audit | ✅ Automated script created |
| **2026-01-11 (Sat)** | Documentation sync | ✅ Completed |
| **2026-01-12 (Sun)** | **Today** - Access Token UX + API fixes | ✅ Completed |
| **2026-01-14 (Wed)** | **Andamio Pioneers Launch** | Preprod testing begins |
| **2026-01-16 (Fri)** | **Final Demos** | Demo day |
| **2026-01-16 → 2026-02-06** | V1→V2 Migration Focus | Work shifts to app.andamio.io |
| **2026-02-06 (Fri)** | Andamio V2 Mainnet Launch | Feature backlog resumes |

**Note**: During Jan 16 → Feb 6, primary dev focus is on app.andamio.io (production fork). This template remains the reference implementation.

---

## Session Notes (January 14, 2026) - Session 7: Transaction Schema Audit + Design System

**Context**: Cleanup and compliance session before Pioneers demos.

### Completed This Session

| Task | Details |
|------|---------|
| **Atlas TX API Schema Audit** | Audited all 16 transaction definitions against swagger.json. Created comprehensive report at `tx-audit-report.md`. |
| **PROJECT_MANAGER_TASKS_ASSESS Fix** | Fixed `task_decisions` schema: changed `task_hash` to `alias` to match `ProjectOutcome` swagger schema. |
| **ShortText140 Validation** | Added `.max(140)` to 4 fields: `assignment_info` (2 files), `task_info`, `project_info`. |
| **Design System Compliance** | Fixed hardcoded colors in `error.tsx` (`text-red-600` → `text-destructive`) and `pending-tx-popover.tsx` (`bg-yellow-500` → `bg-warning`). |
| **Documentation** | Updated CHANGELOG.md, BACKLOG.md with completed items. |

### Transaction Audit Summary

| Status | Count | Notes |
|--------|-------|-------|
| ✅ Match | 12 | All course txs, most project txs |
| ⚠️ Minor | 4 | Missing optional `initiator_data` (acceptable) |
| ❌ Critical | 0 | All critical issues resolved |

---

## Session Notes (January 14, 2026) - Session 6: Public Course Credential Claim

**Context**: Adding credential claim to public course page for enrolled students.

### Completed This Session

| Task | Details |
|------|---------|
| **Build Fixes** | Fixed ESLint errors: missing `useRouter` import in dashboard, unused variables in assignment-commitment.tsx, mint-module-tokens.tsx, and use-andamioscan.ts |
| **Public Course Credential Claim** | Added `CredentialClaim` component to `UserCourseStatus` on public course page. Students can now claim credentials directly from `/course/[coursenft]` when enrolled. |
| **Course Completion Detection** | Integrated `useCompletedCourses` hook to check if course credential already claimed. Uses database module count (not on-chain) for progress calculation consistency. |
| **Early Credential Claiming** | Added understated "Ready to move on? Claim credential now" link for students with partial completion who want to claim early. |

### Credential Claim States

| Condition | UI Shown |
|-----------|----------|
| 100% complete + no credential | "Course Complete!" celebration + CredentialClaim |
| <100% + some completions + no pending | Understated claim link (expands to CredentialClaim) |
| Has pending assignment | "Pending Assessment" info |
| No completions yet | "You're enrolled!" message |

### Key Technical Details

- **Progress calculation**: Uses database module count (`dbModules.length`) not on-chain module count (which may include legacy modules)
- **Claim eligibility**: `completedCount >= totalModules && !hasCourseCredential && !hasCurrentCommitment`
- **Early claim**: Same as above but `completedCount > 0 && completedCount < totalModules`

---

## Session Notes (January 13, 2026) - Session 5: Credential Claim + Dashboard Cleanup

**Context**: Implementing COURSE_STUDENT_CREDENTIAL_CLAIM and cleaning up dashboard UX.

### Completed This Session

| Task | Details |
|------|---------|
| **CredentialClaim Integration** | Added `CredentialClaim` component to `AssignmentCommitment` when `networkStatus === "ASSIGNMENT_ACCEPTED"`. Students now see success banner and can claim credential after teacher approval. |
| **Sync-from-Chain Feature** | When student has on-chain commitment but no DB record, they can now enter evidence and sync to database (2-step: create + update-evidence). |
| **Dashboard Cleanup** | Removed `CreateCourse` and `CreateProject` from dashboard. Changed grid from 4-col to 2-col (`md:grid-cols-2`) for less crowded layout. |

### Student Flow States Now Supported

| State | UI Shown |
|-------|----------|
| No commitment | "Start Assignment" button |
| Working locally | Evidence editor with "Lock" button |
| On-chain, no DB record | Sync warning + evidence editor |
| Pending assessment | Info banner + on-chain hash |
| **Assignment accepted** | **Success banner + CredentialClaim** |
| Credential claimed | "Module Completed" success |

### Pending Testing

1. **Test full student flow**: commit → teacher accept → claim credential
2. **Test Project system functionality**

---

## Session Notes (January 13, 2026) - Tx Loop 2 Complete

**Context**: Testing Tx Loop 2 (Student Assignment Commitment + Teacher Assessment) for full workflow validation.

### Completed Today

| Task | Details |
|------|---------|
| **Assignment Commitment API Fix** | Fixed student view to use correct API field names: `network_evidence`, `network_status`, `network_evidence_hash` instead of `evidence`, `status`, `tx_hash`. |
| **Instructor Dashboard Overhaul** | Fixed endpoint path (`/course/teacher/assignment-commitments/list-by-course`), request body (`policy_id`), and added detailed commitment fetching. |
| **Student Evidence Display** | Teachers can now view full Tiptap content submitted by students via `/course/shared/assignment-commitment/get`. |
| **Assessment Decision UI** | Added Accept/Refuse buttons with visual feedback and descriptive helper text. |
| **Transaction Input Fix** | Fixed `COURSE_TEACHER_ASSIGNMENTS_ASSESS` inputs to match schema: `alias`, `course_id`, `assignment_decisions[]`, `module_code`, `student_access_token_alias`, `assessment_result`. |
| **Pending Tx Tracking** | Added `trackPendingTx` call in instructor dashboard for `onConfirmation` side effects. |

### GitHub Issues Created

| Issue | Title |
|-------|-------|
| **#33** | Stuck transactions missing onConfirmation side effects |
| **#34** | Assessment Accept/Refuse button UX improvements |
| **#35** | Blocked: Andamioscan module token/SLT mismatch (multi-module courses) |

### API Field Naming Pattern

The DB API uses `network_*` prefixed fields for commitment data:
```
network_evidence      → Tiptap JSON content
network_status        → "PENDING_APPROVAL", "ASSIGNMENT_ACCEPTED", etc.
network_evidence_hash → 64-char hex hash
pending_tx_hash       → Transaction hash while pending
```

### Blockers Identified

| Blocker | Impact |
|---------|--------|
| **Andamioscan SLT/Module Mismatch** | Cannot test multi-module courses until fixed upstream |
| **Stuck Transactions** | Manual intervention needed for txs submitted before tracking was added |

### Next Steps

- Wait for Andamioscan fix before resuming Tx Loop 3
- Consider building admin utility for stuck transaction recovery (Issue #33)
- UX improvements for assessment buttons (Issue #34)

---

## Session Notes (January 13, 2026 - Earlier) - Loop 3 Testing

**Context**: Testing Loop 3 (Create & Publish Course) for data visibility validation.

### Completed

| Task | Details |
|------|---------|
| **CourseTeachersCard Component** | New card for Studio course pages showing on-chain vs database teachers with sync capability. Fetches teachers from Andamioscan API. |
| **Teacher Sync Integration** | Integrated `/course/owner/course/sync-teachers` endpoint. Fixed field naming (`policy_id` → `course_nft_policy_id`). |
| **JWT Console Logging** | JWT now logged to console on auth for easier curl testing during development. |
| **DB API Bug Fixes** | Coordinated fixes with DB API Claude for sync-teachers endpoint (broken Preload, field name mismatch). |

### Loop 3 Testing Status

**Validated:**
- [x] On-chain teachers visible via Andamioscan API
- [x] Database teachers visible after sync
- [x] Sync status comparison working ("In Sync" badge)
- [ ] Module minting data flow — blocked by Andamioscan issue

---

## Session Notes (January 12, 2026) - Rollout Day

**Context**: V2 Preprod Rollout day. Andamio Pioneers launches Wednesday January 14.

### Completed Today

| Task | Details |
|------|---------|
| **Access Token Minting UX** | New onboarding shows "Confirming on-chain" while tx pending. Smart refresh via `refreshAuth()` instead of full page reload. |
| **API Method Standardization** | Fixed all PATCH/PUT/DELETE → POST. Go API uses only GET (reads) and POST (writes). |
| **DB API Auth Fix** | Resolved "Failed to create user" error (API-side fix deployed). |
| **Documentation Sync** | Updated CHANGELOG, PENDING-TX-WATCHER.md, SIDE-EFFECTS-INTEGRATION.md, review-checklists.md |

### Remaining Pre-Pioneers Priorities

#### Priority 1: Wallet Compatibility Testing ⚡
**Impact**: Ensure all wallets work for Pioneers testing
**Status**: Only Eternl tested so far

Test authentication with:
- Nami, Flint, Yoroi, Lace, Vespr
- Some may return bech32 directly, some hex (Eternl fix already in place)

**Effort**: Low (testing only)

#### Priority 2: Cache Invalidation Audit
**Impact**: Fix "manual refresh required" after transactions

Verify `queryClient.invalidateQueries()` called with correct keys in:
- `useUpdateCourse`, `useUpdateCourseModule` mutations
- Transaction `onSuccess` callbacks

**Effort**: Low (audit and fix)

**Note**: Access token flow now uses `refreshAuth()` pattern which works well - consider applying similar targeted refresh to other flows.

### Deferred (Post-Pioneers)
- Assignment System Hooks (12 endpoints for student/teacher workflows)
- Remaining DB API hooks (38 endpoints at 56% coverage)
- Project System routes (7 remaining routes)

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 15/15 routes |
| Project System | In Progress | 6/13 routes, 9 transaction components |
| DB API Coverage | **57%** | 50/88 endpoints |
| Tx API Coverage | **100%** | 16/16 definitions |
| Andamioscan Coverage | **94%** | 32/34 endpoints |
| Transaction System | **100% Complete** | 16/16 definitions, side effects working |
| Styling System | Stable | Full semantic color system |

---

## Course System

### Routes: 15/15 Implemented

**Public (Learner)** - 5 routes:
- `/course` - Course catalog
- `/course/[coursenft]` - Course detail with modules
- `/course/[coursenft]/[modulecode]` - Module detail with SLTs/lessons
- `/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson detail
- `/course/[coursenft]/[modulecode]/assignment` - Assignment with commitment flow

**Studio (Creator)** - 10 routes:
- `/studio` - Studio home dashboard
- `/studio/course` - Course management dashboard
- `/studio/course/[coursenft]` - Course editor
- `/studio/course/[coursenft]/instructor` - Instructor dashboard
- `/studio/course/[coursenft]/[modulecode]` - Module editor
- `/studio/course/[coursenft]/[modulecode]/slts` - SLT management
- `/studio/course/[coursenft]/[modulecode]/assignment` - Assignment editor
- `/studio/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson editor
- `/studio/course/[coursenft]/[modulecode]/introduction` - Introduction editor

### DB API Hook Coverage: 56% (49/87 endpoints)

See `audit-api-coverage/COVERAGE-REPORT.md` for full breakdown.

**Implemented Hooks** (18):
| Category | Hooks |
|----------|-------|
| Course | `useCourse`, `usePublishedCourses`, `useOwnedCoursesQuery`, `useUpdateCourse`, `useDeleteCourse` |
| Modules | `useCourseModules`, `useCourseModule`, `useCourseModuleMap`, `useCreateCourseModule`, `useUpdateCourseModule`, `useUpdateCourseModuleStatus` |
| SLTs | `useSLTs`, `useCreateSLT`, `useUpdateSLT`, `useDeleteSLT` |
| Lessons | `useLessons`, `useLesson`, `useCreateLesson` |

**Missing High-Priority Hooks**:
- Assignment: create, update, get (5 endpoints)
- Assignment Commitments: create, update, review, list (7 endpoints)
- Course Minting: create, mint, confirm-mint (3 endpoints)
- Introductions: create, update, get (5 endpoints)

---

## React Query Migration

### Status: Complete ✅

**Completed**: January 1, 2026 (ahead of Preprod V2 Release 2026-01-09)

New hooks created in `src/hooks/api/`:

| Hook File | Hooks Created | Purpose |
|-----------|---------------|---------|
| `use-course.ts` | 5 | Course queries + mutations |
| `use-course-module.ts` | 6 | Module queries + mutations |
| `use-slt.ts` | 4 | SLT queries + mutations |
| `use-lesson.ts` | 3 | Lesson queries + mutations |
| **Total** | **18** | |

### Migration Status

| Page | Status | Hooks Used |
|------|--------|------------|
| `course/page.tsx` | ✅ Migrated | `usePublishedCourses` |
| `course/[coursenft]/page.tsx` | ✅ Migrated | `useCourse`, `useCourseModules` |
| `course/[coursenft]/[modulecode]/page.tsx` | ✅ Migrated | `useCourse`, `useCourseModule`, `useSLTs`, `useLessons` |
| `course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` | ✅ Migrated | `useCourse`, `useCourseModule`, `useLesson` |
| `studio/course/page.tsx` | ✅ Migrated | `useOwnedCoursesQuery`, `useCourseModules` |
| `studio/course/[coursenft]/page.tsx` | ✅ Migrated | `useCourse`, `useCourseModules`, mutations |

**Migration Complete**: All primary course routes now use React Query hooks.

### Expected Impact

- **Request reduction**: 40-60% with full migration
- **Deduplication**: Automatic for identical requests
- **Cross-route caching**: Data shared between routes
- **Background refetching**: Stale data refreshed automatically

Full roadmap: `audit-api-coverage/api-recommendations-2025-12-19.md`

---

## Transaction System

### Core Components

| Component | Status | Purpose |
|-----------|--------|---------|
| `useAndamioTransaction` | **Primary** | Transaction hook with automatic side effects |
| `useTransaction` | Stable | Base hook (used internally by useAndamioTransaction) |
| `TransactionButton` | Stable | Reusable transaction button |
| `TransactionStatus` | Stable | Transaction result display |
| `PendingTxWatcher` | Stable | Automatic tx monitoring via Koios |

### V2 Transaction Components: 16/16 Complete ✅

All transaction components now use `useAndamioTransaction` for standardized side effect execution.

**Global**:
| Component | Definition | Status |
|-----------|------------|--------|
| `mint-access-token.tsx` | `GLOBAL_GENERAL_ACCESS_TOKEN_MINT` | ✅ Hybrid (manual JWT) |

**Course System** (6):
| Component | Definition | Status |
|-----------|------------|--------|
| `create-course.tsx` | `INSTANCE_COURSE_CREATE` | ✅ |
| `teachers-update.tsx` | `COURSE_OWNER_TEACHERS_MANAGE` | ✅ |
| `mint-module-tokens.tsx` | `COURSE_TEACHER_MODULES_MANAGE` | ✅ |
| `assess-assignment.tsx` | `COURSE_TEACHER_ASSIGNMENTS_ASSESS` | ✅ |
| `enroll-in-course.tsx` | `COURSE_STUDENT_ASSIGNMENT_COMMIT` | ✅ |
| `assignment-update.tsx` | `COURSE_STUDENT_ASSIGNMENT_UPDATE` | ✅ |
| `credential-claim.tsx` | `COURSE_STUDENT_CREDENTIAL_CLAIM` | ✅ |

**Project System** (9):
| Component | Definition | Status |
|-----------|------------|--------|
| `create-project.tsx` | `INSTANCE_PROJECT_CREATE` | ✅ |
| `managers-manage.tsx` | `PROJECT_OWNER_MANAGERS_MANAGE` | ✅ |
| `blacklist-manage.tsx` | `PROJECT_OWNER_BLACKLIST_MANAGE` | ✅ |
| `tasks-manage.tsx` | `PROJECT_MANAGER_TASKS_MANAGE` | ✅ |
| `tasks-assess.tsx` | `PROJECT_MANAGER_TASKS_ASSESS` | ✅ |
| `project-enroll.tsx` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | ✅ |
| `task-commit.tsx` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | ✅ |
| `task-action.tsx` | `PROJECT_CONTRIBUTOR_TASK_ACTION` | ✅ |
| `project-credential-claim.tsx` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | ✅ |

### Side Effects System

- Automatic `onSubmit` execution after transactions
- Status updates: `PENDING_TX` → `ON_CHAIN`
- Toast notifications for success/failure
- Error handling with retry logic
- **Note**: Some DB API endpoints pending Go rewrite deployment

---

## Styling System

### Status: Stable

**Color System** (light/dark mode):
- Primary: Sky blue (hue 250) - fresh, modern
- Base: `background`, `foreground`, `card`, `popover`
- Interactive: `primary`, `secondary`, `muted`, `accent`
- Status: `success`, `warning`, `info`, `destructive`
- Sidebar: Gray panel contrasting with white content area

**Components**:
- 45+ shadcn/ui components installed
- `AndamioText` for consistent text styling
- `AndamioStatusIcon` for status indicators with presets
- `AndamioPageLoading` / `AndamioStudioLoading` unified loading system
- Responsive breakpoints: xs (375px) → 2xl (1536px)

**Guidelines**:
- `.claude/skills/review-styling/` - Style rules, extracted components
- `.claude/skills/theme-expert/` - Layouts, colors, spacing, components

---

## Project System

### Status: In Progress 🔄

**Recent Progress**: Contributor and Manager dashboards implemented (January 2026)

### Routes: 2/13 Implemented

**Public (Contributor)** - 2/3 routes:
- `/project` - ✅ Project catalog
- `/project/[treasurynft]` - ✅ Project detail with tasks
- `/project/[treasurynft]/contributor` - ✅ **NEW** Contributor dashboard (enroll, commit, claim)
- `/project/[treasurynft]/[taskhash]` - Task detail with commitment

**Studio (Manager)** - 1/10 routes:
- `/studio/project` - ✅ Project management
- `/studio/project/[treasurynft]` - ✅ Project dashboard
- `/studio/project/[treasurynft]/manager` - ✅ **NEW** Manager dashboard (review submissions)
- `/studio/project/[treasurynft]/draft-tasks` - ✅ Task list management
- `/studio/project/[treasurynft]/draft-tasks/new` - ✅ Create new task
- `/studio/project/[treasurynft]/draft-tasks/[taskindex]` - ✅ Edit existing task
- `/studio/project/[treasurynft]/manage-treasury` - Planned
- `/studio/project/[treasurynft]/manage-contributors` - Planned
- `/studio/project/[treasurynft]/commitments` - Planned
- `/studio/project/[treasurynft]/transaction-history` - Planned

### Transaction Components: 8 Created

| Component | Purpose | Status |
|-----------|---------|--------|
| `ProjectEnroll` | Enroll in project + initial task commit | Active |
| `TaskCommit` | Commit to a task with evidence | Active |
| `ProjectCredentialClaim` | Claim earned project credentials | Active |
| `TasksAssess` | Manager: assess task submissions | Active |
| `TasksManage` | Manager: manage project tasks | Active |
| `ManagersManage` | Manager: manage project managers | Active |
| `BlacklistManage` | Manager: manage blacklist | Active |
| `CreateProject` | Create new project treasury | Active |

16 API endpoints mapped, implementation ongoing.

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| Next.js | 15.x | Framework |
| @tanstack/react-query | ^5.x | Data fetching |
| @meshsdk/core | ^2.x | Cardano wallet |
| @tiptap/react | ^2.x | Rich text editor |
| @dnd-kit/core | ^6.x | Drag and drop |
| @andamio/db-api-types | ^1.1.x | API types & schemas |
| @andamio/transactions | ^0.5.x | Transaction definitions |

---

## Recent Changes

### January 10, 2026 (Session 4) - API Migration & Transaction Fixes ✅

**Go API RESTful Migration Complete**: Migrated all 50+ API endpoint calls to new role-based path structure.

**Migration Pattern**: Changed from `POST /endpoint` with body to `GET /{system}/{role}/{resource}/{action}` with path params.

**Example Changes**:
- `POST /course/list` → `GET /course/owner/courses/list`
- `POST /course/get` → `GET /course/public/course/get/{policy_id}`
- `POST /assignment-commitment/create` → `POST /course/student/assignment-commitment/create`

**Files Updated**: 36 files across hooks, components, and pages. Full audit report at `.claude/skills/audit-api-coverage/API-AUDIT-2026-01-10.md`.

**Transaction Partial Signing Fix**: Fixed Eternl wallet "ErrorSignTx.canOnlySignPartially" error.
- Added `partialSign` property to `AndamioTransactionDefinition` type
- Set `partialSign: true` on `INSTANCE_PROJECT_CREATE` definition
- Updated `useAndamioTransaction` to pass through `partialSign` from definition

**Null Safety Fix**: Fixed `truncateTxHash` crash when `txHash` is undefined in `PendingTxPopover`.

**Project Dashboard Role Detection**: `/studio/project/[treasurynft]` now detects both owner and manager roles.
- Owners see an info banner explaining their capabilities
- Managers can fully manage the project
- Uses Andamioscan `getManagingProjects` to check manager status via on-chain data

**Skill Consolidation**: Merged 3 styling skills into unified `design-system` skill with 3 modes: `review`, `diagnose`, `reference`.

### January 10, 2026 (Session 3) - Eternl Wallet Authentication Fixed ✅

**Fixed Authentication for Eternl Wallet**: Wallet-based authentication now works with Eternl and other wallets that return hex-encoded addresses.

**Root Causes Found & Fixed**:
1. **Address Format Mismatch**: Eternl returns hex addresses (e.g., `00db...`), but Mesh SDK's `signData` was internally calling `Address.fromBech32()` which failed on hex input.
2. **Parameter Order Reversed**: Mesh SDK ISigner interface expects `signData(payload, address?)` but we were calling `signData(address, payload)`.

**Solution** (`src/contexts/andamio-auth-context.tsx`):
- Import `core` from `@meshsdk/core`
- Detect address format: if starts with "addr" it's already bech32, otherwise convert
- Convert hex → bech32 using `core.Address.fromString(hex).toBech32()`
- Fixed parameter order: `wallet.signData(nonce, bech32Address)`

**Testing Status**:
- ✅ Eternl wallet (preprod) - authentication successful
- ⏳ Other wallets (Nami, Flint, Yoroi, Lace) - needs testing

**Skill Consolidation**:
- Merged `global-style-checker`, `review-styling`, `theme-expert` → **`design-system`** (3 modes: review, diagnose, reference)
- Merged `plan-andamioscan-integration` → **`audit-api-coverage`** (added Phase 3 interview workflows)
- Fixed ESLint warnings across 7 files

### January 10, 2026 (Session 2) - API Coverage Audit Complete

**Full API Audit**: Completed comprehensive audit of all 3 API sub-systems.

**Coverage Statistics**:
| API | Endpoints | Implemented | Coverage |
|-----|-----------|-------------|----------|
| Andamio DB API | 73 | 18 hooks | 25% |
| Andamio Tx API | 16 | 16 definitions | 100% |
| Andamioscan | 36 | 21 functions | 58% |
| **Total** | **125** | **55** | **44%** |

**Documentation Created**:
- `audit-api-coverage/db-api-endpoints.md` - 73 endpoints by category
- `audit-api-coverage/tx-api-endpoints.md` - 16 transaction mappings
- `audit-api-coverage/andamioscan-endpoints.md` - 36 endpoints + 21 client functions
- `audit-api-coverage/api-coverage-report-2026-01-10.md` - Full report with recommendations
- `audit-api-coverage/api-coverage.md` - Updated quick reference

**Key Findings**:
1. **Tx API 100% Complete** - All 16 transaction types have definitions and UI components
2. **16 Event endpoints missing** - Andamioscan event endpoints would replace Koios polling
3. **Assignment system gap** - 12 DB API endpoints need hooks for student interactions
4. **Cache invalidation needed** - React Query invalidation after mutations needs audit

**Monday Priorities Set**: Event endpoints → Assignment hooks → Cache audit

### January 10, 2026 (Session 1) - Types Package Migration Complete

**Major Migration**: Completed migration from `@andamio/db-api` to `@andamio/db-api-types@1.1.0` and `@andamio/transactions@0.5.0`.

**Type Changes** (38 files updated):
| Old Type | New Type |
|----------|----------|
| `ListOwnedCoursesOutput` | `CourseListResponse` |
| `CourseOutput` | `CourseResponse` |
| `CourseModuleOutput` | `CourseModuleResponse` |
| `LessonWithSLTResponse` | `LessonResponse` |
| `AssignmentCommitmentWithAssignmentResponse` | `AssignmentCommitmentResponse` |

**Property Renames**:
- `slt_index` → `module_index` (on SLTs and lessons)
- `task.index` → `task.task_index`
- `learner_access_token_alias` → `access_token_alias`
- Flattened `commitment.assignment.*` → `commitment.module_code`, `commitment.assignment_title`

**Status Enum Changes**: `DRAFT | PENDING_TX | ON_CHAIN` (APPROVED removed)

**Removed Data** (UI simplified):
- Treasury: `total_ada`, `escrows`, `_count`
- Commitments: `created`, `updated` timestamps
- Tokens: `subject`, `name`, `ticker`, `asset_name_decoded`

**Transaction Renames**:
- `COMMIT_TO_ASSIGNMENT` → `COURSE_STUDENT_ASSIGNMENT_COMMIT`
- `BURN_LOCAL_STATE` → `COURSE_STUDENT_CREDENTIAL_CLAIM`
- `LEAVE_ASSIGNMENT` → `COURSE_STUDENT_ASSIGNMENT_UPDATE`
- `ACCEPT_ASSIGNMENT` + `DENY_ASSIGNMENT` → `COURSE_TEACHER_ASSIGNMENTS_ASSESS`

**All type errors resolved - typecheck passes.**

### January 9, 2026 (Session 2) - Go API Migration Complete

**Andamio DB API (Go) Now Live**: Migrated all T3 App endpoints to match the new Go API.

**Endpoint Migrations**:
| Old Endpoint | New Endpoint | Files Updated |
|--------------|--------------|---------------|
| `POST /course/list` | `GET /courses/owned` | 5 files |
| `POST /course-module/map` | `POST /course-modules/list` | 2 files |
| `POST /my-learning/get` | `GET /learner/my-learning` | 1 file |
| `POST /access-token/update-alias` | `POST /user/access-token-alias` | 2 files |
| `POST /access-token/update-unconfirmed-tx` | `PATCH /user/unconfirmed-tx` | 2 files |
| `GET /transaction/pending-transactions` | `GET /pending-transactions` | 2 files |

**Fixed Issues**:
- CORS configuration on Cloud Run
- Invalid signature error (Mesh SDK `signData` requires address parameter - pending fix)
- Null safety for `tx.context` in pending-tx-popover

**Remaining Work**:
- Fix wallet auth signature (add address to `signData` call)
- Verify all API response schemas match Go API

### January 9, 2026 (Session 1) - Transaction Component Audit Complete

**Transaction System Audit**: All 16 V2 transaction components verified to use `useAndamioTransaction` hook.

**MintAccessToken Updated**: Migrated from `useTransaction` to `useAndamioTransaction` (hybrid approach). Now executes `onSubmit` side effects automatically while manually handling JWT storage.

**Documentation Updated**:
- `TRANSACTION-COMPONENTS.md` - Full V2 transaction matrix with 16 components
- `SIDE-EFFECTS-INTEGRATION.md` - Added MintAccessToken hybrid approach section
- `CHANGELOG.md` - Added hook migration note

**Blockers Documented**: Added "Current Blockers" section to STATUS.md tracking:
- @andamio/transactions NPM publish (waiting)
- Andamio DB API Go rewrite (waiting for deployment)
- Event endpoints for transaction confirmation (0/15)

### January 8, 2026 - Andamioscan Integration Complete

**Andamioscan API Integration**: Completed all Course, User, and Project endpoints (17/32, 53%)

**New Endpoints Implemented**:
- `GET /v2/users/{alias}/projects/contributing` - Dashboard summary
- `GET /v2/users/{alias}/projects/managing` - Dashboard summary (managers only)
- `GET /v2/users/{alias}/projects/owned` - Project ownership check
- `GET /v2/users/{alias}/projects/completed` - Project credentials
- `GET /v2/projects/{id}/contributors/{alias}/status` - Contributor progress
- `GET /v2/projects/managers/{alias}/assessments/pending` - Manager pending reviews
- `GET /v2/users/{alias}/courses/owned` - Course ownership (admin vs teacher)

**New Dashboard Components**:
- `OwnedCoursesSummary` - Shows courses user owns/created
- `ContributingProjectsSummary` - Shows projects user contributes to
- `ManagingProjectsSummary` - Shows projects user manages (only if manager)

**Studio Enhancement**:
- Course list shows ownership indicator (crown badge) for courses user is admin of

**New Hooks Created**:
- `useOwnedCourses`, `useContributingProjects`, `useManagingProjects`
- `useOwnedProjects`, `useCompletedProjects`
- `useProjectContributorStatus`, `useIsProjectContributor`, `useContributorProgress`
- `useManagerPendingAssessments`

**New Types**:
- `AndamioscanContributorStatus`, `AndamioscanProjectPendingAssessment`

**New Icon**:
- `InstructorIcon` (Crown) for course ownership indicator

**GitHub Issue Created**:
- #26: Implement Andamioscan Event Endpoints for Transaction Confirmation

**Remaining**: 15 Event endpoints for transaction confirmation (tracked in issue #26)

### January 7, 2026 (Session 2 - Tx Loop Testing)

**Tx Loop Testing Session**: Tested Loop 1 (Onboarding) and Loop 3 (Create and Publish Course)

**Bugs Found & Fixed**:
- **Course Creation Side Effects** (`use-andamio-transaction.ts`): Fixed case mismatch - API returns `course_id` (snake_case) but hook was looking for `courseId` (camelCase). Side effect mapping now correctly uses `course_nft_policy_id`.
- **Missing MintModuleTokens UI** (`studio/course/[coursenft]/page.tsx`): The On-Chain tab showed "Ready to Mint" count but had no mint button. Added `MintModuleTokens` component to render when approved modules exist.
- **Undefined Modules Crash** (`studio/course/page.tsx`): Fixed crash when `onChainCourse.modules` was undefined by adding optional chaining.
- **API Schema Mismatch** (`modules-manage.ts`, `mint-module-tokens.tsx`): Updated transaction definition and component to match Atlas API's required fields: `slts`, `allowed_course_state_ids`, `prereq_slt_hashes` (removed obsolete `allowed_students_v2`, `prerequisite_assignments_v2`).

**GitHub Issues Created**:
- #23: Blocker - Course creation tx succeeds but side effect fails (fixed)
- #24: Feedback Digest - Loop 3 UX feedback

**UX Feedback Collected** (see issue #24 for details):
- Mint UI confusing, alias input hard to find (Loop 1)
- No visual feedback while waiting for tx confirmation
- Dashboard too cluttered, unclear call to action
- Module mint action was hidden in On-Chain tab

**Systemic Issues Identified**:
1. **Transaction Definition Drift**: Atlas API schema evolves but `@andamio/transactions` definitions lag behind. Need periodic audit against swagger.json.
2. **Side Effect Parameter Mapping**: The hook's API response mapping is fragile. Consider standardizing snake_case throughout or adding explicit mapping functions.

### January 7, 2026 (Session 1)

- **Contributor Dashboard**: New route `/project/[treasurynft]/contributor` for project contributors
  - Project enrollment with initial task commit
  - Task commitment workflow with evidence submission
  - Credential claiming for completed tasks
  - Stats grid showing commitments, approvals, tokens
- **Manager Dashboard**: New route `/studio/project/[treasurynft]/manager` for project managers
  - Review pending task submissions
  - Approve/deny submissions with feedback
  - Stats grid showing pending, approved, denied counts
- **8 Project Transaction Components**: Full set of project workflow transactions
  - `ProjectEnroll`, `TaskCommit`, `ProjectCredentialClaim` (contributor)
  - `TasksAssess`, `TasksManage`, `ManagersManage`, `BlacklistManage`, `CreateProject` (manager)
- **AndamioDashboardStat Component**: Reusable KPI card with icon, label, value, description
  - Semantic color support for value and icon
  - Optional description prop for sub-text
- **AndamioSearchInput Component**: Search input with integrated SearchIcon
- **Documentation Updates**: Updated SITEMAP, CHANGELOG, extracted-components.md

### January 1, 2026

- **React Query Migration Complete**: Finished migrating all primary course routes to React Query hooks
  - `course/page.tsx` - Now uses `usePublishedCourses` for course catalog
  - `course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Now uses `useCourse`, `useCourseModule`, `useLesson`
- **Hook Type Fix**: Updated `useLesson` to return `LessonWithSLTOutput` (includes SLT fields)
- **404 Handling**: Updated `usePublishedCourses` to return empty array on 404 (no courses = empty state, not error)
- **Migration Summary**: 6 pages migrated, 18 hooks available, all primary course routes now cached

### December 31, 2025 (Session 5)

- **React Query Migration**: Migrated 2 additional pages to React Query hooks
  - `course/[coursenft]/[modulecode]/page.tsx` - Now uses `useCourse`, `useCourseModule`, `useSLTs`, `useLessons`
  - `studio/course/page.tsx` - Now uses `useOwnedCoursesQuery` instead of manual fetch
- **Global Style Checker Skill**: New skill to detect CSS specificity conflicts with globals.css
- **Responsive Editor Toolbar**: Content editor toolbar now always uses compact mode with "More" dropdown menu for overflow items (alignment, lists, blocks, links, images, tables)
- **Alignment in Main Toolbar**: Added alignment options back to main toolbar as they fit without overflow
- **Wizard Navigation Fix**: Fixed lesson step → introduction navigation by checking assignment completion state properly
- **Sidebar User Info Redesign**: Access token alias now shows prominently above wallet address with smaller font size
- **Code Element Fix**: Changed `<code>` elements to `<span className="font-mono">` to avoid global style override
- **Styling Review**: Full review of `/studio/course` and `/studio/course/[coursenft]` routes, fixed raw `<input>` elements
- **Documentation Updates**: Updated CHANGELOG.md, style-rules.md with `<code>` pattern warning

### December 31, 2025 (Session 4)

- **PR Review Skill**: New comprehensive PR review skill using `gh` CLI with automatic delegation to other skills
- **Register Course Drawer**: Component for registering on-chain-only courses into database with title input
- **Credential-Focused Empty State**: Redesigned `/studio/course/[coursenft]` empty state with centered hero, credential messaging, wizard vs pro mode options
- **Conditional Tabs**: Course detail tabs only appear after first module/credential exists
- **Transaction Endpoint Fix**: Fixed COURSE_ADMIN_CREATE definition to use correct API paths for database creation
- **Documentation Updates**: Updated CHANGELOG, STATUS.md, CLAUDE.md with PR review skill

### December 29, 2025 (Session 3)

- **StudioModuleCard Extracted**: New reusable component with 6-step progress indicator, status icons
- **RequireCourseAccess loadingVariant**: Added `loadingVariant` prop to prevent loading screen "flash" during navigation
- **Silent Refetch on Save**: `useModuleWizardData` no longer shows full loading screen when saving (assignment/lesson)
- **Inline Lesson Editing**: Lessons now edited inline in wizard (like assignments), removed broken external link
- **Documentation Updates**: Updated extracted-components.md, api-coverage.md, STATUS.md

### December 29, 2025 (Session 2)

- **Blueprint → Credential Rename**: Renamed wizard step from "Blueprint" to "Credential" across all files
- **Course Preview Panel Redesign**: New hero section with stat grid (Modules, On-Chain, SLTs), centered CTA, module code list
- **SLT Reference Format**: Now uses `<module-code>.<module-index>` (e.g., "101.3") instead of sequential numbers
- **Input Border Fix**: Fixed invisible borders on form inputs via `border-border` in globals.css
- **Error Boundary Fix**: Removed duplicate html/body tags from error.tsx
- **Optimistic SLT Updates**: Fixed React render error with updateSlts calls
- **New Coding Convention**: Documented Course Module/SLT reference rules in CLAUDE.md

### December 29, 2025 (Session 1)

- **Color System Overhaul**: New sky blue primary (hue 250), swapped sidebar/background for better contrast
- **Unified Loading System**: `AndamioPageLoading`, `AndamioStudioLoading`, `AndamioCardLoading`, etc.
- **AndamioStatusIcon**: Reusable status indicator with presets (`on-chain`, `pending`, `draft`, etc.)
- **SLT Drag & Drop**: Added @dnd-kit for reordering SLTs in module wizard
- **theme-expert Skill**: New comprehensive design system skill with layouts, colors, spacing docs
- **Wizard Step Simplification**: Removed redundant description from step headers

### December 19, 2025

- **V2 Release Schedule Confirmed**: Preprod 2026-01-09, Mainnet 2026-02-06
- Created 18 React Query hooks for Course/Module/SLT/Lesson
- Migrated `course/[coursenft]/page.tsx` to React Query
- Created API recommendations document with migration roadmap
- Cleaned up project-manager documentation (deleted 5 outdated files)
- Updated STATUS.md and ROADMAP.md with release timeline

### Previous Highlights

- Completed all 15 course routes
- Implemented transaction side effects system
- Added pending transaction monitoring with Koios
- Established semantic color system
- Completed input validation across all studio pages

---

## Known Issues

1. **Transaction Definition Drift**: Atlas API schema evolves but `@andamio/transactions` definitions lag behind. Need periodic audit against swagger.json to catch missing required fields.
2. **Side Effect Parameter Mapping**: The `useAndamioTransaction` hook's API response mapping is fragile. API returns snake_case, but mappings have been inconsistent. Consider standardizing or adding explicit mapping functions.
3. **Cache Invalidation After Transactions**: Some routes require manual refresh after transactions complete. Need to audit all transaction `onSuccess` callbacks to ensure `queryClient.invalidateQueries()` is called with correct query keys. Affected: course creation, module minting, enrollment, assignment commits.
4. **Low Hook Coverage**: Most pages use `useState`/`useEffect` instead of React Query
5. **Project Routes Partial**: 6/13 routes implemented, remaining 7 routes pending (manage-treasury, manage-contributors, commitments, etc.)
6. **User Endpoints Unused**: 0% of user-related API endpoints integrated
7. **Duplicate Routes**: `/courses` and `/studio/course` show same data

---

## Legend

- **Stable**: Production-ready, no major changes expected
- **In Progress**: Active development
- **Planned**: Documented, awaiting implementation
- **Pending**: Waiting for dependencies or prioritization
