---
status: complete
priority: p2
issue_id: "014"
tags: [code-review, performance, react]
dependencies: []
---

# useEffect Dependency Array Includes State Being Set

## Problem Statement

Both `teachers-update.tsx` (lines 64-71) and `managers-manage.tsx` (lines 72-85) have a `useEffect` that clears optimistic state when the API catches up, but the dependency array includes `optimisticAdds` and `optimisticRemoves` — the same state variables being set inside the effect. This causes an extra render cycle every time the effect fires: the effect sets state, which triggers itself again (the second run is a no-op but still wastes a render).

**Why it matters:** Extra render cycles on every API refresh. Not a crash risk, but wasteful in a component that already re-renders on every `currentTeachers` prop change.

## Findings

- **Flagged by:** Performance oracle, TypeScript reviewer
- The pattern appears identically in both components
- The effect only needs to run when `currentTeachers` changes (the API data), not when the optimistic state changes

**Evidence (teachers-update.tsx:64-71):**
```typescript
React.useEffect(() => {
  if (optimisticAdds.length > 0) {
    setOptimisticAdds((prev) => prev.filter((a) => !currentTeachers.includes(a)));
  }
  if (optimisticRemoves.length > 0) {
    setOptimisticRemoves((prev) => prev.filter((a) => currentTeachers.includes(a)));
  }
}, [currentTeachers, optimisticAdds, optimisticRemoves]); // ← optimistic* should be removed
```

## Proposed Solutions

### Option A: Remove optimistic state from deps, use functional updates (Recommended)
**Pros:** Eliminates extra render, uses React best practice (functional setState doesn't need deps)
**Cons:** None — the functional `prev =>` form already avoids stale closures
**Effort:** Small (5 min)
**Risk:** None

```typescript
React.useEffect(() => {
  setOptimisticAdds((prev) => prev.filter((a) => !currentTeachers.includes(a)));
  setOptimisticRemoves((prev) => prev.filter((a) => currentTeachers.includes(a)));
}, [currentTeachers]); // Only re-run when API data changes
```

## Recommended Action

Option A for both files.

## Technical Details

**Affected files:**
- `src/components/tx/teachers-update.tsx` (lines 64-71)
- `src/components/tx/managers-manage.tsx` (lines 72-85)

## Acceptance Criteria

- [ ] Dependency arrays contain only `currentTeachers` (or equivalent prop)
- [ ] Conditional guards (`if length > 0`) removed (functional update handles empty arrays fine)
- [ ] Both components updated consistently
- [ ] No infinite loop or stale closure

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Same pattern in both twin components |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
