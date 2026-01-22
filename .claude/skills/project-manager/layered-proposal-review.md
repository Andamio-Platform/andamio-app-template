# Layered Architecture Proposal - Review Notes

**Last Updated**: 2026-01-22
**Proposal**: `layered-proposal.md`

## Status

| Layer | Status | Notes |
|-------|--------|-------|
| L1: Core | ✅ **Complete** | `@andamio/core` package built and linked, exports working |
| L2: Integration | ✅ **Phase 1 Complete** | Hooks reorganized; Phase 2 (andamioscan removal) deferred |
| L3: Components | ✅ **Phase 1 Complete** | Folder renamed, V2 components added, V1 deprecated |
| L4: Features | ⏸️ Deferred | Post-v2 launch extraction |
| L5: App | 🔄 Planning | Routes aligned with API |

**Build Order**: L1 + L2 + L3 + L5 (concurrent) → LAUNCH → L4 (extraction)

---

## L2 Progress (2026-01-22)

### Completed

| Task | Status | Notes |
|------|--------|-------|
| Hooks reorganization | ✅ Complete | `api/course/`, `api/project/`, `tx/`, `auth/`, `ui/` |
| Remove `use-pending-transactions.ts` | ✅ Complete | Was no-op stub, no usages |
| Update all imports | ✅ Complete | 35+ files updated to new paths |
| Create barrel exports | ✅ Complete | `src/hooks/index.ts` + subdirectory indexes |

### Current Structure

```
src/hooks/
├── index.ts                    # Main barrel export
├── api/
│   ├── index.ts               # API hooks barrel
│   ├── course/
│   │   ├── index.ts
│   │   ├── use-course.ts
│   │   ├── use-course-module.ts
│   │   ├── use-slt.ts
│   │   ├── use-lesson.ts
│   │   ├── use-student-courses.ts
│   │   ├── use-teacher-courses.ts
│   │   ├── use-owned-courses.ts
│   │   └── use-module-wizard-data.ts
│   └── project/
│       ├── index.ts
│       ├── use-project.ts
│       ├── use-contributor-projects.ts
│       └── use-manager-projects.ts
├── tx/
│   ├── index.ts
│   ├── use-transaction.ts
│   ├── use-tx-watcher.ts
│   ├── use-pending-tx-watcher.ts
│   └── use-event-confirmation.ts
├── auth/
│   ├── index.ts
│   └── use-andamio-auth.ts
└── ui/
    ├── index.ts
    ├── use-success-notification.ts
    └── use-wizard-navigation.ts
```

### L2 Phase 2 - Deferred Breaking Changes

| File | Issue | Dependents | Migration Path |
|------|-------|------------|----------------|
| `andamioscan.ts` (1497 lines) | Raw on-chain data | 10 files | Migrate to `useProject`, `useCourse` hooks (merged endpoints) |
| `cardano-indexer.ts` | TX confirmation | 1 file | Gateway TX State Machine handles this |
| `project-commitment-sync.ts` | Sync utilities | 2 files | Gateway auto-updates on TX confirmation |
| `project-task-sync.ts` | Sync utilities | 3 files | Gateway auto-updates on TX confirmation |

**Migration Notes:**
- `getProject()` → `useProject(projectId)` hook (already exists)
- `getCourse()` → `useCourse(courseId)` hook (already exists)
- `getManagingProjects()` → `useManagerProjects()` hook (already exists)
- Types need mapping: `AndamioscanTask` → `OrchestrationMergedProjectDetail.tasks`
- Sync utilities are no longer needed - Gateway TX State Machine handles DB updates automatically

### L1 Issue Resolved (2026-01-22)

`@andamio/core/hashing` module was not resolving because:
1. Package wasn't built (`dist/` folder missing)
2. Package wasn't linked in root `node_modules/`

**Fixed by:**
1. Running `npm run build` in `packages/core/`
2. Running `npm install` at root to link the package
3. TypeScript now resolves all 15 files correctly

---

## L3 Progress (2026-01-22)

### Completed

| Task | Status | Notes |
|------|--------|-------|
| Rename `transactions/` to `tx/` | ✅ Complete | `git mv` preserves history |
| Update all imports | ✅ Complete | 14 files updated to `~/components/tx/` |
| Create `TxStatusBadge` | ✅ Complete | V2 inline status indicator |
| Create `PendingTxList` | ✅ Complete | V2 gateway-based pending TX list |
| Mark V1 components deprecated | ✅ Complete | See deprecation notes below |

