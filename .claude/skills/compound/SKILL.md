---
name: compound
description: Capture session learnings into skill files, CLAUDE.md, and memory — step 9 of the development pipeline.
---

# Compound

**Purpose**: After completing work and before finishing a branch, extract learnings from the current session and apply them to the project's knowledge base — skill files, CLAUDE.md, and auto memory.

> **Last Updated**: February 20, 2026

## When to Use

- Step 9 of the development pipeline (after Review + Verify, before Finish)
- After discovering a workaround, anti-pattern, or unexpected behavior
- After improving a skill's workflow based on real usage
- When the user says `/compound` or asks to "capture learnings"

## Data Sources

| Source | What It Provides |
|--------|-----------------|
| Current conversation | Mistakes made, fixes applied, unexpected behaviors |
| Skill files (`.claude/skills/*/SKILL.md`) | Existing instructions that may need updating |
| `CLAUDE.md` | Project rules that may need new entries |
| Auto memory (`memory/*.md`) | Persistent cross-session knowledge |

## Workflow

### Step 1: Scan the Session for Learnings

Review the current conversation and identify:

| Category | Examples |
|----------|---------|
| **Gotchas** | Subagents reading wrong branch, npm install needed in worktree |
| **Anti-patterns** | Patterns that looked right but caused bugs |
| **New conventions** | Naming rules, file organization, workflow steps discovered |
| **Skill gaps** | Missing instructions that caused wasted effort |
| **Tool behaviors** | Unexpected tool results, edge cases in CLI commands |

Produce a numbered list of learnings, each tagged with where it belongs:

```
1. [skill: review-pr] Subagent reviewers must use gh pr diff, not file reads
2. [memory: patterns.md] Git worktree needs npm install before typecheck
3. [CLAUDE.md] New rule: never use -uall flag with git status
```

### Step 2: Classify Destinations

For each learning, determine the correct destination:

| If the learning is about... | Write to... |
|-----------------------------|-------------|
| A specific skill's workflow | `.claude/skills/<skill>/SKILL.md` |
| A codebase convention or rule | `.claude/CLAUDE.md` |
| A cross-session pattern or operational note | `memory/<topic>.md` |
| A new decision or preference | `memory/patterns.md` |
| Current project state (branches, PRs) | `memory/current-state.md` |

**Decision rule**: If the learning would help a *fresh session* avoid a mistake, it belongs in a skill file or CLAUDE.md. If it's operational context that only matters for continuity, it belongs in memory.

### Step 3: Present the Plan

Show the user a summary table before making changes:

```markdown
| # | Learning | Destination | Action |
|---|---------|-------------|--------|
| 1 | Batch PR review needs diff-based input | `review-pr/SKILL.md` | Add "Batch Review" section |
| 2 | Worktree needs npm install | `memory/patterns.md` | Add to "Git Operational Notes" |
| 3 | ... | ... | ... |
```

Ask: **"Apply these changes?"** Wait for confirmation before editing files.

### Step 4: Apply Changes

Edit each destination file. Follow these rules:

**For skill files**:
- Add new sections rather than rewriting existing ones
- Include the date in any "Why This Matters" notes
- Keep instructions actionable — not narrative

**For CLAUDE.md**:
- Only add rules that are stable and confirmed across multiple interactions
- Keep entries concise (one line per rule when possible)
- Place in the correct section (Critical Rules, Architecture, etc.)

**For memory files**:
- Use the existing heading structure
- Link new entries from `MEMORY.md` if they create a new topic
- Keep `MEMORY.md` under 200 lines (it's loaded into every prompt)

### Step 5: Verify

```bash
# Skill files are valid markdown
ls .claude/skills/*/SKILL.md

# CLAUDE.md hasn't exceeded reasonable length
wc -l .claude/CLAUDE.md

# Memory index is under 200 lines
wc -l memory/MEMORY.md
```

### Step 6: Summarize

Report what was updated:

```markdown
## Compound Summary

**Learnings captured**: N
**Files updated**: list of files
**New sections added**: list of sections

Ready for `/ship` or `superpowers:finishing-a-development-branch`.
```

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `review-pr` | Compound often improves review-pr after batch reviews reveal gaps |
| `claude-md-management:revise-claude-md` | Compound handles targeted updates; revise-claude-md does full audits |
| `bootstrap-skill` | If compound identifies a missing skill, hand off to bootstrap-skill |
| `ship` | Compound runs before ship — learnings are committed with the feature |

## Anti-Patterns

| Anti-Pattern | Why It's Bad | Instead |
|-------------|--------------|---------|
| Writing speculative learnings | Untested assumptions pollute the knowledge base | Only compound things you've verified in this session |
| Duplicating CLAUDE.md rules in memory | Two sources of truth → drift | CLAUDE.md for rules, memory for context |
| Adding session-specific state to skill files | Next session reads stale context | Use `memory/current-state.md` for ephemeral state |
| Skipping the presentation step | User doesn't know what changed | Always show the plan table first |

## Examples

### Example 1: After a PR review session

```
User: /compound

Compound scan found 2 learnings:

| # | Learning | Destination | Action |
|---|---------|-------------|--------|
| 1 | Subagent reviewers read from working dir, not PR branch | `review-pr/SKILL.md` | Add "Batch Review" section with diff-based strategy |
| 2 | Git worktree needs npm install before typecheck | `memory/patterns.md` | Add to "Subagent Review Patterns" |

Apply these changes?
```

### Example 2: After a feature implementation

```
User: /compound

Compound scan found 3 learnings:

| # | Learning | Destination | Action |
|---|---------|-------------|--------|
| 1 | LEFT commitments must be filtered from learner counts | `memory/patterns.md` | Add "Commitment status filtering" pattern |
| 2 | `formatCommitmentStatus` utility exists in format-status.ts | `.claude/CLAUDE.md` | Add to Architecture section |
| 3 | ConfirmDialog pattern: idle→dialog, !idle→TransactionButton | `memory/patterns.md` | Add to "UI Patterns" |

Apply these changes?
```
