"use client";

import React, { useEffect, useState } from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
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
              <Badge variant="default" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                {walletName ?? "Connected"}
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Not Connected
              </Badge>
            )}
          </div>

          <Separator orientation="vertical" className="h-4" />

          {/* Auth Status */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <ShieldCheck className="h-4 w-4 text-green-500" />
            ) : authError ? (
              <ShieldAlert className="h-4 w-4 text-destructive" />
            ) : (
              <Shield className="h-4 w-4 text-muted-foreground" />
            )}
            {isAuthenticated ? (
              <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                Authenticated
              </Badge>
            ) : authError ? (
              <Badge variant="destructive" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-white" />
                Auth Error
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                Not Authenticated
              </Badge>
            )}
          </div>

          {/* JWT Expiry */}
          {isAuthenticated && timeUntilExpiry && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Badge
                  variant="outline"
                  className={timeUntilExpiry === "Expired" ? "text-destructive" : ""}
                >
                  {timeUntilExpiry === "Expired" ? "JWT Expired" : `Expires in ${timeUntilExpiry}`}
                </Badge>
              </div>
            </>
          )}

          {/* User Info */}
          {isAuthenticated && user && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline" className="font-mono text-xs">
                  {user.accessTokenAlias ?? user.id.slice(0, 8)}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="h-7 gap-1 text-xs"
            >
              <LogOut className="h-3 w-3" />
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
