# Semantic Color System

All colors in Andamio use semantic variables. Never use hardcoded Tailwind colors.

## Core Principle

```tsx
// ✅ CORRECT - Semantic
<CheckCircle className="text-success" />
<span className="text-destructive">Error</span>
<a className="text-primary hover:underline">Link</a>

// ❌ WRONG - Hardcoded
<CheckCircle className="text-green-600" />
<span className="text-red-600">Error</span>
<a className="text-blue-600 hover:underline">Link</a>
```

## Available Colors

### Base Colors

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| `background` | White | Dark gray | Page background |
| `foreground` | Dark gray | White | Primary text |
| `card` | White | Darker gray | Card backgrounds |
| `card-foreground` | Dark gray | White | Card text |
| `popover` | White | Dark gray | Popover/dropdown backgrounds |
| `popover-foreground` | Dark gray | White | Popover text |

### Interactive Colors

| Variable | Usage |
|----------|-------|
| `primary` | Links, active states, primary buttons, brand elements |
| `primary-foreground` | Text on primary backgrounds |
| `secondary` | Secondary buttons, less prominent actions |
| `secondary-foreground` | Text on secondary backgrounds |
| `muted` | Subtle backgrounds, disabled states |
| `muted-foreground` | Helper text, placeholders, secondary info |
| `accent` | Highlights, hover states |
| `accent-foreground` | Text on accent backgrounds |

### Status Colors

| Variable | Meaning | Use Cases |
|----------|---------|-----------|
| `success` | Positive, complete | On-chain status, completed tasks, active connections |
| `success-foreground` | Text on success bg | |
| `warning` | Caution, pending | Pending transactions, needs attention |
| `warning-foreground` | Text on warning bg | |
| `info` | Informational | Neutral status, tips, in-progress |
| `info-foreground` | Text on info bg | |
| `destructive` | Negative, error | Errors, delete actions, failures |
| `destructive-foreground` | Text on destructive bg | |

### Utility Colors

| Variable | Usage |
|----------|-------|
| `border` | Borders, dividers |
| `input` | Input field borders |
| `ring` | Focus rings |

### Sidebar Colors

| Variable | Usage |
|----------|-------|
| `sidebar` | Sidebar background |
| `sidebar-foreground` | Sidebar text |
| `sidebar-primary` | Active nav item |
| `sidebar-accent` | Hover states |
| `sidebar-border` | Sidebar dividers |

### Chart Colors

| Variable | Usage |
|----------|-------|
| `chart-1` through `chart-5` | Data visualization |

---

## Status Color Mapping

### Course/Module Status

| Status | Color | Icon |
|--------|-------|------|
| `ON_CHAIN` | `success` | CheckCircle |
| `SYNCED` | `success` | RefreshCw |
| `PENDING_TX` | `warning` | Clock |
| `DRAFT` | `muted` | FileEdit |
| `READY` | `info` | CheckCircle2 |

### Assignment Status

| Status | Color | Icon |
|--------|-------|------|
| `COMMITTED` | `info` | Clock |
| `APPROVED` | `success` | CheckCircle |
| `DENIED` | `destructive` | XCircle |

---

## Background Tints

For icon containers and badges, use color with opacity:

```tsx
// Status icon container
<div className={cn(
  "flex h-8 w-8 items-center justify-center rounded-md",
  isComplete ? "bg-success/10" : isActive ? "bg-primary/10" : "bg-muted"
)}>
  <Icon className={cn(
    "h-4 w-4",
    isComplete ? "text-success" : isActive ? "text-primary" : "text-muted-foreground"
  )} />
</div>
```

**Opacity Scale**:
- `/10` - Subtle tint (icon backgrounds, selection highlights)
- `/20` - Slightly more prominent
- `/30` - Border colors for selection states
- `/50` - Semi-transparent overlays
- `/70` - Strong tint

---

## Selection States

```tsx
// Selected item
className="bg-primary/10 border-primary/30 shadow-sm"

// Hover state
className="hover:bg-muted/50 hover:border-border"

// Active/pressed state
className="active:bg-muted/70"
```

---

## Text Hierarchy

| Level | Class | Usage |
|-------|-------|-------|
| Primary | `text-foreground` | Main content, headings |
| Secondary | `text-muted-foreground` | Descriptions, helper text |
| Link | `text-primary` | Clickable text |
| Success | `text-success` | Positive feedback |
| Warning | `text-warning` | Caution messages |
| Error | `text-destructive` | Error messages |

---

## Adding New Colors

If you need a new semantic color:

1. Add to `@theme inline` in `globals.css`:
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

4. Document in this file
5. Update components to use it

---

## Anti-Patterns

**NEVER**:
```tsx
// Hardcoded colors
className="text-green-500"
className="bg-blue-600"
className="border-red-400"

// Inline styles with colors
style={{ color: '#22c55e' }}
style={{ backgroundColor: 'rgb(59, 130, 246)' }}
```

**ALWAYS**:
```tsx
// Semantic colors
className="text-success"
className="bg-primary"
className="border-destructive"
```