### Current Structure

```
src/components/tx/
├── index.ts                    # Exports all TX components
├── transaction-button.tsx      # V2 - Build → Sign → Submit → Register
├── transaction-status.tsx      # V2 - Inline status display
├── tx-status-badge.tsx         # V2 - Compact status badge (NEW)
├── pending-tx-list.tsx         # V2 - Gateway pending TXs (NEW)
├── mint-access-token-simple.tsx
├── create-course.tsx
├── create-project.tsx
├── enroll-in-course.tsx
├── mint-module-tokens.tsx
├── burn-module-tokens.tsx
├── teachers-update.tsx
├── assess-assignment.tsx
├── assignment-update.tsx
├── credential-claim.tsx
├── managers-manage.tsx
├── blacklist-manage.tsx
├── tasks-manage.tsx
├── tasks-assess.tsx
├── task-commit.tsx
├── task-action.tsx
├── project-credential-claim.tsx
└── course-prereqs-selector.tsx
```

### V1 Components Deprecated (2026-01-22)

The following V1 components are marked deprecated and will be removed in a future release:

| File | Reason | Replacement |
|------|--------|-------------|
| `src/components/pending-tx-watcher.tsx` | V1 client-side Koios polling | V2 `useTxWatcher` polls Gateway |
| `src/components/pending-tx-popover.tsx` | V1 UI for pending-tx-watcher | V2 `PendingTxList` uses Gateway |
| `src/components/provisioning/` | V1 TX monitoring overlay | V2 inline `TransactionStatus` |
| `src/hooks/tx/use-pending-tx-watcher.ts` | V1 Koios polling hook | V2 `useTxWatcher` |
| `src/lib/cardano-indexer.ts` | V1 Koios API calls | Gateway handles confirmation |

**Why V1 is deprecated:**
- V1 used client-side Koios polling to check TX confirmation
- V2 TX State Machine: Gateway polls Andamioscan server-side
- All 20+ TX components now use V2 `useTxWatcher` pattern
- V1 components have no active usages (verified via grep)

### L3 Phase 2 - Future Work

| Task | Priority | Notes |
|------|----------|-------|
| Remove V1 deprecated components | Low | Breaking change, do in major version |
| Add TX history component | Medium | Show past TXs from `/api/v2/tx/history` |
| Add batch TX status | Low | Multiple TXs in one view |

---

## Layer 1: Core - Working Scope (v2 launch)

| | |
|---|---|
| **Location** | `packages/core/` |
| **Publishable as** | `@andamio/core` |
| **Dependencies** | Zero React - only `@noble/hashes`, `cbor` |

### Proposed Structure (v2 launch)

```
packages/core/
├── utils/
│   ├── hashing/
│   │   ├── slt-hash.ts          # Module token name computation
│   │   ├── task-hash.ts         # Task hash computation
│   │   ├── commitment-hash.ts   # Assignment/task evidence hash
│   │   └── index.ts
│   ├── cbor-decoder.ts          # Transaction CBOR decoding
│   ├── cardano.ts               # Lovelace/ADA conversion
│   ├── access-token.ts          # Access token building/parsing
│   └── index.ts
│
├── constants/
│   ├── cardano.ts               # Explorer URLs, networks, polling intervals
│   ├── policies.ts              # Policy IDs by network
│   └── index.ts
│
└── index.ts
```

### What Moves to Core

| From | File | To |
|------|------|----|
| `packages/andamio-transactions/src/utils/` | `slt-hash.ts` | `packages/core/utils/hashing/` |
| `packages/andamio-transactions/src/utils/` | `task-hash.ts` | `packages/core/utils/hashing/` |
| `packages/andamio-transactions/src/utils/` | `assignment-info-hash.ts` | `packages/core/utils/hashing/commitment-hash.ts` |
| `packages/andamio-transactions/src/utils/` | `cbor-decoder.ts` | `packages/core/utils/` |
| `src/lib/` | `cardano-utils.ts` | `packages/core/utils/cardano.ts` |
| `src/lib/` | `access-token-utils.ts` | `packages/core/utils/access-token.ts` |
| `src/lib/constants.ts` | Explorer URLs, polling intervals | `packages/core/constants/cardano.ts` |
| (new) | Policy IDs by network | `packages/core/constants/policies.ts` |

