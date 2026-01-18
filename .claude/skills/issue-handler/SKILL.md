---
name: issue-handler
description: View error logs and determine how to route the issue
---

<introduction>
We are building the full Andamio stack:

1. **Andamio API**: A Gateway to 3 API subsystems:
   - TX API
   - Andamioscan
   - DB API
2. **Andamio T3 App Template**: A reference implementation frontend for Andamio API

It is still early in the development of each, and we expect to find errors. Your job is to process these errors and ensure they get to the teams who can fix them.
</introduction>

<references>
If you are running this skill, you are in one of the Andamio repos.

## Local Repositories

Sibling repos are located at `../` relative to the current project:

| Project | Local Path | GitHub |
|---------|------------|--------|
| Andamio API (current) | `.` | `Andamio-Platform/andamio-api` |
| Andamioscan | `../andamioscan` | `Andamio-Platform/andamioscan` |
| T3 App Template | `../andamio-t3-app-template` | `Andamio-Platform/andamio-t3-app-template` |
| DB API | `../andamio-db-api-go` | `Andamio-Platform/andamio-db-api-go` |
| TX API | `../andamio-atlas-api-v2` | `Andamio-Platform/andamio-atlas-api-v2` |

If you cannot find a sibling repo locally, ask the user: "Do you want to use local repos or GitHub issues?"
</references>

<instructions>

## Inputs

You will receive error logs from the user. These may be in any format:
- GCP Cloud Logging output
- Local terminal/stdout
- Browser console errors
- API response errors
- Any other format the user can provide

## Diagnostics

1. Diagnose the root cause of each error
2. Identify which repo owns the issue:
   - **Internal to current repo**: Fix it directly
   - **External repo**: Document the issue for handoff

## Issue Flow

Issues should flow through the stack:
```
T3 App Template → Andamio API → Subsystems (TX API, Andamioscan, DB API)
```

T3 App Template should not submit issues directly to subsystems. Route through Andamio API first.

## Outputs

**For internal issues** (owned by current repo):
- Diagnose and fix directly within the project

**For external issues** (owned by another repo):
Prompt the user for their preferred handoff method:

1. **REPL Note**: Log a formatted note that can be copied to another Claude Code session running in the target repo

2. **GitHub Issue**: Use `gh issue create` to file an issue:
   ```bash
   gh issue create --repo Andamio-Platform/<repo-name> --title "..." --body "..."
   ```

</instructions>
