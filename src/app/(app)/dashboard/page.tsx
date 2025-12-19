"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { MyLearning } from "~/components/learner/my-learning";
import { MintAccessToken, CreateCourse } from "~/components/transactions";
import { WelcomeHero } from "~/components/dashboard/welcome-hero";
import { GettingStarted } from "~/components/dashboard/getting-started";
import { OnChainStatus } from "~/components/dashboard/on-chain-status";
import { AccountDetailsCard } from "~/components/dashboard/account-details";
import { AndamioPageHeader } from "~/components/andamio";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, jwt } = useAndamioAuth();

  // Not authenticated state
  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <AndamioPageHeader
          title="Welcome to Andamio"
          description="Connect your Cardano wallet to access your personalized learning dashboard"
          centered
        />
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
        <MintAccessToken onSuccess={() => router.refresh()} />
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
        <AccountDetailsCard
          cardanoBech32Addr={user.cardanoBech32Addr}
          accessTokenAlias={user.accessTokenAlias}
          jwtExpiration={jwtExpiration}
        />

        {/* On-Chain Data Card - Live blockchain data from Andamioscan */}
        <OnChainStatus accessTokenAlias={user.accessTokenAlias} />
      </div>
    </div>
  );
}
