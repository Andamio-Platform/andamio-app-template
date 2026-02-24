---
status: pending
priority: p3
issue_id: "024"
tags: [code-review, security, pre-existing]
dependencies: []
---

# Reduce Gateway Proxy Logging Verbosity in Production

## Problem Statement

`src/app/api/gateway/[...path]/route.ts` line 158 logs full request bodies (`console.log(\`[Gateway Proxy] Request body:\`, bodyText)`), which includes user aliases, project IDs, task hashes, and evidence content.

**Why it matters:** Could contribute to log bloat or inadvertent data exposure in log aggregation. Pre-existing issue, not introduced by this PR.

## Proposed Solutions

### Solution 1: Log Endpoint Path + Status Only
Remove body logging or gate it behind a `DEBUG` env var.

- **Effort:** Small (< 15 min)
- **Risk:** Low

## Acceptance Criteria

- [ ] Production logs don't contain full request bodies

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #341 review | Security reviewer flagged (pre-existing) |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/341
