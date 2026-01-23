"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  AndamioBadge,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioEmptyState,
  AndamioText,
  AndamioCheckbox,
} from "~/components/andamio";
import { TaskIcon, TreasuryIcon, OnChainIcon, RefreshIcon } from "~/components/icons";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { type ProjectTaskV2Output } from "~/types/generated";
import { TasksManage } from "~/components/tx";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProject, type AndamioscanPrerequisite, type AndamioscanTask } from "~/lib/andamioscan-events";
import { syncProjectTasks } from "~/lib/project-task-sync";
import { toast } from "sonner";

/**
 * ListValue - Array of [asset_class, quantity] tuples
 * Format: [["lovelace", amount]] or [["policyId.tokenName", amount]]
 */
type ListValue = Array<[string, number]>;

/**
 * ProjectData - Task formatted for on-chain publishing
 *
 * IMPORTANT: This matches the Atlas API ManageTasksTxRequest schema
 * @see https://atlas-api-preprod-507341199760.us-central1.run.app/swagger.json
 *
 * @property project_content - Task content text (max 140 chars, NOT a hash!)
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
 * Decode hex string to UTF-8 text
 */
function hexToText(hex: string): string {
  try {
    const bytes = new Uint8Array(
      hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
    );
    return new TextDecoder().decode(bytes);
  } catch {
    return "";
  }
}

/**
 * Manage Treasury Page
 *
 * Allows managers to publish draft tasks on-chain via the TasksManage transaction.
 * Tasks must be in DRAFT status to be published.
 */
