# Project Routes Sitemap

This document maps all planned Project-related routes in the Andamio T3 App Template.

## Summary

| # | Route | Purpose | Auth | Type |
|---|-------|---------|------|------|
| 1 | `/project` | Public project catalog | Not required | Contributor |
| 2 | `/project/[treasurynft]` | Project detail with tasks | Not required | Contributor |
| 3 | `/project/[treasurynft]/[taskhash]` | Task detail with commitment UI | Not required | Contributor |
| 4 | `/studio/project` | My managed projects list | Required | Manager |
| 5 | `/studio/project/[treasurynft]` | Project dashboard | Required | Manager/Owner |
| 6 | `/studio/project/[treasurynft]/manage-treasury` | Treasury management & publishing | Required | Owner |
| 7 | `/studio/project/[treasurynft]/manage-contributors` | Enrolled contributors list | Required | Manager |
| 8 | `/studio/project/[treasurynft]/commitments` | All task commitments | Required | Manager |
| 9 | `/studio/project/[treasurynft]/commitments/[alias]` | Contributor-specific commitments | Required | Manager |
| 10 | `/studio/project/[treasurynft]/draft-tasks` | Draft tasks list | Required | Manager |
| 11 | `/studio/project/[treasurynft]/draft-tasks/new` | Create new task | Required | Manager |
| 12 | `/studio/project/[treasurynft]/draft-tasks/[taskindex]` | Edit draft task | Required | Manager |
| 13 | `/studio/project/[treasurynft]/transaction-history` | Transaction history display | Required | Manager/Owner |

**Total: 13 Project Routes Planned**

---

## API Endpoints Reference

### All Project System Endpoints

| Method | Endpoint | Purpose | Auth | Used In Route |
|--------|----------|---------|------|---------------|
| POST | `/projects/list` | Get published projects | No | `/project` |
| POST | `/projects/list-owned` | List owned/managed projects | Yes (Treasury Owner) | `/studio/project` |
| POST | `/projects/update` | Update project metadata | Yes (Treasury Owner) | `/studio/project/[treasurynft]` |
| POST | `/tasks/list` | List tasks for a project | No | `/project/[treasurynft]`, `/studio/project/[treasurynft]/draft-tasks` |
| POST | `/tasks/create` | Create draft task | Yes (Project Manager) | `/studio/project/[treasurynft]/draft-tasks/new` |
| POST | `/tasks/update` | Update draft task | Yes (Project Manager) | `/studio/project/[treasurynft]/draft-tasks/[taskindex]` |
| POST | `/tasks/delete` | Delete draft task | Yes (Project Manager) | `/studio/project/[treasurynft]/draft-tasks/[taskindex]` |
| POST | `/task-commitments/list` | List my commitments | Yes (Contributor) | Contributor dashboard (future) |
| POST | `/task-commitments/get` | Get commitment for task | Yes (Contributor) | `/project/[treasurynft]/[taskhash]` |
| POST | `/task-commitments/create` | Create task commitment | Yes (Contributor) | `/project/[treasurynft]/[taskhash]` |
| POST | `/task-commitments/update-evidence` | Update commitment evidence | Yes (Contributor) | `/project/[treasurynft]/[taskhash]` |
| POST | `/task-commitments/update-status` | Update commitment status | Yes | `/project/[treasurynft]/[taskhash]`, `/studio/project/[treasurynft]/commitments` |
| POST | `/task-commitments/delete` | Delete commitment | Yes | `/project/[treasurynft]/[taskhash]` |
| POST | `/task-commitments/confirm-transaction` | Confirm blockchain tx | Yes | `/project/[treasurynft]/[taskhash]` |
| POST | `/contributors/create` | Create contributor role | Yes | `/project/[treasurynft]/[taskhash]` |
| POST | `/prerequisites/list-on-chain` | Get on-chain prerequisites | No | `/project/[treasurynft]` |

**Total: 16 API Endpoints**

---

## Route Categories

### 1. Public Project Routes (Contributor-Facing)

These routes are accessible to all users (authenticated or not) and provide the project browsing and contribution experience.

#### `/projects`
- **Purpose**: Browse all published projects (project catalog)
- **Authentication**: Not required (public)
- **Features**:
  - Displays table of all published projects
  - Shows project title, treasury NFT policy ID, description
  - Should show task count
  - Links to individual project page
  - Loading/error/empty states
