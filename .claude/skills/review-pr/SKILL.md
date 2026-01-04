---
name: review-pr
description: Comprehensive PR review using GitHub CLI, with automatic delegation to specialized skills based on change types.
---

# Review PR

## Introduction

This skill provides comprehensive pull request reviews by analyzing changes, categorizing them, and delegating to specialized skills when appropriate. It uses the GitHub CLI (`gh`) to fetch PR details and provides actionable feedback.

## Instructions

### 1. Get PR Reference

Accept the PR reference in any of these formats:
- PR number: `123`
- PR URL: `https://github.com/owner/repo/pull/123`
- Current branch: If no reference provided, check if the current branch has an open PR

```bash
# If PR number provided
gh pr view <number>

# If no PR provided, check current branch
gh pr view
```

If no PR is found, inform the user and exit.

### 2. Fetch PR Details

Gather comprehensive PR information:

```bash
# Get PR metadata
gh pr view <number> --json title,body,author,state,labels,additions,deletions,changedFiles,baseRefName,headRefName,reviewDecision,reviews

# Get the diff
gh pr diff <number>

# Get list of changed files
gh pr diff <number> --name-only
```

Store this information for analysis.

### 3. Categorize Changes

Analyze the changed files and categorize them:

| Category | File Patterns | Triggers |
|----------|---------------|----------|
| **UI/Styling** | `src/app/**/*.tsx`, `src/components/**/*`, `*.css` | `review-styling` skill |
| **API Integration** | `src/app/api/**/*`, files importing from API, fetch calls | `audit-api-coverage` skill |
| **Documentation** | `*.md`, `.claude/**/*`, `docs/**/*` | `documentarian` skill |
| **Configuration** | `*.config.*`, `.env*`, `package.json` | Manual review notes |
| **Database/Schema** | `prisma/**/*`, `*schema*` | Schema change warnings |
| **Tests** | `*.test.*`, `*.spec.*`, `__tests__/**/*` | Test coverage analysis |
| **Hooks/Utils** | `src/hooks/**/*`, `src/lib/**/*`, `src/utils/**/*` | Logic review |

### 4. Perform Core Review

For ALL PRs, check:

**Code Quality**
- [ ] No TypeScript `any` types introduced
- [ ] No `console.log` statements (except intentional logging)
- [ ] No commented-out code blocks
- [ ] Consistent naming conventions
- [ ] No hardcoded values that should be env vars

**Security**
- [ ] No secrets or credentials in code
- [ ] No exposed API keys
- [ ] Proper input validation on new endpoints
- [ ] No SQL injection vectors
- [ ] No XSS vulnerabilities in rendered content

**Best Practices**
- [ ] Imports are from correct locations (e.g., `andamio-db-api` for types)
- [ ] No duplicate code that should be extracted
- [ ] Error handling is present where needed
- [ ] Loading and error states handled in UI components

### 5. Delegate to Specialized Skills

Based on the categorization in Step 3, invoke relevant skills:

**If UI/Styling changes detected:**
```
Invoke: review-styling
Target: Each changed route/component
Mode: Quick Scan (unless user requests Full Review)
```

**If API changes detected:**
```
Invoke: audit-api-coverage
Focus: New endpoints, changed data fetching patterns
```

**If documentation changes detected OR significant code changes:**
```
Invoke: documentarian
Focus: Ensure docs are updated for new features
```

### 6. Check PR Metadata Quality

Review the PR itself:

**Title**
- Is it descriptive and follows conventions?
- Does it indicate the type of change (feat, fix, refactor, docs)?

**Description**
- Does it explain the "why" not just the "what"?
- Are there testing instructions?
- Are breaking changes documented?

**Labels**
- Are appropriate labels applied?

**Size**
- Warn if PR is too large (>500 lines or >20 files)
- Suggest splitting if multiple unrelated changes

### 7. Generate Review Summary

Compile findings into a structured review:

