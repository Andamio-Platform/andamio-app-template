---
name: sync-template
description: Sync changes from andamio-app-v2 to andamio-app-template via rebase workflow
---

# Sync Template

Synchronize the `andamio-app-template` repo with changes from `andamio-app-v2` (production app).

## Overview

The template repo maintains **atomic divergence commits** — small, focused commits that each remove one app-specific feature. When the app ships improvements, this skill rebases the template to incorporate those changes while preserving the divergences.

```
andamio-app-v2                    andamio-app-template
      │                                  │
 [new feature]                           │
 [bug fix]                               │
 [design update]                         │
      │                                  │
      └──── rebase ─────────────────────►│
                                         │
                                    [divergence commits]
                                    ├── "template: initial divergence"
                                    │     (dev routes, nav, auth, package, README)
                                    ├── "template: remove deployment workflows"
                                    └── "template: remove Dockerfile"
```

### Hybrid Approach

The template uses a hybrid divergence strategy:

1. **Initial divergence commit** — One commit from template extraction that removes core app-specific items (dev routes, Dev Tools nav, dev auth functions, package name, README)
2. **Atomic commits on top** — Additional removals added as separate, focused commits

This prevents "compound conflicts":
- If app changes `Dockerfile`, only the Dockerfile commit conflicts
- If app changes `navigation.ts`, only the initial divergence commit conflicts
- Adding new removals = adding new atomic commits (not editing existing ones)

## Prerequisites

This skill must be run from a local clone of `andamio-app-template`.

If you don't have it cloned:
```bash
git clone git@github.com:Andamio-Platform/andamio-app-template.git
cd andamio-app-template
```

## Instructions

### Step 1: Detect Current Repository

First, determine which repo we're in:

```bash
git remote get-url origin
```

**If origin contains `andamio-app-v2`:**
- You're in the app repo, not the template
- Show the user what commits would be synced (see Step 1b)
- Guide them to clone/navigate to the template repo

**If origin contains `andamio-app-template`:**
- Proceed to Step 2

### Step 1b: Preview Changes (App Repo Only)

If in the app repo, show what would sync:

```bash
# Show commits since the template was last synced
# (This requires knowing the template's current HEAD, which we may not have)
# Instead, show recent commits that might be relevant:
git log --oneline -20 --no-merges
```

Tell the user:
> "You're in the app repo. To sync these changes to the template, navigate to your local clone of `andamio-app-template` and run `/sync-template` there."

### Step 2: Verify Upstream Remote

Check if the upstream remote is configured:

```bash
git remote -v
```

Look for:
```
upstream  git@github.com:Andamio-Platform/andamio-app-v2.git (fetch)
```

**If upstream is missing**, add it:

```bash
git remote add upstream git@github.com:Andamio-Platform/andamio-app-v2.git
```

### Step 3: Fetch Latest Changes

```bash
git fetch upstream
```

### Step 4: Check for Divergence

Show what commits will be incorporated:

```bash
git log --oneline HEAD..upstream/main
```

If no commits are shown, the template is already up to date. Report this and exit.

### Step 5: Ensure Clean Working Directory

```bash
git status --porcelain
```

If there are uncommitted changes, ask the user to commit or stash them first.

### Step 6: Perform the Rebase

```bash
git rebase upstream/main
```

### Step 7: Handle Conflicts

If conflicts occur, they will typically be in:

| File | Conflict Type | Resolution |
|------|---------------|------------|
| `src/config/navigation.ts` | Template removes "Dev Tools" section | Keep template's version (without Dev Tools) |
| `src/lib/andamio-auth.ts` | Template removes dev registration functions | Keep template's version (without dev functions) |
| `package.json` | Name field differs | Keep `andamio-app-template` |
| `README.md` | Template has different setup instructions | Keep template's version |
| `.github/workflows/*` | Template has no workflows | Keep files deleted |
| `Dockerfile` | Template has no Dockerfile | Keep file deleted |
| `NOT_SYNCED_WITH_TEMPLATE.md` | Template has no exclusion docs | Keep file deleted |

For each conflicted file:

1. Open the file and look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
2. Keep the template's deletions/modifications (the "ours" side after rebase inverts to "theirs")
3. Stage the resolution:
   ```bash
   git add <file>
   ```
4. Continue the rebase:
   ```bash
   git rebase --continue
   ```

**If conflicts are too complex**, abort and report:
```bash
git rebase --abort
```

### Step 8: Push the Rebased History

