---
status: pending
priority: p3
issue_id: "011"
tags: [code-review, architecture, api, agent-native]
dependencies: []
---

# Track API Gap: Commitment Endpoint Should Reflect Credential Claiming

## Problem Statement

The commitment API permanently returns `ASSIGNMENT_ACCEPTED` after a credential is claimed because credential claiming is a separate on-chain transaction that does not update the commitment record. The frontend works around this by cross-referencing two API endpoints. This creates complexity for any consumer (UI, agent, or third-party integration) that needs the "true" lifecycle status of a module.

**Why it matters:** The current workaround is sound but creates coupling. Any new consumer (agent tool, dashboard, mobile app) would need to replicate the client-side join logic.

## Findings

- Architecture, Agent-Native, and TypeScript reviewers all identified this as a longer-term concern
- Agent-Native reviewer notes: "An agent calling the commitment API alone would see `ASSIGNMENT_ACCEPTED` when the real status is `CREDENTIAL_CLAIMED`"
- The workaround is well-documented with inline comments in the PR

## Proposed Solutions

### Option A: API enhancement (Recommended long-term)

Request that the Gateway API's `/api/v2/course/student/assignment-commitments/list` endpoint cross-reference credential ownership data and return `CREDENTIAL_CLAIMED` status when appropriate.

- **Pros:** Single source of truth, eliminates client-side joins, benefits all consumers
- **Cons:** Requires API team coordination
- **Effort:** Medium (API side)
- **Risk:** Low

### Option B: Accept the frontend workaround

The current approach works, is documented, and can be shared via a composed hook (todo #009).

- **Pros:** No API changes needed
- **Cons:** Every consumer must replicate the join logic
- **Effort:** None
- **Risk:** Low — bounded complexity

## Recommended Action

File a GitHub issue on `andamio-api` requesting the enhancement. In the meantime, the frontend workaround via a shared hook (todo #009) is sufficient.

## Acceptance Criteria

- [ ] GitHub issue filed on andamio-api
- [ ] Frontend hook (todo #009) serves as interim solution

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-02-24 | Created | From PR #322 code review — 3/7 agents flagged |

## Resources

- PR #322: https://github.com/andamio-platform/andamio-app-v2/pull/322
- Commitment API: `POST /api/v2/course/student/assignment-commitments/list`
- Credentials API: `POST /api/v2/course/student/credentials/list`
