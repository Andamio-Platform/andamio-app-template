/**
 * CredentialClaim Transaction Component (V2)
 *
 * Elegant UI for students to claim their credential token after completing
 * all required assignments for a course module.
 *
 * This is the culmination of the learning journey - a tamper-evident,
 * on-chain proof of achievement.
 */

"use client";

import React from "react";
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
import { Award, Shield } from "lucide-react";
import { toast } from "sonner";
import { v2 } from "@andamio/transactions";
import { env } from "~/env";
import { buildAccessTokenUnit } from "~/lib/access-token-utils";

export interface CredentialClaimProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Module code for the credential being claimed
   */
  moduleCode: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Course title for display
   */
  courseTitle?: string;

  /**
   * Callback fired when claim is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * CredentialClaim - Student UI for claiming a course credential (V2)
 *
 * This transaction has no database side effects because:
 * 1. By the time a student claims a credential, all assignment commitments
 *    have already been completed and recorded via earlier transactions.
 * 2. The credential token itself IS the proof of completion.
 * 3. Credential ownership is verified via blockchain queries, not database lookups.
 *
 * @example
 * ```tsx
 * <CredentialClaim
 *   courseNftPolicyId="abc123..."
 *   moduleCode="MODULE_1"
 *   moduleTitle="Introduction to Cardano"
 *   courseTitle="Cardano Developer Course"
 *   onSuccess={() => refetchCredentials()}
 * />
 * ```
 */
export function CredentialClaim({
  courseNftPolicyId,
  moduleCode,
  moduleTitle,
  courseTitle,
  onSuccess,
}: CredentialClaimProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const handleClaim = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    // Build user access token
    const userAccessToken = buildAccessTokenUnit(
      user.accessTokenAlias,
      env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID
    );

    await execute({
      definition: v2.COURSE_STUDENT_CREDENTIAL_CLAIM,
      params: {
        // Transaction API params
        alias: user.accessTokenAlias,
        courseId: courseNftPolicyId,
        // Note: module_code is no longer in the API - credentials are claimed for the entire course
      },
      onSuccess: async (txResult) => {
        console.log("[CredentialClaim] Success!", txResult);

        toast.success("Credential Claimed!", {
          description: `You've earned your credential for ${moduleTitle ?? moduleCode}`,
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
        console.error("[CredentialClaim] Error:", txError);
        toast.error("Claim Failed", {
          description: txError.message || "Failed to claim credential",
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
            <Award className="h-5 w-5 text-success" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Claim Your Credential</AndamioCardTitle>
            <AndamioCardDescription>
              Mint your credential token for completing this module
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Credential Info */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              {moduleTitle ?? moduleCode}
            </AndamioBadge>
            {courseTitle && (
              <AndamioBadge variant="outline" className="text-xs text-muted-foreground">
                {courseTitle}
              </AndamioBadge>
            )}
          </div>
        </div>

        {/* What You're Getting */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">On-Chain Credential</p>
          </div>
          <p className="text-xs text-muted-foreground">
            A native Cardano token that serves as permanent, verifiable proof of your achievement.
          </p>
        </div>

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => reset()}
            messages={{
              success: "Your credential has been minted to your wallet!",
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
              idle: "Claim Credential",
              fetching: "Preparing Claim...",
              signing: "Sign in Wallet",
              submitting: "Minting Credential...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
