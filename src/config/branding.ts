/**
 * Branding Configuration
 *
 * Centralizes app identity for easy customization.
 * Change these values to rebrand the template.
 */

export const BRANDING = {
  /** App name displayed in header, title, etc. */
  name: "Andamio",

  /** Secondary text (e.g., "App Template", "Platform", etc.) */
  tagline: "App Template",

  /** Full app title for page titles */
  fullTitle: "Andamio App Template",

  /** Short description for meta tags */
  description: "A complete Cardano dApp starter with courses and projects",

  /** Longer description for landing pages */
  longDescription:
    "Build and deploy Cardano-powered learning platforms and project management systems with the Andamio T3 App Template.",

  /** URL paths for logos/icons */
  logo: {
    /** Icon used in sidebar header (reference to icon component) */
    icon: "ModuleIcon",
    /** Favicon path */
    favicon: "/favicon.ico",
    /** OG image for social sharing */
    ogImage: "/og-image.png",
  },

  /** External links */
  links: {
    /** Main website */
    website: "https://andamio.io",
    /** Documentation */
    docs: "https://docs.andamio.io",
    /** GitHub repository */
    github: "https://github.com/Andamio-Platform",
    /** Twitter/X handle */
    twitter: "https://twitter.com/AndamioPlatform",
  },

  /** Support/contact info */
  support: {
    /** Support email */
    email: "support@andamio.io",
  },
} as const;

/**
 * Get the full page title with app name suffix
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return BRANDING.fullTitle;
  return `${pageTitle} | ${BRANDING.name}`;
}

export type Branding = typeof BRANDING;
