/**
 * TasksManage Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for project managers to add or remove tasks from a project.
 * Uses PROJECT_MANAGER_TASKS_MANAGE transaction with gateway auto-confirmation.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState } from "react";
import { computeTaskHash } from "@andamio/core/hashing";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { TaskIcon, AddIcon, DeleteIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

/**
 * ListValue - Array of [asset_class, quantity] tuples
 *
 * Format: [["policyId.tokenName", quantity], ...] or [["lovelace", quantity]]
 * Example: [["lovelace", 5000000]] or [["ff80aaaf...474f4c44", 100]]
 */
type ListValue = Array<[string, number]>;

/**
 * ProjectData - Task to add or remove from the project
 *
 * IMPORTANT: This matches the Atlas API ManageTasksTxRequest schema
 * @see https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json
 *
 * @property project_content - Task content/description (max 140 chars, NOT a hash!)
 * @property expiration_posix - Unix timestamp in MILLISECONDS
 * @property lovelace_amount - Reward amount in lovelace
 * @property native_assets - ListValue array of [asset_class, quantity] tuples
 */
interface ProjectData {
  project_content: string; // Task content text (max 140 chars)
  expiration_posix: number; // Unix timestamp in MILLISECONDS
  lovelace_amount: number;
  native_assets: ListValue; // [["policyId.tokenName", qty], ...]
}

/**
 * Computed task hash with its associated task index
 */
export interface ComputedTaskHash {
  taskIndex: number;
  taskHash: string;
  projectContent: string;
}

export interface TasksManageProps {
  /**
   * Project NFT Policy ID (56 char hex)
   */
  projectNftPolicyId: string;

  /**
   * Contributor state policy ID (56 char hex) - REQUIRED
   */
  contributorStateId: string;

  /**
   * Pre-configured tasks to add (ProjectData objects)
   */
  tasksToAdd?: ProjectData[];

  /**
   * Tasks to remove (full ProjectData objects, NOT just hashes!)
   */
  tasksToRemove?: ProjectData[];

  /**
   * Deposit value for the transaction (ListValue format)
   * Required by the API. Example: [["lovelace", 5000000]]
   */
  depositValue?: ListValue;

  /**
   * Task codes for side effects (used to identify tasks in DB)
   * These should match the indices of tasksToAdd (e.g., ["TASK_1", "TASK_2"])
   */
  taskCodes?: string[];

  /**
   * Task indices corresponding to tasksToAdd (from DB)
   * Used to map computed hashes back to DB tasks
   */
  taskIndices?: number[];

  /**
   * Callback fired when tasks are successfully managed
   * @param txHash - The transaction hash from the blockchain
   * @param computedHashes - Pre-computed task hashes (can be used to update DB immediately)
   */
  onSuccess?: (txHash: string, computedHashes?: ComputedTaskHash[]) => void | Promise<void>;
}

/**
 * TasksManage - Manager UI for adding/removing project tasks (V2)
 *
 * This component supports both simple (single task) and batch modes.
 *
 * ## API Format (ManageTasksTxRequest)
 * ```json
 * {
 *   "alias": "manager1",
 *   "project_id": "56-char-hex",
 *   "contributor_state_id": "56-char-hex",
 *   "tasks_to_add": [{ project_content: "text", expiration_time: ms, lovelace_amount: n, native_assets: [] }],
 *   "tasks_to_remove": [{ ... same ProjectData format ... }],
 *   "deposit_value": [["lovelace", amount]]
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Batch mode - pre-configured tasks
 * <TasksManage
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   tasksToAdd={[{
 *     project_content: "Complete the tutorial",  // max 140 chars
 *     expiration_time: Date.now() + 30 * 24 * 60 * 60 * 1000,  // ms timestamp
 *     lovelace_amount: 5000000,
 *     native_assets: []
 *   }]}
 *   depositValue={[["lovelace", 5000000]]}
 *   taskCodes={["TASK_1"]}
 *   onSuccess={() => refetchTasks()}
 * />
 * ```
 */
