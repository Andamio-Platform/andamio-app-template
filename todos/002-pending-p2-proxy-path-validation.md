---
status: pending
priority: p2
issue_id: "002"
tags: [code-review, security, architecture]
dependencies: []
---

# Open Proxy Routes - No Path Validation or Allowlisting

## Problem Statement

All three API proxy routes (`gateway`, `koios`, `gateway-stream`) use catch-all `[...path]` parameters and forward arbitrary paths to upstream servers without any validation or allowlisting. The gateway proxy attaches the app's `ANDAMIO_API_KEY` to every proxied request, meaning an attacker could use the proxy to access any upstream gateway endpoint billed to the app developer.

**Why it matters:** Defense-in-depth against SSRF, unrestricted API surface exposure, and potential billing abuse. While the upstream gateway likely validates requests, the proxy itself provides no guardrails.

## Findings

- **2 of 7 review agents** flagged this (Security, Architecture)
- Security sentinel rated this as HIGH severity pre-existing issue
- The proxy blindly joins path segments: `const gatewayPath = path.join("/")`
- `X-API-Key` is injected into every request regardless of path
- Query parameters passed through verbatim

**Affected routes:**
- `src/app/api/gateway/[...path]/route.ts`
- `src/app/api/koios/[...path]/route.ts`
- `src/app/api/gateway-stream/[...path]/route.ts`

## Proposed Solutions

### Option A: Path prefix allowlist (Recommended)
**Pros:** Simple, defensive, doesn't break existing functionality
**Cons:** Requires maintaining the allowlist when new API paths are added
**Effort:** Small
**Risk:** Low

```typescript
const ALLOWED_PREFIXES = ["api/v2/", "api/v1/"];
const gatewayPath = path.join("/");
if (!ALLOWED_PREFIXES.some(prefix => gatewayPath.startsWith(prefix))) {
  return NextResponse.json({ error: "Invalid path" }, { status: 400 });
}
```

### Option B: Full path allowlist with patterns
**Pros:** Maximum control, explicit API surface documentation
**Cons:** Higher maintenance, could break on new endpoints
**Effort:** Medium
**Risk:** Medium (could block legitimate new endpoints)

### Option C: Accept current risk (Document only)
**Pros:** No code changes needed
**Cons:** Leaves the SSRF surface open
**Effort:** None
**Risk:** Pre-existing risk remains

## Recommended Action

_To be decided during triage._

## Technical Details

**Affected files:**
- `src/app/api/gateway/[...path]/route.ts`
- `src/app/api/koios/[...path]/route.ts`
- `src/app/api/gateway-stream/[...path]/route.ts`

## Acceptance Criteria

- [ ] Proxy routes validate path segments before forwarding
- [ ] Invalid paths return 400 with generic error
- [ ] All existing frontend API calls still work
- [ ] Build passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | Pre-existing issue, not introduced by this PR |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
- OWASP SSRF Prevention: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
