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
 * Task to be added to the project
 */
interface TaskToAdd {
  project_content: string; // Task hash (64 char hex)
  expiration_time: number; // Unix timestamp
  lovelace_amount: number;
  native_assets: Array<{
    policy_id: string;
    assets: Array<{ asset_name: string; quantity: number }>;
  }>;
}

export interface TasksManageProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Contributor state ID (required for task management)
   */
  contributorStateId: string;

  /**
   * Pre-configured tasks to add (for advanced use cases)
   */
  tasksToAdd?: TaskToAdd[];

  /**
   * Task hashes to remove (64 char hex)
   */
  tasksToRemove?: string[];

  /**
   * Task codes for side effects
   */
  taskCodes?: string[];

  /**
   * Callback fired when tasks are successfully managed
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * TasksManage - Manager UI for adding/removing project tasks (V2)
 *
 * This component supports both simple (single task) and batch modes.
 *
 * @example
 * ```tsx
 * // Simple mode - add single task via form
 * <TasksManage
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   onSuccess={() => refetchTasks()}
 * />
 *
 * // Batch mode - pre-configured tasks
 * <TasksManage
 *   projectNftPolicyId="abc123..."
 *   contributorStateId="def456..."
 *   tasksToAdd={[{ project_content: "...", expiration_time: 1735689600, lovelace_amount: 5000000, native_assets: [] }]}
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
    let tasks_to_add: TaskToAdd[] = [];
    let tasks_to_remove: string[] = [];
    let task_codes: string[] = [];

    if (preConfiguredTasksToAdd || preConfiguredTasksToRemove) {
      // Batch mode - use pre-configured values
      tasks_to_add = preConfiguredTasksToAdd ?? [];
      tasks_to_remove = preConfiguredTasksToRemove ?? [];
      task_codes = preConfiguredTaskCodes ?? [];
    } else if (action === "add") {
      // Single task add mode
      if (!taskHash.trim() || !taskCode.trim()) {
        toast.error("Task hash and code are required");
        return;
      }

      if (taskHash.length !== 64) {
        toast.error("Task hash must be 64 characters (hex)");
        return;
      }

      const daysUntilExpiry = parseInt(expirationDays, 10) || 30;
      const expirationTimestamp = Math.floor(Date.now() / 1000) + daysUntilExpiry * 24 * 60 * 60;

      tasks_to_add = [
        {
          project_content: taskHash.trim(),
          expiration_time: expirationTimestamp,
          lovelace_amount: parseInt(rewardLovelace, 10) || 5000000,
          native_assets: [],
        },
      ];
      task_codes = [taskCode.trim()];
    } else {
      // Remove mode
      const hashes = taskHashesToRemove
        .split(",")
        .map((h) => h.trim())
        .filter((h) => h.length === 64);

      if (hashes.length === 0) {
        toast.error("Please enter valid task hashes (64 char hex)");
        return;
      }

      tasks_to_remove = hashes;
    }

    await execute({
      definition: PROJECT_MANAGER_TASKS_MANAGE,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        contributor_state_id: contributorStateId,
        tasks_to_add,
        tasks_to_remove,
        // Side effect params
        task_codes,
      },
      onSuccess: async (txResult) => {
        console.log("[TasksManage] Success!", txResult);

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

        await onSuccess?.();
      },
      onError: (txError) => {
        console.error("[TasksManage] Error:", txError);
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
    // Add mode
    (action === "add" && taskHash.trim().length === 64 && taskCode.trim().length > 0) ||
    // Remove mode
    (action === "remove" && taskHashesToRemove.trim().length > 0)
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
                  <AndamioLabel htmlFor="taskCode">Task Code</AndamioLabel>
                  <AndamioInput
                    id="taskCode"
                    type="text"
                    placeholder="TASK_001"
                    value={taskCode}
                    onChange={(e) => setTaskCode(e.target.value)}
                    disabled={state !== "idle" && state !== "error"}
                  />
                </div>

                <div className="space-y-2">
                  <AndamioLabel htmlFor="taskHash">Task Content Hash (64 char hex)</AndamioLabel>
                  <AndamioInput
                    id="taskHash"
                    type="text"
                    placeholder="abc123def456..."
                    value={taskHash}
                    onChange={(e) => setTaskHash(e.target.value)}
                    disabled={state !== "idle" && state !== "error"}
                    maxLength={64}
                  />
                  <AndamioText variant="small" className="text-xs">
                    {taskHash.length}/64 characters
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
