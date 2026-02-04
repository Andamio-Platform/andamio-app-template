# Andamio App Template

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Cardano dApp starter template built on the [Andamio Platform](https://andamio.io). Course creation, credential issuance, project management, and treasury operations — all on-chain via the Andamio Protocol.

## Quick Start

```bash
# Clone the template
git clone https://github.com/Andamio-Platform/andamio-app-template.git my-andamio-app
cd my-andamio-app

# Install dependencies
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app connects to deployed Andamio APIs by default — no local backend needed.

**Requires**: Node.js 20+

## Environment

```bash
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://dev.api.andamio.io"
ANDAMIO_API_KEY="your-api-key"
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| API | Unified Andamio Gateway (`/api/v2/*`) + tRPC v11 |
| Styling | Tailwind CSS v4 + shadcn/ui + semantic color system |
| Blockchain | Cardano via Mesh SDK |
| Editor | Tiptap with custom extensions |
| Types | Auto-generated from gateway OpenAPI spec |

## Project Structure

```
andamio-app-template/
├── src/
│   ├── app/(app)/              # Pages with sidebar layout
│   │   ├── dashboard/          # User dashboard
│   │   ├── course/[coursenft]/ # Learner course views
│   │   ├── studio/             # Creator Studio
│   │   └── project/[projectid]/# Public project views
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
    └── skills/                 # Claude Code skills
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

## Scripts

| Script | What it does |
|--------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run check` | Lint + typecheck (run before commits) |
| `npm run generate:types` | Regenerate API types from gateway spec |
| `npm run preview` | Build + start locally |

## Resources

- [Andamio Platform](https://andamio.io) | [Andamio Docs](https://docs.andamio.io)
- [API Docs](https://dev.api.andamio.io/api/v1/docs/index.html)
- [T3 Stack](https://create.t3.gg/) | [Next.js](https://nextjs.org/docs) | [Mesh SDK](https://meshjs.dev) | [shadcn/ui](https://ui.shadcn.com)

## License

MIT
