# Layered Architecture Proposal

## Overview

A five-layer architecture where dependencies flow upward only. Lower layers are more reusable and unopinionated; higher layers are more complete and opinionated.

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: APP (Most Opinionated)                           │
│  Routes, layouts, branding, configuration                   │
├─────────────────────────────────────────────────────────────┤
│  LAYER 4: FEATURES (Complete Journeys)                     │
│  Student flow, Contributor flow, Studio flows              │
├─────────────────────────────────────────────────────────────┤
│  LAYER 3: COMPONENTS (UI Building Blocks)                  │
│  Domain components, transaction UI, layouts                 │
├─────────────────────────────────────────────────────────────┤
│  LAYER 2: INTEGRATION (Hooks & State)                      │
│  API hooks, auth, contexts, state machines                  │
├─────────────────────────────────────────────────────────────┤
│  LAYER 1: CORE (Protocol Layer)                            │
│  Transactions, types, hashes, constants                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Current State Inventory

Before migration, here is what currently exists:

### Packages (1 package)
- `packages/andamio-transactions/` - 15 V2 transaction definitions, hash utilities, execution utilities, testing utilities

### Source Files
- `src/components/` - 242 files across 14 subdirectories
- `src/hooks/` - 22 files (10 API hooks, 7 TX hooks, 5 utility hooks)
- `src/lib/` - 17 files (API clients, utilities, sync logic)
- `src/contexts/` - 1 file (auth context)
- `src/types/` - 3 files (ui types, transaction types, generated API types)
- `src/config/` - 3 files (transaction UI, transaction schemas, index)
- `src/app/` - 28 page routes across 2 route groups

---

## Layer Definitions

### Layer 1: Core (Protocol)

**Location:** `packages/core/`

**Responsibility:** Pure protocol logic with zero React or Next.js dependencies.

**What to include:**

From `packages/andamio-transactions/`:
- `src/utils/slt-hash.ts` - Module hash computation (222 lines)
- `src/utils/assignment-info-hash.ts` - Evidence hash computation (255 lines)
- `src/utils/task-hash.ts` - Task ID computation (268 lines)
- `src/utils/cbor-decoder.ts` - Transaction CBOR decoding
- `src/utils/protocol-reference.ts` - Protocol costs and spec references (212 lines)
- `src/types/schema.ts` - Core transaction types (partial - see split below)

From `src/lib/`:
- `cardano-utils.ts` - Lovelace/ADA conversion (101 lines)
- `access-token-utils.ts` - Access token building/parsing (92 lines)
- `hashing.ts` - Content hashing utilities (39 lines)

From `src/config/`:
- `transaction-schemas.ts` - Zod validation schemas (422 lines)

New files to create:
- `constants/cardano.ts` - Explorer URLs, polling intervals, network configs
- `constants/policies.ts` - Policy IDs by network
- `types/entities.ts` - Course, Project, Task, Credential entity types
- `types/states.ts` - All state enums (transaction states, entity states)

**What stays in `@andamio/transactions`:**
- All transaction definitions (`src/definitions/`)
- Registry (`src/registry.ts`)
- Execution utilities (`src/execution/`)
- Testing utilities (`src/testing/`)
- Schema helpers (`src/utils/schema-helpers.ts`)
- Transaction-specific types from `src/types/schema.ts`

**Publishable as:** `@andamio/core`

**Dependencies:** Zero React, only external packages (zod, @noble/hashes, cbor)

---

### Layer 2: Integration (Hooks & State)

**Location:** `src/lib/`, `src/hooks/`, `src/contexts/`

**Responsibility:** React-aware integration layer. Provides hooks and utilities for connecting to Andamio protocol without prescribing UI.

**Current inventory to reorganize:**

`src/lib/` (17 files → reorganize into subfolders):

