---
name: getting-started
description: Interactively onboard new developers to all available skills and learning paths.
---

# Getting Started

## Introduction

Welcome to the Andamio T3 App Template! This skill helps new developers discover and learn how to use all available Claude skills effectively.

## Instructions

### 1. Greet the Developer

Start with a warm welcome and explain that you'll help them find the right skills for their goals.

### 2. Ask About Their Intent

Use AskUserQuestion to understand what they want to do:

**Question**: "What brings you here today?"

**Options**:
| Option | Description |
|--------|-------------|
| **Explore** | "I want to understand the codebase" |
| **Build** | "I want to add a feature" |
| **Fix** | "I want to fix a bug or issue" |
| **Review** | "I want to review code/PRs" |
| **Test** | "I want to test transaction flows" |

### 3. Recommend Skills Based on Intent

Based on their answer, recommend the appropriate skills:

#### Explore Mode
"I want to understand the codebase"

Recommended skills:
1. `/design-system reference` - Query component patterns, colors, layouts
2. `/project-manager` - Get project status, sitemap, architecture overview
3. `/audit-api-coverage` - Understand API endpoints and coverage

**Suggested starting point**: "Let me show you the project structure. Run `/project-manager` to see the current status and roadmap."

#### Build Mode
"I want to add a feature"

Recommended skills:
1. `/design-system reference` - Learn UI patterns before building
2. `/audit-api-coverage` - Check API endpoint availability
3. `/typescript-types-expert design` - Design types for new features
4. `/documentarian` - Update docs after implementation

**Suggested starting point**: "Start with `/audit-api-coverage` to see which endpoints are available, then `/design-system reference` for UI patterns."

#### Fix Mode
"I want to fix a bug or issue"

Recommended skills:
1. `/issue-handler` - Route the issue to the right subsystem
2. `/typescript-types-expert audit` - Check for type issues
3. `/design-system diagnose` - Debug CSS/styling conflicts
4. `/transaction-auditor` - Sync schemas if TX-related

**Suggested starting point**: "Describe the issue and I'll help route it. Or run `/issue-handler` to analyze error logs."

#### Review Mode
"I want to review code/PRs"

Recommended skills:
1. `/review-pr` - Comprehensive PR review (delegates automatically)
2. `/design-system review` - Audit styling compliance
3. `/typescript-types-expert audit` - Check type safety
4. `/react-query-auditor` - Audit hook patterns

**Suggested starting point**: "Run `/review-pr` for a full review - it automatically delegates to specialized skills."

#### Test Mode
"I want to test transaction flows"

Recommended skills:
1. `/tx-loop-guide` - Step-by-step transaction testing
2. `/transaction-auditor` - Verify schema alignment
3. `/audit-api-coverage` - Check TX endpoint status

**Suggested starting point**: "Run `/tx-loop-guide` to see the 6 documented transaction loops and start testing."

### 4. Offer Learning Paths

After recommending skills, offer to show curated learning paths:

"Would you like to see a learning path tailored to your role? Options:"
- **New Developer** - Comprehensive onboarding
- **Frontend Focus** - UI, styling, React patterns
- **Transaction Developer** - Blockchain interactions
- **Code Reviewer** - Quality assurance focus
- **Documentation Contributor** - Docs and skill maintenance

See `learning-paths.md` for detailed path content.

### 5. Provide Quick Reference

Point them to `skill-reference.md` for a complete overview of all 11 skills.

## Key Files

| File | Purpose |
|------|---------|
| `skill-reference.md` | Quick reference table of all skills |
| `learning-paths.md` | Curated learning paths by role |

## Output Format

Conversational, friendly, and helpful. Guide the developer through discovery rather than dumping all information at once.

## Example Interaction

**User**: `/getting-started`

**Assistant**:
"Welcome to the Andamio T3 App Template! I'm here to help you discover the right tools for your work.

We have 11 specialized Claude skills covering everything from API integration to transaction testing.

What brings you here today?

1. **Explore** - I want to understand the codebase
2. **Build** - I want to add a feature
3. **Fix** - I want to fix a bug or issue
4. **Review** - I want to review code/PRs
5. **Test** - I want to test transaction flows"

**User**: [selects Build]

**Assistant**:
"Great! For building new features, here's your toolkit:

**Start here:**
- `/audit-api-coverage` - Check which API endpoints are available
- `/design-system reference` - Learn UI patterns and components

**During development:**
- `/typescript-types-expert design` - Design types for your feature
- Use shadcn/ui components from `~/components/ui/`

**After implementation:**
- `/documentarian` - Update related documentation

Would you like to see a detailed learning path for frontend development, or should we dive into a specific skill?"
