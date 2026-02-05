"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { RegistrationFlow } from "~/components/landing/registration-flow";
import { LoadingIcon } from "~/components/icons";
import { MARKETING } from "~/config/marketing";

interface LandingHeroProps {
  onMinted?: (info: { alias: string; txHash: string }) => void;
}

export function LandingHero({ onMinted }: LandingHeroProps) {
  const [showEnter, setShowEnter] = React.useState(false);
  const router = useRouter();
  useWallet(); // Required for CardanoWallet component
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    isWalletConnected,
  } = useAndamioAuth();

  const copy = MARKETING.landingHero;

  // Auto-redirect authenticated users with access token to dashboard
  React.useEffect(() => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user?.accessTokenAlias, router]);

  const handleEnter = () => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    } else {
      setShowEnter(true);
    }
  };

  // Authenticating state
  if (isWalletConnected && isAuthenticating) {
    return (
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          Signing In...
        </h1>
        <div className="mt-10 flex flex-col items-center gap-4">
          <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          <AndamioText variant="muted">Please sign the message in your wallet</AndamioText>
        </div>
      </div>
    );
  }

  // Show registration flow (handles wallet connect + minting)
  if (showEnter) {
    return (
      <RegistrationFlow onMinted={onMinted} onBack={() => setShowEnter(false)} />
    );
  }

  // Default hero view - clean vertical CTAs
  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
      {/* Value prop: icon + text pairs with arrows */}
      <div className="flex items-start gap-4 sm:gap-8">
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl sm:text-5xl">📚</span>
          <span className="text-muted-foreground">Complete courses.</span>
        </div>
        <span className="text-2xl text-muted-foreground pt-2">→</span>
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl sm:text-5xl">✅</span>
          <span className="text-muted-foreground">Earn credentials.</span>
        </div>
        <span className="text-2xl text-muted-foreground pt-2">→</span>
        <div className="flex flex-col items-center gap-4">
          <span className="text-4xl sm:text-5xl">🚪</span>
          <span className="text-muted-foreground">Join projects.</span>
        </div>
      </div>

      {/* CTA Cards */}
      <div className="pt-16 w-full max-w-4xl">
        <hr className="border-border" />
      </div>
      <div className="pt-6 w-full max-w-4xl">
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="flex flex-col items-center text-center p-6 gap-4">
            <h3 className="font-semibold">Get Started</h3>
            <p className="text-sm text-muted-foreground">
              Connect your wallet and create your on-chain identity
            </p>
            <AndamioButton onClick={handleEnter} className="w-full mt-auto">
              Enter
            </AndamioButton>
          </div>

          <div className="flex flex-col items-center text-center p-6 gap-4">
            <h3 className="font-semibold">Explore</h3>
            <p className="text-sm text-muted-foreground">
              Browse courses and projects to see what&apos;s available
            </p>
            <AndamioButton asChild variant="outline" className="w-full mt-auto">
              <Link href="/course">Browse</Link>
            </AndamioButton>
          </div>

          <div className="flex flex-col items-center text-center p-6 gap-4">
            <h3 className="font-semibold">Build</h3>
            <p className="text-sm text-muted-foreground">
              Launch a project and onboard contributors
            </p>
            <AndamioButton asChild variant="outline" className="w-full mt-auto">
              <Link href="/studio">Launch</Link>
            </AndamioButton>
          </div>
        </div>
      </div>
    </div>
  );
}
