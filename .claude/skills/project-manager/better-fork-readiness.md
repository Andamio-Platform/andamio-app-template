# Better Fork Readiness — Implementation Plan

> **Goal:** Make this template 95%+ white-label ready while maintaining value as Andamio reference
> **Estimated Effort:** 4-6 hours total
> **Priority:** Medium (improves developer experience for forks)
> **Created:** 2026-01-25

---

## Overview

This plan addresses 9 identified gaps that make forking harder than necessary. The template is already 80% white-label ready with centralized `BRANDING` config. These improvements complete the story.

```
┌─────────────────────────────────────────────────────────────────┐
│  CURRENT STATE (80% Ready)                                      │
├─────────────────────────────────────────────────────────────────┤
│  ✅ Centralized BRANDING config                                 │
│  ✅ Semantic color system in CSS variables                      │
│  ✅ Feature flags system                                        │
│  ✅ Configurable navigation                                     │
│  ❌ Hardcoded metadata in layout.tsx                            │
│  ❌ Hardcoded marketing copy in page.tsx                        │
│  ❌ Hardcoded docs URLs in transaction-ui.ts                    │
│  ❌ Missing helper functions                                    │
│  ❌ No white-label documentation                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  TARGET STATE (95%+ Ready)                                      │
├─────────────────────────────────────────────────────────────────┤
│  ✅ All branding flows from BRANDING config                     │
│  ✅ Marketing copy in separate MARKETING config                 │
│  ✅ Docs URLs parameterized with helper                         │
│  ✅ getPageMetadata() helper for consistent SEO                 │
│  ✅ WHITE_LABEL_GUIDE.md for forkers                            │
│  ✅ OG image placeholder created                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Gap Summary

| # | Gap | Severity | Phase | Effort |
|---|-----|----------|-------|--------|
| 1 | Root layout metadata hardcoded | 🔴 Critical | 1 | 15 min |
| 2 | Landing page marketing copy hardcoded | 🔴 Critical | 1 | 1.5 hr |
| 3 | Welcome hero greeting hardcoded | 🟡 Medium | 1 | 5 min |
| 4 | Transaction docs URLs hardcoded (17) | 🟡 Medium | 2 | 1 hr |
| 5 | Missing getPageMetadata() helper | 🟡 Medium | 2 | 20 min |
| 6 | Missing OG image file | 🟢 Low | 3 | 30 min |
| 7 | No white-label documentation | 🟢 Low | 3 | 45 min |
| 8 | Navigation description hardcoded | 🟢 Low | 3 | 5 min |
| 9 | Console log messages hardcoded | 🟢 Low | 3 | 10 min |

---

## Implementation Phases

### Phase 1: Critical Fixes (2 hours)

Fix the gaps that most impact fork experience.

#### Task 1.1: Create Marketing Config

**File:** `src/config/marketing.ts` (NEW)

```typescript
import { BRANDING } from "./branding";

/**
 * Marketing copy for landing pages and promotional content.
 * Separate from BRANDING to keep identity vs. messaging distinct.
 */
export const MARKETING = {
  /**
   * Hero section on landing page
   */
  hero: {
    badge: `${BRANDING.name} Pioneer Preview`,
    title: "Build the Future of Learning",
    subtitle: `Help us build ${BRANDING.name} V2. Join the pioneers shaping decentralized education.`,
    primaryCta: {
      text: "Get Started",
      href: "/dashboard",
    },
    secondaryCta: {
      text: "Learn More",
      href: `${BRANDING.links.docs}/pioneers`,
    },
  },

  /**
   * Pioneer program callout
   */
  pioneers: {
    title: `Join the ${BRANDING.name} Pioneers Program`,
    description: "Get early access, provide feedback, and help shape the future of decentralized learning.",
    linkText: "Learn about the Pioneers Program",
    linkHref: `${BRANDING.links.docs}/pioneers`,
  },

  /**
   * Features/value propositions
   */
  features: {
    title: "Why Build With Us",
    items: [
      {
        title: "Decentralized",
        description: "Built on Cardano blockchain for true ownership and transparency.",
      },
      {
        title: "Verifiable Credentials",
        description: "Issue NFT-based certificates that prove skills on-chain.",
      },
      {
        title: "Open Protocol",
        description: "Interoperable with the broader Cardano ecosystem.",
      },
    ],
  },

  /**
   * Footer content
   */
  footer: {
    copyright: `© ${new Date().getFullYear()} ${BRANDING.name}. All rights reserved.`,
    tagline: "Built on Cardano",
    visitSite: {
      text: `Visit ${BRANDING.links.website.replace("https://", "")}`,
      href: BRANDING.links.website,
    },
  },
} as const;