| Current File | Target Location | Notes |
|--------------|-----------------|-------|
| `gateway.ts` | `src/lib/api/gateway.ts` | Primary API client |
| `andamio-auth.ts` | `src/lib/auth/andamio-auth.ts` | Auth service |
| `andamioscan.ts` | `src/lib/api/andamioscan.ts` | Indexer client (1497 lines) |
| `cardano-indexer.ts` | `src/lib/api/cardano-indexer.ts` | Koios client |
| `andamio-gateway.ts` | `src/lib/api/andamio-gateway.ts` | Merged endpoints (review for removal) |
| `api-utils.ts` | `src/lib/api/utils.ts` | API utilities |
| `project-eligibility.ts` | `src/lib/state/project-eligibility.ts` | Eligibility checking |
| `project-commitment-sync.ts` | `src/lib/sync/project-commitment-sync.ts` | Sync logic (447 lines) |
| `project-task-sync.ts` | `src/lib/sync/project-task-sync.ts` | Sync logic (622 lines) |
| `course-filters.ts` | `src/lib/state/course-filters.ts` | Filtering logic |
| `constants.ts` | Split: UI → `src/config/`, Cardano → `packages/core/` | |
| `utils.ts` | `src/lib/utils.ts` | Keep (Tailwind cn utility) |
| `debug-logger.ts` | `src/lib/utils/debug-logger.ts` | Dev utility |
| `tx-logger.ts` | `src/lib/utils/tx-logger.ts` | Dev utility |
| `cardano-utils.ts` | Move to `packages/core/` | |
| `access-token-utils.ts` | Move to `packages/core/` | |
| `hashing.ts` | Move to `packages/core/` | |

`src/hooks/` (22 files → reorganize):

| Current Location | Target Location | Notes |
|------------------|-----------------|-------|
| `api/use-course.ts` | `src/hooks/api/use-course.ts` | Keep |
| `api/use-course-module.ts` | `src/hooks/api/use-course-module.ts` | Keep |
| `api/use-slt.ts` | `src/hooks/api/use-slt.ts` | Keep |
| `api/use-lesson.ts` | `src/hooks/api/use-lesson.ts` | Keep |
| `api/use-project.ts` | `src/hooks/api/use-project.ts` | Keep |
| `api/use-student-courses.ts` | `src/hooks/api/use-student-courses.ts` | Keep |
| `api/use-teacher-courses.ts` | `src/hooks/api/use-teacher-courses.ts` | Keep |
| `api/use-contributor-projects.ts` | `src/hooks/api/use-contributor-projects.ts` | Keep |
| `api/use-manager-projects.ts` | `src/hooks/api/use-manager-projects.ts` | Keep |
| `use-transaction.ts` | `src/hooks/tx/use-transaction.ts` | V1 core |
| `use-simple-transaction.ts` | `src/hooks/tx/use-simple-transaction.ts` | V2 core |
| `use-tx-watcher.ts` | `src/hooks/tx/use-tx-watcher.ts` | V2 polling |
| `use-pending-tx-watcher.ts` | `src/hooks/tx/use-pending-tx-watcher.ts` | Client tracking |
| `use-event-confirmation.ts` | `src/hooks/tx/use-event-confirmation.ts` | Events API |
| `use-andamio-auth.ts` | `src/hooks/auth/use-andamio-auth.ts` | Re-export |
| `use-success-notification.ts` | `src/hooks/ui/use-success-notification.ts` | UI state |
| `use-wizard-navigation.ts` | `src/hooks/ui/use-wizard-navigation.ts` | Wizard state |
| `use-module-wizard-data.ts` | `src/hooks/api/use-module-wizard-data.ts` | Data aggregation |
| `use-andamio-transaction.ts` | DELETE | Deprecated V1 |
| `use-pending-transactions.ts` | DELETE | No-op stub |
| `use-andamio-fetch.ts` | MIGRATE | Migrate usages to React Query |
| `use-owned-courses.ts` | MIGRATE | Migrate to use-course.ts |

`src/contexts/` (1 file → expand):

| Current | Add |
|---------|-----|
| `andamio-auth-context.tsx` | Keep |
| (missing) | `pending-tx-context.tsx` - Move from components/providers |

---

### Layer 3: Components (UI Building Blocks)

**Location:** `src/components/`

**Responsibility:** Reusable, composable UI components that are Andamio-aware but not journey-specific.

**Current inventory (242 files):**

