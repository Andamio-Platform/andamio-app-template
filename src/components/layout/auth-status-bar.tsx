"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  Wallet,
  Shield,
  ShieldCheck,
  Clock,
  LogOut,
  User,
  ShieldAlert,
  Circle
} from "lucide-react";
import { getStoredJWT } from "~/lib/andamio-auth";
import { cn } from "~/lib/utils";

interface JWTPayload {
  exp?: number;
  [key: string]: unknown;
}

/**
 * AuthStatusBar - A minimal, professional status bar showing connection state
 */
export function AuthStatusBar() {
  const { name: walletName } = useWallet();
  const {
    isWalletConnected,
    isAuthenticated,
    user,
    logout,
    authError
  } = useAndamioAuth();

  const [timeUntilExpiry, setTimeUntilExpiry] = useState<string | null>(null);
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  // Update JWT expiration countdown
  useEffect(() => {
    if (!isAuthenticated) {
      setTimeUntilExpiry(null);
      setIsExpiringSoon(false);
      return;
    }

    const updateExpiry = () => {
      const jwt = getStoredJWT();
      if (!jwt) {
        setTimeUntilExpiry(null);
        setIsExpiringSoon(false);
        return;
      }

      try {
        const payload = JSON.parse(atob(jwt.split('.')[1]!)) as JWTPayload;
        if (!payload.exp) {
          setTimeUntilExpiry(null);
          return;
        }
        const expiresAt = payload.exp * 1000;
        const now = Date.now();
        const diff = expiresAt - now;

        if (diff <= 0) {
          setTimeUntilExpiry("Expired");
          setIsExpiringSoon(true);
          return;
        }

        // Check if expiring within 5 minutes
        setIsExpiringSoon(diff < 5 * 60 * 1000);

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeUntilExpiry(`${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeUntilExpiry(`${minutes}m ${seconds}s`);
        } else {
          setTimeUntilExpiry(`${seconds}s`);
        }
      } catch (error) {
        console.error("Error parsing JWT:", error);
        setTimeUntilExpiry(null);
      }
    };

    updateExpiry();
    const interval = setInterval(updateExpiry, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="h-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Status Indicators */}
        <div className="flex items-center gap-4">
          {/* Wallet Status */}
          <div className="flex items-center gap-2">
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
            <div className="flex items-center gap-1.5">
              <Circle
                className={cn(
                  "h-1.5 w-1.5 fill-current",
                  isWalletConnected ? "text-success" : "text-muted-foreground"
                )}
              />
              <span className="text-xs text-muted-foreground">
                {isWalletConnected ? walletName ?? "Wallet" : "Not connected"}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-4 w-px bg-border" />

          {/* Auth Status */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
            ) : authError ? (
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
            ) : (
              <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span
              className={cn(
                "text-xs",
                isAuthenticated
                  ? "text-success"
                  : authError
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              {isAuthenticated
                ? "Authenticated"
                : authError
                ? "Error"
                : "Not authenticated"}
            </span>
          </div>

          {/* JWT Timer - Only show when authenticated */}
          {isAuthenticated && timeUntilExpiry && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Clock
                  className={cn(
                    "h-3.5 w-3.5",
                    isExpiringSoon ? "text-warning" : "text-muted-foreground"
                  )}
                />
                <span
                  className={cn(
                    "text-xs font-mono",
                    timeUntilExpiry === "Expired"
                      ? "text-destructive"
                      : isExpiringSoon
                      ? "text-warning"
                      : "text-muted-foreground"
                  )}
                >
                  {timeUntilExpiry === "Expired" ? "Expired" : timeUntilExpiry}
                </span>
              </div>
            </>
          )}

          {/* User Alias - Only show when authenticated */}
          {isAuthenticated && user?.accessTokenAlias && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                <AndamioBadge variant="secondary" className="h-5 text-[10px] font-mono px-1.5">
                  {user.accessTokenAlias}
                </AndamioBadge>
              </div>
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-1.5 h-3 w-3" />
              Logout
            </AndamioButton>
          )}
        </div>
      </div>
    </div>
  );
}