export type Marketing = typeof MARKETING;
```

**Update:** `src/config/index.ts`

```typescript
// Add export
export { MARKETING } from "./marketing";
export type { Marketing } from "./marketing";
```

---

#### Task 1.2: Update Layout Metadata

**File:** `src/app/layout.tsx`

**Before:**
```typescript
export const metadata: Metadata = {
  title: "Andamio T3 App Template",
  description: "Reference template for building Andamio apps using the T3 stack.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};
```

**After:**
```typescript
import { BRANDING } from "~/config";

export const metadata: Metadata = {
  title: BRANDING.fullTitle,
  description: BRANDING.description,
  icons: [{ rel: "icon", url: BRANDING.logo.favicon }],
  openGraph: {
    title: BRANDING.fullTitle,
    description: BRANDING.description,
    images: [BRANDING.logo.ogImage],
    siteName: BRANDING.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: BRANDING.fullTitle,
    description: BRANDING.description,
    images: [BRANDING.logo.ogImage],
  },
  metadataBase: new URL(BRANDING.links.website),
};
```

---

#### Task 1.3: Update Landing Page

**File:** `src/app/page.tsx`

Replace all hardcoded marketing copy with MARKETING config imports.

**Key replacements:**

| Line | Current | Replace With |
|------|---------|--------------|
| ~32 | `"Andamio Pioneers Preview"` | `MARKETING.hero.badge` |
| ~36 | `"Help us build Andamio V2."` | `MARKETING.hero.subtitle` |
| ~55 | `href="https://docs.andamio.io/docs/pioneers"` | `MARKETING.pioneers.linkHref` |
| ~156 | `"Join the Andamio Pioneers Program"` | `MARKETING.pioneers.title` |
| ~219 | `"Andamio Pioneer Preview"` | `MARKETING.hero.badge` |
| ~230 | `href="https://andamio.io"` | `MARKETING.footer.visitSite.href` |

**Pattern:**
```typescript
import { MARKETING } from "~/config";

// In JSX:
<span className="font-semibold">{MARKETING.hero.badge}</span>
<p>{MARKETING.hero.subtitle}</p>
<Link href={MARKETING.pioneers.linkHref}>{MARKETING.pioneers.linkText}</Link>
```

---

#### Task 1.4: Update Welcome Hero

**File:** `src/components/dashboard/welcome-hero.tsx`

**Before:**
```typescript
<h1 className="text-2xl font-bold">Welcome to Andamio</h1>
```

**After:**
```typescript
import { BRANDING } from "~/config";

<h1 className="text-2xl font-bold">Welcome to {BRANDING.name}</h1>
```

---

### Phase 2: Recommended Fixes (2 hours)

Improve developer experience with helpers and parameterized URLs.

#### Task 2.1: Add Docs Configuration to Branding

**File:** `src/config/branding.ts`

Add docs section:

```typescript
export const BRANDING = {
  // ... existing fields ...

  /**
   * Documentation URLs for transaction help links.
   * Forkers can point these to their own docs or keep Andamio docs.
   */
  docs: {
    baseUrl: "https://docs.andamio.io",
    transactionPaths: {
      accessTokenMint: "/docs/protocol/v2/transactions/global/general/access-token/mint",
      courseCreate: "/docs/protocol/v2/transactions/instance/owner/course/create",
      projectCreate: "/docs/protocol/v2/transactions/instance/owner/project/create",
      teachersManage: "/docs/protocol/v2/transactions/course/owner/teachers/manage",
      modulesManage: "/docs/protocol/v2/transactions/course/teacher/modules/manage",
      assignmentsAssess: "/docs/protocol/v2/transactions/course/teacher/assignments/assess",
      assignmentCommit: "/docs/protocol/v2/transactions/course/student/assignment/commit",
      assignmentUpdate: "/docs/protocol/v2/transactions/course/student/assignment/update",
      credentialClaim: "/docs/protocol/v2/transactions/course/student/credential/claim",
      managersManage: "/docs/protocol/v2/transactions/project/owner/managers-manage",
      blacklistManage: "/docs/protocol/v2/transactions/project/owner/blacklist-manage",
      tasksManage: "/docs/protocol/v2/transactions/project/manager/tasks-manage",
      tasksAssess: "/docs/protocol/v2/transactions/project/manager/tasks-assess",
      taskCommit: "/docs/protocol/v2/transactions/project/contributor/task-commit",
      taskAction: "/docs/protocol/v2/transactions/project/contributor/task-action",
      contributorCredentialClaim: "/docs/protocol/v2/transactions/project/contributor/credential-claim",
      treasuryAddFunds: "/docs/protocol/v2/transactions/project/user/treasury/add-funds",
    },
  },
} as const;

/**
 * Get full URL for transaction documentation.
 * @param path - Key from BRANDING.docs.transactionPaths
 */
export function getDocsUrl(
  path: keyof typeof BRANDING.docs.transactionPaths
): string {
  return `${BRANDING.docs.baseUrl}${BRANDING.docs.transactionPaths[path]}`;
}
```

---

#### Task 2.2: Update Transaction UI to Use Helper

**File:** `src/config/transaction-ui.ts`

**Before:**
```typescript
learnMoreUrl: "https://docs.andamio.io/docs/protocol/v2/transactions/global/general/access-token/mint",
```

**After:**
```typescript
import { getDocsUrl } from "./branding";

learnMoreUrl: getDocsUrl("accessTokenMint"),
```

Apply to all 17 transaction types.

---

#### Task 2.3: Add Page Metadata Helper

**File:** `src/config/branding.ts`

Add helper function:

```typescript
import type { Metadata } from "next";

/**
 * Generate consistent page metadata with brand styling.
 * Use this in page.tsx files for SEO consistency.
 *
 * @example
 * // In src/app/(app)/courses/page.tsx
 * export const metadata = getPageMetadata("Courses", "Browse available courses");
 */
export function getPageMetadata(
  title?: string,
  description?: string
): Metadata {
  const pageTitle = getPageTitle(title);
  const pageDescription = description ?? BRANDING.description;

  return {
    title: pageTitle,
    description: pageDescription,
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      images: [BRANDING.logo.ogImage],
      siteName: BRANDING.name,
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description: pageDescription,
      images: [BRANDING.logo.ogImage],
    },
  };
}
```

---

### Phase 3: Nice to Have (1 hour)

Polish and documentation.

#### Task 3.1: Create OG Image Placeholder

**File:** `public/og-image.png`

Create a 1200x630 PNG with:
- App name (from branding)
- Tagline
- Simple branded background

For initial implementation, can use a solid color with text overlay or a design tool export.

**Alternative:** Use a dynamic OG image route:
- `src/app/api/og/route.tsx` using `@vercel/og`

---

#### Task 3.2: Create White-Label Guide

**File:** `docs/WHITE_LABEL_GUIDE.md`

```markdown
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
  // ... update all fields
};
```

### Step 2: Update Marketing Copy

Edit `src/config/marketing.ts`:

- Update hero section text
- Update feature descriptions
- Update footer content

### Step 3: Replace Assets

- Replace `public/favicon.ico` with your favicon
- Replace `public/og-image.png` with your social share image

### Step 4: Update Colors

Edit `src/styles/globals.css`:

```css
:root {
  --primary: oklch(0.55 0.18 YOUR_HUE);
  --success: oklch(0.52 0.15 YOUR_HUE);
  /* ... update semantic colors */
}
```

### Step 5: Update Environment

Copy `.env.example` to `.env.local` and configure:

- API gateway URL
- Cardano network
- Policy IDs

## Complete Checklist

### Must Change
- [ ] `src/config/branding.ts` - App identity
- [ ] `src/config/marketing.ts` - Landing page copy
- [ ] `public/favicon.ico` - Site icon
- [ ] `.env.local` - API configuration

### Should Change
- [ ] `src/styles/globals.css` - Color palette
- [ ] `public/og-image.png` - Social sharing image
- [ ] `src/config/navigation.ts` - Sidebar structure

### Consider Changing
- [ ] `src/config/features.ts` - Enable/disable features
- [ ] Font in `globals.css` - Typography
- [ ] Component names (Andamio* → YourBrand*)

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

### Color Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `--primary` | Buttons, links, active states | Sky blue |
| `--success` | Success messages, completed | Green |
| `--warning` | Warnings, pending states | Yellow |
| `--destructive` | Errors, delete actions | Red |
| `--muted` | Disabled, secondary text | Gray |

## FAQ

**Q: Do I need to rename Andamio* components?**
A: No, these are semantic names for the design system. You can keep them or rename if doing a complete rebrand.

**Q: Can I use a different backend?**
A: The template is built for the Andamio Gateway API. You can:
1. Use Andamio's hosted gateway (recommended)
2. Deploy your own Andamio backend
3. Build a compatible API (significant effort)

**Q: What about the @andamio/* packages?**
A: These are npm packages implementing the Andamio protocol. Keep them for Cardano compatibility or replace with your own implementations.
```

