"use client";

import { useState, useCallback } from "react";
import { OnChainIcon } from "~/components/icons";
import { Badge } from "~/components/ui/badge";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { ExploreCard } from "~/components/landing/explore-card";
import { LoginCard } from "~/components/landing/login-card";
import { RegisterCard, MintCard } from "~/components/landing/register-card";
import { FirstLoginCard } from "~/components/landing/first-login-card";

interface MintedInfo {
  alias: string;
  txHash: string;
}

export default function Home() {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;
  const { isAuthenticated, user } = useAndamioAuth();
  const [mintedInfo, setMintedInfo] = useState<MintedInfo | null>(null);

  const handleMinted = useCallback((info: MintedInfo) => {
    setMintedInfo(info);
  }, []);

  const showMintCard = isAuthenticated && !user?.accessTokenAlias && !mintedInfo;
  const showFirstLogin = !!mintedInfo;

  return (
    <main className="bg-background text-foreground">
      <section className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
        {/* Hero */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Welcome to Andamio V2
          </h1>

          <div className="mt-6 flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-sm">
              <OnChainIcon className="mr-2 h-4 w-4" />
              <span className="capitalize">{network}</span>
            </Badge>
          </div>
        </div>

        {/* Landing page states */}
        {showFirstLogin ? (
          <div className="mt-12 flex w-full justify-center">
            <FirstLoginCard
              alias={mintedInfo.alias}
              txHash={mintedInfo.txHash}
            />
          </div>
        ) : showMintCard ? (
          <div className="mt-12 flex w-full justify-center">
            <MintCard onMinted={handleMinted} />
          </div>
        ) : (
          <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ExploreCard />
            <LoginCard />
            <RegisterCard />
          </div>
        )}
      </section>
    </main>
  );
}
