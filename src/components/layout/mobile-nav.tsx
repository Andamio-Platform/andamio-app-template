"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "~/components/ui/sheet";
import {
  DashboardIcon,
  LearnerIcon,
  SparkleIcon,
  CourseIcon,
  ProjectIcon,
  NextIcon,
  ModuleIcon,
  MenuIcon,
  LogOutIcon,
  SitemapIcon,
  ThemeIcon,
} from "~/components/icons";
import { cn } from "~/lib/utils";
import type { NavItem } from "~/types/ui";

const navigation: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: DashboardIcon,
    description: "Overview & status",
  },
  {
    name: "Browse Courses",
    href: "/course",
    icon: LearnerIcon,
    description: "Explore catalog",
  },
  {
    name: "Course Studio",
    href: "/studio/course",
    icon: CourseIcon,
    description: "Manage your courses",
  },
  {
    name: "Browse Projects",
    href: "/project",
    icon: ProjectIcon,
    description: "Find projects",
  },
  {
    name: "Studio",
    href: "/studio",
    icon: SparkleIcon,
    description: "Creator tools",
  },
  {
    name: "Components",
    href: "/components",
    icon: ThemeIcon,
    description: "UI showcase",
  },
  {
    name: "Sitemap",
    href: "/sitemap",
    icon: SitemapIcon,
    description: "All routes",
  },
];

/**
 * MobileNav - Mobile navigation drawer for small screens (< md)
 * Displays as hamburger menu in status bar
 */
export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAndamioAuth();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <AndamioButton
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground md:hidden"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="h-4 w-4" />
        </AndamioButton>
      </SheetTrigger>

      <SheetContent side="left" className="flex flex-col gap-0 p-0">
        {/* Header with branding */}
        <SheetHeader className="border-b border-border gap-0 py-4">
          <div className="flex items-center gap-3 px-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ModuleIcon className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <SheetTitle>Andamio</SheetTitle>
              <span className="text-[10px] text-muted-foreground">App Template</span>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;

              return (
                <SheetClose asChild key={item.href}>
                  <Link href={item.href}>
                    <div
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
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
                        <span
                          className={cn(
                            "block font-medium truncate",
                            isActive && "text-sidebar-foreground"
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="block text-[11px] text-muted-foreground truncate">
                          {item.description}
                        </span>
                      </div>
                      {isActive && <NextIcon className="h-4 w-4 text-primary flex-shrink-0" />}
                    </div>
                  </Link>
                </SheetClose>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        <SheetFooter className="border-t border-border gap-3 px-4 py-4">
          {isAuthenticated && user ? (
            <>
              {/* Wallet Info */}
              <div className="rounded-lg bg-sidebar-accent/50 p-3 w-full">
                <AndamioText variant="overline" className="text-[10px] mb-1.5">
                  Connected Wallet
                </AndamioText>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse flex-shrink-0" />
                  <code className="text-xs text-sidebar-foreground truncate">
                    {user.cardanoBech32Addr?.slice(0, 8)}...{user.cardanoBech32Addr?.slice(-6)}
                  </code>
                </div>
                {user.accessTokenAlias && (
                  <div className="mt-2 pt-2 border-t border-sidebar-border">
                    <AndamioText variant="overline" className="text-[10px] mb-1">
                      Token
                    </AndamioText>
                    <AndamioBadge variant="secondary" className="text-[10px]">
                      {user.accessTokenAlias}
                    </AndamioBadge>
                  </div>
                )}
              </div>

              {/* Disconnect Button */}
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOutIcon className="mr-2 h-4 w-4" />
                Disconnect
              </AndamioButton>
            </>
          ) : (
            <div className="rounded-lg bg-sidebar-accent/50 p-3 text-center w-full">
              <AndamioText variant="small" className="text-xs">
                Connect wallet to get started
              </AndamioText>
            </div>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
