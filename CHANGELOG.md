# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Custom ConnectWalletButton** (February 8, 2026): Replaced Mesh SDK `CardanoWallet` with custom `ConnectWalletButton` component
  - New `src/components/auth/connect-wallet-button.tsx` — uses Mesh hooks (`useWallet`, `useWalletList`) with shadcn Dialog/Button/DropdownMenu/Tooltip
  - Eliminates `@meshsdk/react/styles.css` import that bundled a full TW3 preflight conflicting with our design system
  - Removed `isDark`/`mounted`/`useTheme`/`WEB3_SERVICES_CONFIG` boilerplate from all wallet-consuming components
  - Updated all landing cards, auth components, migrate page, and TX components to use new component
  - Removed `import "@meshsdk/react/styles.css"` from root layout
- **Simplified Assignment Commitment Lifecycle** (February 8, 2026): Updated frontend for simplified commitment status model
  - `getStatusFromCommitment()` simplified: COMMITTED is now the base state (replaces ASSIGNED/REQUESTED)
  - Studio commitments page and module card updated for new status flow
  - `useStudentAssignmentCommitments` hook updated for simplified API response
  - Removed legacy status branches that mapped to obsolete states
- **CSS Cleanup** (February 8, 2026): Major cleanup of `globals.css`
  - Removed obsolete wallet-related styles (Mesh CardanoWallet overrides no longer needed)
  - Consolidated cascade layer structure

### Changed
- **Studio Course Editor UX Overhaul** (February 7, 2026): Major cleanup of `/studio/course/[coursenft]` tabs and settings
  - Tabs renamed: Course, Credentials, Commitments, Settings (was: Course Outline, Credentials, Commitments, Settings)
  - Combined Course NFT + Module Verification into compact single-row header with inline stats
  - Commitments tab: badge shows pending count only; pending items deep-link to teacher page via query params (`?student=...&sltHash=...`)
  - Commitments tab: resolved section shows accepted/denied items below pending
  - Teacher page: auto-selects commitment from query params on mount
  - Settings tab: standardized all sections with `StudioFormSection` title + description pattern
  - Settings tab: combined "Course Team" and "Manage Course Teachers" into single "Team" section
  - Settings tab: owner-only gates on visibility toggle, teacher management, and danger zone
  - Credentials tab: blockchain links simplified to plain text links
  - Removed `CourseTeachersCard` component usage (replaced by inline team display)
- **Studio Sidebar Scroll Fix** (February 7, 2026): Fixed sidebar not scrolling when many courses/projects exist
  - Added `overflow-hidden` + `min-h-0` to fix flexbox scroll containment

### Fixed
- **Course Detail QA Fixes** (February 5, 2026): QA audit of `/course/[coursenft]` route
  - Guard `useTeacherCourseModules` with `isTeacherPreview` to avoid unnecessary API calls for non-preview users
  - Extract shared `groupCommitmentsByModule()` utility to eliminate duplicate logic between `page.tsx` and `user-course-status.tsx`

### Changed
- **Manager Commitments Page UX Overhaul** (February 4, 2026): Rewrote `/studio/project/[projectid]/commitments` with resizable list/detail panels
  - Left panel: searchable commitment list with status badges and evidence indicators
  - Right panel: full submission detail with ContentDisplay evidence rendering, task context, and assessment actions
  - Inline transaction flow (accept/refuse/deny → confirm → on-chain) replaces separate `TasksAssess` component
  - Auto-advance to next pending commitment after assessment
  - Matches Course Teacher page "shopping cart" UX pattern

### Added
- **V1 Token Detection on Home Page** (February 4, 2026): Auto-detect V1 access tokens on wallet connect and show inline migrate UX
  - New `V1MigrateCard` component (`components/landing/v1-migrate-card.tsx`) — reusable claim card with `onMinted` callback
  - `LandingHero` scans wallet for V1 policy ID after auth when no V2 token exists
  - Flow: wallet connect → V1 scan → migrate card → claim TX → FirstLoginCard ceremony
  - No separate page visit required — migration happens inline on the home page
- **V1→V2 Access Token Migration Page** (February 4, 2026): Standalone `/migrate` route for V1 token holders to claim V2 tokens
  - No sidebar or auth required — wallet connect, V1 token detection, and claim TX only
  - 5-state UI: no wallet → scanning → no token found → ready to claim → success
  - V1 token detection via hardcoded policy ID `c76c35088ac826c8...`
  - Uses `GLOBAL_USER_ACCESS_TOKEN_CLAIM` TX type with `useTransaction` + `useTxStream`
  - New TX_TYPE_MAP entry mapping to `access_token_mint` gateway type
- **Treasury Add Funds TX Component** (February 3, 2026): TX #17 `PROJECT_USER_TREASURY_ADD_FUNDS` — new `treasury-add-funds.tsx` component
  - ADA amount input with lovelace conversion and minimum 1 ADA validation
  - Full TX lifecycle: submit → gateway confirmation → success with `useTxStream`
  - Integrated on `/studio/project/[projectid]/manage-treasury` route
  - All 17/17 TX types now have UI components (was 16/17)
