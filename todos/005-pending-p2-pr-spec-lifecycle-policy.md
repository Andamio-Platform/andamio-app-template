---
status: pending
priority: p2
issue_id: "005"
tags: [code-review, architecture, testing, pr-342]
dependencies: []
---

# PR Spec Lifecycle Policy Needed for e2e/tests/pr/

## Problem Statement

The `e2e/tests/pr/` directory is designed for PR-scoped test specs, but there's no documented lifecycle policy for when specs should be promoted to permanent test suites or deleted after merge.

**Why it matters:** Without a clear policy, the `pr/` directory will accumulate stale specs over time, increasing CI time and maintenance burden.

## Findings

- **Architecture Reviewer**: PR-scoped test pattern needs lifecycle policy — promote, archive, or delete after merge

**Location:** `e2e/tests/pr/` directory and `e2e/tests/pr/README.md`

## Proposed Solutions

### Solution 1: Document Lifecycle in README (Recommended)
Add lifecycle rules to `e2e/tests/pr/README.md`: specs are deleted after merge unless promoted to `e2e/tests/` permanent suite.

- **Pros:** Simple, low overhead, self-documenting
- **Cons:** Relies on developer discipline
- **Effort:** Small (< 30 min)
- **Risk:** Low

### Solution 2: CI Automation
Add a GitHub Action that flags or removes PR specs after their associated PR merges.

- **Pros:** Automated cleanup
- **Cons:** Over-engineering for current team size
- **Effort:** Medium (1-2 hours)
- **Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- `e2e/tests/pr/README.md`

## Acceptance Criteria

- [ ] Lifecycle policy documented in README
- [ ] Clear rules for when to promote vs delete specs

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Architecture reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
