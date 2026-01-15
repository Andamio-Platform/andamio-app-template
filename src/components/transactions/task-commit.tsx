/**
 * TaskCommit Transaction Component (V2)
 *
 * Unified UI for all task commitments. The COMMIT transaction handles:
 * 1. Enrolling the contributor (if not already enrolled)
 * 2. Claiming rewards from previous approved task (if any)
 * 3. Committing to a new task
 *
 * Uses PROJECT_CONTRIBUTOR_TASK_COMMIT transaction definition.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/contributor/task-commit.ts
 * @see .claude/skills/project-manager/CONTRIBUTOR-TRANSACTION-MODEL.md
 */

"use client";

import React, { useMemo } from "react";
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
import { TaskIcon, TransactionIcon, AlertIcon, SuccessIcon, ContributorIcon } from "~/components/icons";
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
   * May be null if user hasn't entered evidence yet
   */
  taskEvidence: JSONContent | null;

  /**
   * Is this the contributor's first commit (enrollment)?
   * Changes messaging to emphasize enrollment aspect.
   */
  isFirstCommit?: boolean;

  /**
   * Will this commit also claim rewards from a previous approved task?
   * Shows reward claiming info in the UI.
   */
  willClaimRewards?: boolean;

  /**
   * Callback fired when commitment is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * TaskCommit - Unified contributor UI for all task commits (V2)
 *
 * This single component handles:
 * - First-time enrollment (isFirstCommit=true)
 * - Subsequent task commitments
 * - Committing while claiming rewards (willClaimRewards=true)
 *
 * @example
 * ```tsx
 * // First commit (enrollment)
 * <TaskCommit
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   taskHash="ghi789..."
 *   taskEvidence={editorContent}
 *   isFirstCommit={true}
 *   onSuccess={() => router.refresh()}
 * />
 *
 * // Subsequent commit with rewards
 * <TaskCommit
 *   projectNftPolicyId="abc123..."
 *   taskHash="ghi789..."
 *   taskEvidence={editorContent}
 *   willClaimRewards={true}
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
  isFirstCommit = false,
  willClaimRewards = false,
  onSuccess,
}: TaskCommitProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

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
    console.log("[TaskCommit] ========== HANDLE COMMIT START ==========");
    console.log("[TaskCommit] Component props:", {
      projectNftPolicyId,
      projectNftPolicyId_length: projectNftPolicyId.length,
      contributorStateId,
      contributorStateId_length: contributorStateId.length,
      taskHash,
      taskHash_length: taskHash.length,
      taskCode,
      taskTitle,
      hasEvidence: !!taskEvidence,
      evidenceKeys: taskEvidence ? Object.keys(taskEvidence) : [],
    });

    if (!user?.accessTokenAlias) {
      console.error("[TaskCommit] No user access token alias");
      return;
    }
    console.log("[TaskCommit] User alias:", user.accessTokenAlias);

    if (!taskEvidence || Object.keys(taskEvidence).length === 0) {
      console.error("[TaskCommit] No task evidence provided");
      toast.error("Task evidence is required");
      return;
    }

    if (taskHash.length !== 64) {
      console.error("[TaskCommit] Invalid task hash length:", taskHash.length);
      toast.error("Invalid task - please select a valid task");
      return;
    }

    const hash = computeAssignmentInfoHash(taskEvidence);
    console.log("[TaskCommit] Computed evidence hash:", hash, "length:", hash.length);

    const txParams = {
      // Transaction API params (snake_case per V2 API)
      alias: user.accessTokenAlias,
      project_id: projectNftPolicyId,
      contributor_state_id: contributorStateId,
      task_hash: taskHash,
      task_info: hash,
      // Side effect params (matches /project-v2/contributor/commitment/submit)
      evidence: taskEvidence,
    };

    console.log("[TaskCommit] Transaction params:", {
      alias: txParams.alias,
      project_id: txParams.project_id,
      project_id_length: txParams.project_id.length,
      contributor_state_id: txParams.contributor_state_id,
      contributor_state_id_length: txParams.contributor_state_id.length,
      task_hash: txParams.task_hash,
      task_hash_length: txParams.task_hash.length,
      task_info: txParams.task_info,
      task_info_length: txParams.task_info.length,
      hasEvidence: !!txParams.evidence,
    });

    await execute({
      definition: PROJECT_CONTRIBUTOR_TASK_COMMIT,
      params: txParams,
      onSuccess: async (txResult) => {
        console.log("[TaskCommit] Success!", txResult);

        const successTitle = isFirstCommit
          ? "Welcome to the Project!"
          : willClaimRewards
            ? "Committed & Rewards Claimed!"
            : "Task Commitment Recorded!";

        const successDescription = isFirstCommit
          ? `You're now enrolled in ${projectTitle ?? "this project"}`
          : willClaimRewards
            ? `You've committed to ${taskTitle ?? taskCode} and claimed your rewards`
            : `You've committed to ${taskTitle ?? taskCode}`;

        toast.success(successTitle, {
          description: successDescription,
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
  const hasValidTaskHash = taskHash.length === 64;
  const canCommit = hasAccessToken && hasEvidence && hasValidTaskHash;

  // Dynamic title and description based on context
  const cardTitle = isFirstCommit ? "Enroll & Commit" : "Commit to Task";
  const cardDescription = isFirstCommit
    ? projectTitle
      ? `Join ${projectTitle} and start contributing`
      : "Enroll in this project and commit to your first task"
    : willClaimRewards
      ? "Continue contributing and claim your rewards"
      : projectTitle
        ? `Take on a new task in ${projectTitle}`
        : "Commit to your next task";

  const buttonText = isFirstCommit
    ? "Enroll & Commit"
    : willClaimRewards
      ? "Commit & Claim Rewards"
      : "Commit to Task";

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {isFirstCommit ? (
              <ContributorIcon className="h-5 w-5 text-primary" />
            ) : (
              <TaskIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{cardTitle}</AndamioCardTitle>
            <AndamioCardDescription>{cardDescription}</AndamioCardDescription>
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
          {willClaimRewards && (
            <AndamioBadge variant="default" className="text-xs bg-success text-success-foreground">
              <SuccessIcon className="h-3 w-3 mr-1" />
              + Claim Rewards
            </AndamioBadge>
          )}
        </div>

        {/* What Happens */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <AndamioText className="font-medium">What happens:</AndamioText>
          {isFirstCommit ? (
            <AndamioText variant="small" className="text-xs">
              A contributor state token is minted to your wallet, enrolling you in the project.
              Your task commitment is recorded on-chain.
            </AndamioText>
          ) : willClaimRewards ? (
            <AndamioText variant="small" className="text-xs">
              Your rewards from the previous approved task are claimed, and your new task
              commitment is recorded on-chain.
            </AndamioText>
          ) : (
            <AndamioText variant="small" className="text-xs">
              Your task commitment is recorded on-chain. Complete your task and submit for review.
            </AndamioText>
          )}
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
            {isFirstCommit
              ? "This transaction enrolls you in the project. Make sure your evidence is ready."
              : "Task commitments are recorded on-chain. Ensure your submission is ready before committing."}
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
              success: isFirstCommit
                ? `You're now enrolled in ${projectTitle ?? "this project"}!`
                : willClaimRewards
                  ? `Committed to ${taskTitle ?? taskCode} and claimed rewards!`
                  : `You've committed to ${taskTitle ?? taskCode}!`,
            }}
          />
        )}

        {/* Invalid Task Hash Warning */}
        {!hasValidTaskHash && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <AndamioText variant="small" className="text-xs text-destructive">
              This task is not yet published on-chain. Tasks must be published before contributors can commit.
            </AndamioText>
          </div>
        )}

        {/* Commit Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleCommit}
            disabled={!canCommit}
            stateText={{
              idle: buttonText,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: isFirstCommit ? "Enrolling..." : "Recording on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
