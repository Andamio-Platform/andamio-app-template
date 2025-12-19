# Extracted Components Log

This document logs reusable components extracted during style reviews. These components follow the Andamio styling guidelines and provide consistent, reusable patterns across the application.

---

## Quick Reference: Common Prop Mistakes

These are the most frequently misused props. Check these first when fixing type errors:

| Component | ❌ Wrong Prop | ✅ Correct Prop |
|-----------|---------------|-----------------|
| `AndamioStatCard` | `title` | `label` |
| `AndamioStatCard` | `description`, `trend` | Not supported - use `iconColor` |
| `AndamioNotFoundCard` | `description` | `message` |
| `AndamioNotFoundCard` | `backHref`, `backLabel` | `action={<Button>...</Button>}` |
| `AndamioConfirmDialog` | `confirmLabel` | `confirmText` |
| `AndamioConfirmDialog` | `cancelLabel` | `cancelText` |
| `AndamioEmptyState` | `size` | `iconSize` (`"sm"`, `"md"`, `"lg"`) |

**Tip**: When in doubt, check the component file in `src/components/andamio/` for the interface definition.

---

## Components

### AndamioNotFoundCard

**File**: `src/components/andamio/andamio-not-found-card.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Purpose**: Provides consistent error/not-found states across the application.

**Pattern Replaced**:
```tsx
<AndamioPageHeader title="X Not Found" />
<AndamioAlert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AndamioAlertTitle>Error</AndamioAlertTitle>
  <AndamioAlertDescription>{message}</AndamioAlertDescription>
</AndamioAlert>
```

**Usage**:
```tsx
import { AndamioNotFoundCard } from "~/components/andamio";

// Basic
<AndamioNotFoundCard title="Course Not Found" />

// With custom message
<AndamioNotFoundCard
  title="Module Not Found"
  message="The requested module could not be loaded"
/>

// With action
<AndamioNotFoundCard
  title="Assignment Not Found"
  action={<AndamioButton onClick={() => router.back()}>Go Back</AndamioButton>}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Title in page header |
| `message` | `string` | "The requested resource could not be found" | Error message in alert |
| `action` | `ReactNode` | - | Optional action button |
| `className` | `string` | - | Additional CSS classes |

---

### AndamioEmptyState

**File**: `src/components/andamio/andamio-empty-state.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Purpose**: Provides consistent empty state UI when there's no data to display.

**Pattern Replaced**:
```tsx
<div className="flex flex-col items-center justify-center py-8 text-center">
  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
  <p className="text-sm text-muted-foreground mb-2">Title</p>
  <p className="text-xs text-muted-foreground mb-4">Description</p>
  <AndamioButton>Action</AndamioButton>
</div>
```

**Usage**:
```tsx
import { AndamioEmptyState } from "~/components/andamio";
import { BookOpen } from "lucide-react";

// Basic
<AndamioEmptyState
  icon={BookOpen}
  title="No courses found"
/>

// With description and action
<AndamioEmptyState
  icon={BookOpen}
  title="No courses yet"
  description="Browse courses and commit to assignments to see them here."
  action={<AndamioButton>Browse Courses</AndamioButton>}
/>

// Custom icon size
<AndamioEmptyState
  icon={FileText}
  iconSize="sm"
  title="No documents"
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `IconComponent` | required | Lucide icon component |
| `title` | `string` | required | Main title text |
| `description` | `string` | - | Optional description |
| `action` | `ReactNode` | - | Optional action button |
| `iconSize` | `"sm" \| "md" \| "lg"` | `"lg"` | Icon size variant |
| `className` | `string` | - | Additional CSS classes |

---

### AndamioStatCard

**File**: `src/components/andamio/andamio-stat-card.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Purpose**: Provides consistent stat/metric display for counts and totals.

**Pattern Replaced**:
```tsx
<div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
  <BookOpen className="h-4 w-4 text-info" />
  <div>
    <p className="text-lg font-semibold">{count}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
</div>
```

**Usage**:
```tsx
import { AndamioStatCard } from "~/components/andamio";
import { BookOpen, Award } from "lucide-react";

// Basic stat
<AndamioStatCard
  icon={BookOpen}
  value={12}
  label="Courses"
/>

// With semantic color
<AndamioStatCard
  icon={Award}
  value={5}
  label="Credentials"
  iconColor="warning"
/>

