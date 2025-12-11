"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
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
        name: "Components",
        href: "/components",
        icon: Palette,
        description: "UI showcase",
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
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4 sm:px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground flex-shrink-0">
          <Layers className="h-4 w-4" />
        </div>
        <Link href="/" className="flex flex-col min-w-0">
          <span className="text-base font-semibold text-sidebar-foreground truncate">Andamio</span>
          <span className="text-[10px] text-muted-foreground truncate">App Template</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-6">
          {navigationSections.map((section) => {
            // Hide auth-required sections when not authenticated
            if (section.requiresAuth && !isAuthenticated) {
              return null;
            }

            return (
              <div key={section.title} className="space-y-1">
                {/* Section Header */}
                <h3
                  className={cn(
                    "px-3 text-[10px] font-semibold uppercase tracking-wider",
                    section.muted
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground"
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
                          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 cursor-pointer select-none",
                          "active:scale-95",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                          section.muted && !isActive && "opacity-70"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4 flex-shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-sidebar-foreground"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <span
                            className={cn(
                              "block font-medium truncate",
                              isActive && "text-sidebar-foreground",
                              section.muted && !isActive && "font-normal"
                            )}
                          >
                            {item.name}
                          </span>
                          <span className="hidden sm:block text-[11px] text-muted-foreground truncate">
                            {item.description}
                          </span>
                        </div>
                        {isActive && (
                          <ChevronRight className="h-4 w-4 text-primary flex-shrink-0" />
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
      <div className="border-t border-sidebar-border p-3 sm:p-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            {/* Wallet Info */}
            <div className="rounded-lg bg-sidebar-accent/50 p-3">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                Connected Wallet
              </p>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse flex-shrink-0" />
                <code className="text-xs text-sidebar-foreground truncate break-all">
                  {user.cardanoBech32Addr?.slice(0, 8)}...{user.cardanoBech32Addr?.slice(-6)}
                </code>
              </div>
              {user.accessTokenAlias && (
                <div className="mt-2 pt-2 border-t border-sidebar-border">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    Token
                  </p>
                  <AndamioBadge variant="secondary" className="text-xs">
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
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
            >
              <LogOut className="mr-2 h-4 w-4 flex-shrink-0" />
              Disconnect
            </AndamioButton>
          </div>
        ) : (
          <div className="rounded-lg bg-sidebar-accent/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">
              Connect wallet to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
