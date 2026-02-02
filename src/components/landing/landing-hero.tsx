"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CardanoWallet } from "@meshsdk/react";
import { useTheme } from "next-themes";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { RegistrationFlow } from "~/components/landing/registration-flow";
import { CourseIcon, ProjectIcon, ForwardIcon, LoadingIcon, BackIcon } from "~/components/icons";
import { MARKETING } from "~/config/marketing";

const WEB3_SERVICES_CONFIG = {
  networkId: 0,
  projectId: "13ff4981-bdca-4aad-ba9a-41fe1018fdb0",
} as const;

interface LandingHeroProps {
  /** Called when user completes minting flow */
  onMinted?: (info: { alias: string; txHash: string }) => void;
}

/**
 * Landing page hero section with value proposition and CTAs.
 *
 * "Get Started" opens wallet connect. After auth, page.tsx logic
 * handles showing MintCard if user has no access token.
 */
export function LandingHero({ onMinted }: LandingHeroProps) {
  const [mounted, setMounted] = React.useState(false);
  const [showGetStarted, setShowGetStarted] = React.useState(false);
  const [showSignIn, setShowSignIn] = React.useState(false);
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    isWalletConnected,
  } = useAndamioAuth();

  const copy = MARKETING.landingHero;

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-redirect authenticated users with access token to dashboard
  React.useEffect(() => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, user?.accessTokenAlias, router]);

  const isDark = mounted && resolvedTheme === "dark";

  const handleGetStarted = () => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    } else {
      setShowGetStarted(true);
    }
  };

  const handleSignIn = () => {
    if (isAuthenticated && user?.accessTokenAlias) {
      router.push("/dashboard");
    } else {
      setShowSignIn(true);
    }
  };

  // Authenticating state (after wallet connect)
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

  // Show registration flow for "Get Started" (new users)
  // Shows alias input first, then wallet connect
  if (showGetStarted) {
    return (
      <RegistrationFlow onMinted={onMinted} onBack={() => setShowGetStarted(false)} />
    );
  }

  // Show wallet connect for "Sign In" (returning users)
  if (showSignIn && !isWalletConnected) {
    return (
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          Welcome Back
        </h1>
        <AndamioText className="mt-6 text-lg text-muted-foreground max-w-2xl">
          Connect your wallet to sign in with your access token.
        </AndamioText>

        <div className="mt-10 flex flex-col items-center gap-4">
          <CardanoWallet isDark={isDark} web3Services={WEB3_SERVICES_CONFIG} />
          <AndamioButton
            variant="ghost"
            size="sm"
            onClick={() => setShowSignIn(false)}
          >
            <BackIcon className="mr-2 h-4 w-4" />
            Back
          </AndamioButton>
        </div>
      </div>
    );
  }

  // Default hero view
  return (
    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
      {/* Headline - with more breathing room */}
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
        {copy.headline}
      </h1>

      {/* Subtext */}
      <AndamioText className="mt-6 text-lg text-muted-foreground max-w-2xl">
        {copy.subtext}
      </AndamioText>

      {/* Primary CTA */}
      <div className="mt-10">
        <AndamioButton size="lg" onClick={handleGetStarted}>
          {copy.primaryCta}
          <ForwardIcon className="ml-2 h-5 w-5" />
        </AndamioButton>
      </div>

      {/* Browse Links */}
      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <AndamioButton asChild variant="outline">
          <Link href="/course">
            <CourseIcon className="mr-2 h-4 w-4" />
            {copy.browseCourses}
          </Link>
        </AndamioButton>
        <AndamioButton asChild variant="outline">
          <Link href="/project">
            <ProjectIcon className="mr-2 h-4 w-4" />
            {copy.browseProjects}
          </Link>
        </AndamioButton>
      </div>

      {/* Sign In Link */}
      <div className="mt-8">
        <AndamioText variant="small" className="text-muted-foreground">
          {copy.signInText}{" "}
          <button
            onClick={handleSignIn}
            className="text-primary hover:underline font-medium"
          >
            {copy.signInLink}
          </button>
        </AndamioText>
      </div>
    </div>
  );
}
