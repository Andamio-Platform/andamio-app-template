"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  LayoutDashboard,
  LogOut,
  GraduationCap,
  BookOpen,
  Map,
  Palette,
  FolderKanban,
  ChevronRight,
  Layers,
  PenTool,
} from "lucide-react";
import { cn } from "~/lib/utils";
import type { NavSection } from "~/types/ui";

/**
 * Navigation structure organized by user intent:
 *
 * - Overview: Personal hub (Dashboard)
 * - Discover: Public browsing for Learners & Contributors
 * - Studio: Creator tools for managing owned courses & projects
 * - Dev Tools: Development utilities (muted styling)
 */
const navigationSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
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
        icon: GraduationCap,
        description: "Learn new skills",
      },
      {
        name: "Browse Projects",
        href: "/project",
        icon: FolderKanban,
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
        icon: BookOpen,
        description: "Manage your courses",
      },
      {
        name: "Project Studio",
        href: "/studio/project",
        icon: PenTool,
        description: "Manage your projects",
      },
    ],
  },
  {
    title: "Dev Tools",
    muted: true,
    items: [
      {
        name: "Component Library",
        href: "/components",
        icon: Palette,
        description: "Andamio UI reference",
      },
      {
        name: "Sitemap",
        href: "/sitemap",
        icon: Map,
        description: "All routes",
      },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAndamioAuth();

  return (
    <div className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand Header */}
      <div className="flex h-12 items-center gap-2.5 border-b border-sidebar-border px-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground flex-shrink-0">
          <Layers className="h-3.5 w-3.5" />
        </div>
        <Link href="/" className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-sidebar-foreground truncate">Andamio</span>
          <span className="text-[9px] text-muted-foreground truncate leading-tight">App Template</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-4">
          {navigationSections.map((section) => {
            // Hide auth-required sections when not authenticated
            if (section.requiresAuth && !isAuthenticated) {
              return null;
            }

            return (
              <div key={section.title} className="space-y-0.5">
                {/* Section Header */}
                <h3
                  className={cn(
                    "px-2 text-[9px] font-medium uppercase tracking-wider mb-1",
                    section.muted
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground/70"
                  )}
                >
                  {section.title}
                </h3>

                {/* Section Items */}
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link key={item.href} href={item.href}>
                      <div
                        className={cn(
                          "group flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors cursor-pointer select-none",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          section.muted && !isActive && "opacity-60"
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
                            isActive && "font-medium text-sidebar-foreground",
                            section.muted && !isActive && "font-normal"
                          )}
                        >
                          {item.name}
                        </span>
                        {isActive && (
                          <ChevronRight className="h-3 w-3 text-primary flex-shrink-0 ml-auto" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-2">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            {/* Wallet Info */}
            <div className="rounded-md bg-sidebar-accent/50 p-2">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse flex-shrink-0" />
                <code className="text-[10px] text-sidebar-foreground truncate">
                  {user.cardanoBech32Addr?.slice(0, 8)}...{user.cardanoBech32Addr?.slice(-4)}
                </code>
              </div>
              {user.accessTokenAlias && (
                <div className="mt-1.5 pt-1.5 border-t border-sidebar-border">
                  <AndamioBadge variant="secondary" className="text-[10px] h-5">
                    {user.accessTokenAlias}
                  </AndamioBadge>
                </div>
              )}
            </div>

            {/* Disconnect Button */}
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[11px] h-7 px-2"
            >
              <LogOut className="mr-1.5 h-3 w-3 flex-shrink-0" />
              Disconnect
            </AndamioButton>
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
