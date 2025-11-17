# CLAUDE.md - Andamio T3 App Template

This file provides guidance to Claude Code when working with this specific project.

## Project Overview

This is an Andamio T3 App template that provides a complete Cardano dApp starter with:
- Next.js 15 with App Router
- tRPC v11
- Tailwind CSS v4
- Mesh SDK for Cardano wallet integration
- shadcn/ui component library (full suite installed)
- Full-screen app layout with sidebar navigation
- Wallet-based authentication with Andamio Database API
- Type-safe API integration via linked `andamio-db-api` package

## Architecture

### Monorepo Setup
This template is part of the `andamio-platform` monorepo:
```
andamio-platform/
├── andamio-db-api/     # Linked for type imports
├── andamio-t3-app-template/  # This project
└── ...
```

The `andamio-db-api` package is linked via symlink:
```bash
node_modules/andamio-db-api -> ../../andamio-db-api
```

### Type Safety
**CRITICAL**: Always import types from `andamio-db-api` package:

```typescript
// ✅ Correct
import { type ListOwnedCoursesOutput } from "andamio-db-api";

// ❌ Wrong - Never define API types locally
interface Course { ... }
```

This ensures zero type drift between the API and the app.

## App Layout Structure

### Full-Screen Layout
The app uses a full-screen layout with sidebar navigation:

```
┌─────────────────────────────────────┐
│  Sidebar  │  Content Area           │
│  (256px)  │  (fills remaining)      │
│           │                          │
│  Nav      │  Page content            │
│  Links    │  scrollable              │
│           │                          │
│  User     │                          │
│  Info     │                          │
└─────────────────────────────────────┘
```

**Components**:
- `AppLayout` - Full-screen wrapper (`src/components/layout/app-layout.tsx`)
- `AppSidebar` - Left sidebar with navigation (`src/components/layout/app-sidebar.tsx`)

### Route Structure
```
/                      → Redirects to /dashboard
/(app)/dashboard       → User dashboard with sidebar
/(app)/courses         → Courses page with sidebar
```

The `(app)` route group applies the sidebar layout automatically.

## Pages

### Dashboard (`/dashboard`)
Displays wallet and access token information.

**Features**:
- Wallet address and user ID
- Access token details (alias, JWT expiration)
- Authentication status indicators
- Auth gate (shows login if not authenticated)

### Courses (`/courses`)
Lists courses owned by the authenticated user.

**Features**:
- Fetches from `/courses/owned` endpoint
- Displays course cards with badges (Live/Draft, category, access tier)
- Loading states, error handling, empty states
- Auth gate

## Authentication Flow

1. User connects Cardano wallet (Mesh SDK)
2. App requests nonce from `/auth/login/session`
3. User signs nonce with wallet
4. App validates signature at `/auth/login/validate`
5. JWT stored in localStorage
6. JWT included in all authenticated requests

**Components**:
- `AndamioAuthButton` - Complete auth UI (`src/components/auth/andamio-auth-button.tsx`)
- `useAndamioAuth` - Auth state management hook (`src/hooks/use-andamio-auth.ts`)

## Styling Guidelines

**CRITICAL: Use only shadcn/ui components. No custom styling.**

**Rules**:
- ✅ Use shadcn/ui components from `~/components/ui/`
- ✅ Compose shadcn components for complex UIs
- ❌ No custom Tailwind classes (unless absolutely necessary)
- ❌ No inline styles
- ❌ No CSS modules

**Available Components** (45+):
- accordion, alert, alert-dialog, aspect-ratio, avatar
- badge, breadcrumb, button
- calendar, card, carousel, chart, checkbox, collapsible, command, context-menu
- dialog, drawer, dropdown-menu
- form, hover-card
- input, input-otp
- label
- menubar
- navigation-menu
- pagination, popover, progress
- radio-group, resizable
- scroll-area, select, separator, sheet, skeleton, slider, sonner, switch
- table, tabs, textarea, toggle, toggle-group, tooltip

## API Integration

### Authenticated Requests
Use the `authenticatedFetch` helper from `useAndamioAuth`:

```typescript
const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

const response = await authenticatedFetch(
  `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/your-endpoint`
);
const data = (await response.json()) as YourTypeFromDatabaseAPI;
```

### Andamio Database API Endpoints

**Authentication**:
- `POST /auth/login/session` - Get nonce
- `POST /auth/login/validate` - Validate signature, get JWT

**Courses**:
- `GET /courses/owned` - List owned courses (requires JWT)
  - Returns `ListOwnedCoursesOutput` type

## Adding New Features

### Adding a New Page

1. Create page in `src/app/(app)/my-page/page.tsx`:
```typescript
"use client";

import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";

export default function MyPage() {
  const { isAuthenticated } = useAndamioAuth();

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Page</h1>
          <p className="text-muted-foreground">Connect to view</p>
        </div>
        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Page</h1>
        <p className="text-muted-foreground">Description</p>
      </div>
      {/* Content */}
    </div>
  );
}
```

2. Add to sidebar navigation in `src/components/layout/app-sidebar.tsx`:
```typescript
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "My Page", href: "/my-page", icon: YourIcon },
];
```

### Adding New API Endpoint

1. Import type from `andamio-db-api`:
```typescript
import { type YourOutputType } from "andamio-db-api";
```

2. Make authenticated request:
```typescript
const response = await authenticatedFetch(
  `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/your-endpoint`
);
const data = (await response.json()) as YourOutputType;
```

3. Build UI with shadcn/ui components.

## Key Files

**Layout**:
- `src/app/(app)/layout.tsx` - App layout wrapper
- `src/components/layout/app-layout.tsx` - Full-screen layout
- `src/components/layout/app-sidebar.tsx` - Sidebar navigation

**Pages**:
- `src/app/page.tsx` - Home (redirects to dashboard)
- `src/app/(app)/dashboard/page.tsx` - User dashboard
- `src/app/(app)/courses/page.tsx` - Courses page

**Auth**:
- `src/hooks/use-andamio-auth.ts` - Auth hook
- `src/lib/andamio-auth.ts` - Auth service functions
- `src/components/auth/andamio-auth-button.tsx` - Auth UI

**Courses**:
- `src/components/courses/owned-courses-list.tsx` - Course list component

## Documentation

**CRITICAL: Always update docs with every commit.**

Main documentation file: `README.md`

Update sections when you:
- Add new pages or components
- Add new API endpoints
- Change architecture or patterns
- Update dependencies

The README should always reflect the current state of the project.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **API**: tRPC v11
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (default configuration)
- **Blockchain**: Cardano (via Mesh SDK)
- **State Management**: React hooks + tRPC
- **Type Safety**: Direct imports from `andamio-db-api`

## Environment Variables

```bash
NEXT_PUBLIC_ANDAMIO_API_URL="http://localhost:4000/api"
```

## Development Commands

```bash
npm run dev          # Start dev server (with Turbopack)
npm run build        # Build for production
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm run lint:fix     # Fix linting errors
```