| Current Folder | Files | Target | Notes |
|----------------|-------|--------|-------|
| `ui/` | 46 | `src/components/ui/` | Keep (shadcn primitives) |
| `andamio/` | 76 | `src/components/andamio/` | Keep (Andamio UI extensions) |
| `icons/` | 6 | `src/components/icons/` | Keep (semantic icons) |
| `editor/` | 21 | `src/components/editor/` | Keep (Tiptap system) |
| `auth/` | 3 | `src/components/auth/` | Keep |
| `layout/` | 8 | `src/components/layout/` | Keep |
| `providers/` | 3 | Move to `src/contexts/` | Context providers |
| `transactions/` | 24 | `src/components/tx/` | Rename folder |
| `courses/` | 14 | `src/components/domain/course/` | Reorganize |
| `dashboard/` | 11 | `src/components/domain/dashboard/` | Reorganize |
| `studio/` | 20 | `src/components/domain/studio/` | Includes wizard |
| `learner/` | 3 | `src/components/domain/learner/` | Reorganize |
| `instructor/` | 1 | `src/components/domain/instructor/` | Reorganize |
| `provisioning/` | 5 | `src/components/domain/provisioning/` | TX monitoring overlay |
| (root) | 3 | Distribute | pending-tx-watcher, pending-tx-popover, content-display |

**Proposed Layer 3 structure:**

```
src/components/
├── ui/                     # shadcn primitives (46 files) - KEEP
├── andamio/                # Andamio UI extensions (76 files) - KEEP
├── icons/                  # Semantic icons (6 files) - KEEP
├── editor/                 # Tiptap editor system (21 files) - KEEP
├── auth/                   # Auth UI (3 files) - KEEP
├── layout/                 # Layout components (8 files) - KEEP
├── tx/                     # Transaction UI (24 files) - RENAME from transactions/
└── domain/                 # Domain-specific components - NEW
    ├── course/             # Course components (14 files)
    ├── project/            # Project components (to extract)
    ├── dashboard/          # Dashboard components (11 files)
    ├── studio/             # Studio components (20 files)
    ├── learner/            # Learner components (3 files)
    ├── instructor/         # Instructor components (1 file)
    └── provisioning/       # Provisioning overlay (5 files)
```

**Components to delete:**
- `content-display.tsx` - Deprecated in favor of ContentViewer

**Components to move:**
- `providers/auth-provider.tsx` → `src/contexts/auth-provider.tsx`
- `providers/mesh-provider.tsx` → `src/contexts/mesh-provider.tsx`
- `providers/pending-tx-provider.tsx` → `src/contexts/pending-tx-provider.tsx`
- `pending-tx-watcher.tsx` → `src/components/tx/pending-tx-watcher.tsx`
- `pending-tx-popover.tsx` → `src/components/tx/pending-tx-popover.tsx`

---

### Layer 4: Features (Complete Journeys)

**Location:** `src/features/` (NEW - does not exist yet)

**Responsibility:** Complete, opinionated user flows that wire together Layers 1-3.

**Features to extract from current pages/components:**

`src/features/student/` - Student journey:
- `course-browser/` - Extract from `/course` page + CourseManager component
- `enrollment/` - Extract from `/course/[coursenft]/[modulecode]/assignment` page + AssignmentCommitment
- `credentials/` - Extract from `/credentials` page + related components
- `my-learning/` - Extract from dashboard MyLearning component

`src/features/contributor/` - Contributor journey:
- `project-browser/` - Extract from `/project` page
- `task-commitment/` - Extract from `/project/[projectid]/contributor` page
- `evidence-submission/` - Extract from TaskAction component
- `reward-claiming/` - Extract from ProjectCredentialClaim component

`src/features/course-studio/` - Course owner journey:
- `course-manager/` - Extract from `/studio/course` page
- `module-editor/` - Extract from `/studio/course/[coursenft]/[modulecode]` page + wizard
- `assignment-reviewer/` - Extract from `/studio/course/[coursenft]/instructor` page

`src/features/project-studio/` - Project manager journey:
- `project-manager/` - Extract from `/studio/project` page
- `task-editor/` - Extract from `/studio/project/[projectid]/draft-tasks` pages
- `submission-reviewer/` - Extract from `/studio/project/[projectid]/commitments` page
- `treasury-manager/` - Extract from `/studio/project/[projectid]/manage-treasury` page

**Note:** This is a creation phase, not just reorganization. Current components are tightly coupled to pages.

---

### Layer 5: App (Routes & Configuration)

**Location:** `src/app/` and `src/config/`

**Responsibility:** Most opinionated layer. Routes, layouts, branding, configuration.

**Current route inventory (28 pages):**

