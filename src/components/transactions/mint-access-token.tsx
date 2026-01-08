/**
 * MintAccessToken Component
 *
 * UI for minting a new Andamio Access Token NFT.
 * Uses GENERAL_ACCESS_TOKEN_MINT transaction definition from @andamio/transactions.
 *
 * @see packages/andamio-transactions/src/definitions/v2/general/access-token-mint.ts
 */

"use client";

import React, { useState } from "react";
import { GENERAL_ACCESS_TOKEN_MINT } from "@andamio/transactions";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useTransaction } from "~/hooks/use-transaction";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AccessTokenIcon, ShieldIcon } from "~/components/icons";
import { env } from "~/env";
import { storeJWT } from "~/lib/andamio-auth";
import { toast } from "sonner";

export interface MintAccessTokenProps {
  /**
   * Callback fired when access token is successfully minted
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * MintAccessToken - Full UI for minting access token transaction
 *
 * @example
 * ```tsx
 * <MintAccessToken onSuccess={() => router.refresh()} />
 * ```
 */
// Alias must contain only alphanumeric characters and underscores
const ALIAS_PATTERN = /^[a-zA-Z0-9_]+$/;

function isValidAlias(alias: string): boolean {
  return alias.length > 0 && ALIAS_PATTERN.test(alias);
}

export function MintAccessToken({ onSuccess }: MintAccessTokenProps) {
  const { user, isAuthenticated, authenticatedFetch, refreshAuth } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();
  const [alias, setAlias] = useState("");

  const aliasError = alias.trim() && !isValidAlias(alias.trim())
    ? "Alias can only contain letters, numbers, and underscores"
    : null;

  const handleMint = async () => {
    if (!user?.cardanoBech32Addr || !alias.trim()) {
      return;
    }

    // Use endpoint and txType from GENERAL_ACCESS_TOKEN_MINT definition
    const endpoint = GENERAL_ACCESS_TOKEN_MINT.buildTxConfig.builder.endpoint!;

    await execute({
      endpoint,
      method: "POST",
      params: {
        initiator_data: user.cardanoBech32Addr,
        alias: alias.trim(),
      },
      txType: GENERAL_ACCESS_TOKEN_MINT.txType,
      onSuccess: async (txResult) => {
        console.log("[MintAccessToken] Success!", txResult);

        // Update the user's access token alias in the database
        try {
          const response = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/access-token/update-alias`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                access_token_alias: alias.trim(),
              }),
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
            console.log("✅ Access token alias updated in database");

            // Store the new JWT with updated alias
            storeJWT(data.jwt);
            console.log("✅ JWT updated with access token alias");

            // Refresh auth context state to reflect the new access token
            refreshAuth();
            console.log("✅ Auth context refreshed");
          } else {
            console.error("Failed to update access token alias:", await response.text());
          }
        } catch (dbError) {
          console.error("Error updating access token alias:", dbError);
          // Don't fail the transaction if database update fails
        }

        // Show success toast
        toast.success("Access Token Minted!", {
          description: `Your alias "${alias}" has been registered on-chain`,
          action: txResult.txHash && txResult.blockchainExplorerUrl ? {
            label: "View Transaction",
            onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
          } : undefined,
        });

        // Call the parent's onSuccess callback
        await onSuccess?.();
      },
      onError: (txError) => {
        console.error("[MintAccessToken] Error:", txError);

        // Show error toast
        toast.error("Minting Failed", {
          description: txError.message || "Failed to mint access token",
        });
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
            <AndamioCardTitle>Get Your Access Token</AndamioCardTitle>
            <AndamioCardDescription>
              Mint your unique on-chain identity
            </AndamioCardDescription>
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
            Your access token enables course enrollment, progress tracking, and credential earning on Cardano.
          </AndamioText>
        </div>

        {/* Alias Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="alias">Choose Your Alias</AndamioLabel>
          <AndamioInput
            id="alias"
            type="text"
            placeholder="my_unique_alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
            className={`font-mono ${aliasError ? "border-destructive" : ""}`}
          />
          {aliasError ? (
            <AndamioText variant="small" className="text-xs text-destructive">{aliasError}</AndamioText>
          ) : (
            <AndamioText variant="small" className="text-xs">
              Letters, numbers, and underscores only. This will be your unique identifier on Andamio.
            </AndamioText>
          )}
        </div>

        {/* Transaction Status - Always show when not idle */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => {
              reset();
            }}
            messages={{
              success: `Your alias "${alias}" has been minted and is now registered on-chain!`,
            }}
          />
        )}

        {/* Mint Button - Hide after success */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleMint}
            disabled={!alias.trim() || !!aliasError || state === "error"}
            stateText={{
              idle: "Mint Access Token",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Minting on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