- **Prerequisite Display with Course Titles** (February 3, 2026): Shared `PrerequisiteList` component resolving course and module names
  - `PrerequisiteRow` fetches course title via `useCourse()` and module names via `useCourseModules()`
  - Module badges show `MODULE_CODE: Module Title` instead of raw SLT hashes
  - Used on studio project dashboard, public project detail, and contributor dashboard
  - New shared component: `src/components/project/prerequisite-list.tsx`
- **Studio Project Dashboard Redesign** (February 3, 2026): Prerequisites + stats side-by-side layout
  - Prerequisites card front-and-center on overview tab
  - Stats consolidated into single column with treasury balance inline
  - Renamed "Live" tasks to "Active", removed redundant "Total Tasks" stat
- **Student Assignment Checklist** (February 1, 2026): Per-module assignment checklist in the enrolled course status card (`UserCourseStatus`)
  - Shows each module with commitment status badge (accepted, pending review, needs revision, not started)
  - Uses existing `useStudentAssignmentCommitments` data — no new API calls
- **Project Workflows** (February 1, 2026): PR #111 — Studio and project creation improvements
  - Studio project page redesigned: separated "Projects I Own" and "Projects I Manage" lists
  - Step-based checklist for streamlined project creation
  - Enhanced course prerequisites selector with expandable cards and per-module controls
  - Version endpoint (`/api/version`) exposing app version and build metadata
  - Automated version synchronization with `scripts/stamp-version.sh`
- **SSE Transaction Streaming** (January 30, 2026): Real-time transaction state updates via Server-Sent Events
  - New hook: `useTxStream()` — drop-in replacement for `useTxWatcher` using SSE instead of polling
  - New hook: `useTransactionStream()` — low-level SSE connection management with AbortController
  - New types: `TxStateEvent`, `TxStateChangeEvent`, `TxCompleteEvent`, `TxStreamCallbacks` in `src/types/tx-stream.ts`
  - New SSE proxy route: `src/app/api/gateway-stream/[...path]/route.ts` — streams raw response body with proper SSE headers
  - New polling fallback: `src/lib/tx-polling-fallback.ts` — `pollUntilTerminal()` auto-activates when SSE fails
  - Uses `fetch` + `ReadableStream` (not `EventSource`) to support `X-API-Key` headers
  - SSE endpoint: `GET /api/v2/tx/stream/{tx_hash}` — pushes `state`, `state_change`, `complete` events
  - Near-instant state transitions (~0s latency vs 15s polling intervals)
- **Project & Assignment Hooks** (January 29-30, 2026): New API hooks for project and course domains
  - `useProject()`, `useProjects()`, `useTask()`, `useProjectTasks()` in `src/hooks/api/project/use-project.ts`
  - `useContributorProjects()`, `useContributorCommitment()`, `useSubmitTaskEvidence()` in `src/hooks/api/project/use-project-contributor.ts`
  - `useManagerProjects()`, `useManagerCommitments()` in `src/hooks/api/project/use-project-manager.ts`
  - `useAssignmentCommitment()` in `src/hooks/api/course/use-assignment-commitment.ts`
  - `useUpdateAccessTokenAlias()` in `src/hooks/api/use-user.ts`
- **Phase 3.10 Component Extraction** (January 30, 2026): Extracted direct API calls from 8 components into hooks
  - `assignment-update.tsx`, `burn-module-tokens.tsx`, `mint-access-token-simple.tsx`, `task-commit.tsx` — all refactored to use hooks
  - `pending-reviews-list.tsx`, `pending-reviews-summary.tsx` — teacher views refactored
  - 7 studio project pages migrated to React Query hooks
  - Only `sitemap/page.tsx` and `pending-tx-list.tsx` remain with direct `authenticatedFetch` (deferred)
- **Type Transformation Pattern** (January 24, 2026): Created app-level types with snake_case → camelCase transforms
  - New file: `src/types/project.ts` with `Task`, `Project`, `TaskCommitment` types
  - Transform functions: `transformApiTask()`, `transformProjectDetail()`, `transformApiCommitment()`, etc.
  - API taxonomy compliance: `taskHash` (content-addressed), `taskEvidenceHash`, `taskCommitmentStatus`
  - Documentation: `.claude/dev-notes/TYPE-TRANSFORMATION.md`
  - 17 files updated to use new app-level types

