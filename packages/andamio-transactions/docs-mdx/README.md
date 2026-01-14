# @andamio/transactions MDX Documentation

This folder contains MDX documentation files compatible with the Andamio Docs site (Fumadocs).

## Files

```
docs-mdx/
├── README.md           # This file
├── meta.json           # Navigation structure
├── index.mdx           # Package overview
├── getting-started.mdx # Installation and basic usage
├── utilities.mdx       # Hash functions and CBOR decoder
├── side-effects.mdx    # Database update patterns
├── input-helpers.mdx   # Complex input formatting
└── v2/
    ├── meta.json       # V2 navigation
    └── index.mdx       # V2 transactions reference
```

## Moving to Andamio Docs

When ready to publish these docs:

1. Copy the entire `docs-mdx/` folder to `andamio-docs/content/docs/sdk/transactions/`

2. Rename the folder:
   ```bash
   cd andamio-docs/content/docs/sdk
   mv docs-mdx transactions
   ```

3. Update the parent `meta.json` to include the new section:
   ```json
   {
     "pages": [
       "...",
       "transactions"
     ]
   }
   ```

4. Update internal links if the path structure differs from `/docs/sdk/transactions/`

## MDX Style Guide

These files follow the Andamio Docs style:

### Frontmatter

```yaml
---
title: "Page Title"
description: "Brief description for SEO"
icon: IconName  # Lucide icon name
---
```

### Components

- `<Cards>` / `<Card>` - Feature cards with icons
- Code blocks with syntax highlighting
- Tables for structured data
- Inline code for identifiers

### Conventions

- Use sentence case for headings
- Include TypeScript examples
- Link to related pages at the bottom
- Keep code examples concise and practical

## Development

To preview these docs locally with the Andamio Docs site:

1. Symlink or copy to the docs project
2. Run the docs dev server: `npm run dev`
3. Navigate to `/docs/sdk/transactions`
