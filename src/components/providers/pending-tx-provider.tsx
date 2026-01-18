"use client";

import { type ReactNode, useState, useEffect, type ComponentType } from "react";

/**
 * PendingTxProvider wrapper for Next.js App Router
 *
 * This component wraps the PendingTxWatcher to make it compatible
 * with Next.js App Router. It dynamically imports the component client-side
 * to avoid SSR compatibility issues with @meshsdk/react imports.
 *
 * Must be used inside AuthProvider (which must be inside MeshProvider).
 */
export function PendingTxProvider({ children }: { children: ReactNode }) {
  const [Watcher, setWatcher] = useState<ComponentType<{ children: ReactNode }> | null>(null);

  useEffect(() => {
    // Dynamically import PendingTxWatcher only on client-side to avoid
    // SSR issues with @meshsdk/react -> cardano-peer-connect chain
    void import("~/components/pending-tx-watcher").then((mod) => {
      setWatcher(() => mod.PendingTxWatcher);
    });
  }, []);

  // Render children without PendingTxWatcher during SSR/loading
  if (!Watcher) {
    return <>{children}</>;
  }

  return <Watcher>{children}</Watcher>;
}
