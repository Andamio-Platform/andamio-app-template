---
status: complete
priority: p2
issue_id: "030"
tags: [code-review, yagni, simplicity, pr-336]
dependencies: []
---

# Unused `modules` Field in learnerStats Map

## Problem Statement

The `manage-learners` page builds a `modules: Set<string>` per learner in the stats Map, but this field is never read anywhere in the component — not in the table, not in stat cards, nowhere. This is dead code that adds cognitive load.

## Findings

- **Source**: TypeScript Reviewer, Code Simplicity Reviewer
- **File**: `src/app/(studio)/studio/course/[coursenft]/manage-learners/page.tsx` (lines 50, 53, 57)
- **Evidence**: `modules: Set<string>` declared in type, initialized in entry, populated with `c.moduleCode`, but never accessed in JSX

## Proposed Solutions

### Option A: Remove the field (Recommended)
Delete the `modules` property from the type, initialization, and population.

- **Effort**: Small (3 lines removed)
- **Risk**: None

## Technical Details

Remove from line 50 type, line 53 initialization, and line 57 population.

## Acceptance Criteria

- [ ] `modules` field removed from learnerStats Map type and logic
- [ ] No other code references the removed field

## Work Log

- 2026-02-24: Created from PR #336 review (Simplicity + TypeScript findings)
