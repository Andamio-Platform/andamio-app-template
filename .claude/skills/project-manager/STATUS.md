# Project Status

> **Last Updated**: January 9, 2026

Current implementation status of the Andamio T3 App Template.

---

## Current Blockers

| Blocker | Status | Impact |
|---------|--------|--------|
| **@andamio/transactions NPM Publish** | Waiting | Latest V2 definitions available locally via workspace link, but NPM package not yet published |
| **Andamio DB API (Go Rewrite)** | ✅ **Deployed** | Go API now live on Cloud Run; T3 App endpoints migrated |
| **Event Endpoints (Andamioscan)** | 0/15 implemented | Transaction confirmation relies on Koios polling instead of entity-specific endpoints |

**Workarounds in Place**:
- Using workspace symlink for `@andamio/transactions` (local development works)
- Koios polling handles transaction confirmation until Event endpoints are ready

---

## Upcoming Milestones

| Date | Milestone | Impact on Template |
|------|-----------|-------------------|
| **2026-01-09** | Andamio V2 Preprod Release | Template optimization complete |
| **2026-01-12** | Andamio Pioneers Program | Preprod testing begins |
| **2026-01-12 → 2026-02-06** | V1→V2 Migration Focus | Work shifts to app.andamio.io |
| **2026-02-06** | Andamio V2 Mainnet Launch | Feature backlog resumes |

**Note**: During Jan 12 → Feb 6, primary dev focus is on app.andamio.io (production fork). This template remains the reference implementation.

---

## Quick Status

| Area | Status | Progress |
|------|--------|----------|
| Course System | Stable | 15/15 routes, ~66% API coverage |
| Project System | In Progress | 6/13 routes, 8 transaction components |
| Andamioscan Integration | **53% Complete** | 17/32 endpoints (all Course/User/Project done) |
| React Query Migration | Complete | 18 hooks created, 6 pages migrated |
| Transaction System | Stable | Side effects, pending tx monitoring |
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

### API Coverage: ~66% (49/74 endpoints)

See `audit-api-coverage/api-coverage.md` for detailed breakdown.

| Category | Available | Implemented | Coverage |
|----------|-----------|-------------|----------|
| Course | 9 | 6 | 67% |
| Course Module | 9 | 6 | 67% |
| SLT | 7 | 6 | 86% |
| Lesson | 5 | 4 | 80% |
| Assignment | 5 | 4 | 80% |
| Assignment Commitment | 10 | 8 | 80% |
| Introduction | 4 | 4 | 100% |
| Auth | 3 | 3 | 100% |
| User | 7 | 0 | 0% |
| Project/Task | ~15 | 0 | 0% |

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
| @andamio/db-api | ^0.5.x | API types & schemas |
| @andamio/transactions | ^0.1.x | Transaction definitions |

---

## Recent Changes

### January 9, 2026 (Session 2) - Go API Migration Complete

**Andamio DB API (Go) Now Live**: Migrated all T3 App endpoints to match the new Go API.

**Endpoint Migrations**:
| Old Endpoint | New Endpoint | Files Updated |
|--------------|--------------|---------------|
| `POST /course/list` | `GET /courses/owned` | 5 files |
| `POST /course-module/map` | `POST /course-modules/list` | 2 files |
| `POST /my-learning/get` | `GET /learner/my-learning` | 1 file |
| `POST /access-token/update-alias` | `PATCH /user/access-token-alias` | 2 files |
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
