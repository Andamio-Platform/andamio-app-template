"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { DashboardProvider } from "~/contexts/dashboard-context";
import { ConnectWalletGate } from "~/components/auth/connect-wallet-gate";
import { MyLearning } from "~/components/learner/my-learning";
import { ProjectUnlockProgress } from "~/components/learner/project-unlock-progress";
import { MintAccessTokenSimple } from "~/components/tx";
import { WelcomeHero } from "~/components/dashboard/welcome-hero";
import { GettingStarted } from "~/components/dashboard/getting-started";
import { AccessTokenConfirmationAlert } from "~/components/dashboard/access-token-confirmation-alert";
import { OnChainStatus } from "~/components/dashboard/on-chain-status";
import { AccountDetailsCard } from "~/components/dashboard/account-details";
import { PendingReviewsSummary } from "~/components/dashboard/pending-reviews-summary";
import { PendingAssessmentsSummary } from "~/components/dashboard/pending-assessments-summary";
import { StudentAccomplishments } from "~/components/dashboard/student-accomplishments";
import { ContributingProjectsSummary } from "~/components/dashboard/contributing-projects-summary";
import { ManagingProjectsSummary } from "~/components/dashboard/managing-projects-summary";
import { OwnedCoursesSummary } from "~/components/dashboard/owned-courses-summary";
import {
  PostMintAuthPrompt,
  checkAndClearJustMintedFlag,
} from "~/components/dashboard/post-mint-auth-prompt";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, jwt } = useAndamioAuth();
  const [isPostMint, setIsPostMint] = React.useState(false);

  // Check if user just minted (on mount only)
  React.useEffect(() => {
    const justMinted = checkAndClearJustMintedFlag();
    if (justMinted) {
      setIsPostMint(true);
    }
  }, []);

  // Not authenticated state
  if (!isAuthenticated || !user) {
    // Post-mint: Show contextual auth prompt with step tracker
    if (isPostMint) {
      return (
        <PostMintAuthPrompt
          onAuthenticated={() => {
            setIsPostMint(false);
            router.refresh();
          }}
        />
      );
    }

    // Default: Standard auth prompt
    return (
      <ConnectWalletGate
        title="Your Learning Journey Starts Here"
        description="Connect your Cardano wallet to see your courses, credentials, and project opportunities."
      />
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

  // No access token: show mint prompt
  if (!hasAccessToken) {
    return (
      <div className="space-y-6">
        <AccessTokenConfirmationAlert onComplete={() => router.refresh()} />
        <GettingStarted
          isAuthenticated={isAuthenticated}
          hasAccessToken={hasAccessToken}
        />
        <MintAccessTokenSimple onSuccess={() => router.refresh()} />
      </div>
    );
  }

  return (
    <DashboardProvider>
      <div className="space-y-6">
        {/* Welcome Hero - Main identity display */}
        <WelcomeHero accessTokenAlias={user.accessTokenAlias!} />

        {/* My Learning Section */}
        <MyLearning />

        {/* Project Unlock Progress - Shows prerequisites progress or aspirational empty state */}
        <ProjectUnlockProgress />

        {/* Account Details Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Accomplishments Card - Enrolled courses, completed courses, credentials (single API call) */}
          <StudentAccomplishments accessTokenAlias={user.accessTokenAlias} />
          {/* Pending Reviews Card - Shows on-chain pending assessments for teachers */}
          <PendingReviewsSummary accessTokenAlias={user.accessTokenAlias} />
          {/* Contributing Projects Card - Shows on-chain project contributions */}
          <ContributingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
          {/* Managing Projects Card - Shows projects user is a manager of (only if any) */}
          <ManagingProjectsSummary accessTokenAlias={user.accessTokenAlias} />
          {/* Pending Assessments Card - Shows pending task submissions for project managers */}
          <PendingAssessmentsSummary accessTokenAlias={user.accessTokenAlias} />
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
    </DashboardProvider>
  );
}
