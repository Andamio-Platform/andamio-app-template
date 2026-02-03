# Navigation Selectors Registry

Component selectors for navigation and layout UI elements.

## Source Files

| Component | File Path |
|-----------|-----------|
| App Layout | `src/components/layout/app-layout.tsx` |
| App Sidebar | `src/components/layout/app-sidebar.tsx` |
| Sidebar Nav | `src/components/layout/sidebar-nav.tsx` |
| Header | `src/components/layout/header.tsx` |

## Sidebar

### Container

| Element | Selector |
|---------|----------|
| Sidebar | `[data-sidebar]` |
| Toggle | `button[aria-label="Toggle sidebar"]` |
| Collapsed | `[data-sidebar][data-collapsed="true"]` |

### Menu Items

| Item | Selector |
|------|----------|
| Dashboard | `[data-sidebar] a:has-text("Dashboard")` |
| Courses | `[data-sidebar] a:has-text("Courses")` |
| Projects | `[data-sidebar] a:has-text("Projects")` |
| Settings | `[data-sidebar] a:has-text("Settings")` |
| Generic | `[data-sidebar] a:has-text("{label}")` |

### Active State

| State | Selector |
|-------|----------|
| Active link | `[data-sidebar] a[data-active="true"]` |
| Current page | `[data-sidebar] a[aria-current="page"]` |

### Selectors

```typescript
export const navigation = {
  sidebar: {
    container: '[data-sidebar]',
    toggle: 'button[aria-label="Toggle sidebar"]',
    menuItem: (label: string) => `[data-sidebar] a:has-text("${label}")`,
    dashboard: '[data-sidebar] a:has-text("Dashboard")',
    courses: '[data-sidebar] a:has-text("Courses")',
    projects: '[data-sidebar] a:has-text("Projects")',
    settings: '[data-sidebar] a:has-text("Settings")',
  },
};
```

## Breadcrumbs

### Structure

```tsx
<nav aria-label="breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li><a href="/courses">Courses</a></li>
    <li aria-current="page">Course Name</li>
  </ol>
</nav>
```

### Selectors

| Element | Selector |
|---------|----------|
| Container | `[aria-label="breadcrumb"]` |
| Item | `[aria-label="breadcrumb"] a:has-text("{label}")` |
| Current | `[aria-label="breadcrumb"] [aria-current="page"]` |

```typescript
export const navigation = {
  breadcrumbs: {
    container: '[aria-label="breadcrumb"]',
    item: (label: string) => `[aria-label="breadcrumb"] a:has-text("${label}")`,
    current: '[aria-label="breadcrumb"] [aria-current="page"]',
  },
};
```

## Tabs

### Structure

```tsx
<div role="tablist">
  <button role="tab" aria-selected="true">Tab 1</button>
  <button role="tab" aria-selected="false">Tab 2</button>
</div>
<div role="tabpanel">Content</div>
```

### Selectors

| Element | Selector |
|---------|----------|
| Tab list | `[role="tablist"]` |
| Tab | `[role="tab"]:has-text("{label}")` |
| Active tab | `[role="tab"][aria-selected="true"]` |
| Panel | `[role="tabpanel"]` |

```typescript
export const navigation = {
  tabs: {
    list: '[role="tablist"]',
    tab: (label: string) => `[role="tab"]:has-text("${label}")`,
    activeTab: '[role="tab"][aria-selected="true"]',
    panel: '[role="tabpanel"]',
  },
};
```

## Main Content Areas

### Layout Structure

```tsx
<div className="app-layout">
  <aside data-sidebar>...</aside>
  <main id="main-content">
    <header className="auth-status-bar">...</header>
    <div className="page-content">...</div>
  </main>
</div>
```

### Selectors

| Element | Selector |
|---------|----------|
| Main | `main, [role="main"]` |
| Main content | `#main-content` |
| Page header | `main header` |
| Page content | `main > div` |

## Skip Links

### For Accessibility

```tsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### Selectors

| Element | Selector |
|---------|----------|
| Skip link | `a[href="#main-content"]` |
| Target | `#main-content` |

## Dialog/Modal

### Structure

```tsx
<div role="dialog" aria-modal="true">
  <h2>Dialog Title</h2>
  <button aria-label="Close">×</button>
  <div>Content</div>
</div>
```

