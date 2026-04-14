"use client";

import Image from "next/image";
import { env } from "~/env";
import { LandingHero } from "~/components/landing/landing-hero";

export default function Home() {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;

  return (
    <main className="bg-background text-foreground h-dvh flex flex-col overflow-y-auto">
      <section className="flex flex-1 flex-col items-center px-6 pt-[4vh]">
        {/* Logo — pinned near top so it doesn't shift between states */}
        <Image
          src="/logos/logo-with-typography-stacked.svg"
          alt="Andamio"
          width={200}
          height={200}
          className="shrink-0"
          priority
        />

        {/* Card area — centered for short content, naturally top-anchored for tall hero */}
        <div className="flex flex-1 w-full items-center justify-center pt-[4vh] sm:pt-[6vh]">
          <LandingHero />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 px-6 border-t border-border/50">
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
          <span className="uppercase tracking-wider">{network}</span>
          <span className="text-border">•</span>
          <span>v2.2.0</span>
        </div>
      </footer>
    </main>
  );
}
