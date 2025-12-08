"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { Wallet, Key, Database, Clock, Shield, Copy, Check } from "lucide-react";
import { MyLearning } from "~/components/learner/my-learning";
import { MintAccessToken, CreateCourse } from "~/components/transactions";
import { WelcomeHero } from "~/components/dashboard/welcome-hero";
import { GettingStarted } from "~/components/dashboard/getting-started";
import { AndamioButton } from "~/components/andamio/andamio-button";

export default function DashboardPage() {
  const { isAuthenticated, user, jwt } = useAndamioAuth();
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to Andamio</h1>
          <p className="text-muted-foreground max-w-md">
            Connect your Cardano wallet to access your personalized learning dashboard
          </p>
        </div>
        <div className="w-full max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  // Parse JWT to get expiration
  let jwtExpiration: Date | null = null;
  if (jwt) {
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]!)) as { exp?: number };
      if (payload.exp) {
        jwtExpiration = new Date(payload.exp * 1000);
      }
    } catch {
      // Invalid JWT
    }
  }

  const hasAccessToken = !!user.accessTokenAlias;

  return (
    <div className="space-y-6">
      {/* Welcome Hero - Main identity display */}
      <WelcomeHero accessTokenAlias={user.accessTokenAlias} />

      {/* Getting Started - Only shows when user needs to mint token */}
      <GettingStarted
        isAuthenticated={isAuthenticated}
        hasAccessToken={hasAccessToken}
      />

      {/* Mint Access Token - Prominent when user doesn't have one */}
      {!hasAccessToken && (
        <MintAccessToken onSuccess={() => window.location.reload()} />
      )}

      {/* My Learning Section - Only show if user has access token */}
      {hasAccessToken && <MyLearning />}

      {/* Create Course Section - Only show if user has access token */}
      {hasAccessToken && (
        <CreateCourse
          onSuccess={(txHash) => {
            console.log("Course created with txHash:", txHash);
            // Optionally redirect or refresh
          }}
        />
      )}

      {/* Account Details Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wallet & Session Card */}
        <AndamioCard>
          <AndamioCardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <AndamioCardTitle className="text-base">Account Details</AndamioCardTitle>
            </div>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {/* Wallet Address */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Wallet Address
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted rounded px-2 py-1.5 truncate">
                  {user.cardanoBech32Addr}
                </code>
                <AndamioButton
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => user.cardanoBech32Addr && copyToClipboard(user.cardanoBech32Addr, "address")}
                >
                  {copiedField === "address" ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </AndamioButton>
              </div>
            </div>

            {/* Access Token */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Access Token
              </label>
              {hasAccessToken ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-success/10 rounded px-2 py-1.5">
                    <Key className="h-3.5 w-3.5 text-success" />
                    <code className="text-xs font-mono font-semibold text-success">
                      {user.accessTokenAlias}
                    </code>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-muted rounded px-2 py-1.5">
                  <Key className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Not minted</span>
                </div>
              )}
            </div>

            {/* Session Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Session
              </label>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-success" />
                  <span className="text-xs">Active</span>
                </div>
                {jwtExpiration && (
                  <span className="text-xs text-muted-foreground">
                    Expires {jwtExpiration.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>

        {/* On-Chain Data Card */}
        <AndamioCard>
          <AndamioCardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <AndamioCardTitle className="text-base">On-Chain Data</AndamioCardTitle>
              </div>
              <AndamioBadge variant="outline" className="text-xs">
                <Clock className="mr-1 h-3 w-3" />
                Coming Soon
              </AndamioBadge>
            </div>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Database className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                Blockchain Integration
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                Your on-chain learning achievements will appear here
              </p>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      </div>
    </div>
  );
}
