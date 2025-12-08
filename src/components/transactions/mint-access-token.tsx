/**
 * MintAccessToken Component
 *
 * UI for minting a new Andamio Access Token NFT.
 * Demonstrates the full transaction flow using transaction components.
 */

"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useTransaction } from "~/hooks/use-transaction";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { Key, Sparkles } from "lucide-react";
import { env } from "~/env";
import { storeJWT } from "~/lib/andamio-auth";
import { toast } from "sonner";
import type { MintAccessTokenParams } from "~/types/transaction";

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
  const { user, isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction<MintAccessTokenParams>();
  const [alias, setAlias] = useState("");

  const aliasError = alias.trim() && !isValidAlias(alias.trim())
    ? "Alias can only contain letters, numbers, and underscores"
    : null;

  const handleMint = async () => {
    if (!user?.cardanoBech32Addr || !alias.trim()) {
      return;
    }

    await execute({
      endpoint: "/tx/v2/general/mint-access-token",
      method: "POST",
      params: {
        walletData: user.cardanoBech32Addr,
        alias: alias.trim(),
      },
      txType: "MINT_ACCESS_TOKEN",
      onSuccess: async (txResult) => {
        console.log("[MintAccessToken] Success!", txResult);

        // Update the user's access token alias in the database
        try {
          const response = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user/update-alias`,
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
    <AndamioCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Key className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Get Your Access Token</AndamioCardTitle>
            <AndamioCardDescription>
              Your unique Andamio identity on the Cardano blockchain
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Info Section */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                An Andamio Access Token is your on-chain identity. It allows you to enroll in courses,
                track your learning progress, and earn credentials on the Cardano blockchain.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <AndamioBadge variant="secondary" className="text-xs">Unique Alias</AndamioBadge>
                <AndamioBadge variant="secondary" className="text-xs">On-Chain Identity</AndamioBadge>
                <AndamioBadge variant="secondary" className="text-xs">Course Enrollment</AndamioBadge>
              </div>
            </div>
          </div>
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
            <p className="text-xs text-destructive">{aliasError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Letters, numbers, and underscores only. This will be your unique identifier on Andamio.
            </p>
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
