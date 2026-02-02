# Skill Quick Reference

> Complete reference for all 13 Claude skills in the Andamio T3 App Template.

## At a Glance

| Skill | Command | Purpose | Modes |
|-------|---------|---------|-------|
| Getting Started | `/getting-started` | Onboarding and skill discovery | Interactive |
| **Hooks Architect** | `/hooks-architect` | **Hook patterns, creation, auditing** | `learn`, `implement`, `audit`, `extract`, `reference` |
| Design System | `/design-system` | UI patterns, styling, components | `review`, `diagnose`, `reference` |
| Audit API Coverage | `/audit-api-coverage` | API endpoint coverage tracking | Single |
| TypeScript Types Expert | `/typescript-types-expert` | Type safety and architecture | `audit`, `fix`, `design` |
| Project Manager | `/project-manager` | Project status and roadmap | Interactive |
| Review PR | `/review-pr` | Comprehensive PR review | Single (delegates) |
| Documentarian | `/documentarian` | Documentation maintenance | Single |
| Transaction Auditor | `/transaction-auditor` | TX schema sync with API | Single |
| TX Loop Guide | `/tx-loop-guide` | Transaction flow testing | Interactive |
| React Query Auditor | `/react-query-auditor` | Hook patterns and cache | Single |
| Issue Handler | `/issue-handler` | Error routing across repos | Single |
| Product Iteration | `/product-iteration` | Full product feedback cycle | 4 phases (Test, Design, Triage, Ship) |

---

## Detailed Reference

### `/getting-started`

**Purpose**: Onboard new developers interactively

**When to use**:
- First time working with this codebase
- Need to discover which skill to use
- Want a guided introduction

**Output**: Conversation-based guidance to appropriate skills

---

### `/hooks-architect`

**Purpose**: Guide developers through creating, using, and auditing API hooks

**Modes**:
| Mode | Command | Use Case |
|------|---------|----------|
| Learn | `/hooks-architect learn` | Understand the hook pattern |
| Implement | `/hooks-architect implement` | Create a new hook |
| Audit | `/hooks-architect audit` | Check existing hooks for compliance |
| Extract | `/hooks-architect extract` | Move direct API calls into hooks |
| Reference | `/hooks-architect reference` | Find existing hooks |

**When to use**:
- Learning how hooks work in this codebase
- Creating new hooks for API endpoints
- Auditing hook quality and patterns
- Extracting direct API calls from components

**Key files** (4):
- `HOOK-RULES.md` - Precise rules for hook structure
- `HOOK-REFERENCE.md` - All existing hooks with exports
- `PROGRESS.md` - Phase 3.9/3.10 tracking

---

### `/design-system`

**Purpose**: UI patterns, styling rules, component usage

**Modes**:
| Mode | Command | Use Case |
|------|---------|----------|
| Review | `/design-system review` | Audit a route for styling compliance |
| Diagnose | `/design-system diagnose` | Debug CSS specificity conflicts |
| Reference | `/design-system reference` | Query patterns (colors, components, layouts) |

**Key files** (11):
- `style-rules.md` - Core styling rules
- `semantic-colors.md` - Color system reference
- `icon-system.md` - Centralized icon usage
- `responsive-design.md` - Breakpoints and patterns
- `components.md` - Component catalog

---

### `/audit-api-coverage`

**Purpose**: Track API endpoint implementation status

**Coverage**: 99 Gateway endpoints, currently ~71% covered

**When to use**:
- Checking if an endpoint is implemented
- Planning API integration work
- Tracking overall coverage

**Key files**:
- `unified-api-endpoints.md` - Full endpoint reference
- `api-coverage.md` - Implementation status

**Note**: For hook patterns and quality, use `/hooks-architect` instead.

---

### `/typescript-types-expert`

**Purpose**: Type safety, architecture, generated types

**Modes**:
| Mode | Command | Use Case |
|------|---------|----------|
| Audit | `/typescript-types-expert audit` | Analyze codebase for type issues |
| Fix | `/typescript-types-expert fix` | Correct type violations |
| Design | `/typescript-types-expert design` | Create types for new features |

**Key files** (8):
- `type-architecture.md` - Type hierarchy
- `generated-types.md` - Working with OpenAPI types
- `zod-schemas.md` - Runtime validation
- `anti-patterns.md` - What NOT to do
- `checklist.md` - Quick reference

---

### `/project-manager`

**Purpose**: Project status, roadmap, coordination

**When to use**:
- Understanding current project state
- Finding what to work on next
- Coordinating between skills

**Key files** (16+):
- `STATUS.md` - Current state
- `ROADMAP.md` - Planned features
- `SITEMAP.md` - Route structure
- `TX-MIGRATION-GUIDE.md` - Transaction patterns

---

### `/review-pr`

**Purpose**: Comprehensive PR review with automatic delegation

**Delegates to**:
- `/design-system review` - For styling changes
- `/hooks-architect audit` - For hook changes
- `/typescript-types-expert audit` - For type changes
- `/documentarian` - For doc updates

**Key files** (3):
- `review-checklists.md` - Review criteria
- `native-capabilities.md` - What Claude can do natively

---

### `/documentarian`

**Purpose**: Update documentation after code changes

**When to use**:
- After implementing a feature
- After fixing a bug
- When docs are out of sync

**Delegates to**:
- `/transaction-auditor` - For TX schema changes
- `/hooks-architect` - For hook changes
- `/design-system reference` - For styling changes
- `/project-manager` - For status updates

---

### `/transaction-auditor`

**Purpose**: Keep TX schemas in sync with Gateway API

**When to use**:
- After Gateway API releases with breaking changes
- When adding new transaction types
- When debugging transaction failures

**Syncs**:
- `src/config/transaction-schemas.ts`
- `src/config/transaction-ui.ts`
- `src/hooks/tx/use-tx-watcher.ts`

---

### `/tx-loop-guide`

**Purpose**: Guide testers through transaction flows

**6 Documented Loops**:
1. Onboarding (1 tx)
2. Earn a Credential (3 tx)
3. Create and Publish Course (2 tx)
4. Assignment Revision Flow (5 tx)
5. Multi-Module Learning Path (N tx)
6. Team Teaching Setup (3 tx)

**When to use**:
- Testing transaction flows end-to-end
- Validating on-chain behavior
- Creating feedback digests

---

### `/react-query-auditor`

**Purpose**: Diagnose and fix React Query runtime issues

**Focus areas**:
1. Cache invalidation (mutations not updating UI)
2. Stale data debugging (data flickers or reverts)
3. UX update issues (UI doesn't reflect changes)
4. Query key matching (invalidation not triggering refetch)

**When to use**:
- UI doesn't update after mutation or TX
- Data appears stale after navigation
- Debugging cache-related bugs

**Relationship with `/hooks-architect`**:
- Structure problems → `/hooks-architect`
- Runtime/cache problems → `/react-query-auditor`

---

### `/issue-handler`

**Purpose**: Route errors to appropriate repos

**Routes through**:
```
T3 App Template → Andamio API Gateway → Backend subsystems
```

**When to use**:
- Encountering errors during development
- Need to determine which repo to file an issue
- Analyzing error logs

---

### `/product-iteration`

**Purpose**: Orchestrate the full product iteration cycle

**Phases**: Test → Design → Triage → Ship

**When to use**:
- Running user testing sessions
- Creating design proposals from feedback
- Managing the product backlog
- Full feedback loop from testing to shipping

---

**Last Updated**: February 1, 2026
