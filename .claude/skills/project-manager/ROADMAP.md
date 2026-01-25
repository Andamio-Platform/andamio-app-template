# Development Roadmap

> **Last Updated**: January 24, 2026
>
> **Strategy**: Build incrementally, test thoroughly, establish patterns that scale

---

## Andamio V2 Release Schedule

```
GO API MIGRATION COMPLETE ──────────────────────────────── 2026-01-09 (Fri) ✅
  │
  │   50+ endpoints migrated to role-based paths
  │
  ▼
API COVERAGE AUDIT ─────────────────────────────────────── 2026-01-10 (Sat) ✅
  │
  │   Automated coverage script created (71% overall)
  │
  ▼
V2 PREPROD ROLLOUT BEGINS ──────────────────────────────── 2026-01-12 (Mon) ✅
  │
  ▼
ANDAMIO PIONEERS LAUNCH ────────────────────────────────── 2026-01-14 (Wed) ✅
  │
  │   Pioneers testing on preprod
  │   Contributor commitment sync implemented
  │
  ▼
CONTRIBUTOR SYNC TESTING ──────────────────────────────── 2026-01-15 (Wed) ✅
  │
  │   Testing contributor flow with DB sync
  │   Andamioscan issue #11 resolved!
  │
  ▼
FINAL DEMOS ────────────────────────────────────────────── 2026-01-16 (Fri) ✅
  │
  │   V1 → V2 Migration Features
  │   (app.andamio.io focus, not this template)
  │
  ▼
V2 GATEWAY API MIGRATION ──────────────────────────────── 2026-01-17/18 ✅
  │
  │   Unified Gateway consolidates all 3 APIs
  │   All API calls use /api/gateway/ proxy
  │   Types generated from OpenAPI spec
  │   Legacy DB API URL removed
  │   60+ files migrated, new hooks created
  │   Branch: update/andamioscan (ready for merge)
  │
  ▼
POST-MIGRATION TESTING ─────────────────────────────────── 2026-01-18 ✅
  │
  │   Test all routes with new gateway
  │   Merge to main when verified
  │
  ▼
TYPE TRANSFORMATION (Phase 3.8) ───────────────────────── 2026-01-24 ✅
  │
  │   App-level types (Task, Project, TaskCommitment)
  │   snake_case → camelCase transforms
  │   74 type errors → 0
  │
  ▼
MAINNET V2 LAUNCH ──────────────────────────────────────── 2026-02-06
  │
  │   Feature backlog begins!
  │
  ▼
2026 AND BEYOND ────────────────────────────────────────── Future
```

### Key Dates

| Date | Milestone | Status |
|------|-----------|--------|
| 2026-01-09 (Fri) | Go API Migration Complete | ✅ Complete |
| 2026-01-10 (Sat) | API Coverage Audit | ✅ Complete |
| 2026-01-12 (Mon) | V2 Preprod Rollout Begins | ✅ Complete |
| 2026-01-13 (Tue) | Tx Loop 2 Complete, Instructor Fixes | ✅ Complete |
| 2026-01-14 (Wed) | Andamio Pioneers Launch | ✅ Live |
| 2026-01-15 (Wed) | Contributor Sync Testing + Issue #11 Resolved | ✅ Complete |
| 2026-01-16 (Fri) | Final Demos | ✅ Complete |
| **2026-01-17/18** | **V2 Gateway API Migration** | ✅ Complete |
| **2026-01-24** | **Phase 3.8 Type Transformation** | ✅ Complete |
| 2026-01-16 → 2026-02-06 | V1→V2 Migration Focus (app.andamio.io) | 🔄 In Progress |
| 2026-02-06 (Fri) | Andamio V2 Mainnet Launch | ⏳ Upcoming |

### Note on Template vs Production App

During the **2026-01-12 → 2026-02-06** period, primary development focus shifts to:
- **app.andamio.io** (production fork of this template)
- V1 → V2 migration features
- Features specific to production deployment

This template continues as the **reference implementation** and will receive updates after mainnet launch.

---

## Current Focus

### ✅ Phase 3.8: Type Transformation (Complete)

**Goal**: Establish consistent snake_case → camelCase transformation pattern.

