# Skills Audit Report

> **Last Updated**: February 13, 2026

## Summary

| Skill | Status | Maturity | Supporting Files | Notes |
|-------|--------|----------|------------------|-------|
| `getting-started` | ✅ Active | Medium | 3 files | Interactive onboarding and skill discovery |
| `hooks-architect` | ✅ Active | High | 4 files | 5 modes (learn, implement, audit, extract, reference) |
| `design-system` | ✅ Active | High | 12 files | 3 modes (review, diagnose, reference) |
| `audit-api-coverage` | ✅ Active | High | 8 files + script | Unified Gateway (108 endpoints) |
| `typescript-types-expert` | ✅ Active | High | 8 files | 3 modes (audit, fix, design) |
| `project-manager` | ✅ Active | High | 6 files | Project tracking, status, roadmap |
| `review-pr` | ✅ Active | High | 3 files | Orchestrates other skills |
| `documentarian` | ✅ Active | High | 2 files | Active backlog |
| `transaction-auditor` | ✅ Active | Medium | 3 files | Sync TX schemas with Gateway API |
| `tx-loop-guide` | ✅ Active | Medium | 3 files | Guide testers through TX loops |
| `react-query-auditor` | ✅ Active | Medium | 2 files | Cache and query pattern auditing |
| `issue-handler` | ✅ Active | Medium | 2 files | Issue routing across repos |
| `product-iteration` | ✅ Active | Medium | 4 files | Full product feedback cycle (Test → Design → Ship) |
| `bootstrap-skill` | ✅ Active | Medium | 1 file | Meta-skill: scaffold and register new skills |
| `ship` | ✅ Active | Medium | 1 file | Full shipping workflow |
| `qa` | ✅ Active | Medium | 3 files | Route-level QA audit |
| `ux-readiness` | ✅ Active | Medium | 2 files | Cross-repo UX readiness assessment |
| `sponsored-transactions` | ✅ Active | Medium | 3 files | Fee sponsorship via utxos.dev tank |
| `fix` | ✅ Active | Medium | 1 file | GitHub issue → branch → fix → PR workflow |
| `sync-template` | ✅ Active | Medium | 1 file | Sync app changes to template repo |
| `e2e-testing` | ✅ Active | Medium | 12 files | Playwright E2E testing with agents |
| `test-wallet-setup` | ✅ Active | Medium | 1 file | Set up test wallets for E2E testing |
| `compound` | ✅ Active | Low | 1 file | Capture session learnings into skills/CLAUDE.md/memory |
| `mesh-expert` | 📦 External | N/A | 1 file (readme) | Third-party Mesh SDK AI skills |

**Total**: 23 Andamio skills + 1 external skill

---

## Skill Details

### 1. `getting-started` ✅

**Purpose**: Interactive onboarding for new developers

**Entry Point**: Best first skill for newcomers. Guides to appropriate skill based on intent.

**Files** (3): `SKILL.md`, `skill-reference.md`, `learning-paths.md`

---

### 2. `hooks-architect` ✅

**Purpose**: Guide developers through creating, using, and auditing API hooks

**Modes**:
1. `learn` - Walk through hook rules and patterns
2. `implement` - Step-by-step hook creation
3. `audit` - Check hooks for compliance
4. `extract` - Move direct API calls into hooks
5. `reference` - Find existing hooks

**Files** (4): `SKILL.md`, `HOOK-RULES.md`, `HOOK-REFERENCE.md`, `PROGRESS.md`

---

### 3. `design-system` ✅

**Purpose**: Unified design system expertise with 3 modes

**Modes**:
1. `review` - Audit routes for styling compliance
2. `diagnose` - Debug CSS specificity conflicts
3. `reference` - Query design patterns

**Files** (11): `style-rules.md`, `semantic-colors.md`, `responsive-design.md`, `icon-system.md`, `extracted-components.md`, `global-overrides.md`, `layouts.md`, `spacing.md`, `components.md`, `cannot-customize.md`, `route-reference.md`

---

### 4. `audit-api-coverage` ✅

**Purpose**: Audit API coverage for the Unified Andamio API Gateway

**Files**:
| File | Purpose | Status |
|------|---------|--------|
| `SKILL.md` | Main instructions | ✅ Current |
| `scripts/audit-coverage.ts` | Automated scanner | ✅ Active |
| `unified-api-endpoints.md` | Gateway endpoints reference | ✅ Current |
| `api-coverage.md` | Implementation status | ✅ Current |
| `tx-state-machine.md` | TX state machine docs | ✅ Current |
| `tx-hooks-audit.md` | TX hook patterns | ✅ Current |
| `api-hooks-audit.md` | API hook patterns | ✅ Current |
| `HOOKS-STATUS.md` | Hook migration tracking | ✅ Current |
| `archive/` | Historical plans (API-HOOKS-CLEANUP-PLAN, HOOK-ORGANIZATION-PLAN) | Archive |

---

### 5. `typescript-types-expert` ✅

