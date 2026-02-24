---
status: pending
priority: p3
issue_id: "006"
tags: [code-review, code-quality, simplicity]
dependencies: []
---

# Duplicate Error Boundaries Could Be Extracted

## Problem Statement

The two new error boundaries (`(studio)/error.tsx` and `studio/course/[coursenft]/error.tsx`) are 52 lines each and nearly identical. They differ only in 5 string values (title, description, fallback message). A third error boundary at `(app)/error.tsx` also shares ~90% of the same code.

**Why it matters:** Maintenance burden. When the error UI pattern changes, all three files must be updated independently.

## Findings

- **3 of 7 review agents** flagged this (Performance, Architecture, Simplicity)
- Next.js App Router requires `error.tsx` files in each route segment (can't share file)
- But the component logic can be extracted into a shared component

## Proposed Solutions

### Option A: Extract shared ErrorFallback component
**Pros:** ~60 lines saved, single source of truth for error UI
**Cons:** One more component file
**Effort:** Small
**Risk:** None

```typescript
// components/errors/error-fallback.tsx
export function ErrorFallback({ error, reset, title, description, fallbackMessage }) { ... }

// (studio)/error.tsx -- 5 lines
export default function StudioError({ error, reset }) {
  return <ErrorFallback error={error} reset={reset} title="Something went wrong" ... />;
}
```

### Option B: Keep duplicated (Accept current state)
**Pros:** Each boundary is self-contained, easy to customize independently
**Cons:** 3x maintenance surface
**Effort:** None
**Risk:** None

## Acceptance Criteria

- [ ] Shared error fallback component created
- [ ] All error.tsx files use shared component
- [ ] Error UI behavior unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | Next.js requires file per segment |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
