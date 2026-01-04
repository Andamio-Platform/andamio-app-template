# Global Style Checker

## Introduction

This skill detects CSS specificity issues where global styles in `globals.css` override Tailwind utility classes. These issues are particularly insidious because they fail silently - no error message, the style just doesn't apply.

## When to Use

- After encountering unexplained styling issues
- When Tailwind utility classes seem to have no effect
- During styling reviews as a secondary check
- When adding new global styles to `globals.css`

## Instructions

### 1. Identify the Problematic Element

When a user reports a styling issue (e.g., "the font size didn't change"), first identify which HTML element is involved.

### 2. Check Against Known Overrides

Review the `global-overrides.md` file in this directory for known global styles that override utilities.

**High-Risk Elements** (have global styles that WILL override utilities):
- `<code>` - text-sm, font-mono, bg-muted, padding, rounded
- `<p>` - text-base, leading-relaxed, max-width
- `<h1>` through `<h6>` - ALL styles use `!important`, cannot be overridden
- `<ul>`, `<ol>` - list styles, margins, spacing
- `<li>` - leading, color
- `<blockquote>` - borders, padding, italic, margins
- `<pre>` - background, padding, borders, margins
- `<input>`, `<textarea>`, `<select>` - borders, padding (uses `!important`)
- `<label>` - display, font-weight, font-size, margin
- `<form>` - vertical spacing
- `<section>` - vertical padding

### 3. Recommend Alternatives

For each problematic element, suggest the correct pattern:

| Element | Problem | Solution |
|---------|---------|----------|
| `<code>` | Global `text-sm` overrides size utilities | Use `<span className="font-mono">` |
| `<p>` | Global `max-width: 70ch` limits width | Add `max-w-none` or use `<div>` |
| Headings | `!important` prevents all overrides | Use semantic heading level, don't fight it |
| `<input>` | Global border/padding uses `!important` | Use `AndamioInput` component |
| `<ul>/<ol>` | Global list styles apply | Use `list-none` to reset, or use component |

### 4. Quick Diagnostic Commands

Run these to find potential issues in a file:

```bash
# Find raw <code> elements with size utilities (likely broken)
grep -n '<code.*text-\[' path/to/file.tsx

# Find paragraphs fighting max-width
grep -n '<p.*max-w-' path/to/file.tsx

# Find headings with custom sizes (will be ignored)
grep -n '<h[1-6].*text-' path/to/file.tsx

# Find raw inputs (should use AndamioInput)
grep -n '<input' path/to/file.tsx | grep -v 'AndamioInput'
```

### 5. Prevention Checklist

When reviewing code, check for these anti-patterns:

- [ ] No raw `<code>` elements with custom text sizes
- [ ] No raw `<p>` elements fighting width constraints
- [ ] No custom size/margin classes on heading elements
- [ ] No raw `<input>`, `<textarea>`, `<select>` elements
- [ ] No raw `<ul>`/`<ol>` where custom styling is needed

## Output Format

When diagnosing an issue:

```
## Global Style Conflict Detected

**Element**: `<code>`
**Applied class**: `text-[10px]`
**Overriding rule**: `globals.css` line 234-236
```css
code {
  @apply bg-muted px-1.5 py-0.5 text-sm font-mono rounded-md text-foreground/90;
}
```

**Why it fails**: The global `text-sm` in `@apply` has higher specificity than Tailwind utilities on the same element.

**Solution**: Replace `<code className="text-[10px]">` with `<span className="font-mono text-[10px]">`
```

## Related Skills

- `review-styling` - General styling review (should run this skill as a sub-check)
- `theme-expert` - Design system knowledge
