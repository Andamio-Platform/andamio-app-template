# Project Status

> **Last Updated**: January 21, 2026 (Session 23 - API Gateway URL Updated + Coverage Audit)

Current implementation status of the Andamio T3 App Template.

---

## 🚨 CURRENT: New API Gateway Migration

**Status**: 🔄 In Progress

The Andamio API Gateway has been deployed to a new URL:
- **New URL**: `https://andamio-api-gateway-666713068234.us-central1.run.app`
- **Old URL**: `https://dev-api.andamio.io` (deprecated)

### Migration Status

- ✅ All `.claude/skills/` documentation updated with new URL
- ✅ Coverage audit script updated for new path structure (`/api/v2/*` → `/v2/*`)
- ✅ Coverage report generated (63% overall - 68/108 endpoints)
- ⏳ Environment variables need updating
- ⏳ Proxy route compatibility needs verification
- ⏳ Types need regeneration from new OpenAPI spec

### Coverage Summary (January 21, 2026)

| Category | Coverage | Status |
|----------|----------|--------|
| TX: Courses | **100%** (6/6) | ✅ Complete |
| TX: Projects | **100%** (8/8) | ✅ Complete |
| Merged Projects | **85%** (17/20) | ✅ Good |
| Authentication | **83%** (5/6) | ✅ Good |
| TX: Instance/Global | **71%** (5/7) | 🔄 Minor gaps |
| Merged Courses | **55%** (23/42) | ⚠️ **19 missing** |
| API Key Management | **33%** (3/9) | ⚠️ 6 missing |
| User Management | **17%** (1/6) | ⚠️ 5 missing |
| Admin Functions | **0%** (0/4) | Low priority |

**Full details**: See `API-UPGRADE-PLAN.md` for implementation roadmap.

### Immediate Actions

1. **Update `.env`** with new gateway URL
2. **Run `npm run generate:types`** to fetch new OpenAPI spec
3. **Test core flows** (auth, courses, projects)
4. **Verify proxy route** handles new path structure

---

## ✅ RESOLVED: Course Auto-Registration Now Works

**Status**: ✅ Fixed in Gateway v2.0.0-preprod-20260119-e

**What Was Fixed**:
The TX State Machine now auto-registers courses correctly. The Gateway:
1. Captures `owner_alias` from JWT at `POST /v2/tx/register`
2. Stores it in Redis metadata alongside `code` and `title`
3. When TX confirms, calls new `POST /course/gateway/course/register` with service-to-service auth
4. Course appears with correct title automatically

**Expected Flow** (auto-registration):
1. Build TX → Sign → Submit → Get `tx_hash`
2. Register TX: `POST /v2/tx/register` (with metadata `{code, title}`)
3. Poll: `GET /v2/tx/status/{tx_hash}` until `"updated"`
4. Course auto-registered by Gateway ← **Now works!**
5. Course appears with title in UI

**Required Metadata for `course_create`**:
```json
{
  "tx_hash": "...",
  "tx_type": "course_create",
  "metadata": {
    "code": "COURSE-101",
    "title": "My Course Title",
    "description": "Optional description",
    "image_url": "https://optional-image-url.com/image.png"
  }
}
```
Note: `owner_alias` is captured automatically from JWT - no need to include it.

**Manual Fallback** (still available):
- `POST /v2/course/owner/course/register` - requires user JWT
- Useful for existing on-chain courses without DB records

**Frontend Implementation Status**:
- ✅ Added `code` field to `CreateCourseDialog` component
- ✅ Added `code` field to `CreateCourse` component
- ✅ Both components pass `{ code, title }` in metadata to `/v2/tx/register`
- ✅ Fixed API response handling for wrapped `{ data: [...] }` format
- ✅ Manual registration call after TX confirms (fallback, may not be needed now)
- ✅ `RegisterCourseDrawer` updated with `policy_id` and `code` fields

**Ready for Testing**: Create a new course to verify auto-registration works end-to-end without manual intervention.

---

## 🎯 IMMEDIATE PRIORITIES

### Current Focus: Gateway Migration + Testing

**Status**: Complete gateway URL migration, then test all flows.

**Next Steps**:
1. Update environment variables to new gateway URL
2. Regenerate types from new OpenAPI spec
3. Test authentication flow
4. Test course creation flow
5. Test project flows

### High-Priority Skills to Refine

These skills need refinement through active use as we improve the codebase:

| Skill | Priority | Purpose | Status |
|-------|----------|---------|--------|
| `react-query-auditor` | **HIGH** | Audit cache invalidation patterns across transaction callbacks. Some routes require manual refresh after transactions - need systematic audit of `queryClient.invalidateQueries()` calls. | Proposed |
| `andamioscan-event-integrator` | **HIGH** | Guide integration of 15 remaining Andamioscan Event endpoints. Would replace Koios polling with entity-specific transaction confirmation. See GitHub issue #26. | Proposed |

**Philosophy**: Refine skills by using them. As we test UX and find issues, we'll build out these skills with real-world patterns.

---

## ✅ COMPLETED: V2 Gateway API Migration

**Status**: Complete on `update/andamioscan` branch - Ready for merge to main

The unified V2 Gateway API consolidates all 3 subsystems (DB API, Andamioscan, TX API) into a single gateway. Migration completed January 17-18, 2026.

### Branch Status

**Current Branch**: `update/andamioscan` (5 commits ahead of `main`)

