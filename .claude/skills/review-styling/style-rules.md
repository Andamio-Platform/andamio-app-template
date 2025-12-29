# Andamio T3 App Styling Rules

## Goal

Andamio T3 App Template is easily customizable for devs and ready for any viewport.

## Rules

1. **No Custom Styling on Andamio Components**: Top level page components should never apply custom tailwind properties to [Andamio Components](../../../src/components/andamio/). Always use components as they are.

2. **No Raw shadcn/ui**: shadcn/ui primitives should never be used outside of Andamio Components. Always import from `~/components/andamio/`.

3. **Andamio Prefix Convention**: All Andamio wrapper components must export with the `Andamio` prefix for clarity and consistency. Never use non-prefixed shadcn names in page components.

4. **Global Heading Styles**: All heading tags (`h1`, `h2`, `h3`, `h4`, `h5`, `h6`) are styled globally in `src/styles/globals.css`. Never add custom size, margin, or padding classes to heading tags. Only color classes (e.g., `text-muted-foreground`, `text-primary`) are allowed.

5. **Use AndamioText for Paragraphs**: Never use raw `<p className="...">` with text styling. Always use `AndamioText` component with appropriate variant.

## Examples

### Rule 1 - No Custom Styling

```tsx
// ❌ WRONG - Custom className on Andamio component
<AndamioCard className="shadow-xl border-2">

// ✅ CORRECT - Use as-is, or extract to a new component
<AndamioCard>
```

### Rule 2 - No Raw shadcn

```tsx
// ❌ WRONG - Importing from ~/components/ui
import { Button } from "~/components/ui/button";

// ✅ CORRECT - Import from Andamio
import { AndamioButton } from "~/components/andamio";
```

### Rule 3 - Andamio Prefix

```tsx
// ❌ WRONG - Non-prefixed names
import { Sheet, SheetContent } from "~/components/andamio/andamio-sheet";

// ✅ CORRECT - Andamio-prefixed names
import { AndamioSheet, AndamioSheetContent } from "~/components/andamio/andamio-sheet";
```

### Rule 4 - Global Heading Styles

```tsx
// ❌ WRONG - Custom size/margin/padding on headings
<h1 className="text-3xl font-bold mb-4">Page Title</h1>
<h2 className="text-2xl font-semibold mt-8 mb-2">Section</h2>
<h3 className="text-lg font-medium">Subsection</h3>

// ✅ CORRECT - Use global styles, only color classes allowed
<h1>Page Title</h1>
<h2>Section</h2>
<h3 className="text-muted-foreground">Subsection with muted color</h3>
```

### Rule 5 - AndamioText for Paragraphs

```tsx
// ❌ WRONG - Raw p tags with className
<p className="text-muted-foreground">Description text</p>
<p className="text-sm text-muted-foreground">Small helper text</p>
<p className="text-lg text-muted-foreground">Lead paragraph</p>

// ✅ CORRECT - Use AndamioText with variants
<AndamioText variant="muted">Description text</AndamioText>
<AndamioText variant="small">Small helper text</AndamioText>
<AndamioText variant="lead">Lead paragraph</AndamioText>
```

**Available variants**: `default`, `muted`, `small`, `lead`, `overline`

6. **Content Max-Width**: Content pages (not studio/editor pages) should constrain width for readability on large screens. The `(app)` layout already applies `max-w-6xl mx-auto` (1152px) via `app-layout.tsx`. Studio pages with dense layouts remain full-width.

7. **Vertical Spacing Scale**: Use consistent spacing between elements:

| Context | Spacing | Tailwind | Use For |
|---------|---------|----------|---------|
| Tight | 8px | `space-y-2`, `gap-2` | Studio panels, compact UI |
| Default | 12px | `space-y-3`, `gap-3` | List items, form fields |
| Comfortable | 16px | `space-y-4`, `gap-4` | Cards, content sections |
| Sections | 24px | `space-y-6`, `gap-6` | Page sections |
| Major sections | 32px | `space-y-8`, `gap-8` | Top-level page divisions |

