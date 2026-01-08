# Skills Audit Report

> **Last Updated**: January 8, 2026

## Summary

| Skill | Status | Maturity | Supporting Files | Last Updated |
|-------|--------|----------|------------------|--------------|
| `audit-api-coverage` | Active | High | 6 files | Jan 5 |
| `documentarian` | Active | High | 2 files | Jan 8 |
| `global-style-checker` | Active | Medium | 2 files | Jan 5 |
| `plan-andamioscan-integration` | Active | High | 3 files | Jan 8 |
| `project-manager` | Active | High | 12 files | Jan 8 |
| `review-pr` | Active | High | 3 files | Jan 5 |
| `review-styling` | Active | High | 6 files | Jan 8 |
| `theme-expert` | Active | High | 7 files | Jan 5 |
| `tx-loop-guide` | Active | Medium | 2 files | Jan 7 |

---

## Detailed Skill Analysis

### 1. `audit-api-coverage`

**Purpose**: Audit Andamio DB API endpoint usage and optimize React Query patterns

| Aspect | Status |
|--------|--------|
| Instructions | Complete (2 phases: coverage + performance) |
| Supporting docs | Comprehensive (api-coverage, endpoint-reference, data-sources, query-patterns, recommendations) |
| Examples | Partial (needs more examples section) |
| User invocable | Yes |

**Strengths**: Well-structured two-phase approach, clear rules for React Query usage

**Gaps**: Examples section says "Claude Code will populate" - still empty

---

### 2. `documentarian`

**Purpose**: Update documentation after codebase changes

| Aspect | Status |
|--------|--------|
| Instructions | Complete (5 steps) |
| Supporting docs | Good (BACKLOG.md for tracking suggestions) |
| Examples | Partial (needs examples) |
| User invocable | Yes |

**Strengths**: Clear workflow, integrated backlog tracking, actively maintained

**Gaps**: Examples section empty

---

### 3. `global-style-checker`

**Purpose**: Detect CSS specificity conflicts with globals.css

| Aspect | Status |
|--------|--------|
| Instructions | Complete |
| Supporting docs | Good (global-overrides.md reference) |
| Examples | Inline (diagnostic output format) |
| User invocable | No (diagnostic tool) |

**Strengths**: Specific problem-focused, clear diagnostic output format

**Gaps**: Not user-invocable; used as sub-skill by review-styling

---

### 4. `plan-andamioscan-integration`

**Purpose**: Interview-based planning for Andamioscan endpoint integration

| Aspect | Status |
|--------|--------|
| Instructions | Complete (4 steps with interview flow) |
| Supporting docs | Good (available-endpoints.md, implementation-status.md) |
| Examples | Complete (full interview example) |
| User invocable | Yes |

**Strengths**: Excellent interview format, tracks implementation status, includes error handling patterns

**Gaps**: None significant - recently created and actively used

---

### 5. `project-manager`

**Purpose**: Track project status, prioritize work, coordinate with other skills

| Aspect | Status |
|--------|--------|
| Instructions | Complete (6 responsibilities) |
| Supporting docs | Extensive (12 files covering routes, APIs, status, roadmap) |
| Examples | Empty (needs examples) |
| User invocable | Yes |

**Strengths**: Comprehensive knowledge base, clear coordination role

**Gaps**: Examples section empty, README serves as map of content

---

### 6. `review-pr`

**Purpose**: Comprehensive PR review with automatic skill delegation

| Aspect | Status |
|--------|--------|
| Instructions | Complete (8 steps with decision tree) |
| Supporting docs | Good (native-capabilities.md, review-checklists.md) |
| Examples | Complete (2 detailed examples) |
| User invocable | Yes |

**Strengths**: Excellent structure, clear delegation to other skills, complete examples

**Gaps**: None significant - production ready

---

### 7. `review-styling`

**Purpose**: Review routes against styling rules

| Aspect | Status |
|--------|--------|
| Instructions | Complete (6 steps with quick/full modes) |
| Supporting docs | Excellent (style-rules, semantic-colors, responsive-design, icon-system, extracted-components) |
| Examples | Complete (detailed walkthrough) |
| User invocable | Yes |

**Strengths**: Most comprehensive skill, excellent supporting documentation, actively maintained

**Gaps**: None significant - production ready

---

### 8. `theme-expert`

**Purpose**: Design system knowledge and guidance

| Aspect | Status |
|--------|--------|
| Instructions | Complete (reference-oriented) |
| Supporting docs | Excellent (layouts, colors, spacing, components, cannot-customize, route-reference) |
| Examples | Inline (quick reference) |
| User invocable | No (knowledge base) |

**Strengths**: Comprehensive design system documentation

**Gaps**: Not user-invocable; used as knowledge source by other skills

---

### 9. `tx-loop-guide`

**Purpose**: Guide testers through transaction loops, collect UX feedback

| Aspect | Status |
|--------|--------|
| Instructions | Complete (with critical behaviors highlighted) |
| Supporting docs | Good (tx-loops.md catalog) |
| Examples | Complete (full session example) |
| User invocable | Yes |

**Strengths**: Clear critical behaviors, issue templates, session example

**Gaps**: tx-loops.md may need updating as new transactions are added

---

## Skill Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                      User-Invocable Skills                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  review-pr ──────────► review-styling ◄──── theme-expert    │
│      │                      │                    │           │
│      │                      ▼                    │           │
│      │              global-style-checker         │           │
│      │                                           │           │
│      ├──────────► audit-api-coverage             │           │
│      │                                           │           │
│      └──────────► documentarian ◄────────────────┘           │
│                         │                                    │
│                         ▼                                    │
│                  project-manager                             │
│                                                              │
│  plan-andamioscan-integration    tx-loop-guide               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommendations

### 1. Fill Empty Examples Sections

The following skills have empty or partial Examples sections:
- `audit-api-coverage`
- `documentarian`
- `project-manager`

### 2. Consider User-Invocable Entry Points

These skills could benefit from direct user invocation:
- `global-style-checker` - for debugging CSS issues
- `theme-expert` - for design system questions

### 3. Create Missing Skills

The BACKLOG.md suggests these new skills:
- `andamioscan-event-integrator` - for transaction confirmation (High priority, blocked on Event endpoints)
- `component-generator` - scaffold Andamio wrapper components
- `type-auditor` - verify API types are imported from andamio-db-api

### 4. File Cleanup

- ~~`PENDING-TX-PROTECTION.md` in skills root should be moved to `project-manager/` or removed if redundant with `PENDING-TX-WATCHER.md`~~ ✅ Done - merged into `PENDING-TX-WATCHER.md`

---

## Skill Maturity Levels

| Level | Criteria | Skills |
|-------|----------|--------|
| **Production** | Complete instructions, examples, supporting docs | `review-pr`, `review-styling`, `plan-andamioscan-integration` |
| **High** | Complete instructions, good docs, minor gaps | `project-manager`, `documentarian`, `audit-api-coverage`, `theme-expert` |
| **Medium** | Functional but needs refinement | `global-style-checker`, `tx-loop-guide` |
| **Draft** | Incomplete or untested | None |

---

## Quick Reference: When to Use Each Skill

| Task | Skill |
|------|-------|
| Review a pull request | `review-pr` |
| Check styling on a route | `review-styling` |
| Add Andamioscan endpoint | `plan-andamioscan-integration` |
| Update docs after changes | `documentarian` |
| Check project status | `project-manager` |
| Audit API coverage | `audit-api-coverage` |
| Design system questions | `theme-expert` |
| Debug CSS conflicts | `global-style-checker` |
| Test transaction flows | `tx-loop-guide` |
