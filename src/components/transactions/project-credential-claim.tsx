/**
 * ProjectCredentialClaim Transaction Component (V2)
 *
 * UI for contributors to claim credential tokens after completing project tasks.
 * Uses PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM transaction definition.
 *
 * This transaction has no database side effects because:
 * 1. By the time a contributor claims credentials, all task completions have already been recorded.
 * 2. The credential token itself IS the proof of completion.
 * 3. Credential ownership is verified via blockchain queries, not database lookups.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/contributor/credential-claim.ts
 */

"use client";

import React from "react";
import { PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM } from "@andamio/transactions";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useAndamioTransaction } from "~/hooks/use-andamio-transaction";
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
import { CredentialIcon, ShieldIcon, ProjectIcon } from "~/components/icons";
import { toast } from "sonner";

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
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const handleClaim = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    await execute({
      definition: PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
      },
      onSuccess: async (txResult) => {
        console.log("[ProjectCredentialClaim] Success!", txResult);

        toast.success("Credentials Claimed!", {
          description: projectTitle
            ? `You've earned your credentials from ${projectTitle}`
            : "Your project credentials have been minted",
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        await onSuccess?.();
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
            <CredentialIcon className="h-5 w-5 text-success" />
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

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => reset()}
            messages={{
              success: "Your credentials have been minted to your wallet!",
            }}
          />
        )}

        {/* Claim Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleClaim}
            disabled={!hasAccessToken}
            stateText={{
              idle: "Claim Credentials",
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
