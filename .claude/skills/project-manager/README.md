# Project Manager Skill

> **Last Updated**: January 21, 2026

This skill directory contains project planning, status tracking, and architectural documentation for the Andamio T3 App Template.

---

## Quick Reference

| Metric | Value |
|--------|-------|
| Course Routes | 15/15 implemented |
| Project Routes | 10/13 implemented |
| Transaction Components | **16/16 V2 complete** |
| Gateway Migration | **Complete** |
| L1 Core Package | **Complete** |
| **Overall API Coverage** | **63%** (68/108 endpoints) |

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.

### Current Focus

**Layered Architecture L2/L3** - L1 Core complete (`@andamio/core`), ready for hook reorganization and V1 cleanup.

---

## Map of Content

### Core Status Docs

| Document | Purpose |
|----------|---------|
| `STATUS.md` | Current implementation status, blockers, system overview |
| `ROADMAP.md` | Development phases, milestones, planned work |

### Session Archives

| Archive | Sessions | Period |
|---------|----------|--------|
| `archived-sessions/2026-01-05-to-2026-01-11.md` | 1-4 | Go API migration, type packages, wallet auth |
| `archived-sessions/2026-01-12-to-2026-01-18.md` | 5-20 | Pioneers launch, V2 Gateway, TX migration |
| `archived-sessions/2026-01-19-to-2026-01-25.md` | 21-28 | TX Watcher fixes, L1 Core, taxonomy compliance |

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
| `CONTRIBUTOR-TRANSACTION-MODEL.md` | 3-transaction contributor lifecycle (COMMIT, ACTION, CLAIM) |
| `SIDE-EFFECTS-INTEGRATION.md` | Side effects system (`onSubmit`, `onConfirmation`) |
| `PENDING-TX-WATCHER.md` | Blockchain transaction monitoring |
| `TX-MIGRATION-GUIDE.md` | V1 to V2 transaction migration patterns |

### API & Architecture Proposals

| Document | Purpose |
|----------|---------|
| `API-UPGRADE-PLAN.md` | API endpoint implementation roadmap |
| `layered-proposal.md` | Layered architecture proposal |
| `layered-proposal-review.md` | Proposal review and implementation plan |
| `ANDAMIOSCAN-EVENTS-CONFIRMATION.md` | Event-based TX confirmation spec |

### Onboarding

| Document | Purpose |
|----------|---------|
| `GETTING-STARTED.md` | Onboarding guide, environment setup |

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| `/audit-api-coverage` | API endpoint tracking, implementation planning |
| `/design-system` | Unified styling (3 modes: review, diagnose, reference) |
| `/documentarian` | Documentation updates after code changes |
| `/review-pr` | PR review with automatic skill delegation |
| `/transaction-auditor` | Sync TX schemas with gateway API spec |
| `/tx-loop-guide` | Guide testers through transaction flows |
| `/react-query-auditor` | Audit cache invalidation patterns |

---

## Environment Variables

```bash
# Unified API Gateway (combines all services)
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://andamio-api-gateway-666713068234.us-central1.run.app"
ANDAMIO_API_KEY="your-api-key-here"

# Cardano Network
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="4758613867a8a7aa500b5d57a0e877f01a8e63c1365469589b12063c"
```

---

## Regenerating Types

When the API changes:
```bash
npm run generate:types
```
