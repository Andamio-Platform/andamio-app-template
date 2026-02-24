---
status: pending
priority: p2
issue_id: "023"
tags: [code-review, reliability, wallet]
dependencies: []
---

# Happy Path Should Try/Catch getChangeAddressBech32()

## Problem Statement

In `src/lib/wallet-address.ts`, lines 21-23 check `typeof wallet.getChangeAddressBech32 === "function"` then call it directly. This handles the "method missing" case but not the "method exists but throws" case. If the SDK method is present on the prototype but throws at runtime (e.g., incomplete wallet initialization, internal state race), the error propagates uncaught and the fallback path never executes.

The PR description mentions "Initial state race: useWallet() returns {} as initial wallet instance" — while `{}` has no methods (handled by typeof), there are intermediate states where the wallet object has methods on its prototype but lacks internal state to execute them.

**Why it matters:** The helper's entire purpose is defensive compatibility. Without try/catch on the happy path, it only defends against one of two failure modes.

## Findings

- **Flagged by:** TypeScript reviewer (medium priority), Security sentinel (low), Architecture strategist (noted)
- 5/6 agents approved the overall approach but the TypeScript reviewer specifically called this the "single most important change"
- The fallback path at lines 26-40 is well-implemented and handles all conversion scenarios

**Evidence:**
```typescript
// Current (lines 20-23):
if (typeof wallet.getChangeAddressBech32 === "function") {
  return wallet.getChangeAddressBech32(); // If this throws, fallback never runs
}
```

## Proposed Solutions

### Option A: Wrap happy path in try/catch (Recommended)
**Pros:** Belt-and-suspenders defense, covers both failure modes
**Cons:** None meaningful
**Effort:** Small (5 min)
**Risk:** None

```typescript
if (typeof wallet.getChangeAddressBech32 === "function") {
  try {
    return await wallet.getChangeAddressBech32();
  } catch {
    // Method exists but threw — fall through to getChangeAddress fallback
  }
}
```

## Recommended Action

Option A.

## Technical Details

**Affected files:**
- `src/lib/wallet-address.ts` (lines 21-23)

## Acceptance Criteria

- [ ] Happy path wrapped in try/catch
- [ ] Fallback executes when v2 method throws
- [ ] Build passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #325 review | 5/6 agents flagged; typeof check is necessary but not sufficient |

## Resources

- PR #325: https://github.com/Andamio-Platform/andamio-app-v2/pull/325