**Key Commits**:
1. `708c786` - use doc.json to update to API V2
2. `2c8cace` - fix "owner" role from "admin"
3. `22df8f1` - prepare for API V2
4. `96802d5` - wip: migrate to Andamio API
5. `3019cc7` - wip: task management updates

### What Was Completed

**Infrastructure**:
- ✅ Created unified gateway proxy: `/api/gateway/[...path]/route.ts`
- ✅ Created gateway client: `src/lib/gateway.ts`
- ✅ Removed old proxy routes (`/api/andamioscan/`, `/api/atlas-tx/`)
- ✅ Removed `NEXT_PUBLIC_ANDAMIO_API_URL` env var (legacy DB API URL)
- ✅ Deleted `src/hooks/use-andamioscan.ts` and `src/hooks/api/use-andamioscan.ts` (merged into gateway)

**Auth Endpoints (v1 → v2)**:
- ✅ `/api/v1/auth/login` → `/api/v2/auth/login`
- ✅ `/api/v1/auth/register` → `/api/v2/auth/register`
- ✅ `/api/v1/apikey/*` → `/api/v2/apikey/*`
- ✅ Legacy auth (session/validate) now uses gateway: `/api/v2/auth/login/session`

**Type Generation**:
- ✅ Removed `@andamio/db-api-types` NPM dependency
- ✅ Added `npm run generate:types` script (uses `swagger-typescript-api`)
- ✅ Types generated from `doc.json` to `src/types/generated/gateway.ts`
- ✅ Strict type re-exports in `src/types/generated/index.ts`

**All API Calls Migrated**:
- ✅ 60+ files updated to use `/api/gateway/api/v2/*` paths
- ✅ All hooks, components, and pages now use gateway proxy
- ✅ Side effects use gateway base URL
- ✅ New hooks created: `use-contributor-projects.ts`, `use-manager-projects.ts`, `use-project.ts`, `use-student-courses.ts`, `use-teacher-courses.ts`

**New Provider Components**:
- ✅ `src/components/providers/auth-provider.tsx` - Auth context wrapper
- ✅ `src/components/providers/pending-tx-provider.tsx` - Pending transaction context

---

## ✅ COMPLETED: V2 Transaction Migration

**Status**: Complete (January 19, 2026) - All transaction components migrated to gateway auto-confirmation

### Session 18 Summary (January 18, 2026)

**Completed**: V2 Transaction Hook + Gateway Auto-Confirmation

Created new simplified transaction system that leverages gateway auto-confirmation instead of client-side Koios polling.

**New Files Created**:
1. `src/hooks/use-simple-transaction.ts` - Simplified TX hook (BUILD → SIGN → SUBMIT → REGISTER)
2. `src/hooks/use-tx-watcher.ts` - Gateway status polling hook + TX registration helper
3. `src/components/transactions/mint-access-token-simple.tsx` - Reference implementation
4. `src/config/transaction-ui.ts` - Added `requiresDBUpdate` flag to all 17 TX types
5. `src/config/transaction-schemas.ts` - Zod validation schemas for TX params
6. `.claude/skills/audit-api-coverage/tx-state-machine.md` - Full API documentation
7. `.claude/skills/project-manager/TX-MIGRATION-GUIDE.md` - Step-by-step migration guide

**Key Changes**:
- Added `requiresDBUpdate: boolean` to `TransactionUIConfig` interface
- Access Token Mint uses `requiresDBUpdate: false` (pure on-chain, no DB tracking)
- All other TXs use `requiresDBUpdate: true` (gateway monitors and updates DB)
- `useSimpleTransaction` only registers TXs that need DB updates
- `useTxWatcher` polls `/api/v2/tx/status/:hash` for confirmation status

**TX State Machine States**:
- `pending` → TX submitted, awaiting confirmation
- `confirmed` → TX on-chain, processing DB updates
- `updated` → Success (terminal)
- `failed` / `expired` → Error (terminal)

**Gateway Endpoints Used**:
- `POST /api/v2/tx/register` - Register TX after wallet submit
- `GET /api/v2/tx/status/:tx_hash` - Poll individual TX status

**Testing Results**:
- ✅ Access Token Mint transaction builds successfully
- ✅ Wallet signing works
- ✅ TX submits to blockchain
- ✅ UI shows success immediately for pure on-chain TXs
- ✅ No more "stuck" registering state for Access Token Mint

**Migration Checklist** (see TX-MIGRATION-GUIDE.md for full details):
| TX Type | requiresDBUpdate | Migrated |
|---------|------------------|----------|
| GLOBAL_GENERAL_ACCESS_TOKEN_MINT | `false` | ✅ |
| INSTANCE_COURSE_CREATE | `true` | ✅ |
| INSTANCE_PROJECT_CREATE | `true` | ✅ |
| COURSE_OWNER_TEACHERS_MANAGE | `true` | ✅ |
| COURSE_TEACHER_MODULES_MANAGE | `true` | ✅ |
| COURSE_TEACHER_ASSIGNMENTS_ASSESS | `true` | ✅ |
| COURSE_STUDENT_ASSIGNMENT_COMMIT | `true` | ✅ |
| COURSE_STUDENT_ASSIGNMENT_UPDATE | `true` | ✅ |
| COURSE_STUDENT_CREDENTIAL_CLAIM | `true` | ✅ |
| PROJECT_OWNER_MANAGERS_MANAGE | `true` | ✅ |
| PROJECT_OWNER_BLACKLIST_MANAGE | `true` | ✅ |
| PROJECT_MANAGER_TASKS_MANAGE | `true` | ✅ |
| PROJECT_MANAGER_TASKS_ASSESS | `true` | ✅ |
| PROJECT_CONTRIBUTOR_TASK_COMMIT | `true` | ✅ |
| PROJECT_CONTRIBUTOR_TASK_ACTION | `true` | ✅ |
| PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM | `true` | ✅ |
| PROJECT_USER_TREASURY_ADD_FUNDS | `true` | ⏳ |

