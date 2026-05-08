# White-Label Guide

This template is designed for easy customization. Follow this guide to rebrand it for your organization.

## Quick Start (15 minutes)

### Step 1: Update Branding Identity

Edit `src/config/branding.ts`:

```typescript
export const BRANDING = {
  name: "Your App Name",
  tagline: "Your Tagline",
  fullTitle: "Your App Name - Full Title",
  description: "Your app description for SEO",

  logo: {
    // Theme-aware SVG logos (recommended)
    horizontal: "/logos/logo-with-typography.svg",
    horizontalDark: "/logos/logo-with-typography-dark.svg",
    stacked: "/logos/logo-with-typography-stacked.svg",
    stackedDark: "/logos/logo-with-typography-stacked-dark.svg",
    // Legacy icon reference (for components that still use icons)
    icon: "ModuleIcon",
    favicon: "/favicon.ico",
    ogImage: "/og-image.png",
  },

  links: {
    website: "https://yourapp.io",
    docs: "https://docs.yourapp.io",
    github: "https://github.com/your-org",
    twitter: "https://twitter.com/yourapp",
  },

  support: {
    email: "support@yourapp.io",
  },

  // Keep or customize documentation URLs
  docs: {
    baseUrl: "https://docs.andamio.io", // or your own docs
    transactionPaths: { /* ... */ },
  },
};
```

### Step 2: Update Marketing Copy

Edit `src/config/marketing.ts`:

- Update hero section text (badge, title, subtitle)
- Update feature descriptions
- Update footer content
- Update timeline dates

### Step 3: Replace Assets

**Logo files** (in `public/logos/`):
- `logo-with-typography.svg` - Horizontal logo for light backgrounds
- `logo-with-typography-dark.svg` - Horizontal logo for dark backgrounds
- `logo-with-typography-stacked.svg` - Stacked logo for light backgrounds
- `logo-with-typography-stacked-dark.svg` - Stacked logo for dark backgrounds

**Other assets**:
- Replace `public/favicon.ico` with your favicon
- Replace `public/og-image.png` with your social share image (1200x630 recommended)

> **Tip:** Export your logo in SVG format for crisp rendering at all sizes. The sidebar uses the horizontal logo variants.

### Step 4: Update Colors

Edit `src/styles/globals.css`. The template uses the official Andamio brand colors:

```css
:root {
  /* Primary - Scaffold Orange (#FF6B35) */
  --primary: oklch(0.669 0.199 38.581);
  --primary-foreground: oklch(1 0 0);

  /* Secondary - Foundation Blue (#004E89) */
  --secondary: oklch(0.387 0.134 250.505);
  --secondary-foreground: oklch(1 0 0);
}

.dark {
  /* Primary - Brighter orange for dark mode */
  --primary: oklch(0.719 0.174 38.581);
  --primary-foreground: oklch(0.188 0.013 257.128);

  /* Secondary - Brighter blue for dark mode */
  --secondary: oklch(0.605 0.155 250.505);
  --secondary-foreground: oklch(1 0 0);
}
```

