"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { usePendingTxContext } from "~/components/pending-tx-watcher";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { MyLearning } from "~/components/learner/my-learning";
import { MintAccessToken } from "~/components/transactions";
import { WelcomeHero } from "~/components/dashboard/welcome-hero";
import { GettingStarted } from "~/components/dashboard/getting-started";
import { AccessTokenConfirmationAlert } from "~/components/dashboard/access-token-confirmation-alert";
import { OnChainStatus } from "~/components/dashboard/on-chain-status";
import { AccountDetailsCard } from "~/components/dashboard/account-details";
import { PendingReviewsSummary } from "~/components/dashboard/pending-reviews-summary";
import { EnrolledCoursesSummary } from "~/components/dashboard/enrolled-courses-summary";
import { CredentialsSummary } from "~/components/dashboard/credentials-summary";
import { ContributingProjectsSummary } from "~/components/dashboard/contributing-projects-summary";
import { ManagingProjectsSummary } from "~/components/dashboard/managing-projects-summary";
import { OwnedCoursesSummary } from "~/components/dashboard/owned-courses-summary";
import { AndamioPageHeader } from "~/components/andamio";

export default function DashboardPage() {
  const { isAuthenticated, user, jwt } = useAndamioAuth();
  const { pendingTransactions } = usePendingTxContext();

  // Check if there's a pending access token minting transaction
  const pendingAccessTokenTx = pendingTransactions.find(
    (tx) => tx.entityType === "access-token"
  );
  const isPendingAccessTokenMint = !!pendingAccessTokenTx;

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
      <WelcomeHero
        accessTokenAlias={user.accessTokenAlias}
        isPendingMint={isPendingAccessTokenMint}
        pendingAlias={pendingAccessTokenTx?.entityId}
      />

      {/* Access Token Confirmation Alert - Shows during pending mint */}
      <AccessTokenConfirmationAlert onComplete={() => router.refresh()} />

      {/* Getting Started - Only shows when user needs to mint token and not pending */}
      {!isPendingAccessTokenMint && (
        <GettingStarted
          isAuthenticated={isAuthenticated}
          hasAccessToken={hasAccessToken}
        />
      )}

      {/* Mint Access Token - Only show when user doesn't have one and not pending */}
      {!hasAccessToken && !isPendingAccessTokenMint && (
        <MintAccessToken />
      )}

      {/* My Learning Section - Only show if user has access token */}
      {hasAccessToken && <MyLearning />}

      {/* Account Details Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Enrolled Courses Card - Shows on-chain enrolled courses for learners */}
        <EnrolledCoursesSummary accessTokenAlias={user.accessTokenAlias} />
        {/* Pending Reviews Card - Shows on-chain pending assessments for teachers */}
        <PendingReviewsSummary accessTokenAlias={user.accessTokenAlias} />
        {/* Credentials Card - Shows on-chain earned credentials */}
        <CredentialsSummary accessTokenAlias={user.accessTokenAlias} />
        {/* Contributing Projects Card - Shows on-chain project contributions */}
        <ContributingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
        {/* Managing Projects Card - Shows projects user is a manager of (only if any) */}
        <ManagingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
        {/* Owned Courses Card - Shows on-chain courses user owns/created */}
        <OwnedCoursesSummary accessTokenAlias={user.accessTokenAlias} />
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
