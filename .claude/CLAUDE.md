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

## Coding Conventions

### Variable Naming

**CRITICAL: Never use `module` as a standalone variable name.**

**Why?**
- `module` is a reserved identifier in Node.js/CommonJS (e.g., `module.exports`, `module.id`)
- Can cause naming conflicts and potential runtime issues
- Reduces code clarity and maintainability

**Rules**:
- ✅ Always use `courseModule` for course module variables
- ✅ Be specific and descriptive with variable names
- ❌ Never use `module` alone as a variable name
- ❌ Avoid other reserved/ambiguous names (e.g., `window`, `document`, `global`)

**Examples**:

```typescript
// ✅ CORRECT - Specific and safe
const [courseModule, setCourseModule] = useState<CourseModuleOutput | null>(null);

if (!courseModule) {
  return <div>Module not found</div>;
}

const handleUpdate = async () => {
  const updatedModule = await updateCourseModule(courseModule.id);
  setCourseModule(updatedModule);
};
```

```typescript
// ❌ WRONG - Using reserved identifier
const [module, setModule] = useState<CourseModuleOutput | null>(null);

if (!module) {  // Dangerous!
  return <div>Module not found</div>;
}
```

**Apply this principle to other domain objects**:
- Use `courseData` instead of `course` when `Course` is also a type
- Use `lessonData` instead of `lesson` when appropriate
- Use `assignmentData` instead of `assignment` when appropriate
- Be explicit to avoid conflicts with type names and reserved words

### Course Module and SLT References

**CRITICAL: Always use canonical identifiers when referencing Course Modules and SLTs.**

**Course Modules**: Always reference by **Module Code** (e.g., `101`, `MODULE-A`), not by title or index.

**SLTs (Student Learning Targets)**: Always reference using the format `<module-code>.<module-index>` (e.g., `101.3`, `MODULE-A.5`).

**Examples**:

```typescript
// ✅ CORRECT - Module referenced by code
<span className="font-mono">{courseModule.module_code}</span>

// ✅ CORRECT - SLT reference format
<span className="font-mono">{moduleCode}.{slt.module_index}</span>
// Displays: "101.3" or "MODULE-A.5"

// ❌ WRONG - Using sequential index
<span>{index + 1}. {slt.slt_text}</span>
```

**Where this applies**:
- Module wizard step-slts component
- Course preview panels
- SLT lists and tables
- Any UI displaying module or SLT identifiers

### Shared UI Types

**CRITICAL: Use shared types from `~/types/ui` for consistent icon and navigation patterns.**

The `src/types/ui.ts` file provides type-safe definitions for common UI patterns involving Lucide icons. Always import from here instead of defining local types.

**Available Types**:
- `IconComponent` - Type alias for Lucide icon components
- `NavItem` - Navigation items (sidebar, mobile nav)
- `IconListItem` - Items with icon, title, description (feature lists, value props)
- `StepItem` - Onboarding steps with completion state
- `RouteCategory` / `RouteInfo` - Route documentation (sitemap)
- `TabItem` - Tab definitions for tabbed interfaces

**Examples**:

```typescript
// ✅ CORRECT - Import from shared types
import type { NavItem, IconComponent } from "~/types/ui";

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Overview" },
];
```

```typescript
// ❌ WRONG - Defining local types for icons
type IconType = typeof LayoutDashboard;

interface NavItem {
  icon: IconType;
  // ...
}
```

**When to Add New Types**:
Add new types to `~/types/ui.ts` when:
1. The pattern involves Lucide icons
2. The pattern is used in 2+ files
3. The pattern represents a common UI concept

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

The authentication flow combines wallet connection and signing into a single seamless step:

1. User connects Cardano wallet (Mesh SDK)
2. **Auto-authenticate** - Signing prompt appears automatically after wallet connects
3. User signs nonce with wallet (session creation + validation happens automatically)
4. JWT stored in localStorage
5. JWT included in all authenticated requests

**Logout**: Clears JWT AND disconnects wallet, returning user to initial state.

**Components**:
- `AndamioAuthButton` - Complete auth UI with auto-authentication (`src/components/auth/andamio-auth-button.tsx`)
- `useAndamioAuth` - Auth state management hook with auto-auth on wallet connect (`src/hooks/use-andamio-auth.ts`)
- `AndamioAuthProvider` - Context provider that manages global auth state (`src/contexts/andamio-auth-context.tsx`)

## Styling Guidelines

**CRITICAL: Use only shadcn/ui components and semantic colors. No custom styling.**

**Rules**:
- ✅ Use shadcn/ui components from `~/components/ui/`
- ✅ Compose shadcn components for complex UIs
- ✅ Use ONLY semantic color variables from `src/styles/globals.css`
- ❌ No custom Tailwind classes (unless absolutely necessary)
- ❌ No inline styles
- ❌ No CSS modules
- ❌ **NEVER** use hardcoded color classes like `text-blue-600`, `bg-green-500`, etc.

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