**Purpose**: Audit, fix, and design TypeScript types (3 modes)

**Files** (8): `SKILL.md`, `type-architecture.md`, `type-colocation.md`, `audit-rules.md`, `generated-types.md`, `zod-schemas.md`, `anti-patterns.md`, `checklist.md`

---

### 6. `project-manager` ✅

**Purpose**: Track project status, coordinate skills

**Files** (6): `SKILL.md`, `STATUS.md`, `ROADMAP.md`, `SITEMAP.md`, `ROLES-AND-ROUTES.md`, `TRANSACTION-COMPONENTS.md`

*17 historical files (archived sessions, migration guides, completed plans) removed in Feb 7 cleanup.*

---

### 7. `review-pr` ✅

**Purpose**: Comprehensive PR review with skill delegation

**Delegates to**: `design-system`, `hooks-architect`, `typescript-types-expert`, `documentarian`

**Files** (3): `SKILL.md`, `review-checklists.md`, `native-capabilities.md`

---

### 8. `documentarian` ✅

**Purpose**: Update docs after codebase changes

**Delegates to**: `transaction-auditor`, `hooks-architect`, `design-system`, `project-manager`

**Files** (2): `SKILL.md`, `BACKLOG.md`

---

### 9. `transaction-auditor` ✅

**Purpose**: Keep TX schemas in sync with Gateway API spec

**Syncs**:
- `src/config/transaction-schemas.ts`
- `src/config/transaction-ui.ts`
- `src/hooks/tx/use-tx-watcher.ts`

**Files** (1): `SKILL.md`

---

### 10. `tx-loop-guide` ✅

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

### 11. `react-query-auditor` ✅

**Purpose**: Audit React Query hooks for type safety and cache management

**Focus**: Cache invalidation, stale data debugging, query key matching, UX update issues

**Files** (2): `SKILL.md`, `react-query-best-practices.md`

---

### 12. `issue-handler` ✅

**Purpose**: View error logs and route issues to appropriate repos

**Routes through**: `T3 App Template → Andamio API Gateway → Backend subsystems`

**Files** (1): `SKILL.md`

---

### 13. `product-iteration` ✅

**Purpose**: Orchestrate the full product iteration cycle

**Phases**: Test → Design → Triage → Ship

**Files** (4): `SKILL.md`, `templates/feedback-digest.md`, `templates/design-proposal.md`, `templates/backlog-item.md`

---

### 14. `bootstrap-skill` ✅

**Purpose**: Meta-skill that scaffolds new Claude skills with consistent structure, registers them across SKILLS-AUDIT.md, CLAUDE.md, and getting-started, and ensures proper integration with the skill ecosystem.

**Files** (1): `SKILL.md`

---

### 15. `ship` ✅

**Purpose**: Full shipping workflow — version bump, docs check, commit, PR, merge, cleanup

**Commands**:
1. `/ship` - Full workflow (all phases)
2. `/ship version` - Bump version only
3. `/ship pr` - Push + create PR only
4. `/ship merge` - Merge existing PR + clean up

**Files** (1): `SKILL.md`

---

### 16. `qa` ✅

**Purpose**: Route-level QA auditing — systematically check individual routes for production readiness

**Process**: Choose route → Collect component tree → Run checklist (6 categories, 30 rules) → Report with severity → Fix

**Delegates to**: `design-system review`, `hooks-architect audit`, `react-query-auditor`, `typescript-types-expert audit`

**Files** (3): `SKILL.md`, `checklist.md`, `best-practices.md`

---

### 17. `ux-readiness` ✅

**Purpose**: Assess whether app flows are ready to document in user-facing guides. Works cross-repo with `guide-pipeline` in the docs repo.

**Commands**: `status`, `assess <id>`, `sync`, `signal <id> ready|blocked`

**Cross-Repo**: Reads/writes `guide-tracker.json` in `~/projects/01-projects/andamio-docs/.claude/skills/guide-pipeline/`

**Files** (2): `SKILL.md`, `assessment-criteria.md`

---

### 18. `sponsored-transactions` ✅

**Purpose**: Guide implementation of fee-sponsored transactions using `@utxos/sdk` sponsorship tank

**Status**: Medium maturity — Phase 1 (migration sponsorship) complete on `sponsored-migration` branch

**Foundation**: Jingles' implementation provides reference pattern:
- `src/lib/utxos-sdk.ts` — Server-side SDK singleton
- `src/hooks/tx/use-sponsored-transaction.ts` — Client hook
- `src/app/api/sponsor-migrate/route.ts` — API route
- `.claude/_plan/sponsorship.md` — 582-line implementation plan

**Files** (3): `SKILL.md`, `env-variables.md`, `ops-setup.md`

---

### 19. `fix` ✅

**Purpose**: Open a branch, investigate, fix, and hand off to `/review-pr`

**Commands**: `/fix`, `/fix 42` (with issue number)

**Files** (1): `SKILL.md`

---

### 20. `sync-template` ✅

