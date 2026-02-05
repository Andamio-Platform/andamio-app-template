# Template Extraction Plan

## Overview

Extract a forkable template (`andamio-app-template`) from the production app (`andamio-app-v2`). The template tracks app changes via periodic rebase until the two repos naturally diverge.

## Naming

- **`andamio-app-v2`** — production app for `app.andamio.io`
- **`andamio-app-template`** — forkable template for external developers

## Status

- [x] Step 1: Rename GitHub repo to `andamio-app-v2`
- [x] Step 1: Update local remote URL
- [x] Step 1: Rename local directory
- [x] Step 2: Update internal references in `andamio-app-v2`
- [x] Step 3: Create `andamio-app-template` repo
- [x] Step 4: Atomic divergence commits on template
- [x] Step 5: Document rebase workflow

---

## Step 2: Update Internal References in `andamio-app-v2`

Update all references from `andamio-t3-app-template` to `andamio-app-v2`:

| File | What to change |
|------|---------------|
| `package.json` | `name` field |
| `CHANGELOG.md` | GitHub repo URLs |
| `README.md` | Clone instructions, repo references |
| `.claude/skills/project-manager/GETTING-STARTED.md` | Setup instructions |
| `.claude/skills/issue-handler/SKILL.md` | Repository reference |
| `docs/WHITE_LABEL_GUIDE.md` | GitHub issues link |

## Step 3: Create `andamio-app-template` Repo

1. Create new repo `andamio-app-template` on GitHub under `Andamio-Platform`
2. Push current `main` from `andamio-app-v2` as the starting point
3. This gives both repos an identical shared history, which is what makes rebase work

```bash
# From andamio-app-v2 directory
git remote add template git@github.com:Andamio-Platform/andamio-app-template.git
git push template main
```

Then clone `andamio-app-template` separately for template work.

## Step 4: Divergence Commits on Template

The template maintains divergence commits that remove app-specific features. We use a hybrid approach:

1. **Initial divergence commit** — Created during template extraction, removes core app-specific items
2. **Atomic commits on top** — Additional removals added as separate, focused commits

This prevents "compound conflicts" — when the app changes any file, you only conflict with the specific commit that touches that file.

### Current Divergence Commit Structure

```
template main:
  │
  ├── [app commits from rebase...]
  │
  ├── template: initial divergence        ← Original commit (keeps existing)
  │     • Removes dev routes (api-setup/, components/, editor/, sitemap/)
  │     • Removes Dev Tools nav section
  │     • Removes dev auth functions
  │     • Updates package.json name
  │     • Updates README
  │
  ├── template: remove deployment workflows  ← Atomic commit
  │
  └── template: remove Dockerfile            ← Atomic commit
```

### What the Initial Divergence Commit Contains

| Removal | Files Affected |
|---------|----------------|
| Dev routes | `src/app/(app)/api-setup/`, `components/`, `editor/`, `sitemap/` |
| Dev Tools nav | `src/config/navigation.ts` |
| Dev auth functions | `src/lib/andamio-auth.ts` |
| Package name | `package.json` (name field only) |
| README | `README.md` (template-specific instructions) |

### Atomic Commits Added On Top

These were added after the initial divergence to keep conflicts isolated:

```bash
# Already added:
git rm -r .github/workflows
git commit -m "template: remove deployment workflows"

git rm Dockerfile
git commit -m "template: remove Dockerfile"
```

| Commit | Removes | Conflict Trigger |
|--------|---------|------------------|
| `template: remove deployment workflows` | `.github/workflows/` | App adds/modifies workflows |
| `template: remove Dockerfile` | `Dockerfile` | App modifies Dockerfile |

### Adding Future Removals

When new app-specific features need to be excluded:

1. **Create a NEW commit on top** (don't amend existing ones)
2. **Use the `template:` prefix** for easy identification
3. **Keep it focused** on one removal
4. **Update this document** to track what's removed

Example:
```bash
# In andamio-app-template
git rm -r src/app/(app)/some-new-app-feature/
git commit -m "template: remove some-new-app-feature"
git push
```

### Keep Everything Else

These should NOT be in divergence commits (they sync automatically):
- All access token minting (mint, burn, migrate)
- All Course V2 routes (13 learner + studio routes)
- All Project V2 routes (10 contributor + studio routes)
- Auth system, gateway proxy, design system, TX hooks
- Type generation pipeline
- Dependencies in package.json (except name field)

## Step 5: Document Rebase Workflow

On the template repo, add upstream remote and document the sync process:

```bash
# One-time setup on andamio-app-template clone
git remote add upstream git@github.com:Andamio-Platform/andamio-app-v2.git

# Periodic sync (when app ships relevant changes)
git fetch upstream
git rebase upstream/main
# Resolve conflicts in divergence commit(s) if any
git push --force-with-lease
```

### What stays in sync automatically:
- Access token, Course V2, Project V2 changes
- Design system updates
- Auth system improvements
- Type generation pipeline changes
- Dependency updates

### What causes conflicts:
- Changes to `navigation.ts` (sidebar config)
- Changes to `andamio-auth.ts` (auth functions)
- New routes added in app that template doesn't want
- New or modified GitHub workflows (template has none)
- Changes to Dockerfile (template has none)

### When to stop rebasing:
- When conflicts become frequent and tedious
- When template team starts building template-specific features
- This is the success signal — the repos are mature enough to be independent

## GitHub Workflows

The template removes all deployment workflows (`.github/workflows/`). While the workflows use repository variables (`${{ vars.* }}`), they are app-specific:

- Template users will create their own deployment pipelines
- Workflow secrets/variables are repo-specific
- Prevents confusion about unconfigured deployments

## Key Principles

### 1. Atomic Commits

Each divergence commit should do ONE thing. This isolates conflicts:
- If app changes `navigation.ts`, only the nav commit conflicts
- If app changes `Dockerfile`, only the Dockerfile commit conflicts

### 2. Prefer Deletions Over Edits

- **Deleting files**: Clean, rarely conflicts
- **Editing files**: Every changed line is a potential conflict

### 3. Never Amend Divergence Commits

When adding new removals:
- Create a NEW commit on top
- Don't amend existing commits (changes their hash, complicates rebases)

### 4. Use Consistent Naming

All divergence commits use the `template:` prefix:
```
template: remove dev-only routes
template: remove Dev Tools nav section
template: remove deployment workflows
```