### Work in Progress

| Category | Status | Rationale |
|----------|--------|-----------|
| Types (`types/`) | **Hold** | Keep auto-generated from API spec until stable |
| Transaction schemas (`config/`) | **Decided** | Gateway API owns schemas - see Decisions Made |
| Protocol costs (`costs.ts`) | **Hold** | Review with TX schema decision |

### What Stays in `@andamio/transactions`

| Item | Rationale |
|------|-----------|
| Transaction definitions (`definitions/`) | Deprecated V1 - review for removal |
| Registry (`registry.ts`) | Deprecated V1 - update from current App Template |
| Execution utilities (`execution/`) | Deprecated V1 |
| Testing utilities (`testing/`) | May move to core later |
| Schema helpers (`schema-helpers.ts`) | Review with TX schema decision |

### Priorities

1. ✅ **Complete**: Hash utilities (`utils/hashing/`) - `slt-hash.ts`, `task-hash.ts`, `commitment-hash.ts`
2. ✅ **Complete**: Constants (`constants/`) - `cardano.ts`, `policies.ts`
3. **Hold**: Types - keep auto-generated from API spec until stable
4. **Decided**: Transaction schemas - Gateway API is authority (see Decisions Made)

---

## Layer 2: Integration - Working Scope (v2 launch)

| | |
|---|---|
| **Location** | `src/lib/`, `src/hooks/`, `src/contexts/` |
| **Simplification** | Single Gateway API only - no abstraction for multiple backends |

### Single API Surface

```
Gateway API ← only this
   ├── /api/v2/*     (includes auth/, tx/, {system}/)
```

### Proposed Structure (v2 launch)

```
src/
├── lib/
│   ├── gateway.ts              # Single API client - follows Andamio API spec
│   ├── andamio-auth.ts         # Auth service (uses gateway)
│   ├── utils.ts                # cn() utility
│   └── state/
│       ├── project-eligibility.ts
│       └── course-filters.ts
│
├── hooks/
│   ├── api/                    # Organized by system per API taxonomy
│   │   ├── course/
│   │   │   ├── use-course.ts
│   │   │   ├── use-course-module.ts
│   │   │   ├── use-slt.ts
│   │   │   ├── use-lesson.ts
│   │   │   ├── use-student-courses.ts
│   │   │   └── use-teacher-courses.ts
│   │   └── project/
│   │       ├── use-project.ts
│   │       ├── use-contributor-projects.ts
│   │       └── use-manager-projects.ts
│   ├── tx/
│   │   ├── use-transaction.ts      # Rename from use-simple-transaction.ts
│   │   └── use-tx-watcher.ts
│   ├── auth/
│   │   └── use-andamio-auth.ts
│   └── ui/
│       ├── use-success-notification.ts
│       └── use-wizard-navigation.ts
│
└── contexts/
    ├── andamio-auth-context.tsx
    └── pending-tx-context.tsx
```

### Renames

| Current | New | Notes |
|---------|-----|-------|
| `use-simple-transaction.ts` | `use-transaction.ts` | Now the primary TX hook, "simple" no longer applies |

### Files to Remove

| File | Rationale |
|------|-----------|
| `andamioscan.ts` | Gateway provides all data via `/api/v2/*` |
| `cardano-indexer.ts` | TX State Machine handles confirmation server-side |
| `andamio-gateway.ts` | Just follow API spec directly |
| `use-andamio-transaction.ts` | V1 pattern, replaced by `use-transaction.ts` |
| `use-pending-transactions.ts` | No-op stub |
| `use-andamio-fetch.ts` | Migrate usages to React Query |

---

## Layer 3: Components - Working Scope (v2 launch)

| | |
|---|---|
| **Location** | `src/components/` |

### TX State Machine Pattern (V2)

Layer 3 TX components must align with the Gateway's TX State Machine:

```
1. BUILD    → POST /api/v2/tx/*           → unsigned_tx
2. SIGN     → wallet.signTx(unsigned_tx)  → signed_tx
3. SUBMIT   → wallet.submitTx(signed_tx)  → tx_hash
4. REGISTER → POST /api/v2/tx/register    → tracking starts
5. POLL     → GET /api/v2/tx/status/{tx_hash} (optional)
6. AUTO     → Gateway polls Andamioscan & updates DB
```

