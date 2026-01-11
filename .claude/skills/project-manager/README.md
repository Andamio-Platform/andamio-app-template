# Project Manager Skill

> **Last Updated**: January 11, 2026

This skill directory contains project planning, status tracking, and architectural documentation for the Andamio T3 App Template.

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
| Project Routes | 6/13 implemented |
| Transaction Components | **16/16 V2 complete** |
| DB API Coverage | **56%** (49/87 endpoints) |
| Tx API Coverage | **100%** (16/16 endpoints) |
| Andamioscan Coverage | **94%** (32/34 endpoints) |
| **Overall API Coverage** | **71%** (97/137 endpoints) |

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.

### Current Blockers

| Blocker | Status |
|---------|--------|
| @andamio/transactions NPM | Waiting (have locally via workspace) |
| Go API Migration | ✅ **Complete** (50+ endpoints migrated) |
| Wallet Testing | ⏳ Need to test Nami, Flint, Yoroi, Lace |

### Current Focus

**Andamio Pioneers Launch** (2026-01-14) - Final testing before Pioneers Program.

See `ROADMAP.md` for current priorities and `STATUS.md` for detailed blockers.

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

The app integrates multiple APIs:

| Source | Type | Purpose |
|--------|------|---------|
| Andamioscan | Read-only | On-chain course/user state |
| Andamio DB API | CRUD | Drafts, metadata, local state |
| Atlas Tx API | Transactions | Build & submit blockchain tx |

```
┌─────────────────────────────────────────────────────────────┐
│                    Andamio T3 App Template                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ Andamioscan│  │ DB API     │  │ Atlas Tx API           │ │
│  │ (on-chain) │  │ (CRUD)     │  │ (transactions)         │ │
│  └─────┬──────┘  └─────┬──────┘  └───────────┬────────────┘ │
│        │               │                      │              │
│        ▼               ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Frontend Components                    │   │
│  │  - Course pages (Andamioscan + DB API)               │   │
│  │  - Studio pages (DB API)                             │   │
│  │  - Transactions (Atlas Tx → confirm via Andamioscan) │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```bash
# Andamioscan (on-chain data)
NEXT_PUBLIC_ANDAMIOSCAN_URL="https://preprod.andamioscan.andamio.space"

# Andamio DB API (local state)
NEXT_PUBLIC_ANDAMIO_API_URL="http://localhost:4000/api/v0"

# Access Token Policy ID
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="..."
```
