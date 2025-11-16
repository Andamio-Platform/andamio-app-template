# Andamio T3 App Template

A clean, minimal template for building Cardano dApps with Andamio API integration. Built on the [T3 Stack](https://create.t3.gg/) with Mesh SDK for wallet connectivity and shadcn/ui components.

## Features

### Full-Screen App Layout
- **Sidebar Navigation** - Clean sidebar with app navigation
- **Full-screen Layout** - App fills entire viewport
- **Responsive Design** - Mobile-friendly from the start

### User Dashboard
- **Wallet Information** - Connected wallet address and user ID
- **Access Token Details** - Token alias and JWT expiration
- **Authentication Status** - Clear visual status indicators

### Course Management
- **Owned Courses** - View all courses you own or contribute to
- **Course Details** - Title, description, status, category, access tier
- **Live/Draft Status** - Visual badges for course status

### Wallet Authentication
- **Cardano Wallet Connection** via Mesh SDK
- **Signature-based Authentication** with Andamio Database API
- **JWT Management** with automatic expiration handling
- **Persistent Sessions** via localStorage

### Andamio API Integration
- **Type-safe API calls** with proper error handling
- **Authenticated requests** with JWT bearer tokens
- **Clean error states** with shadcn/ui alerts

### UI Components
- **Full shadcn/ui suite** - All 45+ components pre-installed
- **Clean, minimal design** - No custom styling, pure shadcn/ui

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **API**: tRPC v11
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (complete suite)
- **Blockchain**: Cardano (via Mesh SDK)
- **State Management**: React hooks + tRPC React Query

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Andamio Database API running (default: `http://localhost:4000/api`)
- **Linked `andamio-database-api` package** for type imports

### Installation

```bash
# Install dependencies
npm install

# Link andamio-database-api package (for type safety)
# This should already be set up via symlink to ../../andamio-database-api
# Verify the link exists:
ls -la node_modules/andamio-database-api

# Copy environment variables
cp .env.example .env

# Update .env with your Andamio API URL
# NEXT_PUBLIC_ANDAMIO_API_URL="http://localhost:4000/api"
```

**Note**: This template is part of the `andamio-platform` monorepo and uses a local link to `andamio-database-api` for importing types. The symlink `node_modules/andamio-database-api -> ../../andamio-database-api` provides full type safety across the stack.

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                               # Next.js App Router
│   ├── (app)/                        # App layout route group
│   │   ├── layout.tsx                # App layout wrapper
│   │   ├── dashboard/
│   │   │   └── page.tsx              # User dashboard page
│   │   └── courses/
│   │       └── page.tsx              # Courses page
│   ├── layout.tsx                    # Root layout with MeshProvider
│   └── page.tsx                      # Home (redirects to dashboard)
│
├── components/
│   ├── auth/
│   │   └── andamio-auth-button.tsx   # Complete auth UI
│   ├── courses/
│   │   └── owned-courses-list.tsx    # Display owned courses
│   ├── layout/
│   │   ├── app-layout.tsx            # Full-screen app layout
│   │   └── app-sidebar.tsx           # Sidebar navigation
│   ├── providers/
│   │   └── mesh-provider.tsx         # Mesh SDK provider
│   └── ui/                           # shadcn/ui components (45+)
│
├── hooks/
│   └── use-andamio-auth.ts           # Auth state management
│
├── lib/
│   ├── andamio-auth.ts               # Auth service functions
│   └── utils.ts                      # Utility functions
│
├── server/
│   └── api/
│       ├── routers/                  # tRPC routers
│       ├── root.ts                   # Router configuration
│       └── trpc.ts                   # tRPC setup
│
├── trpc/                             # tRPC client setup
└── env.js                            # Environment validation
```

## Authentication Flow

1. **Connect Wallet** - User connects Cardano wallet via Mesh SDK
2. **Create Session** - Request nonce from `/auth/login/session`
3. **Sign Message** - User signs nonce with their wallet
4. **Validate Signature** - Send signature to `/auth/login/validate`
5. **Store JWT** - Save JWT to localStorage for authenticated requests
6. **Make Requests** - Include JWT in Authorization header

## API Integration

### Type Safety with `andamio-database-api`

**IMPORTANT**: This template imports types directly from the `andamio-database-api` package to ensure type safety across the entire stack.

**Setup**: The `andamio-database-api` package is linked via symlink:
```bash
node_modules/andamio-database-api -> ../../andamio-database-api
```

This monorepo-style linking provides:
- Direct access to type definitions from the database API
- Real-time type updates as the API evolves
- Zero build step for type synchronization

**Example**:
```typescript
import { type ListOwnedCoursesOutput } from "andamio-database-api";

const [courses, setCourses] = useState<ListOwnedCoursesOutput>([]);
```

**Benefits**:
- ✅ Type safety - Types match the API exactly
- ✅ No type drift - Changes to API types are immediately reflected
- ✅ Autocomplete - Full IDE support for API response shapes
- ✅ Compile-time errors - Catch API mismatches before runtime
- ✅ Monorepo integration - Seamless development across packages

### Andamio Database API Endpoints Used

#### Authentication
- `POST /auth/login/session` - Create login session, get nonce
- `POST /auth/login/validate` - Validate signature, get JWT

#### Courses
- `GET /courses/owned` - List courses owned by authenticated user
  - **Auth Required**: Yes (JWT in Authorization header)
  - **Response Type**: `ListOwnedCoursesOutput` (from `andamio-database-api`)
  - **Response**: Array of Course objects with fields:
    - `courseCode`, `courseNftPolicyId`, `title`, `description`
    - `category`, `imageUrl`, `videoUrl`, `live`, `accessTier`

### Making Authenticated Requests

```typescript
import { useAndamioAuth } from "~/hooks/use-andamio-auth";

function MyComponent() {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const fetchData = async () => {
    const response = await authenticatedFetch(
      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/your-endpoint`
    );
    const data = await response.json();
    return data;
  };
}
```

## App Layout

The app uses a full-screen layout with sidebar navigation:

### Layout Structure
- **Sidebar (left)** - 256px fixed width navigation
- **Content Area (right)** - Fills remaining screen space
- **Full Height** - Layout fills entire viewport (100vh)

### Navigation
- **Dashboard** (`/dashboard`) - User wallet and token information
- **Courses** (`/courses`) - Owned courses list

### Route Groups
The app uses Next.js route groups `(app)` to apply the sidebar layout only to authenticated pages:
- `/` - Home page (redirects to dashboard)
- `/(app)/dashboard` - Dashboard with sidebar layout
- `/(app)/courses` - Courses with sidebar layout

## Pages

### Dashboard (`/dashboard`)
User information and authentication status.

**When Not Authenticated**:
- Shows authentication button
- Prompts user to connect wallet

**When Authenticated**:
- **Wallet Information Card**
  - Full Cardano wallet address
  - User ID
- **Access Token Card**
  - Token alias (if available)
  - JWT expiration time
  - Token status badge

### Courses (`/courses`)
Course management interface.

**When Not Authenticated**:
- Shows authentication button

**When Authenticated**:
- Lists all owned courses
- Shows course details (title, description, status)
- Displays badges (Live/Draft, category, access tier)

## Components

### Layout Components

#### `AppLayout`
Full-screen wrapper with sidebar and content area.

**Usage**:
```typescript
<AppLayout>
  {children}
</AppLayout>
```

#### `AppSidebar`
Left sidebar navigation with user info.

**Features**:
- Navigation links to Dashboard and Courses
- Active route highlighting
- Connected wallet display (truncated)
- Disconnect button

### Auth Components

#### `AndamioAuthButton`
Complete authentication interface.

**Features**:
- Wallet connection UI (via Mesh CardanoWallet)
- Sign message prompt
- Authenticated state display
- Logout functionality

**States**:
- Not connected - Shows wallet connection UI
- Connected, not authenticated - Shows "Sign Message" button
- Authenticated - Shows user info and logout button

### Course Components

#### `OwnedCoursesList`
Displays courses owned by authenticated user.

**Features**:
- Automatic fetching when authenticated
- Loading states with skeleton UI
- Error handling with alerts
- Empty state for no courses
- Course details with badges

**Data Displayed**:
- Course title and description
- Course code (monospace)
- Live/Draft status badge
- Category and access tier

### Hooks

#### `useAndamioAuth`
Manages authentication state and provides helpers.

**Returns**:
```typescript
{
  // State
  isAuthenticated: boolean;
  user: AuthUser | null;
  jwt: string | null;
  isAuthenticating: boolean;
  authError: string | null;
  isWalletConnected: boolean;

  // Actions
  authenticate: () => Promise<void>;
  logout: () => void;
  authenticatedFetch: (url: string, options?: RequestInit) => Promise<Response>;
}
```

## Environment Variables

```bash
# Required
NEXT_PUBLIC_ANDAMIO_API_URL="http://localhost:4000/api"

# Optional for build
NODE_ENV="development"
SKIP_ENV_VALIDATION="false"
```

## Scripts

```bash
npm run dev          # Start dev server (with Turbopack)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run typecheck    # Run TypeScript compiler check
npm run check        # Run lint + typecheck
npm run format:check # Check Prettier formatting
npm run format:write # Fix Prettier formatting
```

## Styling Guidelines

**IMPORTANT**: This template uses shadcn/ui components exclusively.

- ✅ Use shadcn/ui components from `~/components/ui/`
- ✅ Compose shadcn components for complex UIs
- ❌ No custom Tailwind classes (unless absolutely necessary)
- ❌ No inline styles
- ❌ No CSS modules

## Adding Features

### Adding a New Page

1. Create page in `src/app/(app)/my-page/page.tsx`:
```typescript
"use client";

import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

export default function MyPage() {
  const { isAuthenticated } = useAndamioAuth();

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">My Page</h1>
          <p className="text-muted-foreground">
            Connect your wallet to view this page
          </p>
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
        <p className="text-muted-foreground">Page description</p>
      </div>
      {/* Page content */}
    </div>
  );
}
```

2. Add navigation link to sidebar in `src/components/layout/app-sidebar.tsx`:
```typescript
const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Courses", href: "/courses", icon: BookOpen },
  { name: "My Page", href: "/my-page", icon: YourIcon }, // Add here
];
```

### Adding a New API Endpoint

**IMPORTANT**: Always import types from `andamio-database-api` package instead of defining them locally. This ensures type safety and prevents type drift.

1. Import type from `andamio-database-api`:
```typescript
import { type MyDataOutput } from "andamio-database-api";
```

2. Make authenticated request:
```typescript
const { authenticatedFetch } = useAndamioAuth();

const response = await authenticatedFetch(
  `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/my-endpoint`
);
const data = (await response.json()) as MyDataOutput;
```

**Example** (from `OwnedCoursesList`):
```typescript
import { type ListOwnedCoursesOutput } from "andamio-database-api";

const [courses, setCourses] = useState<ListOwnedCoursesOutput>([]);

const data = (await response.json()) as ListOwnedCoursesOutput;
setCourses(data ?? []);
```

3. Create component with shadcn/ui:
```typescript
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";

export function MyComponent() {
  // Component logic
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Data</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

### Adding a tRPC Route

1. Create router in `src/server/api/routers/`:
```typescript
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const myRouter = createTRPCRouter({
  myQuery: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return { data: "Hello" };
    }),
});
```

2. Add to `src/server/api/root.ts`:
```typescript
import { myRouter } from "~/server/api/routers/my-router";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  my: myRouter, // Add here
});
```

3. Use in component:
```typescript
import { api } from "~/trpc/react";

const { data, isLoading } = api.my.myQuery.useQuery({ id: "123" });
```

## Learn More

### T3 Stack Resources
- [T3 Stack Documentation](https://create.t3.gg/)
- [Next.js Documentation](https://nextjs.org/docs)
- [tRPC Documentation](https://trpc.io)

### Andamio Resources
- [Andamio Platform](https://andamio.io)
- [Andamio Documentation](https://docs.andamio.io)

### UI & Styling
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)

### Cardano
- [Mesh SDK Documentation](https://meshjs.dev)
- [Cardano Documentation](https://docs.cardano.org)

## License

MIT
