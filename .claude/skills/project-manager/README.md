# Project Manager Skill

> **Last Updated**: January 18, 2026 (V2 Gateway API Migration on `update/andamioscan` branch)

This skill directory contains project planning, status tracking, and architectural documentation for the Andamio T3 App Template.

---

## ✅ COMPLETED: V2 Gateway API Migration

**Status**: Complete on `update/andamioscan` branch - Ready for merge to main

The unified V2 Gateway API (92 endpoints) consolidates all 3 subsystems into a single gateway. Migration completed January 17-18, 2026.

### What Changed

| Before | After |
|--------|-------|
| 3 separate API handlers | Single gateway proxy |
| Manual data merging | Merged endpoints include on-chain data |
| `@andamio/db-api-types` NPM package | Generated types from OpenAPI spec |
| `NEXT_PUBLIC_ANDAMIO_API_URL` env var | Removed (only gateway URL needed) |
| Multiple proxy routes | Single `/api/gateway/[...path]` |
| v1 auth endpoints | v2 auth endpoints |

### Key Files

| File | Purpose |
|------|---------|
| `src/app/api/gateway/[...path]/route.ts` | Unified proxy route |
| `src/lib/gateway.ts` | Gateway client functions |
| `src/types/generated/gateway.ts` | Auto-generated types |
| `src/types/generated/index.ts` | Strict type re-exports |

### Regenerating Types

When the API changes:
```bash
npm run generate:types
```

---

## Map of Content

### Core Status Docs

| Document | Purpose |
|----------|---------|
| `STATUS.md` | Current implementation status, coverage metrics, recent changes |
| `ROADMAP.md` | Development phases, current focus, planned work |

### Route Documentation

| Document | Purpose |
|----------|---------|
| `SITEMAP.md` | Complete route mapping with file paths |
| `course-local-state.md` | Course routes (15 implemented), API endpoints used |
| `project-local-state.md` | Project routes (13 planned), API endpoints needed |

### System Architecture

| Document | Purpose |
|----------|---------|
| `TRANSACTION-COMPONENTS.md` | Transaction component architecture, flow |
| `CONTRIBUTOR-TRANSACTION-MODEL.md` | **NEW** - 3-transaction contributor lifecycle (COMMIT, ACTION, CLAIM) |
| `SIDE-EFFECTS-INTEGRATION.md` | Side effects system (`onSubmit`, `onConfirmation`) |
| `PENDING-TX-WATCHER.md` | Blockchain transaction monitoring |

### API References

| Document | Purpose |
|----------|---------|
| `andamioscan-api.md` | On-chain data API (courses, students, credentials) |
| `GETTING-STARTED.md` | Onboarding guide, environment setup |

---

## Quick Reference

### Current Status

| Metric | Value |
|--------|-------|
| Course Routes | 15/15 implemented |
| Project Routes | **11/13 implemented** |
| Transaction Components | **16/16 V2 complete** |
| DB API Coverage | **57%** (50/88 endpoints) |
| Tx API Coverage | **100%** (16/16 endpoints) |
| Andamioscan Coverage | **94%** (32/34 endpoints) |
| **Overall API Coverage** | **71%** (98/138 endpoints) |

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.

### Current Blockers

| Blocker | Status |
|---------|--------|
| **Andamioscan Issue #11** | ✅ **Resolved** - task_id now populated |
| **Atlas TX API Task Commit** | ✅ **Resolved** - client-side fix implemented |
| @andamio/transactions NPM | Waiting (have locally via workspace) |
| Go API Migration | ✅ **Complete** (50+ endpoints migrated) |
| Wallet Testing | ⏳ Need to test Nami, Flint, Yoroi, Lace |

### Current Focus

**Post-Migration Testing** (2026-01-18) - V2 Gateway migration complete on `update/andamioscan` branch, ready for testing and merge.

See `ROADMAP.md` for current priorities and `STATUS.md` for detailed session notes.

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| `audit-api-coverage` | API endpoint tracking, React Query hooks |
| `design-system` | Unified styling skill (3 modes: review, diagnose, reference) |
| `documentarian` | Documentation updates, skill backlog |
| `review-pr` | PR review with automatic skill delegation |

---

## Data Sources

### Current Architecture (V2 Gateway - Single API) ✅

The template now uses the unified V2 Gateway API, consolidating all 3 subsystems.

```
┌─────────────────────────────────────────────────────────────┐
│              V2 Gateway API (92 endpoints)                   │
│                                                              │
│  • Auth:         /api/v2/auth/*                             │
│  • Merged Data:  /api/v2/course/*, /api/v2/project/*        │
│  • Transactions: /v2/tx/*                                    │
│  • On-chain:     /v2/courses, /v2/projects (scan passthru)  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Andamio T3 App Template                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Single Proxy: /api/gateway/[...path]                   │ │
│  │ • Hides gateway URL from client                        │ │
│  │ • Adds API key header server-side                      │ │
│  │ • 30-second cache for GET requests                     │ │
│  └────────────────────────┬───────────────────────────────┘ │
│                           │                                  │
│                           ▼                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ React hooks (all gateway calls)                        │ │
│  │ • Role-based hooks (use-student-courses, etc.)         │ │
│  │ • Types generated from OpenAPI spec                    │ │
│  │ • Automatic cache invalidation                         │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key benefit**: Merged endpoints return combined on-chain + off-chain data. No more manual data combining in the frontend.

### Legacy Architecture (Removed)

The following have been removed from the `update/andamioscan` branch:
- `/api/andamioscan/` proxy route
- `/api/atlas-tx/` proxy route
- `NEXT_PUBLIC_ANDAMIO_API_URL` environment variable
- `@andamio/db-api-types` NPM dependency
- `src/hooks/use-andamioscan.ts`

---

## Environment Variables

```bash
# Unified API Gateway (combines all services)
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://dev-api.andamio.io"
ANDAMIO_API_KEY="your-api-key-here"

# Cardano Network
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="4758613867a8a7aa500b5d57a0e877f01a8e63c1365469589b12063c"
```
