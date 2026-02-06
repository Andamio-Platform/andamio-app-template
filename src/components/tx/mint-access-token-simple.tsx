/**
 * MintAccessToken Component (Simplified)
 *
 * UI for minting a new Andamio Access Token NFT.
 * Uses the simplified transaction hook with gateway auto-confirmation.
 *
 * ## TX Lifecycle
 *
 * 1. User enters alias and clicks "Mint"
 * 2. `useTransaction` builds, signs, submits, and registers TX
 * 3. `useTxStream` polls gateway for confirmation status
 * 4. When status is "updated", gateway has completed DB updates
 * 5. **Celebration flow begins** - session cleared, user re-authenticates
 * 6. User is welcomed with their new on-chain identity
 *
 * ## Post-Mint Ceremony
 *
 * After TX confirmation, the component transitions to a celebration state:
 * - Clears the session (forces re-auth with new access token)
 * - Shows celebration UI with confetti
 * - Guides user through re-authentication
 * - Welcomes them to Andamio with their new identity
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useWallet, CardanoWallet } from "@meshsdk/react";
import { useTheme } from "next-themes";
import { core } from "@meshsdk/core";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AccessTokenIcon,
  ShieldIcon,
  LoadingIcon,
  SuccessIcon,
  InfoIcon,
  CelebrateIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { storeJWT } from "~/lib/andamio-auth";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import { useUpdateAccessTokenAlias } from "~/hooks/api/use-user";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { env } from "~/env";

// Web3 Services config for CardanoWallet component
const WEB3_SERVICES_CONFIG = {
  networkId: 0,
  projectId: "13ff4981-bdca-4aad-ba9a-41fe1018fdb0",
} as const;

export interface MintAccessTokenSimpleProps {
  /**
   * Callback fired when access token is successfully minted AND user has
   * re-authenticated with their new token. This is the final success state.
   */
  onSuccess?: () => void | Promise<void>;
  /**
   * Callback fired after TX is submitted, with the alias and txHash.
   * Useful for parent components that need to track the submission
   * (e.g., showing TX status or the first-login ceremony).
   */
  onSubmitted?: (info: { alias: string; txHash: string }) => void;
  /**
   * If true, skips the inline ceremony and just shows the mint form.
   * Parent component is responsible for handling the ceremony (e.g., FirstLoginCard).
   * Default: false (inline ceremony is shown)
   */
  skipCeremony?: boolean;
}

/**
 * Ceremony states for the post-mint flow
 */
type CeremonyState =
  | "minting"           // Default: user is filling out the form or TX in progress
  | "confirming"        // TX submitted, waiting for on-chain confirmation
  | "celebration"       // TX confirmed! Show celebration, then clear session
  | "reconnecting"      // Session cleared, waiting for wallet reconnect
  | "authenticating"    // Wallet connected, authenticating
  | "welcome";          // Re-authenticated with new token, welcome message

// Alias must contain only alphanumeric characters and underscores
const ALIAS_PATTERN = /^[a-zA-Z0-9_]+$/;

function isValidAlias(alias: string): boolean {
  return alias.length > 0 && ALIAS_PATTERN.test(alias);
}

/**
 * MintAccessTokenSimple - Simplified version using new transaction hook
 *
 * @example
 * ```tsx
 * <MintAccessTokenSimple onSuccess={() => router.refresh()} />
 * ```
 */
