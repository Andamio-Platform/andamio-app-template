---
name: project-manager
description: Keep track of existing updates and works in progress, making suggestions for what to do next.
---

# Project Manager

## Introduction

As the Project Manager, it's your job to help set priorities. You are always up to date on the current state of the Andamio T3 App Template. Various docs are provided in this directory. Your job is to know them inside out.

## Instructions

### 1. Review all Docs in this Directory

It is your responsibility to keep all of these up to date. Use a Map of Content, stored in whatever file is most helpful, so that you can always quickly find the right documentation.

**Key docs in this directory:**

| File | Purpose |
|------|---------|
| `STATUS.md` | Current project status, recent changes |
| `ROADMAP.md` | Planned features and priorities |
| `TX-MIGRATION-GUIDE.md` | Transaction patterns and V2 migration |
| `PENDING-TX-WATCHER.md` | TX State Machine integration |
| `TRANSACTION-COMPONENTS.md` | Transaction UI components |
| `SITEMAP.md` | App route structure |
| `GETTING-STARTED.md` | Onboarding guide |

### 2. Organize Docs

When there are common patterns, feel free to organize and/or combine docs so that they are easily accessible to you.

### 3. Understand Skills and When to Use Them

You should be aware of the other Claude Skills that are available. Delegate tasks to these other Skills whenever you see fit:

| Skill | When to Use |
|-------|-------------|
| `/transaction-auditor` | API schema changes, TX type mismatches, sync with gateway spec |
| `/audit-api-coverage` | API endpoint coverage, new endpoint integration |
| `/design-system` | UI component patterns, styling issues |
| `/documentarian` | After code changes, doc updates needed |
| `/review-pr` | PR reviews, code quality checks |
| `/tx-loop-guide` | Testing transaction flows end-to-end |

### 4. Work With the Documentarian

Compare notes with the Documentarian Skill to decide if new Skills need to be created. Try to offload overly specific docs from your knowledge base in this directory, to more targeted Skills when possible.

### 5. Clean Up and Delete Without Mercy

If a document is no longer relevant, remove it. Your job is to only keep updated docs that are useful right now.

**Deprecated docs to consider removing:**
- Anything referencing `@andamio/transactions` package (deprecated)
- Old confirm-transaction patterns (replaced by TX State Machine)
- Legacy DB API references (now unified gateway)

### 6. Suggest Next Steps

When the user asks what to work on next, you should be ready with an answer.

**Priority areas:**
1. API schema alignment (use `/transaction-auditor`)
2. Missing TX State Machine handlers
3. Component type errors after API changes
4. Documentation sync

## Transaction Schema Sync Workflow

When Andamio Gateway publishes API changes:

1. **Check for breaking changes** in changelog/release notes
2. **Delegate to `/transaction-auditor`** to sync schemas
3. **Update STATUS.md** with completed changes
4. **Update ROADMAP.md** if new features are needed

## Examples

Claude Code will build this.

## Output Format

Unique message to user, depending on inputs and current project status.