## Examples

### Rule 6 - Content Max-Width

The `(app)` route group layout (`app-layout.tsx`) already applies `max-w-6xl mx-auto` to all content pages. No additional max-width needed on individual pages.

```tsx
// ✅ CORRECT - (app) layout handles max-width automatically
// In src/app/(app)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Content - max-width applied by layout */}
    </div>
  );
}

// ✅ CORRECT - Studio pages stay full-width (different layout)
// In src/app/(studio)/studio/course/page.tsx
<StudioEditorPane>
  <div className="px-6 py-4">
    <DenseStudioContent />
  </div>
</StudioEditorPane>
```

**How max-width is applied:**
- ✅ `(app)` route group: `max-w-6xl mx-auto` via `app-layout.tsx`
- ✅ Landing pages: Apply `max-w-6xl mx-auto` manually if not in `(app)` group
- ❌ `(studio)` route group: Full-width (dense layouts benefit from full width)
- ❌ Editor panels, resizable layouts: Full-width

### Rule 7 - Vertical Spacing

```tsx
// ❌ WRONG - Inconsistent spacing
<div className="space-y-2">  {/* Too tight for list items */}
  {courses.map(c => <CourseCard />)}
</div>

// ✅ CORRECT - Default spacing for lists
<div className="space-y-3">
  {courses.map(c => <CourseCard />)}
</div>

// ✅ CORRECT - Comfortable spacing for card grids
<div className="grid gap-4">
  {items.map(i => <Card />)}
</div>

// ✅ CORRECT - Section spacing
<div className="space-y-6">
  <Section title="Overview" />
  <Section title="Details" />
</div>
```

## Wrapper Convention

Every Andamio wrapper file in `src/components/andamio/` must:

1. Export all component parts with `Andamio` prefix
2. Optionally re-export base names for backwards compatibility
3. Use consistent naming: `ComponentName` → `AndamioComponentName`

Example wrapper pattern:
```tsx
// src/components/andamio/andamio-sheet.tsx
export {
  Sheet as AndamioSheet,
  SheetContent as AndamioSheetContent,
  SheetHeader as AndamioSheetHeader,
  // ... etc
} from "~/components/ui/sheet";
```

---

## Future Automation (ESLint)

These ESLint rules can be added to automatically catch styling violations:

### Rule 2: No Raw shadcn/ui Imports

Add to `.eslintrc.js`:

```javascript
module.exports = {
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            group: ['~/components/ui/*'],
            message: 'Import from ~/components/andamio instead of ~/components/ui. See Rule 2 in style-rules.md.',
          },
        ],
      },
    ],
  },
};
```

### Hardcoded Colors

Add a custom rule or use `eslint-plugin-tailwindcss`:

```javascript
// In eslint config
{
  "rules": {
    "no-restricted-syntax": [
      "error",
      {
        "selector": "Literal[value=/(?:text|bg|border|ring)-(?:red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|amber|orange|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-[0-9]/]",
        "message": "Use semantic color variables (text-success, text-warning, etc.) instead of hardcoded Tailwind colors."
      }
    ]
  }
}
```

### Quick Grep Commands

Until ESLint rules are implemented, use these commands to find violations:

```bash
# Find raw shadcn imports in pages
grep -r "from ['\"]~/components/ui" src/app/

# Find hardcoded colors
grep -rE "text-(red|green|blue|yellow)-[0-9]" src/app/
grep -rE "bg-(red|green|blue|yellow)-[0-9]" src/app/

# Find non-prefixed component names from andamio wrappers
grep -rE "import \{[^}]*\b(Sheet|Popover|Avatar|DropdownMenu)\b" src/app/

# Find heading tags with custom size/margin/padding classes
grep -rE "<h[1-6][^>]*(text-(xs|sm|base|lg|xl|[2-9]xl)|font-(normal|medium|semibold|bold)|m[tby]-|mb-|mt-|p[tby]-)" src/

# Find raw p tags with className (should use AndamioText)
grep -rE "<p className=" src/app/ src/components/
```