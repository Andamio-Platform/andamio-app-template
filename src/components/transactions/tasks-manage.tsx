/**
 * TasksManage Transaction Component (V2)
 *
 * UI for project managers to add or remove tasks from a project.
 * Uses PROJECT_MANAGER_TASKS_MANAGE transaction definition.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/manager/tasks-manage.ts
 */

"use client";

import React, { useState } from "react";
import { PROJECT_MANAGER_TASKS_MANAGE } from "@andamio/transactions";
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { TaskIcon, AddIcon, DeleteIcon, AlertIcon } from "~/components/icons";
import { toast } from "sonner";

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
 * @property expiration_time - Unix timestamp in MILLISECONDS
 * @property lovelace_amount - Reward amount in lovelace
 * @property native_assets - ListValue array of [asset_class, quantity] tuples
 */
interface ProjectData {
  project_content: string; // Task content text (max 140 chars)
  expiration_time: number; // Unix timestamp in MILLISECONDS
  lovelace_amount: number;
  native_assets: ListValue; // [["policyId.tokenName", qty], ...]
}

/**
 * Prerequisite - Course completion requirement
 */
interface Prerequisite {
  course_id: string;
  assignment_ids: string[];
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
   * Course prerequisites for the project (from Andamioscan)
   * Pass [] if none
   */
  prerequisites: Prerequisite[];

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
   */
  taskCodes?: string[];

  /**
   * Callback fired when tasks are successfully managed
   * @param txHash - The transaction hash from the blockchain
   */
  onSuccess?: (txHash: string) => void | Promise<void>;
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
  prerequisites,
  tasksToAdd: preConfiguredTasksToAdd,
  tasksToRemove: preConfiguredTasksToRemove,
  depositValue: preConfiguredDepositValue,
  taskCodes: preConfiguredTaskCodes,
  onSuccess,
}: TasksManageProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [action, setAction] = useState<"add" | "remove">("add");

  // Form state for adding a single task
  const [taskHash, setTaskHash] = useState("");
  const [taskCode, setTaskCode] = useState("");
  const [expirationDays, setExpirationDays] = useState("30");
  const [rewardLovelace, setRewardLovelace] = useState("5000000");

  // Form state for removing tasks
  const [taskHashesToRemove, setTaskHashesToRemove] = useState("");

  const handleManageTasks = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    // Use pre-configured values if provided, otherwise use form values
    let tasks_to_add: ProjectData[] = [];
    let tasks_to_remove: ProjectData[] = [];
    let deposit_value: ListValue = [];
    let task_codes: string[] = [];

    if (preConfiguredTasksToAdd || preConfiguredTasksToRemove) {
      // Batch mode - use pre-configured values
      tasks_to_add = preConfiguredTasksToAdd ?? [];
      tasks_to_remove = preConfiguredTasksToRemove ?? [];
      deposit_value = preConfiguredDepositValue ?? [];
      task_codes = preConfiguredTaskCodes ?? [];
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
          expiration_time: expirationTimestamp,
          lovelace_amount: lovelaceAmount,
          native_assets: [],
        },
      ];

      // Calculate deposit value (sum of all task lovelace amounts)
      deposit_value = [["lovelace", lovelaceAmount]];
      task_codes = [taskCode.trim()];
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

    // Build the final request params
    const txParams = {
      alias: user.accessTokenAlias,
      project_id: projectNftPolicyId,
      contributor_state_id: contributorStateId,
      prerequisites,
      tasks_to_add,
      tasks_to_remove,
      deposit_value,
    };

    await execute({
      definition: PROJECT_MANAGER_TASKS_MANAGE,
      params: {
        ...txParams,
        // Side effect params (not sent to API, used internally)
        task_codes,
      },
      onSuccess: async (txResult) => {
        const actionText = action === "add" ? "added" : "removed";
        toast.success(`Tasks ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}!`, {
          description: `Task(s) have been ${actionText} successfully`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Clear form
        setTaskHash("");
        setTaskCode("");
        setTaskHashesToRemove("");

        await onSuccess?.(txResult.txHash);
      },
      onError: (txError) => {
        toast.error("Task Management Failed", {
          description: txError.message || "Failed to manage tasks",
        });
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
            <AndamioCardTitle>Manage Project Tasks</AndamioCardTitle>
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
                <AddIcon className="h-4 w-4 text-success" />
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
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
          <AndamioText variant="small" className="text-xs text-warning-foreground">
            Task changes are recorded on-chain. Ensure task details are correct before submitting.
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
              success: "Tasks managed successfully!",
            }}
          />
        )}

        {/* Submit Button */}
        {state !== "success" && (
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
