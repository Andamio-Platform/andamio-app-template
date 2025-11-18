"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { Wallet, Key, CheckCircle2 } from "lucide-react";
import { MyLearning } from "~/components/learner/my-learning";

export default function DashboardPage() {
  const { isAuthenticated, user, jwt } = useAndamioAuth();

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Connect your wallet to view your dashboard
          </p>
        </div>

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  // Parse JWT to get expiration
  let jwtExpiration: string | null = null;
  if (jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]!)) as { exp?: number };
      if (payload.exp) {
        jwtExpiration = new Date(payload.exp * 1000).toLocaleString();
      }
    } catch {
      jwtExpiration = "Invalid";
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          View your wallet information and access token details
        </p>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <CheckCircle2 className="h-5 w-5 text-success" />
        <span className="font-medium text-success">Connected & Authenticated</span>
      </div>

      {/* Wallet Information */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <AndamioCardTitle>Wallet Information</AndamioCardTitle>
          </div>
          <AndamioCardDescription>
            Your connected Cardano wallet details
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Wallet Address</label>
            <div className="rounded-md border bg-muted p-3">
              <code className="text-sm font-mono">
                {user.cardanoBech32Addr}
              </code>
            </div>
          </div>

          <AndamioSeparator />

          <div className="space-y-2">
            <label className="text-sm font-medium">User ID</label>
            <div className="rounded-md border bg-muted p-3">
              <code className="text-sm font-mono">{user.id}</code>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Access Token Information */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            <AndamioCardTitle>Access Token</AndamioCardTitle>
          </div>
          <AndamioCardDescription>
            Your Andamio access token details
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {user.accessTokenAlias ? (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Token Alias</label>
                <div className="flex items-center gap-2">
                  <AndamioBadge variant="default" className="text-sm">
                    {user.accessTokenAlias}
                  </AndamioBadge>
                </div>
              </div>

              <AndamioSeparator />
            </>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No access token found
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">JWT Status</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AndamioBadge variant="outline">Active</AndamioBadge>
              </div>
              {jwtExpiration && (
                <p className="text-xs text-muted-foreground">
                  Expires: {jwtExpiration}
                </p>
              )}
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* My Learning Section */}
      <MyLearning />

      {/* Debug Panel - Remove in production */}
    </div>
  );
}
