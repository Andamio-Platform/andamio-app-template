# Andamio App Template

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Forkable Cardano dApp starter built on the Andamio Protocol. Course creation, credential issuance, project management, and treasury operations — all on-chain.

## Quick Start

```bash
# Fork this repo, then:
git clone https://github.com/YOUR-USERNAME/andamio-app-template.git
cd andamio-app-template
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app connects to Andamio APIs — no local backend needed.

**Requires**: Node.js 20+

## Environment

```bash
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://dev.api.andamio.io"
ANDAMIO_API_KEY="your-api-key"  # Get from https://app.andamio.io/api-setup
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
```

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run check` | Lint + typecheck |
| `npm run generate:types` | Regenerate API types from gateway spec |
| `npm run preview` | Build + start locally |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| API | Unified Andamio Gateway (`/api/v2/*`) + tRPC v11 |
| Styling | Tailwind CSS v4 + shadcn/ui + semantic colors |
| Blockchain | Cardano via Mesh SDK |
| Editor | Tiptap with custom extensions |
| Types | Auto-generated from gateway OpenAPI spec |

## Project Structure

```
andamio-app-template/
├── src/
│   ├── app/
│   │   ├── (app)/              # Sidebar layout routes
│   │   │   ├── dashboard/      # User dashboard
│   │   │   ├── course/         # Learner course views
│   │   │   ├── studio/         # Creator Studio
│   │   │   └── project/        # Public project views
│   │
│   ├── components/
│   │   ├── andamio/            # Design system components
│   │   ├── auth/               # Auth + RequireAuth wrapper
│   │   ├── editor/             # Tiptap rich text editor
│   │   └── transactions/       # TX components
│   │
│   ├── hooks/                  # Auth, data fetching, TX hooks
│   ├── types/generated/        # Auto-generated API types
│   ├── lib/                    # Gateway client, utilities
│   └── config/                 # TX schemas, UI config
│
└── .claude/
    ├── CLAUDE.md               # AI development rules
    └── skills/                 # Agent Skills (works with any compatible agent)
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

## Agent Skills

This template includes [Agent Skills](https://agentskills.io) — portable instructions that work with any compatible coding agent (Claude Code, Cursor, Copilot, Gemini CLI, Roo Code, and [30+ others](https://agentskills.io/home)).

| Skill | What it does |
|-------|-------------|
| `/getting-started` | Quick win: customize your theme colors in 2 minutes |
| `/design-system` | UI patterns, component reference, styling audits |
| `/auth` | API key and JWT authentication guide |
| `/transactions` | Cardano TX state machine and hooks |
| `/fix` | AI-assisted bug fixing |
| `/ship` | Version bump, commit, PR, merge |

Skills live in `.claude/skills/*/SKILL.md` and follow the open [Agent Skills spec](https://agentskills.io/specification).

## Customization

1. **Branding**: Edit `src/config/branding.ts` for app name, logo, colors
2. **Routes**: Add pages under `src/app/(app)/` for sidebar layout
3. **Transactions**: Configure TX schemas in `src/config/transaction-types/`
4. **Styling**: Extend shadcn components, keep semantic colors

## Resources

- [Andamio Platform](https://andamio.io) | [Andamio Docs](https://docs.andamio.io)
- [API Docs](https://dev.api.andamio.io/api/v1/docs/index.html)
- [T3 Stack](https://create.t3.gg/) | [Next.js](https://nextjs.org/docs)
- [Mesh SDK](https://meshjs.dev) | [shadcn/ui](https://ui.shadcn.com)

## License

MIT
