"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { env } from "~/env";
import { LandingHero } from "~/components/landing/landing-hero";
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
    <main className="bg-background text-foreground h-dvh flex flex-col overflow-y-auto">
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        {/* Logo */}
        <Image
          src="/logos/logo-with-typography-stacked.svg"
          alt="Andamio"
          width={200}
          height={200}
          className="mb-6"
          priority
        />

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
          <LandingHero onMinted={handleMinted} />
        )}
      </section>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-border/50">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
          <span className="uppercase tracking-wider">{network}</span>
          <span className="text-border">•</span>
          <span>v2.0.0</span>
        </div>
      </footer>
    </main>
  );
}
