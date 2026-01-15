/**
 * TaskAction Transaction Component (V2)
 *
 * UI for contributors to perform actions on their current task (update submission, etc).
 * Uses PROJECT_CONTRIBUTOR_TASK_ACTION transaction definition.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/contributor/task-action.ts
 */

"use client";

import React, { useState, useMemo } from "react";
import { PROJECT_CONTRIBUTOR_TASK_ACTION, computeAssignmentInfoHash } from "@andamio/transactions";
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

export interface TaskActionProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Task hash (64 char hex) - required for side effects
   */
  taskHash: string;

  /**
   * Task code for display
   */
  taskCode: string;

  /**
   * Task title for display
   */
  taskTitle?: string;

  /**
   * Optional project info to include
   */
  projectInfo?: string;

  /**
   * Updated task evidence content (Tiptap JSON)
   */
  taskEvidence?: JSONContent;

  /**
   * Callback fired when action is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * TaskAction - Contributor UI for task actions (V2)
 *
 * Use cases:
 * - Updating task submission evidence
 * - Performing task state transitions
 *
 * @example
 * ```tsx
 * <TaskAction
 *   projectNftPolicyId="abc123..."
 *   taskHash="def456..."
 *   taskCode="TASK_001"
 *   taskTitle="Create Documentation"
 *   taskEvidence={updatedContent}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function TaskAction({
  projectNftPolicyId,
  taskHash,
  taskCode,
  taskTitle,
  projectInfo,
  taskEvidence,
  onSuccess,
}: TaskActionProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);

  // Compute evidence hash for display if evidence provided
  const computedHash = useMemo(() => {
    if (!taskEvidence || Object.keys(taskEvidence).length === 0) return null;
    try {
      return computeAssignmentInfoHash(taskEvidence);
    } catch {
      return null;
    }
  }, [taskEvidence]);

  const handleAction = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    // Compute evidence hash if evidence provided
    const hash = taskEvidence && Object.keys(taskEvidence).length > 0
      ? computeAssignmentInfoHash(taskEvidence)
      : undefined;

    if (hash) {
      setEvidenceHash(hash);
    }

    await execute({
      definition: PROJECT_CONTRIBUTOR_TASK_ACTION,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        project_info: projectInfo,
        // Side effect params (matches /project-v2/contributor/commitment/submit)
        task_hash: taskHash,
        evidence: taskEvidence,
      },
      onSuccess: async (txResult) => {
        console.log("[TaskAction] Success!", txResult);

        toast.success("Task Action Completed!", {
          description: `Action on ${taskTitle ?? taskCode} recorded successfully`,
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
        console.error("[TaskAction] Error:", txError);
        toast.error("Action Failed", {
          description: txError.message || "Failed to perform task action",
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
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <TaskIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Task Action</AndamioCardTitle>
            <AndamioCardDescription>
              Update your submission for {taskTitle ?? taskCode}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Task Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="secondary" className="text-xs">
            {taskTitle ?? taskCode}
          </AndamioBadge>
        </div>

        {/* What Happens */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <AndamioText className="font-medium">What happens:</AndamioText>
          <AndamioText variant="small" className="text-xs">
            Your task action is recorded on-chain. This may include updating your submission evidence or transitioning task state.
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
            Task actions are recorded on-chain. Ensure your submission is ready before continuing.
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
                ? `Action recorded with hash ${evidenceHash.slice(0, 16)}...`
                : "Task action completed successfully!",
            }}
          />
        )}

        {/* Action Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleAction}
            disabled={!hasAccessToken}
            stateText={{
              idle: "Submit Action",
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