### Selectors

| Element | Selector |
|---------|----------|
| Dialog | `[role="dialog"]` |
| Title | `[role="dialog"] h2` |
| Close button | `[role="dialog"] button[aria-label="Close"]` |
| Confirm | `[role="dialog"] button:has-text("Confirm")` |
| Cancel | `[role="dialog"] button:has-text("Cancel")` |

```typescript
export const dialog = {
  container: '[role="dialog"]',
  title: '[role="dialog"] h2',
  description: '[role="dialog"] p',
  closeButton: '[role="dialog"] button[aria-label="Close"]',
  confirmButton: '[role="dialog"] button:has-text("Confirm")',
  cancelButton: '[role="dialog"] button:has-text("Cancel")',
};
```

## Toast/Alert

### Sonner Toast Structure

```tsx
<div data-sonner-toast data-type="success">
  <div>Toast message</div>
  <button>Dismiss</button>
</div>
```

### Selectors

| Element | Selector |
|---------|----------|
| Toast | `[data-sonner-toast]` |
| Success | `[data-type="success"]` |
| Error | `[data-type="error"]` |
| Warning | `[data-type="warning"]` |
| Close | `[data-sonner-toast] button` |

```typescript
export const alert = {
  container: '[role="alert"]',
  toast: '[data-sonner-toast]',
  success: '[data-type="success"]',
  error: '[data-type="error"]',
  warning: '[data-type="warning"]',
  closeButton: '[data-sonner-toast] button',
};
```

## Loading States

### Selectors

| State | Selector |
|-------|----------|
| Spinner | `[class*="animate-spin"]` |
| Skeleton | `[class*="animate-pulse"]` |
| Overlay | `[class*="loading-overlay"]` |

```typescript
export const loading = {
  spinner: '[class*="animate-spin"]',
  skeleton: '[class*="animate-pulse"]',
  overlay: '[class*="loading-overlay"]',
};
```

## Accessibility Landmarks

### ARIA Landmarks

| Landmark | Selector |
|----------|----------|
| Header | `header, [role="banner"]` |
| Main | `main, [role="main"]` |
| Navigation | `nav, [role="navigation"]` |
| Footer | `footer, [role="contentinfo"]` |
| Search | `[role="search"]` |

### Heading Hierarchy

| Level | Selector |
|-------|----------|
| h1 | `h1` |
| h2 | `h2` |
| h3 | `h3` |
| Any heading | `h1, h2, h3, h4, h5, h6` |

```typescript
export const a11y = {
  skipLink: 'a[href="#main-content"]',
  mainContent: '#main-content',
  landmarks: {
    header: 'header, [role="banner"]',
    main: 'main, [role="main"]',
    nav: 'nav, [role="navigation"]',
    footer: 'footer, [role="contentinfo"]',
  },
  headings: {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    any: 'h1, h2, h3, h4, h5, h6',
  },
  focus: {
    visible: ':focus-visible',
    within: ':focus-within',
  },
};
```

## Recommended data-testid Additions

```tsx
// app-sidebar.tsx
<aside data-sidebar data-testid="app-sidebar">
  <nav data-testid="sidebar-nav">
    <a data-testid="nav-dashboard">Dashboard</a>
    <a data-testid="nav-courses">Courses</a>
  </nav>
</aside>

// breadcrumbs
<nav aria-label="breadcrumb" data-testid="breadcrumbs">
  <ol data-testid="breadcrumb-list">
    <li data-testid="breadcrumb-item">...</li>
  </ol>
</nav>

// dialog
<div role="dialog" data-testid="dialog">
  <button data-testid="dialog-close">...</button>
  <button data-testid="dialog-confirm">...</button>
</div>
```

## Responsive Breakpoints

| Breakpoint | Width | Sidebar State |
|------------|-------|---------------|
| Mobile | < 768px | Hidden |
| Tablet | 768px - 1024px | Collapsed |
| Desktop | > 1024px | Expanded |

### Mobile Menu

| Element | Selector |
|---------|----------|
| Hamburger | `button[aria-label="Toggle menu"]` |
| Mobile nav | `[data-mobile-nav]` |