// Grid of stats
<div className="grid grid-cols-2 gap-3">
  <AndamioStatCard icon={BookOpen} value={12} label="Courses" iconColor="info" />
  <AndamioStatCard icon={Award} value={5} label="Credentials" iconColor="warning" />
</div>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `IconComponent` | required | Lucide icon component |
| `value` | `number \| string` | required | The statistic value |
| `label` | `string` | required | Label describing the stat |
| `iconColor` | `"muted" \| "primary" \| "success" \| "warning" \| "info" \| "destructive"` | `"muted"` | Semantic icon color |
| `className` | `string` | - | Additional CSS classes |

---

### AndamioPageLoading

**File**: `src/components/andamio/andamio-page-loading.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Purpose**: Provides consistent loading skeleton patterns for pages.

**Pattern Replaced**:
```tsx
<div className="space-y-6">
  <div>
    <AndamioSkeleton className="h-9 w-64 mb-2" />
    <AndamioSkeleton className="h-5 w-96" />
  </div>
  <div className="space-y-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <AndamioSkeleton key={i} className="h-12 w-full" />
    ))}
  </div>
</div>
```

**Usage**:
```tsx
import { AndamioPageLoading } from "~/components/andamio";

// List page loading (default)
<AndamioPageLoading />

// Detail page with header
<AndamioPageLoading variant="detail" />

// Content page
<AndamioPageLoading variant="content" />

// Custom item count
<AndamioPageLoading variant="list" itemCount={3} />
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"list" \| "detail" \| "content"` | `"list"` | Layout variant |
| `itemCount` | `number` | `5` | Number of skeleton items |
| `className` | `string` | - | Additional CSS classes |

---

## Wrapper Components Updated

All Andamio wrapper components now consistently export with the `Andamio` prefix for clarity. This follows **Rule 3** from style-rules.md.

### Bulk Update (2024-12)

The following wrappers were updated to export with `Andamio` prefix instead of re-exporting raw shadcn names:

| Wrapper File | Exports |
|--------------|---------|
| `andamio-slider.tsx` | `AndamioSlider` |
| `andamio-sheet.tsx` | `AndamioSheet`, `AndamioSheetContent`, `AndamioSheetHeader`, etc. |
| `andamio-popover.tsx` | `AndamioPopover`, `AndamioPopoverContent`, `AndamioPopoverTrigger` |
| `andamio-hover-card.tsx` | `AndamioHoverCard`, `AndamioHoverCardContent`, `AndamioHoverCardTrigger` |
| `andamio-dropdown-menu.tsx` | `AndamioDropdownMenu`, `AndamioDropdownMenuContent`, `AndamioDropdownMenuItem`, etc. |
| `andamio-context-menu.tsx` | `AndamioContextMenu`, `AndamioContextMenuContent`, `AndamioContextMenuItem`, etc. |
| `andamio-avatar.tsx` | `AndamioAvatar`, `AndamioAvatarFallback`, `AndamioAvatarImage` |
| `andamio-collapsible.tsx` | `AndamioCollapsible`, `AndamioCollapsibleContent`, `AndamioCollapsibleTrigger` |
| `andamio-alert-dialog.tsx` | `AndamioAlertDialog`, `AndamioAlertDialogContent`, `AndamioAlertDialogAction`, etc. |
| `andamio-pagination.tsx` | `AndamioPagination`, `AndamioPaginationContent`, `AndamioPaginationItem`, etc. |
| `andamio-resizable.tsx` | `AndamioResizablePanelGroup`, `AndamioResizablePanel`, `AndamioResizableHandle` |
| `andamio-toggle-group.tsx` | `AndamioToggleGroup`, `AndamioToggleGroupItem` |

**Backwards Compatibility**: Some wrappers (e.g., `andamio-popover.tsx`, `andamio-resizable.tsx`) also export base names via `export * from` for existing code that uses non-prefixed names.

---

### AndamioBreadcrumb

**File**: `src/components/andamio/andamio-breadcrumb.tsx`

**Updated From**: Style review of `/course` route (2024-12)

**Reason**: The `course-breadcrumb.tsx` was importing raw shadcn/ui `Breadcrumb*` components, violating Rule 2: "ShadCN primitives should never be used outside of Andamio Components."

**Change**: Updated wrapper to export named Andamio-prefixed components instead of `export *`.

**Usage**:
```tsx
import {
  AndamioBreadcrumb,
  AndamioBreadcrumbList,
  AndamioBreadcrumbItem,
  AndamioBreadcrumbLink,
  AndamioBreadcrumbPage,
  AndamioBreadcrumbSeparator,
} from "~/components/andamio";
```

---

## Other Components Extracted

### AccountDetailsCard

**File**: `src/components/dashboard/account-details.tsx`

**Extracted From**: Style review of `/dashboard` route (2024-12)

**Reason**: The dashboard page.tsx was applying custom tailwind classes to `AndamioCard*` components, violating Rule 1: "Top level page components should never apply custom tailwind properties to Andamio Components."

**Purpose**: Displays wallet address, access token status, and session information.

---

### SLTLessonTable

**File**: `src/components/courses/slt-lesson-table.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Reason**: The module page (`/course/[coursenft]/[modulecode]/page.tsx`) had a complex inline table component with custom styling on Andamio components, violating Rule 1.

