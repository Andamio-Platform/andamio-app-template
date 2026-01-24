# Learning Paths

> Curated skill sequences for different developer roles.

## Overview

Each learning path is designed to build knowledge progressively, starting with foundational skills and advancing to specialized ones.

---

## 1. New Developer Path

**Goal**: Comprehensive onboarding to the Andamio T3 App Template

**Duration**: Full exploration

### Step 1: Understand the Project
- Run `/project-manager` to see current status and roadmap
- Review `SITEMAP.md` for route structure
- Read `.claude/CLAUDE.md` for coding conventions

### Step 2: Learn the Design System
- Run `/design-system reference` to understand:
  - Semantic colors (never use hardcoded colors)
  - Component library (shadcn/ui)
  - Icon system (semantic naming)
  - Responsive patterns

### Step 3: Understand the API
- Run `/audit-api-coverage` to see:
  - Available endpoints (108 total)
  - Implementation coverage (63%)
  - Endpoint naming patterns

### Step 4: Learn Type Safety
- Run `/typescript-types-expert audit` to understand:
  - Generated types from OpenAPI
  - NullableString handling
  - Import discipline

### Step 5: Practice with a Feature
- Pick a small feature from the roadmap
- Use skills learned to implement it
- Run `/documentarian` after implementation

---

## 2. Frontend Focus Path

**Goal**: Master UI development in this codebase

**Skills**: Design system, components, styling

### Step 1: Master the Design System
```
/design-system reference
```
Key topics:
- `style-rules.md` - The 4 critical rules
- `semantic-colors.md` - Full color reference
- `components.md` - shadcn/ui usage

### Step 2: Learn Component Patterns
Focus on:
- `src/components/andamio/` - Custom Andamio components
- `src/components/ui/` - shadcn/ui components
- `src/components/icons/` - Semantic icon system

### Step 3: Understand Responsive Design
```
/design-system reference responsive
```
Key topics:
- Breakpoint definitions
- Mobile-first patterns
- Common responsive utilities

### Step 4: Type Your Components
```
/typescript-types-expert design
```
Learn:
- Using types from `~/types/ui`
- Component prop typing
- Event handler typing

### Step 5: Audit React Query Hooks
```
/react-query-auditor
```
Understand:
- Query key patterns
- Cache management
- Optimistic updates

---

## 3. Transaction Developer Path

**Goal**: Master Cardano transaction integration

**Skills**: TX loops, schema sync, API coverage

### Step 1: Understand TX Architecture
- Read `src/config/transaction-schemas.ts`
- Read `src/config/transaction-ui.ts`
- Review `src/hooks/use-tx-watcher.ts`

### Step 2: Learn TX State Machine
```
/audit-api-coverage
```
Read: `tx-state-machine.md`

The flow:
1. Build TX (Gateway API)
2. Sign TX (Mesh SDK)
3. Submit TX (Gateway API)
4. Poll status (Gateway API)

### Step 3: Practice TX Loops
```
/tx-loop-guide
```
Start with:
1. **Onboarding** (1 tx) - Mint access token
2. **Earn a Credential** (3 tx) - Full learning flow
3. **Create and Publish Course** (2 tx) - Course management

### Step 4: Sync with API Changes
```
/transaction-auditor
```
When Gateway publishes changes:
- Compare schemas
- Update TX_TYPE_MAP
- Fix component errors

### Step 5: Debug TX Issues
```
/issue-handler
```
Route issues through the stack:
- T3 App Template
- Andamio API Gateway
- Backend subsystems

---

## 4. Code Reviewer Path

**Goal**: Effectively review PRs in this codebase

**Skills**: PR review, design system, types

### Step 1: Learn Review Process
```
/review-pr
```
Understand:
- Automatic skill delegation
- Review checklists
- What to check manually

### Step 2: Know the Design System Rules
```
/design-system reference
```
Focus on:
- The 4 critical styling rules
- Common violations
- How to fix them

### Step 3: Understand Type Expectations
```
/typescript-types-expert audit
```
Learn:
- Generated type usage
- NullableString handling
- Import discipline

### Step 4: Check React Query Patterns
```
/react-query-auditor
```
Verify:
- Proper queryKey usage
- Type safety in queries
- Cache invalidation patterns

### Step 5: Verify Documentation
```
/documentarian
```
Ensure:
- CHANGELOG updated
- Skill files updated if relevant
- API coverage docs current

---

## 5. Documentation Contributor Path

**Goal**: Maintain and improve documentation

**Skills**: Documentarian, project manager, skill audit

### Step 1: Understand Doc Structure
```
/project-manager
```
Key locations:
- `.claude/CLAUDE.md` - Main project guidance
- `.claude/skills/` - Skill documentation
- `CHANGELOG.md` - Version history

### Step 2: Learn the Doc Workflow
```
/documentarian
```
Process:
1. Review git changes
2. Search for related docs
3. Update existing docs
4. Create new docs if needed
5. Delegate to specialized skills

### Step 3: Audit Skills
Read: `.claude/skills/SKILLS-AUDIT.md`

Understand:
- Which skills exist (11 total)
- Maturity levels
- Supporting files

### Step 4: Use Specialized Skills
Delegate documentation to:
- `/transaction-auditor` - TX schema docs
- `/audit-api-coverage` - API docs
- `/design-system reference` - Styling docs
- `/project-manager` - Status docs

### Step 5: Suggest Improvements
Review: `.claude/skills/documentarian/BACKLOG.md`

Contribute:
- New skill suggestions
- Doc improvement ideas
- Process improvements

---

## Path Comparison

| Path | Primary Skills | Best For |
|------|---------------|----------|
| New Developer | project-manager, design-system, audit-api-coverage | Complete onboarding |
| Frontend Focus | design-system, typescript-types-expert, react-query-auditor | UI development |
| Transaction Developer | tx-loop-guide, transaction-auditor, audit-api-coverage | Blockchain integration |
| Code Reviewer | review-pr, design-system, typescript-types-expert | Quality assurance |
| Documentation | documentarian, project-manager | Docs maintenance |

---

## Getting Help

If you're unsure which path to take, run `/getting-started` and answer the intent questions. The skill will guide you to the right resources.
