# Theme Expert

## Purpose

This skill provides comprehensive knowledge about Andamio's design system, layout patterns, and theme customization rules. Use this skill when:
- Designing new pages or components
- Understanding what can/cannot be customized
- Ensuring visual consistency across the application
- Choosing the right layout pattern for a use case

## Instructions

### 1. Understand the Request

When the user asks about layouts, theming, or styling:
- Identify which aspect they're asking about (layout, colors, spacing, components)
- Reference the appropriate documentation file in this directory
- Provide concrete examples from the codebase

### 2. Key Principles

**Consistency Over Creativity**: All UI follows established patterns. No custom one-off styling.

**Semantic Over Literal**: Use semantic colors (`text-success`) not literal (`text-green-600`).

**Composition Over Configuration**: Build complex UIs by composing Andamio components, not adding props.

**Andamio Prefix**: All components use `Andamio` prefix for consistency and future package extraction.

### 3. Documentation Files

| File | Contents |
|------|----------|
| [layouts.md](./layouts.md) | Layout patterns (app shell, studio, master-detail) |
| [semantic-colors.md](./semantic-colors.md) | Color system and usage guidelines |
| [spacing.md](./spacing.md) | Spacing scales and consistent patterns |
| [components.md](./components.md) | Common component patterns |
| [cannot-customize.md](./cannot-customize.md) | What you CANNOT do |

### 4. Quick Reference

**Layout Patterns**:
- App Shell: Sidebar + content area (standard app pages)
- Studio Layout: StudioHeader + workspace (creation/editing pages)
- Master-Detail: List panel + preview panel (Course Studio pattern)
- Wizard: Outline panel + step content (Module Editor pattern)

**Semantic Colors**:
- `primary` - Links, active states, brand
- `success` - Completed, on-chain, active
- `warning` - Pending, caution
- `info` - Informational, neutral
- `destructive` - Errors, delete actions
- `muted` - Secondary text, disabled

**Spacing Scale**:
- `p-3` / `gap-3` - List containers
- `p-4` - Content areas
- `p-6` - Cards, sections
- `px-3 py-3` - List items

## Output Format

Provide clear, actionable guidance with:
1. Which pattern to use and why
2. Code examples from the codebase
3. Links to relevant documentation files
4. What NOT to do (anti-patterns)
