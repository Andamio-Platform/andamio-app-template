# Features Not Synced to Template

This document lists all files, routes, and features in `andamio-app-v2` (production app) that are **excluded** from `andamio-app-template` (forkable template).

These exclusions are managed via divergence commits in the template repo. See [TEMPLATE-EXTRACTION-PLAN.md](./.claude/skills/project-manager/TEMPLATE-EXTRACTION-PLAN.md) for details.

---

## Summary

| Category | Excluded From Template | Reason |
|----------|----------------------|--------|
| Routes | 4 dev-only routes | Internal tooling, not needed by template users |
| Navigation | "Dev Tools" sidebar section | References excluded routes |
| Auth | Dev registration functions | API key registration is app-specific |
| Deployment | GitHub workflows | App-specific CI/CD configuration |
| Container | Dockerfile | App-specific build configuration |
| Package | `name` field in package.json | Different package names |
| Docs | README.md content | Template has different setup instructions |

---

## Excluded Routes

These routes exist in `andamio-app-v2` but are removed from the template:

| Route | Path | Purpose | Why Excluded |
|-------|------|---------|--------------|
| **API Setup** | `src/app/(app)/api-setup/` | Developer API key registration wizard | App-specific; template users get keys differently |
| **Components** | `src/app/(app)/components/` | Component showcase/demo page | Internal dev tool for reviewing components |
| **Editor** | `src/app/(app)/editor/` | Tiptap editor demo/testing page | Internal dev tool |
| **Sitemap** | `src/app/(app)/sitemap/` | Navigation index/debug page | Internal dev tool for reviewing routes |

---

## Excluded Navigation

The **"Dev Tools"** section in the sidebar is removed from the template:

| File | Change |
|------|--------|
| `src/config/navigation.ts` | "Dev Tools" nav group removed |

This section links to the excluded routes above.

---

## Excluded Auth Functions

Developer registration functions are removed from the template:

| File | Functions Removed |
|------|-------------------|
| `src/lib/andamio-auth.ts` | `createDevRegisterSession()` |
| | `completeDevRegistration()` |
| | Dev JWT helper functions |

**Kept in template**: All end-user auth functions (`createLoginSession`, `validateSignature`, etc.)

---

## Excluded Deployment Files

| File/Directory | Purpose | Why Excluded |
|----------------|---------|--------------|
| `.github/workflows/deploy-dev.yml` | Deploy to dev environment | App-specific GCP configuration |
| `.github/workflows/deploy-staging.yml` | Deploy to staging environment | App-specific GCP configuration |
| `Dockerfile` | Container build configuration | App-specific build settings |

Template users will create their own deployment pipelines.

---

## Excluded Documentation

| File | Purpose | Why Excluded |
|------|---------|--------------|
| `NOT_SYNCED_WITH_TEMPLATE.md` | This file - documents exclusions | Meta: template users don't need exclusion docs |

## Modified Files

These files exist in both repos but have different content:

| File | App Version | Template Version |
|------|-------------|------------------|
| `package.json` | `"name": "andamio-app-v2"` | `"name": "andamio-app-template"` |
| `README.md` | Production app documentation | Template setup instructions |

---

## What IS Synced

Everything else syncs automatically when the template rebases from the app:

| Category | Examples |
|----------|----------|
| **Core Features** | Access token minting, Course V2 (13 routes), Project V2 (10 routes) |
| **Auth System** | Wallet connection, JWT auth, session management |
| **Design System** | All shadcn/ui components, semantic colors, Andamio wrappers |
| **API Integration** | Gateway proxy, type generation, all hooks |
| **Transaction System** | All TX components, TX state machine, SSE streaming |
| **Editor** | Tiptap integration, all extensions |
| **Claude Skills** | All `.claude/skills/` including `/sync-template` |
| **Dependencies** | All npm packages (except name field) |

---

## Managing Exclusions

### Adding New Exclusions

When a new app-specific feature needs to be excluded:

1. **In the template repo**, create an atomic commit:
   ```bash
   git rm -r src/app/(app)/new-app-feature/
   git commit -m "template: remove new-app-feature"
   ```

2. **Update this document** in the app repo

3. **Run `/sync-template`** — the template will get this updated doc

### Viewing Current Divergence

In the template repo:
```bash
git log --oneline upstream/main..HEAD
```

This shows all commits unique to the template (the divergence commits).

---

## Related Documentation

- [TEMPLATE-EXTRACTION-PLAN.md](./.claude/skills/project-manager/TEMPLATE-EXTRACTION-PLAN.md) — Full extraction plan and rebase workflow
- [/sync-template skill](./.claude/skills/sync-template/SKILL.md) — Skill for syncing changes to template
- [andamio-app-template](https://github.com/Andamio-Platform/andamio-app-template) — The template repository
