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
import { Coins } from "lucide-react";
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
export function MintAccessToken({ onSuccess }: MintAccessTokenProps) {
  const { user, isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction<MintAccessTokenParams>();
  const [alias, setAlias] = useState("");

  const handleMint = async () => {
    if (!user?.cardanoBech32Addr || !alias.trim()) {
      return;
    }

    await execute({
      endpoint: "/tx/access-token/mint",
      method: "GET", // NBA endpoint uses GET with query parameters
      params: {
        user_address: user.cardanoBech32Addr,
        new_alias: alias.trim(),
      },
      onSuccess: async (result) => {
        console.log("[MintAccessToken] Success!", result);

        // Update the user's access token alias in the database
        try {
          const response = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user/access-token-alias`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessTokenAlias: alias.trim(),
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
        } catch (error) {
          console.error("Error updating access token alias:", error);
          // Don't fail the transaction if database update fails
        }

        // Show success toast
        toast.success("Access Token Minted!", {
          description: `Your alias "${alias}" has been registered on-chain`,
          action: result.txHash && result.blockchainExplorerUrl ? {
            label: "View Transaction",
            onClick: () => window.open(result.blockchainExplorerUrl, "_blank"),
          } : undefined,
        });

        // Call the parent's onSuccess callback
        await onSuccess?.();
      },
      onError: (error) => {
        console.error("[MintAccessToken] Error:", error);

        // Show error toast
        toast.error("Minting Failed", {
          description: error.message || "Failed to mint access token",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            <AndamioCardTitle>Mint Access Token</AndamioCardTitle>
          </div>
          <AndamioCardDescription>
            Connect your wallet to mint an access token
          </AndamioCardDescription>
        </AndamioCardHeader>
      </AndamioCard>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          <AndamioCardTitle>Mint Access Token</AndamioCardTitle>
        </div>
        <AndamioCardDescription>
          Create your unique Andamio identity on the Cardano blockchain
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Alias Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="alias">Choose Your Alias</AndamioLabel>
          <AndamioInput
            id="alias"
            type="text"
            placeholder="my-unique-alias"
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
            className="font-mono"
          />
          <p className="text-xs text-muted-foreground">
            This will be your unique identifier on Andamio. Choose wisely!
          </p>
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
            disabled={!alias.trim() || state === "error"}
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
