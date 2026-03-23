---
status: complete
priority: p2
issue_id: "004"
tags: [code-review, architecture, type-safety]
dependencies: []
---

# Follow-up: Add TypeScript union types for commitment status values

## Problem Statement

All `commitmentStatus` fields across the codebase are typed as `string`. This means the compiler cannot catch typos, stale references, or missed renames. This is the root cause of why PR #44 required a manual 30-reference find-and-replace.

## Findings

- `src/hooks/api/project/use-project-contributor.ts` — `commitmentStatus: string`
- `src/hooks/api/project/use-project-manager.ts` — `commitmentStatus: string`
- `src/hooks/api/project/use-project.ts` — `commitmentStatus: string`
- All component comparisons use `=== "SUBMITTED"` against untyped strings

## Proposed Solutions

### Option A: Extract union types (Recommended)

```typescript
// src/lib/status/project-commitment-status.ts
type ProjectCommitmentStatus =
  | "DRAFT" | "SUBMITTED" | "ACCEPTED" | "REFUSED"
  | "REWARDED" | "ABANDONED" | "PENDING_TX_COMMIT"
  | "PENDING_TX_ASSESS" | "PENDING_TX_CLAIM" | "PENDING_TX_LEAVE"
  | "UNKNOWN";
```

- **Effort:** Medium (touch all interfaces)
- **Benefit:** Compiler catches the next status migration automatically

## Acceptance Criteria

- [ ] Union type defined for project commitment statuses
- [ ] Union type defined for course commitment statuses
- [ ] All interfaces use union types instead of string

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-03-23 | Created | Found during PR #45 review — follow-up work |
