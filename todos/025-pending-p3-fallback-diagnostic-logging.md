---
status: pending
priority: p3
issue_id: "025"
tags: [code-review, observability, wallet]
dependencies: []
---

# No Diagnostic Logging When Fallback Path Fires

## Problem Statement

In `src/lib/wallet-address.ts`, when the v2 `getChangeAddressBech32()` method is missing and the fallback path executes, there is no `console.warn` or logging. Since this is a compatibility shim that should ideally not be needed, a one-time log would help diagnose which wallets/SDK versions are triggering the fallback in production.

**Why it matters:** Without logging, you won't know how many users hit the fallback path, making it hard to decide when to drop it or investigate wallet compatibility issues.

## Proposed Solutions

### Option A: Add console.warn on fallback (Recommended)
**Effort:** Small (2 min)

```typescript
if (typeof wallet.getChangeAddressBech32 === "function") {
  // ... happy path
}

console.warn("[wallet-address] getChangeAddressBech32 not available, using fallback");
```

## Technical Details

**Affected files:**
- `src/lib/wallet-address.ts` (line ~25)

## Acceptance Criteria

- [ ] Console.warn emitted when fallback path is used

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #325 review | Observability for compatibility shims |

## Resources

- PR #325: https://github.com/Andamio-Platform/andamio-app-v2/pull/325
