# Development Roadmap

> **Last Updated**: December 19, 2025
>
> **Strategy**: Build incrementally, test thoroughly, establish patterns that scale

---

## Andamio V2 Release Schedule

```
TODAY ──────────────────────────────────────────────────── 2025-12-19
  │
  │   Template optimization, React Query migration
  │
  ▼
PREPROD V2 RELEASE ─────────────────────────────────────── 2026-01-09
  │
  │   3 days prep
  │
  ▼
ANDAMIO PIONEERS PROGRAM BEGINS ────────────────────────── 2026-01-12
  │   Featured Activity: Preprod Testing
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

| Date | Milestone |
|------|-----------|
| 2025-12-19 | Today - Template optimization |
| 2026-01-09 | Andamio V2 Preprod Release |
| 2026-01-12 | Andamio Pioneers Program Begins |
| 2026-01-12 → 2026-02-06 | V1→V2 Migration Focus (app.andamio.io) |
| 2026-02-06 | Andamio V2 Mainnet Launch |

### Note on Template vs Production App

During the **2026-01-12 → 2026-02-06** period, primary development focus shifts to:
- **app.andamio.io** (production fork of this template)
- V1 → V2 migration features
- Features specific to production deployment

This template continues as the **reference implementation** and will receive updates after mainnet launch.

---

## Current Focus

### React Query Migration (Active)

**Goal**: Replace `useState`/`useEffect` patterns with React Query hooks

**Status**:
- 18 hooks created (`src/hooks/api/`)
- 1 page migrated as demo
- Migration roadmap documented

**Next Steps**:
1. Migrate remaining course pages
2. Migrate wizard step components
3. Deprecate old useState-based hooks

See `audit-api-coverage/api-recommendations-2025-12-19.md` for details.

---

## Phase Overview

```
Phase 1: Course & Learning System ━━━━━━━━━━━━━━━━ ✅ Complete
Phase 2: Optimization & Quality   ━━━━━━━━━━━━━━━━ 🔄 In Progress (Now → Jan 2026)
Phase 3: Project & Contribution   ━━━━━━━━━━━━━━━━ 📋 Planned (Post-Mainnet)
Phase 4: Polish & Publish         ━━━━━━━━━━━━━━━━ 🎯 Future (2026)
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

## 📋 Phase 3: Project & Contribution System (Planned)

Full project/task/contributor workflow.

**Timeline**: Post-Mainnet Launch (after 2026-02-06)

### What's Documented

- 13 routes mapped in `project-local-state.md`
- 16 API endpoints identified
- Task commitment status flow designed

### Not Yet Started

- No routes implemented
- No transactions integrated
- Awaiting protocol team specs for some validators

### Key Components Needed

**Public Routes** (3):
- `/project` - Project catalog
- `/project/[treasurynft]` - Project detail
- `/project/[treasurynft]/[taskhash]` - Task detail

**Studio Routes** (10):
- Project dashboard, treasury management
- Contributor management, commitments
- Task CRUD, transaction history

**Transactions** (~9):
- Contributor: join, commit, update, leave, claim
- Manager: accept, deny, distribute

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