**State Transitions:**
```
pending → confirmed → updated  (success)
pending → failed | expired     (error)
```

### Proposed Structure (v2 launch)

```
src/components/
├── ui/                         # shadcn primitives (keep)
├── andamio/                    # Andamio UI extensions (keep)
├── icons/                      # Semantic icons (keep)
├── editor/                     # Tiptap system (keep)
├── auth/                       # Auth UI (keep)
├── layout/                     # Layout components (keep)
│
├── tx/                         # Transaction UI (REVISED)
│   ├── transaction-button.tsx      # Build → Sign → Submit → Register
│   ├── transaction-status.tsx      # Displays pending/confirmed/updated
│   ├── tx-status-badge.tsx         # Inline status indicator
│   ├── pending-tx-list.tsx         # List of user's pending TXs
│   └── index.ts
│
└── domain/                     # Domain-specific (keep structure)
    ├── course/
    ├── project/
    ├── dashboard/
    ├── studio/
    ├── learner/
    └── instructor/
```

### TX Components - V2 Pattern

| Component | Purpose | Uses |
|-----------|---------|------|
| `transaction-button.tsx` | Unified TX flow (build→sign→submit→register) | `use-transaction.ts` hook |
| `transaction-status.tsx` | Shows TX state with polling | `use-tx-watcher.ts` hook |
| `tx-status-badge.tsx` | Inline badge: pending/confirmed/updated | Gateway status API |
| `pending-tx-list.tsx` | User's pending TXs from `/api/v2/tx/pending` | Gateway pending API |

### Files to Rename

| Current | New | Notes |
|---------|-----|-------|
| `transactions/` | `tx/` | Folder rename |

### Files to Remove (V1 Pattern)

| File | Rationale |
|------|-----------|
| `pending-tx-watcher.tsx` | V1 client-side Koios polling - replaced by gateway |
| `pending-tx-popover.tsx` | V1 pattern - consolidate into `pending-tx-list.tsx` |
| `provisioning/` folder | V1 TX monitoring overlay - review if still needed |

### Files to Keep (Review Logic)

| File | Status | Notes |
|------|--------|-------|
| `mint-access-token-simple.tsx` | **Keep** | Already uses V2 pattern |
| Other TX components in `transactions/` | **Review** | Update to V2 pattern if using V1 |

### Key Integration Points

**From Layer 2:**
- `use-transaction.ts` - Handles BUILD → SIGN → SUBMIT → REGISTER
- `use-tx-watcher.ts` - Polls `/api/v2/tx/status/{tx_hash}`
- `pending-tx-context.tsx` - Global state for pending TXs

**TX Status Display:**
```typescript
// Example: Show TX status after submission
const { status } = useTxWatcher(txHash);

switch (status?.state) {
  case 'pending':    return <Badge variant="warning">Pending</Badge>;
  case 'confirmed':  return <Badge variant="info">Confirmed</Badge>;
  case 'updated':    return <Badge variant="success">Complete</Badge>;
  case 'failed':     return <Badge variant="destructive">Failed</Badge>;
  case 'expired':    return <Badge variant="destructive">Expired</Badge>;
}
```

### Reference

See Andamio API docs for TX State Machine details:
- `andamio-api/.claude/skills/project-manager/TX_STATE_MACHINE_TRACKER.md`
- `andamio-api/docs/FRONTEND_V2_CHECKLIST.md`

---

## Layer 4: Features - POST V2 LAUNCH

| | |
|---|---|
| **Location** | `src/features/` (NEW - does not exist yet) |
| **Status** | Deferred to post-v2 launch |

### Build Order

```
L1 + L2 + L3 + L5 (concurrent) → LAUNCH → L4 (extraction)
```

**Rationale**: Layer 4 is extracted FROM a working Layer 5. You can't build reusable features until you have an opinionated app to extract them from.

### Gateway API Perspective

The app sees a simple API structure - no distinction between "merged" or other endpoints:

```
/api/v2/
├── auth/       # Authentication
├── course/     # Course data (by role: student, teacher, owner)
├── project/    # Project data (by role: contributor, manager, owner)
└── tx/         # Transactions (SPECIAL - state machine)
```

