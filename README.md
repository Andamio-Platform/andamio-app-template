# Andamio App Template

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Cardano](https://img.shields.io/badge/Cardano-Mesh_SDK-0033AD?logo=cardano)](https://meshjs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Build Cardano dApps with the Andamio Platform. This template gives you a production-ready foundation with wallet authentication, on-chain transactions, and a complete UI system.

## Quick Start

```bash
# Clone the template
git clone https://github.com/Andamio-Platform/andamio-app-template.git my-app
cd my-app

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API key (see below)

# Start development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app connects to deployed Andamio APIs by default — no local backend needed.

## Get Your API Key

The template connects to Andamio's hosted APIs. You need an API key to build and submit transactions.

1. Go to [dev.api.andamio.io](https://dev.api.andamio.io) (preprod) or [api.andamio.io](https://api.andamio.io) (mainnet)
2. Connect your wallet and register
3. Generate an API key
4. Add it to your `.env` file:

```bash
ANDAMIO_API_KEY="your-api-key-here"
```

## What's Included

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with wallet connect |
| `/dashboard` | User dashboard after login |
| `/course` | Browse and enroll in courses |
| `/course/[id]` | Course detail with modules |
| `/project` | Browse and join projects |
| `/project/[id]` | Project detail with tasks |
| `/studio` | Creator dashboard |
| `/studio/course/*` | Course creation and management |
| `/studio/project/*` | Project creation and management |
| `/credentials` | View earned credentials |

### Features

- **Wallet Authentication** — Connect wallet, sign a message, get a JWT. One hook: `useAndamioAuth()`
- **Protected Routes** — Wrap any page with `<RequireAuth>` for auth-gated content
- **On-Chain Transactions** — Build, sign, and submit Cardano transactions with real-time status
- **Type-Safe API** — Auto-generated TypeScript types from the Andamio API spec
- **Rich Text Editor** — Tiptap-based editor with markdown support
- **Design System** — shadcn/ui components with semantic color tokens

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5.8 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Blockchain | Cardano via Mesh SDK |
| API | tRPC v11 + React Query |
| Editor | Tiptap with extensions |

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Authenticated routes (sidebar layout)
│   │   ├── dashboard/      # User dashboard
│   │   ├── course/         # Course views (learner)
│   │   ├── project/        # Project views (contributor)
│   │   ├── studio/         # Creator tools
│   │   └── credentials/    # Credential display
│
├── components/
│   ├── andamio/            # Andamio design system (68+ components)
│   ├── auth/               # Auth components + RequireAuth wrapper
│   ├── editor/             # Tiptap rich text editor
│   ├── transactions/       # Transaction UI components
│   └── ui/                 # shadcn/ui base components
│
├── hooks/
│   ├── api/                # Data fetching hooks (courses, projects)
│   └── tx/                 # Transaction hooks
│
├── lib/                    # Utilities (auth, API clients, helpers)
└── types/generated/        # Auto-generated API types
```

## Common Patterns

### Authentication

```typescript
import { useAndamioAuth } from "~/hooks/use-andamio-auth";

function MyComponent() {
  const { isAuthenticated, user, logout } = useAndamioAuth();

  if (!isAuthenticated) return <p>Please connect your wallet</p>;

  return <p>Welcome, {user.alias}</p>;
}
```

### Protected Pages

```typescript
import { RequireAuth } from "~/components/auth/require-auth";

export default function ProtectedPage() {
  return (
    <RequireAuth title="My Page" description="Connect wallet to view">
      <MyContent />
    </RequireAuth>
  );
}
```

### Fetching Data

```typescript
import { useCourse } from "~/hooks/api/use-course";

function CourseDetail({ courseId }: { courseId: string }) {
  const { data: course, isLoading } = useCourse(courseId);

  if (isLoading) return <Skeleton />;
  return <h1>{course.title}</h1>;
}
```

### Submitting Transactions

```typescript
import { useTransaction } from "~/hooks/tx/use-transaction";

function EnrollButton({ courseId }: { courseId: string }) {
  const { submit, isPending } = useTransaction({
    txType: "COURSE_ENROLLMENT",
    onSuccess: () => toast.success("Enrolled!"),
  });

  return (
    <Button onClick={() => submit({ courseId })} disabled={isPending}>
      {isPending ? "Processing..." : "Enroll"}
    </Button>
  );
}
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run check` | Lint + typecheck |
| `npm run generate:types` | Regenerate API types |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANDAMIO_API_KEY` | Yes | Your Andamio API key |
| `NEXT_PUBLIC_ANDAMIO_GATEWAY_URL` | Yes | API gateway URL |
| `NEXT_PUBLIC_CARDANO_NETWORK` | Yes | `preprod` or `mainnet` |
| `NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID` | Yes | Access token policy ID |

See `.env.example` for all options and default values.

## Styling Guidelines

Use semantic colors from the design system:

```typescript
// Good
<span className="text-success">Approved</span>
<span className="text-destructive">Error</span>
<span className="text-muted-foreground">Helper text</span>

// Avoid
<span className="text-green-500">Approved</span>
```

Available semantic colors: `success`, `warning`, `info`, `destructive`, `primary`, `secondary`, `muted`

## Learn More

- [Andamio Platform](https://andamio.io) — Platform overview
- [Andamio Docs](https://docs.andamio.io) — Full documentation
- [API Reference](https://dev.api.andamio.io/api/v1/docs/index.html) — Gateway API docs
- [Mesh SDK](https://meshjs.dev) — Cardano wallet integration
- [shadcn/ui](https://ui.shadcn.com) — UI components

## License

MIT
