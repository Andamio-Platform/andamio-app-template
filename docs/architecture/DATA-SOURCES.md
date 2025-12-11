# Data Sources Architecture

> **Where does this app get its data?**
> Last Updated: December 11, 2025

This document explains the external data sources used by the Andamio T3 App Template and provides a complete endpoint inventory.

---

## Table of Contents

- [Overview](#overview)
- [Data Sources Summary](#data-sources-summary)
- [Architecture Details](#architecture-details)
- [Complete Endpoint Inventory](#complete-endpoint-inventory)
- [Data Source Details](#data-source-details)

---

## Overview

The app pulls data from **two main categories**:

1. **Off-Chain Data** - Stored in PostgreSQL, managed by Andamio Database API
2. **On-Chain Data** - Provided by **Andamioscan** for indexed blockchain data, and **Koios** for transaction confirmations

---

## Data Sources Summary

| Source | Purpose | Status |
|--------|---------|--------|
| **Andamio DB API** | Off-chain CRUD operations, authentication | ✅ Active |
| **Andamioscan** | On-chain indexed data, transaction building | ✅ Active |
| **Koios API** | Transaction confirmations | ✅ Active |

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Andamio T3 App Template                      │
│                    (This app - one of many clients)             │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐
│ Andamio DB    │  │ Andamioscan    │  │ Koios API      │
│ API           │  │                │  │ (Third-party)  │
│ localhost:4000│  │ On-chain       │  │ koios.rest     │
│               │  │ indexed data   │  │                │
│ Off-chain     │  │ + tx building  │  │ Tx status      │
│ CRUD          │  │                │  │ only           │
└───────────────┘  └────────────────┘  └────────────────┘
```

### Future Architecture (Production)

```
┌─────────────────────────────────────────────────────────────────┐
│                    Client Applications                          │
│  (T3 App Template, Mobile Apps, Third-party Integrations, etc.) │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │    Unified Andamio API  │
              │    api.andamio.io       │
              │                         │
              │  • Authentication       │
              │  • Off-chain CRUD       │
              │  • On-chain queries     │
              │  • Tx building          │
              │  • Tx confirmation      │
              └───────────┬─────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │ PostgreSQL  │ │ Cardano     │ │ Blockchain  │
   │ Database    │ │ Indexer     │ │ Node        │
   └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Architecture Details

### Environment Variables

```bash
# All 3 data sources are active

# 1. Off-chain data - Andamio Database API
NEXT_PUBLIC_ANDAMIO_API_URL="http://localhost:4000/api/v0"

# 2. On-chain indexed data - Andamioscan
# Server-side only - accessed via /api/andamioscan proxy
ANDAMIOSCAN_API_URL="https://preprod.andamioscan.andamio.space"

# 3. Koios - hardcoded in cardano-indexer.ts
# Accessed via /api/koios proxy → preprod.koios.rest

# Network configuration
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
```

### Proxy Routes (Required for CORS)

| Proxy Route | Upstream | Purpose | Status |
|-------------|----------|---------|--------|
| `/api/andamioscan/[...path]` | `ANDAMIOSCAN_API_URL` | On-chain data queries + tx building | ✅ Active |
| `/api/koios/[...path]` | `preprod.koios.rest` | Transaction confirmations | ✅ Active |

---

## Complete Endpoint Inventory

This inventory documents every API call made by this application. Use this as the migration checklist when transitioning to the unified Andamio API.

### Summary Statistics

| Source | Endpoints | Auth Type | Status |
|--------|-----------|-----------|--------|
| Andamio DB API | ~70 | JWT | ✅ Active |
| Andamioscan | 8+ | Public | ✅ Active |
| Koios API | 2 | Public | ✅ Active |

---

### 1. ANDAMIO DATABASE API

**Base URL**: `env.NEXT_PUBLIC_ANDAMIO_API_URL` (`http://localhost:4000/api/v0`)

#### Authentication Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/auth/login/session` | POST | Public | `src/lib/andamio-auth.ts` | Create login session, get nonce |
| `/auth/login/validate` | POST | Public | `src/lib/andamio-auth.ts` | Validate wallet signature, return JWT |

#### User Management Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/user/update-alias` | POST | JWT | `andamio-auth-context.tsx`, `mint-access-token.tsx` | Sync access token alias |
| `/user/update-unconfirmed-tx` | PATCH | JWT | `use-pending-tx-watcher.ts`, `use-andamio-transaction.ts` | Update pending tx hash |
| `/creator/create` | POST | JWT | `andamio-auth-context.tsx` | Auto-register as Creator |
| `/learner/create` | POST | JWT | `andamio-auth-context.tsx` | Auto-register as Learner |

#### Course Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/courses/published` | GET | Public | `course/page.tsx` | List all published courses |
| `/courses/owned` | POST | JWT | `owned-courses-list.tsx`, `course-manager.tsx`, `sitemap/page.tsx`, `studio/project/page.tsx` | List owned courses |
| `/courses/get` | GET | Public | `course/[coursenft]/page.tsx`, `studio/course/[coursenft]/page.tsx`, `instructor/page.tsx` | Fetch course by NFT policy ID |
| `/courses/create` | POST | JWT | `create-course-dialog.tsx` | Create new course |
| `/courses/check` | GET | Public | `create-course-dialog.tsx` | Check if course code exists |
| `/courses/update` | PATCH | JWT | `studio/course/[coursenft]/page.tsx` | Update course metadata |
| `/courses/delete` | DELETE | JWT | `studio/course/[coursenft]/page.tsx` | Delete course |
| `/courses/unpublished-projects` | GET | JWT | `studio/course/[coursenft]/page.tsx` | Get unpublished projects |

#### Course Module Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/course-modules/list` | GET | Public | `course/[coursenft]/page.tsx`, `studio/.../[modulecode]/page.tsx` | List modules for course |
| `/course-modules/get` | GET | Public | `course/.../[modulecode]/page.tsx`, `studio/.../[modulecode]/page.tsx` | Fetch single module |
| `/course-modules/list-by-courses` | POST | Public | `owned-courses-list.tsx`, `course-manager.tsx` | Batch fetch modules |
| `/course-modules/create` | POST | JWT | `create-module-dialog.tsx` | Create module |
| `/course-modules/update` | PATCH | JWT | `studio/.../[modulecode]/page.tsx` | Update module |
| `/course-modules/update-status` | PATCH | JWT | `studio/.../[modulecode]/page.tsx` | Update status (DRAFT/PUBLISHED) |
| `/course-modules/update-code` | PATCH | JWT | `studio/.../[modulecode]/page.tsx` | Rename module code |
| `/course-modules/delete` | DELETE | JWT | `studio/.../[modulecode]/page.tsx` | Delete module |
| `/course-modules/publish` | POST | JWT | `studio/.../[modulecode]/page.tsx` | Publish to blockchain |
| `/course-modules/set-pending-tx` | PATCH | JWT | `studio/.../[modulecode]/page.tsx` | Set pending tx hash |
| `/course-modules/confirm-transaction` | POST | JWT | `use-pending-tx-watcher.ts` | Confirm blockchain tx |
| `/course-modules/assignment-summary` | GET | Public | `studio/course/[coursenft]/page.tsx` | Get assignment summary |

#### Lesson Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/lessons/list` | GET | Public | `course/.../[modulecode]/page.tsx`, `slts/page.tsx` | List lessons for module |
| `/lessons/get` | GET | Public | `course/.../[moduleindex]/page.tsx`, `studio/.../[moduleindex]/page.tsx` | Fetch single lesson |
| `/lessons/create` | POST | JWT | `studio/.../[moduleindex]/page.tsx` | Create lesson |
| `/lessons/update` | PATCH | JWT | `studio/.../[moduleindex]/page.tsx` | Update lesson |
| `/lessons/delete` | DELETE | JWT | `studio/.../[moduleindex]/page.tsx` | Delete lesson |

#### Introduction Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/introductions/get` | GET | Public | `studio/.../introduction/page.tsx` | Fetch introduction |
| `/introductions/create` | POST | JWT | `studio/.../introduction/page.tsx` | Create introduction |
| `/introductions/update` | PATCH | JWT | `studio/.../introduction/page.tsx` | Update introduction |
| `/introductions/publish` | POST | JWT | `studio/.../introduction/page.tsx` | Publish introduction |

#### SLT (Student Learning Target) Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/slts/list` | GET | Public | `course/.../[modulecode]/page.tsx`, `assignment/page.tsx`, `slts/page.tsx` | List SLTs |
| `/slts/get` | GET | Public | `slts/page.tsx` | Fetch single SLT |
| `/slts/create` | POST | JWT | `slts/page.tsx` | Create SLT |
| `/slts/update` | PATCH | JWT | `slts/page.tsx` | Update SLT |
| `/slts/delete` | DELETE | JWT | `slts/page.tsx` | Delete SLT |
| `/slts/batch-update-indexes` | PATCH | JWT | `slts/page.tsx` | Reorder SLTs |

#### Assignment Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/assignments/get` | GET | Public | `course/.../assignment/page.tsx`, `studio/.../assignment/page.tsx` | Fetch assignment |
| `/assignments/create` | POST | JWT | `studio/.../assignment/page.tsx` | Create assignment |
| `/assignments/update` | PATCH | JWT | `studio/.../assignment/page.tsx` | Update assignment |
| `/assignments/delete` | DELETE | JWT | `studio/.../assignment/page.tsx` | Delete assignment |
| `/assignments/publish` | POST | JWT | `studio/.../assignment/page.tsx` | Publish assignment |

#### Assignment Commitment Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/assignment-commitments/list-learner-by-course` | GET | JWT | `assignment-commitment.tsx` | Learner's commitments |
| `/assignment-commitments/list-by-course` | GET | JWT | `instructor/page.tsx` | All commitments (instructor) |
| `/assignment-commitments/update-evidence` | PATCH | JWT | `assignment-commitment.tsx` | Submit evidence |
| `/assignment-commitments/delete` | DELETE | JWT | `assignment-commitment.tsx` | Delete commitment |
| `/assignment-commitments/confirm-transaction` | POST | JWT | `use-pending-tx-watcher.ts` | Confirm blockchain tx |

#### Project Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/projects/list` | GET | Public | `project/page.tsx`, `project/[treasurynft]/page.tsx` | List published projects |
| `/projects/owned` | GET | JWT | `sitemap/page.tsx` | List owned projects |
| `/projects/list-owned` | GET | JWT | `studio/project/page.tsx`, `studio/project/[treasurynft]/page.tsx` | Creator's projects |
| `/projects/update` | PATCH | JWT | `studio/project/[treasurynft]/page.tsx` | Update project |

#### Task Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/tasks/list` | GET | Public | `project/[treasurynft]/page.tsx`, `[taskhash]/page.tsx`, `draft-tasks/page.tsx` | List tasks |
| `/tasks/create` | POST | JWT | `draft-tasks/new/page.tsx` | Create task |
| `/tasks/update` | PATCH | JWT | `draft-tasks/[taskindex]/page.tsx` | Update task |
| `/tasks/delete` | DELETE | JWT | `draft-tasks/page.tsx` | Delete task |

#### Task Commitment Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/task-commitments/get` | GET | Public | `project/[treasurynft]/[taskhash]/page.tsx` | Fetch commitment |

#### Learner Progress Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/learner/my-learning` | POST | JWT | `my-learning.tsx` | Get enrolled courses with progress |
| `/user-course-status/get` | GET | JWT | `user-course-status.tsx` | Learner's course status |

#### Transaction Endpoints

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/pending-transactions` | POST | JWT | `use-pending-tx-watcher.ts` | Get pending transactions |

---

### 2. ANDAMIOSCAN API (On-Chain Data)

**Base URL**: Via proxy `/api/andamioscan/` → `env.ANDAMIOSCAN_API_URL`

**Status**: ✅ Active

**Endpoints**:

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/aggregate/user-info` | GET | Public | User's on-chain aggregated data |
| `/course-state/utxos` | GET | Public | Course UTXOs |
| `/course-state/info` | GET | Public | Course on-chain info |
| `/course-state/decoded-datum` | GET | Public | User's enrollment datum |
| `/assignment-validator/utxos` | GET | Public | Assignment validator UTXOs |
| `/assignment-validator/decoded-datum` | GET | Public | Decoded assignment datum |
| `/module-ref-validator/utxos` | GET | Public | Module ref validator UTXOs |
| `/module-ref-validator/decoded-datum` | GET | Public | Decoded module ref datum |
| `/tx/*` | POST | Public | Transaction building |

---

### 3. KOIOS API (Transaction Status)

**Base URL**: Via proxy `/api/koios/` → `https://preprod.koios.rest/api/v1`

**Source Code**: `src/lib/cardano-indexer.ts`

| Endpoint | Method | Auth | Files | Purpose |
|----------|--------|------|-------|---------|
| `/tx_status` | POST | Public | `cardano-indexer.ts`, `use-pending-tx-watcher.ts` | Check transaction confirmation |
| `/tx_utxos` | POST | Public | `cardano-indexer.ts` | Get transaction outputs |

**Helper Functions**:
- `checkTransactionConfirmation(txHash)` - Single tx check
- `checkTransactionsBatch(txHashes)` - Batch tx check
- `getTransactionOutputs(txHash)` - Get UTXOs
- `extractOnChainData(txHash)` - Parse on-chain data

---

## Data Source Details

### 1. Andamio Database API (Off-Chain)

**Purpose**: Primary data store for application state.

| Data Type | Examples |
|-----------|----------|
| User Management | User accounts, roles, aliases |
| Course Content | Courses, modules, lessons, assignments |
| Learning Progress | Assignment commitments, completion status |
| Authentication | JWT tokens, session management |
| Metadata | Categories, access tiers, publication status |

**Key Characteristics**:
- Authentication: JWT bearer tokens (from wallet signature)
- Request Format: POST with JSON body (snake_case fields)
- Type Safety: Import types from `andamio-db-api` package
- CORS: Configured for browser requests

### 2. Andamioscan API (On-Chain Indexed)

**Purpose**: Indexed on-chain data from Cardano blockchain + transaction building.

**Status**: ✅ Active

| Data Type | Examples |
|-----------|----------|
| User Aggregation | On-chain user info by access token alias |
| Course State | UTXOs, enrollment datums, course info |
| Assignment Validator | Commitment UTXOs, decoded assignment datums |
| Module Ref Validator | Module credential UTXOs, decoded module datums |
| Transaction Building | Mint tokens, enroll, submit assignments |

**Key Characteristics**:
- Authentication: None required (public read-only for queries)
- Request Format: GET with query parameters (queries), POST with JSON (transactions)
- CORS: No browser support - must use proxy
- Display: Raw JSON only (use `AndamioCode` component)
- Proxy Route: `/api/andamioscan/[...path]`

### 3. Koios API (On-Chain Transaction Status)

**Purpose**: Real-time blockchain queries for transaction confirmation.

| Data Type | Purpose |
|-----------|---------|
| Transaction Status | Confirm if tx is on-chain |
| Transaction UTXOs | Extract outputs and minted assets |
| Confirmation Count | Number of block confirmations |

**Key Characteristics**:
- Authentication: None required
- Request Format: POST with JSON body
- CORS: No browser support - must use proxy
- Rate Limits: Free tier - basic usage only

---

## Related Documentation

- [API-ENDPOINT-REFERENCE.md](../api/API-ENDPOINT-REFERENCE.md) - Complete Database API reference
- [PENDING-TX-WATCHER.md](../features/PENDING-TX-WATCHER.md) - Transaction monitoring system
- `src/lib/cardano-indexer.ts` - Koios integration code
- `src/app/api/andamioscan/[...path]/route.ts` - Andamioscan proxy

---

**Last Updated**: December 11, 2025
