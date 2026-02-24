---
status: pending
priority: p3
issue_id: "026"
tags: [code-review, architecture, wallet]
dependencies: ["023"]
---

# getUsedAddressesBech32() Has Same SDK Fragility Across 8 Call Sites

## Problem Statement

The same SDK version fragility that motivated `getWalletAddressBech32()` also applies to `wallet.getUsedAddressesBech32()`. Eight call sites currently wrap it in individual try/catch blocks with identical fallback logic. A companion helper like `getWalletUsedAddressesBech32(wallet)` in the same file would centralize that defensive pattern.

**Why it matters:** If `getUsedAddressesBech32()` breaks the same way `getChangeAddressBech32()` did, 8 files need fixing. The existing try/catch blocks prevent crashes but the pattern is duplicated.

## Proposed Solutions

### Option A: Add companion helper (Recommended)
**Pros:** Centralized defense, reduces duplication across 8 files
**Cons:** Requires touching 8 files
**Effort:** Medium (30 min)
**Risk:** Low

### Option B: Leave as-is
**Pros:** Existing try/catch handles it; no change needed
**Cons:** Duplicated pattern
**Effort:** None
**Risk:** Low — current code works

## Recommended Action

Option B for now — the try/catch blocks work. Create Option A as a follow-up if the same crash is reported for getUsedAddressesBech32().

## Technical Details

**Affected files:**
- `src/app/(app)/api-setup/page.tsx`
- `src/app/(studio)/studio/page.tsx`
- `src/components/courses/create-course-dialog.tsx`
- `src/components/landing/registration-flow.tsx`
- `src/components/tx/create-course.tsx`
- `src/components/tx/create-project.tsx`
- `src/components/tx/mint-access-token.tsx`
- `src/contexts/andamio-auth-context.tsx`

## Acceptance Criteria

- [ ] Decision documented: defer until getUsedAddressesBech32 shows same crash

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #325 review | Same SDK fragility pattern |

## Resources

- PR #325: https://github.com/Andamio-Platform/andamio-app-v2/pull/325