Public routes (13):
- `/` - Landing page
- `/course` - Course catalog
- `/course/[coursenft]` - Course detail
- `/course/[coursenft]/[modulecode]` - Module detail
- `/course/[coursenft]/[modulecode]/[moduleindex]` - Lesson detail
- `/course/[coursenft]/[modulecode]/assignment` - Assignment view
- `/project` - Project catalog
- `/project/[projectid]` - Project detail
- `/project/[projectid]/[taskhash]` - Task detail
- `/sitemap` - Route documentation
- `/components` - UI showcase
- `/editor` - Editor demo
- `/api-setup` - API registration wizard

Authenticated routes (15):
- `/dashboard` - User dashboard
- `/credentials` - User credentials
- `/project/[projectid]/contributor` - Contributor workflow
- `/studio` - Studio hub
- `/studio/course` - Course studio
- `/studio/course/[coursenft]` - Course editor
- `/studio/course/[coursenft]/[modulecode]` - Module wizard
- `/studio/course/[coursenft]/instructor` - Teacher management
- `/studio/project` - Project studio
- `/studio/project/[projectid]` - Project dashboard
- `/studio/project/[projectid]/manager` - Manager view
- `/studio/project/[projectid]/commitments` - Review submissions
- `/studio/project/[projectid]/draft-tasks` - Task list
- `/studio/project/[projectid]/draft-tasks/new` - Create task
- `/studio/project/[projectid]/draft-tasks/[taskindex]` - Edit task
- `/studio/project/[projectid]/manage-treasury` - Treasury management

API routes (3):
- `/api/gateway/[...path]` - Gateway proxy
- `/api/koios/[...path]` - Koios proxy
- `/api/trpc/[trpc]` - tRPC handler

Route groups:
- `(app)/` - Main app with AppLayout (sidebar)
- `(studio)/` - Studio with StudioLayout

**Current config files:**
- `src/config/transaction-ui.ts` - Transaction UI config (407 lines)
- `src/config/transaction-schemas.ts` - Zod schemas (422 lines)
- `src/config/index.ts` - Re-exports

**Config files to create:**
- `src/config/branding.ts` - App name, logo, tagline
- `src/config/features.ts` - Feature flags
- `src/config/navigation.ts` - Extract from app-sidebar.tsx
- `src/config/routes.ts` - Route definitions
- `src/config/theme.ts` - Theme customization (extract from globals.css)
- `src/config/ui-constants.ts` - UI timeouts, pagination (from lib/constants.ts)

---

## Dependency Rules

Each layer can only import from layers below it:

| Layer | Can Import From |
|-------|-----------------|
| Layer 5 (App) | Layers 1, 2, 3, 4 |
| Layer 4 (Features) | Layers 1, 2, 3 |
| Layer 3 (Components) | Layers 1, 2 |
| Layer 2 (Integration) | Layer 1 only |
| Layer 1 (Core) | External packages only |

**Enforcement:** Path aliases in tsconfig.json and ESLint import rules.

---

## Folder Structure (Updated)

