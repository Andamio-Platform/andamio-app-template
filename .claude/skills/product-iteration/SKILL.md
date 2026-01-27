---
name: product-iteration
description: Orchestrate the full product iteration cycle - from user testing through design proposals to backlog management.
---

# Product Iteration

Orchestrate the complete product feedback loop: **Test → Design → Ship**.

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      /product-iteration                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌─────────┐ │
│  │  TEST    │ ───▶ │  DESIGN  │ ───▶ │  TRIAGE  │ ───▶ │  SHIP   │ │
│  │ (Phase 1)│      │ (Phase 2)│      │ (Phase 3)│      │(Phase 4)│ │
│  └──────────┘      └──────────┘      └──────────┘      └─────────┘ │
│       │                 │                 │                 │       │
│       ▼                 ▼                 ▼                 ▼       │
│   Feedback          Proposals         Backlog            PR/       │
│   Digest            + Specs           Items              Commit    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Phases

### Phase 1: TEST (UX Research)

Guide user through testing flows and collect structured feedback.

**Activities:**
- Run transaction loops (delegates to tx-loop-guide patterns)
- Observe user behavior and friction points
- Document bugs, confusion, missing features
- Create blocker issues immediately

**Output:** Feedback Digest (saved to `./artifacts/feedback-{date}.md`)

**Transition:** User says "done testing" or "let's design"

### Phase 2: DESIGN (Product Designer)

Analyze feedback and propose concrete solutions.

**Activities:**
- Review feedback digest
- Identify root causes (not just symptoms)
- Propose UI/UX changes with rationale
- Consider technical feasibility
- Sketch component changes needed

**Output:** Design Proposal (saved to `./artifacts/proposal-{date}.md`)

**Transition:** User approves proposal or requests changes

### Phase 3: TRIAGE (Product Manager)

Prioritize work and manage the backlog.

**Activities:**
- Score proposals by impact vs effort
- Group related items
- Create GitHub Issues with proper labels
- Update project board (if configured)
- Decide what ships now vs later

**Output:** GitHub Issues created, backlog updated

**Transition:** User says "let's implement" or selects specific items

### Phase 4: SHIP (Implementation)

Execute on prioritized items.

**Activities:**
- Pick highest priority item from backlog
- Implement the fix/feature
- Create PR with proper description
- Link PR to GitHub Issue

**Output:** Pull Request

## Usage

### Start Fresh Iteration

```
/product-iteration
```

The skill will:
1. Check for existing iteration state
2. If none, start at Phase 1 (TEST)
3. If exists, resume from current phase

### Jump to Specific Phase

```
/product-iteration test     # Start/continue testing
/product-iteration design   # Jump to design phase
/product-iteration triage   # Jump to triage phase
/product-iteration ship     # Jump to implementation
```

### Check Status

```
/product-iteration status
```

Shows current phase, pending artifacts, and next actions.

## State Management

State is tracked in `./state.json`:

```json
{
  "currentPhase": "design",
  "iteration": "2026-01-26",
  "artifacts": {
    "feedback": "artifacts/feedback-2026-01-26.md",
    "proposal": null,
    "issues": []
  },
  "history": [
    {"phase": "test", "completed": "2026-01-26T10:30:00Z", "artifact": "..."}
  ]
}
```

## Artifact Templates

### Feedback Digest (Phase 1 Output)

See [templates/feedback-digest.md](./templates/feedback-digest.md)

### Design Proposal (Phase 2 Output)

See [templates/design-proposal.md](./templates/design-proposal.md)

### Backlog Item (Phase 3 Output)

See [templates/backlog-item.md](./templates/backlog-item.md)

## Integration with Existing Skills

| Phase | Delegates To | For What |
|-------|--------------|----------|
| TEST | `tx-loop-guide` patterns | Transaction flow testing |
| DESIGN | `design-system` | Component patterns, styling |
| TRIAGE | `project-manager` | Priority context, roadmap alignment |
| SHIP | `review-pr` | PR quality, code review |

The orchestrator doesn't replace these skills - it coordinates them.

## GitHub Integration

### Labels Used

| Label | Meaning |
|-------|---------|
| `iteration:{date}` | Groups items from same iteration |
| `type:bug` | Blocker or bug found in testing |
| `type:ux` | UX improvement |
| `type:feature` | New feature request |
| `priority:p0` | Ship immediately |
| `priority:p1` | Ship this sprint |
| `priority:p2` | Backlog |

### Project Board (Optional)

If configured, items are added to a GitHub Project board:
- **To Do** - Triaged items
- **In Progress** - Being worked on
- **Review** - PR created
- **Done** - Merged