```markdown
## PR Review: #<number> - <title>

### Overview
- **Author**: @username
- **Branch**: feature-branch → main
- **Changes**: +X / -Y across Z files

### Change Categories
- UI/Styling: X files
- API: X files
- Documentation: X files
- Other: X files

### Delegated Reviews
- [ ] `review-styling`: <status/findings>
- [ ] `audit-api-coverage`: <status/findings>
- [ ] `documentarian`: <status/findings>

### Code Review Findings

#### Must Fix
- [ ] Issue 1 (file:line)
- [ ] Issue 2 (file:line)

#### Suggestions
- [ ] Suggestion 1
- [ ] Suggestion 2

#### Questions
- Question about design decision?

### Verdict
- [ ] **Approve** - Ready to merge
- [ ] **Request Changes** - Issues must be addressed
- [ ] **Comment** - Feedback provided, no blocking issues
```

### 8. Post Review (Optional)

If the user requests, post the review to GitHub:

```bash
# Approve
gh pr review <number> --approve --body "Review body"

# Request changes
gh pr review <number> --request-changes --body "Review body"

# Comment only
gh pr review <number> --comment --body "Review body"
```

## Decision Tree

```
PR Received
    │
    ├── Fetch PR details (gh pr view)
    │
    ├── Get diff (gh pr diff)
    │
    ├── Categorize changes
    │   │
    │   ├── UI changes? ──────────► Invoke review-styling
    │   │
    │   ├── API changes? ─────────► Invoke audit-api-coverage
    │   │
    │   └── Docs or big changes? ─► Invoke documentarian
    │
    ├── Perform core review (security, quality, best practices)
    │
    ├── Check PR metadata (title, description, size)
    │
    └── Generate summary
        │
        └── Post to GitHub? (if requested)
```

## Examples

### Example 1: Simple Bug Fix PR

```bash
> /review-pr 42
```

Output:
```
## PR Review: #42 - Fix: Correct date formatting in course cards

### Overview
- **Author**: @developer
- **Branch**: fix/date-format → main
- **Changes**: +5 / -3 across 1 file

### Change Categories
- UI/Styling: 1 file (src/components/courses/course-card.tsx)

### Delegated Reviews
- [x] `review-styling`: Quick scan - No violations found

### Code Review Findings

#### Must Fix
None

#### Suggestions
- Consider extracting date formatting to a utility function if used elsewhere

### Verdict
- [x] **Approve** - Ready to merge
```

### Example 2: Feature PR with Multiple Change Types

```bash
> /review-pr 87
```

Output:
```
## PR Review: #87 - Feat: Add assignment submission workflow

### Overview
- **Author**: @developer
- **Branch**: feat/assignment-submit → main
- **Changes**: +342 / -18 across 12 files

### Change Categories
- UI/Styling: 5 files
- API Integration: 3 files
- Hooks/Utils: 2 files
- Documentation: 2 files

### Delegated Reviews
- [x] `review-styling`: 2 violations found
  - src/app/(app)/assignments/[id]/page.tsx: Using raw `Badge` instead of `AndamioBadge`
  - src/components/assignments/submit-form.tsx: Hardcoded `text-green-600`
- [x] `audit-api-coverage`: New endpoint usage documented
- [x] `documentarian`: CHANGELOG needs update for new feature

### Code Review Findings

#### Must Fix
- [ ] src/hooks/use-assignment-submit.ts:45 - Missing error handling for network failures
- [ ] src/components/assignments/submit-form.tsx:23 - Hardcoded color violates style rules

#### Suggestions
- [ ] Consider adding optimistic updates for better UX
- [ ] Add loading state to submit button

### Verdict
- [x] **Request Changes** - Style violations and missing error handling
```

## Output Format

Structured markdown review as shown in Step 7. The review should be:
- Actionable: Clear items to fix or improve
- Prioritized: Must-fix items separated from suggestions
- Complete: All relevant specialized skills invoked
- Constructive: Focus on improvement, not criticism
