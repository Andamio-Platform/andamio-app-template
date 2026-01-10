# Project Manager Skill

> **Last Updated**: January 9, 2026

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
| DB API Coverage | ~66% (49/74 endpoints) |
| Andamioscan Coverage | 53% (17/32 endpoints) |
| React Query Hooks | 18 DB + 25 Andamioscan hooks |

### Current Blockers

| Blocker | Status |
|---------|--------|
| @andamio/transactions NPM | Waiting (have locally) |
| Andamio DB API (Go) | Waiting for deployment |
| Event Endpoints | 0/15 (using Koios polling) |

### Current Focus

**Andamio V2 Preprod Release** (2026-01-09) - Final optimizations before launch.

See `ROADMAP.md` for current priorities and `STATUS.md` for detailed blockers.

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| `audit-api-coverage` | API endpoint tracking, React Query hooks |
| `review-styling` | Style rules validation, extracted components |
| `theme-expert` | Design system: layouts, colors, spacing, components |
| `documentarian` | Documentation updates, skill backlog |

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
