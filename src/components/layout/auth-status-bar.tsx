"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@meshsdk/react";
import { useTheme } from "next-themes";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { MobileNav } from "./mobile-nav";
import {
  WalletIcon,
  ShieldIcon,
  VerifiedIcon,
  SecurityAlertIcon,
  NeutralIcon,
  AccessTokenIcon,
  LightModeIcon,
  DarkModeIcon,
} from "~/components/icons";
import { cn } from "~/lib/utils";

/**
 * AuthStatusBar - A minimal, professional status bar showing connection state
 */
export function AuthStatusBar() {
  const { name: walletName } = useWallet();
  const { theme, setTheme } = useTheme();
  const {
    isWalletConnected,
    isAuthenticated,
    user,
    authError,
    popupBlocked,
    authenticate,
  } = useAndamioAuth();

  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="h-10 border-b border-primary-foreground/10 bg-primary text-primary-foreground">
      <div className="flex h-full items-center justify-between px-3 sm:px-4">
        {/* Left: Mobile Menu + Status Indicators */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0" role="status" aria-live="polite">
          {/* Mobile Menu - Visible on small screens only */}
          <MobileNav />

          {/* Wallet Status - Hidden on very small screens */}
          <div
            className="hidden xs:flex items-center gap-2"
            aria-label={isWalletConnected ? `Wallet connected: ${walletName ?? "Wallet"}` : "Wallet not connected"}
          >
            <WalletIcon className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />
            <div className="flex items-center gap-1.5 min-w-0">
              <NeutralIcon
                className={cn(
                  "h-1.5 w-1.5 fill-current flex-shrink-0",
                  isWalletConnected ? "text-success-foreground" : "text-primary-foreground/50"
                )}
              />
              <span className="text-xs text-primary-foreground/80 truncate">
                {isWalletConnected ? walletName ?? "Wallet" : "Not connected"}
              </span>
            </div>
          </div>

          {/* Divider - Hidden on small screens */}
          <div className="hidden sm:block h-4 w-px bg-primary-foreground/20 flex-shrink-0" />

          {/* Auth Status - Hidden on very small screens */}
          <div
            className="hidden xs:flex items-center gap-2"
            aria-label={isAuthenticated ? "Authenticated" : authError ? "Authentication error" : "Not authenticated"}
          >
            {isAuthenticated ? (
              <VerifiedIcon className="h-3.5 w-3.5 text-success-foreground flex-shrink-0" />
            ) : authError || popupBlocked ? (
              <SecurityAlertIcon className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
            ) : (
              <ShieldIcon className="h-3.5 w-3.5 text-primary-foreground/50 flex-shrink-0" />
            )}
            {popupBlocked && !isAuthenticated ? (
              <button
                onClick={() => void authenticate()}
                className="text-xs whitespace-nowrap text-destructive underline underline-offset-2 hover:text-destructive/80"
              >
                Sign In
              </button>
            ) : (
              <span
                className={cn(
                  "text-xs whitespace-nowrap",
                  isAuthenticated
                    ? "text-success-foreground"
                    : authError
                    ? "text-destructive"
                    : "text-primary-foreground/50"
                )}
              >
                {isAuthenticated
                  ? "Auth"
                  : authError
                  ? "Error"
                  : "Unauth"}
              </span>
            )}
          </div>

          {/* User Alias - Only show when authenticated, hidden on very small screens */}
          {isAuthenticated && user?.accessTokenAlias && (
            <>
              <div className="hidden sm:block h-4 w-px bg-primary-foreground/20 flex-shrink-0" />
              <div className="hidden sm:flex items-center gap-1.5">
                <AccessTokenIcon className="h-3.5 w-3.5 text-primary-foreground/70 flex-shrink-0" />
                <span className="h-5 text-[10px] font-mono px-1.5 bg-primary-foreground/15 text-primary-foreground rounded">
                  {user.accessTokenAlias}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* Theme Toggle */}
          {mounted && (
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 p-0 text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <LightModeIcon className="h-3.5 w-3.5" />
              ) : (
                <DarkModeIcon className="h-3.5 w-3.5" />
              )}
            </AndamioButton>
          )}

          <ConnectWalletButton
            label="Sign In"
            className="hidden sm:flex h-6 px-2 text-xs border-0 bg-transparent text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/15 dark:bg-input/30 dark:border-input dark:text-foreground dark:hover:bg-input/50"
          />
        </div>
      </div>
    </div>
  );
}
