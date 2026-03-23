---
status: complete
priority: p2
issue_id: "003"
tags: [code-review, consistency, pr-45]
dependencies: []
---

# Missing PENDING_TX_SUBMIT legacy mapping in use-student-assignment-commitments.ts

## Problem Statement

The PR added PENDING_TX_SUBMIT legacy mappings to 4 of 5 normalizer hooks, but `src/hooks/api/course/use-student-assignment-commitments.ts` was not updated. Its STATUS_MAP has `COMMITTED: "PENDING_APPROVAL"` (line 67) but no `PENDING_TX_SUBMIT` entry.

If stale cached data contains `PENDING_TX_SUBMIT`, it would pass through un-normalized via the `STATUS_MAP[rawStatus] ?? rawStatus` fallback.

## Findings

- **Location:** `src/hooks/api/course/use-student-assignment-commitments.ts:56-68`
- **Impact:** Low — PENDING_TX_SUBMIT was primarily a project commitment status, unlikely in course context
- **Concern:** Inconsistent with defensive posture taken in other normalizers

## Proposed Solutions

### Option A: Add mapping for consistency (Recommended)
Add `PENDING_TX_SUBMIT: "IN_PROGRESS"` to the STATUS_MAP with a legacy comment.

- **Effort:** Small (1 line)
- **Risk:** None

## Acceptance Criteria

- [ ] PENDING_TX_SUBMIT has a legacy mapping in use-student-assignment-commitments.ts

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-23 | Created | Found during PR #45 review |