**Status**: ✅ **COMPLETE** (January 18, 2026) - All 16 core transaction components migrated to V2.

**Next Steps**:
1. Treasury transactions pending backend implementation
2. ~~Consider deprecating `useAndamioTransaction` hook (V1)~~ ✅ Done (Session 19)

### Session 20 Summary (January 18, 2026)

**Completed**: Auth Response Fix + Teacher/Manager API Response Handling

Fixed critical issues blocking authentication and role-based data fetching.

**Auth Response Fix** (`src/lib/andamio-auth.ts`):
- Gateway `/api/v2/auth/login/validate` response structure didn't match expectations
- **Old expectation**: `{ token, user: { stake_address, access_token_alias } }`
- **Actual response**: `{ jwt, user: { id, cardano_bech32_addr, access_token_alias } }`
- Updated `ValidateSignatureApiResponse` interface and extraction logic

**Teacher/Manager API Response Handling**:
- Gateway merged endpoints return `content` nested object, not flat fields
- **API returns**: `{ content: { title, code, live } }`
- **UI expected**: `{ title, course_code }`
- Added content flattening in hooks: `useTeacherCourses`, `useManagerProjects`
- Updated `source` value from `"on-chain-only"` to `"chain_only"` across 4 files

**Files Modified**:
- `src/lib/andamio-auth.ts` - Fixed response parsing
- `src/hooks/api/use-teacher-courses.ts` - Added content flattening + debug logging
- `src/hooks/api/use-manager-projects.ts` - Added content flattening + debug logging
- `src/hooks/api/use-contributor-projects.ts` - Fixed source value in type comment
- `src/app/(studio)/studio/course/page.tsx` - Fixed source comparison
- `src/app/(app)/studio/project/page.tsx` - Fixed source comparison

**Testing Status**:
- ✅ Authentication working (JWT properly extracted)
- ✅ Teacher courses loading (6 courses for "james")
- ✅ Manager projects loading (pending verification)
- ⏳ Transactions not yet tested this session

**Next Steps**:
1. Test transaction flows (mint, commit, assess, claim)
2. Remove debug logging once verified
3. Merge to main when all flows confirmed working

---

### Session 19 Summary (January 18, 2026)

**Completed**: V2 Transaction Migration Finalization + V1 Deprecation

Migrated remaining transaction components to V2 pattern and added deprecation notices to V1 patterns.

**Components Migrated to V2**:
| Component | TX Type | Change |
|-----------|---------|--------|
| `BurnModuleTokens` | `COURSE_TEACHER_MODULES_MANAGE` | Changed to `useSimpleTransaction` + `useTxWatcher` |
| `ProjectCredentialClaim` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | Changed to `useSimpleTransaction` + `useTxWatcher` |
| `CreateCourseDialog` | `INSTANCE_COURSE_CREATE` | Changed to `useSimpleTransaction` |

**Key Clarification**: `BurnModuleTokens` uses the unified `/api/v2/tx/course/teacher/modules/manage` endpoint - there is no separate burn endpoint. The same endpoint handles mint, update, AND burn operations.

**Deprecation Notices Added**:
| Component/Hook | Status | Replacement |
|----------------|--------|-------------|
| `useAndamioTransaction` | `@deprecated` | `useSimpleTransaction` + `useTxWatcher` |
| `AndamioTransaction` | `@deprecated` | Specific TX components (e.g., `TaskCommit`, `EnrollInCourse`) |
| `PendingTxIndicator` | `@deprecated` | Individual component TX tracking via `useTxWatcher` |

**V1 Migration Complete** (January 19, 2026):
- ✅ `instructor/page.tsx` - Migrated to `useSimpleTransaction` + `useTxWatcher`
- ✅ `assignment-commitment.tsx` - Migrated to `useSimpleTransaction` + `useTxWatcher`
- All V1 components (`AndamioTransaction`, `useAndamioTransaction`) remain for backwards compatibility but have no active users

**Hash Utilities Migrated** (January 19, 2026):
- Moved from `@andamio/transactions` to `~/lib/utils/`:
  - `computeSltHashDefinite` → `~/lib/utils/slt-hash.ts`
  - `computeAssignmentInfoHash` → `~/lib/utils/assignment-info-hash.ts`
  - `computeTaskHash` → `~/lib/utils/task-hash.ts`
- Removed `blakejs` and `cbor` dependencies from `@andamio/transactions`
- Dev script simplified: `npm run dev` now runs just Next.js

**Build Status**: ✅ TypeScript passes with no errors

**Remaining Task**:
- React-query cache invalidation audit (from original todo list)

### Session 18 Summary (January 18, 2026)

**Completed**: V2 Transaction System Migration Complete

Migrated all 16 remaining transaction components from V1 (`useAndamioTransaction` + client-side Koios polling) to V2 (`useSimpleTransaction` + `useTxWatcher` + gateway auto-confirmation).

