---
status: complete
priority: p1
issue_id: "013"
tags: [code-review, conventions, icons]
dependencies: []
---

# Direct lucide-react Import Violates Icon Convention

## Problem Statement

`src/hooks/tx/use-transaction.ts:64` imports `Loader2` directly from `lucide-react`:

```typescript
import { Loader2 } from "lucide-react";
```

This violates the project's CLAUDE.md rule: "**Always** import from `~/components/icons` with semantic names. **Never** import directly from `lucide-react`." The project centralizes all icon imports through `~/components/icons` with semantic names (e.g., `LoadingIcon` instead of `Loader2`).

**Why it matters:** Convention violation in a shared hook (used by every TX component). Sets a precedent for bypassing the centralized icon system. `LoadingIcon` already exists in `~/components/icons` and maps to the same underlying icon.

## Findings

- **Flagged by:** TypeScript reviewer, Security sentinel, Architecture strategist
- `~/components/icons/index.ts` already exports `LoadingIcon` (which wraps Loader2)
- All other files in the codebase use `LoadingIcon` from `~/components/icons`
- The `Loader2` is used at line 80 to create a loading spinner for toast notifications:
  ```typescript
  const loadingSpinner = React.createElement(Loader2, { className: "size-4 animate-spin" });
  ```

## Proposed Solutions

### Option A: Use LoadingIcon from ~/components/icons (Recommended)
**Pros:** Follows convention, uses existing semantic export
**Cons:** None
**Effort:** Small (2 min)
**Risk:** None

```typescript
// Replace:
import { Loader2 } from "lucide-react";
// With:
import { LoadingIcon } from "~/components/icons";

// And update usage:
const loadingSpinner = React.createElement(LoadingIcon, { className: "size-4 animate-spin" });
```

## Recommended Action

Option A — straightforward convention fix.

## Technical Details

**Affected files:**
- `src/hooks/tx/use-transaction.ts` (lines 64, 80)

## Acceptance Criteria

- [ ] No direct `lucide-react` imports in `use-transaction.ts`
- [ ] Uses `LoadingIcon` from `~/components/icons`
- [ ] Toast loading spinner still renders correctly
- [ ] Build passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #324 review | Convention violation in shared hook |

## Resources

- PR #324: https://github.com/Andamio-Platform/andamio-app-v2/pull/324
- Icon convention: `.claude/CLAUDE.md` → Icons section
- Icon exports: `src/components/icons/index.ts`