- **Component**: `src/app/(app)/project/page.tsx`
- **API Endpoint**: `POST /projects/list`
- **Type**: `ListPublishedTreasuriesOutput`

#### `/project/[treasurynft]`
- **Purpose**: Individual project detail page with tasks
- **Authentication**: Not required (public)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Displays project title, description, image, video
  - Shows table of project tasks with:
    - Task hash (linked to task page)
    - Title
    - Description
    - Lovelace reward amount
    - Expiration time
    - Status badge (DRAFT/LIVE/ARCHIVED)
  - Shows contributor prerequisites (from `/prerequisites/list-on-chain`)
  - Escrow information display
  - Loading/error/empty states
- **Component**: `src/app/(app)/project/[treasurynft]/page.tsx`
- **API Endpoints**:
  - `POST /projects/list` (with `treasury_nft_policy_id` filter) - Project details
  - `POST /tasks/list` - Task list
  - `POST /prerequisites/list-on-chain` - Contributor prerequisites
- **Types**:
  - `TreasuryOutput`
  - `TaskInfoOutput[]`
  - Contributor prerequisite objects (on-chain data)

#### `/project/[treasurynft]/[taskhash]`
- **Purpose**: Task detail page with commitment workflow
- **Authentication**: Optional (shows commitment UI if authenticated as Contributor)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
  - `taskhash` - Task hash (on-chain identifier)
- **Features**:
  - Back button to project page
  - Live/Draft/Archived badge
  - Task title and description
  - Lovelace reward display
  - Expiration time display
  - Acceptance criteria list
  - Token rewards display (if any)
  - Task content (Tiptap RenderEditor for `content_json`)
  - **Commitment Workflow Component** (if authenticated as Contributor):
    - Check existing commitment via `/task-commitments/get`
    - Create commitment via `/task-commitments/create`
    - Submit evidence via `/task-commitments/update-evidence`
    - Update status via `/task-commitments/update-status`
    - Confirm blockchain transaction via `/task-commitments/confirm-transaction`
    - Delete commitment via `/task-commitments/delete`
    - Create contributor role via `/contributors/create` (if not yet a contributor)
  - Commitment status tracking with PENDING_TX states
  - Loading/error states
- **Component**: `src/app/(app)/project/[treasurynft]/[taskhash]/page.tsx`
- **API Endpoints**:
  - `POST /tasks/list` (filtered by treasury_nft_policy_id, then find by task_hash) - Task details
  - `POST /task-commitments/get` - Get existing commitment (authenticated)
  - `POST /task-commitments/create` - Create commitment (authenticated)
  - `POST /task-commitments/update-evidence` - Update evidence (authenticated)
  - `POST /task-commitments/update-status` - Update status (authenticated)
  - `POST /task-commitments/delete` - Delete commitment (authenticated)
  - `POST /task-commitments/confirm-transaction` - Confirm tx (authenticated)
  - `POST /contributors/create` - Create contributor role (authenticated)
- **Types**:
  - `TaskInfoOutput`
  - `TaskCommitmentOutput`

---

### 2. Studio/Management Routes (Manager/Owner-Facing)

These routes are for project managers and treasury owners to manage their projects and require authentication.

#### `/studio/project`
- **Purpose**: Project studio/management dashboard
- **Authentication**: Required (JWT - Treasury Owner role)
- **Features**:
  - Displays owned/managed projects table with "Manage" action buttons
  - Each project links to its individual dashboard page
  - Shows project status (published/draft)
  - Shows treasury info and escrow balances
  - Auth gate (shows login if not authenticated)
- **Component**: `src/app/(app)/studio/project/page.tsx`
- **API Endpoint**: `POST /projects/list-owned`
- **Type**: `ListOwnedTreasuriesOutput`

