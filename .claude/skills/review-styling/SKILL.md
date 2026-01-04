---
name: review-styling
description: Review a route and its components to confirm that styling rules are correctly applied.
---

# Review Styling

## Instructions

### 0. Choose review mode

Ask the user which mode they prefer:

**Quick Scan** (recommended for new routes):
- Only checks the page file itself
- Looks at imports and catches ~80% of common issues
- Fast, minimal context usage

**Full Review** (recommended for thorough audits):
- Recursively checks all imported components
- More comprehensive but takes longer
- Best for final review before release

### 1. Prompt the user to specify a route to review

Expect the route to be in its url form: so if the user says /studio/course/aabbaabb, it's `/src/app/(studio)/course/[coursenft]/page.tsx`

If a route to review is not provided, then ask the user to provide one.

The available routes are in `/src/app`. If the user specifies a route that does not exist, tell them it does not exist.

### 2. Collect all Components

**Quick Scan**: Skip this step. Only review the page file.

**Full Review**: Create a checklist of all Component import paths. Review each component file, and recursively repeat for any child components, until we have a complete list of components used in the specified route.

### 3. Apply rules to each Component and Subcomponent

Work through the list we created in Step 2. Apply the rules from:
- [style-rules.md](./style-rules.md) - Core styling rules (no custom styling, no raw shadcn, Andamio prefix, etc.)
- [semantic-colors.md](./semantic-colors.md) - No hardcoded colors, use semantic variables
- [responsive-design.md](./responsive-design.md) - Use Andamio layout components
- [icon-system.md](./icon-system.md) - Centralized icon imports with semantic names

**Quick checks for each file:**
- ❌ Custom className on Andamio components? → Extract to new component
- ❌ Importing from `~/components/ui/`? → Change to `~/components/andamio/`
- ❌ Using non-prefixed names (e.g., `Sheet` vs `AndamioSheet`)? → Use Andamio prefix
- ❌ Hardcoded colors (`text-green-600`)? → Use semantic (`text-success`)
- ❌ Inline loading skeletons? → Use `AndamioPageLoading`
- ❌ Inline empty states? → Use `AndamioEmptyState`
- ❌ Importing from `lucide-react`? → Change to `~/components/icons` with semantic names

Make sure that every component and sub-component follows these guidelines perfectly.

### 4. Look for any new reusable Components that might be created

If you see some reusable code in a Component, keep a list of suggestions to the user for Components to be extracted.

Before adding an item to the list, check [extracted-components](./extracted-components.md) for similar components that have already been extracted. If you see one that matches, use it. Replace existing redundant code with the right component.

### 5. Run typecheck

After making changes, run `npm run typecheck` to verify no type errors were introduced.

Common issues to watch for:
- Missing imports after changing component names
- Wrong prop names (check component definitions)
- Backwards compatibility - some wrappers export both prefixed and non-prefixed names

### 6. Show completion summary

When complete, show the user a summary of changes, and a list of recommendations for extracted components.

**Reference**: The `/components` page (`src/app/(app)/components/page.tsx`) showcases all Andamio components with working examples. Use it as a reference for correct usage patterns.

## Examples

### 1. Review Specified Route

Take `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx` as an example. It has these imports:

```tsx
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioPageHeader, AndamioSectionHeader } from "~/components/andamio";
import { AlertIcon, CourseIcon } from "~/components/icons";
import { type LessonWithSLTOutput, type CourseOutput, type CourseModuleOutput } from "@andamio/db-api";
import { ContentViewer } from "~/components/editor";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import type { JSONContent } from "@tiptap/core";
```

We will need to review all UX components imported from `~/components`

```tsx
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioPageHeader, AndamioSectionHeader } from "~/components/andamio";
import { ContentViewer } from "~/components/editor";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
```

### 2. Collect all Components

The checklist will include the following files

- `~/components/andamio/andamio-alert`;
- `~/components/andamio/andamio-badge`;
- `~/components/andamio/andamio-skeleton`;
- `~/components/andamio/andamio-card`;
- `~/components/andamio`;
- `~/components/editor`;
- `~/components/courses/course-breadcrumb`;

Some of these files import child components. Add each one to the checklist following the same recursive pattern.

### 3. In each file, make sure that rules are applied

We want to make sure that all style rules are followed and that the code is as modular, reusable, and customizable as possible.

### 4. Look for new Components

For example, maybe we could suggest a common "Not Found" component from `src/app/(app)/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`

```tsx
<AndamioPageHeader title="Lesson Not Found" />

<AndamioAlert variant="destructive">
    <AlertIcon className="h-4 w-4" />
    <AndamioAlertTitle>Error</AndamioAlertTitle>
    <AndamioAlertDescription>
    {error ?? "Lesson not found"}
    </AndamioAlertDescription>
</AndamioAlert>
```

### 5. Report back to user on changes

## Output Format

Brief report listing changes and suggestions. 