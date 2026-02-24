---
status: pending
priority: p3
issue_id: "005"
tags: [code-review, security, consistency]
dependencies: []
---

# Ungated console.log in andamio-auth.ts

## Problem Statement

The `authenticateWithWallet` function in `src/lib/andamio-auth.ts` still contains three ungated `console.log` calls that run in production for every authentication. While these do not leak JWT tokens, they log access token policy IDs, detected token unit names, aliases, and partial asset identifiers to the browser console.

**Why it matters:** Information disclosure that could aid an attacker in understanding the on-chain asset structure. Inconsistent with the PR's goal of gating console logging.

## Findings

- **1 of 7 review agents** flagged this (Security Sentinel)
- Located at approximately lines 441, 451, 453 of `src/lib/andamio-auth.ts`
- These log wallet assets, access token units, and aliases

## Proposed Solutions

### Option A: Replace with authLogger.debug() (Recommended)
**Pros:** Consistent with auth context pattern, respects debug flag
**Cons:** None
**Effort:** Small
**Risk:** None

## Acceptance Criteria

- [ ] All `console.log` calls in `andamio-auth.ts` replaced with `authLogger.debug()`
- [ ] No access token info appears in production browser console

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | File not touched by PR, pre-existing |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
