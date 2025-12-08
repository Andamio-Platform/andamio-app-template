"use client";

import React from "react";
import Link from "next/link";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { BookOpen, ArrowRight, Key, CheckCircle2, Sparkles } from "lucide-react";

interface WelcomeHeroProps {
  accessTokenAlias?: string | null;
}

export function WelcomeHero({ accessTokenAlias }: WelcomeHeroProps) {
  const hasAccessToken = !!accessTokenAlias;

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
                  <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
                  {hasAccessToken ? (
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        {accessTokenAlias}
                      </h1>
                      <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm font-medium text-success">Verified</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-muted-foreground">
                        New Member
                      </h1>
                      <div className="flex items-center gap-1.5 rounded-full bg-warning/10 px-3 py-1">
                        <Sparkles className="h-4 w-4 text-warning" />
                        <span className="text-sm font-medium text-warning">Setup Required</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Access Token Badge - Large display when available */}
                {hasAccessToken && (
                  <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Access Token</p>
                      <p className="text-lg font-bold text-primary">{accessTokenAlias}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description based on state */}
              <p className="text-muted-foreground max-w-2xl">
                {hasAccessToken
                  ? "Your on-chain identity is active. Track your learning progress, manage your courses, and explore new opportunities."
                  : "Complete your setup by minting an Access Token to unlock the full Andamio experience."
                }
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                {hasAccessToken ? (
                  <>
                    <Link href="/course">
                      <AndamioButton size="lg" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Browse Courses
                        <ArrowRight className="h-4 w-4" />
                      </AndamioButton>
                    </Link>
                    <Link href="/courses">
                      <AndamioButton variant="outline" size="lg">
                        My Courses
                      </AndamioButton>
                    </Link>
                  </>
                ) : (
                  <AndamioBadge variant="secondary" className="text-sm px-4 py-2">
                    <Key className="mr-2 h-4 w-4" />
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
