---
status: pending
priority: p3
issue_id: "007"
tags: [code-review, architecture, design-system]
dependencies: []
---

# Custom Loading Skeletons Bypass AndamioSkeleton Component

## Problem Statement

Four of the six new loading skeletons use custom inline `<div>` elements with `motion-safe:animate-pulse bg-muted` instead of the existing `AndamioSkeleton` component or `AndamioPageLoading` variants. This creates a maintenance divergence where centralized skeleton styling changes won't propagate to these pages.

**Why it matters:** If skeleton animation, colors, or border radius change in the design system, these four files won't pick up the changes. The existing `AndamioPageLoading` component already has `list`, `detail`, `content`, `table`, and `cards` variants.

## Findings

- **2 of 7 review agents** flagged this (Architecture, Simplicity)
- `contributor/loading.tsx` and `task/[taskId]/loading.tsx` correctly use `<AndamioPageLoading variant="detail" />`
- `api-setup/loading.tsx`, `editor/loading.tsx`, `usage/loading.tsx`, `sitemap/loading.tsx` use 219 lines of custom skeleton markup
- Custom skeletons mimic exact page layouts (higher fidelity but higher maintenance)

## Proposed Solutions

### Option A: Add new AndamioPageLoading variants
**Pros:** Centralizes styling, reduces LOC by ~200 lines
**Cons:** May need new variant designs
**Effort:** Medium
**Risk:** Low

### Option B: Replace custom divs with AndamioSkeleton component
**Pros:** Keeps custom layouts but centralizes base skeleton styling
**Cons:** More component instances
**Effort:** Small
**Risk:** None

### Option C: Accept current approach (high-fidelity skeletons)
**Pros:** Better perceived performance with layout-matching skeletons
**Cons:** 219 lines of maintenance surface
**Effort:** None
**Risk:** Style drift over time

## Acceptance Criteria

- [ ] Loading skeletons use centralized skeleton components
- [ ] Skeleton styling changes propagate to all pages
- [ ] Visual appearance acceptable

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | Two patterns coexist |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
- AndamioPageLoading: `src/components/andamio/andamio-loading.tsx`