export default function ManageTreasuryPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [tasks, setTasks] = useState<ProjectTaskV2Output[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected tasks for publishing
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());

  // Contributor state ID (needed for transaction)
  const [contributorStateId, setContributorStateId] = useState<string | null>(null);

  // Prerequisites from Andamioscan (needed for transaction)
  const [prerequisites, setPrerequisites] = useState<AndamioscanPrerequisite[]>([]);

  // On-chain tasks from Andamioscan (for removal)
  const [onChainTasks, setOnChainTasks] = useState<AndamioscanTask[]>([]);
  const [selectedOnChainTaskIds, setSelectedOnChainTaskIds] = useState<Set<string>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  // Derived: on-chain task count
  const onChainTaskCount = onChainTasks.length;

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // V2 API: First get project to find project_state_policy_id
      const projectResponse = await fetch(
        `/api/gateway/api/v2/project/user/project/${projectId}`
      );

      if (!projectResponse.ok) {
        throw new Error("Failed to fetch project");
      }

      const projectData = await projectResponse.json() as { states?: Array<{ project_state_policy_id?: string }> };
      const projectStatePolicyId = projectData.states?.[0]?.project_state_policy_id;

      if (!projectStatePolicyId) {
        setTasks([]);
        return;
      }

      // V2 API: POST /project/manager/tasks/list with {project_id} in body
      // Manager endpoint returns all tasks including DRAFT status
      const tasksResponse = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/tasks/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectStatePolicyId }),
        }
      );

      if (!tasksResponse.ok) {
        // 404 means no tasks yet
        if (tasksResponse.status === 404) {
          setTasks([]);
          return;
        }
        throw new Error("Failed to fetch tasks");
      }

      const tasksData = (await tasksResponse.json()) as ProjectTaskV2Output[];
      console.log("[manage-treasury] Fetched DB tasks:", {
        count: tasksData?.length ?? 0,
        tasks: tasksData?.map((t) => ({
          index: t.index,
          title: t.title,
          task_status: t.task_status,
          task_hash: t.task_hash,
        })),
      });
      setTasks(tasksData ?? []);

      // The project_state_policy_id IS the contributor_state_id for the Atlas TX API
      setContributorStateId(projectStatePolicyId);

      // Fetch prerequisites and on-chain tasks from Andamioscan
      try {
        const projectDetails = await getProject(projectId);
        console.log("[manage-treasury] Fetched Andamioscan data:", {
          taskCount: projectDetails?.tasks?.length ?? 0,
          tasks: projectDetails?.tasks?.map((t) => ({
            task_id: t.task_id,
            lovelace_amount: t.lovelace_amount,
            content: hexToText(t.content),
          })),
        });
        if (projectDetails?.prerequisites) {
          setPrerequisites(projectDetails.prerequisites);
        } else {
          setPrerequisites([]);
        }
        // Store full on-chain tasks for removal feature
        setOnChainTasks(projectDetails?.tasks ?? []);
      } catch {
        // If Andamioscan fails, use empty prerequisites
        setPrerequisites([]);
        setOnChainTasks([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, projectId]);

  const handleToggleTask = (taskIndex: number) => {
    setSelectedTaskIndices((prev) => {
      const next = new Set(prev);
      if (next.has(taskIndex)) {
        next.delete(taskIndex);
      } else {
        next.add(taskIndex);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const draftTasks = tasks.filter((t) => t.task_status === "DRAFT");
    if (selectedTaskIndices.size === draftTasks.length) {
      // Deselect all
      setSelectedTaskIndices(new Set());
    } else {
      // Select all draft tasks - filter out undefined indices
      setSelectedTaskIndices(new Set(draftTasks.map((t) => t.index).filter((idx): idx is number => idx !== undefined)));
    }
  };

  const handleToggleOnChainTask = (taskId: string) => {
    setSelectedOnChainTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleSelectAllOnChain = () => {
    if (selectedOnChainTaskIds.size === onChainTasks.length) {
      // Deselect all
      setSelectedOnChainTaskIds(new Set());
    } else {
      // Select all on-chain tasks
      setSelectedOnChainTaskIds(new Set(onChainTasks.map((t) => t.task_id)));
    }
  };

  const handleManualSync = async () => {
    if (!contributorStateId) {
      toast.error("Cannot sync: missing contributor state ID");
      return;
    }

    console.log("[manage-treasury] Starting manual sync...");
    console.log("[manage-treasury] projectId:", projectId);
    console.log("[manage-treasury] contributorStateId:", contributorStateId);
    console.log("[manage-treasury] Current state - tasks:", tasks.length, "onChainTaskCount:", onChainTaskCount);

    setIsSyncing(true);
    toast.info("Syncing with blockchain...");

    try {
      // Sync tasks - the function will automatically get tx_hash from treasury_fundings
      const syncResult = await syncProjectTasks(
        projectId,
        contributorStateId,
        "", // Empty txHash - will be fetched from treasury_fundings automatically
        authenticatedFetch,
        false // Not a dry run - actually sync
      );

      console.log("[manage-treasury] Sync result:", {
        confirmed: syncResult.confirmed,
        matchedCount: syncResult.matched.length,
        unmatchedDbCount: syncResult.unmatchedDb.length,
        unmatchedOnChainCount: syncResult.unmatchedOnChain.length,
        errors: syncResult.errors,
      });

      if (syncResult.confirmed > 0) {
        toast.success(`Synced ${syncResult.confirmed} task(s) with blockchain`, {
          description: `${syncResult.confirmed} task(s) updated to ON_CHAIN status`,
        });
      } else if (syncResult.matched.length > 0 && syncResult.errors.length > 0) {
        // Matched but couldn't confirm
        toast.warning(`Found ${syncResult.matched.length} matching task(s)`, {
          description: syncResult.errors[0],
          duration: 8000,
        });
      } else if (syncResult.unmatchedOnChain.length > 0 && syncResult.unmatchedDb.length === 0) {
        // On-chain tasks exist but no matching DB tasks
        toast.warning("On-chain tasks don't match database", {
          description: `Found ${syncResult.unmatchedOnChain.length} on-chain task(s) with no matching database entries. This may happen if tasks were created directly on-chain.`,
          duration: 8000,
        });
      } else if (syncResult.errors.length > 0) {
        toast.error("Sync failed", {
          description: syncResult.errors[0],
        });
      } else {
        toast.success("Database is in sync with blockchain");
      }

      // Refresh data to get latest state
      console.log("[manage-treasury] Refreshing data after sync...");
      await fetchData();
      console.log("[manage-treasury] Data refreshed - tasks:", tasks.length);
    } catch (err) {
      console.error("[manage-treasury] Sync error:", err);
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert
          title="Authentication Required"
          error="Please connect your wallet to manage the treasury."
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={error} />
      </div>
    );
  }

  // Filter draft tasks
  const draftTasks = tasks.filter((t) => t.task_status === "DRAFT");
  const liveTasks = tasks.filter((t) => t.task_status === "ON_CHAIN");

  // Get selected tasks (filter for valid indices)
  const selectedTasks = draftTasks.filter((t) => t.index !== undefined && selectedTaskIndices.has(t.index));

  // Convert selected tasks to ProjectData format for the transaction
  // IMPORTANT: project_content is the task description (max 140 chars), NOT a hash!
  // expiration_posix must be in MILLISECONDS
  const tasksToAdd: ProjectData[] = selectedTasks.map((task) => {
    // Use task title/description as project_content (truncate to 140 chars)
    const taskTitle = typeof task.title === "string" ? task.title : "";
    const taskContent = typeof task.content === "string" ? task.content : "";
    const projectContent = (taskTitle || taskContent || "Task").substring(0, 140);

    // Ensure expiration_posix is in milliseconds
    // If it's a small number (< year 2000 in ms), it might be in seconds
    const expirationStr = typeof task.expiration_time === "string" ? task.expiration_time : "0";
    let expirationMs = parseInt(expirationStr) || 0;
    if (expirationMs < 946684800000) {
      // If less than year 2000 in ms, assume it's in seconds
      expirationMs = expirationMs * 1000;
    }

    const projectData: ProjectData = {
      project_content: projectContent,
      expiration_posix: expirationMs,
      lovelace_amount: parseInt(task.lovelace_amount ?? "5000000") || 5000000,
      native_assets: [], // Empty for now - could add native tokens later
    };

    return projectData;
  });


  // Task codes and indices for side effects
  const taskCodes = selectedTasks.map((t) => `TASK_${t.index}`);
  const taskIndices = selectedTasks.map((t) => t.index).filter((idx): idx is number => idx !== undefined);

  // Convert selected on-chain tasks to ProjectData format for removal
  // IMPORTANT: tasks_to_remove requires full ProjectData objects, NOT just hashes!
  const selectedOnChainTasks = onChainTasks.filter((t) => selectedOnChainTaskIds.has(t.task_id));
  const tasksToRemove: ProjectData[] = selectedOnChainTasks.map((task) => {
    // Decode hex content to text
    const projectContent = hexToText(task.content);

    // Andamioscan's expiration_posix is already in milliseconds (despite the name)
    // Atlas API also expects milliseconds
    const expirationMs = task.expiration_posix;

    return {
      project_content: projectContent,
      expiration_posix: expirationMs,
      lovelace_amount: task.lovelace_amount,
      native_assets: [], // On-chain tasks from Andamioscan don't include native_assets yet
    };
  });

  // Net deposit: add lovelace for new tasks, subtract for removed tasks
  const addLovelace = tasksToAdd.reduce((sum, t) => sum + t.lovelace_amount, 0);
  const removeLovelace = tasksToRemove.reduce((sum, t) => sum + t.lovelace_amount, 0);
  const netDeposit = addLovelace - removeLovelace;

  // Calculate deposit value (only if net positive - i.e., adding more than removing)
  const depositValue: ListValue = netDeposit > 0 ? [["lovelace", netDeposit]] : [];

  // Show transaction UI if any tasks are selected (to add or remove)
  const hasTasksToManage = tasksToAdd.length > 0 || tasksToRemove.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Manage Treasury"
        description="Publish draft tasks on-chain and manage treasury settings"
      />

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-4">
        <AndamioBadge variant="secondary">
          {draftTasks.length} Draft Task{draftTasks.length !== 1 ? "s" : ""}
        </AndamioBadge>
        <AndamioBadge variant="default" className="bg-success text-success-foreground">
          <OnChainIcon className="h-3 w-3 mr-1" />
          {liveTasks.length} Live Task{liveTasks.length !== 1 ? "s" : ""}
        </AndamioBadge>
        <AndamioBadge variant="outline">
          <OnChainIcon className="h-3 w-3 mr-1" />
          {onChainTaskCount} On-Chain (Andamioscan)
        </AndamioBadge>
        {selectedTasks.length > 0 && (
          <AndamioBadge variant="outline" className="bg-primary/10">
            {selectedTasks.length} Selected
          </AndamioBadge>
        )}
      </div>

      {/* Sync Warning - show when on-chain count doesn't match DB live count */}
      {onChainTaskCount > liveTasks.length && (
        <div className="flex items-center justify-between rounded-lg border border-warning bg-warning/10 p-4">
          <div className="flex items-center gap-3">
            <OnChainIcon className="h-5 w-5 text-warning" />
            <div>
              <AndamioText className="font-medium">Database out of sync</AndamioText>
              <AndamioText variant="small">
                {onChainTaskCount} task{onChainTaskCount !== 1 ? "s" : ""} on-chain, but only {liveTasks.length} marked as live in database.
                {" "}Click Sync Now to update the database.
              </AndamioText>
            </div>
          </div>
          <AndamioButton
            variant="outline"
            size="sm"
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            <RefreshIcon className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </AndamioButton>
        </div>
      )}

      {/* Draft Tasks for Publishing */}
      {draftTasks.length > 0 ? (
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <AndamioCardTitle className="flex items-center gap-2">
                  <TaskIcon className="h-5 w-5" />
                  Draft Tasks Ready to Publish
                </AndamioCardTitle>
                <AndamioCardDescription>
                  Select tasks to publish on-chain. Tasks must have a valid hash.
                </AndamioCardDescription>
              </div>
              <AndamioCheckbox
                checked={selectedTaskIndices.size === draftTasks.length && draftTasks.length > 0}
                onCheckedChange={handleSelectAll}
                aria-label="Select all draft tasks"
              />
            </div>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead className="w-12"></AndamioTableHead>
                    <AndamioTableHead className="w-16">#</AndamioTableHead>
                    <AndamioTableHead>Title</AndamioTableHead>
                    <AndamioTableHead className="hidden md:table-cell">Hash</AndamioTableHead>
                    <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {draftTasks.map((task) => {
                    // NullableString types are generated as `object`, cast to unknown first for type check
                    const rawTitle = task.title as unknown;
                    const rawHash = task.task_hash as unknown;
                    const taskIndex = task.index ?? 0;
                    const taskTitle = typeof rawTitle === "string" ? rawTitle : "";
                    const taskHash = typeof rawHash === "string" ? rawHash : null;
                    const isSelected = selectedTaskIndices.has(taskIndex);
                    // Task is valid if it has a title (used as project_content)
                    const isValid = taskTitle.length > 0 && taskTitle.length <= 140;

                    return (
                      <AndamioTableRow
                        key={taskHash ?? `draft-${taskIndex}`}
                        className={isSelected ? "bg-primary/5" : ""}
                      >
                        <AndamioTableCell>
                          <AndamioCheckbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleTask(taskIndex)}
                            disabled={!isValid}
                            aria-label={`Select task ${taskIndex}`}
                          />
                        </AndamioTableCell>
                        <AndamioTableCell className="font-mono text-xs">
                          {taskIndex}
                        </AndamioTableCell>
                        <AndamioTableCell>
                          <div>
                            <AndamioText as="div" className="font-medium">{taskTitle || "Untitled Task"}</AndamioText>
                            {!isValid && (
                              <AndamioText variant="small" className="text-warning">
                                Title required (max 140 chars) for on-chain content
                              </AndamioText>
                            )}
                          </div>
                        </AndamioTableCell>
                        <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                          {taskHash ? `${taskHash.slice(0, 16)}...` : "-"}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          <AndamioBadge variant="outline">{formatLovelace(parseInt(task.lovelace_amount ?? "0") || 0)}</AndamioBadge>
                        </AndamioTableCell>
                      </AndamioTableRow>
                    );
                  })}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>

            {/* TasksManage Transaction - show when any tasks are selected (add or remove) */}
            {hasTasksToManage && contributorStateId && (
              <>
                {/* Transaction preview */}
                <div className="rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                  <div><strong>Transaction Preview:</strong></div>
                  {tasksToAdd.length > 0 && (
                    <div className="text-success">+ Adding: {tasksToAdd.length} task(s) ({addLovelace / 1_000_000} ADA)</div>
                  )}
                  {tasksToRemove.length > 0 && (
                    <div className="text-destructive">- Removing: {tasksToRemove.length} task(s) ({removeLovelace / 1_000_000} ADA returned)</div>
                  )}
                  <div className={netDeposit >= 0 ? "" : "text-success"}>
                    Net deposit: {netDeposit >= 0 ? `${netDeposit / 1_000_000} ADA` : `${Math.abs(netDeposit) / 1_000_000} ADA returned`}
                  </div>
                  <div>Contributor State ID: {contributorStateId}</div>
                </div>

                <TasksManage
                  projectNftPolicyId={projectId}
                  contributorStateId={contributorStateId}
                  prerequisites={prerequisites}
                  tasksToAdd={tasksToAdd}
                  tasksToRemove={tasksToRemove}
                  depositValue={depositValue}
                  taskCodes={taskCodes}
                  taskIndices={taskIndices}
                  onSuccess={async (txHash, computedHashes) => {
                    // Update DB with computed task hashes immediately
                    if (computedHashes && computedHashes.length > 0 && contributorStateId) {
                      console.log("[manage-treasury] Updating DB with computed hashes:", computedHashes);
                      toast.info("Saving task hashes to database...");

                      let successCount = 0;
                      let errorCount = 0;

                      for (const computed of computedHashes) {
                        try {
                          // First, set task to PENDING_TX status
                          const pendingResponse = await authenticatedFetch(
                            `/api/gateway/api/v2/project/manager/task/batch-status`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                project_state_policy_id: contributorStateId,
                                tasks: [{
                                  index: computed.taskIndex,
                                  status: "PENDING_TX",
                                }],
                              }),
                            }
                          );

                          if (!pendingResponse.ok) {
                            console.warn(`[manage-treasury] Failed to set PENDING_TX for task ${computed.taskIndex}`);
                          }

                          // Then, call confirm-tx with the computed hash
                          const confirmResponse = await authenticatedFetch(
                            `/api/gateway/api/v2/project/manager/task/confirm-tx`,
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                project_state_policy_id: contributorStateId,
                                index: computed.taskIndex,
                                tx_hash: txHash,
                                task_hash: computed.taskHash,
                              }),
                            }
                          );

                          if (confirmResponse.ok) {
                            console.log(`[manage-treasury] Successfully saved task_hash for task ${computed.taskIndex}: ${computed.taskHash.slice(0, 16)}...`);
                            successCount++;
                          } else {
                            const errorData = await confirmResponse.json().catch(() => ({}));
                            console.error(`[manage-treasury] Failed to save task_hash for task ${computed.taskIndex}:`, errorData);
                            errorCount++;
                          }
                        } catch (err) {
                          console.error(`[manage-treasury] Error saving task_hash for task ${computed.taskIndex}:`, err);
                          errorCount++;
                        }
                      }

                      if (successCount > 0) {
                        toast.success(`Saved ${successCount} task hash(es) to database`);
                      }
                      if (errorCount > 0) {
                        toast.warning(`Failed to save ${errorCount} task hash(es)`);
                      }
                    } else {
                      // Fall back to old sync behavior for tasks_to_remove or if no computed hashes
                      toast.info("Syncing tasks with blockchain...");
                      const syncResult = await syncProjectTasks(
                        projectId,
                        contributorStateId,
                        txHash,
                        authenticatedFetch
                      );

                      if (syncResult.confirmed > 0) {
                        toast.success(`Synced ${syncResult.confirmed} task(s) with blockchain`);
                      } else if (syncResult.errors.length > 0) {
                        toast.warning("Sync completed with errors", {
                          description: syncResult.errors[0],
                        });
                      }
                    }

                    // Clear selections and refresh
                    setSelectedTaskIndices(new Set());
                    setSelectedOnChainTaskIds(new Set());
                    await fetchData();
                  }}
                />
              </>
            )}
          </AndamioCardContent>
        </AndamioCard>
      ) : (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No Draft Tasks"
          description="All tasks have been published on-chain, or no tasks have been created yet."
        />
      )}

      {/* On-Chain Tasks - can be selected for removal */}
      {onChainTasks.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <AndamioCardTitle className="flex items-center gap-2">
                  <OnChainIcon className="h-5 w-5" />
                  On-Chain Tasks (from Andamioscan)
                </AndamioCardTitle>
                <AndamioCardDescription>
                  Select tasks to remove from the project. Removed tasks return their deposit.
                </AndamioCardDescription>
              </div>
              <AndamioCheckbox
                checked={selectedOnChainTaskIds.size === onChainTasks.length && onChainTasks.length > 0}
                onCheckedChange={handleSelectAllOnChain}
                aria-label="Select all on-chain tasks"
              />
            </div>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead className="w-12"></AndamioTableHead>
                    <AndamioTableHead>Content</AndamioTableHead>
                    <AndamioTableHead className="hidden md:table-cell">Task ID</AndamioTableHead>
                    <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                    <AndamioTableHead className="hidden sm:table-cell w-32 text-center">Expires</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {onChainTasks.map((task) => {
                    const isSelected = selectedOnChainTaskIds.has(task.task_id);
                    const decodedContent = hexToText(task.content);
                    const expirationDate = new Date(task.expiration_posix);

                    return (
                      <AndamioTableRow
                        key={task.task_id}
                        className={isSelected ? "bg-destructive/5" : ""}
                      >
                        <AndamioTableCell>
                          <AndamioCheckbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleOnChainTask(task.task_id)}
                            aria-label={`Select task for removal`}
                          />
                        </AndamioTableCell>
                        <AndamioTableCell>
                          <AndamioText as="div" className="font-medium">
                            {decodedContent || "(empty content)"}
                          </AndamioText>
                        </AndamioTableCell>
                        <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                          {task.task_id.slice(0, 16)}...
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          <AndamioBadge variant="outline">{formatLovelace(String(task.lovelace_amount))}</AndamioBadge>
                        </AndamioTableCell>
                        <AndamioTableCell className="hidden sm:table-cell text-center text-xs text-muted-foreground">
                          {expirationDate.toLocaleDateString()}
                        </AndamioTableCell>
                      </AndamioTableRow>
                    );
                  })}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>

            {/* Show transaction UI if tasks selected for removal (and no draft tasks selected) */}
            {tasksToRemove.length > 0 && tasksToAdd.length === 0 && contributorStateId && (
              <>
                <div className="rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1 mt-4">
                  <div><strong>Transaction Preview:</strong></div>
                  <div className="text-destructive">- Removing: {tasksToRemove.length} task(s) ({removeLovelace / 1_000_000} ADA returned)</div>
                  <div>Contributor State ID: {contributorStateId}</div>
                </div>

                <TasksManage
                  projectNftPolicyId={projectId}
                  contributorStateId={contributorStateId}
                  prerequisites={prerequisites}
                  tasksToAdd={[]}
                  tasksToRemove={tasksToRemove}
                  depositValue={[]}
                  taskCodes={[]}
                  taskIndices={[]}
                  onSuccess={async (_txHash, _computedHashes) => {
                    // No computed hashes for removal - just refresh
                    toast.success("Tasks removed successfully!");
                    setSelectedOnChainTaskIds(new Set());
                    await fetchData();
                  }}
                />
              </>
            )}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* DB Live Tasks (read-only info) */}
      {liveTasks.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2">
              <TreasuryIcon className="h-5 w-5" />
              Database Status
            </AndamioCardTitle>
            <AndamioCardDescription>
              Tasks marked as ON_CHAIN in the database
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead className="w-16">#</AndamioTableHead>
                    <AndamioTableHead>Title</AndamioTableHead>
                    <AndamioTableHead className="hidden md:table-cell">Hash</AndamioTableHead>
                    <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                    <AndamioTableHead className="w-24 text-center">Status</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {liveTasks.map((task) => {
                    // NullableString types are generated as `object`, cast to unknown first for type check
                    const rawTitle = task.title as unknown;
                    const rawHash = task.task_hash as unknown;
                    const taskIndex = task.index ?? 0;
                    const taskTitle = typeof rawTitle === "string" ? rawTitle : "Untitled Task";
                    const taskHash = typeof rawHash === "string" ? rawHash : null;
                    return (
                      <AndamioTableRow key={taskHash ?? taskIndex}>
                        <AndamioTableCell className="font-mono text-xs">
                          {taskIndex}
                        </AndamioTableCell>
                        <AndamioTableCell className="font-medium">{taskTitle}</AndamioTableCell>
                        <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                          {taskHash ? `${taskHash.slice(0, 16)}...` : "-"}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          <AndamioBadge variant="outline">{formatLovelace(parseInt(task.lovelace_amount ?? "0") || 0)}</AndamioBadge>
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          <AndamioBadge variant="default" className="bg-success text-success-foreground">
                            <OnChainIcon className="h-3 w-3 mr-1" />
                            On-Chain
                          </AndamioBadge>
                        </AndamioTableCell>
                      </AndamioTableRow>
                    );
                  })}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
