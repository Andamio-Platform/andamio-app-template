---
status: complete
priority: p2
issue_id: "034"
tags: [code-review, documentation, security, pr-337]
dependencies: []
---

# Misleading Comment About API 422 Enforcement

## Problem Statement

Line 191 of the task detail page states "Frontend-only gate — the API returns 422 if a non-assigned user tries to commit." The design doc explicitly says enforcement is frontend-only and the API has no awareness of pre-assignment. The comment misleads developers into thinking server-side enforcement exists.

## Findings

- **Source**: Security Sentinel, Architecture Strategist, Agent-Native Reviewer
- **File**: `src/app/(app)/project/[projectid]/[taskhash]/page.tsx`, line 191
- **Evidence**: Design doc at `docs/plans/2026-02-19-task-pre-assignment-design.md:127` states "Not enforced on-chain"

## Proposed Solutions

### Option A: Correct the comment (Recommended)
Replace with: `// Frontend-only gate — API has no pre-assignment awareness; enforce server-side in future`

- **Effort**: Small (1 line)
- **Risk**: None

## Acceptance Criteria

- [ ] Comment accurately describes enforcement status
- [ ] No false claims about API behavior

## Work Log

- 2026-02-24: Created from PR #337 review
