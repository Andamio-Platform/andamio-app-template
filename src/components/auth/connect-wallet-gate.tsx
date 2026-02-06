"use client";

import { OnChainIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ConnectWalletPrompt } from "~/components/auth/connect-wallet-prompt";

interface ConnectWalletGateProps {
  /** Title displayed below the icon */
  title?: string;
  /** Subtitle displayed below the title */
  description?: string;
}

/**
 * Full-page centered "Connect your wallet" screen.
 *
 * Use this as the standard auth gate for any page that requires
 * wallet connection. Renders a centered icon, title, description,
 * and the CardanoWallet button.
 */
export function ConnectWalletGate({
  title = "Connect your wallet",
  description = "Sign in to continue",
}: ConnectWalletGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <OnChainIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
      <AndamioText className="text-lg font-medium">{title}</AndamioText>
      <AndamioText variant="small" className="mt-1 mb-6">
        {description}
      </AndamioText>
      <ConnectWalletPrompt />
    </div>
  );
}
