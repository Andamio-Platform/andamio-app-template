---
status: complete
priority: p2
issue_id: "003"
tags: [code-review, architecture, build]
dependencies: []
---

# packages/core/package-lock.json Should Not Be Committed

## Problem Statement

The PR un-gitignores `package-lock.json` (correct for reproducible builds), but this also causes `packages/core/package-lock.json` (1,482 lines) to be tracked. This sub-package lockfile is likely an unintended side effect. If `packages/core` is managed by the root workspace, having a separate lockfile creates a dependency management anti-pattern with potential version drift.

**Why it matters:** Two uncoordinated lock files can lead to dependency drift between root and sub-package, adds 1,482 lines of noise to the PR diff, and creates CI build inconsistencies.

## Findings

- **3 of 7 review agents** flagged this (Architecture, Performance, Simplicity)
- Architecture strategist noted there is no `package.json` visible in `packages/core/`
- Root `package.json` does not appear to have a `workspaces` configuration
- The lockfile was likely generated as a side effect of removing `package-lock.json` from `.gitignore`

## Proposed Solutions

### Option A: Add specific gitignore rule (Recommended)
**Pros:** Simple, targeted, preserves root lockfile tracking
**Cons:** None
**Effort:** Small (2 min)
**Risk:** None

Add to `.gitignore`:
```
packages/core/package-lock.json
```

### Option B: Investigate monorepo structure
**Pros:** Resolves root cause, proper workspace setup
**Cons:** Larger scope change
**Effort:** Medium
**Risk:** Low

## Recommended Action

_To be decided during triage._

## Technical Details

**Affected files:**
- `.gitignore`
- `packages/core/package-lock.json` (should be removed from tracking)

## Acceptance Criteria

- [ ] `packages/core/package-lock.json` is not tracked by git
- [ ] Root `package-lock.json` IS tracked (for `npm ci`)
- [ ] Build passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | Side effect of .gitignore change |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