## Example Session

```
User: /product-iteration

Claude: I'll check the current iteration state...

No active iteration found. Starting fresh.

**Phase 1: TEST**

I'll guide you through user testing. Based on loop-history.md,
Loop 2 (Earn a Credential) is the priority - student flows need validation.

Ready to start testing? Or would you like to:
- Test a specific flow
- Skip to design (if you have feedback already)
- Check the backlog

User: Let's test the enrollment flow

Claude: Great! Starting enrollment flow test.

**Step 1:** Navigate to Browse Courses and try to enroll in a course.

[...testing continues, feedback collected...]

User: Done testing for now

Claude: Creating feedback digest...

**Feedback Digest Created:** `artifacts/feedback-2026-01-26.md`

Summary:
- 3 UX friction points identified
- 1 blocker bug (issue #92 created)
- 2 feature requests noted

Ready to move to **Phase 2: DESIGN**? I'll analyze the feedback
and propose solutions.

User: Yes, let's design

Claude: Moving to Phase 2: DESIGN

Analyzing feedback digest...

**Design Proposal:**

1. **Enrollment button visibility** (High impact, Low effort)
   - Problem: Users couldn't find the enroll button
   - Proposal: Move to card header, use primary variant
   - Files: `course-card.tsx`

2. **Loading state feedback** (Medium impact, Low effort)
   - Problem: No indication during transaction
   - Proposal: Add spinner + "Enrolling..." text
   - Files: `enroll-button.tsx`

[...continues with proposals...]

Shall I save this proposal and move to **Phase 3: TRIAGE**?

User: Yes

Claude: Moving to Phase 3: TRIAGE

**Proposal saved:** `artifacts/proposal-2026-01-26.md`

Scoring items by impact vs effort...

| # | Item | Impact | Effort | Score | Priority |
|---|------|--------|--------|-------|----------|
| 1 | Enrollment button | High | Low | 9 | P0 |
| 2 | Loading state | Med | Low | 7 | P1 |
| 3 | Feature request | Low | High | 3 | P2 |

Creating GitHub Issues...
- Issue #93: Enrollment button visibility (P0)
- Issue #94: Loading state feedback (P1)
- Issue #95: Feature request (P2, backlog)

Ready to **SHIP**? I recommend starting with Issue #93.

User: Let's ship #93

Claude: Moving to Phase 4: SHIP

Implementing Issue #93: Enrollment button visibility...

[...implementation...]

PR #96 created: "Improve enrollment button visibility"
- Linked to Issue #93
- Ready for review

Iteration complete! Run `/product-iteration` to start a new cycle.
```

## Instructions for Claude

When this skill is invoked:

### 1. Load State

```typescript
// Read state.json, create if doesn't exist
const state = await readState() ?? createFreshState();
```

### 2. Determine Phase

- If user provided phase argument (`/product-iteration design`), go there
- Otherwise, continue from `state.currentPhase`

### 3. Execute Phase

Each phase has specific behaviors:

**TEST Phase:**
- Use tx-loop-guide patterns for structured testing
- Collect feedback in memory during session
- Create blocker issues immediately with `gh issue create`
- On transition, save feedback digest to artifacts/

**DESIGN Phase:**
- Read the latest feedback artifact
- Analyze patterns and root causes
- Generate proposals using design-proposal template
- Consider design-system guidelines
- On transition, save proposal to artifacts/

**TRIAGE Phase:**
- Read the latest proposal artifact
- Score each item (Impact: 1-5, Effort: 1-5, Score = Impact * (6-Effort))
- Assign priorities: P0 (score >= 8), P1 (score >= 5), P2 (rest)
- Create GitHub Issues with `gh issue create`
- Add labels: `iteration:{date}`, `type:{bug|ux|feature}`, `priority:{p0|p1|p2}`
- Update state with issue numbers

**SHIP Phase:**
- Show prioritized backlog from state
- User selects item to implement
- Implement the fix
- Create PR with `gh pr create`
- Link to issue in PR body

### 4. Handle Transitions

Transitions happen when:
- User explicitly requests: "let's design", "move to triage", etc.
- Phase naturally completes (all items tested, proposal approved, etc.)

On transition:
1. Save current phase artifact
2. Update state.json
3. Announce new phase
4. Begin new phase activities

### 5. Maintain Artifacts

All artifacts go in `./artifacts/` with date-stamped names:
- `feedback-{YYYY-MM-DD}.md`
- `proposal-{YYYY-MM-DD}.md`

Multiple iterations on the same day append a counter:
- `feedback-2026-01-26.md`
- `feedback-2026-01-26-2.md`