### Text Styling with AndamioText

**CRITICAL: Use `AndamioText` component for all paragraph text instead of raw `<p>` tags with className.**

```typescript
import { AndamioText } from "~/components/andamio";

// ✅ CORRECT - Using AndamioText
<AndamioText variant="muted">Helper text description</AndamioText>
<AndamioText variant="small">Small helper text</AndamioText>
<AndamioText variant="lead">Large intro paragraph</AndamioText>

// ❌ WRONG - Raw p tags with className
<p className="text-muted-foreground">Helper text</p>
<p className="text-sm text-muted-foreground">Small text</p>
```

**Variants**:
| Variant | Use Case |
|---------|----------|
| `default` | Regular body text |
| `muted` | Descriptions, helper text |
| `small` | Small helper/secondary text |
| `lead` | Large intro paragraphs |
| `overline` | Uppercase labels/categories |

## Semantic Color System

**CRITICAL: Always use semantic color variables. Never use hardcoded Tailwind colors.**

All colors are defined in `src/styles/globals.css` with full light/dark mode support.

### Available Semantic Colors

**Base Colors**:
- `background` / `foreground` - Main page background and text
- `card` / `card-foreground` - Card backgrounds and text
- `popover` / `popover-foreground` - Popover backgrounds and text

**Interactive Colors**:
- `primary` / `primary-foreground` - Primary actions, links
- `secondary` / `secondary-foreground` - Secondary actions
- `muted` / `muted-foreground` - Muted/subtle elements
- `accent` / `accent-foreground` - Accent/highlight elements

**Status Colors**:
- `destructive` / `destructive-foreground` - Errors, destructive actions (red)
- `success` / `success-foreground` - Success states, completed items (green)
- `warning` / `warning-foreground` - Warnings, pending states (yellow/amber)
- `info` / `info-foreground` - Informational states, neutral actions (blue)

**Utility Colors**:
- `border` - Borders and dividers (use for ALL borders including inputs)
- `ring` - Focus rings

**Chart Colors**:
- `chart-1` through `chart-5` - Data visualization colors

**Sidebar Colors**:
- `sidebar` / `sidebar-foreground`
- `sidebar-primary` / `sidebar-primary-foreground`
- `sidebar-accent` / `sidebar-accent-foreground`
- `sidebar-border` / `sidebar-ring`

### Color Usage Examples

**✅ CORRECT - Using semantic colors**:
```typescript
// Success state
<CheckCircle className="h-4 w-4 text-success" />
<span className="text-success">Success!</span>

// Warning state
<AlertTriangle className="h-4 w-4 text-warning" />
<Badge variant="outline">Warning</Badge>

// Info/pending state
<Clock className="h-4 w-4 text-info" />

// Error/destructive state
<XCircle className="h-4 w-4 text-destructive" />
<div className="text-destructive">Error message</div>

// Links
<a href="..." className="text-primary hover:underline">Link</a>

// Muted/subtle text
<p className="text-muted-foreground">Helper text</p>
```

**❌ WRONG - Hardcoded colors**:
```typescript
// Never do this!
<CheckCircle className="h-4 w-4 text-green-600" />
<div className="bg-blue-500 hover:bg-blue-600">Button</div>
<span className="text-red-600">Error</span>
<a className="text-blue-600 hover:underline">Link</a>
```

### When to Use Which Color

**Success (green)**:
- Completed tasks/assignments
- Successful operations
- Active/connected states
- Checkmarks and confirmations

**Warning (yellow/amber)**:
- Pending approvals
- Cautionary information
- Non-critical alerts
- In-progress states

**Info (blue)**:
- Informational messages
- Neutral status indicators
- Help text
- Pending/awaiting states

**Destructive (red)**:
- Errors and failures
- Destructive actions (delete, remove)
- Critical alerts
- Denied/rejected states

**Primary (theme-dependent)**:
- Links and hyperlinks
- Primary call-to-action buttons
- Active navigation items
- Brand-related elements

**Muted**:
- Placeholder text
- Helper text
- Disabled states
- Secondary information

### Adding New Semantic Colors

If you need a new semantic color:

1. Add to `@theme inline` block in `globals.css`:
```css
--color-your-color: var(--your-color);
--color-your-color-foreground: var(--your-color-foreground);
```

2. Add light mode values in `:root`:
```css
--your-color: oklch(0.6 0.15 145);
--your-color-foreground: oklch(0.985 0 0);
```

3. Add dark mode values in `.dark`:
```css
--your-color: oklch(0.7 0.15 145);
--your-color-foreground: oklch(0.145 0 0);
```

4. Document the new color in this section
5. Update relevant components to use it

### Tailwind v4 Reserved Color Names

**CRITICAL: Do NOT use HTML element names as color names in Tailwind v4.**

Tailwind v4 silently ignores color definitions that conflict with HTML element names. These colors will NOT work:

- ❌ `--color-input` → use `--color-input-field` or just use `border`
- ❌ `--color-button` → use `--color-button-bg` or similar
- ❌ `--color-form` → use `--color-form-field` or similar
- ❌ `--color-select` → use `--color-select-bg` or similar
- ❌ `--color-table` → use `--color-table-bg` or similar

**Why this matters**: If you define `--color-input` in `@theme inline`, Tailwind will generate the `.border-input` utility class, but the color resolution silently fails. The border appears invisible with no error message.

**Recommended approach**: Use `border-border` for all form element borders. This is simple, consistent, and works reliably.

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
- `src/components/courses/course-breadcrumb.tsx` - Navigation breadcrumbs for course/studio routes

**Types**:
- `src/types/ui.ts` - Shared UI types (IconComponent, NavItem, StepItem, TabItem, etc.)

**Responsive Layout** (see `.claude/skills/review-styling/responsive-design.md` for full docs):
- `src/components/andamio/andamio-page-header.tsx` - Responsive page headers (h1)
- `src/components/andamio/andamio-section-header.tsx` - Responsive section headers (h2/h3)
- `src/components/andamio/andamio-table-container.tsx` - Scrollable table wrapper
- `src/styles/globals.css` - Breakpoint definitions (xs, sm, md, lg, xl, 2xl)

**Editor** (see `src/components/editor/README.md` for full docs):
- `src/components/editor/index.ts` - Main exports
- `src/components/editor/components/ContentEditor/index.tsx` - **Primary editing component**
- `src/components/editor/components/ContentViewer/index.tsx` - **Primary viewing component**
- `src/components/editor/extension-kits/shared.ts` - Unified extension configuration

## Editor Usage

**CRITICAL: Use only ContentEditor and ContentViewer for all content editing/viewing.**

```typescript
import { ContentEditor, ContentViewer } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";

// Store content in state
const [content, setContent] = useState<JSONContent | null>(initialContent);

// For editing
<ContentEditor
  content={content}
  onContentChange={setContent}
  showWordCount
/>

// For viewing
<ContentViewer content={content} />
```

**DO NOT use deprecated patterns**:
- ❌ `useAndamioEditor` hook
- ❌ `RenderEditor` component
- ❌ `AndamioFixedToolbar` component
- ❌ `FullscreenEditorWrapper` component

## Responsive Design

**CRITICAL: Use Andamio layout components for consistent, responsive layouts across all pages.**

See `.claude/skills/review-styling/responsive-design.md` for the complete style guide.

### Key Components

```typescript
import { AndamioPageHeader, AndamioSectionHeader, AndamioTableContainer } from "~/components/andamio";

// Page headers (h1)
<AndamioPageHeader
  title="Page Title"
  description="Optional description"
  action={<Button>Action</Button>}  // Stacks on mobile
/>

// Section headers (h2)
<AndamioSectionHeader
  title="Section Title"
  icon={<Icon className="h-5 w-5" />}
  action={<Button>Action</Button>}
/>

// Responsive tables
<AndamioTableContainer>
  <AndamioTable>...</AndamioTable>
</AndamioTableContainer>
```

### Breakpoints

Defined in `src/styles/globals.css`:
- `xs:` 375px - Small phones
- `sm:` 640px - Large phones, small tablets
- `md:` 768px - Tablets
- `lg:` 1024px - Laptops
- `xl:` 1280px - Desktops
- `2xl:` 1536px - Large monitors

### Common Patterns

```typescript
// Flex stacking: vertical on mobile, horizontal on larger
<div className="flex flex-col sm:flex-row gap-4">

// Responsive text
<h1 className="text-2xl sm:text-3xl font-bold">

// Hide columns on mobile
<TableCell className="hidden md:table-cell">

// Full width button on mobile
<Button className="w-full sm:w-auto">
```

## Documentation

**CRITICAL: Always update docs with every commit.**

Main documentation is now stored in `.claude/skills/` directories for AI-assisted development.

**Documentation Locations**:
- `.claude/CLAUDE.md` - This file, main project guidance
- `.claude/skills/review-styling/` - Style rules and extracted components
- `.claude/skills/project-manager/` - Project status and roadmap
- `.claude/skills/audit-api-coverage/` - API coverage tracking
- `.claude/skills/documentarian/` - Documentation maintenance workflow
- `README.md` - Public-facing project overview
- `CHANGELOG.md` - Version history

**After making changes**, run the `documentarian` skill to update related documentation.

## Claude Skills

This project uses Claude Skills for AI-assisted development workflows:

| Skill | Purpose |
|-------|---------|
| `review-styling` | Validate routes against style guidelines |
| `theme-expert` | Comprehensive design system knowledge (layouts, colors, spacing, rules) |
| `documentarian` | Review changes and update documentation |
| `audit-api-coverage` | Track API endpoint coverage |
| `project-manager` | Track project status and roadmap |

Skills are defined in `.claude/skills/*/SKILL.md` with supporting documentation in the same directory.

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
