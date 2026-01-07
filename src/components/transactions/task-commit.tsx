/**
 * TaskCommit Transaction Component (V2)
 *
 * UI for contributors to commit to a new task after completing their current task.
 * Uses PROJECT_CONTRIBUTOR_TASK_COMMIT transaction definition.
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
import { TaskIcon, TransactionIcon, AlertIcon } from "~/components/icons";
import { toast } from "sonner";
import type { JSONContent } from "@tiptap/core";

export interface TaskCommitProps {
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
   * Callback fired when commitment is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * TaskCommit - Contributor UI for committing to a new task (V2)
 *
 * Use this after a task has been accepted to commit to a new task in the same project.
 * Similar to initial enrollment but with existing contributor state.
 *
 * @example
 * ```tsx
 * <TaskCommit
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   projectTitle="Bounty Program"
 *   taskHash="ghi789..."
 *   taskCode="TASK_002"
 *   taskTitle="Review Code"
 *   taskEvidence={editorContent}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function TaskCommit({
  projectNftPolicyId,
  contributorStateId,
  projectTitle,
  taskHash,
  taskCode,
  taskTitle,
  taskEvidence,
  onSuccess,
}: TaskCommitProps) {
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

  const handleCommit = async () => {
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
        task_code: taskCode,
        task_evidence: taskEvidence,
        task_evidence_hash: hash,
      },
      onSuccess: async (txResult) => {
        console.log("[TaskCommit] Success!", txResult);

        toast.success("Task Commitment Recorded!", {
          description: `You've committed to ${taskTitle ?? taskCode}`,
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
        console.error("[TaskCommit] Error:", txError);
        toast.error("Commitment Failed", {
          description: txError.message || "Failed to commit to task",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasEvidence = taskEvidence && Object.keys(taskEvidence).length > 0;
  const canCommit = hasAccessToken && hasEvidence;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TaskIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Commit to New Task</AndamioCardTitle>
            <AndamioCardDescription>
              {projectTitle
                ? `Take on a new task in ${projectTitle}`
                : "Commit to your next task in this project"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Task Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="secondary" className="text-xs">
            <TaskIcon className="h-3 w-3 mr-1" />
            {taskTitle ?? taskCode}
          </AndamioBadge>
        </div>

        {/* What Happens */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <AndamioText className="font-medium">What happens:</AndamioText>
          <AndamioText variant="small" className="text-xs">
            Your task commitment is recorded on-chain. You&apos;ll be able to submit evidence and
            receive rewards upon approval by a project manager.
          </AndamioText>
          {computedHash && (
            <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <TransactionIcon className="h-3 w-3 shrink-0" />
              <code className="font-mono text-primary">{computedHash.slice(0, 24)}...</code>
            </div>
          )}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
          <AndamioText variant="small" className="text-xs text-warning-foreground">
            Task commitments are recorded on-chain. Ensure your submission is ready before committing.
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
              success: evidenceHash
                ? `Committed with hash ${evidenceHash.slice(0, 16)}...`
                : `You've committed to ${taskTitle ?? taskCode}!`,
            }}
          />
        )}

        {/* Commit Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleCommit}
            disabled={!canCommit}
            stateText={{
              idle: "Commit to Task",
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