export function MintAccessTokenSimple({ onSuccess, onSubmitted, skipCeremony = false }: MintAccessTokenSimpleProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();
  const { wallet, connected } = useWallet();
  const {
    user,
    isAuthenticated,
    isAuthenticating,
    authError,
    refreshAuth,
    logout,
  } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();
  const updateAlias = useUpdateAccessTokenAlias();
  const [alias, setAlias] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Ceremony state management
  const [ceremonyState, setCeremonyState] = useState<CeremonyState>("minting");
  const [confirmedAlias, setConfirmedAlias] = useState<string>("");
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);

  // Handle theme for CardanoWallet component
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  // Check for pending alias from registration flow (stored in localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const pendingAlias = localStorage.getItem("andamio_pending_alias");
      if (pendingAlias) {
        setAlias(pendingAlias);
        localStorage.removeItem("andamio_pending_alias");
      }
    }
  }, []);

  // Get wallet address from connected wallet (converted to bech32)
  useEffect(() => {
    if (!connected || !wallet) {
      setWalletAddress(null);
      return;
    }

    void (async () => {
      try {
        const addresses = await wallet.getUsedAddresses();
        let rawAddress = addresses[0];

        if (!rawAddress) {
          // Fallback to change address
          rawAddress = await wallet.getChangeAddress();
        }

        if (!rawAddress) {
          setWalletAddress(null);
          return;
        }

        // Convert to bech32 if needed (some wallets return hex format)
        let bech32Address = rawAddress;
        if (!rawAddress.startsWith("addr")) {
          try {
            const addressObj = core.Address.fromString(rawAddress);
            if (addressObj) {
              bech32Address = addressObj.toBech32();
              console.log("[MintAccessTokenSimple] Converted hex to bech32:", bech32Address.slice(0, 20) + "...");
            }
          } catch (convErr) {
            console.error("[MintAccessTokenSimple] Failed to convert address:", convErr);
          }
        }

        setWalletAddress(bech32Address);
      } catch (err) {
        console.error("[MintAccessTokenSimple] Failed to get wallet address:", err);
        setWalletAddress(null);
      }
    })();
  }, [connected, wallet]);

  // Watch for gateway confirmation after TX submission
  // Tracks on-chain confirmation via SSE (pending → confirmed → updated)
  const { status: txStatus, isSuccess: txConfirmed, isFailed: txFailed } = useTxStream(
    (result?.requiresDBUpdate || result?.requiresOnChainConfirmation) ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[MintAccessTokenSimple] TX confirmed and DB updated by gateway");

          if (skipCeremony) {
            // Parent handles ceremony - just refresh and callback
            refreshAuth();
            toast.success("Access Token Confirmed!", {
              description: `Your alias "${alias}" is now live on-chain!`,
            });
            void onSuccess?.();
          } else {
            // Transition to celebration state
            setCeremonyState("celebration");
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Transaction Processing Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // For pure on-chain TXs with no tracking at all, treat submission as success
  // TXs with requiresOnChainConfirmation wait for gateway confirmation instead
  const isPureOnChainSuccess = state === "success" && result && !result.requiresDBUpdate && !result.requiresOnChainConfirmation;

  // Track if we've already handled the success to prevent infinite loop
  const hasHandledSuccessRef = React.useRef(false);

  // Handle pure on-chain TX success (e.g., Access Token Mint)
  useEffect(() => {
    if (isPureOnChainSuccess && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true;
      console.log("[MintAccessTokenSimple] Pure on-chain TX submitted successfully");

      if (skipCeremony) {
        // Parent handles ceremony
        refreshAuth();
        void onSuccess?.();
      } else {
        // Transition to celebration state
        setCeremonyState("celebration");
      }
    }
  }, [isPureOnChainSuccess, refreshAuth, onSuccess, skipCeremony]);

  // Reset the ref when state goes back to idle (for subsequent mints)
  useEffect(() => {
    if (state === "idle") {
      hasHandledSuccessRef.current = false;
    }
  }, [state]);

  // Track ceremony state transitions based on auth state
  useEffect(() => {
    if (ceremonyState === "reconnecting") {
      if (isAuthenticating) {
        setCeremonyState("authenticating");
      } else if (isAuthenticated && user?.accessTokenAlias) {
        setCeremonyState("welcome");
      }
    } else if (ceremonyState === "authenticating") {
      if (isAuthenticated && user?.accessTokenAlias) {
        setCeremonyState("welcome");
      } else if (!isAuthenticating && authError) {
        // Auth failed - stay in reconnecting state to retry
        setCeremonyState("reconnecting");
      }
    }
  }, [ceremonyState, isAuthenticating, isAuthenticated, user?.accessTokenAlias, authError]);

  // After welcome state, redirect to dashboard after a delay
  useEffect(() => {
    if (ceremonyState === "welcome") {
      const timer = setTimeout(() => {
        void onSuccess?.();
        router.push("/dashboard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [ceremonyState, onSuccess, router]);

  // Handle the "Sign In" button click - clears session and triggers re-auth
  const handleStartReauth = useCallback(() => {
    setCeremonyState("reconnecting");
    logout();
  }, [logout]);

  // Get explorer URL for the transaction
  const explorerUrl = confirmedTxHash
    ? getTransactionExplorerUrl(confirmedTxHash, env.NEXT_PUBLIC_CARDANO_NETWORK)
    : null;

  // Get UI config from centralized config
  const ui = TRANSACTION_UI.GLOBAL_GENERAL_ACCESS_TOKEN_MINT;

  const aliasError =
    alias.trim() && !isValidAlias(alias.trim())
      ? "Alias can only contain letters, numbers, and underscores"
      : null;

  const handleMint = async () => {
    if (!walletAddress || !alias.trim()) {
      console.log("[MintAccessTokenSimple] Cannot mint - walletAddress:", walletAddress, "alias:", alias.trim());
      return;
    }

    // Store the alias for the ceremony
    const mintingAlias = alias.trim();
    setConfirmedAlias(mintingAlias);
    setCeremonyState("minting");

    await execute({
      txType: "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
      params: {
        initiator_data: walletAddress,
        alias: mintingAlias,
      },
      onSuccess: async (txResult) => {
        // Store TX hash for ceremony (explorer link)
        setConfirmedTxHash(txResult.txHash);

        // Notify parent of submission (for TX tracking / first-login ceremony)
        onSubmitted?.({ alias: mintingAlias, txHash: txResult.txHash });

        // Transition to confirming state
        setCeremonyState("confirming");

        // Optimistically update the alias in the database for immediate use
        // The gateway will also update it on confirmation, but this gives instant feedback
        try {
          const aliasResult = await updateAlias.mutateAsync({ alias: mintingAlias });
          if (aliasResult) {
            // Store the new JWT with updated alias
            storeJWT(aliasResult.jwt);
            refreshAuth();
          }
        } catch (dbError) {
          console.error("[MintAccessTokenSimple] Optimistic update failed:", dbError);
          // Non-critical - gateway will handle on confirmation
        }
      },
      onError: (txError) => {
        console.error("[MintAccessTokenSimple] Transaction error:", txError);
        // Error toast already shown by hook
      },
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // CEREMONY STATES - Show celebration flow after TX confirmation
  // ═══════════════════════════════════════════════════════════════════════════

  // ── WELCOME: Re-authenticated with new token ──
  if (ceremonyState === "welcome" && user?.accessTokenAlias) {
    return (
      <AndamioCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <AndamioCardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <SuccessIcon className="h-10 w-10 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">Welcome to Andamio!</AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
            You&apos;re now signed in as{" "}
            <span className="font-mono font-semibold text-foreground">{user.accessTokenAlias}</span>
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-4 gap-3">
            <LoadingIcon className="h-6 w-6 animate-spin text-primary" />
            <AndamioText variant="muted">Redirecting to your dashboard...</AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── AUTHENTICATING: Wallet connected, signing in ──
  if (ceremonyState === "authenticating") {
    return (
      <AndamioCard>
        <AndamioCardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-xl">Signing In...</AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center">
            Authenticating with your new access token
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center justify-center py-4">
            <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── RECONNECTING: Session cleared, waiting for wallet ──
  if (ceremonyState === "reconnecting") {
    return (
      <AndamioCard>
        <AndamioCardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-8 w-8 text-primary" />
          </div>
          <AndamioCardTitle className="text-xl">
            Sign In as {confirmedAlias}
          </AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center">
            Connect your wallet to authenticate with your new access token.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {authError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AndamioText variant="small" className="text-destructive">
                {authError}
              </AndamioText>
            </div>
          )}
          <CardanoWallet isDark={isDark} web3Services={WEB3_SERVICES_CONFIG} />
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <AndamioText variant="small" className="text-muted-foreground">
              Once connected, you&apos;ll be signed in automatically with your new on-chain identity.
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ── CELEBRATION: TX confirmed! Show the special moment ──
  if (ceremonyState === "celebration") {
    return (
      <AndamioCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <AndamioCardHeader className="text-center pb-2 relative">
          {/* Celebration confetti effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/4 text-2xl animate-bounce" style={{ animationDelay: "0ms" }}>🎉</div>
            <div className="absolute top-2 right-1/4 text-2xl animate-bounce" style={{ animationDelay: "150ms" }}>✨</div>
            <div className="absolute top-4 left-1/3 text-xl animate-bounce" style={{ animationDelay: "300ms" }}>🎊</div>
            <div className="absolute top-1 right-1/3 text-xl animate-bounce" style={{ animationDelay: "450ms" }}>⭐</div>
          </div>

          <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 relative z-10">
            <CelebrateIcon className="h-10 w-10 text-primary" />
          </div>
          <AndamioCardTitle className="text-2xl">
            Access Token Confirmed!
          </AndamioCardTitle>
          <AndamioCardDescription className="mx-auto max-w-sm text-center text-base">
            Your alias{" "}
            <span className="font-mono font-semibold text-foreground">{confirmedAlias}</span>{" "}
            is now live on-chain.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-5">
          {/* The ceremony message */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 text-center space-y-2">
            <AndamioText className="font-semibold text-lg">
              This is a special moment.
            </AndamioText>
            <AndamioText variant="muted">
              You are about to use your new access token to authenticate to Andamio for the first time.
            </AndamioText>
          </div>

          {/* Sign In button */}
          <AndamioButton onClick={handleStartReauth} size="lg" className="w-full">
            <AccessTokenIcon className="h-5 w-5" />
            Sign In with Your Access Token
          </AndamioButton>

          {/* Explanation */}
          <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <AndamioText variant="small" className="text-muted-foreground">
              This will reconnect your wallet and sign in with your new on-chain identity.
            </AndamioText>
          </div>

          {/* Explorer link */}
          {explorerUrl && (
            <div className="flex items-center justify-center">
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View transaction on explorer
                <ExternalLinkIcon className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DEFAULT: Minting form and TX progress
  // ═══════════════════════════════════════════════════════════════════════════

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <AccessTokenIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>Mint your unique on-chain identity</AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* What You're Getting */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-primary" />
            <AndamioText className="font-medium">On-Chain Identity</AndamioText>
          </div>
          <AndamioText variant="small" className="text-xs">
            {ui.description[0]}
          </AndamioText>
        </div>

        {/* Alias Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="alias-simple">Choose Your Alias</AndamioLabel>
          <AndamioInput
            id="alias-simple"
            type="text"
            placeholder="my_unique_alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
            className={`font-mono ${aliasError ? "border-destructive" : ""}`}
          />
          {aliasError ? (
            <AndamioText variant="small" className="text-xs text-destructive">
              {aliasError}
            </AndamioText>
          ) : (
            <AndamioText variant="small" className="text-xs">
              Letters, numbers, and underscores only. This will be your unique identifier.
            </AndamioText>
          )}
        </div>

        {/* Transaction Status (only show during processing) */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error?.message ?? null}
            onRetry={() => reset()}
            messages={{
              success: (result?.requiresDBUpdate || result?.requiresOnChainConfirmation)
                ? "Transaction submitted! Waiting for confirmation..."
                : "Transaction submitted to blockchain!",
            }}
          />
        )}

        {/* Gateway Confirmation Status */}
        {state === "success" && (result?.requiresDBUpdate || result?.requiresOnChainConfirmation) && !txConfirmed && !txFailed && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
              <div className="flex-1">
                <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Finalizing..."}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* TX Failed */}
        {txFailed && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <AndamioText className="font-medium text-destructive">
                  Transaction Failed
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.last_error ?? "Please try again."}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Mint Button */}
        {state !== "success" && !txConfirmed && ceremonyState === "minting" && (
          <TransactionButton
            txState={state}
            onClick={handleMint}
            disabled={!walletAddress || !alias.trim() || !!aliasError || state === "error"}
            stateText={{
              idle: !walletAddress ? "Loading wallet..." : ui.buttonText,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Minting on Blockchain...",
            }}
            leftIcon={state === "idle" ? <AccessTokenIcon className="h-5 w-5" /> : undefined}
            size="lg"
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
