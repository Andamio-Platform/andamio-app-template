---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, testing, agent-native, pr-342]
dependencies: []
---

# Add data-testid Attributes to State-Critical UI Sections

## Problem Statement

State-critical UI elements (enrollment status, claim buttons, eligibility badges) lack `data-testid` attributes, making E2E selectors fragile.

**Why it matters:** Without stable selectors, E2E tests break when CSS classes or text content changes.

## Proposed Solutions

### Solution 1: Add data-testid to Key Elements
Add `data-testid` attributes to enrollment/claim/eligibility UI components.

- **Effort:** Small (< 1 hour)
- **Risk:** None

## Acceptance Criteria

- [ ] Key state indicators have `data-testid` attributes
- [ ] E2E specs use `data-testid` selectors where available

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Agent-native reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
