# Layered Architecture Proposal - Review Notes

**Last Updated**: 2026-01-20
**Proposal**: `layered-proposal.md`

## Status

| Layer | Status | Notes |
|-------|--------|-------|
| L1: Core | 🔄 Planning | Hash utils + constants first |
| L2: Integration | 🔄 Planning | Single Gateway API |
| L3: Components | 🔄 Planning | V2 TX State Machine pattern |
| L4: Features | ⏸️ Deferred | Post-v2 launch extraction |
| L5: App | 🔄 Planning | Routes aligned with API |

**Build Order**: L1 → L2 → L3 → L5 → LAUNCH → L4

## Open Questions

1. **TX Schema Ownership** - Does Layer 1 (Core) include transaction schemas, or does Gateway API remain the authority? See [details](#1-transaction-schema-ownership-critical).
2. **Platform Engineering roles** - This is a significant amount of work, and things could definitely break. But if we play it right, good chance for our team to practice working together. Let's assign an owner to each Layer based on time constraints + intererests.

---

## Layer 1: Core - Working Scope (v1)

**Location**: `packages/core/`
**Publishable as**: `@andamio/core`
**Dependencies**: Zero React - only `@noble/hashes`, `cbor`

### Proposed Structure (v1)

```
packages/core/
├── utils/
│   ├── hashing/
│   │   ├── slt-hash.ts          # Module token name computation
│   │   ├── task-hash.ts         # Task ID computation
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

### Deferred (v1)

| Category | Status | Rationale |
|----------|--------|-----------|
| Types (`types/`) | **Hold** | Keep auto-generated from API spec until stable |
| Transaction schemas (`config/`) | **Open question** | Gateway API owns schemas - see Open Questions |
| Protocol costs (`costs.ts`) | **Hold** | Review with TX schema decision |

### What Stays in `@andamio/transactions`

| Item | Rationale |
|------|-----------|
| Transaction definitions (`definitions/`) | Deprecated V1 - review for removal |
| Registry (`registry.ts`) | Deprecated V1 |
| Execution utilities (`execution/`) | Deprecated V1 |
| Testing utilities (`testing/`) | May move to core later |
| Schema helpers (`schema-helpers.ts`) | Review with TX schema decision |

### Priorities

1. **Start now**: Hash utilities (`utils/hashing/`) - pure protocol math, no dependencies on API
2. **Start now**: Constants (`constants/`) - explorer URLs, policy IDs, network config
3. **Hold**: Types - keep auto-generated from API spec until stable
4. **Open question**: Transaction schemas - resolve Gateway API ownership first

---

## Open Questions

### 1. Transaction Schema Ownership (Critical)

**Context**: The TX State Machine pattern means the Gateway API now handles:
- Server-side transaction monitoring
- Automatic DB updates via TxTypeRegistry
- State machine: `pending → confirmed → updated`

This creates two layers of transaction schema:

| Layer | What it defines | Example fields |
|-------|-----------------|----------------|
| **Protocol** | What the blockchain needs | `initiator_data`, `datum`, `redeemer`, `validator_refs` |
| **Andamio API** | What the DB needs | `alias`, `course_id`, `teachers[]`, state machine metadata |

**The tension**: Andamio API exposes transactions with additional metadata required for the DB. This is already "opinionated" - it's the Andamio way, not pure Cardano protocol.

**Options under consideration**:

| Option | Core contains | Andamio TX schemas live in |
|--------|---------------|---------------------------|
| **A: Protocol-only** | Pure on-chain schemas (datums, redeemers) | Layer 2 (Integration) |
| **B: No TX schemas** | Hash utils, CBOR, constants only | Gateway API is authority |
| **C: Composition** | Protocol primitives | Separate `@andamio/transactions` that composes with Core |

**Questions to resolve**:
1. Are protocol-only schemas useful without Andamio context?
2. Should the Gateway API remain the single source of truth for TX schemas?
3. How do we version TX schemas when Gateway API changes?

**Action**: Needs team discussion before proceeding.

---

### 2. Other Open Questions (From Proposal)

| # | Question | Status |
|---|----------|--------|
| 1 | Separate repo for `packages/core/`? | Defer - keep in monorepo for now |
| 2 | Merge `@andamio/transactions` into core? | Depends on Q1 above |
| 3 | ~~Split `andamioscan.ts`?~~ | N/A - removing entirely |
| 4 | Layer 4 (Features) - required or aspirational? | Needs team input |
| 5 | `(docs)/` routes - static or dynamic? | Defer |
| 6 | Templates priority? | Defer - stabilize first |
| 7 | Storybook for components? | Defer |

---

## Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Start Layer 1 with hash utils + constants | Low risk, immediate value |
| 2026-01-20 | Hold on types until API stable | Auto-generated types are working |
| 2026-01-20 | TX schemas need further review | Gateway ownership complicates Layer 1 scope |

---

## Feedback Log

| Date | Topic | Feedback | Resolution |
|------|-------|----------|------------|
| 2026-01-20 | Migration approach | Incremental is already implied by phases | Confirmed |
| 2026-01-20 | Layer 1 scope | Hash utils + constants now, types later | Agreed |
| 2026-01-20 | TX schemas | Gateway API adds opinionated metadata | Open question |

---

## Layer 2: Integration - Working Scope (v1)

**Simplification**: For v1, Layer 2 only works with the single Gateway API. No abstraction for multiple backends.

### Single API Surface

```
Gateway API ← only this
   ├── /api/v2/*     (includes auth/, tx/, {system}/)
```

### Proposed Structure (v1)

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
│   ├── api/
│   │   ├── use-course.ts
│   │   ├── use-course-module.ts
│   │   ├── use-slt.ts
│   │   ├── use-lesson.ts
│   │   ├── use-project.ts
│   │   ├── use-student-courses.ts
│   │   ├── use-teacher-courses.ts
│   │   ├── use-contributor-projects.ts
│   │   └── use-manager-projects.ts
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

## Layer 3: Components - Working Scope (v1)

**Location**: `src/components/`

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

### Proposed Structure (v1)

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

**Location**: `src/features/` (NEW - does not exist yet)
**Status**: **Deferred to post-v2 launch**

### Build Order

```
L1 (Core) → L2 (Integration) → L3 (Components) → L5 (App) → LAUNCH → L4 (Features)
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

---

## Layer 5: App - Working Scope (v1)

**Location**: `src/app/` and `src/config/`
**Responsibility**: Most opinionated layer. Routes, layouts, branding, configuration.

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
| `[taskindex]` | `[taskIndex]` | camelCase consistency |

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

## Next Steps

1. [x] Review Layer 1 scope
2. [x] Review Layer 2 scope
3. [x] Review Layer 3 scope
4. [x] Review Layer 4 scope (deferred to post-launch)
5. [x] Review Layer 5 scope
6. [ ] Resolve TX schema ownership question with team
7. [ ] Create Phase 1 task breakdown after decisions

### Build Order for V2 Launch

```
L1 (Core) → L2 (Integration) → L3 (Components) → L5 (App) → LAUNCH
                                                              ↓
                                                    L4 (Features) - post-launch extraction
```
6. [ ] Create Phase 1 task breakdown after decisions
