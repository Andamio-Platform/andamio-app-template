# Skills Audit Report

> **Last Updated**: January 21, 2026

## Summary

| Skill | Status | Maturity | Supporting Files | Notes |
|-------|--------|----------|------------------|-------|
| `audit-api-coverage` | ✅ Active | High | 8 files + script | Unified Gateway (108 endpoints, 63% coverage) |
| `design-system` | ✅ Active | High | 11 files | 3 modes (review, diagnose, reference) |
| `documentarian` | ✅ Active | High | 2 files | Active backlog with skill suggestions |
| `issue-handler` | ✅ Active | Medium | 0 files | Issue routing to appropriate repos |
| `project-manager` | ✅ Active | High | 16+ files | Comprehensive project tracking |
| `react-query-auditor` | ✅ Active | Medium | 0 files | Audit hooks for type safety |
| `review-pr` | ✅ Active | High | 3 files | Orchestrates other skills |
| `transaction-auditor` | ✅ Active | Medium | 0 files | Sync TX schemas with Gateway API |
| `tx-loop-guide` | ✅ Active | Medium | 2 files | Guide testers through TX loops |

**Total**: 9 active skills, all relevant

---

## Skill Details

### 1. `audit-api-coverage` ✅

**Purpose**: Audit API coverage for the Unified Andamio API Gateway (108 endpoints)

**Current Coverage**: 63% (68/108 endpoints)

**Files**:
| File | Purpose | Status |
|------|---------|--------|
| `SKILL.md` | Main instructions | ✅ Current |
| `scripts/audit-coverage.ts` | Automated scanner | ✅ Active |
| `COVERAGE-REPORT.md` | Auto-generated report | Auto-generated |
| `coverage-report.json` | Machine-readable data | Auto-generated |
| `unified-api-endpoints.md` | Gateway endpoints reference | ✅ Current |
| `api-coverage.md` | Implementation status | ✅ Current |
| `tx-state-machine.md` | TX state machine docs | ✅ Current |
| `V2-MIGRATION-CHECKLIST.md` | V2 migration tracking | Historical |
| `API-REFINEMENT-SESSION.md` | API refinement notes | Historical |

---

### 2. `design-system` ✅

**Purpose**: Unified design system expertise with 3 modes

**Modes**:
1. `review` - Audit routes for styling compliance
2. `diagnose` - Debug CSS specificity conflicts
3. `reference` - Query design patterns

**Files** (11): All current and well-organized
- `style-rules.md`, `semantic-colors.md`, `responsive-design.md`
- `icon-system.md`, `extracted-components.md`, `global-overrides.md`
- `layouts.md`, `spacing.md`, `components.md`
- `cannot-customize.md`, `route-reference.md`

---

### 3. `documentarian` ✅

**Purpose**: Update docs after codebase changes

**Backlog Status**: Active with skill suggestions and 129+ completed items

**Files** (2): `SKILL.md`, `BACKLOG.md`

---

### 4. `issue-handler` ✅

**Purpose**: View error logs and route issues to appropriate repos

**Key Function**: Route issues through the stack:
```
T3 App Template → Andamio API Gateway → Backend subsystems
```

**Files**: Skill-only (no supporting docs)

---

### 5. `project-manager` ✅

**Purpose**: Track project status, coordinate skills

**Files** (16+):
- Core: `STATUS.md`, `ROADMAP.md`, `README.md`, `SITEMAP.md`
- Transaction: `TX-MIGRATION-GUIDE.md`, `TRANSACTION-COMPONENTS.md`, `PENDING-TX-WATCHER.md`
- State: `course-local-state.md`, `project-local-state.md`
- API: `andamioscan-api.md`, `ANDAMIOSCAN-EVENTS-CONFIRMATION.md`, `API-UPGRADE-PLAN.md`
- Architecture: `layered-proposal.md`, `layered-proposal-review.md`
- Getting Started: `GETTING-STARTED.md`, `FRONTEND_V2_CHECKLIST.md`
- Archive: `archived-bugs/`

---

### 6. `react-query-auditor` ✅

**Purpose**: Audit React Query hooks for type safety and cache management

**Checks**:
1. Type safety (generated types used correctly)
2. Proper patterns (queryKey, staleTime, etc.)
3. Cache management (invalidation, optimistic updates)

**Files**: Skill-only

---

### 7. `review-pr` ✅

**Purpose**: Comprehensive PR review with skill delegation

**Delegates to**: `design-system`, `audit-api-coverage`, `documentarian`

**Files** (3): `SKILL.md`, `review-checklists.md`, `native-capabilities.md`

---

### 8. `transaction-auditor` ✅

**Purpose**: Keep TX schemas in sync with Gateway API spec

**When to Use**:
- After Gateway API releases with breaking changes
- When adding new transaction types
- When debugging transaction failures

**Syncs**:
- `src/config/transaction-schemas.ts`
- `src/config/transaction-ui.ts`
- `src/hooks/use-tx-watcher.ts`

**Files**: Skill-only

---

### 9. `tx-loop-guide` ✅

**Purpose**: Guide testers through transaction loops to validate functionality

**6 Documented Loops**:
1. Onboarding (1 tx)
2. Earn a Credential (3 tx)
3. Create and Publish Course (2 tx)
4. Assignment Revision Flow (5 tx)
5. Multi-Module Learning Path (N tx)
6. Team Teaching Setup (3 tx)

**Files** (3): `SKILL.md`, `tx-loops.md`, `loop-history.md`

---

## Skill Relationships

```
┌────────────────────────────────────────────────────────┐
│                   User-Invocable Skills                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│  review-pr ──────────► design-system (review mode)     │
│      │                                                  │
│      ├──────────► audit-api-coverage                   │
│      │                                                  │
│      └──────────► documentarian                        │
│                         │                               │
│                         ▼                               │
│                  project-manager                        │
│                                                         │
│  transaction-auditor (sync TX schemas)                 │
│  react-query-auditor (audit hooks)                     │
│  tx-loop-guide (for Pioneers testing)                  │
│  issue-handler (route issues)                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Verdict: All 9 Skills Relevant ✅

All skills are actively used and well-maintained.

**Recent Changes** (since January 11, 2026):
- Added `issue-handler` skill (error routing)
- Added `react-query-auditor` skill (hook auditing)
- Added `transaction-auditor` skill (schema sync)
- Updated `audit-api-coverage` for unified gateway (108 endpoints)
- Gateway taxonomy compliance complete (January 21, 2026)
