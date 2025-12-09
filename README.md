# Andamio T3 App Template

A full-featured Cardano dApp template built on the T3 Stack with Mesh SDK, shadcn/ui, and type-safe Andamio API integration.

**Version**: 0.4.0 | **Last Updated**: December 2024

## Current Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Course & Learning** | ✅ Complete | 8 transactions, 129 tests, full lifecycle |
| **Creator Studio** | ✅ Complete | Course/module editing, on-chain sync, rich text |
| **Project System** | 🚧 In Progress | Treasury, tasks, commitments |

📊 **Detailed Status**: [STATUS.md](./STATUS.md) | [ROADMAP.md](./ROADMAP.md)

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **API**: tRPC v11 + Andamio Database API
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Blockchain**: Cardano via Mesh SDK
- **Editor**: Tiptap with custom extensions

## Quick Start

```bash
# From andamio-platform-monorepo root:
./scripts/setup.sh

# Or manually:
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Prerequisites**: Node.js 20+, Andamio Database API running at `localhost:4000`

## Project Structure

```
src/
├── app/(app)/                    # Pages with sidebar layout
│   ├── dashboard/                # User dashboard
│   ├── courses/                  # Course listing (grid/list/table views)
│   ├── course/[coursenft]/       # Learner course views
│   ├── studio/                   # Creator Studio
│   │   ├── course/[coursenft]/   # Course editor (tabbed)
│   │   └── project/[treasurynft]/ # Project editor (tabbed)
│   └── project/[treasurynft]/    # Public project views
│
├── components/
│   ├── andamio/                  # UI wrappers (68+ components)
│   ├── auth/                     # Auth components + RequireAuth
│   ├── courses/                  # Course UI components
│   ├── editor/                   # Tiptap editor (see editor/README.md)
│   ├── studio/                   # Studio components (StudioTabs)
│   └── transactions/             # Transaction components (10+)
│
├── hooks/
│   ├── use-andamio-auth.ts       # Auth state + authenticatedFetch
│   ├── use-andamio-fetch.ts      # Standardized data fetching
│   ├── use-owned-courses.ts      # Course data with module counts
│   ├── use-success-notification.ts # Auto-dismiss notifications
│   └── use-pending-tx-watcher.ts # Transaction monitoring
│
└── lib/
    ├── cardano-utils.ts          # ADA/Lovelace utilities
    ├── constants.ts              # UI timeouts, limits, explorer URLs
    ├── debug-logger.ts           # Conditional debug logging
    └── api-utils.ts              # Error handling
```

## Key Features

### Authentication
Wallet connection + JWT-based auth in a single flow:

```typescript
const { isAuthenticated, authenticatedFetch, logout } = useAndamioAuth();

// Auto-authenticates when wallet connects
// logout() clears JWT AND disconnects wallet
```

### Protected Pages
Use the `RequireAuth` wrapper for auth-gated content:

```typescript
import { RequireAuth } from "~/components/auth/require-auth";

<RequireAuth title="Studio" description="Connect to access">
  <StudioContent />
</RequireAuth>
```

### Type-Safe API Calls
Types imported directly from `@andamio/db-api` via npm workspaces:

```typescript
import { type ListOwnedCoursesOutput } from "@andamio/db-api";

const { data, isLoading, error } = useAndamioFetch<ListOwnedCoursesOutput>({
  endpoint: "/courses/owned",
  authenticated: true,
});
```

### Rich Text Editor
Two components for all content needs:

```typescript
import { ContentEditor, ContentViewer } from "~/components/editor";

<ContentEditor content={content} onContentChange={setContent} showWordCount />
<ContentViewer content={content} />
```

See [`src/components/editor/README.md`](./src/components/editor/README.md) for full documentation.

### Cardano Utilities

```typescript
import { formatLovelace, adaToLovelace, LOVELACE_PER_ADA } from "~/lib/cardano-utils";

formatLovelace(1000000);  // "1 ADA"
adaToLovelace(5);         // 5000000
```

### Success Notifications

```typescript
import { useSuccessNotification, useCopyFeedback } from "~/hooks/use-success-notification";

const { isSuccess, showSuccess } = useSuccessNotification();
const { isCopied, copy } = useCopyFeedback();
```

### Explorer URLs

Network-aware Cardano explorer URLs (supports mainnet, preprod, preview):

```typescript
import { getTransactionExplorerUrl, getTokenExplorerUrl } from "~/lib/constants";

getTransactionExplorerUrl(txHash, "preprod");  // https://preprod.cardanoscan.io/transaction/...
getTokenExplorerUrl(policyId, "mainnet");      // https://cardanoscan.io/token/...
```

### Debug Logging

Conditional logging that's suppressed in production:

```typescript
import { authLogger, pendingTxLogger, learnerLogger } from "~/lib/debug-logger";

authLogger.info("User authenticated");     // Only logs in development
authLogger.error("Auth failed:", error);   // Errors always logged
```

## Data Sources

| Source | Purpose |
|--------|---------|
| **Andamio DB API** | Courses, users, assignments, off-chain data |
| **Andamio Indexer** | UTXOs, datums, on-chain enrollment |
| **Koios API** | Transaction confirmation |

See [docs/DATA-SOURCES.md](./docs/DATA-SOURCES.md) for architecture details.

## Styling

Use semantic colors only - never hardcoded Tailwind colors:

```typescript
// ✅ Correct
<CheckCircle className="text-success" />
<span className="text-destructive">Error</span>
<p className="text-muted-foreground">Helper text</p>

// ❌ Never
<CheckCircle className="text-green-600" />
```

**Available**: `success`, `warning`, `info`, `destructive`, `primary`, `secondary`, `muted`

See [docs/SEMANTIC-COLORS.md](./docs/SEMANTIC-COLORS.md) for complete guide.

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run typecheck    # Type checking
npm run lint         # Linting
```

## Adding a New Page

```typescript
// src/app/(app)/my-page/page.tsx
"use client";

import { RequireAuth } from "~/components/auth/require-auth";

export default function MyPage() {
  return (
    <RequireAuth title="My Page" description="Connect to view">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Page</h1>
        {/* Content */}
      </div>
    </RequireAuth>
  );
}
```

Add to sidebar in `src/components/layout/app-sidebar.tsx`.

## Documentation

- [STATUS.md](./STATUS.md) - Implementation status
- [ROADMAP.md](./ROADMAP.md) - Development roadmap
- [docs/API-ENDPOINT-REFERENCE.md](./docs/API-ENDPOINT-REFERENCE.md) - API endpoints
- [docs/DATA-SOURCES.md](./docs/DATA-SOURCES.md) - Data architecture
- [docs/SEMANTIC-COLORS.md](./docs/SEMANTIC-COLORS.md) - Color system
- [src/components/editor/README.md](./src/components/editor/README.md) - Editor docs
- [.claude/CLAUDE.md](./.claude/CLAUDE.md) - Development guidelines

## Resources

- [Andamio Platform](https://andamio.io) | [Andamio Docs](https://docs.andamio.io)
- [T3 Stack](https://create.t3.gg/) | [Next.js](https://nextjs.org/docs)
- [Mesh SDK](https://meshjs.dev) | [shadcn/ui](https://ui.shadcn.com)

## License

MIT