---

#### Task 3.3: Update Navigation Description

**File:** `src/config/navigation.ts`

**Before:**
```typescript
description: "Andamio UI reference",
```

**After:**
```typescript
description: "UI component reference",
// Or use BRANDING:
description: `${BRANDING.name} UI reference`,
```

---

#### Task 3.4: Update Console Log Messages (Optional)

**File:** `src/contexts/andamio-auth-context.tsx`

**Before:**
```typescript
console.group("🔐 Andamio Authentication Successful");
```

**After:**
```typescript
console.group(`🔐 ${BRANDING.name} Authentication Successful`);
```

---

## Verification Checklist

After implementing all phases, verify:

### Build & Types
- [ ] `npm run build` succeeds
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

### Branding Flow
- [ ] Change `BRANDING.name` → sidebar updates
- [ ] Change `BRANDING.fullTitle` → browser tab updates
- [ ] Change `BRANDING.description` → SEO meta updates
- [ ] Change `BRANDING.links.docs` → "Learn More" links update

### Marketing Flow
- [ ] Change `MARKETING.hero.badge` → landing page updates
- [ ] Change `MARKETING.pioneers.title` → callout updates

### Visual Check
- [ ] Landing page shows no hardcoded "Andamio" in user-facing text
- [ ] Dashboard welcome shows dynamic name
- [ ] OG image loads in social share preview

