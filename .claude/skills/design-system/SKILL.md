---
name: design-system
description: Andamio design system expertise with three modes - review routes for styling compliance, diagnose CSS specificity conflicts, or reference design patterns and guidelines.
---

# Design System

Comprehensive Andamio design system skill with three operational modes.

## Modes

| Mode | Command | Purpose |
|------|---------|---------|
| **Review** | `/design-system review` | Audit a route for styling compliance |
| **Diagnose** | `/design-system diagnose` | Debug CSS specificity conflicts |
| **Reference** | `/design-system` | Query design patterns and guidelines |

---

## Mode 1: Review (Route Audit)

Review a route and its components to confirm styling rules are correctly applied.

### Instructions

#### Step 1: Choose Review Mode

Ask the user which depth they prefer:

**Quick Scan** (recommended for new routes):
- Only checks the page file itself
- Looks at imports and catches ~80% of common issues
- Fast, minimal context usage

**Full Review** (recommended for thorough audits):
- Recursively checks all imported components
- More comprehensive but takes longer
- Best for final review before release

#### Step 2: Identify the Route

Expect route in URL form: `/studio/course/aabbaabb` → `src/app/(app)/studio/course/[coursenft]/page.tsx`

If no route provided, ask for one. Routes are in `/src/app`.

#### Step 3: Collect Components

**Quick Scan**: Skip - only review the page file.

**Full Review**: Create a checklist of all Component import paths. Recursively review each component file until complete.

#### Step 4: Apply Rules

Work through each file. Apply rules from:
- [style-rules.md](./style-rules.md) - Core styling rules
- [semantic-colors.md](./semantic-colors.md) - No hardcoded colors
- [responsive-design.md](./responsive-design.md) - Andamio layout components
- [icon-system.md](./icon-system.md) - Centralized icons with semantic names

**Quick checks for each file:**
- Importing from `~/components/ui/`? → Change to `~/components/andamio/`
- Using non-prefixed names (`Sheet` vs `AndamioSheet`)? → Use Andamio prefix
- Hardcoded colors (`text-green-600`)? → Use semantic (`text-success`)
- Inline loading skeletons? → Use `AndamioPageLoading`
- Inline empty states? → Use `AndamioEmptyState`
- Importing from `lucide-react`? → Change to `~/components/icons`

#### Step 5: Look for Extraction Candidates

Check [extracted-components.md](./extracted-components.md) for existing components. If you see reusable patterns not yet extracted, note them as suggestions.

#### Step 6: Run Typecheck

After changes: `npm run typecheck`

#### Step 7: Report

Show summary of changes and extraction recommendations.

---

## Mode 2: Diagnose (CSS Specificity)

Detect CSS specificity issues where global styles in `globals.css` override Tailwind utility classes.

### When to Use

- Tailwind utility classes seem to have no effect
- Unexplained styling issues
- After adding new global styles to `globals.css`

### Instructions

#### Step 1: Identify the Element

When a user reports "the style didn't apply", identify which HTML element is involved.

#### Step 2: Check Against Known Overrides

Review [global-overrides.md](./global-overrides.md) for known conflicts.

**High-Risk Elements** (have global styles that WILL override utilities):
| Element | Overrides |
|---------|-----------|
| `<code>` | text-sm, font-mono, bg-muted, padding, rounded |
| `<p>` | text-base, leading-relaxed, max-width |
| `<h1>`-`<h6>` | ALL styles use `!important` |
| `<ul>`, `<ol>` | list styles, margins, spacing |
| `<input>`, `<textarea>` | borders, padding (`!important`) |
| `<label>` | display, font-weight, font-size |

#### Step 3: Recommend Alternatives

| Element | Problem | Solution |
|---------|---------|----------|
| `<code>` | Global `text-sm` overrides | Use `<span className="font-mono">` |
| `<p>` | Global `max-width: 70ch` | Add `max-w-none` or use `<div>` |
| Headings | `!important` prevents overrides | Use semantic heading level |
| `<input>` | Global border/padding | Use `AndamioInput` component |

