# Project Manager Skill

> **Last Updated**: January 14, 2026

This skill directory contains project planning, status tracking, and architectural documentation for the Andamio T3 App Template.

---

## 🚨 RESUME HERE TOMORROW (January 15, 2026)

**Leaving Off**: Commitment Sync page implemented but has bugs to fix.

### First Priority: Test & Fix Commitment Sync

**Location**: `/studio/project/[projectid]/commitments`

**Test Steps**:
1. Navigate to commitments page for a project with on-chain submissions
2. Check if "DB Status" column shows correctly (✅ exists or ⚠️ Missing)
3. Click "Sync" button for a submission with "Missing" status
4. Verify toast shows success/error
5. Test TasksAssess component after sync

**Known Issues**:
- Sync button may fail if DB check returns unexpected response
- DB status check uses contributor endpoint (may need manager endpoint)
- Some edge cases with task_hash not being in DB

**Files to Debug**:
- `src/lib/project-commitment-sync.ts` - `syncPendingAssessment()` and `checkCommitmentExists()`
- `src/app/(app)/studio/project/[projectid]/commitments/page.tsx` - UI and state handling

**Related Docs**:
- `CONTRIBUTOR-TRANSACTION-MODEL.md` - Explains the 3-transaction contributor lifecycle
- `STATUS.md` (Session 9) - Full session notes

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
| **Commitment Sync Bugs** | 🔧 Debug tomorrow |
| @andamio/transactions NPM | Waiting (have locally via workspace) |
| Go API Migration | ✅ **Complete** (50+ endpoints migrated) |
| Wallet Testing | ⏳ Need to test Nami, Flint, Yoroi, Lace |

### Current Focus

**Andamio Pioneers Program** (2026-01-14 onwards) - Preprod testing with real users.

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
