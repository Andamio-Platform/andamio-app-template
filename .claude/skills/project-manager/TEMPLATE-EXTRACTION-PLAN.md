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
- [ ] Step 3: Create `andamio-app-template` repo
- [ ] Step 4: Single divergence commit on template
- [ ] Step 5: Document rebase workflow

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

## Step 4: Single Divergence Commit on Template

In the `andamio-app-template` repo, make **one commit** that removes app-only features:

### Delete these routes:
- `src/app/(app)/api-setup/` — Dev API key registration wizard
- `src/app/(app)/components/` — Component showcase page
- `src/app/(app)/editor/` — Editor demo page
- `src/app/(app)/sitemap/` — Navigation index page

### Edit these files:
- `src/config/navigation.ts` — Remove "Dev Tools" sidebar section
- `src/lib/andamio-auth.ts` — Remove dev registration functions (`createDevRegisterSession`, `completeDevRegistration`, dev JWT helpers). Keep all end-user auth intact.
- `package.json` — Set name to `andamio-app-template`
- `README.md` — Template-specific setup instructions

### Keep everything else:
- All access token minting (mint, burn, migrate)
- All Course V2 routes (13 learner + studio routes)
- All Project V2 routes (10 contributor + studio routes)
- Auth system, gateway proxy, design system, TX hooks
- Type generation pipeline
- GitHub workflows (they use variables, not hardcoded names)

### Additional removals (TBD):
- "Finer tuned features" to be discussed and enumerated later
- Each removal should be its own commit on top of the initial divergence commit

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

### When to stop rebasing:
- When conflicts become frequent and tedious
- When template team starts building template-specific features
- This is the success signal — the repos are mature enough to be independent

## GitHub Workflows

**No changes needed.** Both `deploy-dev.yml` and `deploy-staging.yml` use repository variables (`${{ vars.* }}`), not hardcoded repo names. The template repo will need its own GCP variables configured if it gets its own deployment pipeline.

## Key Principle

Keep the divergence commit(s) as small and surgical as possible. Every edited line is a potential rebase conflict. Deleting whole files is clean. Editing shared files is where conflicts live.
