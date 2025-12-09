# Andamio Template Sitemaps

This directory contains documentation mapping API endpoints and routes for the Andamio T3 App Template.

## Documents

### API Endpoint Maps

| Document | Description |
|----------|-------------|
| `andamioscan-api.md` | **On-chain data** - Courses, students, user credentials from blockchain |
| `course-local-state.md` | **DB API routes** - Course CRUD, local state, metadata |
| `project-local-state.md` | **DB API routes** - Project CRUD, local state |

### Systems Overview

| System | Data Source | Purpose |
|--------|-------------|---------|
| **Andamioscan** | Blockchain indexer | Read on-chain course/user state |
| **Andamio DB API** | PostgreSQL | CRUD operations, drafts, metadata |
| **Atlas Tx API** | Transaction builder | Build & submit blockchain transactions |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Andamio T3 App Template                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Andamioscan │  │ Andamio DB   │  │   Atlas Tx API       │  │
│  │  (Read-only) │  │ API (CRUD)   │  │   (Transactions)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Frontend Components                    │  │
│  │  - Course catalog (Andamioscan + DB API)                 │  │
│  │  - Course editor (DB API)                                │  │
│  │  - Publish flow (Atlas Tx API → Andamioscan)             │  │
│  │  - Student progress (Andamioscan)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Reference

### When to use each API

| Action | API | Endpoint Example |
|--------|-----|------------------|
| List published courses | Andamioscan | `GET /v2/courses` |
| Get course metadata | DB API | `GET /courses/{id}` |
| Edit course draft | DB API | `PUT /courses/{id}` |
| Check if user enrolled | Andamioscan | `GET /v2/user/global-state/{alias}` |
| Get student commitments | DB API | `GET /assignment-commitments/...` |
| View on-chain students | Andamioscan | `GET /v2/courses/{id}/students` |
| Publish course | Atlas Tx API | `POST /tx/v2/admin/course/create` |
| Mint modules | Atlas Tx API | `POST /tx/v2/teacher/course/modules/manage` |

### Environment Variables

```bash
# Andamioscan (on-chain data)
NEXT_PUBLIC_ANDAMIOSCAN_URL="https://preprod.andamioscan.andamio.space"

# Andamio DB API (local state)
NEXT_PUBLIC_ANDAMIO_API_URL="http://localhost:4000/api/v0"

# Atlas Tx API (transactions) - documented in andamio-docs
NEXT_PUBLIC_TX_API_URL="https://preprod-tx.andamio.io"
```
