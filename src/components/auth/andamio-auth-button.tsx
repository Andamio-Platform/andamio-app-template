"use client";

import React from "react";
import { CardanoWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Loader2 } from "lucide-react";

/**
 * Complete authentication interface for Andamio
 *
 * Handles:
 * - Wallet connection (via Mesh CardanoWallet)
 * - Wallet authentication (sign message)
 * - JWT storage and management
 * - Authenticated state display
 */
export function AndamioAuthButton() {
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    authError,
    isWalletConnected,
    authenticate,
    logout,
  } = useAndamioAuth();

  // Authenticated state
  if (isAuthenticated && user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authenticated</CardTitle>
          <CardDescription>Connected to Andamio APIs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Wallet:</span>
              <Badge variant="secondary" className="font-mono text-xs">
                {user.cardanoBech32Addr?.slice(0, 20)}...
              </Badge>
            </div>
            {user.accessTokenAlias && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Access Token:</span>
                <Badge variant="outline">{user.accessTokenAlias}</Badge>
              </div>
            )}
          </div>
          <Button onClick={logout} variant="destructive" className="w-full">
            Disconnect from Andamio
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Wallet connected but not authenticated
  if (isWalletConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Authenticate with Andamio</CardTitle>
          <CardDescription>
            Sign a message with your wallet to authenticate
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {authError && (
            <Alert variant="destructive">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}
          <Button
            onClick={authenticate}
            disabled={isAuthenticating}
            className="w-full"
          >
            {isAuthenticating && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isAuthenticating ? "Authenticating..." : "Sign Message to Authenticate"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No wallet connected
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect Wallet</CardTitle>
        <CardDescription>
          Connect your Cardano wallet to get started
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CardanoWallet />
      </CardContent>
    </Card>
  );
}
