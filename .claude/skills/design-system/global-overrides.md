# Global Style Overrides Reference

This document catalogs all global styles in `src/styles/globals.css` that can override Tailwind utility classes.

**Last Updated**: December 31, 2025

---

## Critical Overrides (Will Break Utilities)

These global styles use `@apply` or `!important` and WILL override Tailwind utilities applied to the same element.

### `<code>` Element

**Location**: `globals.css` line 234-236

```css
code {
  @apply bg-muted px-1.5 py-0.5 text-sm font-mono rounded-md text-foreground/90;
}
```

**Overrides**:
| Utility | Overridden By | Effect |
|---------|---------------|--------|
| `text-xs`, `text-[10px]`, etc. | `text-sm` | Font size locked to 14px |
| `bg-*` | `bg-muted` | Background color locked |
| `px-*`, `py-*`, `p-*` | `px-1.5 py-0.5` | Padding locked |
| `rounded-*` | `rounded-md` | Border radius locked |
| `text-*` (color) | `text-foreground/90` | Text color locked |

**Solution**: Use `<span className="font-mono">` instead of `<code>`.

---

### Headings `<h1>` through `<h6>`

**Location**: `globals.css` lines 256-359

All heading styles use `!important` and **cannot be overridden**.

```css
h1 {
  font-size: 1.875rem !important;
  line-height: 2.25rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.025em !important;
  margin-bottom: 1.5rem !important;
  margin-top: 0 !important;
}
/* Similar patterns for h2-h6 */
```

**Overrides**: ALL of these properties are locked:
- `text-*` (size)
- `leading-*` (line-height)
- `font-*` (weight)
- `tracking-*` (letter-spacing)
- `mb-*`, `mt-*`, `m-*` (margins)

**Solution**: Don't fight it. Use the correct semantic heading level. If you need different sizing, use a `<div>` or `<span>` with heading-like styling.

---

### `<input>`, `<textarea>`, `<select>` Elements

**Location**: `globals.css` lines 672-676 and 753-758

```css
/* In @layer components */
input, textarea, select {
  @apply px-3 py-2 w-full text-sm rounded-md bg-background;
}

/* Outside @layer (highest specificity) */
input, textarea, select {
  border: 1px solid color-mix(in oklch, var(--border) 60%, transparent) !important;
  padding-inline: 1rem !important;
}
```

**Overrides**:
| Utility | Overridden By | Effect |
|---------|---------------|--------|
| `border-*` | `border: 1px solid...` | Border locked (uses `!important`) |
| `px-*` | `padding-inline: 1rem` | Horizontal padding locked (uses `!important`) |
| `py-*` | `py-2` | Vertical padding can be overridden |
| `w-*` | `w-full` | Width can be overridden |
| `text-*` (size) | `text-sm` | Font size can be overridden |

**Solution**: Use `AndamioInput`, `AndamioTextarea`, or `AndamioSelect` components.

---

## Medium-Risk Overrides

These use `@apply` and may conflict with utilities but can sometimes be overridden.

### `<p>` Element

**Location**: `globals.css` lines 204-208

```css
p {
  @apply text-base leading-relaxed text-foreground/90;
  @apply mb-4 last:mb-0;
  max-width: 70ch;
}
```

**Overrides**:
| Utility | Overridden By | Can Override? |
|---------|---------------|---------------|
| `text-*` (size) | `text-base` | Yes, with more specific selector |
| `leading-*` | `leading-relaxed` | Yes |
| `text-*` (color) | `text-foreground/90` | Yes |
| `mb-*` | `mb-4` | Yes |
| `max-w-*` | `max-width: 70ch` | Yes, add `max-w-none` |

**Solution**: Add `max-w-none` to remove width constraint. For other overrides, utilities should work but test carefully.

---

### `<ul>` and `<ol>` Elements

**Location**: `globals.css` lines 211-221

```css
ul, ol {
  @apply mb-4 ml-6 space-y-1.5;
}

ul {
  @apply list-disc;
}

ol {
  @apply list-decimal;
}
```

**Overrides**:
| Utility | Overridden By | Can Override? |
|---------|---------------|---------------|
| `mb-*` | `mb-4` | Yes |
| `ml-*` | `ml-6` | Yes |
| `space-y-*` | `space-y-1.5` | Yes |
| `list-none` | `list-disc/decimal` | Yes, use `list-none` |

**Solution**: Add `list-none ml-0 space-y-0` to reset, then apply desired styles.

---

### `<li>` Element

**Location**: `globals.css` lines 223-225

```css
li {
  @apply leading-relaxed text-foreground/90;
}
```

**Overrides**: `leading-*` and `text-*` (color) - both can be overridden.

---

### `<blockquote>` Element

**Location**: `globals.css` lines 228-231

```css
blockquote {
  @apply border-l-2 border-primary/30 pl-4 italic my-6;
  @apply text-muted-foreground;
}
```

**Overrides**: All properties can be overridden with utilities.

---

### `<pre>` Element

**Location**: `globals.css` lines 238-240

```css
pre {
  @apply bg-muted p-4 overflow-x-auto my-6 rounded-lg text-sm border border-border;
}
```

**Overrides**: All properties can be overridden, but be aware of nested `<code>` element behavior.

---

### `<label>` Element

**Location**: `globals.css` lines 667-669

```css
label {
  @apply block font-medium text-sm text-foreground mb-1.5;
}
```

**Overrides**: All can be overridden. Use `inline` to override `block`.

---

### `<form>` Element

**Location**: `globals.css` lines 664-666

```css
form {
  @apply space-y-5;
}
```

**Overrides**: `space-y-*` - can be overridden.

---

### `<section>` Element

**Location**: `globals.css` lines 641-643

```css
section {
  @apply py-8;
}
```

**Overrides**: `py-*` - can be overridden.

---

## ProseMirror/Tiptap Editor Overrides

The `.ProseMirror` class has its own set of overrides (lines 414-636). These only apply inside the editor content area and use scoped selectors like `.ProseMirror h1`, `.ProseMirror p`, etc.

These don't affect the rest of the app - only editor content.

---

## Quick Reference Card

| Element | Risk Level | Primary Conflict | Solution |
|---------|------------|------------------|----------|
| `<code>` | **Critical** | `text-sm` | Use `<span className="font-mono">` |
| `<h1>-<h6>` | **Critical** | `!important` on all | Use correct semantic level |
| `<input>` | **Critical** | `border`, `padding-inline` | Use `AndamioInput` |
| `<textarea>` | **Critical** | `border`, `padding-inline` | Use `AndamioTextarea` |
| `<select>` | **Critical** | `border`, `padding-inline` | Use `AndamioSelect` |
| `<p>` | Medium | `max-width: 70ch` | Add `max-w-none` |
| `<ul>/<ol>` | Medium | `list-disc/decimal` | Add `list-none` |
| `<label>` | Low | `block` | Add `inline` |
| `<form>` | Low | `space-y-5` | Override with `space-y-*` |
| `<section>` | Low | `py-8` | Override with `py-*` |

---

## Adding New Global Styles

Before adding new global styles to `globals.css`:

1. **Consider scope**: Can this be a component instead?
2. **Avoid element selectors**: Prefer class-based selectors
3. **Never use `!important`**: Unless absolutely necessary (headings are an exception)
4. **Document the override**: Add to this file
5. **Update the skill**: Add to the SKILL.md checklist
