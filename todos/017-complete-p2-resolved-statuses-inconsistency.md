---
status: complete
priority: p2
issue_id: "017"
tags: [code-review, architecture, consistency]
dependencies: []
---

# RESOLVED_STATUSES Defined Inline with Inconsistent Values

## Problem Statement

Both studio pages define `RESOLVED_STATUSES` inside the component render scope (recreated every render) with different values:

- `course/[coursenft]/page.tsx:222`: `["completed", "failed", "expired"]`
- `project/[projectid]/page.tsx:86`: `["completed", "expired"]` (missing "failed")

These should be module-level constants with consistent values. The "failed" status is a valid terminal state that should be filtered in both contexts.

**Why it matters:** Inconsistent filtering means failed assignments might be hidden on courses but visible on projects (or vice versa), creating a confusing UX. Re-creating arrays on every render is a minor perf issue.

## Findings

- **Flagged by:** Architecture strategist, Code simplicity reviewer
- Both arrays are used to filter assignment/commitment lists to show only active items
- "failed" is a valid terminal state in both contexts

## Proposed Solutions

### Option A: Extract to shared constant (Recommended)
**Pros:** Single source of truth, consistent filtering
**Cons:** Minor refactor
**Effort:** Small (10 min)
**Risk:** None

```typescript
// ~/lib/constants.ts or ~/config/statuses.ts
export const RESOLVED_STATUSES = ["completed", "failed", "expired"] as const;
```

## Recommended Action

Option A.

## Technical Details

**Affected files:**
- `src/app/(studio)/studio/course/[coursenft]/page.tsx` (line 222)
- `src/app/(studio)/studio/project/[projectid]/page.tsx` (line 86)

## Acceptance Criteria

- [ ] RESOLVED_STATUSES extracted to shared module-level constant
- [ ] Both pages import from same source
- [ ] Values are consistent (include "failed")
- [ ] Arrays are module-level, not recreated per render

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Inline constants diverge silently |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