#### `/studio/project/[treasurynft]`
- **Purpose**: Project dashboard and metadata CRUD
- **Authentication**: Required (JWT - Treasury Owner role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Edit project title, description, imageUrl, videoUrl
  - Treasury NFT Policy ID (read-only, shown in badge)
  - View project tasks summary (count of DRAFT vs LIVE)
  - Quick links to:
    - Manage Treasury
    - Manage Contributors
    - View Commitments
    - Draft Tasks
    - Transaction History
  - Save/Cancel actions
  - Loading/error states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/page.tsx`
- **API Endpoints**:
  - `POST /projects/list-owned` (with `treasury_nft_policy_id` filter) - Get project
  - `POST /projects/update` - Update project metadata
  - `POST /tasks/list` - Get task summary
- **Types**:
  - `TreasuryWithEscrowsOutput`

#### `/studio/project/[treasurynft]/manage-treasury`
- **Purpose**: Treasury management - approve drafts, run on-chain transactions
- **Authentication**: Required (JWT - Treasury Owner role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Back button to project dashboard
  - Treasury balance display
  - Escrow information
  - List of DRAFT tasks awaiting approval
  - **Publish Task Workflow**:
    - Select draft tasks to publish
    - Build and sign transaction
    - Submit to blockchain
    - Track pending transaction status
  - Funding controls (deposit/withdraw from treasury)
  - Loading/error states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/manage-treasury/page.tsx`
- **API Endpoints**:
  - `POST /projects/list-owned` (with filter) - Get project with treasury info
  - `POST /tasks/list` - Get draft tasks for approval
- **Types**:
  - `TreasuryWithEscrowsOutput`
  - `TaskInfoOutput[]`
- **Note**: This route primarily handles on-chain transactions via Mesh SDK; the API provides read-only data for display

#### `/studio/project/[treasurynft]/manage-contributors`
- **Purpose**: View enrolled contributors for the project
- **Authentication**: Required (JWT - Project Manager role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Back button to project dashboard
  - List of enrolled contributors
  - Contributor alias/ID display
  - Contributor status
  - Link to view contributor's commitments
  - Loading/error/empty states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/manage-contributors/page.tsx`
- **API Endpoints**:
  - `POST /projects/list-owned` (with filter) - Get project with contributor data
  - `POST /prerequisites/list-on-chain` - Get prerequisites
- **Types**:
  - `TreasuryWithEscrowsOutput`
  - Contributor prerequisite objects (on-chain data)
- **Note**: Contributor enrollment data comes from on-chain/NBA API; this route displays it

#### `/studio/project/[treasurynft]/commitments`
- **Purpose**: View all task commitments for the project
- **Authentication**: Required (JWT - Project Manager role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Back button to project dashboard
  - Project title display
  - Statistics cards:
    - Total commitments count
    - Pending commitments count (COMMITMENT_MADE, PENDING_APPROVAL)
    - Accepted commitments count
    - Denied/Refused commitments count
  - Filtering system:
    - Filter by commitment status
    - Filter by task
    - Search by contributor ID
  - Commitments table showing:
    - Contributor ID (truncated)
    - Task title and hash
    - Status badge (with color coding)
    - Evidence preview
    - Pending TX indicator
  - Actions:
    - View full commitment details
    - Update status (approve/deny)
  - Empty states with filter clear option
  - Loading/error states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/commitments/page.tsx`
- **API Endpoints**:
  - `POST /projects/list-owned` (with filter) - Get project details
  - `POST /tasks/list` - Get tasks for filter dropdown
  - `POST /task-commitments/update-status` - Update commitment status (approve/deny)
- **Types**:
  - `TreasuryWithEscrowsOutput`
  - `TaskInfoOutput[]`
  - `TaskCommitmentOutput[]`
- **Note**: Task commitments are retrieved as part of project/task data; manager actions use update-status endpoint

#### `/studio/project/[treasurynft]/commitments/[alias]`
- **Purpose**: View task commitments for a specific contributor
- **Authentication**: Required (JWT - Project Manager role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
  - `alias` - Contributor alias/ID
- **Features**:
  - Back button to commitments list
  - Contributor info header
  - List of all commitments by this contributor for this project
  - Commitment details:
    - Task title and hash
    - Status badge
    - Evidence content
    - Timestamps (created, updated)
    - Pending TX hash (if applicable)
  - Status update actions (approve/deny)
  - Loading/error states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/commitments/[alias]/page.tsx`
- **API Endpoints**:
  - `POST /projects/list-owned` (with filter) - Get project details
  - `POST /task-commitments/update-status` - Update commitment status
- **Types**:
  - `TreasuryWithEscrowsOutput`
  - `TaskCommitmentOutput[]`

#### `/studio/project/[treasurynft]/draft-tasks`
- **Purpose**: List and manage draft tasks
- **Authentication**: Required (JWT - Project Manager role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Back button to project dashboard
  - "Create New Task" button
  - Task count card (draft/total)
  - Table of tasks showing:
    - Task index
    - Title
    - Description (truncated)
    - Lovelace amount
    - Status badge
    - Edit/Delete action buttons
  - Status filter (DRAFT, LIVE, ARCHIVED)
  - Empty state with "Create First Task" button
  - Loading/error states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/draft-tasks/page.tsx`
- **API Endpoints**:
  - `POST /projects/list-owned` (with filter) - Get project details
  - `POST /tasks/list` - Get all tasks
  - `POST /tasks/delete` - Delete draft task
- **Types**:
  - `TreasuryWithEscrowsOutput`
  - `TaskInfoOutput[]`

#### `/studio/project/[treasurynft]/draft-tasks/new`
- **Purpose**: Create a new task
- **Authentication**: Required (JWT - Project Manager role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Back button to draft tasks list
  - Create task form:
    - Title input (required)
    - Description textarea (required)
    - **Tiptap editor** for content_json
    - Lovelace amount input (required)
    - Expiration time date picker (optional)
    - Acceptance criteria list (add/remove items)
    - Number of allowed commitments input
    - Number of allocated commitments input
    - Token rewards (add/remove tokens with policyId, assetName, quantity)
  - Edit/Preview tabs for content
  - Create button with validation
  - Loading/error states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/draft-tasks/new/page.tsx`
- **API Endpoints**:
  - `POST /tasks/create` - Create task
- **Types**:
  - `CreateTaskInput`
  - `CreateTaskOutput`

#### `/studio/project/[treasurynft]/draft-tasks/[taskindex]`
- **Purpose**: Edit and manage existing draft task
- **Authentication**: Required (JWT - Project Manager role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
  - `taskindex` - Task index (0-based)
- **Features**:
  - Back button to draft tasks list
  - Task index badge
  - Status badge (DRAFT/LIVE/ARCHIVED)
  - Edit task form (editable only if DRAFT):
    - Title input
    - Description textarea
    - **Tiptap editor** for content_json
    - Lovelace amount input
    - Expiration time date picker
    - Acceptance criteria list
    - Number of allowed commitments input
    - Number of allocated commitments input
    - Token rewards management
  - Edit/Preview tabs for content
  - Update/Delete buttons (only for DRAFT status)
  - Read-only view for LIVE/ARCHIVED tasks
  - Loading/error states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/draft-tasks/[taskindex]/page.tsx`
- **API Endpoints**:
  - `POST /tasks/list` (filter by task_index) - Get task details
  - `POST /tasks/update` - Update task (DRAFT only)
  - `POST /tasks/delete` - Delete task (DRAFT only)
- **Types**:
  - `TaskInfoOutput`
  - `CreateTaskInput` (used for updates as well)

#### `/studio/project/[treasurynft]/transaction-history`
- **Purpose**: Display transaction history for the project
- **Authentication**: Required (JWT - Treasury Owner/Manager role)
- **URL Parameters**:
  - `treasurynft` - Treasury NFT Policy ID
- **Features**:
  - Back button to project dashboard
  - Transaction list showing:
    - Transaction hash (linked to explorer)
    - Type (publish task, fund treasury, etc.)
    - Status (pending, confirmed, failed)
    - Timestamp
    - Amount (if applicable)
  - Filter by transaction type
  - Filter by date range
  - Loading/error/empty states
- **Component**: `src/app/(app)/studio/project/[treasurynft]/transaction-history/page.tsx`
- **API Endpoints**:
  - `POST /projects/list-owned` (with filter) - Get project with transaction history
- **Types**:
  - `TreasuryWithEscrowsOutput`
  - Transaction history (on-chain data via Koios API)
- **Note**: Transaction history may come from on-chain data via Koios API

---

## Route Hierarchy Visualization

```
/project (public - all published projects)
  └── /project/[treasurynft] (project detail with tasks)
      └── /project/[treasurynft]/[taskhash] (task detail with commitment workflow)

/studio (studio home)
  └── /studio/project (project management dashboard - owned projects)
      └── /studio/project/[treasurynft] (project CRUD)
          ├── /studio/project/[treasurynft]/manage-treasury (treasury management)
          ├── /studio/project/[treasurynft]/manage-contributors (contributors list)
          ├── /studio/project/[treasurynft]/commitments (all commitments)
          │   └── /studio/project/[treasurynft]/commitments/[alias] (contributor commitments)
          ├── /studio/project/[treasurynft]/draft-tasks (tasks list)
          │   ├── /studio/project/[treasurynft]/draft-tasks/new (create task)
          │   └── /studio/project/[treasurynft]/draft-tasks/[taskindex] (edit task)
          └── /studio/project/[treasurynft]/transaction-history (transaction history)
```

---

## URL Parameter Definitions

| Parameter | Description | Example | Constraints |
|-----------|-------------|---------|-------------|
| `treasurynft` | Treasury NFT Policy ID | `e1b2c3d4...` | 56-character hex string |
| `taskhash` | Task hash (on-chain identifier) | `a1b2c3d4...` | 64-character hex string |
| `taskindex` | Task index | `0`, `1`, `24` | Integer (0-based) |
| `alias` | Contributor alias/ID | `contributor123` | String identifier |

---

## Authentication Requirements Summary

| Route | Auth Required | Auth Type | Role Required |
|-------|---------------|-----------|---------------|
| `/project` | No | - | Public |
| `/project/[treasurynft]` | No | - | Public |
| `/project/[treasurynft]/[taskhash]` | Optional | JWT | Contributor (for commitment UI) |
| `/studio/project` | Yes | JWT | Treasury Owner |
| `/studio/project/[treasurynft]` | Yes | JWT | Treasury Owner |
| `/studio/project/[treasurynft]/manage-treasury` | Yes | JWT | Treasury Owner |
| `/studio/project/[treasurynft]/manage-contributors` | Yes | JWT | Project Manager |
| `/studio/project/[treasurynft]/commitments` | Yes | JWT | Project Manager |
| `/studio/project/[treasurynft]/commitments/[alias]` | Yes | JWT | Project Manager |
| `/studio/project/[treasurynft]/draft-tasks` | Yes | JWT | Project Manager |
| `/studio/project/[treasurynft]/draft-tasks/new` | Yes | JWT | Project Manager |
| `/studio/project/[treasurynft]/draft-tasks/[taskindex]` | Yes | JWT | Project Manager |
| `/studio/project/[treasurynft]/transaction-history` | Yes | JWT | Treasury Owner/Manager |

---

## API Endpoints Used by Project Routes

### Public Endpoints (No Auth)
- `POST /projects/list` - List all published projects (optional filter by treasury_nft_policy_id)
- `POST /tasks/list` - List tasks for a project
- `POST /prerequisites/list-on-chain` - Get on-chain contributor prerequisites

### Authenticated Endpoints (JWT Required)

**Project Management (Treasury Owner):**
- `POST /projects/list-owned` - List projects owned by authenticated user
- `POST /projects/update` - Update project metadata (title, description, imageUrl, videoUrl)

**Task Management (Project Manager):**
- `POST /tasks/create` - Create new task (DRAFT status)
- `POST /tasks/update` - Update draft task
- `POST /tasks/delete` - Delete draft task

**Task Commitment Management (Contributor):**
- `POST /task-commitments/list` - List all my commitments
- `POST /task-commitments/get` - Get commitment for specific task
- `POST /task-commitments/create` - Create new commitment
- `POST /task-commitments/update-evidence` - Update commitment evidence
- `POST /task-commitments/update-status` - Update commitment status
- `POST /task-commitments/delete` - Delete commitment
- `POST /task-commitments/confirm-transaction` - Confirm blockchain transaction

**Contributor Management:**
- `POST /contributors/create` - Create contributor role for current user

---

## Task Commitment Status Flow

### Status Values & Transitions

```
PENDING_TX_COMMITMENT_MADE ──(confirm)──> COMMITMENT_MADE
         │                                      │
         │                                      v
         │                              (submit evidence)
         │                                      │
         v                                      v
PENDING_TX_ADD_INFO ────────(confirm)──> PENDING_APPROVAL
                                                │
                            ┌───────────────────┼───────────────────┐
                            v                   v                   v
          PENDING_TX_COMMITMENT_DENIED  PENDING_TX_COMMITMENT_ACCEPTED  PENDING_TX_COMMITMENT_REFUSED
                            │                   │                   │
                    (confirm)                   (confirm)           (confirm)
                            │                   │                   │
                            v                   v                   v
                  COMMITMENT_DENIED     COMMITMENT_ACCEPTED   COMMITMENT_REFUSED
                                                │
                                                v
                                      (claim rewards)
                                                │
                                                v
                                  PENDING_TX_GET_REWARDS ──(confirm)──> REWARDS_CLAIMED

Alternative paths:
COMMITMENT_MADE ──(abandon)──> PENDING_ABANDONED_BY_CONTRIBUTOR ──(confirm)──> ABANDONED_BY_CONTRIBUTOR
COMMITMENT_MADE ──(unlock)──> PENDING_TX_UNLOCKED_BY_CONTRIBUTOR ──(confirm)──> UNLOCKED_BY_CONTRIBUTOR
```

### PENDING_TX Protection
- Status updates are blocked while a blockchain transaction is pending (PENDING_TX_* status)
- Only the `/task-commitments/confirm-transaction` endpoint with transaction hash proof can update from PENDING_TX_* states
- This prevents race conditions between UI updates and blockchain confirmations

---

## Shared Components Used

- `AndamioAuthButton` - Authentication UI (`src/components/auth/andamio-auth-button.tsx`)
- `RenderEditor` - Tiptap editor renderer (`src/components/editor`)
- `TaskCommitment` - Task commitment workflow component (to be created: `src/components/contributor/task-commitment.tsx`)
- Andamio components (prefixed with `Andamio*`):
  - AndamioTable, AndamioCard, AndamioBadge, AndamioButton, AndamioDialog
  - AndamioAlert, AndamioSkeleton, AndamioInput, AndamioTextarea, AndamioLabel
  - AndamioSelect, AndamioSeparator
  - All use semantic color system with light/dark mode support
  - All styled with Tailwind CSS v4

---

## Key Features by Route Type

### Contributor Routes
- Browse public project catalog
- View project structure (tasks, rewards, prerequisites)
- View task details with acceptance criteria
- Create task commitments (requires contributor role)
- Submit evidence for commitments
- Track commitment status through blockchain confirmation
- Claim rewards for accepted work

### Manager/Owner Routes
- Manage owned projects (via `/studio/project`)
- Project dashboard with quick links to management areas
- Task CRUD operations (create, edit, delete draft tasks)
- View and filter task commitments
- Approve/deny commitments
- Treasury management and funding
- View transaction history

---

## Notes

1. **On-Chain Identifiers**: All routes use `treasury_nft_policy_id`, `task_hash`, and `contributor_policy_id` instead of internal database IDs
2. **Type Safety**: All routes import types from `andamio-db-api` package via npm workspace
3. **Loading States**: All routes implement skeleton loaders (AndamioSkeleton) during data fetching
4. **Error Handling**: All routes have error states with user-friendly messages using AndamioAlert
5. **Empty States**: All list/collection views have empty states with guidance and appropriate actions
6. **Responsive Design**: All routes use Andamio components (based on shadcn/ui) with Tailwind CSS v4
7. **Authentication Flow**: Uses `useAndamioAuth` hook with JWT stored in localStorage
8. **Role Verification**: Project Manager and Contributor roles verified via NBA API on-chain queries
9. **PENDING_TX Protection**: Status updates blocked during pending blockchain transactions
10. **Semantic Colors**: All components use semantic color variables (success, warning, info, destructive, etc.)
11. **POST for All Endpoints**: Unlike the Course API (REST-style), Project API uses POST for all endpoints with body parameters

---

## Future Routes (Not Yet Planned)

These are potential project-related routes that could be added:

- `/studio/project/create` - Create new project wizard
- `/my-contributions` - Contributor dashboard with all commitments across projects
- `/my-contributions/[treasurynft]` - Contributor progress for specific project
- `/project/[treasurynft]/contributors` - Public list of project contributors
- `/studio/project/[treasurynft]/analytics` - Project analytics and insights
- `/studio/project/[treasurynft]/settings` - Project settings and configuration

---

## Comparison: Course vs Project API Patterns

| Aspect | Course API | Project API |
|--------|------------|-------------|
| HTTP Methods | REST-style (GET, POST, PATCH, DELETE) | All POST with body parameters |
| Path Parameters | URL path params (`/courses/{id}`) | Body params (`{ treasury_nft_policy_id }`) |
| Identifiers | `courseNftPolicyId`, `moduleCode`, `moduleIndex` | `treasury_nft_policy_id`, `task_hash`, `task_index` |
| Role Verification | JWT claims | NBA API on-chain queries |
| Content Editor | Tiptap (`contentJson`) | Tiptap (`content_json`) |
| Status Protection | N/A | PENDING_TX protection |