Only `/tx/*` endpoints are "special" due to the BUILD → SIGN → SUBMIT → REGISTER → POLL flow. All other endpoints are just data endpoints.

### Proposed Structure (v1)

Organized by `{system}/{role}` matching Gateway API:

```
src/features/
├── course/
│   ├── student/                # /api/v2/course/student/*
│   │   ├── enrollment/
│   │   ├── my-learning/
│   │   └── credentials/
│   ├── teacher/                # /api/v2/course/teacher/*
│   │   ├── module-editor/
│   │   └── assignment-reviewer/
│   └── owner/                  # /api/v2/course/owner/*
│       └── course-manager/
│
└── project/
    ├── contributor/            # /api/v2/project/contributor/*
    │   ├── task-commitment/
    │   ├── evidence-submission/
    │   └── reward-claiming/
    ├── manager/                # /api/v2/project/manager/*
    │   ├── task-editor/
    │   └── submission-reviewer/
    └── owner/                  # /api/v2/project/owner/*
        ├── project-manager/
        └── treasury-manager/
```

### V2 Transaction Mapping

Each feature that involves transactions uses V2 TX State Machine:

| Feature | TX Type (gateway) | Endpoint |
|---------|-------------------|----------|
| **course/student** |
| `enrollment/` | `assignment_submit` | `/tx/course/student/assignment/commit` |
| `credentials/` | `credential_claim` | `/tx/course/student/credential/claim` |
| **course/teacher** |
| `module-editor/` | `modules_manage` | `/tx/course/teacher/modules/manage` |
| `assignment-reviewer/` | `assessment_assess` | `/tx/course/teacher/assignments/assess` |
| **course/owner** |
| `course-manager/` | `course_create` | `/tx/instance/owner/course/create` |
| **project/contributor** |
| `task-commitment/` | `project_join` | `/tx/project/contributor/task/commit` |
| `evidence-submission/` | `task_submit` | `/tx/project/contributor/task/action` |
| `reward-claiming/` | `project_credential_claim` | `/tx/project/contributor/credential/claim` |
| **project/manager** |
| `task-editor/` | `tasks_manage` | `/tx/project/manager/tasks/manage` |
| `submission-reviewer/` | `task_assess` | `/tx/project/manager/tasks/assess` |
| **project/owner** |
| `project-manager/` | `project_create` | `/tx/instance/owner/project/create` |
| `treasury-manager/` | `treasury_fund` | `/tx/project/user/treasury/add-funds` |

### Data Endpoints by Feature

| Feature | Primary Data Endpoints |
|---------|----------------------|
| **course/student** |
| `enrollment/` | `/course/student/assignment-commitments/list` |
| `my-learning/` | `/course/student/courses/list` |
| **course/teacher** |
| `module-editor/` | `/course/teacher/course-modules/list` |
| `assignment-reviewer/` | `/course/teacher/assignment-commitments/list` |
| **course/owner** |
| `course-manager/` | `/course/owner/courses/list` |
| **project/contributor** |
| `task-commitment/` | `/project/contributor/commitments/list` |
| **project/manager** |
| `task-editor/` | `/project/manager/tasks/list` |
| `submission-reviewer/` | `/project/manager/commitments/list` |
| **project/owner** |
| `project-manager/` | `/project/owner/projects/list` |

### Notes

- **Post-v2 launch**: Extract features from working Layer 5 app
- Features accept configuration via props (no direct env access)
- Each feature is self-contained and can be imported individually
- Enables future template variants (minimal, headless, full)

---

## Layer 5: App - Working Scope (v2 launch)

| | |
|---|---|
| **Location** | `src/app/` and `src/config/` |
| **Responsibility** | Most opinionated layer. Routes, layouts, branding, configuration. |

### Naming Conventions

| Context | Convention | Example |
|---------|------------|---------|
| URL paths | kebab-case | `/draft-tasks/`, `/my-learning/` |
| Dynamic params | camelCase | `[courseId]`, `[projectId]` |
| API params | snake_case | `course_id`, `project_id` |

### Route Inventory

**Public Routes** → API: `course/user/*`, `project/user/*`

