---
status: complete
priority: p2
issue_id: "001"
tags: [code-review, security, consistency]
dependencies: []
---

# Koios Proxy Console Logging Not Gated Behind NODE_ENV

## Problem Statement

The Koios API proxy at `src/app/api/koios/[...path]/route.ts` has unconditional `console.log` statements on lines 30 and 82 that log every incoming request URL in all environments. This contradicts the PR's stated goal of gating "29 console.log calls in server routes behind NODE_ENV" and is inconsistent with the gateway proxy and sponsor-migrate routes which correctly gate logging behind `isDev`.

**Why it matters:** Production log noise, potential information leakage of query parameters containing wallet addresses or policy IDs, and inconsistency across proxy routes.

## Findings

- **5 of 7 review agents** flagged this issue independently (Security, Architecture, TypeScript, Simplicity, Agent-Native)
- Gateway proxy (`src/app/api/gateway/[...path]/route.ts`) correctly uses `const isDev = process.env.NODE_ENV === "development"` guard
- Sponsor-migrate route correctly uses the same `isDev` guard
- Koios proxy was touched in this PR (network-aware URL change) but logging was not gated

**Evidence:**
```typescript
// Line 30 - GET handler (ungated)
console.log(`[Koios Proxy] Proxying request to: ${koiosUrl}`);

// Line 82 - POST handler (ungated)
console.log(`[Koios Proxy] Proxying POST request to: ${koiosUrl}`);
```

## Proposed Solutions

### Option A: Add isDev gate (Recommended)
**Pros:** Matches gateway proxy pattern exactly, minimal change
**Cons:** None
**Effort:** Small (5 min)
**Risk:** None

```typescript
const isDev = process.env.NODE_ENV === "development";
// ...
if (isDev) {
  console.log(`[Koios Proxy] Proxying request to: ${koiosUrl}`);
}
```

## Recommended Action

Option A - straightforward consistency fix.

## Technical Details

**Affected files:**
- `src/app/api/koios/[...path]/route.ts` (lines 30, 82)

## Acceptance Criteria

- [ ] Both `console.log` calls in Koios proxy gated behind `isDev`
- [ ] Pattern matches gateway proxy exactly
- [ ] Build passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | 5/7 agents flagged independently |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
- Gateway proxy pattern: `src/app/api/gateway/[...path]/route.ts:43-55`