### Fixed
- **Commitment Status Enum Normalization** (February 1, 2026): Fixed STATUS_MAP mismatches across all hooks (#115, #116)
  - Student hooks: Added ACCEPTED/REFUSED mappings (DB sends these, not APPROVED/REJECTED)
  - Teacher hook: Added TEACHER_STATUS_MAP with ACCEPTED/REFUSED → ACCEPTED/DENIED display values
  - Project contributor hook: Added `normalizeProjectCommitmentStatus()` with uppercase normalization and legacy aliases
  - Cross-course contamination: Added courseId filter to `commitmentsByModule` grouping on course detail page and UserCourseStatus
  - Cleaned up dead `"SUBMITTED"` fallback in `assignment-commitment.tsx`
- **TX Polling Intervals** (February 1, 2026): Reduced default polling from 15s to 5s to match gateway confirmation speed (#112)
  - New `POLLING_INTERVALS` constants in `src/config/ui-constants.ts`
- **Managers Manage tx_type Mapping** (February 1, 2026): Fixed `PROJECT_OWNER_MANAGERS_MANAGE` mapped to `managers_manage` instead of `project_join` (#113)
  - SSE streams were freezing after manager update transactions due to incorrect tx_type
- **Single Teacher/Manager on Create** (February 1, 2026): Aligned course/project create forms with gateway PR #46
  - Removed multi-alias input from create forms to prevent TX_TOO_BIG errors
  - Added `TeachersUpdate` component to course owner detail page for post-create management
  - Project owner view now passes `currentManagers` to `ManagersManage` for proper display
- **Owner Alias in Managers List** (February 1, 2026): Owner alias always included when sending managers list to gateway
- **Gateway Taxonomy Compliance** (January 21, 2026): Fixed 41 files to handle API field name changes and NullableString typing
  - **Field renames**: `status` → `module_status`/`task_status`/`commitment_status`, `module_code` → `course_module_code`, `module_index` → `index`, `module_hash` → `slt_hash`, `lovelace` → `lovelace_amount`
  - **NullableString handling**: API generates nullable strings as `object` type requiring special handling
  - Created `src/lib/type-helpers.ts` with `getString()` and `getOptionalString()` utilities
  - Extended `LessonResponse` type to include `slt_index` (returned by API but not in OpenAPI spec)
  - Build now passes with no type errors

### Changed
- **Deposit Field Removed from Project Creation** (February 1, 2026): Removed `deposit_value` from project create form (#109), aligned with gateway
- **Hash Utilities Migration** (January 19, 2026): Migrated hash utilities from `@andamio/transactions` to local `src/lib/utils/`
  - `computeSltHashDefinite` → `~/lib/utils/slt-hash.ts`
  - `computeAssignmentInfoHash` → `~/lib/utils/assignment-info-hash.ts`
  - `computeTaskHash` → `~/lib/utils/task-hash.ts`
  - Updated 10+ files to use new import paths
  - Removed `blakejs` and `cbor` dependencies from `@andamio/transactions` package
  - Dev script simplified: `npm run dev` now runs just Next.js (no concurrent transactions watcher)
- **V1 Transaction Components Migrated to V2** (January 19, 2026): Final V1 components migrated to `useSimpleTransaction`
  - `assignment-commitment.tsx` - Uses `useSimpleTransaction` + `useTxWatcher` for commit/update flows
  - `instructor/page.tsx` - Uses `useSimpleTransaction` + `useTxWatcher` for assessment flow
  - V1 components (`AndamioTransaction`, `useAndamioTransaction`) remain for backwards compatibility but are deprecated

### Fixed
- **Auth Response Parsing** (January 18, 2026): Fixed JWT extraction from V2 Gateway auth response
  - Updated `ValidateSignatureApiResponse` interface to match actual API response structure
  - Changed field mappings: `token` → `jwt`, `stake_address` → `id`/`cardano_bech32_addr`
  - Authentication now works correctly with V2 Gateway
- **Merged Endpoint Response Handling** (January 18, 2026): Fixed handling of nested `content` structure in merged API responses
  - `useTeacherCourses` and `useManagerProjects` hooks now flatten `content.*` fields to top level
  - UI components can access `title`, `description`, etc. directly without nested access
  - Fixed `source` value comparison: changed `"on-chain-only"` to `"chain_only"` to match Gateway response

### Added
- **V2 API Migration Fixes** (January 18, 2026): Added new React Query hooks for merged API data
  - `useManagerCommitments(projectId?)` - Fetch pending task commitments for project managers
  - `useTeacherCoursesWithModules()` - Fetch teacher courses with module details for course prerequisite selection
  - New types exported: `ManagerCommitment`, `ManagerCommitmentsResponse`, `TeacherCourseWithModules`
- **V2 Gateway API Migration Complete** (January 17, 2026): All API calls now use the unified gateway
  - Created unified proxy: `src/app/api/gateway/[...path]/route.ts`
  - Created gateway client: `src/lib/gateway.ts` with typed helper functions
  - Generated types from OpenAPI spec: `src/types/generated/gateway.ts`
  - Added `npm run generate:types` script using `swagger-typescript-api`
  - All auth endpoints migrated to v2 (`/api/v2/auth/*`)
  - Updated 50+ files to use gateway proxy paths

### Changed
- **V2 API Migration Component Updates** (January 18, 2026): Updated components to use auth context internally instead of accepting alias props
  - `PendingReviewsList` - Removed `accessTokenAlias` prop, now uses `useTeacherCommitments` hook internally
  - `CoursePrereqsSelector` - Removed `userAlias` prop, now uses `useTeacherCoursesWithModules` hook internally
  - `ProjectCommitmentsPage` - Rewrote to use `useManagerCommitments` and `useProject` hooks instead of manual fetch
  - All components now use generated types from `~/types/generated` for V2 merged API responses

### Removed
- **Legacy API Infrastructure** (January 17, 2026):
  - Removed `NEXT_PUBLIC_ANDAMIO_API_URL` environment variable
  - Removed `@andamio/db-api-types` NPM dependency
  - Removed `/api/andamioscan/` proxy route
  - Removed `/api/atlas-tx/` proxy route

### Changed
- **V2 API Migration Planning** (January 17, 2026): Comprehensive planning for V2 Gateway API migration (92 endpoints)
  - Architecture decisions documented: single gateway proxy, react-query for all calls, hard cutover
  - Key changes tracked: endpoint renames, method changes (GET→POST), removed endpoints, merged endpoints
  - Payload field name standardization: `course_id` and `project_id` used consistently
- **Unified API Gateway Integration** (January 16, 2026): Migrated to the Unified Andamio API Gateway which combines all backend services
  - Gateway URL: `https://dev-api.andamio.io`
  - New API client at `src/lib/andamio-gateway.ts` for merged endpoints
  - Updated `src/lib/andamioscan.ts` to use gateway passthrough
  - Updated `src/lib/andamio-auth.ts` for hybrid authentication (gateway + legacy)
  - API proxy routes updated to use gateway with `ANDAMIO_API_KEY`
  - New environment variables: `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL`, `ANDAMIO_API_KEY`
  - Gateway provides: merged endpoints (`/api/v2/*`), on-chain data (`/v2/*`), transactions (`/v2/tx/*`), auth (`/auth/*`)
- **API Setup Page** (`/api-setup`): New page for configuring and testing API connections
- **Task Hash Utility** (`@andamio/transactions`): New utilities to compute Project V2 task IDs locally, matching on-chain Plutus validator computation
  - `computeTaskHash(task)` - Compute Blake2b-256 hash matching on-chain task_id
  - `verifyTaskHash(task, expectedHash)` - Verify a hash matches task data
  - `isValidTaskHash(hash)` - Validate hash format (64-char hex)
  - `debugTaskCBOR(task)` - Debug: show CBOR encoding before hashing
  - `TaskData` type - Task data structure for hashing
  - Uses Plutus Constr 0 with indefinite-length arrays (matching on-chain serialization)
  - 10 tests validating against real on-chain transaction data
  - Enables pre-computing task IDs before transaction submission
  - Location: `packages/andamio-transactions/src/utils/task-hash.ts`

### Changed
- **Project V2 API Migration** (January 14, 2026): Complete migration from V1 to V2 Project API endpoints
  - Route folders renamed from `[projectid]` to `[projectid]`
  - Types changed from `TreasuryResponse`/`TreasuryListResponse` to `ProjectV2Output`
  - API endpoints changed from `/project/*` to `/project-v2/*`:
    - `/project/public/treasury/list` → `GET /project-v2/public/projects/list`
    - `/project/owner/treasury/list-owned` → `POST /project-v2/admin/projects/list`
    - `/project/manager/task/create` → `POST /project-v2/manager/task/create` (now requires `project_state_policy_id`)
    - `/project/manager/task/delete` → `POST /project-v2/manager/task/delete` (uses `index` not `task_index`)
  - Field renames: `treasury_nft_policy_id` → `project_id`, `task_index` → `index`, `description` → `content`
  - Removed V1-only fields from task creation: `acceptance_criteria`, `num_allowed_commitments`
  - Two-step API pattern: fetch project first to get `project_state_policy_id`, then fetch/create tasks
- **Standalone Repository**: This template is now a standalone repository with embedded `@andamio/transactions` package
  - Removed all monorepo references from documentation
  - Updated Quick Start to use simple `git clone` workflow
  - Transaction package now lives at `packages/andamio-transactions/` within this repo
  - All deployed APIs are used by default - no local backend required
  - Updated repository URLs in `packages/andamio-transactions/package.json`
  - Updated file structure diagrams in documentation
  - Fixed `audit-coverage.ts` script paths for standalone repo structure

### Added
- **Transaction API Audit Report** (`.claude/skills/audit-api-coverage/tx-audit-report.md`): Comprehensive audit comparing all 16 Atlas TX API swagger schemas against `@andamio/transactions` definitions. Documents match status, fixes applied, and optional improvements.
- **Public Course Credential Claim** (`/course/[coursenft]`): Enrolled students can now claim credentials directly from the public course page
  - "Course Complete!" celebration with `CredentialClaim` component when student has 100% progress
  - Understated "Ready to move on? Claim credential now" link for students with partial completion
  - Uses `useCompletedCourses` hook from Andamioscan to check if course credential already claimed
  - Fetches database commitment status to show claim for accepted assignments
  - `UserCourseStatus` component updated to support both full and early credential claiming
- **Instructor Dashboard Assessment UI** (`/studio/course/[coursenft]/instructor`): Full teacher workflow for reviewing student assignment commitments
  - Accept/Refuse decision buttons with radio-style selection
  - Evidence display using ContentViewer for Tiptap content
  - Two-step data fetching: list endpoint for table, detail endpoint for full evidence
  - Transaction integration with `COURSE_TEACHER_ASSIGNMENTS_ASSESS`
  - Pending transaction tracking via `useTrackPendingTx` for onConfirmation side effects
- **CourseTeachersCard Component**: New card for Studio course pages showing on-chain vs database teachers with sync capability
  - Fetches on-chain teachers from Andamioscan API (`/api/v2/courses/{course_id}/details`)
  - Displays database teachers after sync for comparison
  - "Sync from Chain" button calls `/course/owner/course/sync-teachers` endpoint
  - Shows "In Sync" or "Mismatch" badge based on comparison
  - Located at `src/components/studio/course-teachers-card.tsx`
- **JWT Console Logging**: JWT token now logged to console on authentication for debugging/testing
  - Logs on new authentication (wallet connect + sign)
  - Logs on session restore (page reload with valid JWT)
  - Includes ready-to-use curl example for API testing
  - Shows token, payload, expiration, and Authorization header format
- **Access Token Minting Pending State**: New user onboarding shows a friendly "Confirming on-chain" message while access token minting transaction is pending. Dashboard displays the pending alias with animated loading indicator instead of showing the mint form again.
  - Added `access-token` entity type to `PendingTransaction`
  - `MintAccessToken` now tracks pending tx via `useTrackPendingTx`
  - `WelcomeHero` accepts `isPendingMint` and `pendingAlias` props for pending UI state
  - On confirmation, uses `refreshAuth()` instead of full page reload for instant UI update
- **Partial Signing Support**: Added `partialSign` property to `AndamioTransactionDefinition` type and `TransactionConfig` for multi-sig transactions. When `true`, `wallet.signTx(cbor, true)` preserves existing signatures in the CBOR. `INSTANCE_PROJECT_CREATE` now sets `partialSign: true` to fix Eternl wallet errors.
- **Project Dashboard Role Detection**: `/studio/project/[projectid]` now detects both owner and manager roles. Owners see an info banner explaining their role, managers can fully manage the project. Uses Andamioscan `getManagingProjects` to check manager status.
- **Design System Skill**: Consolidated 3 skills (`review-styling`, `global-style-checker`, `theme-expert`) into unified `design-system` skill with 3 modes: `review` (route audit), `diagnose` (CSS conflicts), `reference` (patterns)

### Changed
- **Go API RESTful Migration Complete** (January 10, 2026): Migrated all 50+ API endpoint calls to new role-based path structure. Pattern: `/{system}/{role}/{resource}/{action}`. See `.claude/skills/audit-api-coverage/API-AUDIT-2026-01-10.md` for full migration report.
  - Public endpoints: Changed from POST with body to GET with path params (e.g., `/course/public/course/get/{policy_id}`)
  - Owner endpoints: `/course/owner/courses/list`, `/project/owner/treasury/list-owned`
  - Teacher endpoints: `/course/teacher/course-module/create`, `/course/teacher/slt/create`
  - Student endpoints: `/course/student/courses`, `/course/student/assignment-commitments/list-by-course`
  - Manager endpoints: `/project/manager/task/create`, `/project/manager/task/update`
  - Files updated: 36 files across hooks, components, and pages

### Fixed
- **Transaction Schema Alignment** (`@andamio/transactions`): Fixed schema mismatches found during Atlas TX API audit
  - `PROJECT_MANAGER_TASKS_ASSESS`: Changed `task_decisions` from `{task_hash, outcome}` to `{alias, outcome}` to match swagger `ProjectOutcome` schema
  - Added `.max(140)` validation to all `ShortText140` fields: `assignment_info` (2 files), `task_info`, `project_info`
- **Design System Compliance**: Fixed hardcoded Tailwind colors to use semantic variables
  - `src/app/error.tsx`: Changed `text-red-600` → `text-destructive`, `text-gray-400` → `text-muted-foreground`, replaced raw button with `AndamioButton`
  - `src/components/pending-tx-popover.tsx`: Changed `bg-yellow-500` → `bg-warning`
- **Instructor Dashboard API Endpoint**: Fixed endpoint path from `/course/teacher/assignment-commitment/by-course` to `/course/teacher/assignment-commitments/list-by-course` (plural form). Fixed request body field `course_nft_policy_id` → `policy_id`.
- **Assignment Commitment Field Names**: Fixed field name mapping across both instructor and student views to use the `network_*` prefix pattern from DB API:
  - `evidence` → `network_evidence` (Tiptap JSON content)
  - `status` → `network_status` (DRAFT | PENDING_TX | ON_CHAIN)
  - `tx_hash` → `network_evidence_hash` / `pending_tx_hash`
- **Teacher Assessment Transaction Inputs**: Fixed `COURSE_TEACHER_ASSIGNMENTS_ASSESS` inputs to match schema (`alias`, `course_id`, `assignment_decisions[]`, `module_code`, `student_access_token_alias`, `assessment_result`). Added optional chaining for status filters.
- **API Method Standardization**: Andamio Go API uses only GET (reads) and POST (writes). Fixed all remaining PATCH/PUT/DELETE usages:
  - `/user/access-token-alias`: PATCH → POST
  - `/user/unconfirmed-tx`: PATCH → POST
  - `useAndamioFetch` hook: Removed PATCH/PUT/DELETE from method types (now only GET/POST)
  - Updated comments in `assignment-commitment.tsx` to reflect new endpoint paths
- **Null Safety in PendingTxPopover**: `truncateTxHash` function now handles undefined/null `txHash` values, returning "—" instead of crashing. Explorer link button only shows when txHash exists.
- **Eternl Wallet Authentication**: Fixed wallet authentication for Eternl and other wallets that return hex-encoded addresses instead of bech32.
  - Added automatic hex-to-bech32 address conversion using `core.Address.fromString().toBech32()` from `@meshsdk/core`
  - Fixed `wallet.signData()` parameter order: Mesh SDK ISigner interface expects `signData(payload, address?)` not `signData(address, payload)`
  - Addresses starting with "addr" (bech32) are used directly; hex addresses are converted
  - Debug logging added to trace address formats during authentication

### Changed
- **Types Package Migration**: Migrated from `@andamio/db-api` to `@andamio/db-api-types@1.1.0`. Updated 38 files with new imports and type names:
  - `ListOwnedCoursesOutput` → `CourseListResponse`
  - `CourseOutput` → `CourseResponse`
  - `CourseModuleOutput` → `CourseModuleResponse`
  - `LessonWithSLTResponse` → `LessonResponse`
  - `AssignmentCommitmentWithAssignmentResponse` → `AssignmentCommitmentResponse`
- **Transactions Package Update**: Updated to `@andamio/transactions@0.5.0` with new naming convention:
  - `COMMIT_TO_ASSIGNMENT` → `COURSE_STUDENT_ASSIGNMENT_COMMIT`
  - `BURN_LOCAL_STATE` → `COURSE_STUDENT_CREDENTIAL_CLAIM`
  - `LEAVE_ASSIGNMENT` → `COURSE_STUDENT_ASSIGNMENT_UPDATE`
  - `ACCEPT_ASSIGNMENT` + `DENY_ASSIGNMENT` → `COURSE_TEACHER_ASSIGNMENTS_ASSESS`
- **Property Renames**: Applied breaking changes from new API:
  - `slt_index` → `module_index` (on SLTs and lessons)
  - `task.index` → `task.task_index`
  - `learner_access_token_alias` → `access_token_alias`
  - Flattened `commitment.assignment.*` to `commitment.module_code`, `commitment.assignment_title`
- **Status Enum Updates**: Changed status values from `"APPROVED"` to `"ON_CHAIN"` (new enum: `DRAFT | PENDING_TX | ON_CHAIN`)

### Removed
- **Treasury Features**: Removed displays using `total_ada`, `escrows`, `_count` (no longer in API response)
- **Commitment Timestamps**: Removed `created`/`updated` fields from commitment displays
- **Token Metadata**: Simplified token display (removed `subject`, `name`, `ticker`, `asset_name_decoded`)
- **Go API Migration**: Migrated all T3 App endpoints to match the new Go-based Andamio DB API (now live on Cloud Run). Updated 14 files across 6 endpoint paths:
  - `POST /course/list` → `GET /courses/owned`
  - `POST /course-module/map` → `POST /course-modules/list`
  - `POST /my-learning/get` → `GET /learner/my-learning`
  - `POST /access-token/update-alias` → `POST /user/access-token-alias`
  - `POST /access-token/update-unconfirmed-tx` → `POST /user/unconfirmed-tx`
  - `GET /transaction/pending-transactions` → `GET /pending-transactions`
- **Wallet Auth Fix**: Fixed `signData` call to pass both address and nonce (`wallet.signData(address, nonce)`) as required by Mesh SDK CIP-30 implementation.
- **Null Safety Fix**: Added optional chaining for `tx.context` in pending-tx-popover to handle API responses without context field.
- **MintAccessToken Hook Migration**: Updated `mint-access-token.tsx` from `useTransaction` to `useAndamioTransaction` hook (hybrid approach). Now executes `onSubmit` side effects automatically while still handling JWT storage manually since the endpoint returns a new JWT. All 16 transaction components now use the standardized `useAndamioTransaction` hook.
- **Andamioscan Integration Complete** (53% coverage): Implemented 17 of 32 Andamioscan V2 API endpoints
  - All Course endpoints (4): `getAllCourses`, `getCourse`, `getCourseStudent`, `getPendingAssessments`
  - All User endpoints (5): `getUserGlobalState`, `getCoursesOwnedByAlias`, `getEnrolledCourses`, `getCompletedCourses`, `getOwnedCourses`
  - All Project endpoints (8): `getAllProjects`, `getProject`, `getProjectContributorStatus`, `getManagerPendingAssessments`, `getContributingProjects`, `getManagingProjects`, `getOwnedProjects`, `getCompletedProjects`
  - 15 Event endpoints remain (for transaction confirmation) - tracked in GitHub issue #26
- **Dashboard Summary Components**: 6 new on-chain data summary cards for the dashboard
  - `EnrolledCoursesSummary` - Shows on-chain enrolled courses for learners
  - `PendingReviewsSummary` - Shows pending assessments for teachers
  - `CredentialsSummary` - Shows earned credentials with links to credentials page
  - `ContributingProjectsSummary` - Shows projects user is contributing to
  - `ManagingProjectsSummary` - Shows projects user is managing (hidden if none)
  - `OwnedCoursesSummary` - Shows courses user owns with studio links
- **Credentials Page** (`/credentials`): New page displaying all earned on-chain credentials with verification indicator
- **InstructorIcon**: Added Crown icon to entity icons for course ownership indicator
- **Studio Course Ownership Indicator**: Crown badge on courses the user owns vs teaches
- **Task Detail Page Commitment Flow** (`/project/[projectid]/[taskhash]`): Full task commitment workflow with evidence editor, stats grid using `AndamioDashboardStat`, and `ProjectEnroll`/`TaskCommit` transaction components
- **Contributor Dashboard** (`/project/[projectid]/contributor`): New dashboard for project contributors to enroll, commit to tasks, and claim credentials
- **Manager Dashboard** (`/studio/project/[projectid]/manager`): New dashboard for project managers to review task submissions and accept/deny
- **AndamioDashboardStat Component**: Extracted reusable KPI stat card with icon, label, value, optional description, and semantic color support
- **AndamioSearchInput Component**: Search input with integrated SearchIcon, supports default and compact (`sm`) size variants
- **Project Transaction Components**: New transaction components for project workflows
  - `ProjectEnroll` - Enroll in a project and commit to initial task
  - `TaskCommit` - Commit to a task with evidence
  - `ProjectCredentialClaim` - Claim earned project credentials
  - `TasksAssess` - Manager component to assess task submissions
  - `TasksManage` - Manage project tasks
  - `ManagersManage` - Manage project managers
  - `BlacklistManage` - Manage project blacklist
  - `CreateProject` - Create new project treasury
- **React Query Migration Complete**: All primary course routes now use React Query hooks for cached, deduplicated data fetching
  - `course/page.tsx` - Uses `usePublishedCourses` for course catalog
  - `course/[coursenft]/[modulecode]/page.tsx` - Uses `useCourse`, `useCourseModule`, `useSLTs`, `useLessons`
  - `course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` - Uses `useCourse`, `useCourseModule`, `useLesson`
  - `studio/course/page.tsx` - Uses `useOwnedCoursesQuery` replacing manual fetch pattern
  - 6 pages migrated total, 18 hooks available
- **Global Style Checker Skill**: New Claude skill to detect CSS specificity conflicts where globals.css overrides Tailwind utilities
- **Responsive Editor Toolbar**: Content editor toolbar now always uses compact mode with overflow items in a "More" dropdown menu (alignment, lists, blocks, links, images, tables)
- **PR Review Skill**: New comprehensive PR review skill using `gh` CLI with automatic delegation to other skills (review-styling, theme-expert)
- **Register Course Drawer**: New component for registering on-chain-only courses into the database with title input and API integration
- **Credential-Focused Empty State**: Redesigned empty course detail page with centered hero, credential messaging, wizard vs pro mode options, and "Anatomy of a Credential" section
- **Conditional Tabs**: Course detail tabs now only appear after the first module/credential exists
- **StudioModuleCard Component**: New extracted component for displaying course modules in studio with 6-step progress indicator, status icons, and configurable display options
- **Inline Lesson Editing**: Lessons now edited inline in the wizard (like assignments) with expandable/collapsible editors, title input, and full ContentEditor
- **RequireCourseAccess loadingVariant**: New prop to match loading skeleton style to page layout (`page`, `studio-centered`, `studio-split`), prevents loading screen "flash" during navigation
- **Course Module/SLT Reference Convention**: New naming rule requiring Course Modules to be referenced by Module Code and SLTs by `<module-code>.<module-index>` format (e.g., "101.3")
- **Course Preview Panel**: Redesigned `/studio/course` landing page with hero section, stat grid (Modules, On-Chain, SLTs), centered CTA, and module code list
- **AndamioText Component**: Standardized text component with 5 variants (default, muted, small, lead, overline) replacing loose `<p className=...>` patterns throughout the codebase
- **Claude Skills System**: Migrated documentation from `docs/` to `.claude/skills/` for better AI-assisted development
  - `documentarian` skill for documentation maintenance
  - `review-styling` skill for style guide enforcement
  - `audit-api-coverage` skill for API coverage tracking
  - `project-manager` skill for project status tracking
- **New Andamio Components**: `AndamioEmptyState`, `AndamioNotFoundCard`, `AndamioPageLoading`, `AndamioStatCard`
- **New Course Components**: `CourseModuleCard`, `LessonMediaSection`, `SLTLessonTable`
- **New Studio Components**: `StudioCourseCard`, `StudioHubCard`
- **New Hooks**: `useModuleWizardData`, `useWizardNavigation`
- **Authorization Component**: `RequireCourseAccess` for course-level access control
- Global heading styles in `globals.css` with `!important` to override Tailwind preflight

### Changed
- **Blueprint → Credential Rename**: Renamed wizard step from "Blueprint" to "Credential" across all files (`step-blueprint.tsx` → `step-credential.tsx`, `WizardStepId` type, step order, completion state)
- **SLT Display Format**: SLT items now show `<module-code>.<module-index>` reference badge instead of sequential numbers
- **Input Border Fix**: Fixed invisible borders on form inputs by using `border-border` class consistently in globals.css
- Migrated all documentation from `docs/` folder to `.claude/skills/` directories
- All Andamio wrapper components now consistently export with `Andamio` prefix
- Updated all `<p className=...>` patterns to use `AndamioText` component (232+ occurrences)

### Fixed
- **Course Creation Side Effects** (`use-andamio-transaction.ts`): Fixed case mismatch where API returns `course_id` (snake_case) but hook was looking for `courseId` (camelCase). Side effect mapping now correctly uses `course_nft_policy_id`.
- **Missing MintModuleTokens UI** (`studio/course/[coursenft]/page.tsx`): On-Chain tab showed "Ready to Mint" count but had no mint action. Added `MintModuleTokens` component that renders when approved modules exist.
- **Undefined Modules Crash** (`studio/course/page.tsx`): Fixed crash when `onChainCourse.modules` was undefined by adding optional chaining (`modules?.length ?? 0`).
- **Module Mint API Schema** (`modules-manage.ts`, `mint-module-tokens.tsx`): Updated transaction definition and component to match Atlas API required fields (`slts`, `allowed_course_state_ids`, `prereq_slt_hashes`). Removed obsolete `allowed_students_v2` and `prerequisite_assignments_v2` fields.
- **Wizard Navigation**: Fixed lesson step → introduction navigation by checking assignment completion state and using `goToStep("introduction")` directly instead of calling `goNext()` twice
- **Sidebar User Info**: Redesigned sidebar footer to show access token alias prominently above wallet address with smaller font size
- **Code Element Styling**: Changed `<code>` elements to `<span className="font-mono">` to avoid global `text-sm` override from base styles
- **Raw Input Elements**: Replaced raw `<input>` elements with `AndamioInput` in studio course page search
- **Transaction Endpoint Paths**: Fixed COURSE_ADMIN_CREATE transaction definition to use correct API endpoints (`/course/create-on-submit-minting-tx` and `/course/confirm-minting-tx`), enabling proper database record creation on course minting
- **Silent Refetch on Save**: `useModuleWizardData` no longer shows full loading screen when saving assignment/lesson content, uses `hasLoadedRef` to distinguish initial load from refetch
- **Error Boundary Hydration**: Removed duplicate `<html>` and `<body>` tags from `error.tsx` (only `global-error.tsx` should have these)
- **Optimistic SLT Updates**: Fixed React render error by moving `updateSlts` calls outside of state setter callbacks

### Removed
- `docs/` folder contents (migrated to `.claude/skills/`)
- Deprecated TODO-TRANSACTION-CONFIRMATION.md (superseded by PENDING-TX-WATCHER.md)
- NBA (Node Backend API) references throughout documentation

## [0.4.0] - 2025-12-11

### Added
- **Creator Studio**: Full course and module editing interface
  - Tabbed interface for course management
  - Rich text editing with Tiptap
  - On-chain sync for course publishing
- **Project System** (in progress): Treasury and task management foundation
- **Responsive Design**: Full mobile/tablet support with Andamio layout components
  - `AndamioPageHeader`, `AndamioSectionHeader`, `AndamioTableContainer`
  - Breakpoints from xs (375px) to 2xl (1536px)
- **Pending Transaction System**: Automatic blockchain transaction monitoring
  - `usePendingTxWatcher` hook
  - `PendingTxPopover` component
  - Database-backed transaction tracking
- **Semantic Color System**: Full light/dark mode with semantic variables
  - success, warning, info, destructive status colors
  - Consistent theming across all components
- **68+ Andamio UI Components**: shadcn/ui wrappers with enhanced features

### Changed
- Upgraded to Next.js 15 with App Router
- Upgraded to Tailwind CSS v4 with CSS-first configuration
- Transaction endpoints migrated to Andamioscan

### Fixed
- Various type safety improvements
- Editor content persistence issues

## [0.3.0] - 2025-11-XX

### Added
- Course & Learning system with 8 transactions and 129 tests
- Full learner lifecycle (enroll, progress, complete)
- Assignment commitment workflow
- Module credential issuance

### Changed
- Migrated from tRPC v10 to v11
- Updated Mesh SDK to latest beta

## [0.2.0] - 2025-10-XX

### Added
- Initial T3 Stack setup
- Cardano wallet integration via Mesh SDK
- JWT authentication with wallet signatures
- Basic course listing and viewing

### Changed
- Restructured to use App Router

## [0.1.0] - 2025-09-XX

### Added
- Initial project setup
- Basic Next.js configuration
- shadcn/ui component library installation
- Tailwind CSS configuration

---

[Unreleased]: https://github.com/Andamio-Platform/andamio-app-v2/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/Andamio-Platform/andamio-app-v2/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Andamio-Platform/andamio-app-v2/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Andamio-Platform/andamio-app-v2/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Andamio-Platform/andamio-app-v2/releases/tag/v0.1.0