---

## Files Summary

### Files to Create

| File | Purpose |
|------|---------|
| `src/config/marketing.ts` | Landing page marketing copy |
| `docs/WHITE_LABEL_GUIDE.md` | Fork instructions |
| `public/og-image.png` | Social sharing image |

### Files to Modify

| File | Changes |
|------|---------|
| `src/config/branding.ts` | Add `docs` section, `getDocsUrl()`, `getPageMetadata()` |
| `src/config/index.ts` | Export MARKETING |
| `src/config/transaction-ui.ts` | Use `getDocsUrl()` helper (17 replacements) |
| `src/config/navigation.ts` | Use BRANDING in description |
| `src/app/layout.tsx` | Use BRANDING for metadata |
| `src/app/page.tsx` | Use MARKETING for all copy |
| `src/components/dashboard/welcome-hero.tsx` | Use BRANDING.name |
| `src/contexts/andamio-auth-context.tsx` | Use BRANDING in console logs (optional) |

---

## What Stays Hardcoded (By Design)

These items should NOT be made configurable:

| Item | Reason |
|------|--------|
| `@andamio/*` imports | Real npm packages for protocol compatibility |
| Protocol doc comments | Developer reference for understanding code |
| Generated type names | Auto-generated from API spec |
| Andamioscan links | Protocol-specific blockchain explorer |
| `Andamio*` component names | Design system lineage (can be renamed for full rebrand) |

---

## Success Criteria

The implementation is complete when:

1. **Single source of truth:** Changing `BRANDING.name` updates ALL visible UI
2. **Separated concerns:** Identity (BRANDING) vs. messaging (MARKETING) are distinct
3. **Helper functions:** `getPageMetadata()` and `getDocsUrl()` simplify common patterns
4. **Documentation:** `WHITE_LABEL_GUIDE.md` enables self-service forking
5. **No regression:** All existing functionality works after changes

---

## Related Documents

- `.claude/specs/white-label-gaps.md` - Detailed gap analysis with code snippets
- `.claude/specs/template-report.md` - Overall template assessment
- `docs/WHITE_LABEL_GUIDE.md` - User-facing fork documentation (to be created)
