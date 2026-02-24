---
status: pending
priority: p3
issue_id: "008"
tags: [code-review, documentation]
dependencies: []
---

# CLAUDE.md Wallet Polling Interval Documentation Drift

## Problem Statement

The CLAUDE.md states "This check runs every 2 seconds via polling" for wallet switch detection, but the actual code uses `10_000` (10 seconds) at `src/contexts/andamio-auth-context.tsx:474`. The documentation is stale.

**Why it matters:** Future developers relying on CLAUDE.md will have incorrect assumptions about the polling behavior and security window.

## Findings

- **2 of 7 review agents** flagged this (Security, Architecture)
- The 10-second interval is a reasonable balance between responsiveness and performance
- The interval was already 10 seconds before this PR

## Proposed Solutions

### Option A: Update CLAUDE.md to say 10 seconds
**Effort:** Small (1 min)
**Risk:** None

## Acceptance Criteria

- [ ] CLAUDE.md reflects actual polling interval

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | Pre-existing doc drift |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
- CLAUDE.md security features section
