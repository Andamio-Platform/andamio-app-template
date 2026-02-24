---
status: pending
priority: p2
issue_id: "024"
tags: [code-review, reliability, wallet]
dependencies: []
---

# No Input Validation on rawAddress Before Processing

## Problem Statement

In `src/lib/wallet-address.ts`, line 30 calls `await wallet.getChangeAddress()` and immediately uses the result at line 31 with `.startsWith("addr")`. If a buggy wallet extension returns `null`, `undefined`, or an empty string, this will throw a TypeError.

**Why it matters:** The function is a defensive helper — it should not crash on unexpected input from wallet extensions, which are third-party code with varying quality.

## Findings

- **Flagged by:** Security sentinel (low), TypeScript reviewer (noted)
- The happy path at line 22 also returns without validating the result of `getChangeAddressBech32()` — could return empty string

## Proposed Solutions

### Option A: Add null/empty guard + validate happy path return (Recommended)
**Pros:** Complete defensive posture
**Cons:** 4 extra lines
**Effort:** Small (5 min)
**Risk:** None

```typescript
// Happy path validation:
if (typeof wallet.getChangeAddressBech32 === "function") {
  try {
    const address = await wallet.getChangeAddressBech32();
    if (address && typeof address === "string" && address.length >= 10) {
      return address;
    }
  } catch {
    // Fall through to fallback
  }
}

// Fallback input validation:
const rawAddress = await wallet.getChangeAddress();
if (!rawAddress || typeof rawAddress !== "string" || rawAddress.length < 10) {
  throw new Error("Wallet returned invalid address");
}
```

## Recommended Action

Option A — combine with the try/catch fix from todo #023.

## Technical Details

**Affected files:**
- `src/lib/wallet-address.ts` (lines 22, 30-31)

## Acceptance Criteria

- [ ] Null/empty guard on rawAddress before .startsWith() call
- [ ] Happy path return value validated
- [ ] Error thrown for invalid addresses rather than crash

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #325 review | Third-party wallet extensions return unpredictable values |

## Resources

- PR #325: https://github.com/Andamio-Platform/andamio-app-v2/pull/325
