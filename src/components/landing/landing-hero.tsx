"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { extractAliasFromUnit } from "~/lib/access-token-utils";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { RegistrationFlow } from "~/components/landing/registration-flow";
import { V1MigrateCard } from "~/components/landing/v1-migrate-card";
import { LoadingIcon } from "~/components/icons";
import { MARKETING } from "~/config/marketing";

const V1_POLICY_ID = "c76c35088ac826c8a0e6947c8ff78d8d4495789bc729419b3a334305";

interface LandingHeroProps {
  onMinted?: (info: { alias: string; txHash: string }) => void;
}

export function LandingHero({ onMinted }: LandingHeroProps) {
  const [showEnter, setShowEnter] = React.useState(false);
  const [v1Alias, setV1Alias] = React.useState<string | null>(null);
  const [v1Scanning, setV1Scanning] = React.useState(false);
  const router = useRouter();
  const { wallet } = useWallet();
  const {
    isAuthenticated,
    user,
    isAuthenticating,
    isWalletConnected,
  } = useAndamioAuth();

  const copy = MARKETING.landingHero;

  // Scan for V1 token when authenticated but no V2 token
  React.useEffect(() => {
    if (!isAuthenticated || user?.accessTokenAlias || !isWalletConnected || !wallet) {
      setV1Alias(null);
      setV1Scanning(false);
      return;
    }

    let cancelled = false;

    async function scanForV1Token() {
      setV1Scanning(true);
      try {
        const assets = await wallet.getAssets();
        const v1Asset = assets.find((asset: { unit: string }) =>
          asset.unit.startsWith(V1_POLICY_ID)
        );

        if (cancelled) return;

        if (v1Asset) {
          const alias = extractAliasFromUnit(v1Asset.unit, V1_POLICY_ID, 3);
          setV1Alias(alias);
        } else {
          setV1Alias(null);
        }
      } catch (err) {
        console.error("[LandingHero] Failed to scan for V1 token:", err);
        if (!cancelled) {
          setV1Alias(null);
        }
      } finally {
        if (!cancelled) {
          setV1Scanning(false);
        }
      }
    }

    void scanForV1Token();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.accessTokenAlias, isWalletConnected, wallet]);

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

  // Scanning for V1 token
  if (v1Scanning) {
    return (
      <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
          Checking Your Wallet...
        </h1>
        <div className="mt-10 flex flex-col items-center gap-4">
          <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          <AndamioText variant="muted">Scanning for existing access tokens</AndamioText>
        </div>
      </div>
    );
  }

  // V1 token detected — show migrate card
  if (v1Alias) {
    return (
      <V1MigrateCard
        detectedAlias={v1Alias}
        onMinted={onMinted}
        onBack={() => setV1Alias(null)}
      />
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
        <hr style={{ borderColor: 'color-mix(in oklch, var(--foreground) 30%, transparent)' }} />
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
