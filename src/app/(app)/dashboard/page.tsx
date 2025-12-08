"use client";

import React from "react";
// TODO: Re-enable when Andamioscan is ready
// import { type AggregateUserInfoResponse } from "@andamiojs/datum-utils";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
// TODO: Re-enable when Andamioscan is ready
// import { AndamioCode } from "~/components/andamio/andamio-code";
import { Wallet, Key, Database, Clock } from "lucide-react";
import { MyLearning } from "~/components/learner/my-learning";
import { MintAccessToken } from "~/components/transactions";
import { WelcomeHero } from "~/components/dashboard/welcome-hero";
import { GettingStarted } from "~/components/dashboard/getting-started";

export default function DashboardPage() {
  const { isAuthenticated, user, jwt } = useAndamioAuth();

  // TODO: Re-enable when Andamioscan API is ready
  // const [onChainUserInfo, setOnChainUserInfo] = useState<AggregateUserInfoResponse | null>(null);
  // const [onChainLoading, setOnChainLoading] = useState(false);
  // const [onChainError, setOnChainError] = useState<string | null>(null);
  //
  // useEffect(() => {
  //   if (!isAuthenticated || !user?.accessTokenAlias) return;
  //
  //   const fetchOnChainUserInfo = async () => {
  //     setOnChainLoading(true);
  //     setOnChainError(null);
  //     try {
  //       const response = await fetch(
  //         `/api/andamioscan/aggregate/user-info?alias=${user.accessTokenAlias}`
  //       );
  //       if (!response.ok) {
  //         throw new Error(`Andamioscan API error: ${response.status}`);
  //       }
  //       const data = (await response.json()) as AggregateUserInfoResponse;
  //       setOnChainUserInfo(data);
  //     } catch (error) {
  //       setOnChainError(error instanceof Error ? error.message : "Failed to fetch on-chain data");
  //     } finally {
  //       setOnChainLoading(false);
  //     }
  //   };
  //
  //   void fetchOnChainUserInfo();
  // }, [isAuthenticated, user?.accessTokenAlias]);

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
    <div className="space-y-8">
      {/* Welcome Hero */}
      <WelcomeHero />

      {/* Getting Started Checklist */}
      <GettingStarted
        isAuthenticated={isAuthenticated}
        hasAccessToken={!!user.accessTokenAlias}
      />

      {/* Mint Access Token - Show if user doesn't have an access token */}
      {!user.accessTokenAlias && (
        <MintAccessToken onSuccess={() => window.location.reload()} />
      )}

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

      {/* On-Chain Data (Andamioscan) - Coming Soon */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <AndamioCardTitle>On-Chain Data</AndamioCardTitle>
            <AndamioBadge variant="outline" className="ml-2">
              <Clock className="mr-1 h-3 w-3" />
              Coming Soon
            </AndamioBadge>
          </div>
          <AndamioCardDescription>
            Andamioscan integration - aggregated on-chain user data
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="rounded-md border border-dashed bg-muted/50 p-6 text-center">
            <Database className="mx-auto h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Andamioscan Integration Coming Soon
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              On-chain user data will be available here once the Andamioscan API is connected.
            </p>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* My Learning Section */}
      <MyLearning />

      {/* Debug Panel - Remove in production */}
    </div>
  );
}