**Completed**:
- ✅ App-level types in `src/types/project.ts` (Task, Project, TaskCommitment)
- ✅ Transform functions: `transformApiTask()`, `transformProjectDetail()`, `transformApiCommitment()`
- ✅ camelCase fields with flattened structure (content.title → title)
- ✅ Documentation in `.claude/dev-notes/TYPE-TRANSFORMATION.md`
- ✅ 74 type errors reduced to 0
- ✅ typescript-types-expert skill updated with transform documentation

### 🔄 Next: L2/L3 Hook Reorganization

**Goal**: Reorganize hooks into `course/` and `project/` subdirectories.

**Testing Remaining**:
1. Verify all course routes work with gateway
2. Verify all project routes work with gateway
3. Test transaction flows (mint, commit, assess, claim)
4. Wallet compatibility testing (Nami, Flint, Yoroi, Lace, Vespr)

See `STATUS.md` for detailed session notes.

---

## Phase Overview

```
Phase 1: Course & Learning System ━━━━━━━━━━━━━━━━ ✅ Complete (15/15 routes)
Phase 2: Optimization & Quality   ━━━━━━━━━━━━━━━━ ✅ Complete (Go API migrated)
Phase 3: Project & Contribution   ━━━━━━━━━━━━━━━━ 🔄 In Progress (10/13 routes, 9/9 tx)
Phase 3.5: V2 Gateway Migration   ━━━━━━━━━━━━━━━━ ✅ Complete (all APIs unified)
Phase 3.8: Type Transformation    ━━━━━━━━━━━━━━━━ ✅ Complete (snake_case → camelCase)
Phase 4: Polish & Publish         ━━━━━━━━━━━━━━━━ 🎯 Future (Post-Mainnet 2026)
```

---

## ✅ Phase 1: Course & Learning System (Complete)

All core course functionality implemented and stable.

**Completed**:
- 15 course routes (5 public, 10 studio)
- 8 transactions (mint, enroll, commit, accept/deny, etc.)
- Transaction side effects system
- Pending transaction monitoring
- Input validation across all forms
- Semantic color system

**Patterns Established**:
- Transaction definition pattern (protocol spec, build config, side effects)
- Hash handling (two-step: submit empty → confirm with on-chain data)
- PENDING_TX protection for status updates
- Type-safe API integration via workspace symlinks

---

## 🔄 Phase 2: Optimization & Quality (In Progress)

Focus on developer experience and performance.

**Timeline**: Now through Preprod V2 Release (2026-01-09)

### Current Work

**React Query Migration**
- Replace raw fetch + useState with React Query hooks
- Enable request deduplication and caching
- Reduce network requests by 40-60%

**API Coverage Expansion**
- Currently at ~66% (49/74 endpoints)
- Target: 80%+ for active features

### Completed in Phase 2

- Created React Query hooks for Course, Module, SLT, Lesson
- Migrated course detail page as demo
- Documented migration roadmap
- Cleaned up project-manager documentation

### Remaining

- Migrate all course pages to React Query
- Migrate wizard step components
- Add Assignment and Commitment hooks
- Convert old useState-based hooks

---

## 🔄 Phase 3: Project & Contribution System (In Progress)

Full project/task/contributor workflow.

**Timeline**: Active development, continuing post-Mainnet

### What's Implemented

**Routes** (10/13 complete):
- ✅ `/project` - Project catalog
- ✅ `/project/[projectid]` - Project detail with role detection
- ✅ `/project/[projectid]/contributor` - Contributor dashboard
- ✅ `/project/[projectid]/[taskhash]` - Task detail with commitment
- ✅ `/studio/project` - Project management
- ✅ `/studio/project/[projectid]` - Project dashboard (owner/manager aware)
- ✅ `/studio/project/[projectid]/manager` - Manager dashboard
- ✅ `/studio/project/[projectid]/draft-tasks` - Task list management
- ✅ `/studio/project/[projectid]/draft-tasks/new` - Create new task
- ✅ `/studio/project/[projectid]/draft-tasks/[taskindex]` - Edit task

**Transaction Components** (9/9 complete):
- ✅ `CreateProject` - Create project treasury
- ✅ `ProjectEnroll` - Enroll + initial task commit
- ✅ `TaskCommit` - Commit to task with evidence
- ✅ `TaskAction` - Update commitment
- ✅ `ProjectCredentialClaim` - Claim earned credentials
- ✅ `TasksAssess` - Manager: assess submissions
- ✅ `TasksManage` - Manager: manage tasks
- ✅ `ManagersManage` - Manager: manage managers
- ✅ `BlacklistManage` - Manager: manage blacklist

