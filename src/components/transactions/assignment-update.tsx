/**
 * AssignmentUpdate Transaction Component (V2)
 *
 * Elegant UI for students to submit or update assignment evidence.
 * Supports two modes: updating existing submission or committing to a new module.
 */

"use client";

import React, { useState, useMemo } from "react";
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
import { Send, FileEdit, Shield, Hash } from "lucide-react";
import { toast } from "sonner";
import { v2, computeAssignmentInfoHash } from "@andamio/transactions";
import type { JSONContent } from "@tiptap/core";

export interface AssignmentUpdateProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Target module code
   */
  moduleCode: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Whether this is a new commitment (vs updating existing)
   */
  isNewCommitment?: boolean;

  /**
   * Evidence content (Tiptap JSON)
   */
  evidence: JSONContent;

  /**
   * Callback fired when submission is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * AssignmentUpdate - Student UI for submitting/updating assignment evidence (V2)
 *
 * Creates a tamper-evident on-chain record of the student's submission.
 * The evidence hash stored on-chain allows verification that the database
 * content matches what was committed.
 *
 * @example
 * ```tsx
 * <AssignmentUpdate
 *   courseNftPolicyId="abc123..."
 *   moduleCode="MODULE_1"
 *   evidence={editorContent}
 *   isNewCommitment={false}
 *   onSuccess={() => refetchProgress()}
 * />
 * ```
 */
export function AssignmentUpdate({
  courseNftPolicyId,
  moduleCode,
  moduleTitle,
  isNewCommitment = false,
  evidence,
  onSuccess,
}: AssignmentUpdateProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);

  // Compute evidence hash for display
  const computedHash = useMemo(() => {
    try {
      return computeAssignmentInfoHash(evidence);
    } catch {
      return null;
    }
  }, [evidence]);

  const handleSubmit = async () => {
    if (!user?.accessTokenAlias || !evidence) {
      return;
    }

    // Compute evidence hash
    const hash = computeAssignmentInfoHash(evidence);
    setEvidenceHash(hash);

    await execute({
      definition: v2.COURSE_STUDENT_ASSIGNMENT_UPDATE,
      params: {
        // Transaction API params
        alias: user.accessTokenAlias,
        courseId: courseNftPolicyId,
        assignmentInfo: hash,
        // maybeNewSltHash would be set if committing to a new module
        // Side effect params
        isNewCommitment,
        moduleCode,
        networkEvidence: evidence,
        networkEvidenceHash: hash,
      },
      onSuccess: async (txResult) => {
        console.log("[AssignmentUpdate] Success!", txResult);

        const actionText = isNewCommitment ? "committed to" : "updated";
        toast.success("Submission Recorded!", {
          description: `Your evidence has been ${actionText} on-chain`,
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
        console.error("[AssignmentUpdate] Error:", txError);
        toast.error("Submission Failed", {
          description: txError.message || "Failed to record submission",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasEvidence = evidence && Object.keys(evidence).length > 0;
  const canSubmit = hasAccessToken && hasEvidence;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {isNewCommitment ? (
              <Send className="h-5 w-5 text-primary" />
            ) : (
              <FileEdit className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <AndamioCardTitle>
              {isNewCommitment ? "Commit to Module" : "Update Submission"}
            </AndamioCardTitle>
            <AndamioCardDescription>
              {isNewCommitment
                ? `Start working on ${moduleTitle ?? moduleCode}`
                : "Record your updated evidence on-chain"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Module Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="secondary" className="text-xs">
            {moduleTitle ?? moduleCode}
          </AndamioBadge>
          {isNewCommitment && (
            <AndamioBadge variant="outline" className="text-xs">
              New Commitment
            </AndamioBadge>
          )}
        </div>

        {/* Tamper-Evidence Explanation */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            <AndamioText className="font-medium">Tamper-Evident Record</AndamioText>
          </div>
          <AndamioText variant="small" className="text-xs">
            Your submission is hashed and recorded on-chain, creating a permanent, verifiable record.
          </AndamioText>
          {computedHash && (
            <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <Hash className="h-3 w-3 shrink-0" />
              <code className="font-mono text-primary">{computedHash.slice(0, 24)}...</code>
            </div>
          )}
        </div>

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => reset()}
            messages={{
              success: evidenceHash
                ? `Your submission is now recorded with hash ${evidenceHash.slice(0, 16)}...`
                : "Your submission has been recorded on-chain!",
            }}
          />
        )}

        {/* Submit Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleSubmit}
            disabled={!canSubmit}
            stateText={{
              idle: isNewCommitment ? "Commit & Submit" : "Update Submission",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Recording on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
