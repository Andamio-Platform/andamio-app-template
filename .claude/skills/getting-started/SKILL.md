---
name: getting-started
description: Interactively onboard new developers to all available skills and learning paths.
---

# Getting Started

Welcome to the Andamio T3 App Template! This skill helps developers discover and learn how to use all 13 available Claude skills.

## Instructions

### 1. Greet the Developer

Start with a warm welcome and explain that you'll help them find the right skills for their goals.

### 2. Ask About Their Intent

Use AskUserQuestion to understand what they want to do:

**Question**: "What brings you here today?"

| Option | Description |
|--------|-------------|
| **Explore** | "I want to understand the codebase" |
| **Build** | "I want to add a feature" |
| **Fix** | "I want to fix a bug or issue" |
| **Review** | "I want to review code/PRs" |
| **Test** | "I want to test transaction flows" |
| **Hooks** | "I want to work with API hooks" |

### 3. Recommend Skills Based on Intent

Based on their answer, recommend the appropriate skills:

#### Explore Mode
"I want to understand the codebase"

Recommended skills:
1. `/project-manager` - Get project status, sitemap, architecture overview
2. `/design-system reference` - Query component patterns, colors, layouts
3. `/hooks-architect reference` - See all API hooks and patterns
4. `/audit-api-coverage` - Understand API endpoints and coverage

**Suggested starting point**: "Run `/project-manager` to see the current status and roadmap, then explore specific areas."

#### Build Mode
"I want to add a feature"

Recommended skills:
1. `/hooks-architect` - Create or extend API hooks
2. `/design-system reference` - Learn UI patterns before building
3. `/audit-api-coverage` - Check API endpoint availability
4. `/typescript-types-expert design` - Design types for new features
5. `/documentarian` - Update docs after implementation

**Suggested starting point**: "Start with `/audit-api-coverage` to check endpoints, then `/hooks-architect` to create hooks, and `/design-system reference` for UI patterns."

#### Fix Mode
"I want to fix a bug or issue"

Recommended skills:
1. `/issue-handler` - Route the issue to the right subsystem
2. `/hooks-architect audit` - Check for hook pattern issues
3. `/typescript-types-expert audit` - Check for type issues
4. `/design-system diagnose` - Debug CSS/styling conflicts
5. `/react-query-auditor` - Check for cache/stale data issues

**Suggested starting point**: "Describe the issue and I'll help route it. Or run `/issue-handler` to analyze error logs."

#### Review Mode
"I want to review code/PRs"

Recommended skills:
1. `/review-pr` - Comprehensive PR review (delegates automatically)
2. `/hooks-architect audit` - Audit hook patterns
3. `/design-system review` - Audit styling compliance
4. `/typescript-types-expert audit` - Check type safety
5. `/react-query-auditor` - Audit cache patterns

**Suggested starting point**: "Run `/review-pr` for a full review - it automatically delegates to specialized skills."

#### Test Mode
"I want to test transaction flows"

Recommended skills:
1. `/tx-loop-guide` - Step-by-step transaction testing
2. `/transaction-auditor` - Verify schema alignment
3. `/audit-api-coverage` - Check TX endpoint status

**Suggested starting point**: "Run `/tx-loop-guide` to see the 6 documented transaction loops and start testing."

#### Hooks Mode
"I want to work with API hooks"

Recommended skills:
1. `/hooks-architect` - The primary skill for all hook work

**Modes available**:
| Mode | Command | Use Case |
|------|---------|----------|
| Learn | `/hooks-architect learn` | Understand the hook pattern |
| Implement | `/hooks-architect implement` | Create a new hook |
| Audit | `/hooks-architect audit` | Check existing hooks |
| Extract | `/hooks-architect extract` | Move API calls into hooks |
| Reference | `/hooks-architect reference` | Find existing hooks |

**Suggested starting point**: "Run `/hooks-architect learn` to understand the colocated types pattern, then `/hooks-architect reference` to see all existing hooks."

### 4. Offer Learning Paths

After recommending skills, offer to show curated learning paths:

"Would you like to see a learning path tailored to your role?"

| Path | Best For |
|------|----------|
| **New Developer** | Comprehensive onboarding |
| **Frontend Focus** | UI, styling, React patterns |
| **API Integration** | Hooks, data fetching, types |
| **Transaction Developer** | Blockchain interactions |
| **Code Reviewer** | Quality assurance focus |

See `learning-paths.md` for detailed path content.

### 5. Provide Quick Reference

Point them to `skill-reference.md` for a complete overview of all 12 skills.

## All 13 Skills at a Glance

| Skill | Purpose |
|-------|---------|
| `/bootstrap-skill` | Scaffold and register new Claude skills |
| `/getting-started` | Onboarding and skill discovery |
| `/hooks-architect` | Hook patterns, creation, auditing |
| `/design-system` | UI patterns, styling, components |
| `/audit-api-coverage` | API endpoint coverage tracking |
| `/typescript-types-expert` | Type safety and architecture |
| `/project-manager` | Project status and roadmap |
| `/review-pr` | Comprehensive PR review |
| `/documentarian` | Documentation maintenance |
| `/transaction-auditor` | TX schema sync with API |
| `/tx-loop-guide` | Transaction flow testing |
| `/react-query-auditor` | React Query patterns and cache |
| `/issue-handler` | Error routing across repos |
| `/product-iteration` | Full product feedback cycle (Test → Design → Ship) |

## Key Files

| File | Purpose |
|------|---------|
| `skill-reference.md` | Detailed reference for all 12 skills |
| `learning-paths.md` | Curated learning paths by role |

## Output Format

Conversational, friendly, and helpful. Guide the developer through discovery rather than dumping all information at once.

## Example Interaction

**User**: `/getting-started`

**Assistant**:
"Welcome to the Andamio T3 App Template! I'm here to help you discover the right tools for your work.

We have 12 specialized Claude skills covering everything from API integration to transaction testing.

What brings you here today?

1. **Explore** - I want to understand the codebase
2. **Build** - I want to add a feature
3. **Fix** - I want to fix a bug or issue
4. **Review** - I want to review code/PRs
5. **Test** - I want to test transaction flows
6. **Hooks** - I want to work with API hooks"

**User**: [selects Hooks]

**Assistant**:
"For hook work, `/hooks-architect` is your go-to skill. It has 5 modes:

- **Learn** - Understand the colocated types pattern
- **Implement** - Step-by-step guide to create new hooks
- **Audit** - Check existing hooks for pattern compliance
- **Extract** - Move direct API calls into proper hooks
- **Reference** - Find existing hooks and their exports

**Current status**: We're in Phase 3.9 (API Hooks Cleanup) with 6/11 hooks approved, and Phase 3.10 (Extract Direct API Calls) with 50+ calls to migrate.

Would you like to learn the hook pattern first, or jump into implementing a specific hook?"

---

**Last Updated**: February 1, 2026
