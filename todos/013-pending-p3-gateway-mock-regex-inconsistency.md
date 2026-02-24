---
status: pending
priority: p3
issue_id: "013"
tags: [code-review, testing, security, pr-342]
dependencies: []
---

# Regex Pattern Inconsistency in Gateway Mock

## Problem Statement

Custom handlers use `url.includes()` string matching while built-in handlers use glob-to-regex patterns. This inconsistency could cause handler precedence issues.

**Why it matters:** Mixed matching strategies can lead to subtle bugs where custom handlers don't intercept expected URLs.

## Proposed Solutions

### Solution 1: Standardize on One Pattern
Use the same matching strategy (either glob or includes) for all handlers.

- **Effort:** Small (< 30 min)
- **Risk:** Low

## Acceptance Criteria

- [ ] Consistent URL matching strategy across all mock handlers

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #342 review | Security reviewer flagged |

## Resources

- PR: https://github.com/Andamio-Platform/andamio-app-v2/pull/342
