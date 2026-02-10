"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  CourseIcon,
  ProjectIcon,
  BackIcon,
  DashboardIcon,
  TeacherIcon,
  TaskIcon,
} from "~/components/icons";
import { SIDEBAR_LAYOUT } from "~/config";
import { cn } from "~/lib/utils";
import type { NavSection } from "~/types/ui";
import { SidebarHeader } from "./sidebar-header";
import { SidebarNavList } from "./sidebar-nav-section";
import { SidebarUserSection } from "./sidebar-user-section";

/**
 * Context-aware sidebar for Studio routes.
 *
 * Shows different navigation based on current route:
 * - /studio/course - Course list overview
 * - /studio/course/[id] - Course editing context
 * - /studio/project - Project list overview
 * - /studio/project/[id] - Project editing context
 *
 * Uses shared sidebar components for consistency with AppSidebar and MobileNav.
 */
export function StudioSidebar() {
  const pathname = usePathname();

  // Parse the current route to determine context
  const segments = pathname.split("/").filter(Boolean);
  const studioType = segments[1]; // "course" or "project"
  const entityId = segments[2]; // courseId or projectId

  // Determine navigation based on context
  const getNavigation = (): {
    sections: NavSection[];
    backLink?: { href: string; label: string };
  } => {
    // Course Studio with specific course selected
    if (studioType === "course" && entityId) {
      return {
        backLink: { href: "/studio/course", label: "All Courses" },
        sections: [
          {
            title: "Course Editor",
            items: [
              {
                name: "Course Overview",
                href: `/studio/course/${entityId}`,
                icon: CourseIcon,
                description: "Course details & modules",
              },
              {
                name: "Teacher Dashboard",
                href: `/studio/course/${entityId}/teacher`,
                icon: TeacherIcon,
                description: "Manage learners",
              },
            ],
          },
        ],
      };
    }

    // Project Studio with specific project selected
    if (studioType === "project" && entityId) {
      return {
        backLink: { href: "/studio", label: "All Projects" },
        sections: [
          {
            title: "Project Editor",
            items: [
              {
                name: "Project Overview",
                href: `/studio/project/${entityId}`,
                icon: ProjectIcon,
                description: "Project details",
              },
              {
                name: "Draft Tasks",
                href: `/studio/project/${entityId}/draft-tasks`,
                icon: TaskIcon,
                description: "Manage tasks",
              },
            ],
          },
        ],
      };
    }

    // Default: Studio home navigation
    return {
      sections: [
        {
          title: "Studio",
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
              icon: ProjectIcon,
              description: "Manage your projects",
            },
          ],
        },
      ],
    };
  };

  const navigation = getNavigation();

  // Quick access section (always shown)
  const quickAccessSection: NavSection = {
    title: "Quick Access",
    muted: true,
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: DashboardIcon,
        description: "Return to dashboard",
      },
    ],
  };

  // Custom active check for studio routes
  const isItemActive = (path: string, href: string): boolean => {
    // Exact match
    if (path === href) return true;
    // Don't match parent routes for studio overview pages
    if (href === "/studio/course" || href === "/studio/project") return false;
    // Prefix match for nested routes
    return path.startsWith(href + "/");
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        SIDEBAR_LAYOUT.width
      )}
    >
      {/* Brand Header */}
      <SidebarHeader variant="studio" subtitle="Studio" />

      {/* Back Link (when in context) */}
      {navigation.backLink && (
        <div className="border-b border-sidebar-border px-2 py-2">
          <Link href={navigation.backLink.href}>
            <AndamioButton
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs text-muted-foreground hover:text-foreground h-7 px-2"
            >
              <BackIcon className="h-3 w-3 mr-1.5" />
              {navigation.backLink.label}
            </AndamioButton>
          </Link>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarNavList
          sections={[...navigation.sections, quickAccessSection]}
          pathname={pathname}
          variant="desktop"
          isItemActive={isItemActive}
        />
      </nav>

      {/* User Section - now includes Disconnect button */}
      <SidebarUserSection variant="compact" showDisconnect />
    </div>
  );
}
