# CLAUDE.md - Andamio T3 App Template

## Project Overview

Cardano dApp starter: Next.js 15, tRPC v11, Tailwind CSS v4, Mesh SDK, shadcn/ui.

**Gateway**: `https://dev.api.andamio.io` | **Docs**: `https://dev.api.andamio.io/api/v1/docs/index.html`

## Critical Rules

### Types
- **Always** import from `~/types/generated` - never define API types locally
- Regenerate: `npm run generate:types`

### Variable Naming
- **Never** use `module` as a variable name → use `courseModule`
- Be explicit: `courseData`, `lessonData`, `assignmentData`

### Icons
- **Always** import from `~/components/icons` with semantic names
- **Never** import directly from `lucide-react`
- Examples: `CredentialIcon`, `SLTIcon`, `CourseIcon`, `SuccessIcon`

### Styling
- **Only** use shadcn/ui components from `~/components/ui/`
- **Only** use semantic colors: `primary`, `secondary`, `muted`, `destructive`
- **Never** use hardcoded colors like `text-green-600` or `bg-blue-500`
- Use `AndamioText` for paragraphs, not raw `<p>` tags

### Text Components
```typescript
import { AndamioText } from "~/components/andamio";
<AndamioText variant="muted">Helper text</AndamioText>
<AndamioText variant="small">Small text</AndamioText>
```

## Architecture

### Repository Structure
```
src/
├── config/           # Transaction schemas, UI config
├── hooks/            # Transaction hooks, API hooks
├── types/generated/  # Auto-generated API types
├── components/
│   ├── andamio/      # Andamio design system components
│   ├── icons/        # Centralized icon exports
│   └── ui/           # shadcn/ui base components
└── lib/              # API clients, utilities
```

### API Patterns
```typescript
import { gateway, gatewayAuth } from "~/lib/gateway";
import type { CourseResponse } from "~/types/generated";

// Public
const data = await gateway<CourseResponse[]>("/api/v2/course/user/courses/list");

// Authenticated
const data = await gatewayAuth<CourseResponse[]>("/api/v2/course/owner/courses/list", jwt);
```

### Route Structure
```
/                → Landing page
/(app)/dashboard → Dashboard (sidebar layout)
/(app)/courses   → Courses (sidebar layout)
```

## Authentication

**With Access Token**: Wallet connect → detect token → POST `/auth/login` → JWT
**Without Token**: Wallet connect → POST `/auth/login/session` → sign nonce → POST `/auth/login/validate` → JWT

Wallet addresses: Convert hex to bech32 using `core.Address.fromString().toBech32()`

## Key Files

| Category | Files |
|----------|-------|
| Auth | `hooks/auth/use-andamio-auth.ts`, `lib/andamio-auth.ts` |
| API | `lib/gateway.ts`, `types/generated/` |
| TX | `hooks/tx/use-transaction.ts`, `hooks/tx/use-tx-stream.ts` |
| Layout | `components/layout/app-layout.tsx`, `app-sidebar.tsx` |

## Development

```bash
npm run dev          # Start dev server
npm run typecheck    # Type check
npm run generate:types  # Regenerate API types
```

## Environment Variables

```bash
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://dev.api.andamio.io"
ANDAMIO_API_KEY="your-api-key"
NEXT_PUBLIC_CARDANO_NETWORK="preprod"
```

## Skills Reference

For detailed documentation, invoke the relevant skill:

| Topic | Skill |
|-------|-------|
| Styling, colors, components | `/design-system` |
| API coverage, endpoints | `/audit-api-coverage` |
| Project status, roadmap | `/project-manager` |
| TypeScript types | `/typescript-types-expert` |
| Transaction flows | `/tx-loop-guide` |

Full skill list: `.claude/skills/*/SKILL.md`
