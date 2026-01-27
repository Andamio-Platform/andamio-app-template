/**
 * ProjectCredentialClaim Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for contributors to claim credential tokens after completing project tasks.
 * Uses PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM transaction type with gateway auto-confirmation.
 *
 * This transaction has no additional database side effects because:
 * 1. By the time a contributor claims credentials, all task completions have already been recorded.
 * 2. The credential token itself IS the proof of completion.
 * 3. Credential ownership is verified via blockchain queries, not database lookups.
 *
 * The gateway still tracks the transaction for analytics and state updates.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-watcher.ts
 */

"use client";

import React from "react";
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
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CredentialIcon, ShieldIcon, ProjectIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface ProjectCredentialClaimProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Contributor state ID (56 char hex)
   */
  contributorStateId: string;

  /**
   * Project title for display
   */
  projectTitle?: string;

  /**
   * Callback fired when claim is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * ProjectCredentialClaim - Contributor UI for claiming project credentials (V2)
 *
 * This is the culmination of the contribution journey - a tamper-evident,
 * on-chain proof of achievement.
 *
 * @example
 * ```tsx
 * <ProjectCredentialClaim
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   projectTitle="Bounty Program"
 *   onSuccess={() => refetchCredentials()}
 * />
 * ```
 */
export function ProjectCredentialClaim({
  projectNftPolicyId,
  contributorStateId,
  projectTitle,
  onSuccess,
}: ProjectCredentialClaimProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "confirmed" || status.state === "updated") {
          console.log("[ProjectCredentialClaim] TX confirmed and tracked by gateway");

          toast.success("Credentials Claimed!", {
            description: projectTitle
              ? `You've earned your credentials from ${projectTitle}`
              : "Your project credentials have been minted",
          });

          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Claim Failed", {
            description: status.last_error ?? "Transaction failed on-chain. Please try again.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM;

  const handleClaim = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    await execute({
      txType: "PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM",
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
      },
      onSuccess: async (txResult) => {
        console.log("[ProjectCredentialClaim] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[ProjectCredentialClaim] Error:", txError);
        toast.error("Claim Failed", {
          description: txError.message || "Failed to claim credentials",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <CredentialIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Claim Project Credentials</AndamioCardTitle>
            <AndamioCardDescription>
              Mint your credential tokens for completed tasks
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Project Info */}
        {projectTitle && (
          <div className="flex flex-wrap items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              <ProjectIcon className="h-3 w-3 mr-1" />
              {projectTitle}
            </AndamioBadge>
          </div>
        )}

        {/* What You're Getting */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <ShieldIcon className="h-4 w-4 text-primary" />
            <AndamioText className="font-medium">On-Chain Credentials</AndamioText>
          </div>
          <AndamioText variant="small" className="text-xs">
            Native Cardano tokens that serve as permanent, verifiable proof of your contributions
            and achievements in this project.
          </AndamioText>
        </div>

        {/* Transaction Status - Only show during processing */}
        {state !== "idle" && !txConfirmed && (
          <TransactionStatus
            state={state}
            result={result}
            error={error?.message ?? null}
            onRetry={() => reset()}
            messages={{
              success: "Transaction submitted! Waiting for confirmation...",
            }}
          />
        )}

        {/* Gateway Confirmation Status */}
        {state === "success" && result?.requiresDBUpdate && !txConfirmed && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
              <div className="flex-1">
                <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Processing credential mint"}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {txConfirmed && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-center gap-3">
              <SuccessIcon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <AndamioText className="font-medium text-primary">
                  Credentials Claimed Successfully!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  Your credential tokens have been minted to your wallet
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Claim Button */}
        {state !== "success" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleClaim}
            disabled={!hasAccessToken}
            stateText={{
              idle: ui.buttonText,
              fetching: "Preparing Claim...",
              signing: "Sign in Wallet",
              submitting: "Minting Credentials...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