#### Step 4: Quick Diagnostic Commands

```bash
# Find raw <code> with size utilities (likely broken)
grep -n '<code.*text-\[' path/to/file.tsx

# Find headings with custom sizes (will be ignored)
grep -n '<h[1-6].*text-' path/to/file.tsx

# Find raw inputs (should use AndamioInput)
grep -n '<input' path/to/file.tsx | grep -v 'AndamioInput'
```

### Output Format

```
## Global Style Conflict Detected

**Element**: `<code>`
**Applied class**: `text-[10px]`
**Overriding rule**: `globals.css` line 234-236

**Why it fails**: Global `text-sm` has higher specificity than Tailwind utilities.

**Solution**: Replace `<code className="text-[10px]">` with `<span className="font-mono text-[10px]">`
```

---

## Mode 3: Reference (Design System Knowledge)

Provide guidance about Andamio's design system, layout patterns, and theme rules.

### When to Use

- Designing new pages or components
- Understanding what can/cannot be customized
- Ensuring visual consistency
- Choosing the right layout pattern

### Key Principles

**Consistency Over Creativity**: All UI follows established patterns. No custom one-off styling.

**Semantic Over Literal**: Use semantic colors (`text-success`) not literal (`text-green-600`).

**Composition Over Configuration**: Build complex UIs by composing Andamio components, not adding props.

**Andamio Prefix**: All components use `Andamio` prefix for consistency.

### Documentation Files

| File | Contents |
|------|----------|
| [layouts.md](./layouts.md) | Layout patterns (app shell, studio, master-detail, wizard) |
| [semantic-colors.md](./semantic-colors.md) | Color system and usage guidelines |
| [spacing.md](./spacing.md) | Spacing scales and consistent patterns |
| [components.md](./components.md) | Common component patterns |
| [cannot-customize.md](./cannot-customize.md) | What you CANNOT do |
| [responsive-design.md](./responsive-design.md) | Responsive layout components |
| [icon-system.md](./icon-system.md) | Centralized icon system |
| [extracted-components.md](./extracted-components.md) | Reusable Andamio components |
| [route-reference.md](./route-reference.md) | Route patterns and examples |

### Quick Reference

**Layout Patterns**:
- App Shell: Sidebar + content area (standard app pages)
- Studio Layout: StudioHeader + workspace (creation/editing pages)
- Master-Detail: List panel + preview panel (Course Studio)
- Wizard: Outline panel + step content (Module Editor)

**Semantic Colors**:
| Color | Use For |
|-------|---------|
| `primary` | Links, active states, brand |
| `success` | Completed, on-chain, active |
| `warning` | Pending, caution |
| `info` | Informational, neutral |
| `destructive` | Errors, delete actions |
| `muted` | Secondary text, disabled |

**Spacing Scale**:
| Pattern | Use |
|---------|-----|
| `p-3` / `gap-3` | List containers |
| `p-4` | Content areas |
| `p-6` | Cards, sections |
| `px-3 py-3` | List items |

### Output Format

Provide clear, actionable guidance with:
1. Which pattern to use and why
2. Code examples from the codebase
3. Links to relevant documentation files
4. What NOT to do (anti-patterns)

---

## All Documentation Files

| File | Purpose |
|------|---------|
| [style-rules.md](./style-rules.md) | Core styling rules (no custom styling, Andamio prefix) |
| [semantic-colors.md](./semantic-colors.md) | Color system and usage |
| [responsive-design.md](./responsive-design.md) | Responsive layout components |
| [icon-system.md](./icon-system.md) | Centralized icon imports |
| [extracted-components.md](./extracted-components.md) | Existing Andamio components |
| [global-overrides.md](./global-overrides.md) | CSS specificity conflicts |
| [layouts.md](./layouts.md) | Layout patterns |
| [spacing.md](./spacing.md) | Spacing scale |
| [components.md](./components.md) | Component patterns |
| [cannot-customize.md](./cannot-customize.md) | Customization restrictions |
| [route-reference.md](./route-reference.md) | Route examples |
