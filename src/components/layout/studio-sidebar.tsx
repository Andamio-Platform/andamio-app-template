"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  ModuleIcon,
  CourseIcon,
  ProjectIcon,
  NextIcon,
  BackIcon,
  DashboardIcon,
  TeacherIcon,
  TaskIcon,
} from "~/components/icons";
import { cn } from "~/lib/utils";
import type { NavItem } from "~/types/ui";

/**
 * Context-aware sidebar for Studio routes
 *
 * Shows different navigation based on current route:
 * - /studio/course - Course list overview
 * - /studio/course/[id] - Course editing context
 * - /studio/project - Project list overview
 * - /studio/project/[id] - Project editing context
 */
export function StudioSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAndamioAuth();

  // Parse the current route to determine context
  const segments = pathname.split("/").filter(Boolean);
  const studioType = segments[1]; // "course" or "project"
  const entityId = segments[2]; // courseNftPolicyId or projectId

  // Determine navigation based on context
  const getNavigation = (): { title: string; backLink?: { href: string; label: string }; items: NavItem[] } => {
    // Course Studio with specific course selected
    if (studioType === "course" && entityId) {
      return {
        title: "Course Editor",
        backLink: { href: "/studio/course", label: "All Courses" },
        items: [
          {
            name: "Course Overview",
            href: `/studio/course/${entityId}`,
            icon: CourseIcon,
            description: "Course details & modules",
          },
          {
            name: "Instructor Dashboard",
            href: `/studio/course/${entityId}/instructor`,
            icon: TeacherIcon,
            description: "Manage learners",
          },
        ],
      };
    }

    // Project Studio with specific project selected
    if (studioType === "project" && entityId) {
      return {
        title: "Project Editor",
        backLink: { href: "/studio/project", label: "All Projects" },
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
      };
    }

    // Default: Studio home navigation
    return {
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
    };
  };

  const navigation = getNavigation();

  return (
    <div className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand Header */}
      <div className="flex h-12 items-center gap-2.5 border-b border-sidebar-border px-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground flex-shrink-0">
          <ModuleIcon className="h-3.5 w-3.5" />
        </div>
        <Link href="/dashboard" className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-sidebar-foreground truncate">Andamio</span>
          <span className="text-[9px] text-muted-foreground truncate leading-tight">Studio</span>
        </Link>
      </div>

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
        <div className="space-y-4">
          <div className="space-y-0.5">
            {/* Section Header */}
            <h3 className="px-2 text-[9px] font-medium uppercase tracking-wider mb-1 text-muted-foreground/70">
              {navigation.title}
            </h3>

            {/* Section Items */}
            {navigation.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/studio/course" && item.href !== "/studio/project" && pathname.startsWith(item.href + "/"));
              const Icon = item.icon;

              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      "group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer select-none",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-sidebar-foreground"
                      )}
                    />
                    <span
                      className={cn(
                        "truncate",
                        isActive && "font-medium text-sidebar-foreground"
                      )}
                    >
                      {item.name}
                    </span>
                    {isActive && (
                      <NextIcon className="h-3 w-3 text-primary flex-shrink-0 ml-auto" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="space-y-0.5">
            <h3 className="px-2 text-[9px] font-medium uppercase tracking-wider mb-1 text-muted-foreground/50">
              Quick Access
            </h3>
            <Link href="/dashboard">
              <div className="group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer select-none text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground opacity-60">
                <DashboardIcon className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground group-hover:text-sidebar-foreground" />
                <span className="truncate">Dashboard</span>
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-2">
        {isAuthenticated && user ? (
          <div className="rounded-md bg-sidebar-accent/50 p-2 space-y-1.5">
            {/* Access Token Name - emphasized */}
            {user.accessTokenAlias && (
              <div className="font-semibold text-sm text-sidebar-foreground truncate">
                {user.accessTokenAlias}
              </div>
            )}
            {/* Wallet Address */}
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
              <span className="text-[10px] font-mono text-muted-foreground truncate">
                {user.cardanoBech32Addr?.slice(0, 8)}...{user.cardanoBech32Addr?.slice(-4)}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-sidebar-accent/50 p-2 text-center">
            <AndamioText variant="small" className="text-[10px]">
              Connect wallet to start
            </AndamioText>
          </div>
        )}
      </div>
    </div>
  );
}
