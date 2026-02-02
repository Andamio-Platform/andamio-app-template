"use client";

import { useState, useCallback } from "react";
import { OnChainIcon } from "~/components/icons";
import { Badge } from "~/components/ui/badge";
import { env } from "~/env";
import { LandingHero } from "~/components/landing/landing-hero";
import { BuilderSection } from "~/components/landing/builder-section";
import { FirstLoginCard } from "~/components/landing/first-login-card";

interface MintedInfo {
  alias: string;
  txHash: string;
}

export default function Home() {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;
  const [mintedInfo, setMintedInfo] = useState<MintedInfo | null>(null);

  const handleMinted = useCallback((info: MintedInfo) => {
    setMintedInfo(info);
  }, []);

  // Show FirstLoginCard after minting
  const showFirstLogin = !!mintedInfo;

  return (
    <main className="bg-background text-foreground">
      <section className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        {/* Network Badge */}
        <div className="mb-8">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            <OnChainIcon className="mr-2 h-4 w-4" />
            <span className="capitalize">{network}</span>
          </Badge>
        </div>

        {/* Landing page states */}
        {showFirstLogin ? (
          // After minting: show first-login ceremony
          <div className="flex w-full justify-center">
            <FirstLoginCard
              alias={mintedInfo.alias}
              txHash={mintedInfo.txHash}
            />
          </div>
        ) : (
          // Default: show hero + builder section
          // LandingHero handles the full registration flow via RegistrationFlow
          <>
            <LandingHero onMinted={handleMinted} />
            <BuilderSection />
          </>
        )}
      </section>
    </main>
  );
}
