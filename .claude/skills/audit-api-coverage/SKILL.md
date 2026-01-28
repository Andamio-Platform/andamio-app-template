---
name: audit-api-coverage
description: Audit the usage of Andamio API endpoints across all three sub-systems.
---

# Audit API Coverage

Track which Andamio Gateway API endpoints are implemented in the app.

## Purpose

This skill answers one question: **"Which API endpoints have hooks/implementations?"**

For hook patterns, creating hooks, or auditing hook quality, use `/hooks-architect` instead.

## Quick Links

| Resource | Description |
|----------|-------------|
| [API Docs](https://dev.api.andamio.io/api/v1/docs/index.html) | Live Swagger UI |
| [OpenAPI Spec](https://dev.api.andamio.io/api/v1/docs/doc.json) | Machine-readable spec |

## Reference Files

| File | Purpose |
|------|---------|
| [api-coverage.md](./api-coverage.md) | Endpoint-by-endpoint implementation status |
| [unified-api-endpoints.md](./unified-api-endpoints.md) | Full list of gateway endpoints |
| [tx-state-machine.md](./tx-state-machine.md) | TX registration and polling flow |

## Coverage Summary

| Category | Total | Implemented | Coverage |
|----------|-------|-------------|----------|
| Authentication | 6 | 6 | **100%** |
| API Key | 6 | 6 | **100%** |
| Courses | 41 | ~28 | **~68%** |
| Projects | 17 | ~14 | **~82%** |
| TX: All | 21 | 21 | **100%** |
| Admin | 4 | 0 | **0%** |
| User Mgmt | 4 | 1 | **25%** |

**Overall**: ~71% of endpoints have implementations.

## Running the Audit

### Quick Check

```bash
# Run the audit script
npx tsx .claude/skills/audit-api-coverage/scripts/audit-coverage.ts
```

### Manual Check

For a specific endpoint category, check [api-coverage.md](./api-coverage.md) and look for:
- `DONE` - Implemented and hooked
- `TODO` - Not yet implemented
- `SKIP` - Deprecated or not needed

## Key Directories

| Directory | Contents |
|-----------|----------|
| `src/hooks/api/course/` | Course endpoint hooks |
| `src/hooks/api/project/` | Project endpoint hooks |
| `src/lib/andamio-auth.ts` | Auth endpoint implementations |
| `src/config/` | Transaction endpoint config |

## Related Skills

| Skill | When to Use |
|-------|-------------|
| `/hooks-architect` | **For hook patterns, creating hooks, auditing hook quality** |
| `/transaction-auditor` | TX schema sync with gateway spec |
| `/typescript-types-expert` | Type issues with API responses |

## When to Update Coverage

Update [api-coverage.md](./api-coverage.md) when:
1. A new hook is created that covers an endpoint
2. The gateway adds new endpoints (check OpenAPI spec)
3. An endpoint is deprecated or removed

## Migration Note

**Hook patterns and rules have moved to `/hooks-architect`.**

This skill now focuses purely on endpoint coverage metrics. For:
- Learning hook patterns → `/hooks-architect` Learn mode
- Creating new hooks → `/hooks-architect` Implement mode
- Auditing hook quality → `/hooks-architect` Audit mode
- Extracting API calls → `/hooks-architect` Extract mode

---

**Last Updated**: January 28, 2026