| Route | Purpose | API Endpoint |
|-------|---------|--------------|
| `/` | Landing page | - |
| `/course` | Course catalog | `/course/user/courses/list` |
| `/course/[courseId]` | Course detail | `/course/user/course/get/{course_id}` |
| `/course/[courseId]/[moduleCode]` | Module detail | `/course/user/course-modules/list` |
| `/course/[courseId]/[moduleCode]/[lessonIndex]` | Lesson detail | `/course/user/lessons/list` |
| `/course/[courseId]/[moduleCode]/assignment` | Assignment view | `/course/user/slts/list` |
| `/project` | Project catalog | `/project/user/projects/list` |
| `/project/[projectId]` | Project detail | `/project/user/project/get/{project_id}` |
| `/project/[projectId]/[taskHash]` | Task detail | `/project/user/tasks/list` |

**Authenticated - Student/Contributor** → API: `course/student/*`, `project/contributor/*`

| Route | Purpose | API Role |
|-------|---------|----------|
| `/dashboard` | User dashboard | `course/student/*`, `project/contributor/*` |
| `/credentials` | User credentials | - (on-chain query) |
| `/project/[projectId]/contributor` | Contributor workflow | `project/contributor/*` |

**Authenticated - Studio (Course)** → API: `course/owner/*`, `course/teacher/*`

| Route | Purpose | API Role |
|-------|---------|----------|
| `/studio` | Studio hub | - |
| `/studio/course` | Course list | `course/owner/courses/list` |
| `/studio/course/[courseId]` | Course editor | `course/owner/*` |
| `/studio/course/[courseId]/[moduleCode]` | Module wizard | `course/teacher/*` |
| `/studio/course/[courseId]/instructor` | Teacher management | `course/owner/*` (teachers) |

**Authenticated - Studio (Project)** → API: `project/owner/*`, `project/manager/*`

| Route | Purpose | API Role |
|-------|---------|----------|
| `/studio/project` | Project list | `project/owner/projects/list` |
| `/studio/project/[projectId]` | Project dashboard | `project/owner/*` |
| `/studio/project/[projectId]/manager` | Manager view | `project/manager/*` |
| `/studio/project/[projectId]/commitments` | Review submissions | `project/manager/commitments/list` |
| `/studio/project/[projectId]/draft-tasks` | Task list | `project/manager/tasks/list` |
| `/studio/project/[projectId]/draft-tasks/new` | Create task | `project/manager/*` |
| `/studio/project/[projectId]/draft-tasks/[taskIndex]` | Edit task | `project/manager/*` |
| `/studio/project/[projectId]/manage-treasury` | Treasury management | `project/owner/*` |

**Utility Routes**

| Route | Purpose |
|-------|---------|
| `/sitemap` | Route documentation |
| `/components` | UI showcase |
| `/editor` | Editor demo |
| `/api-setup` | API registration wizard |

**API Routes**

| Route | Purpose | Notes |
|-------|---------|-------|
| `/api/gateway/[...path]` | Gateway proxy | Single API surface |
| `/api/trpc/[trpc]` | tRPC handler | Internal |

~~`/api/koios/[...path]`~~ - **Removed** (TX State Machine handles confirmation server-side)

### Route Groups

| Group | Layout | Purpose |
|-------|--------|---------|
| `(app)/` | AppLayout (sidebar) | Main app routes |
| `(studio)/` | StudioLayout | Studio routes |
| `(marketing)/` | Minimal | Landing page |

### Parameter Renames

| Current | New | Rationale |
|---------|-----|-----------|
| `[coursenft]` | `[courseId]` | Matches API param, clearer |
| `[projectid]` | `[projectId]` | camelCase consistency |
| `[moduleindex]` | `[lessonIndex]` | Clearer - it's the lesson index |
| `[taskindex]` | `[taskHash]` | Content-addressed identifier per API taxonomy |

### Config Files

**Keep:**
- `src/config/transaction-ui.ts` - TX UI config
- `src/config/transaction-schemas.ts` - Zod schemas (review with TX schema decision)
- `src/config/index.ts` - Re-exports

