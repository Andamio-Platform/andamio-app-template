---
status: pending
priority: p3
issue_id: "020"
tags: [code-review, architecture, agent-native, pr-341]
dependencies: []
---

# Add Server-Side Eligibility Endpoint for Agent Parity

## Problem Statement

The prerequisite eligibility check runs entirely client-side in `src/lib/project-eligibility.ts`. Agents and external integrations must compose two API calls and replicate the set-intersection logic to check eligibility.

**Why it matters:** Agent-native reviewer flagged that 2/12 capabilities require client-side logic replication rather than a single API call.

## Proposed Solutions

### Solution 1: Gateway Eligibility Endpoint
Add `GET /api/v2/project/user/project/{id}/eligibility` returning the `EligibilityResult` shape.

- **Effort:** Medium (requires gateway API change)
- **Risk:** Low

### Solution 2: Embed in Project Detail Response
Add a computed `eligibility` field to the project detail API response.

- **Effort:** Medium
- **Risk:** Low

## Acceptance Criteria

- [ ] Agents can check eligibility with a single API call
- [ ] Same semantics as client-side `checkProjectEligibility`

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | Agent-native reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