**To use your own brand colors:**
1. Convert your hex color to OKLCH using a tool like [oklch.com](https://oklch.com)
2. Replace the hue value (38.581 for orange, 250.505 for blue) with your brand hue
3. Adjust lightness (first value) for light/dark mode contrast

### Step 5: Update Environment

Copy `.env.example` to `.env.local` and configure:

```bash
# Your API gateway URL
NEXT_PUBLIC_ANDAMIO_GATEWAY_URL="https://your-api.example.com"

# Cardano network (preprod or mainnet)
NEXT_PUBLIC_CARDANO_NETWORK="preprod"

# Your access token policy ID
NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID="your-policy-id"
```

---

## Complete Checklist

### Must Change

- [ ] `src/config/branding.ts` - App identity (name, links, support email)
- [ ] `src/config/marketing.ts` - Landing page copy
- [ ] `public/favicon.ico` - Site icon
- [ ] `.env.local` - API configuration

### Should Change

- [ ] `public/logos/*.svg` - Logo files (4 variants for light/dark themes)
- [ ] `src/styles/globals.css` - Color palette (`--primary`, `--secondary`)
- [ ] `public/og-image.png` - Social sharing image
- [ ] `src/config/navigation.ts` - Sidebar structure (if needed)

### Consider Changing

- [ ] `src/config/features.ts` - Enable/disable features
- [ ] Font in `layout.tsx` + `globals.css` - Typography (default: Inter)
- [ ] Component names (`Andamio*` → `YourBrand*`) - for complete rebrand only

---

## Configuration Reference

### branding.ts Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `name` | Short app name | "MyApp" |
| `tagline` | Sidebar subtitle | "Learning Platform" |
| `fullTitle` | Page title | "MyApp - Learning Platform" |
| `description` | SEO description | "Build skills with..." |
| `logo.horizontal` | Logo for light mode (sidebar) | "/logos/logo-light.svg" |
| `logo.horizontalDark` | Logo for dark mode (sidebar) | "/logos/logo-dark.svg" |
| `logo.stacked` | Stacked logo for light mode | "/logos/logo-stacked-light.svg" |
| `logo.stackedDark` | Stacked logo for dark mode | "/logos/logo-stacked-dark.svg" |
| `links.website` | Main website | "https://myapp.io" |
| `links.docs` | Documentation site | "https://docs.myapp.io" |
| `support.email` | Support contact | "help@myapp.io" |

### marketing.ts Sections

| Section | Purpose |
|---------|---------|
| `hero` | Landing page hero section |
| `playground` | "This is a playground" explanation |
| `twoPaths` | Discover/Create cards |
| `pioneers` | Pioneer program callout |
| `preprodWarning` | Preprod network warning |
| `finalCta` | Final call-to-action |
| `timeline` | Launch dates |
| `landingCards` | Explore / Sign In / Get Started card titles and descriptions |
| `footer` | Footer links and brand text |

### Color Variables

| Variable | Purpose | Default (Andamio Brand) |
|----------|---------|-------------------------|
| `--primary` | Buttons, links, success/completed states | Scaffold Orange (#FF6B35) |
| `--secondary` | Info states, supporting UI elements | Foundation Blue (#004E89) |
| `--destructive` | Errors, delete actions | Red |
| `--muted` | Disabled, secondary text, pending states | Gray |
| `--accent` | Subtle highlights | Warm orange tint |

> **Note:** The Andamio brand uses a simplified two-color palette (Orange + Blue). Status indicators use `primary` for success/completed and `secondary` for info states, rather than separate green/blue semantic colors.

### Font

| Setting | Default | File |
|---------|---------|------|
| Font family | Inter | `src/app/layout.tsx` |
| CSS variable | `--font-inter` | `src/styles/globals.css` |

---

## Helper Functions

The template provides these helpers in `src/config/branding.ts`:

### `getPageTitle(title?: string)`

Generate consistent page titles:

```typescript
getPageTitle("Courses") // => "Courses | YourApp"
getPageTitle()          // => "YourApp - Full Title"
```

### `getDocsUrl(path)`

Get documentation URLs:

```typescript
getDocsUrl("accessTokenMint")
// => "https://docs.andamio.io/docs/protocol/v2/transactions/..."
```

### `getPageMetadata(title?, description?)`

Generate Next.js metadata for pages:

```typescript
// In any page.tsx
export const metadata = getPageMetadata("Courses", "Browse available courses");
```

---

## FAQ

### Q: Should I rename the `Andamio*` components?

**A:** Optional. The prefix doesn't appear in the UI, so leaving it costs you nothing visible. Rename when you want your codebase to *feel* like your app rather than a fork — typically when you're handing the project off to a team.

The wrappers live in `src/components/andamio/` and are referenced ~200 times across the codebase. Two safe ways to rename them:

**Option A — IDE rename (recommended).** Open `src/components/andamio/index.ts`, then for each exported wrapper name (`AndamioButton`, `AndamioCard`, etc.) right-click → *Rename Symbol* (F2 in VS Code). TypeScript updates every import site automatically. Slow but airtight.

**Option B — scoped sed.** Faster, but read the guards carefully and run `npm run check` after.

```bash
# 1. Rename the wrapper exports in src/components/andamio/ itself.
#    Scoped to that one folder, so nothing else can be touched.
find src/components/andamio -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -exec sed -i '' 's/Andamio\([A-Z]\)/App\1/g' {} +

# 2. Update import sites across the rest of src/.
#    Two guards: skip generated types (regenerated from API spec on next sync),
#    and skip lines containing `useAndamioAuth` (the auth hook is intentionally
#    gateway-named — renaming it has nothing to do with white-labeling the UI).
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path 'src/types/generated/*' \
  -exec sed -i '' '/useAndamioAuth/!s/Andamio\([A-Z]\)/App\1/g' {} +

# 3. Optional — rename the folder too.
git mv src/components/andamio src/components/app
find src -type f \( -name "*.ts" -o -name "*.tsx" \) \
  -not -path 'src/types/generated/*' \
  -exec sed -i '' 's|components/andamio|components/app|g' {} +

# 4. Verify nothing broke.
npm run check
```

**Notes on the guards**:
- The lowercase `andamio-` in `@andamio/core`, `@andamio/datum-utils`, and `andamio-auth.ts` is naturally skipped because the regex starts with capital `A`.
- `useAndamioAuth` would otherwise match (the `A` in `Auth` satisfies `[A-Z]`), so it's excluded by the `!` line filter — leaving the auth hook untouched.
- `src/types/generated/` is regenerated from the OpenAPI spec, so any rename inside would be silently undone on the next `npm run generate:types`.

**Cross-platform**: `sed -i ''` is BSD/macOS syntax. On Linux/WSL drop the empty string: `sed -i 's/...'`.

### Q: Can I use a different backend?

**A:** The template is built for the Andamio Gateway API. You can:

1. **Use Andamio's hosted gateway** (recommended) - Just change the URL
2. **Deploy your own Andamio backend** - See Andamio documentation
3. **Build a compatible API** - Implement the same endpoints (significant effort)

### Q: What about the @andamio/* packages?

**A:** These are npm packages implementing the Andamio protocol for Cardano. Keep them for Cardano compatibility or replace with your own implementations if you're building a different blockchain integration.

### Q: How do I change the font?

**A:** The template uses **Inter** by default. To change it:

1. Edit `src/app/layout.tsx`:

```typescript
import { Your_Font } from "next/font/google";

const yourFont = Your_Font({
  subsets: ["latin"],
  variable: "--font-your-font",
  weight: ["300", "400", "500", "600", "700"],
});

// Update the html className to use your font variable
<html className={`${yourFont.variable} ...`}>
```

2. Update `src/styles/globals.css`:

```css
@theme {
  --font-sans: var(--font-your-font), ui-sans-serif, system-ui, sans-serif, ...;
}
```

### Q: Can I remove features?

**A:** Yes! Use `src/config/features.ts`:

```typescript
export const FEATURES = {
  courses: true,    // Enable courses
  projects: false,  // Disable projects
  // ...
};
```

Then check `isFeatureEnabled("projects")` in your components.

---

## Architecture Notes

### What Flows from BRANDING

- Browser tab title
- SEO metadata (title, description, OG image)
- **Sidebar logo** (theme-aware, switches between light/dark variants)
- Footer brand text
- Transaction documentation links
- Support email references

### What Flows from MARKETING

- Landing page hero text
- Feature descriptions
- CTAs and buttons
- Timeline dates
- Footer links

### What Stays Hardcoded (By Design)

| Item | Reason |
|------|--------|
| `@andamio/*` imports | Real npm packages for protocol compatibility |
| Protocol doc comments | Developer reference for understanding code |
| Generated type names | Auto-generated from API spec |
| Andamioscan links | Protocol-specific blockchain explorer |

---

## Verification

After customization, verify your changes:

```bash
# Type check
npm run typecheck

# Build
npm run build

# Start dev server
npm run dev
```

Then visually check:

1. Landing page shows your branding
2. Browser tab shows your title
3. Sidebar shows your app name
4. Social share preview shows your OG image

---

## Support

- **Andamio Documentation:** https://docs.andamio.io
- **GitHub Issues:** https://github.com/Andamio-Platform/andamio-app-template/issues
- **Discord:** https://discord.gg/andamio
