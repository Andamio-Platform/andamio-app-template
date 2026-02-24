---
status: complete
priority: p1
issue_id: "033"
tags: [code-review, typescript, react-hooks, pr-337]
dependencies: []
---

# Stale useCallback Dependencies in alias-list-input.tsx

## Problem Statement

The `addAlias` callback in `AliasListInput` uses `onValidatingChange` and `getExcludeReason` in its body but neither is in the `useCallback` dependency array. This means the callback captures stale references — if a parent re-renders with a different `getExcludeReason` function, the old one is used. This is a shared component used by managers-manage, teachers-update, create-project, create-course, and now task-form.

## Findings

- **Source**: TypeScript Reviewer, Architecture Strategist
- **File**: `src/components/tx/alias-list-input.tsx`, line 129
- **Evidence**: Dependency array is `[inputValue, value, excludeAliases, onChange]` but body uses `onValidatingChange` (lines 108, 129) and `getExcludeReason` (lines 93-94)

## Proposed Solutions

### Option A: Add both to dependency array (Recommended)
```typescript
}, [inputValue, value, excludeAliases, getExcludeReason, onChange, onValidatingChange]);
```

- **Effort**: Small (1 line)
- **Risk**: Low — callers may need to wrap callbacks in useCallback to avoid unnecessary re-creates, but the current behavior is a correctness bug

## Acceptance Criteria

- [ ] `getExcludeReason` and `onValidatingChange` in dependency array
- [ ] All existing callers (managers-manage, teachers-update, etc.) still work correctly

## Work Log

- 2026-02-24: Created from PR #337 review
