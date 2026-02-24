---
status: pending
priority: p3
issue_id: "004"
tags: [code-review, security]
dependencies: []
---

# Information Leakage in Proxy Error Responses

## Problem Statement

The gateway and Koios proxy routes return upstream error bodies verbatim to the client via a `details` field. In production, these could contain internal server information, stack traces, database errors, or infrastructure details from the upstream gateway.

**Why it matters:** Defense-in-depth. Error details from upstream servers should not be exposed to end users in production.

## Findings

- **1 of 7 review agents** flagged this (Security Sentinel)
- Gateway proxy returns: `{ error: "Gateway API error: ...", details: errorBody }`
- Koios proxy returns similar pattern
- Catch blocks return: `{ error: "Failed to fetch from Gateway", details: error.message }`

## Proposed Solutions

### Option A: Gate details behind isDev
**Pros:** Simple, consistent with logging pattern
**Cons:** Makes debugging harder in production
**Effort:** Small
**Risk:** Low

```typescript
const clientDetails = isDev ? errorBody : undefined;
return NextResponse.json(
  { error: `Gateway API error: ${response.status}`, ...(clientDetails && { details: clientDetails }) },
  { status: response.status }
);
```

## Acceptance Criteria

- [ ] Error `details` only returned in development
- [ ] Full error still logged server-side via `console.error`
- [ ] Generic error message in production

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-02-24 | Created from PR #320 review | Pre-existing pattern |

## Resources

- PR #320: https://github.com/Andamio-Platform/andamio-app-v2/pull/320
