---
status: pending
priority: p2
issue_id: "006"
tags: [code-review, ci, testing, pr-342]
dependencies: []
---

# No CI Integration for test:e2e:pr Script

## Problem Statement

The `test:e2e:pr` npm script is added in `package.json` but there's no GitHub Actions workflow that gates PRs on E2E test results.

**Why it matters:** Without CI integration, the E2E tests are only useful when manually run locally. The primary value of E2E tests is automated regression detection.

## Findings

- **Agent-Native Reviewer**: No CI workflow gates PRs on E2E results — tests only run manually

**Location:** `package.json` (`test:e2e:pr` script), missing `.github/workflows/` entry

## Proposed Solutions

### Solution 1: Add GitHub Actions Workflow (Recommended)
Create a workflow that runs `npm run test:e2e:pr` on PR events.

- **Pros:** Automated regression detection, blocks merging broken PRs
- **Cons:** Requires Playwright setup in CI (containers, browser install)
- **Effort:** Medium (1-2 hours)
- **Risk:** Low

### Solution 2: Defer to Full E2E CI Strategy
Wait until more specs exist before investing in CI infrastructure.

- **Pros:** No premature optimization
- **Cons:** Tests remain manual-only
- **Effort:** None
- **Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected Files:**
- New: `.github/workflows/e2e-pr.yml` (to be created)
- `package.json`

## Acceptance Criteria

- [ ] CI workflow runs `test:e2e:pr` on PR events
- [ ] PR checks include E2E test results
- [ ] Playwright browsers install in CI environment

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Agent-native reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
