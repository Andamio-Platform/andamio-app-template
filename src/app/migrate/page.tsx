"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { ConnectWalletButton } from "~/components/auth/connect-wallet-button";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "~/components/tx/transaction-button";
import { TransactionStatus } from "~/components/tx/transaction-status";
import { extractAliasFromUnit } from "~/lib/access-token-utils";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { env } from "~/env";
import {
  AccessTokenIcon,
  SuccessIcon,
  LoadingIcon,
  ExternalLinkIcon,
  AlertIcon,
  ForwardIcon,
} from "~/components/icons";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardFooter,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioButton } from "~/components/andamio/andamio-button";

// V1 access token policy ID
const V1_POLICY_ID = "c76c35088ac826c8a0e6947c8ff78d8d4495789bc729419b3a334305";

type MigrateState = "no-wallet" | "scanning" | "no-token" | "ready" | "success";

export default function MigratePage() {
  const router = useRouter();
  const { wallet, connected } = useWallet();

  const [migrateState, setMigrateState] = React.useState<MigrateState>("no-wallet");
  const [detectedAlias, setDetectedAlias] = React.useState<string | null>(null);

  const { execute, state: txState, result, error, reset } = useTransaction();
  const { isSuccess: streamSuccess } = useTxStream(result?.txHash ?? null);

  // Scan wallet for V1 token when connected
  React.useEffect(() => {
    if (!connected || !wallet) {
      setMigrateState("no-wallet");
      setDetectedAlias(null);
      return;
    }

    let cancelled = false;

    async function scanForV1Token() {
      setMigrateState("scanning");
      try {
        const assets = await wallet.getAssets();
        const v1Asset = assets.find((asset: { unit: string }) =>
          asset.unit.startsWith(V1_POLICY_ID)
        );

        if (cancelled) return;

        if (v1Asset) {
          const alias = extractAliasFromUnit(v1Asset.unit, V1_POLICY_ID, 3);
          setDetectedAlias(alias);
          setMigrateState("ready");
        } else {
          setDetectedAlias(null);
          setMigrateState("no-token");
        }
      } catch (err) {
        console.error("[Migrate] Failed to scan wallet assets:", err);
        if (!cancelled) {
          setMigrateState("no-token");
        }
      }
    }

    void scanForV1Token();
    return () => {
      cancelled = true;
    };
  }, [connected, wallet]);

  // Move to success state when TX succeeds
  React.useEffect(() => {
    if (txState === "success") {
      setMigrateState("success");
    }
  }, [txState]);

  const handleClaim = async () => {
    if (!detectedAlias) return;
    await execute({
      txType: "GLOBAL_USER_ACCESS_TOKEN_CLAIM",
      params: { alias: detectedAlias },
    });
  };

  const explorerUrl = result?.txHash
    ? getTransactionExplorerUrl(result.txHash, env.NEXT_PUBLIC_CARDANO_NETWORK)
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center overflow-auto bg-background p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Header - hidden on success since the card has its own celebratory header */}
        {migrateState !== "success" && (
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <AccessTokenIcon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Migrate to V2
            </h1>
            <AndamioText variant="muted">
              Claim your V2 access token using your existing V1 token
            </AndamioText>
          </div>
        )}

        {/* State: No wallet connected */}
        {migrateState === "no-wallet" && (
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Connect Your Wallet</AndamioCardTitle>
              <AndamioCardDescription>
                Connect the wallet that holds your V1 access token to begin the migration.
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <div className="flex justify-center">
                <ConnectWalletButton />
              </div>
            </AndamioCardContent>
          </AndamioCard>
        )}

        {/* State: Scanning wallet */}
        {migrateState === "scanning" && (
          <AndamioCard>
            <AndamioCardContent className="py-8">
              <div className="flex flex-col items-center gap-3">
                <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
                <AndamioText variant="muted">
                  Scanning wallet for V1 access token...
                </AndamioText>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        )}

        {/* State: No V1 token found */}
        {migrateState === "no-token" && (
          <AndamioCard>
            <AndamioCardHeader>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <AlertIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <AndamioCardTitle className="text-center">
                No V1 Token Found
              </AndamioCardTitle>
              <AndamioCardDescription className="mx-auto max-w-sm text-center">
                No V1 access token was detected in this wallet.
                Make sure you connected the correct wallet.
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardFooter className="justify-center">
              <AndamioText variant="small">
                If you don&apos;t have a V1 token, you can mint a new V2 token from the home page.
              </AndamioText>
            </AndamioCardFooter>
          </AndamioCard>
        )}

        {/* State: V1 token found, ready to claim */}
        {migrateState === "ready" && (
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>V1 Token Detected</AndamioCardTitle>
              <AndamioCardDescription>
                Your V1 access token was found. Claim your V2 token to continue using the platform.
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <AndamioText variant="small" className="text-muted-foreground">
                  Alias
                </AndamioText>
                <p className="mt-1 font-mono text-lg font-semibold">
                  {detectedAlias}
                </p>
              </div>

              <TransactionButton
                txState={txState}
                onClick={handleClaim}
                stateText={{ idle: "Claim V2 Access Token" }}
                className="w-full"
              />

              <TransactionStatus
                state={txState}
                result={result ? { ...result, success: result.success } : null}
                error={error?.message}
                onRetry={reset}
              />
            </AndamioCardContent>
          </AndamioCard>
        )}

        {/* State: TX success */}
        {migrateState === "success" && (
          <AndamioCard>
            <AndamioCardHeader className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <SuccessIcon className="h-8 w-8 text-primary" />
              </div>
              <AndamioCardTitle className="text-2xl">
                Welcome to Andamio V2!
              </AndamioCardTitle>
              <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
                Your migration is complete. Your V2 access token is now in your wallet.
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              {/* Alias confirmation */}
              {detectedAlias && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-center">
                  <AndamioText variant="small" className="text-muted-foreground">
                    Your alias
                  </AndamioText>
                  <p className="mt-1 font-mono text-lg font-semibold text-primary">
                    {detectedAlias}
                  </p>
                </div>
              )}

              {/* Transaction status */}
              {streamSuccess ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-center">
                  <AndamioText variant="small" className="font-medium text-primary">
                    Transaction confirmed on-chain
                  </AndamioText>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/30 p-3 text-center">
                  <AndamioText variant="small" className="text-muted-foreground">
                    Waiting for on-chain confirmation...
                  </AndamioText>
                </div>
              )}

              {/* Explorer link */}
              {explorerUrl && (
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  View transaction on explorer
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              )}

              {/* Next steps */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                <AndamioText variant="small" className="font-medium">
                  Next step
                </AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Log in with your wallet to start using Andamio V2. Your alias and credentials will be available once you sign in.
                </AndamioText>
              </div>

              <AndamioButton
                className="w-full"
                onClick={() => router.push("/")}
                rightIcon={<ForwardIcon className="h-4 w-4" />}
              >
                Continue to Login
              </AndamioButton>
            </AndamioCardContent>
          </AndamioCard>
        )}
      </div>
    </div>
  );
}
