# Development Roadmap

> **Last Updated**: February 7, 2026
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
ANDAMIOSCAN REMOVAL ───────────────────────────────────── 2026-01-31 ✅
  │
  │   All direct Andamioscan calls eliminated
  │   andamioscan-events.ts deleted (0 imports remain)
  │   Pages use gateway hooks exclusively
  │   project-eligibility.ts → pure function
  │
  ▼
PROJECT WORKFLOWS ─────────────────────────────────────── 2026-02-01 ✅
  │
  │   PR #111: Studio redesign, step-based project creation
  │   Single teacher/manager on create (gateway alignment)
  │   TX polling reduced to 5s, tx_type mapping fixes
  │   Owner/manager UX for post-create management
  │
  ▼
GATEWAY API SYNC + TX UX AUDIT ────────────────────────── 2026-02-03 ✅
  │
  │   Types regenerated (managers, slt_hashes, SSE fix)
  │   6 issues closed (#114, #129, #130, #139, #140)
  │   TX UX audit: 9/16 tested, 7 pass, 2 backend-blocked
  │   slt_hashes validation in mint-module-tokens
  │
  ▼
DRAFT TASK DELETE FIX + TX AUDIT ──────────────────────── 2026-02-03 ✅
  │
  │   Draft task delete working (issues #147, #148)
  │   useDeleteTask simplified to { contributor_state_id, index }
  │   transformMergedTask: top-level task_index
  │   transformAssets: typed ApiTypesAsset[]
  │   TX UX audit: 9/16 passing, 0 backend-blocked
  │   TX #7, #10 all pass; TX #6 regression fixed
  │
  ▼
CONTRIBUTOR TX STATE MACHINE CLEANUP ─────────────────── 2026-02-03 ✅
  │
  │   All 3 Project Contributor TXs production-ready
  │   TaskCommit: schema-only fields, no undocumented params
  │   TaskAction: contributor_state_id + task_hash + evidence saving
  │   TX_TYPE_MAP: TASK_COMMIT → project_join (distinct from task_submit)
  │
  ▼
MIGRATION TESTING FIXES ─────────────────────────────────── 2026-02-04–06 ✅
  │
  │   PRs #189–#192: Dashboard titles, UX copy normalization,
  │   wallet reconnect prompt, standardized auth gates
  │
  ▼
UNIFIED STUDIO ──────────────────────────────────────────── 2026-02-06 ✅
  │
  │   PR #193: Persistent sidebar with split-pane layout
  │   Courses + projects in unified view, context-based create flows
  │   Studio routes moved to (studio) group with dedicated layout
  │   CopyId component created for reusable ID display + copy
  │
  ▼
WALLET SWITCH DETECTION ─────────────────────────────────── 2026-02-07 ✅
  │
  │   PR #194: Auth context polls wallet every 2s, auto-logout on change
  │   Closes #47
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
| **2026-01-31** | **Andamioscan Removal** — All direct calls eliminated | ✅ Complete |
| **2026-02-01** | **Project Workflows** (PR #111) + owner/manager fixes | ✅ Complete |
| **2026-02-03** | **Gateway API Sync + TX UX Audit** — types regen, 6 issues closed | ✅ Complete |
| **2026-02-03** | **Draft Task Delete Fix** — #147/#148, typed assets, TX audit 9/16 | ✅ Complete |
| **2026-02-03** | **Contributor TX Cleanup** — All 3 contributor TXs production-ready | ✅ Complete |
| **2026-02-04–06** | **Migration Testing Fixes** — PRs #189–#192: titles, UX copy, auth gates | ✅ Complete |
| **2026-02-06** | **Unified Studio** (PR #193) — Persistent sidebar, split-pane layout | ✅ Complete |
| **2026-02-07** | **Wallet Switch Detection** (PR #194) — Auto-logout, closes #47 | ✅ Complete |
| 2026-01-16 → 2026-02-06 | V1→V2 Migration Focus (app.andamio.io) | 🔄 In Progress |
| 2026-02-06 (Fri) | Andamio V2 Mainnet Launch | ⏳ Upcoming |

---

## Current Focus

### 🔄 Phase 3.9: API Hooks Cleanup (In Progress)

**Goal**: Standardize all API hooks to colocated types pattern.

**Course hooks**: ✅ Complete (8 files approved)
**Project hooks**: ⬜ Pending — 3 missing hooks (`useAssessCommitment`, `useClaimCommitment`, `useLeaveCommitment`)

**Tracking**: `.claude/skills/hooks-architect/PROGRESS.md`

---

## Phase Overview

```
Phase 1: Course & Learning System ━━━━━━━━━━━━━━━━ ✅ Complete (15/15 routes)
Phase 2: Optimization & Quality   ━━━━━━━━━━━━━━━━ ✅ Complete (Go API migrated)
Phase 3: Project & Contribution   ━━━━━━━━━━━━━━━━ ✅ Mostly complete (30+ routes, 17/17 tx)
Phase 3.5: V2 Gateway Migration   ━━━━━━━━━━━━━━━━ ✅ Complete (all APIs unified)
Phase 3.8: Type Transformation    ━━━━━━━━━━━━━━━━ ✅ Complete (snake_case → camelCase)
Phase 3.9: API Hooks Cleanup      ━━━━━━━━━━━━━━━━ 🔄 In Progress (course ✅, project ⬜)
Phase 3.10: Extract Direct Calls  ━━━━━━━━━━━━━━━━ ✅ Complete
Phase 4: Polish & Publish         ━━━━━━━━━━━━━━━━ 🎯 Future (Post-Mainnet 2026)
```

---

## 🎯 Phase 4: Polish & Publish (Future)

Package extraction and community release.

**Timeline**: 2026 (post-mainnet)

| Package | Purpose | Status |
|---------|---------|--------|
| `@andamio/transactions` | Transaction definitions | Ready |
| `@andamio/core` | API client, auth utilities | Planned |
| `@andamio/ui` | shadcn extensions | Planned |
| `@andamio/tiptap` | Editor wrapper | Planned |
| `@andamio/mesh` | Wallet utilities | Planned |
