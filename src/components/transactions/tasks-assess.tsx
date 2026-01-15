/**
 * TasksAssess Transaction Component (V2)
 *
 * UI for project managers to assess (accept/refuse/deny) contributor task submissions.
 * Uses PROJECT_MANAGER_TASKS_ASSESS transaction definition.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/manager/tasks-assess.ts
 */

"use client";

import React, { useState } from "react";
import { PROJECT_MANAGER_TASKS_ASSESS } from "@andamio/transactions";
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
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AssessIcon, SuccessIcon, ErrorIcon, AlertIcon, BlockIcon } from "~/components/icons";
import { toast } from "sonner";

type AssessmentOutcome = "accept" | "refuse" | "deny";

export interface TasksAssessProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Contributor state ID (required for task assessment)
   */
  contributorStateId: string;

  /**
   * Contributor's access token alias
   */
  contributorAlias: string;

  /**
   * Task hash being assessed (64 char hex)
   */
  taskHash: string;

  /**
   * Task code for display and side effects
   */
  taskCode: string;

  /**
   * Task title for display (optional)
   */
  taskTitle?: string;

  /**
   * Callback fired when assessment is successful
   */
  onSuccess?: (result: AssessmentOutcome) => void | Promise<void>;
}

/**
 * TasksAssess - Manager UI for assessing contributor task submissions (V2)
 *
 * Assessment outcomes:
 * - **Accept**: Contributor receives the task reward, task is marked complete
 * - **Refuse**: Task is rejected but contributor can resubmit
 * - **Deny**: Task is permanently rejected, contributor loses deposit
 *
 * @example
 * ```tsx
 * <TasksAssess
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   contributorAlias="alice"
 *   taskHash="ghi789..."
 *   taskCode="TASK_001"
 *   onSuccess={(result) => refetchSubmissions()}
 * />
 * ```
 */
export function TasksAssess({
  projectNftPolicyId,
  contributorStateId,
  contributorAlias,
  taskHash,
  taskCode,
  taskTitle,
  onSuccess,
}: TasksAssessProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [assessmentResult, setAssessmentResult] = useState<AssessmentOutcome | null>(null);

  const handleAssess = async (decision: AssessmentOutcome) => {
    if (!user?.accessTokenAlias) {
      return;
    }

    setAssessmentResult(decision);

    await execute({
      definition: PROJECT_MANAGER_TASKS_ASSESS,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
        task_decisions: [
          { task_hash: taskHash, outcome: decision },
        ],
        // Side effect params (matches /project-v2/manager/commitment/assess)
        task_hash: taskHash,
        contributor_alias: contributorAlias,
        decision: decision,
      },
      onSuccess: async (txResult) => {
        console.log("[TasksAssess] Success!", txResult);

        const actionText =
          decision === "accept"
            ? "accepted"
            : decision === "refuse"
              ? "refused"
              : "denied";

        toast.success(`Task ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}!`, {
          description: `${contributorAlias}'s submission has been ${actionText}`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        await onSuccess?.(decision);
      },
      onError: (txError) => {
        console.error("[TasksAssess] Error:", txError);
        setAssessmentResult(null);
        toast.error("Assessment Failed", {
          description: txError.message || "Failed to submit assessment",
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
            <AssessIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Assess Task Submission</AndamioCardTitle>
            <AndamioCardDescription>
              Review and assess {contributorAlias}&apos;s task submission
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Task Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="outline" className="text-xs font-mono">
            Contributor: {contributorAlias}
          </AndamioBadge>
          <AndamioBadge variant="secondary" className="text-xs">
            {taskTitle ?? taskCode}
          </AndamioBadge>
        </div>

        {/* Assessment Outcomes Explanation */}
        <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <AndamioText variant="small" className="font-medium">Assessment Options:</AndamioText>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <SuccessIcon className="h-3 w-3 text-success" />
              <span><strong>Accept</strong>: Approve and release reward</span>
            </div>
            <div className="flex items-center gap-2">
              <ErrorIcon className="h-3 w-3 text-warning" />
              <span><strong>Refuse</strong>: Reject, allow resubmission</span>
            </div>
            <div className="flex items-center gap-2">
              <BlockIcon className="h-3 w-3 text-destructive" />
              <span><strong>Deny</strong>: Permanently reject, forfeit deposit</span>
            </div>
          </div>
        </div>

        {/* Warning about irreversibility */}
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
          <AndamioText variant="small" className="text-xs text-warning-foreground">
            Assessment decisions are recorded on-chain and cannot be undone.
          </AndamioText>
        </div>

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => {
              setAssessmentResult(null);
              reset();
            }}
            messages={{
              success: `Task ${
                assessmentResult === "accept"
                  ? "accepted"
                  : assessmentResult === "refuse"
                    ? "refused"
                    : "denied"
              } successfully!`,
            }}
          />
        )}

        {/* Assessment Buttons */}
        {state === "idle" && hasAccessToken && (
          <div className="flex gap-2">
            <AndamioButton
              variant="default"
              className="flex-1"
              onClick={() => handleAssess("accept")}
            >
              <SuccessIcon className="h-4 w-4 mr-2" />
              Accept
            </AndamioButton>
            <AndamioButton
              variant="outline"
              className="flex-1"
              onClick={() => handleAssess("refuse")}
            >
              <ErrorIcon className="h-4 w-4 mr-2" />
              Refuse
            </AndamioButton>
            <AndamioButton
              variant="destructive"
              className="flex-1"
              onClick={() => handleAssess("deny")}
            >
              <BlockIcon className="h-4 w-4 mr-2" />
              Deny
            </AndamioButton>
          </div>
        )}

        {/* In-progress state */}
        {state !== "idle" && state !== "success" && state !== "error" && (
          <TransactionButton
            txState={state}
            onClick={() => undefined}
            disabled
            stateText={{
              idle:
                assessmentResult === "accept"
                  ? "Accept"
                  : assessmentResult === "refuse"
                    ? "Refuse"
                    : "Deny",
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
