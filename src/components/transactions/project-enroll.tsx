/**
 * ProjectEnroll Transaction Component (V2)
 *
 * UI for contributors to enroll in a project by committing to a task.
 * Uses PROJECT_CONTRIBUTOR_TASK_COMMIT which handles both initial enrollment
 * and subsequent task commitments.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/contributor/task-commit.ts
 */

"use client";

import React, { useState, useMemo } from "react";
import { PROJECT_CONTRIBUTOR_TASK_COMMIT, computeAssignmentInfoHash } from "@andamio/transactions";
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
import { ContributorIcon, TaskIcon, TransactionIcon } from "~/components/icons";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/core";

export interface ProjectEnrollProps {
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
   * Task hash to commit to (64 char hex)
   */
  taskHash: string;

  /**
   * Task code for side effects
   */
  taskCode: string;

  /**
   * Task title for display
   */
  taskTitle?: string;

  /**
   * Task evidence content (Tiptap JSON)
   */
  taskEvidence: JSONContent;

  /**
   * Callback fired when enrollment is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * ProjectEnroll - Contributor UI for enrolling in a project (V2)
 *
 * Enrollment flow:
 * 1. Contributor selects a project and task to commit to
 * 2. Contributor provides task evidence
 * 3. Transaction mints contributor state token with commitment data
 * 4. Side effects create task commitment record in database
 *
 * @example
 * ```tsx
 * <ProjectEnroll
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   projectTitle="Bounty Program"
 *   taskHash="ghi789..."
 *   taskCode="TASK_001"
 *   taskTitle="Create Documentation"
 *   taskEvidence={editorContent}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function ProjectEnroll({
  projectNftPolicyId,
  contributorStateId,
  projectTitle,
  taskHash,
  taskCode,
  taskTitle,
  taskEvidence,
  onSuccess,
}: ProjectEnrollProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);

  // Compute evidence hash for display
  const computedHash = useMemo(() => {
    if (!taskEvidence || Object.keys(taskEvidence).length === 0) return null;
    try {
      return computeAssignmentInfoHash(taskEvidence);
    } catch {
      return null;
    }
  }, [taskEvidence]);

  const handleEnroll = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    if (!taskEvidence || Object.keys(taskEvidence).length === 0) {
      toast.error("Task evidence is required");
      return;
    }

    const hash = computeAssignmentInfoHash(taskEvidence);
    setEvidenceHash(hash);

    await execute({
      definition: PROJECT_CONTRIBUTOR_TASK_COMMIT,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
        task_hash: taskHash,
        task_info: hash,
        // Side effect params
        evidence: taskEvidence,
      },
      onSuccess: async (txResult) => {
        console.log("[ProjectEnroll] Success!", txResult);

        toast.success("Successfully Enrolled!", {
          description: projectTitle
            ? `You're now a contributor in ${projectTitle}`
            : "You're now enrolled in this project",
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
        console.error("[ProjectEnroll] Error:", txError);
        toast.error("Enrollment Failed", {
          description: txError.message || "Failed to enroll in project",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasEvidence = taskEvidence && Object.keys(taskEvidence).length > 0;
  const canEnroll = hasAccessToken && hasEvidence;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ContributorIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Enroll in Project</AndamioCardTitle>
            <AndamioCardDescription>
              {projectTitle
                ? `Become a contributor in ${projectTitle}`
                : "Mint your contributor state to start working on tasks"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Task Commitment Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="secondary" className="text-xs">
            <TaskIcon className="h-3 w-3 mr-1" />
            Committing to: {taskTitle ?? taskCode}
          </AndamioBadge>
        </div>

        {/* What Happens */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <AndamioText className="font-medium">What happens:</AndamioText>
          <AndamioText variant="small" className="text-xs">
            A contributor state token is minted to your wallet and your task commitment is recorded on-chain.
            You&apos;ll be able to submit evidence and receive rewards upon approval.
          </AndamioText>
          {computedHash && (
            <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <TransactionIcon className="h-3 w-3 shrink-0" />
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
                ? `Enrolled with commitment hash ${evidenceHash.slice(0, 16)}...`
                : `You are now enrolled in ${projectTitle ?? "this project"}!`,
            }}
          />
        )}

        {/* Enroll Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleEnroll}
            disabled={!canEnroll}
            stateText={{
              idle: "Enroll & Commit",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Enrolling on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