**Purpose**: Sync changes from andamio-app-v2 to andamio-app-template via rebase workflow

**Note**: Must be run from the template repo. Maintains atomic divergence commits.

**Files** (1): `SKILL.md`

---

### 21. `e2e-testing` ✅

**Purpose**: AI-powered E2E testing orchestrator using Playwright MCP

**Commands**: `/e2e-testing run`, `/e2e-testing auth`, `/e2e-testing transactions`, `/e2e-testing courses`

**Files** (12): `SKILL.md`, agent configs, flow definitions, selector registry

---

### 22. `test-wallet-setup` ✅

**Purpose**: Set up isolated test wallets for E2E testing with real Cardano transactions

**Use when**: Setting up Blockfrost API, generating/funding test wallets, minting Access Tokens

**Files** (1): `SKILL.md`

---

### 23. `compound` ✅

**Purpose**: Capture session learnings into skill files, CLAUDE.md, and auto memory (step 9 of development pipeline)

**Workflow**: Scan session → classify learnings → present plan → apply changes → verify

**Integration**: Runs after review/verify, before `ship` or `finishing-a-development-branch`. Complements `claude-md-management:revise-claude-md` (which does full audits; compound does targeted updates).

**Files** (1): `SKILL.md`

---

### 24. `mesh-expert` 📦 (External)

**Purpose**: Third-party Mesh SDK AI skills for Cardano wallet/transaction integration

**Note**: Copy of [MeshJS/Mesh-AI](https://github.com/MeshJS/Mesh-AI). Not Andamio-specific.

**Files** (1): `readme.md`

---

## Skill Relationships

```
┌─────────────────────────────────────────────────────────────┐
│                    User-Invocable Skills                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  getting-started ─────────► (all skills via guidance)        │
│                                                               │
│  review-pr ────────────► design-system (review mode)         │
│      │                                                        │
│      ├──────────► hooks-architect (audit mode)               │
│      │                                                        │
│      ├──────────► typescript-types-expert (audit mode)       │
│      │                                                        │
│      └──────────► documentarian                              │
│                         │                                     │
│                         ├──► project-manager                 │
│                         ├──► transaction-auditor             │
│                         └──► hooks-architect                 │
│                                                               │
│  product-iteration ──► tx-loop-guide (testing phase)         │
│                    └──► project-manager (backlog phase)       │
│                                                               │
│  bootstrap-skill ◄──── documentarian (BACKLOG.md suggestions) │
│      │                                                        │
│      ├──────────► getting-started (registers new skills)     │
│      └──────────► SKILLS-AUDIT.md + CLAUDE.md (registration) │
│                                                               │
│  ship ────────────────► documentarian (docs check)             │
│      └──────────► (commit, PR, merge workflow)                │
│                                                               │
│  qa ─────────────────► design-system (review mode)             │
│      ├──────────► hooks-architect (audit mode)               │
│      ├──────────► react-query-auditor                        │
│      └──────────► typescript-types-expert (audit mode)       │
│                                                               │
│  ux-readiness ──────────► guide-tracker.json (docs repo)       │
│      └──────────► gh issues (blocker/friction tracking)       │
│                                                               │
│  sponsored-transactions ──► transaction-auditor (TX lifecycle) │
│      └──────────► hooks-architect (useTransaction updates)   │
│                                                               │
│  compound ────────────► skill files (targeted updates)         │
│      ├──────────► CLAUDE.md (new rules)                      │
│      └──────────► memory/*.md (cross-session patterns)       │
│                                                               │
│  Standalone skills:                                           │
│    transaction-auditor    issue-handler                      │
│    tx-loop-guide          mesh-expert (external)             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Audit History

| Date | Action |
|------|--------|
| 2026-02-20 | Added `compound` skill (session learning capture — pipeline step 9). Also updated `review-pr` with Batch Review section. Count: 23. |
| 2026-02-13 | **Full skills cleanup**: Removed migration tracking, updated stale dates/phases, added missing skills (fix, sync-template, e2e-testing, test-wallet-setup). Fixed review-pr references to design-system. Count: 22. |
| 2026-02-12 | Added `sponsored-transactions` skill (fee sponsorship via utxos.dev tank). 1 file: SKILL.md. Count: 18. |
| 2026-02-08 | Added `ux-readiness` skill (cross-repo UX readiness for guide pipeline). 2 files: SKILL.md, assessment-criteria.md. Partner: `guide-pipeline` in docs repo. Count: 17. |
| 2026-02-05 | Added `qa` skill (route-level QA auditing). 3 files: SKILL.md, checklist.md, best-practices.md. Registered in getting-started. Count: 16. |
| 2026-02-01 | Full audit: Added hooks-architect, product-iteration, mesh-expert. Fixed stale refs (andamioscan-events, use-event-confirmation, old file paths). Updated skill count to 14. |
| 2026-01-24 | Added getting-started, typescript-types-expert skills. Count was 11. |
| 2026-01-14 | Added transaction-auditor, issue-handler, react-query-auditor. |