**Components Migrated**:
- `mint-module-tokens.tsx` - COURSE_TEACHER_MODULES_MANAGE
- `enroll-in-course.tsx` - COURSE_STUDENT_ASSIGNMENT_COMMIT
- `assignment-update.tsx` - COURSE_STUDENT_ASSIGNMENT_UPDATE/COMMIT
- `task-commit.tsx` - PROJECT_CONTRIBUTOR_TASK_COMMIT
- `task-action.tsx` - PROJECT_CONTRIBUTOR_TASK_ACTION
- `tasks-manage.tsx` - PROJECT_MANAGER_TASKS_MANAGE
- `tasks-assess.tsx` - PROJECT_MANAGER_TASKS_ASSESS

**Schema Updates** (`~/config/transaction-schemas.ts`):
- Added optional side effect params to all Zod schemas
- Params like `module_code`, `network_evidence`, `task_hash`, `evidence` now properly typed
- Enables gateway to process DB updates via TxTypeRegistry

**Documentation Updated**:
- `TX-MIGRATION-GUIDE.md` - Marked all TX types as ✅
- `TRANSACTION-COMPONENTS.md` - Rewrote for V2 architecture
- `BACKLOG.md` - Marked `tx-migration-guide` skill as complete
- `STATUS.md` - This summary

---

### Session 17 Summary (January 18, 2026)

**Completed**: V2 API Migration Fixes - Import Errors Resolved

Fixed remaining TypeScript errors after the V2 Gateway API migration. All components now use the correct V2 hooks with merged API types.

**Files Modified**:
1. `src/components/instructor/pending-reviews-list.tsx`
   - Changed `usePendingAssessments` → `useTeacherCommitments` hook
   - Removed `accessTokenAlias` prop (hook uses auth context internally)
   - Updated type from `OrchestrationTeacherAssignmentCommitmentItem` → `TeacherAssignmentCommitment`

2. `src/app/(app)/studio/project/[projectid]/commitments/page.tsx`
   - Rewrote to use `useManagerCommitments` and `useProject` hooks
   - Removed manual `useEffect` fetch pattern
   - Fixed `project.states?.[0]?.project_state_policy_id` → `project.contributor_state_id`
   - Updated type to `OrchestrationProjectTaskOnChain`

3. `src/components/transactions/course-prereqs-selector.tsx`
   - Changed `useTeachableCoursesWithDetails` → `useTeacherCoursesWithModules` hook
   - Removed `userAlias` prop

4. `src/components/transactions/create-project.tsx`
   - Removed `userAlias` prop from `CoursePrereqsSelector` usage

5. `src/app/(app)/studio/course/[coursenft]/instructor/page.tsx`
   - Removed `accessTokenAlias` prop from `PendingReviewsList` usage

**New Hooks Added**:
- `useManagerCommitments(projectId?)` - Fetch pending task commitments for managers
- `useTeacherCoursesWithModules()` - Fetch teacher courses with module details for prereq selection

**New Types Exported**:
- `ManagerCommitment` - Task commitment data for managers
- `ManagerCommitmentsResponse` - Response wrapper
- `TeacherCourseWithModules` - Course with module array for prereq selector

**Build Status**: ✅ TypeScript passes with no errors

### Session 16 Summary (January 18, 2026)

**Completed**: Full V2 Gateway API Migration

This session completed the comprehensive migration from 3 separate APIs to the unified V2 Gateway API.

**Files Changed** (~160 files):
- Infrastructure: New gateway proxy, client, types
- Hooks: Migrated all API hooks to gateway endpoints
- Components: Updated all transaction and data-fetching components
- Pages: Updated all route pages to use new API paths
- Providers: Added new auth and pending-tx provider components

**Key Changes**:
1. **Single Gateway Proxy** - All API calls now route through `/api/gateway/[...path]`
2. **Generated Types** - Types now generated from `doc.json` OpenAPI spec via `npm run generate:types`
3. **Role Naming** - Fixed "admin" → "owner" role naming in project TX endpoints
4. **Merged Endpoints** - Frontend now uses merged endpoints that combine DB + on-chain data
5. **Removed Legacy Code** - Deleted old Andamioscan hooks, separate proxy routes

**New Files Created**:
- `src/lib/gateway.ts` - Gateway client functions
- `src/lib/andamio-gateway.ts` - Merged endpoint helpers
- `src/types/generated/gateway.ts` - Auto-generated types (1672+ lines)
- `src/types/generated/index.ts` - Strict type re-exports (301 lines)
- `src/hooks/api/use-contributor-projects.ts`
- `src/hooks/api/use-manager-projects.ts`
- `src/hooks/api/use-project.ts`
- `src/hooks/api/use-student-courses.ts`
- `src/hooks/api/use-teacher-courses.ts`
- `src/components/providers/auth-provider.tsx`
- `src/components/providers/pending-tx-provider.tsx`

**Deleted Files**:
- `src/app/api/andamioscan/[...path]/route.ts`
- `src/app/api/atlas-tx/[...path]/route.ts`
- `src/hooks/use-andamioscan.ts`
- `src/hooks/api/use-andamioscan.ts`

### Session 15 Summary (January 16, 2026)

**Resolved**: Andamioscan issue #11 - `task_id` now populated

The blocker that was preventing reliable task matching in pending assessments and submissions has been fixed upstream. This unblocks:
- Assessment sync functionality
- Reliable task matching (no more lovelace/content fallback needed)
- Full contributor flow testing