**Create:**
- `src/config/branding.ts` - App name, logo, tagline
- `src/config/features.ts` - Feature flags
- `src/config/navigation.ts` - Extract from app-sidebar.tsx
- `src/config/routes.ts` - Route definitions
- `src/config/ui-constants.ts` - UI timeouts, pagination

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Start Layer 1 with hash utils + constants | Low risk, immediate value |
| 2026-01-20 | Hold on types until API stable | Auto-generated types are working |
| 2026-01-20 | TX schemas: Gateway API is authority | See resolved question below |
| 2026-01-20 | `@andamio/transactions` merged into App Template | Refine first, then decide core vs separate package |
| 2026-01-20 | Remove `andamioscan.ts` (1497 lines) | No longer needed - Gateway provides all data |
| 2026-01-20 | Remove complex sync utilities | No longer needed - TX State Machine handles this |
| 2026-01-20 | Align template and package versions | Major releases stay in sync |

---

## Feedback Log

| Date | Topic | Feedback | Resolution |
|------|-------|----------|------------|
| 2026-01-20 | Migration approach | Incremental is already implied by phases | Confirmed |
| 2026-01-20 | Layer 1 scope | Hash utils + constants now, types later | Agreed |
| 2026-01-20 | TX schemas | Gateway API adds opinionated metadata | Resolved - Gateway is authority |

---

## Next Steps

1. [x] Review Layer 1 scope
2. [x] Review Layer 2 scope
3. [x] Review Layer 3 scope
4. [x] Review Layer 4 scope (deferred to post-launch)
5. [x] Review Layer 5 scope
6. [x] Resolve TX schema ownership question with team
7. [x] **L1 Core Implementation** - `@andamio/core` package complete
8. [x] **L2 Integration - Phase 1** - Reorganize hooks into new structure
9. [x] **L1 Fix** - Fix `@andamio/core/hashing` export (package built + linked)
10. [ ] **L2 Integration - Phase 2** - Migrate 10 files from `andamioscan.ts` to merged hooks (deferred)
11. [x] **L3 Components - Phase 1** - Folder renamed `tx/`, V2 components added, V1 deprecated
12. [ ] Assign layer owners based on time + interests
13. [ ] Create Phase 2 task breakdown

### Build Order for V2 Launch

```
┌─────────────────────────────────────┐
│  L1 (Core)         ─┐               │
│  L2 (Integration)  ─┼─ concurrent → LAUNCH
│  L3 (Components)   ─┤                 ↓
│  L5 (App)          ─┘       L4 (Features) - post-launch extraction
└─────────────────────────────────────┘
```

---

## Resolved Questions

All open questions have been resolved. Answers recorded here for reference.

### 1. Transaction Schema Ownership

**Question**: Does Layer 1 (Core) include transaction schemas, or does Gateway API remain the authority?

**Answer**: Gateway API is the authority. Two layers exist:

| Layer | What it defines | Lives in |
|-------|-----------------|----------|
| **Protocol** | On-chain schemas (datums, redeemers) | Could go in `@andamio/core` later |
| **Andamio API** | DB-required fields (`alias`, `course_id`, etc.) | Gateway API (authority) |

**Decision**: Option C (Composition) - Core contains protocol primitives only. `@andamio/transactions` is merged into App Template for now. After refinement, decide whether to:
- Keep protocol-only schemas in `@andamio/core` (un-opinionated, on-chain only)
- Keep Andamio-specific schemas in a separate `@andamio/transactions` package

### 2. Separate repo for `packages/core/`?

**Answer**: Can do any time. James can take this because he's been testing already.

### 3. Merge `@andamio/transactions` into core?

**Answer**: Merged into App Template for now. Refine and resolve schema questions, then decide:
- `@andamio/core`: un-opinionated, on-chain only
- Separate package: Andamio API schema

### 4. How to handle 1497-line `andamioscan.ts`?

**Answer**: No longer needed. Gateway provides all data via `/api/v2/*`.

### 5. How to handle complex sync utilities (447 + 622 lines)?

**Answer**: No longer needed. TX State Machine handles this server-side.

### 6. `(docs)/` routes - static or dynamic?

**Answer**: We have both at docs.andamio.io. Can clean up later.

### 7. Minimum viable template for `templates/minimal/`?

**Answer**: Still TBD. Want to see T3 App Template working first, then step back and see what can be removed into the minimal template.

### 8. Storybook for Layer 3 components?

**Answer**: Yes, good idea. Whoever takes ownership of Layer 3 should decide implementation details.

### 9. Version template vs packages?

**Answer**: Align them for every major release.

---

## Remaining Open Items

1. **Platform Engineering roles** - Assign an owner to each Layer based on time constraints + interests
2. **Minimal template scope** - Define after T3 App Template is stable
