---
status: pending
priority: p3
issue_id: "021"
tags: [code-review, agent-native, pr-341]
dependencies: []
---

# Add has_claimed Field to Commitment Status API Response

## Problem Statement

After Leave & Claim, the gateway still returns `commitmentStatus: "ACCEPTED"`. Clients must cross-reference `project.credentialClaims` to detect post-claim state — a multi-step composition that agents must replicate.

**Why it matters:** Prevents agents from needing to cross-reference two separate API responses.

## Proposed Solutions

### Solution 1: Add `has_claimed` Boolean to Commitment Response
The gateway already has `credentialClaims` data — include a derived boolean.

- **Effort:** Small (gateway API change)
- **Risk:** Low

## Acceptance Criteria

- [ ] Commitment status response includes `has_claimed` field
- [ ] Client can use field instead of cross-referencing

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | Agent-native reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
