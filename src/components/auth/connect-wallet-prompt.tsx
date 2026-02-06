"use client";

import React from "react";
import { CardanoWallet } from "@meshsdk/react";
import { useTheme } from "next-themes";
import { WEB3_SERVICES_CONFIG } from "~/config/wallet";

export function ConnectWalletPrompt({ className }: { className?: string }) {
  const [mounted, setMounted] = React.useState(false);
  const { resolvedTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  return (
    <div className={className}>
      <CardanoWallet isDark={isDark} web3Services={WEB3_SERVICES_CONFIG} />
    </div>
  );
}
