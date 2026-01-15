# Andamio T3 App Template

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-0.5.0-green.svg)](./CHANGELOG.md)

A full-featured Cardano dApp template built on the T3 Stack with Mesh SDK, shadcn/ui, and type-safe Andamio API integration.

**Version**: 0.5.0 | **Last Updated**: January 14, 2026 | [CHANGELOG](./CHANGELOG.md)

## Current Status

| Phase | Status | Description |
|-------|--------|-------------|
| **Course & Learning** | ✅ Complete | 16 transactions, full learner/instructor lifecycle |
| **Creator Studio** | ✅ Complete | Course/module editing, on-chain sync, rich text |
| **Project System** | 🚧 In Progress | Treasury, tasks, commitments (9 tx components) |

📊 **Detailed Status**: [STATUS.md](./.claude/skills/project-manager/STATUS.md) | [ROADMAP.md](./.claude/skills/project-manager/ROADMAP.md)

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript
- **API**: tRPC v11 + Andamio Database API (Go)
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Blockchain**: Cardano via Mesh SDK
- **Editor**: Tiptap with custom extensions
- **Transactions**: `@andamio/transactions` (embedded local package)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/Andamio-Platform/andamio-t3-app-template.git
cd andamio-t3-app-template

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Prerequisites**: Node.js 20+

The template connects to the deployed Andamio APIs by default (no local backend required).

## Repository Structure

This is a **standalone repository** with an embedded transactions package:

```
andamio-t3-app-template/
├── src/                              # Next.js app source
│   ├── app/(app)/                    # Pages with sidebar layout
│   │   ├── dashboard/                # User dashboard
│   │   ├── course/[coursenft]/       # Learner course views
│   │   ├── studio/                   # Creator Studio
│   │   │   ├── course/[coursenft]/   # Course editor (tabbed)
│   │   │   └── project/[projectid]/  # Project editor (tabbed)
│   │   └── project/[projectid]/      # Public project views
│   │
│   ├── components/
│   │   ├── andamio/                  # UI wrappers (68+ components)
│   │   ├── auth/                     # Auth components + RequireAuth
│   │   ├── editor/                   # Tiptap editor (see editor/README.md)
│   │   ├── studio/                   # Studio components (StudioTabs)
│   │   └── transactions/             # Transaction components (16+)
│   │
│   ├── hooks/
│   │   ├── use-andamio-auth.ts       # Auth state + authenticatedFetch
│   │   ├── use-andamio-fetch.ts      # Standardized data fetching
│   │   └── use-pending-tx-watcher.ts # Transaction monitoring
│   │
│   └── lib/
│       ├── cardano-utils.ts          # ADA/Lovelace utilities
│       └── constants.ts              # UI timeouts, explorer URLs
│
├── packages/
│   └── andamio-transactions/         # Transaction definitions (local package)
│       ├── src/definitions/          # All 16 transaction types
│       └── README.md                 # Transaction package docs
│
└── .claude/skills/                   # AI-assisted development skills
```

The `@andamio/transactions` package is embedded locally, allowing direct editing of transaction definitions without publishing.

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
Types imported from `@andamio/db-api-types` package:

```typescript
import { type CourseListResponse } from "@andamio/db-api-types";

const { data, isLoading, error } = useAndamioFetch<CourseListResponse>({
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
| **Andamio DB API** (Go) | Courses, users, assignments, off-chain data |
| **Andamioscan** | UTXOs, datums, on-chain enrollment |
| **Atlas TX API** | Transaction building |
| **Koios API** | Transaction confirmation |

All APIs are deployed and accessible via environment variables - no local backend required.

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

See [docs/styling/SEMANTIC-COLORS.md](./docs/styling/SEMANTIC-COLORS.md) for complete guide.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start development server with Turbopack hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Run production server (after build) |
| `npm run check` | Run lint + typecheck together (use before commits) |
| `npm run typecheck` | TypeScript type checking only |
| `npm run lint` | ESLint code quality check |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format:write` | Format code with Prettier |
| `npm run format:check` | Check formatting without changes |
| `npm run preview` | Build and start production locally |

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

### Getting Started
- [.claude/skills/project-manager/GETTING-STARTED.md](./.claude/skills/project-manager/GETTING-STARTED.md) - **New? Start here**
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [CHANGELOG.md](./CHANGELOG.md) - Version history

### Reference
- [.claude/skills/project-manager/STATUS.md](./.claude/skills/project-manager/STATUS.md) - Implementation status
- [.claude/skills/project-manager/ROADMAP.md](./.claude/skills/project-manager/ROADMAP.md) - Development roadmap
- [src/components/editor/README.md](./src/components/editor/README.md) - Editor docs
- [packages/andamio-transactions/README.md](./packages/andamio-transactions/README.md) - Transaction package docs
- [.claude/CLAUDE.md](./.claude/CLAUDE.md) - AI development guidelines

## Resources

- [Andamio Platform](https://andamio.io) | [Andamio Docs](https://docs.andamio.io)
- [T3 Stack](https://create.t3.gg/) | [Next.js](https://nextjs.org/docs)
- [Mesh SDK](https://meshjs.dev) | [shadcn/ui](https://ui.shadcn.com)

## License

MIT