**What's Now Possible**:
1. ✅ Pending assessments show correct `task_id`
2. ✅ Submissions show correct `task_id`
3. ✅ Assessment sync can use direct task lookup
4. ✅ End-to-end contributor flow can be fully tested

### Session 14 Summary

**Completed**: Task Hash Utility for on-chain task ID computation

The `@andamio/transactions` package now includes utilities to compute task hashes locally that match on-chain task IDs. This enables:
- Pre-computing task IDs before transaction submission
- Verifying on-chain task IDs match expected values
- Linking TX request data to resulting on-chain assets

**New Exports** from `@andamio/transactions`:
- `computeTaskHash(task)` - Compute Blake2b-256 hash matching on-chain format
- `verifyTaskHash(task, expectedHash)` - Verify a hash matches
- `isValidTaskHash(hash)` - Validate hash format (64-char hex)
- `debugTaskCBOR(task)` - Debug: show CBOR encoding before hashing
- `TaskData` type - Task data structure for hashing

**Technical Details**:
- Uses Plutus Constr 0 with indefinite-length arrays (0x9f...0xff)
- Blake2b-256 hashing (32 bytes / 64 hex chars)
- Validated against real on-chain transaction data

**Files**:
- `packages/andamio-transactions/src/utils/task-hash.ts` - Implementation
- `packages/andamio-transactions/src/utils/__tests__/task-hash.test.ts` - 10 tests (all passing)

### Session 13 Summary

**Fixed**: Task commitment `contributor_state_policy_id` issue

**Discovery**: Andamioscan issue #10 was fixed - now returns `contributor_state_policy_id` in each task object.

**Implementation**:
1. Updated `AndamioscanTask` type to include `contributor_state_policy_id`
2. Added `contributorStatePolicyId` prop to `TaskCommit` component
3. Updated task-commit transaction definition schema
4. Added helper function `getOnChainContributorStatePolicyId()` in contributor page
5. Task detail page now fetches on-chain task from Andamioscan for the policy ID

**Files Changed**:
- `src/lib/andamioscan.ts` - Updated types
- `src/components/transactions/task-commit.tsx` - Added `contributorStatePolicyId` prop
- `packages/andamio-transactions/src/definitions/v2/project/contributor/task-commit.ts` - Updated schema
- `src/app/(app)/project/[projectid]/contributor/page.tsx` - Added helper and props
- `src/app/(app)/project/[projectid]/[taskhash]/page.tsx` - Fetches on-chain task

**Next Step**: Atlas TX API fix deploying soon. Once deployed, test task commit end-to-end.

### Session 12 Summary (Previous)

**Tested**: Second task commitment (contributor commits to new task after first task accepted)

**Blocker Found**: Atlas TX API `/v2/tx/project/contributor/task/commit` has swagger/implementation mismatch.

**Details**:
- Swagger documents flat fields: `alias`, `project_id`, `contributor_state_id`, `task_hash`, `task_info`
- Backend internally transforms these into a `tasks` array
- Backend expects `contributor_state_policy_id` inside each task object
- This field is NOT documented in swagger
- We tested multiple variations but all fail with same error

**Error Message**:
```
Error in $.tasks[0]: parsing API.ProjectInstance.Task(Task) failed, key "contributor_state_policy_id" not found
```

**Proxy Logs Confirm**: We send correct flat fields, but backend creates `tasks[]` internally and expects undocumented fields.

**Resolution**: Andamioscan issue #10 provided the missing field. Client-side fix implemented in Session 13.

### Previous Session (Session 11)

**Manager Assess Transaction Fixed**:
1. Fixed `task_decisions` array - changed `task_hash` to `alias` to match API schema
2. Fixed DB API side effect - changed `decision` from lowercase (`accept`) to uppercase (`ACCEPTED`) to match API expectations
3. Transaction now successfully submits on-chain AND updates DB

