# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Access Token Minting Pending State**: New user onboarding shows a friendly "Confirming on-chain" message while access token minting transaction is pending. Dashboard displays the pending alias with animated loading indicator instead of showing the mint form again.
  - Added `access-token` entity type to `PendingTransaction`
  - `MintAccessToken` now tracks pending tx via `useTrackPendingTx`
  - `WelcomeHero` accepts `isPendingMint` and `pendingAlias` props for pending UI state
  - On confirmation, uses `refreshAuth()` instead of full page reload for instant UI update
- **Partial Signing Support**: Added `partialSign` property to `AndamioTransactionDefinition` type and `TransactionConfig` for multi-sig transactions. When `true`, `wallet.signTx(cbor, true)` preserves existing signatures in the CBOR. `INSTANCE_PROJECT_CREATE` now sets `partialSign: true` to fix Eternl wallet errors.
- **Project Dashboard Role Detection**: `/studio/project/[treasurynft]` now detects both owner and manager roles. Owners see an info banner explaining their role, managers can fully manage the project. Uses Andamioscan `getManagingProjects` to check manager status.
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
- **Task Detail Page Commitment Flow** (`/project/[treasurynft]/[taskhash]`): Full task commitment workflow with evidence editor, stats grid using `AndamioDashboardStat`, and `ProjectEnroll`/`TaskCommit` transaction components
- **Contributor Dashboard** (`/project/[treasurynft]/contributor`): New dashboard for project contributors to enroll, commit to tasks, and claim credentials
- **Manager Dashboard** (`/studio/project/[treasurynft]/manager`): New dashboard for project managers to review task submissions and accept/deny
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

[Unreleased]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Andamio-Platform/andamio-t3-app-template/releases/tag/v0.1.0