```
andamio-t3-app-template/
│
├── packages/
│   ├── core/                              # LAYER 1 (NEW)
│   │   ├── types/
│   │   │   ├── entities.ts                # Course, Project, Task types
│   │   │   ├── states.ts                  # State enums
│   │   │   ├── transactions.ts            # Transaction types (from src/types/)
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   ├── slt-hash.ts                # From andamio-transactions
│   │   │   ├── assignment-info-hash.ts    # From andamio-transactions
│   │   │   ├── task-hash.ts               # From andamio-transactions
│   │   │   ├── cbor-decoder.ts            # From andamio-transactions
│   │   │   ├── cardano.ts                 # From src/lib/cardano-utils.ts
│   │   │   ├── access-token.ts            # From src/lib/access-token-utils.ts
│   │   │   ├── hashing.ts                 # From src/lib/hashing.ts
│   │   │   └── index.ts
│   │   ├── constants/
│   │   │   ├── cardano.ts                 # Explorer URLs, networks
│   │   │   ├── policies.ts                # Policy IDs by network
│   │   │   ├── costs.ts                   # From protocol-reference.ts
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   ├── transaction-schemas.ts     # From src/config/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   └── andamio-transactions/              # LAYER 1 (EXISTING - keep separate)
│       ├── src/
│       │   ├── definitions/               # All V2 transaction definitions
│       │   ├── execution/                 # Side effect execution
│       │   ├── testing/                   # Testing utilities
│       │   ├── types/                     # Transaction-specific types
│       │   ├── utils/
│       │   │   ├── schema-helpers.ts      # Keep here
│       │   │   └── protocol-reference.ts  # Keep here (or move costs to core)
│       │   ├── registry.ts
│       │   └── index.ts
│       └── package.json
│
├── src/
│   ├── lib/                               # LAYER 2 (non-React)
│   │   ├── api/                           # API clients
│   │   │   ├── gateway.ts
│   │   │   ├── andamioscan.ts             # 1497 lines
│   │   │   ├── cardano-indexer.ts
│   │   │   ├── utils.ts
│   │   │   └── index.ts
│   │   ├── auth/                          # Auth utilities
│   │   │   ├── andamio-auth.ts
│   │   │   └── index.ts
│   │   ├── state/                         # State logic
│   │   │   ├── project-eligibility.ts
│   │   │   ├── course-filters.ts
│   │   │   └── index.ts
│   │   ├── sync/                          # Sync utilities
│   │   │   ├── project-commitment-sync.ts # 447 lines
│   │   │   ├── project-task-sync.ts       # 622 lines
│   │   │   └── index.ts
│   │   ├── utils/                         # Dev utilities
│   │   │   ├── debug-logger.ts
│   │   │   ├── tx-logger.ts
│   │   │   └── index.ts
│   │   ├── utils.ts                       # cn() utility
│   │   └── index.ts
│   │
│   ├── hooks/                             # LAYER 2 (React)
│   │   ├── api/                           # 10 React Query hooks
│   │   │   ├── use-course.ts
│   │   │   ├── use-course-module.ts
│   │   │   ├── use-slt.ts
│   │   │   ├── use-lesson.ts
│   │   │   ├── use-project.ts
│   │   │   ├── use-student-courses.ts
│   │   │   ├── use-teacher-courses.ts
│   │   │   ├── use-contributor-projects.ts
│   │   │   ├── use-manager-projects.ts
│   │   │   ├── use-module-wizard-data.ts
│   │   │   └── index.ts
│   │   ├── tx/                            # Transaction hooks
│   │   │   ├── use-transaction.ts
│   │   │   ├── use-simple-transaction.ts
│   │   │   ├── use-tx-watcher.ts
│   │   │   ├── use-pending-tx-watcher.ts
│   │   │   ├── use-event-confirmation.ts
│   │   │   └── index.ts
│   │   ├── auth/                          # Auth hooks
│   │   │   ├── use-andamio-auth.ts
│   │   │   └── index.ts
│   │   ├── ui/                            # UI state hooks
│   │   │   ├── use-success-notification.ts
│   │   │   ├── use-wizard-navigation.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── contexts/                          # LAYER 2 (global state)
│   │   ├── andamio-auth-context.tsx
│   │   ├── pending-tx-context.tsx         # Move from providers/
│   │   ├── auth-provider.tsx              # Move from providers/
│   │   ├── mesh-provider.tsx              # Move from providers/
│   │   └── index.ts
│   │
│   ├── components/                        # LAYER 3
│   │   ├── ui/                            # shadcn (46 files)
│   │   ├── andamio/                       # Andamio extensions (76 files)
│   │   ├── icons/                         # Semantic icons (6 files)
│   │   ├── editor/                        # Tiptap system (21 files)
│   │   ├── auth/                          # Auth UI (3 files)
│   │   ├── layout/                        # Layouts (8 files)
│   │   ├── tx/                            # Transaction UI (26 files)
│   │   │   ├── transaction-button.tsx
│   │   │   ├── transaction-status.tsx
│   │   │   ├── pending-tx-watcher.tsx
│   │   │   ├── pending-tx-popover.tsx
│   │   │   ├── mint-access-token-simple.tsx
│   │   │   ├── ... (other TX components)
│   │   │   └── index.ts
│   │   └── domain/                        # Domain components
│   │       ├── course/                    # 14 files
│   │       ├── project/                   # To extract from pages
│   │       ├── dashboard/                 # 11 files
│   │       ├── studio/                    # 20 files (includes wizard)
│   │       ├── learner/                   # 3 files
│   │       ├── instructor/                # 1 file
│   │       ├── provisioning/              # 5 files
│   │       └── index.ts
│   │
│   ├── features/                          # LAYER 4 (NEW)
│   │   ├── student/
│   │   │   ├── course-browser/
│   │   │   ├── enrollment/
│   │   │   ├── credentials/
│   │   │   ├── my-learning/
│   │   │   └── index.ts
│   │   ├── contributor/
│   │   │   ├── project-browser/
│   │   │   ├── task-commitment/
│   │   │   ├── evidence-submission/
│   │   │   ├── reward-claiming/
│   │   │   └── index.ts
│   │   ├── course-studio/
│   │   │   ├── course-manager/
│   │   │   ├── module-editor/
│   │   │   ├── assignment-reviewer/
│   │   │   └── index.ts
│   │   ├── project-studio/
│   │   │   ├── project-manager/
│   │   │   ├── task-editor/
│   │   │   ├── submission-reviewer/
│   │   │   ├── treasury-manager/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── app/                               # LAYER 5 (routes)
│   │   ├── (app)/                         # Main app routes
│   │   │   ├── dashboard/
│   │   │   ├── course/
│   │   │   ├── project/
│   │   │   ├── credentials/
│   │   │   ├── layout.tsx
│   │   │   └── error.tsx
│   │   ├── (studio)/                      # Studio routes (KEEP separate)
│   │   │   ├── studio/
│   │   │   │   ├── course/
│   │   │   │   └── project/
│   │   │   ├── layout.tsx
│   │   │   └── error.tsx
│   │   ├── (marketing)/                   # Public marketing
│   │   │   └── page.tsx                   # Landing
│   │   ├── (docs)/                        # Developer docs (NEW)
│   │   │   ├── transactions/
│   │   │   ├── states/
│   │   │   └── integration/
│   │   ├── sitemap/                       # Route documentation
│   │   ├── components/                    # UI showcase
│   │   ├── editor/                        # Editor demo
│   │   ├── api-setup/                     # API registration
│   │   ├── api/                           # API routes
│   │   │   ├── gateway/
│   │   │   ├── koios/
│   │   │   └── trpc/
│   │   └── layout.tsx
│   │
│   ├── config/                            # LAYER 5 (configuration)
│   │   ├── branding.ts                    # NEW: name, logo, tagline
│   │   ├── features.ts                    # NEW: feature flags
│   │   ├── navigation.ts                  # NEW: extract from sidebar
│   │   ├── routes.ts                      # NEW: route definitions
│   │   ├── theme.ts                       # NEW: theme customization
│   │   ├── ui-constants.ts                # NEW: from lib/constants.ts
│   │   ├── transaction-ui.ts              # KEEP: TX UI config
│   │   └── index.ts
│   │
│   ├── types/                             # Shared types
│   │   ├── ui.ts                          # UI component types
│   │   └── generated/                     # API types (auto-generated)
│   │       ├── gateway.ts
│   │       └── index.ts
│   │
│   └── styles/
│       └── globals.css
│
├── docs/
│   ├── CUSTOMIZATION.md
│   ├── ARCHITECTURE.md
│   └── TRANSACTIONS.md
│
└── templates/
    ├── minimal/
    ├── headless/
    └── full/
```

