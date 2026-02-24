---
status: pending
priority: p3
issue_id: "021"
tags: [code-review, maintainability]
dependencies: []
---

# Hardcoded 10 ADA Transaction Cost

## Problem Statement

Both `teachers-update.tsx:343` and `managers-manage.tsx:360` hardcode `10` ADA as the per-alias transaction cost:

```tsx
{aliasesToAdd.length} × 10 ADA = {aliasesToAdd.length * 10} ADA
```

If the protocol cost changes, it must be updated in multiple places.

**Why it matters:** Minor maintainability concern. The cost should come from a constant or API response.

## Proposed Solutions

### Option A: Extract to constant
**Effort:** Small (5 min)

```typescript
// ~/config/transaction-ui.ts
export const MANAGER_ADD_COST_ADA = 10;
```

### Option B: Leave as-is
This is a protocol-level constant that rarely changes.

## Recommended Action

Option A when cost breakdown is needed in a third location.

## Technical Details

**Affected files:**
- `src/components/tx/teachers-update.tsx` (line 343)
- `src/components/tx/managers-manage.tsx` (line 360)

## Acceptance Criteria

- [ ] Decision documented

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Magic number in UI |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
