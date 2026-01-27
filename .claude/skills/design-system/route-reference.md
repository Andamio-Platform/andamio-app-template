# Route & Layout Reference

Bi-directional reference mapping all routes to their layouts and vice versa.

---

## Layout Summary

| Layout | Route Group | Routes | Description |
|--------|-------------|--------|-------------|
| Landing | `/` (root) | 1 | Marketing page, no sidebar |
| App Shell | `(app)/*` | 17 | Sidebar + content area |
| Studio Shell | `(studio)/*` | 3 | Sidebar + StudioHeader + workspace |

**Total Routes**: 21

---

## Layouts → Routes

### 1. Landing Layout (1 route)

No sidebar, marketing-style full-page layout.

| Route | Purpose |
|-------|---------|
| `/` | Landing/marketing page |

**Characteristics**:
- Full viewport sections
- Centered content (max-w-3xl)
- Marketing copy and CTAs
- No sidebar navigation

---

### 2. App Shell Layout (17 routes)

Sidebar navigation with scrollable content area.

**Components**: `AppLayout`, `AppSidebar`

```
┌─────────┬────────────────────────┐
│ Sidebar │  Content (scrollable)  │
│  256px  │  AndamioPageHeader     │
│         │  Page content...       │
└─────────┴────────────────────────┘
```

#### Dashboard & Core
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/dashboard` | User overview | Standard |
| `/sitemap` | Route documentation | Standard |
| `/components` | Component showcase | Standard |
| `/editor` | Editor demo | Standard |

#### Course Browsing
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/course` | Course list | Standard with cards |
| `/course/[coursenft]` | Course detail | Detail page |
| `/course/[coursenft]/[modulecode]` | Module detail | Detail page |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | Lesson view | Detail page |
| `/course/[coursenft]/[modulecode]/assignment` | Assignment view | Detail page |

#### Project Browsing
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/project` | Project list | Standard with cards |
| `/project/[projectid]` | Project detail | Detail page |
| `/project/[projectid]/[taskhash]` | Task detail | Detail page |

#### Studio Hub (App Layout)
| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/studio` | Studio hub | Card grid |
| `/studio/course/[coursenft]/teacher` | Instructor management | Standard |
| `/studio/project` | Project studio list | Standard |
| `/studio/project/[projectid]` | Project studio detail | Standard |
| `/studio/project/[projectid]/draft-tasks` | Draft tasks list | Standard |
| `/studio/project/[projectid]/draft-tasks/new` | New draft task | Form |
| `/studio/project/[projectid]/draft-tasks/[taskindex]` | Edit draft task | Form |

---

### 3. Studio Shell Layout (3 routes)

Sidebar + StudioHeader with dense workspace for content creation.

**Components**: `StudioLayout`, `StudioHeader`

```
┌─────────┬────────────────────────┐
│ Sidebar │ StudioHeader           │
│         ├────────────────────────┤
│         │  Workspace             │
│         │  (full height)         │
└─────────┴────────────────────────┘
```

| Route | Purpose | Page Pattern |
|-------|---------|--------------|
| `/studio/course` | Course Studio | **Master-Detail** |
| `/studio/course/[coursenft]` | Course Editor | Editor |
| `/studio/course/[coursenft]/[modulecode]` | Module Editor | **Wizard** |

---

## Routes → Layouts

### By URL Path (alphabetical)

| Route | Layout | Page Pattern |
|-------|--------|--------------|
| `/` | Landing | Marketing |
| `/components` | App Shell | Standard |
| `/course` | App Shell | Standard |
| `/course/[coursenft]` | App Shell | Detail |
| `/course/[coursenft]/[modulecode]` | App Shell | Detail |
| `/course/[coursenft]/[modulecode]/[moduleindex]` | App Shell | Detail |
| `/course/[coursenft]/[modulecode]/assignment` | App Shell | Detail |
| `/dashboard` | App Shell | Standard |
| `/editor` | App Shell | Standard |
| `/project` | App Shell | Standard |
| `/project/[projectid]` | App Shell | Detail |
| `/project/[projectid]/[taskhash]` | App Shell | Detail |
| `/sitemap` | App Shell | Standard |
| `/studio` | App Shell | Card Grid |
| `/studio/course` | **Studio Shell** | Master-Detail |
| `/studio/course/[coursenft]` | **Studio Shell** | Editor |
| `/studio/course/[coursenft]/[modulecode]` | **Studio Shell** | Wizard |
| `/studio/course/[coursenft]/teacher` | App Shell | Standard |
| `/studio/project` | App Shell | Standard |
| `/studio/project/[projectid]` | App Shell | Standard |
| `/studio/project/[projectid]/draft-tasks` | App Shell | Standard |
| `/studio/project/[projectid]/draft-tasks/[taskindex]` | App Shell | Form |
| `/studio/project/[projectid]/draft-tasks/new` | App Shell | Form |

---

## Page Patterns Within Layouts

Some pages use additional patterns within their layout:

### Master-Detail Pattern
- **Route**: `/studio/course`
- **Left Panel**: Course list (selectable items)
- **Right Panel**: Course preview OR welcome state
- **Components**: `ResizablePanelGroup`, `CourseListItem`, `CoursePreviewPanel`

### Wizard Pattern
- **Route**: `/studio/course/[coursenft]/[modulecode]`
- **Left Panel**: Step outline with progress
- **Right Panel**: Current step content
- **Components**: `StudioOutlinePanel`, step components, `WizardContext`

### Card Grid Pattern
- **Routes**: `/studio`, `/course`, `/project`
- **Layout**: Responsive grid of cards
- **Components**: `StudioHubCard`, course/project cards

### Detail Page Pattern
- **Routes**: `/course/[id]`, `/project/[id]`, etc.
- **Layout**: Breadcrumb + content sections
- **Components**: `CourseBreadcrumb`, section headers

### Form Pattern
- **Routes**: `/studio/project/[id]/draft-tasks/*`
- **Layout**: Form fields with actions
- **Components**: Form inputs, submit buttons

---

## File Locations

### Layouts
```
src/app/layout.tsx              # Root (providers only)
src/app/(app)/layout.tsx        # App Shell
src/app/(studio)/layout.tsx     # Studio Shell
```

### Layout Components
```
src/components/layout/app-layout.tsx      # App Shell wrapper
src/components/layout/app-sidebar.tsx     # Sidebar navigation
src/components/layout/studio-layout.tsx   # Studio Shell wrapper
src/components/layout/studio-header.tsx   # Studio header with breadcrumbs
```

---

## Migration Notes

**Legacy Routes**: Some `/studio/*` routes are still under the `(app)` group:
- `/studio` (hub page)
- `/studio/course/[coursenft]/teacher`
- `/studio/project/*`

These use App Shell layout with `AndamioPageHeader`. Consider migrating to Studio Shell if they need the dense creation-focused layout.

**Route Group Meaning**:
- `(app)` = Standard app pages for browsing/viewing
- `(studio)` = Dense creation/editing workspace

---

## Adding New Routes

1. **Determine the layout**: Is it viewing/browsing (App Shell) or creating/editing (Studio Shell)?

2. **Choose page pattern**: Standard, Detail, Master-Detail, Wizard, Form, Card Grid?

3. **Add to correct route group**:
   - `src/app/(app)/your-route/page.tsx` for App Shell
   - `src/app/(studio)/your-route/page.tsx` for Studio Shell

4. **Update this document** with the new route

5. **Add to navigation** if applicable:
   - `src/components/layout/app-sidebar.tsx` for sidebar nav
   - Breadcrumb configuration if using StudioHeader
