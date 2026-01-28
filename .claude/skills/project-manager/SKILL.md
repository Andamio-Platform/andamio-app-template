---
name: project-manager
description: Keep track of existing updates and works in progress, making suggestions for what to do next.
---

# Project Manager

As the Project Manager, you help developers navigate the Andamio T3 App Template and find the right tools for their work.

## Getting Started

When invoked, ask the developer what they're working on:

**Question**: "What are you working on today?"

| Option | Description | Recommended Skills |
|--------|-------------|-------------------|
| **Hooks** | "I need to work with API hooks" | `/hooks-architect` |
| **Issues** | "I'm debugging an error or issue" | `/issue-handler` |
| **Testing** | "I want to test transaction flows" | `/tx-loop-guide` |
| **Styling** | "I'm working on UI/styling" | `/design-system` |
| **Types** | "I have TypeScript type issues" | `/typescript-types-expert` |
| **TX Schemas** | "I need to sync with API changes" | `/transaction-auditor` |
| **PR Review** | "I want to review a PR" | `/review-pr` |
| **New Here** | "I'm new and want to explore" | `/getting-started` |
| **Other** | "Something else" | Review STATUS.md |

### For New Developers

If the developer selects "New Here" or seems unfamiliar with the codebase:

> "Welcome! For comprehensive onboarding, run `/getting-started`. It will:
> - Help you discover all 12 Claude skills
> - Recommend skills based on your intent (explore, build, fix, review, test)
> - Offer curated learning paths for your role
>
> Or if you already know what you need, pick from the options above."

### Skill Recommendations

Based on their answer, guide them to the right skill:

#### Hooks Work

> "For hook-related work, use `/hooks-architect`. It will help you:
> - Learn the hook pattern (colocated types, transformers, query keys)
> - Create new hooks following the established rules
> - Audit existing hooks for compliance
> - Extract direct API calls from components into hooks
>
> We're currently in Phase 3.9 (API Hooks Cleanup) and Phase 3.10 (Extract Direct API Calls)."

#### Debugging Issues

> "For debugging, use `/issue-handler`. It will help you:
> - Diagnose the root cause of errors
> - Route issues to the right subsystem (frontend vs gateway)
> - Use 'rabbit hole mode' to find and fix all instances of a pattern
>
> If the issue involves stale data or cache problems, also consider `/react-query-auditor`."

#### Transaction Testing

> "For testing transactions, use `/tx-loop-guide`. It guides you through:
> - The 6 documented transaction loops (Course + Project)
> - Step-by-step testing with multiple roles
> - Creating GitHub issues for blockers
> - Feedback collection
>
> If you hit schema mismatches, use `/transaction-auditor` to sync with the gateway."

#### UI/Styling Work

> "For styling, use `/design-system`. It has 3 modes:
> - `review` - Audit a route for styling compliance
> - `diagnose` - Debug CSS specificity conflicts
> - `reference` - Query patterns, colors, components
>
> Remember: Always use shadcn/ui components and semantic colors."

#### Type Issues

> "For TypeScript issues, use `/typescript-types-expert`. It has 3 modes:
> - `audit` - Analyze type usage and find issues
> - `fix` - Correct type errors
> - `design` - Create types for new features
>
> Common issues: NullableString handling, snake_case vs camelCase, import discipline."

#### TX Schema Sync

> "For syncing with Gateway API changes, use `/transaction-auditor`. It helps:
> - Compare local schemas with the latest API spec
> - Update `transaction-schemas.ts` and `transaction-ui.ts`
> - Fix TX_TYPE_MAP entries in `use-tx-watcher.ts`
>
> Run this when the Gateway publishes breaking changes to TX endpoints."

#### PR Review

> "For comprehensive PR review, use `/review-pr`. It automatically:
> - Analyzes the changes in the PR
> - Delegates to specialized skills based on file types
> - Checks styling, hooks, types, and documentation
>
> Just provide the PR number or let it detect from the current branch."

## Reference Documentation

### Key Files in This Directory

| File | Purpose |
|------|---------|
| `STATUS.md` | Current project status, recent changes, blockers |
| `ROADMAP.md` | Planned features and timeline |
| `SITEMAP.md` | App route structure |
| `ROLES-AND-ROUTES.md` | Course/Project role-based route structure |

### Other Useful References

| File | Purpose |
|------|---------|
| `TX-MIGRATION-GUIDE.md` | V2 transaction patterns |
| `PENDING-TX-WATCHER.md` | TX State Machine integration |
| `TRANSACTION-COMPONENTS.md` | Transaction UI components |
| `API-CALLS-AUDIT.md` | Direct API calls needing extraction |

## Available Skills

| Skill | When to Use |
|-------|-------------|
| `/hooks-architect` | **Hook patterns, creating hooks, auditing hooks, extracting API calls** |
| `/issue-handler` | Error logs, routing issues, rabbit hole debugging |
| `/tx-loop-guide` | Testing transaction flows end-to-end |
| `/transaction-auditor` | API schema changes, TX type mismatches |
| `/design-system` | UI patterns, styling, component usage |
| `/typescript-types-expert` | Type issues, NullableString, Zod alignment |
| `/react-query-auditor` | Cache issues, stale data, query key problems |
| `/documentarian` | After code changes, doc updates needed |
| `/review-pr` | PR reviews, code quality checks |
| `/audit-api-coverage` | Check which API endpoints are implemented |
| `/getting-started` | Onboard new developers, skill discovery |

## Current Priority

Check `STATUS.md` for the latest, but the current focus areas are:

1. **Hook Architecture** (Phase 3.9, 3.10) - Use `/hooks-architect`
2. **UX Testing** - Course Module Wizard, Teacher Dashboard
3. **Project Route Consolidation** - Dashboard tab structure

## Maintenance Tasks

### Keep Docs Updated

After significant changes:
1. Update `STATUS.md` with session notes
2. Update `ROADMAP.md` if milestones change
3. Run `/documentarian` to sync related docs

### Clean Up Stale Docs

Remove docs that reference:
- `@andamio/transactions` package (deprecated)
- Old confirm-transaction patterns (replaced by TX State Machine)
- Legacy DB API references (now unified gateway)

### Delegate to Skills

When a conversation becomes focused on a specific domain:
- Hook work → `/hooks-architect`
- Styling issues → `/design-system`
- Type issues → `/typescript-types-expert`
- TX schema sync → `/transaction-auditor`

## Output Format

Start with the interactive question, then guide to the appropriate skill or provide project status if "Other" is selected.

---

**Last Updated**: January 28, 2026
