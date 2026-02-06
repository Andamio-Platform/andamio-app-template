# Project Manager Skill

> **Last Updated**: January 24, 2026

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
| Type Transformation | **Complete** (Phase 3.8) |
| **Overall API Coverage** | **63%** (68/108 endpoints) |

Run `npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts` for live metrics.

### Current Focus

**L2/L3 Hook Reorganization** - Phase 3.8 Type Transformation complete, ready for hook directory restructure and V1 cleanup.

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
| `TRANSACTION-COMPONENTS.md` | Transaction component architecture, flow, 3-TX contributor model |
| `PENDING-TX-WATCHER.md` | Blockchain transaction monitoring |
| `TX-MIGRATION-GUIDE.md` | V1 to V2 transaction migration patterns |

### API & Architecture

| Document | Purpose |
|----------|---------|
| `layered-proposal-review.md` | L1-L5 layered architecture implementation status |
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
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://dev.api.andamio.io"
ANDAMIO_API_KEY="your-api-key-here"

# Cardano Network
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78"
```

### Access Token Policy IDs by Environment

| Environment | Policy ID | App URL |
|-------------|-----------|---------|
| Dev | `29aa6a65f5c890cfa428d59b15dec6293bf4ff0a94305c957508dc78` | dev.app.andamio.io |
| Staging | `aa1cbea2524d369768283d7c8300755880fd071194a347cf0a4e274f` | preprod.app.andamio.io |

Both environments use **Cardano Preprod** network.

These are set via GitHub repo variables (`DEV_ACCESS_TOKEN_POLICY_ID`, `STAGING_ACCESS_TOKEN_POLICY_ID`) and baked into the Docker image at build time.

---

## Regenerating Types

When the API changes:
```bash
npm run generate:types
```