**Purpose**: Displays a combined table of Student Learning Targets (SLTs) and their associated lessons, with on-chain verification status badges.

**Usage**:
```tsx
import { SLTLessonTable, type CombinedSLTLesson } from "~/components/courses/slt-lesson-table";

const combinedData: CombinedSLTLesson[] = [
  {
    module_index: 1,
    slt_text: "Understand blockchain basics",
    slt_id: "slt-123",
    lesson: {
      title: "Introduction to Blockchain",
      description: "Learn the fundamentals",
      live: true,
    },
  },
];

<SLTLessonTable
  data={combinedData}
  courseNftPolicyId={courseNftPolicyId}
  moduleCode={moduleCode}
  onChainModule={onChainModule}  // Optional - for on-chain status badges
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `CombinedSLTLesson[]` | required | Array of SLT and lesson data |
| `courseNftPolicyId` | `string` | required | Course NFT policy ID for links |
| `moduleCode` | `string` | required | Module code for links |
| `onChainModule` | `OnChainModule \| null` | - | On-chain module data for verification badges |

---

### CourseModuleCard

**File**: `src/components/courses/course-module-card.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Reason**: The course detail page (`/course/[coursenft]/page.tsx`) had inline module card rendering with custom styling, violating Rule 1.

**Purpose**: Displays a course module card with SLT list, on-chain verification status, and links to module details.

**Usage**:
```tsx
import { CourseModuleCard } from "~/components/courses/course-module-card";

<CourseModuleCard
  moduleCode="MOD001"
  title="Introduction to Smart Contracts"
  index={1}
  slts={[
    { slt_text: "Understand blockchain basics" },
    { slt_text: "Write your first contract" },
  ]}
  onChainSlts={new Set(["Understand blockchain basics"])}
  isOnChain={true}
  courseNftPolicyId={courseNftPolicyId}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `moduleCode` | `string` | required | Module identifier code |
| `title` | `string` | required | Module title |
| `index` | `number` | required | Module position (1-based) |
| `slts` | `Array<{ slt_text: string }>` | required | Student Learning Targets |
| `onChainSlts` | `Set<string>` | required | Set of SLT texts verified on-chain |
| `isOnChain` | `boolean` | required | Whether module has on-chain verification |
| `courseNftPolicyId` | `string` | required | Course NFT policy ID for links |

---

### LessonMediaSection

**File**: `src/components/courses/lesson-media-section.tsx`

**Extracted From**: Style review of `/course` route (2024-12)

**Reason**: The lesson page (`/course/[coursenft]/[modulecode]/[moduleindex]/page.tsx`) had inline media display code with custom styling patterns.

**Purpose**: Displays lesson video and/or image media in a consistent, responsive layout with video taking priority over images when both are present.

**Usage**:
```tsx
import { LessonMediaSection } from "~/components/courses/lesson-media-section";

// Video only
<LessonMediaSection
  videoUrl="https://youtube.com/watch?v=..."
/>

// Image only
<LessonMediaSection
  imageUrl="https://example.com/image.jpg"
  imageAlt="Lesson illustration"
/>

// Both (video shown, image hidden)
<LessonMediaSection
  videoUrl="https://youtube.com/watch?v=..."
  imageUrl="https://example.com/image.jpg"
  imageAlt="Lesson illustration"
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `videoUrl` | `string \| null` | - | Video URL (YouTube, Vimeo, etc.) |
| `imageUrl` | `string \| null` | - | Image URL |
| `imageAlt` | `string` | "Lesson image" | Alt text for image |