export function TasksManage({
  projectNftPolicyId,
  contributorStateId,
  tasksToAdd: preConfiguredTasksToAdd,
  tasksToRemove: preConfiguredTasksToRemove,
  depositValue: preConfiguredDepositValue,
  taskCodes: preConfiguredTaskCodes,
  taskIndices: preConfiguredTaskIndices,
  onSuccess,
}: TasksManageProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [action, setAction] = useState<"add" | "remove">("add");

  // Form state for adding a single task
  const [taskHash, setTaskHash] = useState("");
  const [taskCode, setTaskCode] = useState("");
  const [expirationDays, setExpirationDays] = useState("30");
  const [rewardLovelace, setRewardLovelace] = useState("5000000");

  // Form state for removing tasks
  const [taskHashesToRemove, setTaskHashesToRemove] = useState("");

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[TasksManage] TX confirmed and DB updated by gateway");

          const actionText = action === "add" ? "added" : "removed";
          toast.success(`Tasks ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}!`, {
            description: `Task(s) have been ${actionText} successfully`,
          });

          // Clear form
          setTaskHash("");
          setTaskCode("");
          setTaskHashesToRemove("");

          // Note: We can't pass computed hashes here since onComplete doesn't have access to them
          // The parent should handle this via the initial onSuccess callback
          if (result?.txHash) {
            void onSuccess?.(result.txHash, undefined);
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Task Management Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.PROJECT_MANAGER_TASKS_MANAGE;

  const handleManageTasks = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    // Use pre-configured values if provided, otherwise use form values
    let tasks_to_add: ProjectData[] = [];
    let tasks_to_remove: ProjectData[] = [];
    let deposit_value: ListValue = [];

    if (preConfiguredTasksToAdd || preConfiguredTasksToRemove) {
      // Batch mode - use pre-configured values
      tasks_to_add = preConfiguredTasksToAdd ?? [];
      tasks_to_remove = preConfiguredTasksToRemove ?? [];
      deposit_value = preConfiguredDepositValue ?? [];
    } else if (action === "add") {
      // Single task add mode via form
      if (!taskHash.trim() || !taskCode.trim()) {
        toast.error("Task content and code are required");
        return;
      }

      // Validate content length (max 140 chars per API spec)
      if (taskHash.trim().length > 140) {
        toast.error("Task content must be 140 characters or less");
        return;
      }

      const daysUntilExpiry = parseInt(expirationDays, 10) || 30;
      // API expects milliseconds timestamp
      const expirationTimestamp = Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000;
      const lovelaceAmount = parseInt(rewardLovelace, 10) || 5000000;

      tasks_to_add = [
        {
          project_content: taskHash.trim(),
          expiration_posix: expirationTimestamp,
          lovelace_amount: lovelaceAmount,
          native_assets: [],
        },
      ];

      // Calculate deposit value (sum of all task lovelace amounts)
      deposit_value = [["lovelace", lovelaceAmount]];
    } else {
      // Remove mode - need full ProjectData, not just hashes
      toast.error("Task removal via form not yet implemented - use batch mode");
      return;
    }

    // Calculate total deposit if not provided
    if (deposit_value.length === 0 && tasks_to_add.length > 0) {
      const totalLovelace = tasks_to_add.reduce((sum, t) => sum + t.lovelace_amount, 0);
      deposit_value = [["lovelace", totalLovelace]];
    }

    // =========================================================================
    // COMPUTE TASK HASHES CLIENT-SIDE
    // =========================================================================
    // The task_hash (on-chain identifier) is deterministic and can be computed
    // before submitting to the blockchain. This allows us to update the DB
    // immediately with the correct hash.
    const computedHashes: ComputedTaskHash[] = tasks_to_add.map((task, index) => {
      // Get the task index from the pre-configured array, or fall back to loop index
      const taskIndex = preConfiguredTaskIndices?.[index] ?? index;

      // Compute the on-chain task hash using Blake2b-256
      // Note: computeTaskHash expects expiration_time, API uses expiration_posix (same value)
      const taskHashValue = computeTaskHash({
        project_content: task.project_content,
        expiration_time: task.expiration_posix, // Map API field to hash function field
        lovelace_amount: task.lovelace_amount,
        native_assets: task.native_assets,
      });

      console.log("[TasksManage] Computed task hash:", {
        taskIndex,
        projectContent: task.project_content.slice(0, 50) + (task.project_content.length > 50 ? "..." : ""),
        expiration_posix: task.expiration_posix,
        lovelace_amount: task.lovelace_amount,
        computedHash: taskHashValue,
      });

      return {
        taskIndex,
        taskHash: taskHashValue,
        projectContent: task.project_content,
      };
    });

    if (computedHashes.length > 0) {
      console.log("[TasksManage] All computed hashes:", computedHashes.map(h => ({
        index: h.taskIndex,
        hash: h.taskHash.slice(0, 16) + "...",
      })));
    }

    // Build the final request params
    const txParams = {
      alias: user.accessTokenAlias,
      project_id: projectNftPolicyId,
      contributor_state_id: contributorStateId,
      tasks_to_add,
      tasks_to_remove,
      deposit_value,
    };

    await execute({
      txType: "PROJECT_MANAGER_TASKS_MANAGE",
      params: txParams,
      onSuccess: async (txResult) => {
        console.log("[TasksManage] TX submitted successfully!", txResult);
        // Pass computed hashes to parent immediately after submission
        // They can use these to optimistically update the DB
        await onSuccess?.(txResult.txHash, computedHashes);
      },
      onError: (txError) => {
        console.error("[TasksManage] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;

  // Determine if we can submit
  const canSubmit = hasAccessToken && (
    // Batch mode
    (preConfiguredTasksToAdd && preConfiguredTasksToAdd.length > 0) ||
    (preConfiguredTasksToRemove && preConfiguredTasksToRemove.length > 0) ||
    // Add mode - need content (1-140 chars) and code
    (action === "add" && taskHash.trim().length > 0 && taskHash.trim().length <= 140 && taskCode.trim().length > 0)
    // Remove mode disabled for now - needs full ProjectData
  );

  // If pre-configured, show simplified UI
  const isBatchMode = !!(preConfiguredTasksToAdd || preConfiguredTasksToRemove);

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <TaskIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Add or remove tasks from this project
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {isBatchMode ? (
          // Batch mode - show summary
          <div className="space-y-2">
            {preConfiguredTasksToAdd && preConfiguredTasksToAdd.length > 0 && (
              <div className="flex items-center gap-2">
                <AddIcon className="h-4 w-4 text-primary" />
                <AndamioText variant="small">
                  Adding {preConfiguredTasksToAdd.length} task(s)
                </AndamioText>
              </div>
            )}
            {preConfiguredTasksToRemove && preConfiguredTasksToRemove.length > 0 && (
              <div className="flex items-center gap-2">
                <DeleteIcon className="h-4 w-4 text-destructive" />
                <AndamioText variant="small">
                  Removing {preConfiguredTasksToRemove.length} task(s)
                </AndamioText>
              </div>
            )}
            {preConfiguredTaskCodes && preConfiguredTaskCodes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {preConfiguredTaskCodes.map((code) => (
                  <AndamioBadge key={code} variant="secondary" className="text-xs font-mono">
                    {code}
                  </AndamioBadge>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Form mode
          <>
            {/* Action Toggle */}
            <div className="flex gap-2">
              <AndamioButton
                variant={action === "add" ? "default" : "outline"}
                size="sm"
                onClick={() => setAction("add")}
                disabled={state !== "idle" && state !== "error"}
              >
                <AddIcon className="h-4 w-4 mr-1" />
                Add Task
              </AndamioButton>
              <AndamioButton
                variant={action === "remove" ? "destructive" : "outline"}
                size="sm"
                onClick={() => setAction("remove")}
                disabled={state !== "idle" && state !== "error"}
              >
                <DeleteIcon className="h-4 w-4 mr-1" />
                Remove Task
              </AndamioButton>
            </div>

            {action === "add" ? (
              // Add task form
              <div className="space-y-4">
                <div className="space-y-2">
                  <AndamioLabel htmlFor="taskCode">Task Code (for tracking)</AndamioLabel>
                  <AndamioInput
                    id="taskCode"
                    type="text"
                    placeholder="TASK_001"
                    value={taskCode}
                    onChange={(e) => setTaskCode(e.target.value)}
                    disabled={state !== "idle" && state !== "error"}
                  />
                  <AndamioText variant="small" className="text-xs">
                    Internal identifier for side effects
                  </AndamioText>
                </div>

                <div className="space-y-2">
                  <AndamioLabel htmlFor="taskHash">Task Content (max 140 chars)</AndamioLabel>
                  <AndamioInput
                    id="taskHash"
                    type="text"
                    placeholder="Complete the tutorial and submit your work"
                    value={taskHash}
                    onChange={(e) => setTaskHash(e.target.value)}
                    disabled={state !== "idle" && state !== "error"}
                    maxLength={140}
                  />
                  <AndamioText variant="small" className="text-xs">
                    {taskHash.length}/140 characters - This is the on-chain task description
                  </AndamioText>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <AndamioLabel htmlFor="expiration">Expiration (days)</AndamioLabel>
                    <AndamioInput
                      id="expiration"
                      type="number"
                      placeholder="30"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(e.target.value)}
                      disabled={state !== "idle" && state !== "error"}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <AndamioLabel htmlFor="reward">Reward (Lovelace)</AndamioLabel>
                    <AndamioInput
                      id="reward"
                      type="number"
                      placeholder="5000000"
                      value={rewardLovelace}
                      onChange={(e) => setRewardLovelace(e.target.value)}
                      disabled={state !== "idle" && state !== "error"}
                      min={1000000}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Remove task form
              <div className="space-y-2">
                <AndamioLabel htmlFor="removeHashes">Task Hashes to Remove</AndamioLabel>
                <AndamioInput
                  id="removeHashes"
                  type="text"
                  placeholder="hash1, hash2, ..."
                  value={taskHashesToRemove}
                  onChange={(e) => setTaskHashesToRemove(e.target.value)}
                  disabled={state !== "idle" && state !== "error"}
                />
                <AndamioText variant="small" className="text-xs">
                  Enter task hashes (64 char hex), separated by commas
                </AndamioText>
              </div>
            )}
          </>
        )}

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
          <AndamioText variant="small" className="text-xs text-muted-foreground">
            Task changes are recorded on-chain. Ensure task details are correct before submitting.
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
                  {txStatus?.state === "confirmed" && "Processing database updates"}
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
                  Tasks Managed Successfully!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  Task changes have been recorded on-chain.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {state !== "success" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleManageTasks}
            disabled={!canSubmit}
            stateText={{
              idle: action === "add" ? "Add Task" : "Remove Task(s)",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Updating on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