```bash
git push --force-with-lease
```

The `--force-with-lease` flag is safer than `--force` because it will fail if someone else pushed to the template in the meantime.

### Step 9: Verify Success

```bash
git log --oneline -10
```

Confirm:
- The divergence commits (prefixed `template:`) are at the top
- New commits from the app are below them
- No merge commits were created

Example of correct structure:
```
abc1234 template: remove Dockerfile           ← atomic commit
def5678 template: remove deployment workflows ← atomic commit
ghi9012 template: initial divergence          ← original divergence
jkl3456 feat: add /sync-template skill        ← app commits below
mno7890 feat: latest app feature
pqr1234 fix: app bug fix
```

## Conflict Resolution Reference

### navigation.ts

The template removes the "Dev Tools" sidebar section. When the app adds new navigation items, check if they belong in the template:

- **Keep**: Course routes, Project routes, Dashboard, Settings
- **Remove**: API Setup, Component Showcase, Editor Demo, Sitemap

### andamio-auth.ts

The template removes developer registration functions:

- **Keep**: All end-user auth (`createLoginSession`, `validateSignature`, etc.)
- **Remove**: `createDevRegisterSession`, `completeDevRegistration`, dev JWT helpers

### GitHub Workflows

The template removes all GitHub workflows (`.github/workflows/`):

- `deploy-dev.yml` — App-specific deployment to dev environment
- `deploy-staging.yml` — App-specific deployment to staging environment

These are removed because:
- They contain app.andamio.io-specific deployment configuration
- Template users will create their own deployment workflows
- Workflow secrets/variables are repo-specific

If the app adds new workflows, they should NOT propagate to the template.

### Dockerfile

The template removes the root `Dockerfile`:

- Contains app.andamio.io-specific build configuration
- Template users will create their own containerization setup

If the app modifies the Dockerfile, keep it deleted in template.

### NOT_SYNCED_WITH_TEMPLATE.md

The template removes this documentation file:

- Documents what's excluded from the template (meta/self-referential)
- Template users don't need to know what was removed
- Keeps template focused on what's included, not what's missing

### New Routes

If the app adds new routes, decide whether the template should have them:

- **Include**: Features useful for all Andamio apps
- **Exclude**: Features specific to app.andamio.io

If excluding, add the route deletion to a new commit on top of the divergence commit.

## Adding New Removals

When a new app-specific feature needs to be excluded from the template:

### 1. Create an Atomic Commit

On the template repo, add a NEW commit (don't amend existing ones):

```bash
# Example: removing a new app-specific route
git rm -r src/app/(app)/new-app-feature/
git commit -m "template: remove new-app-feature route"

# Example: removing a new file
git rm some-app-specific-file.ts
git commit -m "template: remove some-app-specific-file"
```

### 2. Use the `template:` Prefix

All divergence commits should be prefixed with `template:` for easy identification:

- `template: remove dev routes`
- `template: remove workflows`
- `template: update README for template`

### 3. Keep Commits Focused

Each commit should do ONE thing:
- **Good**: `template: remove Dockerfile`
- **Bad**: `template: remove Dockerfile and workflows and update README`

### 4. Update Documentation

After adding a new removal:
1. Update `TEMPLATE-EXTRACTION-PLAN.md` in the app repo
2. Update this skill's conflict resolution table
3. The changes will propagate to template on next sync

## When to Stop Rebasing

Consider stopping the rebase workflow when:

1. **Conflicts become frequent** — Every sync requires significant manual resolution
2. **Template diverges significantly** — Template team builds template-specific features
3. **Maintenance burden exceeds value** — Time spent resolving conflicts > time saved by syncing

This is a success signal — the repos are mature enough to be independent.

## Troubleshooting

### "upstream" remote already exists with wrong URL

```bash
git remote set-url upstream git@github.com:Andamio-Platform/andamio-app-v2.git
```

### Rebase fails with "cannot rebase: you have unstaged changes"

```bash
git stash
git rebase upstream/main
git stash pop
```

### Force push rejected

Someone else pushed to the template. Fetch and try again:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

### Want to see what changed in a sync

```bash
git diff HEAD~1..HEAD  # Changes in the last commit
git log --oneline upstream/main..HEAD  # Commits unique to template
```

## Output Format

After a successful sync, report:

```
Template sync complete.

Commits incorporated: X
Conflicts resolved: Y
Files changed: Z

The template now includes changes up to: <commit-hash> <commit-message>
```