---

## Migration Phases (Updated)

### Phase 1: Create Core Package

1. Create `packages/core/` directory structure
2. Move hash utilities from `packages/andamio-transactions/src/utils/`:
   - `slt-hash.ts`
   - `assignment-info-hash.ts`
   - `task-hash.ts`
   - `cbor-decoder.ts`
3. Move from `src/lib/`:
   - `cardano-utils.ts` → `packages/core/utils/cardano.ts`
   - `access-token-utils.ts` → `packages/core/utils/access-token.ts`
   - `hashing.ts` → `packages/core/utils/hashing.ts`
4. Create `packages/core/constants/`:
   - Extract `EXPLORER_URLS`, `POLLING_INTERVALS` from `src/lib/constants.ts`
   - Add policy IDs by network
5. Move `src/config/transaction-schemas.ts` → `packages/core/config/`
6. Create `packages/core/types/` with entity and state types
7. Update `@andamio/transactions` to import from `@andamio/core`
8. Update all src/ imports

### Phase 2: Reorganize Integration Layer

1. Create `src/lib/api/` and move:
   - `gateway.ts`
   - `andamioscan.ts`
   - `cardano-indexer.ts`
   - `api-utils.ts`
2. Create `src/lib/auth/` and move:
   - `andamio-auth.ts`
3. Create `src/lib/state/` and move:
   - `project-eligibility.ts`
   - `course-filters.ts`
4. Create `src/lib/sync/` and move:
   - `project-commitment-sync.ts`
   - `project-task-sync.ts`