**Notes**:
- When both video and image are provided, only video is displayed
- Component returns `null` if neither video nor image is provided
- Video uses `ReactPlayer` with responsive aspect ratio container
- Image uses Next.js `Image` component with proper optimization

---

### StudioHubCard

**File**: `src/components/studio/studio-hub-card.tsx`

**Extracted From**: Style review of `/studio` route (2024-12)

**Reason**: The studio hub page had inline card components with custom hover styling and transitions on Andamio components, violating Rule 1.

**Purpose**: Navigation card for the Studio hub page with hover effects and icon.

**Usage**:
```tsx
import { StudioHubCard } from "~/components/studio/studio-hub-card";
import { BookOpen, FolderKanban } from "lucide-react";

<StudioHubCard
  title="Course Studio"
  description="Create and manage your Andamio courses"
  href="/studio/course"
  icon={BookOpen}
  buttonLabel="Manage Courses"
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | required | Card title |
| `description` | `string` | required | Card description |
| `href` | `string` | required | Navigation URL |
| `icon` | `IconComponent` | required | Lucide icon component |
| `buttonLabel` | `string` | required | Button text |

---

### StudioCourseCard

**File**: `src/components/studio/studio-course-card.tsx`

**Extracted From**: Style review of `/studio/course` route (2024-12)

**Reason**: The course studio page had a raw `<button>` element with custom styling, violating Rule 2. The component also had custom tailwind on card elements.

**Purpose**: Compact course card for the Course Studio grid with on-chain verification status indicators.

**Usage**:
```tsx
import { StudioCourseCard, type HybridCourseStatus } from "~/components/studio/studio-course-card";

const course: HybridCourseStatus = {
  courseId: "abc123...",
  title: "My Course",
  inDb: true,
  onChain: true,
  onChainModuleCount: 3,
};

<StudioCourseCard
  course={course}
  onClick={() => router.push(`/studio/course/${course.courseId}`)}
/>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `course` | `HybridCourseStatus` | required | Course data with DB and on-chain status |
| `onClick` | `() => void` | required | Click handler |

---

## Hooks Extracted

### useModuleWizardData

**File**: `src/hooks/use-module-wizard-data.ts`

**Extracted From**: Refactoring of `/studio/course/[coursenft]/[modulecode]/page.tsx` (2024-12)

**Purpose**: Encapsulates all data fetching logic for the module wizard, including course, module, SLTs, assignment, introduction, and lessons.

**Usage**:
```tsx
import { useModuleWizardData } from "~/hooks/use-module-wizard-data";

const { data, completion, refetchData } = useModuleWizardData({
  courseNftPolicyId,
  moduleCode,
  isNewModule,
  onDataLoaded: (course, courseModule) => {
    // Update header, breadcrumbs, etc.
  },
});
```

**Returns**:
| Property | Type | Description |
|----------|------|-------------|
| `data` | `WizardData` | Course, module, SLTs, assignment, introduction, lessons, loading state |
| `completion` | `StepCompletion` | Boolean flags for each wizard step completion |
| `refetchData` | `() => Promise<void>` | Function to refetch all data |

---

### useWizardNavigation

**File**: `src/hooks/use-wizard-navigation.ts`

**Extracted From**: Refactoring of `/studio/course/[coursenft]/[modulecode]/page.tsx` (2024-12)

**Purpose**: Manages wizard step navigation with URL synchronization and step unlock logic.

**Usage**:
```tsx
import { useWizardNavigation, STEP_ORDER } from "~/hooks/use-wizard-navigation";

const {
  currentStep,
  direction,
  currentIndex,
  canGoNext,
  canGoPrevious,
  goToStep,
  goNext,
  goPrevious,
  getStepStatus,
  isStepUnlocked,
} = useWizardNavigation({ completion });
```

**Features**:
- URL-based step persistence (`?step=blueprint`)
- Step unlock logic based on completion state
- Direction tracking for animations
- Navigation guards

---

## Authorization Components

### RequireCourseAccess

**File**: `src/components/auth/require-course-access.tsx`

**Extracted From**: Authorization requirements for `/studio/course/[coursenft]/*` routes (2024-12)

**Purpose**: Verifies the user has Owner or Teacher access to a course before rendering children.

**Authorization Logic**:
- Checks if user is authenticated
- Calls `/course/list` endpoint to verify user owns or contributes to the course
- Course ownership = created the course
- Teacher access = listed as contributor