**Task Matching for Pending Assessments**:
- Andamioscan returns empty `task_id` in pending assessments (known issue #11)
- Implemented fallback matching by `lovelace` or `content` to identify tasks
- UI now shows matched task info instead of "Unknown Task"

**Transaction Confirmation Flow**:
- Added `confirmCommitmentTransaction()` function to sync DB after on-chain confirmation
- Check Confirmation button now properly updates DB status from `PENDING_TX_SUBMIT` to `SUBMITTED`

### Upstream Fixes: All Resolved ✅

**Blocker 1**: Atlas TX API - Task Commit ✅ **RESOLVED**
- Client-side fix implemented (Session 13)
- Andamioscan issue #10 fixed - now returns `contributor_state_policy_id` per task

**Blocker 2**: Andamioscan Issue #11 - Empty `task_id` ✅ **RESOLVED (Jan 16)**
- `pending_assessments[].task.task_id` now populated
- `submissions[].task.task_id` now populated
- Assessment sync functionality unblocked

**Status**: All major blockers resolved. Full end-to-end testing possible.

---

## API Coverage Summary (Unified Gateway)

| Category | Endpoints | Implemented | Coverage | Priority |
|----------|-----------|-------------|----------|----------|
| **TX: Courses** | 6 | 6 | **100%** | ✅ Complete |
| **TX: Projects** | 8 | 8 | **100%** | ✅ Complete |
| **Merged Projects** | 20 | 17 | **85%** | Low |
| **Authentication** | 6 | 5 | **83%** | Low |
| **TX: Instance/Global** | 7 | 5 | **71%** | Medium |
| **Merged Courses** | 42 | 23 | **55%** | **High** |
| **API Key Management** | 9 | 3 | **33%** | Medium |
| **User Management** | 6 | 1 | **17%** | Medium |
| **Admin Functions** | 4 | 0 | **0%** | Low |
| **Overall** | **108** | **68** | **63%** | - |

> Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.
> Full report: `.claude/skills/audit-api-coverage/COVERAGE-REPORT.md`
> Implementation plan: `.claude/skills/project-manager/API-UPGRADE-PLAN.md`

### API Source of Truth

**Always use the deployed API schema as the source of truth:**
- **Gateway URL**: `https://andamio-api-gateway-666713068234.us-central1.run.app`
- **OpenAPI Spec**: `https://andamio-api-gateway-666713068234.us-central1.run.app/api/v1/docs/doc.json`

When implementing new endpoints or debugging API issues, fetch the live schema rather than reading local code.

---

## Current Blockers

| Blocker | Status | Impact |
|---------|--------|--------|
| **SLT Endpoints Schema Mismatch** | 🚨 **Blocking** | SLT create/update/delete endpoints expect camelCase (`policyId`, `moduleCode`, `sltText`) while all other teacher endpoints use snake_case. Even with camelCase, returns "Invalid request body". **GitHub Issue**: [andamio-api#3](https://github.com/Andamio-Platform/andamio-api/issues/3) |
| **Course Creation Metadata** | ✅ **Resolved** | Auto-registration now works! Gateway v2.0.0-preprod-20260119-e captures `owner_alias` from JWT and uses service-to-service auth. |
| **Atlas TX API Task Commit** | ✅ **Resolved** | Client-side fix implemented. End-to-end testing ready. |
| **Andamioscan task_id Empty** | ✅ **Resolved (Jan 16)** | Issue #11 fixed - `task_id` now populated in pending assessments/submissions. |
| **Project V2 Task Update/Delete** | 🚨 **Blocking** | API returns 404 for existing tasks. Bug reported to DB API team. |
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

## Session Notes (January 15, 2026) - Session 11: Manager Assess Transaction Fixes

**Context**: Testing and fixing the Manager Assess transaction for Project V2.

### Manager Assess Transaction Fixes

**Problem 1**: Transaction API returned 400 Bad Request with "key 'alias' not found"
- **Root Cause**: `task_decisions` array was sending `{ task_hash, outcome }` instead of `{ alias, outcome }`
- **Fix**: Updated `tasks-assess.tsx` line 119 to use `alias: contributorAlias`

**Problem 2**: DB API side effect returned 400 Bad Request
- **Root Cause**: DB API expects uppercase decision values (`ACCEPTED`, `REFUSED`, `DENIED`) but code was sending lowercase (`accept`, `refuse`, `deny`)
- **Fix**:
  1. Updated transaction definition schema to use uppercase enum values
  2. Added `outcomeToDbDecision` mapping in component
  3. Component now sends `decision: outcomeToDbDecision[decision]`

### Task Matching for Pending Assessments

Andamioscan returns empty `task_id` in pending assessments (issue #11). Implemented workaround:

```typescript
const findMatchingTask = (assessment) => {
  // Try by task_id first
  if (assessment.task_id) return taskMap.get(assessment.task_id);
  // Fallback: match by lovelace
  if (assessment.task_lovelace > 0) return taskByLovelace.get(assessment.task_lovelace);
  // Fallback: match by content
  if (assessment.task_content) return taskByContent.get(assessment.task_content);
  return undefined;
};
```

### Files Modified

**`packages/andamio-transactions/src/definitions/v2/project/manager/tasks-assess.ts`**:
- Updated `sideEffectParams.decision` enum to uppercase: `["ACCEPTED", "REFUSED", "DENIED"]`

**`src/components/transactions/tasks-assess.tsx`**:
- Fixed `task_decisions` to use `alias` instead of `task_hash`
- Added `outcomeToDbDecision` mapping for uppercase conversion
- Updated `decision` param to use mapping

**`src/lib/andamioscan.ts`**:
- Updated `RawApiProjectPendingAssessment` type to match actual API structure
- Added `task_lovelace` and `task_content` fields to `AndamioscanProjectPendingAssessment`

**`src/app/(app)/studio/project/[projectid]/commitments/page.tsx`**:
- Added task matching maps (`taskByLovelace`, `taskByContent`)
- Added `findMatchingTask()` and `getEffectiveTaskId()` functions
- Updated table to show matched task info

**`src/lib/project-commitment-sync.ts`**:
- Added `confirmCommitmentTransaction()` function for DB sync after on-chain confirmation

### Decision: Wait for Andamioscan Fix

Assessment sync functionality deferred until https://github.com/Andamio-Platform/andamioscan/issues/11 is resolved. Manual cleanup is acceptable for now.

---

## Session Notes (January 15, 2026) - Session 10: Contributor Commitment Sync & API Field Fixes

**Context**: Completing the contributor view for commitment sync and fixing Andamioscan API field names.

### Andamioscan API Field Name Fixes

Discovered the API uses different field names than expected. Updated `src/lib/andamioscan.ts`:

| Expected Field | Actual API Field |
|---------------|------------------|
| `pending_submissions` | `tasks_submitted` |
| `completed_tasks` | `tasks_accepted` |
| `credentials` | `claimed_credentials` |

### Contributor Sync UI Implementation

Added sync UI to contributor page (`/project/[projectid]/contributor`) that:
- Shows on-chain submission when DB record is missing
- Matches submission to DB task by `task_hash` or `lovelace`
- Provides sync button to create DB commitment from on-chain data

### Manager Task Sync (Separation of Concerns)

Initially implemented task hash sync in contributor view, but moved to Project Studio:
- Contributor tried to sync but got 403 (no permission to list all tasks)
- Task hash sync requires manager permissions
- Now shows warning in Project Studio when tasks need hash sync
- Contributors only sync their own commitments, not project tasks

### DB API Issues Resolved

**Issue**: `batch-status` endpoint rejected `ON_CHAIN` → `ON_CHAIN` transitions when just adding `task_hash`
- Created GitHub issue #11 on andamio-db-api repo
- User confirmed: "Resolved. We have a new endpoint on the way too"

### GitHub Issues Created

| Issue | Repository | Description |
|-------|------------|-------------|
| **#47** | andamio-t3-app-template | Auto-logout when wallet account changes (request to @zootechdrum) |
| **#11** | andamio-db-api | batch-status should allow same-status transitions for task_hash updates |

### Files Modified

**`src/lib/andamioscan.ts`**:
- Fixed contributor status field names
- Added `AndamioscanTaskSubmission` type
- Updated `AndamioscanContributorStatus` type with new fields

**`src/app/(app)/project/[projectid]/contributor/page.tsx`**:
- Added sync UI for on-chain submissions missing DB records
- Better error message when task not found (tells user to ask manager to sync)
- Matches on-chain submission to DB task for verification

**`src/app/(app)/studio/project/[projectid]/page.tsx`**:
- Enhanced sync warning to detect tasks needing hash sync
- Added `tasksNeedingHashSync` count
- More prominent warning explaining contributors are blocked until sync

**`src/lib/project-commitment-sync.ts`**:
- Added logging to `createCommitmentRecord`
- Handle missing tx_hash gracefully

### Testing Status

- **User testing**: Contributor sync flow in progress
- **New endpoint**: DB API deploying new task hash update endpoint

---

## Session Notes (January 14, 2026) - Session 9: Contributor Transaction Model & Commitment Sync

**Context**: Documenting the Contributor transaction model and implementing commitment sync for manager view.

### Key Documentation Created

| Document | Location | Purpose |
|----------|----------|---------|
| **CONTRIBUTOR-TRANSACTION-MODEL.md** | `.claude/skills/project-manager/` | Complete documentation of 3-transaction contributor lifecycle (COMMIT, ACTION, CLAIM) |

### New Features Implemented

| Feature | Files | Description |
|---------|-------|-------------|
| **Commitments Page** | `src/app/(app)/studio/project/[projectid]/commitments/page.tsx` | Manager view for pending task assessments |
| **Commitment Sync Utility** | `src/lib/project-commitment-sync.ts` | Sync on-chain submissions to DB commitment records |
| **Project Eligibility** | `src/lib/project-eligibility.ts` | Check contributor eligibility for tasks |
| **DB Status Check** | Added to commitments page | Shows which commitments exist in DB vs on-chain only |

### Commitment Sync Flow

When on-chain submissions exist but DB records are missing (due to failed side effects during original commit):

1. Manager views pending assessments from Andamioscan
2. "DB Status" column shows ✅ (exists) or ⚠️ "Missing"
3. Click "Sync" button to create DB record from on-chain data
4. Calls: `create` → `submit` → `confirm-tx` endpoints
5. Assessment can then proceed normally

### Key API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `GET /v2/projects/managers/{alias}/assessments/pending` | Andamioscan: pending assessments |
| `POST /project-v2/contributor/commitment/get` | Check if DB record exists |
| `POST /project-v2/contributor/commitment/create` | Create commitment record |
| `POST /project-v2/contributor/commitment/submit` | Submit with evidence |
| `POST /project-v2/contributor/commitment/confirm-tx` | Confirm transaction |

### Transaction Component Updates

| Component | Change |
|-----------|--------|
| `task-commit.ts` | Made side effects non-critical (Issue #44) |
| `task-action.ts` | Updated for evidence update flow |
| `tasks-assess.ts` | Fixed schema: `task_hash` → `alias` in task_decisions |

### Files Changed (Uncommitted)

**New Files**:
- `src/app/(app)/studio/project/[projectid]/commitments/page.tsx`
- `src/lib/project-commitment-sync.ts`
- `src/lib/project-eligibility.ts`
- `.claude/skills/project-manager/CONTRIBUTOR-TRANSACTION-MODEL.md`

**Modified Transaction Definitions**:
- `packages/andamio-transactions/src/definitions/v2/project/contributor/task-commit.ts`
- `packages/andamio-transactions/src/definitions/v2/project/contributor/task-action.ts`
- `packages/andamio-transactions/src/definitions/v2/project/manager/tasks-assess.ts`

**Modified Components**:
- `src/components/transactions/task-commit.tsx`
- `src/components/transactions/task-action.tsx`
- `src/components/transactions/tasks-assess.tsx`
- `src/components/transactions/project-enroll.tsx`

### Known Issues / Bugs Remaining

1. **Sync button may fail** - Need to test with actual pending assessments
2. **DB status check** - Currently checks via contributor endpoint (may need manager endpoint)
3. **Task hash validation** - Some edge cases with task_hash not in DB

### GitHub Issues

| Issue | Title |
|-------|-------|
| **#43** | Task hash validation fails when task not synced to DB |
| **#44** | Make side effects non-critical until task sync implemented |

---

## Session Notes (January 14, 2026) - Session 8: Project V2 API Integration Testing

**Context**: Testing Project V2 API endpoints with live preprod data.

### Completed This Session

| Task | Details |
|------|---------|
| **Project Register Endpoint** | Requested and integrated new `POST /project-v2/owner/project/register` endpoint. Allows registering on-chain projects to DB with title. |
| **Managers Sync** | Tested `POST /project-v2/owner/managers/sync` - working correctly. |
| **Task Create** | `POST /project-v2/manager/task/create` working - created 4 draft tasks. |
| **Manager Tasks List Endpoint** | Requested and integrated new `GET /project-v2/manager/tasks/{policy_id}` - returns all tasks including DRAFT status. |
| **Draft Tasks Page Fix** | Updated to use manager endpoint (was using public endpoint that only returns ON_CHAIN tasks). |
| **Project Dashboard Fix** | Updated task fetch to use manager endpoint for accurate task counts. |
| **Edit Task Page Fix** | Updated to use manager endpoint for loading draft tasks. |

### API Endpoints Requested & Deployed

| Endpoint | Version | Purpose |
|----------|---------|---------|
| `POST /project-v2/owner/project/register` | v1.3.1 | Register on-chain project to DB with title |
| `GET /project-v2/manager/tasks/{policy_id}` | v1.3.3 | List all tasks including DRAFT status |

### Project V2 Testing Status

| Feature | Status | Notes |
|---------|--------|-------|
| Project Register | ✅ Working | Owner can register on-chain project with title |
| Managers Sync | ✅ Working | Syncs on-chain managers to DB |
| Task Create | ✅ Working | Manager can create draft tasks |
| Task List | ✅ Working | Shows all tasks including drafts |
| Task Update | ❌ Blocked | API returns 404 "Task not found" |
| Task Delete | ❌ Blocked | API returns 404 "Task not found" |
| Publish Tasks | ⏳ Pending | Waiting for update/delete fix |

### Files Modified (Uncommitted)

- `package.json` / `package-lock.json` - @andamio/db-api-types v1.3.3
- `src/app/(app)/studio/project/page.tsx` - Register endpoint integration
- `src/app/(app)/studio/project/[projectid]/page.tsx` - Manager tasks endpoint
- `src/app/(app)/studio/project/[projectid]/draft-tasks/page.tsx` - Manager tasks endpoint
- `src/app/(app)/studio/project/[projectid]/draft-tasks/new/page.tsx` - Better error handling, toast
- `src/app/(app)/studio/project/[projectid]/draft-tasks/[taskindex]/page.tsx` - Manager tasks endpoint

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
| Project System | In Progress | 10/13 routes, 9 transaction components |
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

### Routes: 10/13 Implemented

**Public (Contributor)** - 4/4 routes:
- `/project` - ✅ Project catalog
- `/project/[projectid]` - ✅ Project detail with tasks
- `/project/[projectid]/contributor` - ✅ Contributor dashboard (enroll, commit, claim)
- `/project/[projectid]/[taskhash]` - ✅ Task detail with commitment

**Studio (Manager)** - 6/9 routes:
- `/studio/project` - ✅ Project management
- `/studio/project/[projectid]` - ✅ Project dashboard
- `/studio/project/[projectid]/manager` - ✅ Manager dashboard (review submissions)
- `/studio/project/[projectid]/draft-tasks` - ✅ Task list management
- `/studio/project/[projectid]/draft-tasks/new` - ✅ Create new task
- `/studio/project/[projectid]/draft-tasks/[taskindex]` - ✅ Edit existing task
- `/studio/project/[projectid]/manage-treasury` - Planned
- `/studio/project/[projectid]/manage-contributors` - Planned
- `/studio/project/[projectid]/commitments` - Planned

### Transaction Components: 8 Created

**Contributor Transactions** (3 total for entire lifecycle):
| Component | Definition | Purpose | Status |
|-----------|------------|---------|--------|
| `TaskCommit` | `PROJECT_CONTRIBUTOR_TASK_COMMIT` | Enroll + Claim Rewards + Commit to Task | Active |
| `TaskAction` | `PROJECT_CONTRIBUTOR_TASK_ACTION` | Update Evidence OR Cancel Commitment | Active |
| `ProjectCredentialClaim` | `PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM` | Unenroll + Get Credential + Claim Rewards | Active |

**Key Model**: COMMIT handles enrollment automatically. Rewards claimed with next COMMIT or CLAIM.

**Manager/Owner Transactions**:
| Component | Purpose | Status |
|-----------|---------|--------|
| `TasksAssess` | Manager: assess task submissions | Active |
| `TasksManage` | Manager: manage project tasks | Active |
| `ManagersManage` | Manager: manage project managers | Active |
| `BlacklistManage` | Manager: manage blacklist | Active |
| `CreateProject` | Create new project treasury | Active |

**Deprecated**: `ProjectEnroll` - use `TaskCommit` for all commit scenarios including first enrollment.

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
- `POST /course/get` → `GET /course/user/course/get/{policy_id}`
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
5. **Project Routes Partial**: 10/13 routes implemented, remaining 3 routes pending (manage-treasury, manage-contributors, commitments)
6. **User Endpoints Unused**: 0% of user-related API endpoints integrated
7. **Duplicate Routes**: `/courses` and `/studio/course` show same data

---

## Legend

- **Stable**: Production-ready, no major changes expected
- **In Progress**: Active development
- **Planned**: Documented, awaiting implementation
- **Pending**: Waiting for dependencies or prioritization
