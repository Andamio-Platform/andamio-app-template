---
status: pending
priority: p3
issue_id: "038"
tags: [code-review, security, pr-337]
dependencies: []
---

# Verify Alias Case Sensitivity

## Problem Statement

The alias comparison `user?.accessTokenAlias === preAssignedAlias` is case-sensitive. If aliases are case-insensitive in the Andamio protocol, a legitimate assignee could be blocked by a case mismatch.

## Findings

- **Source**: Security Sentinel (Finding 7)
- **File**: `src/app/(app)/project/[projectid]/[taskhash]/page.tsx`, line 190

## Proposed Solutions

Confirm alias case sensitivity in the protocol. If case-insensitive, normalize both sides with `.toLowerCase()`.

- **Effort**: Small
- **Risk**: None

## Work Log

- 2026-02-24: Created from PR #337 review
