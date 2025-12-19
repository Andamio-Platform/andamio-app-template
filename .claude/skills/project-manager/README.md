# Project Manager Skill

> **Last Updated**: December 19, 2025

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
| Project Routes | 0/13 implemented |
| API Coverage | ~66% (49/74 endpoints) |
| React Query Hooks | 18 created, 1 page migrated |

### Current Focus

**React Query Migration** - Replacing `useState`/`useEffect` with cached hooks.

See `ROADMAP.md` for current priorities.

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| `audit-api-coverage` | API endpoint tracking, React Query hooks |
| `review-styling` | Style guidelines, semantic colors |
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
