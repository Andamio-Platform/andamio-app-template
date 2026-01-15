# Development Roadmap

> **Last Updated**: January 15, 2026
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
CONTRIBUTOR SYNC TESTING ──────────────────────────────── 2026-01-15 (Wed) ← TODAY
  │
  │   Testing contributor flow with DB sync
  │   New DB API endpoints being deployed
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
| 2026-01-12 (Mon) | V2 Preprod Rollout Begins | ✅ Complete |
| 2026-01-13 (Tue) | Tx Loop 2 Complete, Instructor Fixes | ✅ Complete |
| 2026-01-14 (Wed) | Andamio Pioneers Launch | ✅ Live |
| **2026-01-15 (Wed)** | **Contributor Sync Testing - TODAY** | 🔄 In Progress |
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

### Post-Pioneers: Blocked by Atlas TX API (Final Demos Tomorrow)

**Goal**: All Project V2 transactions tested and working.

**Completed** (Sessions 11-12):
- ✅ Manager Assess transaction fixed (`alias` instead of `task_hash` in task_decisions)
- ✅ DB API side effect fixed (uppercase decision values: `ACCEPTED`/`REFUSED`/`DENIED`)
- ✅ Task matching for pending assessments (workaround for empty `task_id`)
- ✅ Transaction confirmation flow with DB sync
- ✅ Accepted task UI indicator (green border, non-selectable)
- ✅ Clear evidence when selecting new task

**Ready to Test - Atlas TX API Fix Deploying**:

1. **Atlas TX API - Task Commit** ✅ Client-side fix implemented:
   - Andamioscan issue #10 fixed - now returns `contributor_state_policy_id` per task
   - Updated `TaskCommit` component with `contributorStatePolicyId` prop
   - Transaction definition schema updated
   - Atlas TX API fix deploying soon - will enable end-to-end testing

**Remaining Blocker**:

2. **Andamioscan Issue #11**: `task_id` empty in pending assessments/submissions
   - Assessment sync deferred until fix is available

**Next Steps**:
1. ✅ ~~Fix Atlas TX API task commit~~ - Client-side fix implemented
2. Test 2nd/Nth task commitment (returns rewards from prior commitment)
3. Build assessment sync functionality (blocked by #11)
4. Test `/v2/tx/project/contributor/credential/claim` endpoint
5. Wallet compatibility testing (Nami, Flint, Yoroi, Lace, Vespr)

See `STATUS.md` for detailed session notes.

---

## Phase Overview

```
Phase 1: Course & Learning System ━━━━━━━━━━━━━━━━ ✅ Complete (15/15 routes)
Phase 2: Optimization & Quality   ━━━━━━━━━━━━━━━━ ✅ Complete (Go API migrated)
Phase 3: Project & Contribution   ━━━━━━━━━━━━━━━━ 🔄 In Progress (10/13 routes, 9/9 tx)
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
