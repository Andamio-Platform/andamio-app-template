# Skills Audit Report

> **Last Updated**: January 10, 2026

## Summary

| Skill | Status | Maturity | Supporting Files | Modes |
|-------|--------|----------|------------------|-------|
| `audit-api-coverage` | Active | High | 8 files | 3 phases (coverage, performance, planning) |
| `design-system` | Active | High | 11 files | 3 modes (review, diagnose, reference) |
| `documentarian` | Active | High | 2 files | Single workflow |
| `project-manager` | Active | High | 12 files | Single workflow |
| `review-pr` | Active | High | 3 files | Single workflow |
| `tx-loop-guide` | Active | Medium | 2 files | Single workflow |

**Total**: 6 active skills

---

## Recent Consolidations

### January 10, 2026

**`design-system`** - Consolidated from 3 skills:
- `review-styling` → Mode 1: Review (route audit)
- `global-style-checker` → Mode 2: Diagnose (CSS conflicts)
- `theme-expert` → Mode 3: Reference (design patterns)

**`audit-api-coverage`** - Merged from 2 skills:
- Original `audit-api-coverage` → Phase 1 & 2 (coverage + performance)
- `plan-andamioscan-integration` → Phase 3 (implementation planning interview)

---

## Detailed Skill Analysis

### 1. `audit-api-coverage`

**Purpose**: Audit API coverage across all 3 sub-systems + interview-based implementation planning

| Aspect | Status |
|--------|--------|
| Instructions | Complete (3 phases) |
| Supporting docs | Comprehensive (8 files: db-api, tx-api, andamioscan endpoints, coverage reports) |
| Interview workflow | Yes (Phase 3 for all 3 APIs) |
| User invocable | Yes |

**Phases**:
1. Check Coverage - Audit endpoints across DB API, Tx API, Andamioscan
2. Audit Performance - Find redundant queries, review caching
3. Implementation Planning - Interview-based UX planning for any API

---

### 2. `design-system`

**Purpose**: Unified design system expertise with 3 modes

| Aspect | Status |
|--------|--------|
| Instructions | Complete (3 modes) |
| Supporting docs | Excellent (11 files: style-rules, colors, layouts, components, etc.) |
| User invocable | Yes |

**Modes**:
1. `review` - Audit a route for styling compliance
2. `diagnose` - Debug CSS specificity conflicts
3. `reference` - Query design patterns and guidelines

---

### 3. `documentarian`

**Purpose**: Update documentation after codebase changes

| Aspect | Status |
|--------|--------|
| Instructions | Complete (5 steps) |
| Supporting docs | Good (BACKLOG.md) |
| User invocable | Yes |

---

### 4. `project-manager`

**Purpose**: Track project status, prioritize work, coordinate with other skills

| Aspect | Status |
|--------|--------|
| Instructions | Complete (6 responsibilities) |
| Supporting docs | Extensive (12 files) |
| User invocable | Yes |

---

### 5. `review-pr`

**Purpose**: Comprehensive PR review with automatic skill delegation

| Aspect | Status |
|--------|--------|
| Instructions | Complete (8 steps) |
| Supporting docs | Good (native-capabilities.md, review-checklists.md) |
| User invocable | Yes |

**Delegates to**: `design-system`, `audit-api-coverage`, `documentarian`

---

### 6. `tx-loop-guide`

**Purpose**: Guide testers through transaction loops, collect UX feedback

| Aspect | Status |
|--------|--------|
| Instructions | Complete |
| Supporting docs | Good (tx-loops.md) |
| User invocable | Yes |

---

## Skill Relationships

```
┌────────────────────────────────────────────────────────┐
│                   User-Invocable Skills                 │
├────────────────────────────────────────────────────────┤
│                                                         │
│  review-pr ──────────► design-system                   │
│      │                    (review mode)                │
│      │                                                  │
│      ├──────────► audit-api-coverage                   │
│      │                                                  │
│      └──────────► documentarian                        │
│                         │                               │
│                         ▼                               │
│                  project-manager                        │
│                                                         │
│                  tx-loop-guide                          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## Quick Reference: When to Use Each Skill

| Task | Skill | Mode/Phase |
|------|-------|------------|
| Review a pull request | `review-pr` | - |
| Check styling on a route | `design-system` | review |
| Debug CSS conflicts | `design-system` | diagnose |
| Design system questions | `design-system` | reference |
| Audit API coverage | `audit-api-coverage` | Phase 1 |
| Optimize queries | `audit-api-coverage` | Phase 2 |
| Plan new endpoint integration | `audit-api-coverage` | Phase 3 |
| Update docs after changes | `documentarian` | - |
| Check project status | `project-manager` | - |
| Test transaction flows | `tx-loop-guide` | - |