### Remaining Routes (3)

**Studio**:
- `/studio/project/[projectid]/manage-treasury` - Treasury management
- `/studio/project/[projectid]/manage-contributors` - Contributor management
- `/studio/project/[projectid]/commitments` - Commitment review

---

## ✅ Phase 3.5: V2 Gateway API Migration (Complete)

All API access now goes through the unified V2 Gateway.

**Completed**: January 17, 2026

### What Was Done

**Infrastructure**:
- ✅ Created unified gateway proxy: `src/app/api/gateway/[...path]/route.ts`
- ✅ Created gateway client: `src/lib/gateway.ts`
- ✅ Removed old proxy routes (`/api/andamioscan/`, `/api/atlas-tx/`)
- ✅ Removed `NEXT_PUBLIC_ANDAMIO_API_URL` env var

**Type Generation**:
- ✅ Removed `@andamio/db-api-types` NPM dependency
- ✅ Added `npm run generate:types` script (uses `swagger-typescript-api`)
- ✅ Types generated to `src/types/generated/gateway.ts`
- ✅ Strict type re-exports in `src/types/generated/index.ts`

**Auth Endpoints (v1 → v2)**:
- ✅ All auth endpoints migrated to v2
- ✅ Legacy auth (session/validate) now uses gateway

**API Calls Migrated**:
- ✅ 50+ files updated to use `/api/gateway/api/v2/*` paths
- ✅ All hooks, components, and pages now use gateway proxy

### Architecture (Current)

```
┌────────────────────────────────────────────────────┐
│              V2 Gateway (92 endpoints)              │
│  • Merged endpoints (on-chain + off-chain data)    │
│  • Auth (/api/v2/auth/*)                           │
│  • Data (/api/v2/course/*, /api/v2/project/*)     │
│  • Transactions (/v2/tx/*)                         │
└────────────────────────┬───────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────┐
│ Frontend: /api/gateway/[...path] proxy             │
│ • Hides gateway URL from client                    │
│ • Adds API key header server-side                  │
│ • 30-second cache for GET requests                 │
└────────────────────────────────────────────────────┘
```

---

## 🎯 Phase 4: Polish & Publish (Future)

Package extraction and community release.

**Timeline**: 2026 (post-mainnet)

### Planned Packages

| Package | Purpose | Status |
|---------|---------|--------|
| `@andamio/transactions` | Transaction definitions | Ready |
| `@andamio/core` | API client, auth utilities | Planned |
| `@andamio/ui` | shadcn extensions | Planned |
| `@andamio/tiptap` | Editor wrapper | Planned |
| `@andamio/mesh` | Wallet utilities | Planned |

### Template Publishing

- Clean starter template for community
- Publish `@andamio/transactions` to npm
- `npx create-andamio-app` CLI

---

## Decision Log

### Recent Decisions

**2025-12-19: V2 Release Schedule Confirmed**
- Preprod V2: 2026-01-09
- Pioneers Program: 2026-01-12
- Mainnet V2: 2026-02-06
- Migration features developed in app.andamio.io fork

**2025-12-19: React Query for API Caching**
- Migrate from raw fetch to React Query hooks
- Benefits: deduplication, caching, background refresh
- Impact: Significant reduction in network requests

**2025-12-12: Task Expiration UI**
- Expired tasks show "Expired" badge instead of "Live"
- Client-side time comparison
- Open: Should expired tasks be filtered or remain visible?

### Established Patterns

**Dual API Interface**
- tRPC + REST from single codebase
- Type safety for TypeScript, accessibility for others

**URL-Based Versioning**
- `/api/v0/*` style versioning
- Currently v0 (unstable), will stabilize to v1

**On-Chain Identifiers Only**
- Never expose internal database IDs
- Use `courseNftPolicyId`, `moduleCode`, `treasuryNftPolicyId`

---

## Open Questions

### Technical
- Best approach for optimistic updates in React Query?
- Should we add GraphQL for complex queries?
- ETags for cache validation?

### Product
- Task expiration grace periods?
- Multi-signature treasury requirements?
- Dispute resolution process?

---

## Contributing

This roadmap is a living document updated based on development progress.

**Current Priority**: React Query migration (before Preprod V2)

**How to Contribute**:
1. Pick items from the migration roadmap
2. Follow established patterns from completed work
3. Update documentation as you go
