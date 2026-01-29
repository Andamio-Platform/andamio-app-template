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
 * 3. `useTxWatcher` polls gateway for confirmation status
 * 4. When status is "updated", gateway has completed DB updates
 * 5. UI refreshes to show the new access token
 *
 * ## Key Differences from Original
 *
 * | Original | Simplified |
 * |----------|------------|
 * | Uses `useAndamioTransaction` | Uses `useTransaction` |
 * | Client-side Koios polling | Server-side gateway monitoring |
 * | Manual DB side effects | Gateway handles DB updates |
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-watcher.ts
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";
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
import { AccessTokenIcon, ShieldIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { storeJWT } from "~/lib/andamio-auth";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import { GATEWAY_API_BASE } from "~/lib/api-utils";

export interface MintAccessTokenSimpleProps {
  /**
   * Callback fired when access token is successfully minted
   */
  onSuccess?: () => void | Promise<void>;
}

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
export function MintAccessTokenSimple({ onSuccess }: MintAccessTokenSimpleProps) {
  const { wallet, connected } = useWallet();
  const { user, isAuthenticated, authenticatedFetch, refreshAuth } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();
  const [alias, setAlias] = useState("");
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Get wallet address from connected wallet
  useEffect(() => {
    if (!connected || !wallet) {
      setWalletAddress(null);
      return;
    }

    void (async () => {
      try {
        const addresses = await wallet.getUsedAddresses();
        if (addresses.length > 0) {
          setWalletAddress(addresses[0] ?? null);
        } else {
          // Fallback to change address
          const changeAddr = await wallet.getChangeAddress();
          setWalletAddress(changeAddr);
        }
      } catch (err) {
        console.error("[MintAccessTokenSimple] Failed to get wallet address:", err);
        setWalletAddress(null);
      }
    })();
  }, [connected, wallet]);

  // Watch for gateway confirmation after TX submission (only for TXs that need DB updates)
  // Access Token Mint is pure on-chain, so we skip polling
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[MintAccessTokenSimple] TX confirmed and DB updated by gateway");

          // Refresh auth to get updated user state
          refreshAuth();

          // Show completion toast
          toast.success("Access Token Confirmed!", {
            description: `Your alias "${alias}" is now live on-chain!`,
          });

          // Call parent callback
          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Transaction Processing Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // For pure on-chain TXs (no DB updates), treat submission as success
  const isPureOnChainSuccess = state === "success" && result && !result.requiresDBUpdate;

  // Track if we've already handled the success to prevent infinite loop
  const hasHandledSuccessRef = React.useRef(false);

  // Handle pure on-chain TX success (e.g., Access Token Mint)
  useEffect(() => {
    if (isPureOnChainSuccess && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true;
      console.log("[MintAccessTokenSimple] Pure on-chain TX submitted successfully");

      // Refresh auth to detect the new token in wallet
      refreshAuth();

      // Call parent callback
      void onSuccess?.();
    }
  }, [isPureOnChainSuccess, refreshAuth, onSuccess]);

  // Reset the ref when state goes back to idle (for subsequent mints)
  useEffect(() => {
    if (state === "idle") {
      hasHandledSuccessRef.current = false;
    }
  }, [state]);

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

    await execute({
      txType: "GLOBAL_GENERAL_ACCESS_TOKEN_MINT",
      params: {
        initiator_data: walletAddress,
        alias: alias.trim(),
      },
      onSuccess: async () => {
        // Optimistically update the alias in the database for immediate use
        // The gateway will also update it on confirmation, but this gives instant feedback
        try {
          const response = await authenticatedFetch(
            `${GATEWAY_API_BASE}/user/access-token-alias`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ access_token_alias: alias.trim() }),
            }
          );

          if (response.ok) {
            const data = (await response.json()) as {
              success: boolean;
              user: {
                id: string;
                cardanoBech32Addr: string | null;
                accessTokenAlias: string | null;
              };
              jwt: string;
            };
            console.log("[MintAccessTokenSimple] Access token alias updated optimistically");

            // Store the new JWT with updated alias
            storeJWT(data.jwt);
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

        {/* Transaction Status (only show during processing, not for final success) */}
        {state !== "idle" && !isPureOnChainSuccess && !txConfirmed && (
          <TransactionStatus
            state={state}
            result={result}
            error={error?.message ?? null}
            onRetry={() => reset()}
            messages={{
              success: result?.requiresDBUpdate
                ? "Transaction submitted! Waiting for confirmation..."
                : "Transaction submitted to blockchain!",
            }}
          />
        )}

        {/* Gateway Confirmation Status (only for TXs that need DB updates) */}
        {state === "success" && result?.requiresDBUpdate && !txConfirmed && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
              <div className="flex-1">
                <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Processing database updates"}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Success - Pure on-chain TX or gateway confirmed */}
        {(isPureOnChainSuccess || txConfirmed) && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <SuccessIcon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <AndamioText className="font-medium text-primary">
                  Access Token Minted!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  Your alias &quot;{alias}&quot; is now live on-chain. Refresh to see your updated profile.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Mint Button */}
        {state !== "success" && !txConfirmed && !isPureOnChainSuccess && (
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
