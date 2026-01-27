/**
 * Branding Configuration
 *
 * Centralizes app identity for easy customization.
 * Change these values to rebrand the template.
 *
 * @see docs/WHITE_LABEL_GUIDE.md for forking instructions
 */

import type { Metadata } from "next";

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

  /**
   * Documentation URLs for transaction help links.
   * Forkers can point these to their own docs or keep Andamio docs.
   */
  docs: {
    /** Base documentation URL */
    baseUrl: "https://docs.andamio.io",
    /** Transaction documentation paths */
    transactionPaths: {
      accessTokenMint:
        "/docs/protocol/v2/transactions/global/general/access-token/mint",
      courseCreate:
        "/docs/protocol/v2/transactions/instance/owner/course/create",
      projectCreate:
        "/docs/protocol/v2/transactions/instance/owner/project/create",
      teachersManage:
        "/docs/protocol/v2/transactions/course/owner/teachers/manage",
      modulesManage:
        "/docs/protocol/v2/transactions/course/teacher/modules/manage",
      assignmentsAssess:
        "/docs/protocol/v2/transactions/course/teacher/assignments/assess",
      assignmentCommit:
        "/docs/protocol/v2/transactions/course/student/assignment/commit",
      assignmentUpdate:
        "/docs/protocol/v2/transactions/course/student/assignment/update",
      credentialClaim:
        "/docs/protocol/v2/transactions/course/student/credential/claim",
      managersManage:
        "/docs/protocol/v2/transactions/project/owner/managers-manage",
      blacklistManage:
        "/docs/protocol/v2/transactions/project/owner/blacklist-manage",
      tasksManage:
        "/docs/protocol/v2/transactions/project/manager/tasks-manage",
      tasksAssess:
        "/docs/protocol/v2/transactions/project/manager/tasks-assess",
      taskCommit:
        "/docs/protocol/v2/transactions/project/contributor/task-commit",
      taskAction:
        "/docs/protocol/v2/transactions/project/contributor/task-action",
      contributorCredentialClaim:
        "/docs/protocol/v2/transactions/project/contributor/credential-claim",
      treasuryAddFunds:
        "/docs/protocol/v2/transactions/project/user/treasury/add-funds",
    },
  },
} as const;

/**
 * Get the full page title with app name suffix
 */
export function getPageTitle(pageTitle?: string): string {
  if (!pageTitle) return BRANDING.fullTitle;
  return `${pageTitle} | ${BRANDING.name}`;
}

/**
 * Get full URL for transaction documentation.
 * @param path - Key from BRANDING.docs.transactionPaths
 *
 * @example
 * getDocsUrl("accessTokenMint")
 * // => "https://docs.andamio.io/docs/protocol/v2/transactions/global/general/access-token/mint"
 */
export function getDocsUrl(
  path: keyof typeof BRANDING.docs.transactionPaths
): string {
  return `${BRANDING.docs.baseUrl}${BRANDING.docs.transactionPaths[path]}`;
}

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

export type Branding = typeof BRANDING;