**Usage**:
```tsx
import { RequireCourseAccess } from "~/components/auth/require-course-access";

<RequireCourseAccess
  courseNftPolicyId={courseId}
  title="Edit Module"
  description="You need access to this course to edit modules"
>
  <ModuleWizard />
</RequireCourseAccess>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `courseNftPolicyId` | `string` | required | Course NFT Policy ID to check access for |
| `title` | `string` | "Course Access Required" | Title shown when not authenticated |
| `description` | `string` | "Connect your wallet..." | Description shown when not authenticated |
| `children` | `ReactNode` | required | Content to render when user has access |

**States Rendered**:
- Not authenticated → Login prompt with `AndamioAuthButton`
- Loading → `AndamioPageLoading` skeleton
- Error → Error alert with back button
- Access denied → Access denied message with navigation options
- Has access → Renders children

---

## Review History

| Date | Route | Components Extracted |
|------|-------|---------------------|
| 2024-12 | `/dashboard` | `AndamioNotFoundCard`, `AndamioEmptyState`, `AndamioStatCard`, `AccountDetailsCard` |
| 2024-12 | `/course` | `AndamioPageLoading`, `SLTLessonTable`, `CourseModuleCard`, `LessonMediaSection`, Updated `AndamioBreadcrumb` wrapper |
| 2024-12 | `/studio` | `StudioHubCard`, `StudioCourseCard`, Refactored pages to use `AndamioPageLoading`, `AndamioEmptyState` |
| 2024-12 | `/studio/course/[coursenft]/*` | `useModuleWizardData`, `useWizardNavigation`, `RequireCourseAccess` - Refactored for separation of concerns + authorization |
| 2025-12 | `/project/*` | Refactored to use `AndamioPageLoading`, `AndamioEmptyState` |
| 2025-12 | `/components` | Complete component showcase page with all Andamio components |
| 2025-12 | Wrapper Updates | All wrapper components updated to export with `Andamio` prefix (Rule 3) |
| 2025-12 | Codebase-wide | `AndamioText` - Standardized all `<p className=...>` patterns to use semantic text component |

---

### AndamioText

**File**: `src/components/andamio/andamio-text.tsx`

**Extracted From**: Codebase-wide `<p className=...>` standardization (2025-12)

**Purpose**: Provides consistent text styling across the application, replacing loose `<p>` tags with styled className patterns.

**Pattern Replaced**:
```tsx
<p className="text-sm text-muted-foreground">Helper text</p>
<p className="text-muted-foreground">Description</p>
<p className="text-lg text-muted-foreground">Lead text</p>
<p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Label</p>
```

**Usage**:
```tsx
import { AndamioText } from "~/components/andamio";

// Default body text
<AndamioText>Regular paragraph text</AndamioText>

// Muted description
<AndamioText variant="muted">This is muted helper text</AndamioText>

// Small helper text
<AndamioText variant="small">Small muted text</AndamioText>

// Lead/intro text
<AndamioText variant="lead">Large introductory paragraph</AndamioText>

// Overline/label
<AndamioText variant="overline">CATEGORY LABEL</AndamioText>

// Render as different element
<AndamioText as="span" variant="small">Inline text</AndamioText>
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"default" \| "muted" \| "small" \| "lead" \| "overline"` | `"default"` | Text style variant |
| `as` | `"p" \| "span" \| "div"` | `"p"` | HTML element to render |
| `className` | `string` | - | Additional CSS classes |

**Variant Styles**:
| Variant | Classes Applied |
|---------|----------------|
| `default` | `text-base text-foreground` |
| `muted` | `text-base text-muted-foreground` |
| `small` | `text-sm text-muted-foreground` |
| `lead` | `text-lg text-muted-foreground` |
| `overline` | `text-xs font-medium uppercase tracking-wider text-muted-foreground` |

---

## Guidelines for Extraction

When reviewing routes, look for these patterns that should be extracted:

1. **Error/Not Found States** - Any `AndamioAlert variant="destructive"` pattern with title and description
2. **Empty States** - Centered content with icon, title, description, and optional action
3. **Stat Displays** - Icon + value + label patterns in cards or grids
4. **Repeated Card Layouts** - Any card structure used in multiple places
5. **Loading States** - Skeleton patterns that repeat across components

When extracting:
1. Create the component in `src/components/andamio/` with `andamio-` prefix
2. Export from `src/components/andamio/index.ts`
3. Document in this file with props table and usage examples
4. Update the original code to use the new component
