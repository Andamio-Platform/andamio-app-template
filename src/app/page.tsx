"use client";

import Link from "next/link";
import { ForwardIcon, OnChainIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { Badge } from "~/components/ui/badge";
import { env } from "~/env";

export default function Home() {
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK;

  return (
    <main className="bg-background text-foreground">
      <section className="flex min-h-screen flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Welcome to Andamio V2
          </h1>

          <div className="mt-8 flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 text-sm">
              <OnChainIcon className="mr-2 h-4 w-4" />
              <span className="capitalize">{network}</span>
            </Badge>
          </div>

          <div className="mt-12">
            <AndamioButton asChild size="lg">
              <Link href="/dashboard" className="inline-flex items-center">
                <span>Enter App</span>
                <ForwardIcon className="ml-2 h-4 w-4" />
              </Link>
            </AndamioButton>
          </div>
        </div>
      </section>
    </main>
  );
}
