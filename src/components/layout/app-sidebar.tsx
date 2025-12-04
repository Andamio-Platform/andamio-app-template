"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { LayoutDashboard, LogOut, GraduationCap, Sparkles, BookOpen, Map, Palette, FolderKanban } from "lucide-react";
import { cn } from "~/lib/utils";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Browse Courses",
    href: "/course",
    icon: GraduationCap,
  },
  {
    name: "My Courses",
    href: "/courses",
    icon: BookOpen,
  },
  {
    name: "Browse Projects",
    href: "/project",
    icon: FolderKanban,
  },
  {
    name: "Studio",
    href: "/studio",
    icon: Sparkles,
  },
  {
    name: "Components",
    href: "/components",
    icon: Palette,
  },
  {
    name: "Sitemap",
    href: "/sitemap",
    icon: Map,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAndamioAuth();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-background">
      {/* Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/">
          <h1 className="text-xl font-semibold">Andamio</h1>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <AndamioButton
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.name}
              </AndamioButton>
            </Link>
          );
        })}
      </nav>

      <AndamioSeparator />

      {/* User Section */}
      <div className="p-4">
        {isAuthenticated && user ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Connected Wallet
              </p>
              <AndamioBadge variant="outline" className="font-mono text-xs">
                {user.cardanoBech32Addr?.slice(0, 12)}...
              </AndamioBadge>
            </div>
            <AndamioButton
              variant="outline"
              size="sm"
              onClick={logout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </AndamioButton>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Not connected</p>
          </div>
        )}
      </div>
    </div>
  );
}
