"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import {
  Wallet,
  Shield,
  ShieldCheck,
  Clock,
  LogOut,
  User,
  ShieldAlert
} from "lucide-react";
import { getStoredJWT } from "~/lib/andamio-auth";

interface JWTPayload {
  exp?: number;
  [key: string]: unknown;
}

/**
 * AuthStatusBar - Displays authentication and wallet connection status
 *
 * Shows:
 * - Wallet connection status and name
 * - Authentication status
 * - JWT expiration countdown
 * - User information
 * - Quick logout action
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

  // Update JWT expiration countdown
  useEffect(() => {
    if (!isAuthenticated) {
      setTimeUntilExpiry(null);
      return;
    }

    const updateExpiry = () => {
      const jwt = getStoredJWT();
      if (!jwt) {
        setTimeUntilExpiry(null);
        return;
      }

      try {
        // Decode JWT to get expiration
        const payload = JSON.parse(atob(jwt.split('.')[1]!)) as JWTPayload;
        if (!payload.exp) {
          setTimeUntilExpiry(null);
          return;
        }
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const diff = expiresAt - now;

        if (diff <= 0) {
          setTimeUntilExpiry("Expired");
          return;
        }

        // Format time remaining
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

    // Update immediately
    updateExpiry();

    // Update every second
    const interval = setInterval(updateExpiry, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <div className="border-b bg-muted/30">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left side - Status indicators */}
        <div className="flex items-center gap-3">
          {/* Wallet Status */}
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            {isWalletConnected ? (
              <AndamioBadge variant="default" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                {walletName ?? "Connected"}
              </AndamioBadge>
            ) : (
              <AndamioBadge variant="secondary" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Not Connected
              </AndamioBadge>
            )}
          </div>

          <AndamioSeparator orientation="vertical" className="h-4" />

          {/* Auth Status */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <ShieldCheck className="h-4 w-4 text-success" />
            ) : authError ? (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
            {isAuthenticated ? (
              <AndamioBadge variant="default" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-success-foreground animate-pulse" />
                Authenticated
              </AndamioBadge>
            ) : authError ? (
              <AndamioBadge variant="destructive" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-destructive-foreground" />
                Auth Error
              </AndamioBadge>
            ) : (
              <AndamioBadge variant="secondary" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                Not Authenticated
              </AndamioBadge>
            )}
          </div>

          {/* JWT Expiry */}
          {isAuthenticated && timeUntilExpiry && (
            <>
              <AndamioSeparator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <AndamioBadge
                  variant="outline"
                  className={timeUntilExpiry === "Expired" ? "text-destructive" : ""}
                >
                  {timeUntilExpiry === "Expired" ? "JWT Expired" : `Expires in ${timeUntilExpiry}`}
                </AndamioBadge>
              </div>
            </>
          )}

          {/* User Info */}
          {isAuthenticated && user && (
            <>
              <AndamioSeparator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <AndamioBadge variant="outline" className="font-mono text-xs">
                  {user.accessTokenAlias ?? user.id.slice(0, 8)}
                </AndamioBadge>
              </div>
            </>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-7 gap-1 text-xs"
            >
              <LogOut className="h-3 w-3" />
              Logout
            </AndamioButton>
          )}
        </div>
      </div>
    </div>
  );
}