5. Create `src/lib/utils/` and move:
   - `debug-logger.ts`
   - `tx-logger.ts`
6. Reorganize `src/hooks/` into subfolders (`api/`, `tx/`, `auth/`, `ui/`)
7. Delete deprecated hooks:
   - `use-andamio-transaction.ts`
   - `use-pending-transactions.ts`
8. Migrate legacy hooks to React Query patterns:
   - `use-andamio-fetch.ts`
   - `use-owned-courses.ts`
9. Move providers from `src/components/providers/` to `src/contexts/`

### Phase 3: Component Layering

1. Rename `src/components/transactions/` → `src/components/tx/`
2. Move pending TX components to `src/components/tx/`:
   - `pending-tx-watcher.tsx`
   - `pending-tx-popover.tsx`
3. Create `src/components/domain/` structure
4. Move domain components:
   - `courses/` → `domain/course/`
   - `dashboard/` → `domain/dashboard/`
   - `studio/` → `domain/studio/`
   - `learner/` → `domain/learner/`
   - `instructor/` → `domain/instructor/`
   - `provisioning/` → `domain/provisioning/`
5. Extract project components from pages → `domain/project/`
6. Delete deprecated `content-display.tsx`
7. Create barrel exports (index.ts) for each folder

### Phase 4: Extract Features

1. Create `src/features/` directory structure
2. Extract student features from pages/components:
   - Course browser flow
   - Enrollment flow
   - Credentials view
   - My learning dashboard
3. Extract contributor features:
   - Project browser
   - Task commitment flow
   - Evidence submission
   - Reward claiming
4. Extract course studio features:
   - Course manager
   - Module editor (including wizard)
   - Assignment reviewer
5. Extract project studio features:
   - Project manager
   - Task editor
   - Submission reviewer
   - Treasury manager
6. Refactor to accept configuration via props (no direct env access)

### Phase 5: Simplify App Layer

1. Refactor routes to be thin wrappers around features
2. Create `src/config/branding.ts` with app name, logo, tagline
3. Create `src/config/navigation.ts` (extract from app-sidebar.tsx)
4. Create `src/config/features.ts` with feature flags
5. Create `src/config/routes.ts` with route definitions
6. Create `src/config/theme.ts` (document theme customization)
7. Create `src/config/ui-constants.ts` (from lib/constants.ts)

### Phase 6: Documentation & Templates

1. Create `(docs)/` route group for developer documentation
2. Write `docs/CUSTOMIZATION.md` guide
3. Write `docs/ARCHITECTURE.md` explaining the layers
4. Write `docs/TRANSACTIONS.md` with transaction reference
5. Create template variants in `templates/`:
   - `minimal/` - Core + basic integration
   - `headless/` - Layers 1-3 only
   - `full/` - Complete app (current)

---

## Success Criteria

### Layer 1 (Core)

- Zero React imports
- Can be published as standalone npm package
- Self-documenting via TypeScript types
- 100% test coverage on hash utilities
- `@andamio/transactions` depends on `@andamio/core`

### Layer 2 (Integration)

- All hooks have consistent API patterns
- State machines are well-defined and documented
- No UI logic, only data and state
- Clear separation: api/, auth/, state/, sync/, utils/
- Deprecated hooks removed

### Layer 3 (Components)

- All components accept customization via props
- No hardcoded routes or navigation
- Consistent use of design tokens
- Clear separation: ui/, andamio/, icons/, editor/, auth/, layout/, tx/, domain/
- Domain components organized by entity

### Layer 4 (Features)

- Each feature is self-contained
- Features can be imported individually
- Clear props interface for configuration
- No direct env variable access (passed via props)
- Reusable across different apps

### Layer 5 (App)

- Routes are thin wrappers around features
- All branding in config files
- Feature flags control what's visible
- Easy to understand for new developers
- Clear separation between route groups

---

## Open Questions

1. Should `packages/core/` be a separate git repository for independent versioning?
2. Should we keep `@andamio/transactions` as a separate package or merge into core?
3. How do we handle the 1497-line `andamioscan.ts` - split into smaller modules?
4. How do we handle the complex sync utilities (447 + 622 lines)?
5. Should `(docs)/` routes be static (MDX) or dynamic (generated from Layer 1)?
6. What's the minimum viable template for `templates/minimal/`?
7. Should we create Storybook for Layer 3 components?
8. How do we version the template vs the packages?
