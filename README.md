# Andamio App Template

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Forkable starter for building Cardano dApps with the Andamio Protocol. Course creation, credential issuance, project management, and treasury operations — all on-chain.

## Quick Start

```bash
# Clone and install
git clone https://github.com/Andamio-Platform/andamio-app-template.git
cd andamio-app-template
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API key

# Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app connects to Andamio APIs — no local backend required.

**Requires**: Node.js 20+

## Environment Variables

```bash
# Required
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://dev.api.andamio.io"
ANDAMIO_API_KEY="your-api-key"
NEXT_PUBLIC_CARDANO_NETWORK="preprod"

# Optional
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="your-policy-id"
```

Get an API key at [dev.api.andamio.io](https://dev.api.andamio.io).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run check` | Lint + typecheck |
| `npm run generate:types` | Regenerate API types from gateway spec |
| `npm run test:e2e` | Run Playwright tests |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| API | Andamio Gateway (`/api/v2/*`) + tRPC v11 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Blockchain | Cardano via Mesh SDK |
| Editor | Tiptap |
| Types | Auto-generated from OpenAPI spec |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Sidebar layout routes
│   │   ├── dashboard/      # User dashboard
│   │   ├── course/         # Course browsing
│   │   ├── credentials/    # User credentials
│   │   ├── project/        # Project browsing
│   │   └── studio/         # Creator tools
│   └── api/                # API routes
│
├── components/
│   ├── andamio/            # Design system components
│   ├── auth/               # Auth components
│   ├── editor/             # Rich text editor
│   ├── icons/              # Centralized icons
│   ├── landing/            # Landing page
│   ├── studio/             # Studio components
│   ├── transactions/       # TX components
│   └── ui/                 # shadcn/ui base
│
├── config/                 # App configuration
├── contexts/               # React contexts
├── hooks/                  # Custom hooks
├── lib/                    # Utilities
└── types/                  # TypeScript types
    └── generated/          # Auto-generated API types
```

## Key Patterns

### Authentication

Wallet connect triggers JWT auth automatically:

```typescript
import { RequireAuth } from "~/components/auth/require-auth";

<RequireAuth title="Studio" description="Connect to access">
  <StudioContent />
</RequireAuth>
```

### API Calls

Types are auto-generated — never define API types locally:

```typescript
import { type CourseResponse } from "~/types/generated";

const { data } = useAndamioFetch<CourseResponse[]>({
  endpoint: "/course/owner/courses/list",
  authenticated: true,
});
```

### Styling

Use semantic colors only:

```typescript
// Good
<span className="text-success">Done</span>
<span className="text-destructive">Error</span>

// Bad
<span className="text-green-600">Done</span>
```

### Icons

Import from the centralized icon system:

```typescript
import { CredentialIcon, CourseIcon } from "~/components/icons";
```

## Claude Skills

This repo includes Claude Code skills in `.claude/skills/` for AI-assisted development:

| Skill | Description |
|-------|-------------|
| `/getting-started` | Interactive onboarding |
| `/design-system` | UI patterns and components |
| `/hooks-architect` | API hook patterns |
| `/qa` | Route-level quality audit |

Run `/getting-started` in Claude Code to explore available skills.

## Resources

- [Andamio Platform](https://andamio.io)
- [Andamio Docs](https://docs.andamio.io)
- [API Docs](https://dev.api.andamio.io/api/v1/docs/index.html)
- [Mesh SDK](https://meshjs.dev)
- [shadcn/ui](https://ui.shadcn.com)

## License

MIT
