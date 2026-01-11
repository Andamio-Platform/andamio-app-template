# Skills Audit Report

> **Last Updated**: January 11, 2026

## Summary

| Skill | Status | Maturity | Supporting Files | Notes |
|-------|--------|----------|------------------|-------|
| `audit-api-coverage` | ✅ Active | High | 11 files + script | Automated coverage script added |
| `design-system` | ✅ Active | High | 11 files | 3 modes (review, diagnose, reference) |
| `documentarian` | ✅ Active | High | 2 files | Active backlog with skill suggestions |
| `project-manager` | ✅ Active | High | 12 files | Just updated with current metrics |
| `review-pr` | ✅ Active | High | 3 files | Orchestrates other skills |
| `tx-loop-guide` | ✅ Active | Medium | 2 files | Ready for Pioneers testing |

**Total**: 6 active skills, all relevant

---

## Skill Details

### 1. `audit-api-coverage` ✅

**Purpose**: Audit API coverage across all 3 sub-systems

**Recent Updates** (January 11, 2026):
- Added automated coverage script (`scripts/audit-coverage.ts`)
- Updated endpoint counts to match live OpenAPI specs
- Auto-generates `COVERAGE-REPORT.md` and `coverage-report.json`

**Current Coverage**:
- DB API: 56% (49/87 endpoints)
- Tx API: 100% (16/16 endpoints)
- Andamioscan: 94% (32/34 endpoints)
- Overall: 71% (97/137 endpoints)

**Files**:
| File | Purpose | Status |
|------|---------|--------|
| `SKILL.md` | Main instructions | ✅ Updated |
| `scripts/audit-coverage.ts` | Automated scanner | ✅ New |
| `COVERAGE-REPORT.md` | Auto-generated report | ✅ New |
| `coverage-report.json` | Machine-readable data | ✅ New |
| `db-api-endpoints.md` | DB API reference | ✅ Updated |
| `andamioscan-endpoints.md` | Andamioscan reference | ✅ Updated |
| `tx-api-endpoints.md` | Tx API reference | ✅ Current |
| `api-coverage.md` | Coverage matrix | ✅ Updated |
| `data-sources.md` | Architecture overview | ✅ Current |
| `api-recommendations-2026-01-10.md` | Go API migration map | Keep |
| `api-recommendations-2025-12-19.md` | React Query hooks docs | Archive candidate |
| `api-coverage-report-2026-01-10.md` | Old manual report | **Delete** - superseded |

---

### 2. `design-system` ✅

**Purpose**: Unified design system expertise with 3 modes

**Modes**:
1. `review` - Audit routes for styling compliance
2. `diagnose` - Debug CSS specificity conflicts
3. `reference` - Query design patterns

**Files** (11): All current and well-organized

---

### 3. `documentarian` ✅

**Purpose**: Update docs after codebase changes

**Backlog Status**: Active with 12 skill suggestions, 129 completed items

**Priority Suggestions**:
- `transaction-auditor` - Critical (verify tx definitions match API)
- `api-migration-validator` - Critical (validate endpoints match Go API)
- `andamioscan-event-integrator` - High (15 event endpoints)
- `type-auditor` - High (verify API types)

---

### 4. `project-manager` ✅

**Purpose**: Track project status, coordinate skills

**Recent Updates** (January 11, 2026):
- Updated all API coverage metrics
- Fixed date references (Fri/Sat/Sun)
- Updated milestones for Pioneers launch

**Files**: 12 files, all current

---

### 5. `review-pr` ✅

**Purpose**: Comprehensive PR review with skill delegation

**Delegates to**: `design-system`, `audit-api-coverage`, `documentarian`

**Status**: Well-documented with examples

---

### 6. `tx-loop-guide` ✅

**Purpose**: Guide testers through transaction loops

**Relevance**: High - Andamio Pioneers launches January 14

**Loops Documented**:
1. Onboarding (1 tx)
2. Earn a Credential (3 tx)
3. Create and Publish Course (2 tx)
4. Assignment Revision Flow (5 tx)
5. Multi-Module Learning Path (N tx)
6. Team Teaching Setup (3 tx)

---

## Files Cleaned Up

| File | Reason | Action | Status |
|------|--------|--------|--------|
| `audit-api-coverage/api-coverage-report-2026-01-10.md` | Superseded by auto-generated COVERAGE-REPORT.md | Delete | ✅ Done |
| `audit-api-coverage/api-recommendations-2025-12-19.md` | Outdated December version | Replaced with 2026-01-12 version | ✅ Done |

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
│                  tx-loop-guide (for Pioneers testing)  │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Verdict: All Skills Relevant ✅

All 6 skills are actively used and well-maintained. No skills need to be removed.

**Completed Actions**:
1. ✅ Deleted `api-coverage-report-2026-01-10.md` (superseded by automated COVERAGE-REPORT.md)
2. ✅ Replaced `api-recommendations-2025-12-19.md` with `api-recommendations-2026-01-12.md` (team review doc)
