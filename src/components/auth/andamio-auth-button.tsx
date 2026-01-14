"use client";

import React from "react";
import { CardanoWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { LoadingIcon } from "~/components/icons";

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
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Authenticated</AndamioCardTitle>
          <AndamioCardDescription>Connected to Andamio APIs</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Wallet:</span>
              <AndamioBadge variant="secondary" className="font-mono text-xs">
                {user.cardanoBech32Addr?.slice(0, 20)}...
              </AndamioBadge>
            </div>
            {user.accessTokenAlias && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Access Token:</span>
                <AndamioBadge variant="outline">{user.accessTokenAlias}</AndamioBadge>
              </div>
            )}
          </div>
          <AndamioButton onClick={logout} variant="destructive" className="w-full">
            Disconnect from Andamio
          </AndamioButton>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Wallet connected but not authenticated
  // Possible states: authenticating, error, or idle (waiting for user action)
  if (isWalletConnected) {
    // Determine the current state
    const isIdle = !isAuthenticating && !authError;

    let title = "Authenticating...";
    let description = "Please sign the message in your wallet";

    if (authError) {
      title = "Authentication Failed";
      description = "Please try again or reconnect your wallet";
    } else if (isIdle) {
      title = "Sign to Continue";
      description = "Sign a message with your wallet to authenticate";
    }

    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>{title}</AndamioCardTitle>
          <AndamioCardDescription>{description}</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {authError && (
            <AndamioAlert variant="destructive">
              <AndamioAlertDescription>{authError}</AndamioAlertDescription>
            </AndamioAlert>
          )}
          {isAuthenticating ? (
            <div className="flex items-center justify-center py-4">
              <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AndamioButton
              onClick={authenticate}
              disabled={isAuthenticating}
              className="w-full"
            >
              {authError ? "Try Again" : "Sign to Authenticate"}
            </AndamioButton>
          )}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // No wallet connected
  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardTitle>Connect Wallet</AndamioCardTitle>
        <AndamioCardDescription>
          Connect your Cardano wallet to get started
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent>
        <CardanoWallet />
      </AndamioCardContent>
    </AndamioCard>
  );
}
