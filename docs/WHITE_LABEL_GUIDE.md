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
    icon: "ModuleIcon", // Icon component name
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

- Replace `public/favicon.ico` with your favicon
- Replace `public/og-image.png` with your social share image (1200x630 recommended)

### Step 4: Update Colors

Edit `src/styles/globals.css`:

```css
:root {
  /* Primary brand color */
  --primary: oklch(0.55 0.18 YOUR_HUE);
  --primary-foreground: oklch(0.985 0 0);

  /* Status colors (optional - sensible defaults provided) */
  --success: oklch(0.52 0.15 145);
  --warning: oklch(0.75 0.15 85);
  --destructive: oklch(0.55 0.2 25);
}
```

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

- [ ] `src/styles/globals.css` - Color palette (at minimum `--primary`)
- [ ] `public/og-image.png` - Social sharing image
- [ ] `src/config/navigation.ts` - Sidebar structure (if needed)

### Consider Changing

- [ ] `src/config/features.ts` - Enable/disable features
- [ ] Font in `globals.css` - Typography
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
| `footer` | Footer links and brand text |

### Color Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `--primary` | Buttons, links, active states | Sky blue |
| `--success` | Success messages, completed | Green |
| `--warning` | Warnings, pending states | Yellow |
| `--destructive` | Errors, delete actions | Red |
| `--muted` | Disabled, secondary text | Gray |

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

### Q: Do I need to rename Andamio* components?

**A:** No. These are semantic names for the design system (like "Bootstrap" components). You can keep them or rename if doing a complete rebrand. The component prefix doesn't appear in the UI.

### Q: Can I use a different backend?

**A:** The template is built for the Andamio Gateway API. You can:

1. **Use Andamio's hosted gateway** (recommended) - Just change the URL
2. **Deploy your own Andamio backend** - See Andamio documentation
3. **Build a compatible API** - Implement the same endpoints (significant effort)

### Q: What about the @andamio/* packages?

**A:** These are npm packages implementing the Andamio protocol for Cardano. Keep them for Cardano compatibility or replace with your own implementations if you're building a different blockchain integration.

### Q: How do I change the font?

**A:** Edit `src/app/layout.tsx`:

```typescript
import { Your_Font } from "next/font/google";

const yourFont = Your_Font({
  subsets: ["latin"],
  variable: "--font-your-font",
});
```

Then update `globals.css` to use your font variable.

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
- Sidebar header
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
| `Andamio*` component names | Design system lineage |

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
- **GitHub Issues:** https://github.com/Andamio-Platform/andamio-t3-app-template/issues
- **Discord:** https://discord.gg/andamio
