---
name: issue-handler
description: View error logs and determine how to route the issue
---

<introduction>
We are building the full Andamio stack:

1. **Andamio API Gateway**: A unified gateway that consolidates all backend services
   - Authentication and user management
   - Course and Project data (merged on-chain + off-chain)
   - Transaction building endpoints
   - TX state machine (pending transaction tracking)
2. **Andamio T3 App Template**: A reference implementation frontend for the Andamio API Gateway

It is still early in the development of each, and we expect to find errors. Your job is to process these errors and ensure they get to the teams who can fix them.
</introduction>

<references>
If you are running this skill, you are in one of the Andamio repos.

## Architecture (Unified Gateway)

All API calls now flow through the unified Andamio API Gateway:

```
Frontend (T3 Template)
    │
    ▼
/api/gateway/[...path] (Next.js proxy)
    │
    ▼
Andamio API Gateway (unified)
    ├── /api/v2/auth/*     → Authentication
    ├── /api/v2/course/*   → Course data (merged)
    ├── /api/v2/project/*  → Project data (merged)
    └── /api/v2/tx/*       → Transaction building
```

## Local Repositories

Sibling repos are located at `../` relative to the current project:

| Project | Local Path | GitHub | Purpose |
|---------|------------|--------|---------|
| Andamio API Gateway | `../andamio-api` | `Andamio-Platform/andamio-api` | Unified API gateway (primary backend) |
| T3 App Template | `.` or `../andamio-t3-app-template` | `Andamio-Platform/andamio-t3-app-template` | Frontend reference implementation |
| Andamioscan | `../andamioscan` | `Andamio-Platform/andamioscan` | On-chain data indexer (internal to gateway) |

**Note**: The gateway consolidates what was previously 3 separate APIs (DB API, TX API, Andamioscan). Issues should generally be routed to the gateway team first.

If you cannot find a sibling repo locally, ask the user: "Do you want to use local repos or GitHub issues?"
</references>

<instructions>

## Inputs

You will receive error logs from the user. These may be in any format:
- GCP Cloud Logging output
- Local terminal/stdout
- Browser console errors
- API response errors (from /api/gateway/* proxy)
- Any other format the user can provide

## Diagnostics

1. Diagnose the root cause of each error
2. Identify where the issue originates:
   - **Frontend (T3 Template)**: React components, hooks, client-side code
   - **Gateway API**: Server-side errors, endpoint issues, validation
   - **Andamioscan**: On-chain data indexing issues

## Issue Flow

Issues should flow through the stack:
```
T3 App Template → Andamio API Gateway → Backend teams
```

**Frontend issues**: Fix directly in T3 Template
**API issues**: Route to Gateway team (andamio-api repo)
**Indexing issues**: Route through Gateway team (they coordinate with Andamioscan)

## Common Error Patterns

| Error Pattern | Likely Source | Action |
|---------------|---------------|--------|
| `401 Unauthorized` | Frontend auth or expired JWT | Check auth context, JWT storage |
| `404 Not Found` | Wrong endpoint path | Check gateway proxy path mapping |
| `500 Internal Server Error` | Gateway backend | Route to andamio-api |
| `Type mismatch` | Generated types out of sync | Run `npm run generate:types` |
| `Network error` | Gateway URL or CORS | Check env vars, proxy config |
| `On-chain data missing` | Indexer lag | Wait or check Andamioscan |

## Outputs

**For frontend issues** (owned by T3 Template):
- Diagnose and fix directly within the project

**For backend issues** (owned by Gateway):
Prompt the user for their preferred handoff method:

1. **REPL Note**: Log a formatted note that can be copied to another Claude Code session running in the target repo

2. **GitHub Issue**: Use `gh issue create` to file an issue:
   ```bash
   gh issue create --repo Andamio-Platform/andamio-api --title "..." --body "..."
   ```

## Issue Template

When routing to another repo, include:

```markdown
## Error Summary
[One-line description]

## Error Details
[Full error message/stack trace]

## Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Expected vs actual]

## Environment
- T3 Template branch: [branch]
- Gateway URL: [url]
- Network: preprod/mainnet

## Diagnosis
[Your analysis of the root cause]
```

</instructions>
