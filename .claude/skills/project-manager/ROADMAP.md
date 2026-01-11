# Development Roadmap

> **Last Updated**: January 11, 2026
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
TODAY ──────────────────────────────────────────────────── 2026-01-11 (Sun) ← We are here
  │
  │   Documentation sync, final testing
  │
  ▼
V2 PREPROD ROLLOUT BEGINS ──────────────────────────────── 2026-01-12 (Mon)
  │
  ▼
ANDAMIO PIONEERS LAUNCH ────────────────────────────────── 2026-01-14 (Wed)
  │
  │   Pioneers testing on preprod
  │
  ▼
FINAL DEMOS ────────────────────────────────────────────── 2026-01-16 (Fri)
  │
  │   V1 → V2 Migration Features
  │   (app.andamio.io focus, not this template)
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
| **2026-01-11 (Sun)** | **Today - Documentation sync** | 🔄 Active |
| 2026-01-12 (Mon) | V2 Preprod Rollout Begins | ⏳ Tomorrow |
| **2026-01-14 (Wed)** | **Andamio Pioneers Launch** | |
| **2026-01-16 (Fri)** | **Final Demos** | |
| 2026-01-16 → 2026-02-06 | V1→V2 Migration Focus (app.andamio.io) | |
| 2026-02-06 (Fri) | Andamio V2 Mainnet Launch | |

### Note on Template vs Production App

During the **2026-01-12 → 2026-02-06** period, primary development focus shifts to:
- **app.andamio.io** (production fork of this template)
- V1 → V2 migration features
- Features specific to production deployment

This template continues as the **reference implementation** and will receive updates after mainnet launch.

---

## Current Focus

### Pre-Pioneers Stabilization (4 Days to Pioneers)

**Goal**: Ensure stable, tested platform for Pioneers Program launch on Wednesday January 14.

**Completed Today** (Session 4):
- ✅ Go API RESTful migration (50+ endpoints)
- ✅ Eternl wallet `partialSign` fix for project creation
- ✅ Project dashboard role detection (owner vs manager)
- ✅ Null safety fixes in PendingTxPopover

**Remaining Before Pioneers**:
1. **Wallet Testing**: Test authentication with Nami, Flint, Yoroi, Lace, Vespr
2. **Assignment System Hooks**: 12 DB API endpoints need React Query hooks for student interactions
3. **Cache Invalidation Audit**: Verify `queryClient.invalidateQueries()` after transactions

See `STATUS.md` for Monday Planning priorities.

---

## Phase Overview

```
Phase 1: Course & Learning System ━━━━━━━━━━━━━━━━ ✅ Complete (15/15 routes)
Phase 2: Optimization & Quality   ━━━━━━━━━━━━━━━━ ✅ Complete (Go API migrated)
Phase 3: Project & Contribution   ━━━━━━━━━━━━━━━━ 🔄 In Progress (6/13 routes, 9/9 tx)
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

**Routes** (6/13 complete):
- ✅ `/project` - Project catalog
- ✅ `/project/[treasurynft]` - Project detail with role detection
- ✅ `/project/[treasurynft]/contributor` - Contributor dashboard
- ✅ `/studio/project` - Project management
- ✅ `/studio/project/[treasurynft]` - Project dashboard (owner/manager aware)
- ✅ `/studio/project/[treasurynft]/manager` - Manager dashboard

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

### Remaining Routes (7)

**Public**:
- `/project/[treasurynft]/[taskhash]` - Task detail with commitment

**Studio**:
- `/studio/project/[treasurynft]/draft-tasks` - Task list management
- `/studio/project/[treasurynft]/draft-tasks/new` - Create new task
- `/studio/project/[treasurynft]/draft-tasks/[taskindex]` - Edit task
- `/studio/project/[treasurynft]/manage-treasury` - Treasury management
- `/studio/project/[treasurynft]/manage-contributors` - Contributor management
- `/studio/project/[treasurynft]/commitments` - Commitment review

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
- Remove monorepo config
- Replace workspace imports with npm packages
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
