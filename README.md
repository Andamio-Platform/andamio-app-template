# Andamio App V2

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-2.0.0--rc6-green.svg)](./CHANGELOG.md)

Production Cardano dApp for [app.andamio.io](https://app.andamio.io). Course creation, credential issuance, project management, and treasury operations — all on-chain via the Andamio Protocol.

## Get Running

```bash
git clone https://github.com/Andamio-Platform/andamio-app-v2.git
cd andamio-app-v2
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). That's it — the app connects to deployed Andamio APIs by default, no local backend needed.

**Requires**: Node.js 20+

### Environment

```bash
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://dev.api.andamio.io"
ANDAMIO_API_KEY="your-api-key"
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
```

### Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run check` | Lint + typecheck (run before commits) |
| `npm run generate:types` | Regenerate API types from gateway spec |
| `npm run test:e2e` | Playwright end-to-end tests |
| `npm run preview` | Build + start locally |

## Claude Skills

This repo ships with 17 specialized Claude Code skills that codify how we build, test, review, and ship. They live in `.claude/skills/` and are invoked as slash commands.

### Start Here

| Skill | What it does |
|-------|-------------|
| `/getting-started` | Interactive onboarding — tells you which skills to use based on what you're trying to do |
| `/project-manager` | Current status, roadmap, sitemap, role-route mapping |

### Build

| Skill | What it does |
|-------|-------------|
| `/hooks-architect` | Create, audit, and reference API hooks (5 modes: learn, implement, audit, extract, reference) |
| `/design-system` | UI patterns, semantic colors, component reference (3 modes: review, diagnose, reference) |
| `/audit-api-coverage` | Gateway endpoint coverage — 108 endpoints tracked |
| `/typescript-types-expert` | Type safety auditing and design (3 modes: audit, fix, design) |
| `/tx-loop-guide` | Walk through the 6 documented transaction test loops |
| `/mesh-expert` | Mesh SDK reference (external, from MeshJS) |

### Quality

| Skill | What it does |
|-------|-------------|
| `/qa` | Route-level production readiness audit (30 rules across 6 categories) |
| `/review-pr` | PR review that auto-delegates to design-system, hooks-architect, types-expert |
| `/react-query-auditor` | Cache patterns, stale data, query key issues |
| `/transaction-auditor` | Keep TX schemas in sync with gateway API spec |
| `/ux-readiness` | Assess app flows for documentation readiness, file issues cross-repo |

### Ship

| Skill | What it does |
|-------|-------------|
| `/ship` | Version bump, docs check, commit, PR, merge, cleanup |
| `/product-iteration` | Full feedback cycle: Test, Design, Triage, Ship |
| `/issue-handler` | Route errors to the right repo/subsystem |
| `/documentarian` | Keep docs current after code changes (190+ items completed) |
| `/bootstrap-skill` | Scaffold a new skill with consistent structure and registration |

### How Skills Work

Skills are markdown files that give Claude structured instructions for specific tasks. Each skill folder contains a `SKILL.md` (the instructions) plus supporting reference docs. When you invoke `/design-system review`, Claude reads that skill's files and follows its process.

Skills compose: `/review-pr` delegates to `/design-system`, `/hooks-architect`, and `/typescript-types-expert`. `/ship` calls `/documentarian`. `/qa` orchestrates four other skills.

Full audit: [`.claude/skills/SKILLS-AUDIT.md`](./.claude/skills/SKILLS-AUDIT.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| API | Unified Andamio Gateway (`/api/v2/*`) + tRPC v11 |
| Styling | Tailwind CSS v4 + shadcn/ui + semantic color system |
| Blockchain | Cardano via Mesh SDK |
| Editor | Tiptap with custom extensions |
| Types | Auto-generated from gateway OpenAPI spec |
| Testing | Playwright E2E |

## Project Structure

```
andamio-app-v2/
├── src/
│   ├── app/
│   │   ├── (app)/              # Sidebar layout routes
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── course/         # Learner course views
│   │   │   ├── studio/         # Creator Studio (courses + projects)
│   │   │   └── project/        # Public project views
│   │   └── migrate/            # V1→V2 token migration
│   │
│   ├── components/
│   │   ├── andamio/            # Design system (68+ components)
│   │   ├── auth/               # Auth + RequireAuth wrapper
│   │   ├── editor/             # Tiptap rich text editor
│   │   ├── studio/             # Studio components
│   │   └── transactions/       # TX components (16+)
│   │
│   ├── hooks/                  # Auth, data fetching, TX hooks
│   ├── types/generated/        # Auto-generated API types
│   ├── lib/                    # Gateway client, utilities
│   └── config/                 # TX schemas, UI config
│
├── e2e/                        # Playwright test suite
├── packages/andamio-transactions/  # TX definitions (deprecated)
│
└── .claude/
    ├── CLAUDE.md               # AI development rules
    └── skills/                 # 17 Claude skills
        ├── SKILLS-AUDIT.md     # Full skill inventory
        ├── getting-started/
        ├── hooks-architect/
        ├── design-system/
        ├── project-manager/
        └── ...
```

## Key Patterns

### Authentication

Wallet connect triggers JWT auth automatically. Use `RequireAuth` to gate pages:

```typescript
import { RequireAuth } from "~/components/auth/require-auth";

<RequireAuth title="Studio" description="Connect to access">
  <StudioContent />
</RequireAuth>
```

### API Calls

Types are generated from the gateway spec — never define API types locally:

```typescript
import { type CourseResponse } from "~/types/generated";

const { data, isLoading, error } = useAndamioFetch<CourseResponse[]>({
  endpoint: "/course/owner/courses/list",
  authenticated: true,
});
```

### Styling

Semantic colors only. Never hardcoded Tailwind colors:

```typescript
// correct
<span className="text-success">Done</span>
<span className="text-destructive">Error</span>

// never
<span className="text-green-600">Done</span>
```

### Icons

Always import from the centralized icon system:

```typescript
import { CredentialIcon, CourseIcon } from "~/components/icons";
```

## Current Status

| Phase | Status |
|-------|--------|
| Course & Learning | Complete — 16 transactions, full learner/instructor lifecycle |
| Creator Studio | Complete — course/module editing, on-chain sync, rich text |
| Project System | In progress — treasury, tasks, commitments (9 TX components) |

Detailed tracking: [STATUS.md](./.claude/skills/project-manager/STATUS.md) | [ROADMAP.md](./.claude/skills/project-manager/ROADMAP.md)

## App vs Template

This is the **production app**. A separate **forkable template** exists at [andamio-app-template](https://github.com/Andamio-Platform/andamio-app-template) for external developers. The template tracks this repo via git rebase — use `/sync-template` from the template repo to pull in updates.

What's excluded from the template: dev-only routes, deployment workflows, Dockerfile, developer registration. Full list: [NOT_SYNCED_WITH_TEMPLATE.md](./NOT_SYNCED_WITH_TEMPLATE.md)

## Resources

- [Andamio Platform](https://andamio.io) | [Andamio Docs](https://docs.andamio.io)
- [API Docs](https://dev.api.andamio.io/api/v1/docs/index.html)
- [CHANGELOG](./CHANGELOG.md) | [CONTRIBUTING](./CONTRIBUTING.md)
- [T3 Stack](https://create.t3.gg/) | [Next.js](https://nextjs.org/docs) | [Mesh SDK](https://meshjs.dev) | [shadcn/ui](https://ui.shadcn.com)

## License

MIT
