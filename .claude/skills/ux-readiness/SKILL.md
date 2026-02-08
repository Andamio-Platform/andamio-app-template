---
name: ux-readiness
description: Assess whether app flows are ready to document, create blocking issues, and sync readiness state with the guide pipeline in the docs repo.
---

# UX Readiness

Evaluates app flows for documentation readiness. Works cross-repo with the `guide-pipeline` skill in the docs repo — this skill assesses and writes UX scores, that skill consumes them to gate guide writing.

## Tracker Location

The shared tracker lives in the docs repo:
```
~/projects/01-projects/andamio-docs/.claude/skills/guide-pipeline/guide-tracker.json
```

This skill reads and writes to that file via absolute path. Changes appear as unstaged modifications in the docs repo.

## Commands

### `/ux-readiness` or `/ux-readiness status`

Display UX readiness dashboard for all guides.

**Steps:**

1. Read tracker from docs repo path above
2. Display dashboard:

```
| Guide | Role | UX Score | Blockers | Friction | Last Assessed |
|-------|------|----------|----------|----------|---------------|
```

3. Show summary: total assessed vs not-assessed, blocked, friction, ready
4. Highlight guides where `score` is `not-assessed` — these need `/ux-readiness assess <id>`
5. Note any guides marked as PRIORITY in their history

---

### `/ux-readiness assess <id>`

Run a full UX readiness assessment for a specific guide.

**Steps:**

1. Read tracker, find guide by `id`
2. Get the guide's `appRoutes` array
3. **Inspect each route**:
   - Use ROLES-AND-ROUTES.md (`.claude/skills/project-manager/ROLES-AND-ROUTES.md`) to understand the route's role and purpose
   - Read the route's page component and key child components
   - Check for known issues via GitHub:
     ```bash
     gh issue list --repo Andamio-Platform/andamio-app-v2 --search "label:documentation,ux-readiness" --state open --json number,title,labels
     ```
   - Also search for route-specific issues:
     ```bash
     gh issue list --repo Andamio-Platform/andamio-app-v2 --search "<route-keyword>" --state open --json number,title,labels
     ```

4. **Apply assessment criteria** (see `assessment-criteria.md`):
   - Check for **blockers**: TX failures, route crashes, data not loading, impossible steps
   - Check for **friction**: jargon, missing loading states, confusing navigation, unclear copy
   - Check for **readiness**: flow completes start to finish with clear UX

5. **Create issues for problems found**:
   - For each new problem, create a GitHub issue:
     ```bash
     gh issue create \
       --repo Andamio-Platform/andamio-app-v2 \
       --title "<problem summary>" \
       --body "Found during UX readiness assessment for guide: **<guide title>** (<guide id>)\n\n## Problem\n<description>\n\n## Route\n<route path>\n\n## Severity\n<blocker|friction>\n\n---\nFiled via \`/ux-readiness assess\`" \
       --label "documentation,ux-readiness"
     ```
   - Capture issue numbers from output

6. **Update tracker**:
   - Add new issues to `blockerIssues` or `frictionIssues` arrays
   - Calculate score:
     - Any open blocker → `blocked`
     - No blockers but open friction → `friction`
     - No open issues → `ready`
   - Set `lastAssessed` to today
   - Add history entry: `"YYYY-MM-DD: Assessed — {score} ({N} blockers, {M} friction)"`
   - Recalculate summary counts

7. Write tracker back to docs repo path
8. Report results with the score and list of issues created

---

### `/ux-readiness sync`

Refresh all blocker/friction issue states and recalculate scores.

**Steps:**

1. Read tracker from docs repo
2. Collect all unique issue numbers across all guides
3. For each issue, query current state:
   ```bash
   gh issue view <NUMBER> --repo Andamio-Platform/andamio-app-v2 --json state,title
   ```
4. Update each issue's `state` in the tracker
5. Recalculate each guide's UX score:
   - All blockers closed + all friction closed → `ready`
   - All blockers closed + some friction open → `friction`
   - Any blocker open → `blocked`
   - No issues at all + never assessed → `not-assessed`
6. Recalculate summary counts
7. Write tracker
8. Report changes:
   - Issues that changed state
   - Guides whose score changed
   - Guides now eligible for documentation

---

### `/ux-readiness signal <id> ready|blocked`

Manually override a guide's UX score (for cases where automated assessment isn't sufficient).

**Steps:**

1. Read tracker, find guide by `id`
2. Set `uxReadiness.score` to the provided value
3. Set `lastAssessed` to today
4. Add history entry: `"YYYY-MM-DD: Manually signaled {score} by developer"`
5. Recalculate summary counts
6. Write tracker
7. Confirm the change

---

## Integration with Other App Skills

| Skill | Relationship |
|-------|-------------|
| `product-iteration` | UX readiness is a formalized TEST phase output. After shipping fixes from a product-iteration cycle, run `/ux-readiness sync` to check if blockers cleared. |
| `qa` | QA checklist results overlap with readiness criteria. A route that fails QA likely has friction or blocker issues for documentation. |
| `project-manager` | STATUS.md blockers may correspond to guide blockers. ROLES-AND-ROUTES.md maps which routes each guide covers. |
| `issue-handler` | Issues created by this skill route through the same system. Labels `documentation` + `ux-readiness` distinguish guide-related issues. |

## Cross-Repo Details

- **Tracker path**: `~/projects/01-projects/andamio-docs/.claude/skills/guide-pipeline/guide-tracker.json`
- **No git ops cross-repo**: This skill reads/writes the file directly. The docs repo sees unstaged changes.
- **Issue queries**: All via `gh issue view/list --repo Andamio-Platform/andamio-app-v2`
- **Partner skill**: `/guide-pipeline` in the docs repo consumes the scores written here

---

**Last Updated**: February 8, 2026
