"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CourseIcon, ForwardIcon, AccessTokenIcon, VerifiedIcon, SparkleIcon, LoadingIcon } from "~/components/icons";
import { BRANDING } from "~/config";

interface WelcomeHeroProps {
  accessTokenAlias?: string | null;
  /** Whether an access token mint is pending confirmation */
  isPendingMint?: boolean;
  /** The alias being minted (shown during pending state) */
  pendingAlias?: string;
}

export function WelcomeHero({ accessTokenAlias, isPendingMint, pendingAlias }: WelcomeHeroProps) {
  const hasAccessToken = !!accessTokenAlias;
  const displayAlias = accessTokenAlias ?? pendingAlias;

  return (
    <AndamioCard className="overflow-hidden border-0 shadow-lg">
      <AndamioCardContent className="p-0">
        {/* Main hero section */}
        <div className="relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />

          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col gap-6">
              {/* Identity Section */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  <AndamioText variant="small" className="font-medium">
                    {isPendingMint ? `Welcome to ${BRANDING.name}` : "Welcome back"}
                  </AndamioText>
                  {isPendingMint && displayAlias ? (
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                      <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight">
                        {displayAlias}
                      </h1>
                      <div className="flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 w-fit shrink-0">
                        <LoadingIcon className="h-4 w-4 text-secondary animate-spin" />
                        <span className="text-sm font-medium text-secondary">Confirming on-chain</span>
                      </div>
                    </div>
                  ) : hasAccessToken ? (
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                      <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight break-all xs:break-normal">
                        {accessTokenAlias}
                      </h1>
                      <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 w-fit shrink-0">
                        <VerifiedIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-primary">Verified</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                      <h1 className="text-2xl xs:text-3xl sm:text-4xl font-bold tracking-tight text-muted-foreground">
                        New Member
                      </h1>
                      <div className="flex items-center gap-1.5 rounded-full bg-muted/10 px-3 py-1 w-fit shrink-0">
                        <SparkleIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Setup Required</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Access Token Badge - Large display when available or pending, hidden on small screens since shown above */}
                {(hasAccessToken || isPendingMint) && displayAlias && (
                  <div className={`hidden sm:flex items-center gap-3 rounded-xl border px-4 py-3 shrink-0 ${
                    isPendingMint
                      ? "border-secondary/20 bg-secondary/5"
                      : "border-primary/20 bg-primary/5"
                  }`}>
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full shrink-0 ${
                      isPendingMint ? "bg-secondary/10" : "bg-primary/10"
                    }`}>
                      {isPendingMint ? (
                        <LoadingIcon className="h-5 w-5 text-secondary animate-spin" />
                      ) : (
                        <AccessTokenIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <AndamioText variant="small" className="text-xs font-medium">
                        {isPendingMint ? "Minting..." : "Access Token"}
                      </AndamioText>
                      <AndamioText className={`text-lg font-bold truncate max-w-[150px] ${
                        isPendingMint ? "text-secondary" : "text-primary"
                      }`}>
                        {displayAlias}
                      </AndamioText>
                    </div>
                  </div>
                )}
              </div>

              {/* Description based on state */}
              <AndamioText variant="muted" className="max-w-2xl">
                {isPendingMint
                  ? `Your access token is being minted on the Cardano blockchain. This usually takes about 30 seconds to confirm. Once confirmed, you'll have full access to all ${BRANDING.name} features.`
                  : hasAccessToken
                    ? "Your on-chain identity is active. Track your learning progress, manage your courses, and explore new opportunities."
                    : `Complete your setup by minting an Access Token to unlock the full ${BRANDING.name} experience.`
                }
              </AndamioText>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {isPendingMint ? (
                  <AndamioBadge variant="secondary" className="text-sm px-4 py-2">
                    <LoadingIcon className="mr-2 h-4 w-4 animate-spin" />
                    Waiting for blockchain confirmation...
                  </AndamioBadge>
                ) : hasAccessToken ? (
                  <>
                    <Link href="/course">
                      <AndamioButton size="lg" className="gap-2">
                        <CourseIcon className="h-4 w-4" />
                        Browse Courses
                        <ForwardIcon className="h-4 w-4" />
                      </AndamioButton>
                    </Link>
                    <Link href="/studio/course">
                      <AndamioButton variant="outline" size="lg">
                        Course Studio
                      </AndamioButton>
                    </Link>
                  </>
                ) : (
                  <AndamioBadge variant="secondary" className="text-sm px-4 py-2">
                    <AccessTokenIcon className="mr-2 h-4 w-4" />
                    Mint your Access Token below to get started
                  </AndamioBadge>
                )}
              </div>
            </div>
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
