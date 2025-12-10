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
  Sparkles,
  BookOpen,
  Map,
  Palette,
  FolderKanban,
  ChevronRight,
  Layers
} from "lucide-react";
import { cn } from "~/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview & status",
  },
  {
    name: "Browse Courses",
    href: "/course",
    icon: GraduationCap,
    description: "Explore catalog",
  },
  {
    name: "My Courses",
    href: "/courses",
    icon: BookOpen,
    description: "Your course library",
  },
  {
    name: "Browse Projects",
    href: "/project",
    icon: FolderKanban,
    description: "Find projects",
  },
  {
    name: "Studio",
    href: "/studio",
    icon: Sparkles,
    description: "Creator tools",
  },
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
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 cursor-pointer select-none",
                    "active:scale-95",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      "block font-medium truncate",
                      isActive && "text-sidebar-foreground"
                    )}>
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
