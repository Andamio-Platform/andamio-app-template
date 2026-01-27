"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { NextIcon, LogOutIcon } from "~/components/icons";
import { cn } from "~/lib/utils";
import {
  getNavigationSections,
  isNavItemActive,
  BRANDING,
} from "~/config";

export function AppSidebar() {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAndamioAuth();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - theme is undefined on server
  useEffect(() => {
    setMounted(true);
  }, []);

  // Get navigation sections filtered by auth state
  const navigationSections = getNavigationSections(isAuthenticated);

  // Select logo based on theme (default to light for SSR)
  const logoSrc = mounted && resolvedTheme === "dark"
    ? BRANDING.logo.horizontalDark
    : BRANDING.logo.horizontal;

  return (
    <div className="flex h-full w-56 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Brand Header */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <Link href="/">
          <Image
            src={logoSrc}
            alt={BRANDING.name}
            width={120}
            height={28}
            priority
            className="h-7 w-auto"
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-4">
          {navigationSections.map((section) => (
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
                  const isActive = isNavItemActive(pathname, item.href);
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
                          <NextIcon className="h-3 w-3 text-primary flex-shrink-0 ml-auto" />
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
          ))}
        </div>
      </nav>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-2">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            {/* Wallet Info */}
            <div className="rounded-md bg-sidebar-accent/50 p-2 space-y-1.5">
              {/* Access Token Name - emphasized */}
              {user.accessTokenAlias && (
                <div className="font-semibold text-sm text-sidebar-foreground truncate">
                  {user.accessTokenAlias}
                </div>
              )}
              {/* Wallet Address */}
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
                <span className="text-[10px] font-mono text-muted-foreground truncate">
                  {user.cardanoBech32Addr?.slice(0, 8)}...{user.cardanoBech32Addr?.slice(-4)}
                </span>
              </div>
            </div>

            {/* Disconnect Button */}
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-[11px] h-7 px-2"
            >
              <LogOutIcon className="mr-1.5 h-3 w-3 flex-shrink-0" />
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
