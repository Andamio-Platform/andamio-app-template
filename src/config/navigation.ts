/**
 * Navigation Configuration
 *
 * Centralized navigation structure for sidebar and mobile nav.
 * Import and use in layout components - do not define navigation inline.
 */

import {
  DashboardIcon,
  LearnerIcon,
  CourseIcon,
  ProjectIcon,
  EditIcon,
  SitemapIcon,
  ThemeIcon,
  KeyIcon,
} from "~/components/icons";
import type { NavSection } from "~/types/ui";

/**
 * Main sidebar navigation structure.
 *
 * Organized by user intent:
 * - Overview: Personal hub (Dashboard)
 * - Discover: Public browsing for Learners & Contributors
 * - Studio: Creator tools for managing owned courses & projects
 * - Dev Tools: Development utilities (muted styling)
 */
export const SIDEBAR_NAVIGATION: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: DashboardIcon,
        description: "Your personal hub",
      },
    ],
  },
  {
    title: "Discover",
    items: [
      {
        name: "Browse Courses",
        href: "/course",
        icon: LearnerIcon,
        description: "Learn new skills",
      },
      {
        name: "Browse Projects",
        href: "/project",
        icon: ProjectIcon,
        description: "Find opportunities",
      },
    ],
  },
  {
    title: "Studio",
    requiresAuth: true,
    items: [
      {
        name: "Course Studio",
        href: "/studio/course",
        icon: CourseIcon,
        description: "Manage your courses",
      },
      {
        name: "Project Studio",
        href: "/studio/project",
        icon: EditIcon,
        description: "Manage your projects",
      },
    ],
  },
  {
    title: "Dev Tools",
    muted: true,
    items: [
      {
        name: "API Setup",
        href: "/api-setup",
        icon: KeyIcon,
        description: "Gateway registration",
      },
      {
        name: "Component Library",
        href: "/components",
        icon: ThemeIcon,
        description: "Andamio UI reference",
      },
      {
        name: "Sitemap",
        href: "/sitemap",
        icon: SitemapIcon,
        description: "All routes",
      },
    ],
  },
];

/**
 * Get navigation sections filtered by authentication state.
 */
export function getNavigationSections(isAuthenticated: boolean): NavSection[] {
  return SIDEBAR_NAVIGATION.filter(
    (section) => !section.requiresAuth || isAuthenticated
  );
}

/**
 * Get all navigation items as a flat array.
 */
export function getAllNavigationItems() {
  return SIDEBAR_NAVIGATION.flatMap((section) => section.items);
}

/**
 * Find navigation item by href.
 */
export function findNavigationItem(href: string) {
  return getAllNavigationItems().find((item) => item.href === href);
}

/**
 * Check if a path is active (exact match or starts with href/).
 */
export function isNavItemActive(pathname: string, itemHref: string): boolean {
  return pathname === itemHref || pathname.startsWith(itemHref + "/");
}
