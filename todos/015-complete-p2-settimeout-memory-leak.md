---
status: complete
priority: p2
issue_id: "015"
tags: [code-review, bug, react]
dependencies: []
---

# Uncleared setTimeout in AliasListInput Causes Memory Leak

## Problem Statement

`src/components/tx/alias-list-input.tsx` line 87 sets a 3-second timeout to clear the `lastVerified` state, but never stores the timer ID or clears it on unmount. If the component unmounts before the timeout fires (e.g., user navigates away), it attempts to set state on an unmounted component.

**Why it matters:** Memory leak and React "Can't perform state update on unmounted component" warning. The component is used in every TX card, so it mounts/unmounts frequently as users navigate tabs.

## Findings

- **Flagged by:** Performance oracle, TypeScript reviewer
- The timeout at line 87: `setTimeout(() => setLastVerified(null), 3000)`
- No `useRef` for timer ID, no cleanup in useEffect

## Proposed Solutions

### Option A: useRef + useEffect cleanup (Recommended)
**Pros:** Standard React pattern, prevents memory leak
**Cons:** Adds 5 lines
**Effort:** Small (5 min)
**Risk:** None

```typescript
const timerRef = useRef<NodeJS.Timeout | null>(null);

// In the verification callback:
timerRef.current = setTimeout(() => setLastVerified(null), 3000);

// Cleanup on unmount:
useEffect(() => {
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);
```

## Recommended Action

Option A.

## Technical Details

**Affected files:**
- `src/components/tx/alias-list-input.tsx` (line 87)

## Acceptance Criteria

- [ ] setTimeout timer ID stored in ref
- [ ] Timer cleared on component unmount
- [ ] No React warnings when navigating away during verification

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Common React pattern omission |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
