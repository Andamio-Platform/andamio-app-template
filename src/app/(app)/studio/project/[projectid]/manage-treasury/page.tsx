"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
import { type ProjectTaskV2Output } from "@andamio/db-api-types";
import { TasksManage } from "~/components/transactions";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProject, type AndamioscanPrerequisite } from "~/lib/andamioscan";
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

  // On-chain task count from Andamioscan (to detect sync issues)
  const [onChainTaskCount, setOnChainTaskCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // V2 API: First get project to find project_state_policy_id
      const projectResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/user/project/${projectId}`
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

      // V2 API: GET /project-v2/manager/tasks/:project_state_policy_id
      // Manager endpoint returns all tasks including DRAFT status
      const apiUrl = `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/manager/tasks/${projectStatePolicyId}`;

      const tasksResponse = await authenticatedFetch(apiUrl);

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
          status: t.status,
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
            lovelace: t.lovelace,
          })),
        });
        if (projectDetails?.prerequisites) {
          setPrerequisites(projectDetails.prerequisites);
        } else {
          setPrerequisites([]);
        }
        // Track on-chain task count to detect sync issues
        setOnChainTaskCount(projectDetails?.tasks?.length ?? 0);
      } catch {
        // If Andamioscan fails, use empty prerequisites
        setPrerequisites([]);
        setOnChainTaskCount(0);
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
    const draftTasks = tasks.filter((t) => t.status === "DRAFT");
    if (selectedTaskIndices.size === draftTasks.length) {
      // Deselect all
      setSelectedTaskIndices(new Set());
    } else {
      // Select all draft tasks
      setSelectedTaskIndices(new Set(draftTasks.map((t) => t.index)));
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
  const draftTasks = tasks.filter((t) => t.status === "DRAFT");
  const liveTasks = tasks.filter((t) => t.status === "ON_CHAIN");

  // Get selected tasks
  const selectedTasks = draftTasks.filter((t) => selectedTaskIndices.has(t.index));

  // Convert selected tasks to ProjectData format for the transaction
  // IMPORTANT: project_content is the task description (max 140 chars), NOT a hash!
  // expiration_time must be in MILLISECONDS
  const tasksToAdd: ProjectData[] = selectedTasks.map((task) => {
    // Use task title/description as project_content (truncate to 140 chars)
    const projectContent = (task.title ?? task.content ?? "Task").substring(0, 140);

    // Ensure expiration_time is in milliseconds
    // If it's a small number (< year 2000 in ms), it might be in seconds
    let expirationMs = parseInt(task.expiration_time) || 0;
    if (expirationMs < 946684800000) {
      // If less than year 2000 in ms, assume it's in seconds
      expirationMs = expirationMs * 1000;
    }

    const projectData: ProjectData = {
      project_content: projectContent,
      expiration_time: expirationMs,
      lovelace_amount: parseInt(task.lovelace) || 5000000,
      native_assets: [], // Empty for now - could add native tokens later
    };

    return projectData;
  });

  // Calculate total deposit value (sum of all lovelace amounts)
  const totalLovelace = tasksToAdd.reduce((sum, t) => sum + t.lovelace_amount, 0);
  const depositValue: ListValue = totalLovelace > 0 ? [["lovelace", totalLovelace]] : [];

  // Task codes for side effects
  const taskCodes = selectedTasks.map((t) => `TASK_${t.index}`);

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
                    const isSelected = selectedTaskIndices.has(task.index);
                    // Task is valid if it has a title (used as project_content)
                    const isValid = task.title && task.title.length > 0 && task.title.length <= 140;

                    return (
                      <AndamioTableRow
                        key={task.task_hash ?? `draft-${task.index}`}
                        className={isSelected ? "bg-primary/5" : ""}
                      >
                        <AndamioTableCell>
                          <AndamioCheckbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleTask(task.index)}
                            disabled={!isValid}
                            aria-label={`Select task ${task.index}`}
                          />
                        </AndamioTableCell>
                        <AndamioTableCell className="font-mono text-xs">
                          {task.index}
                        </AndamioTableCell>
                        <AndamioTableCell>
                          <div>
                            <AndamioText as="div" className="font-medium">{task.title}</AndamioText>
                            {!isValid && (
                              <AndamioText variant="small" className="text-warning">
                                Title required (max 140 chars) for on-chain content
                              </AndamioText>
                            )}
                          </div>
                        </AndamioTableCell>
                        <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                          {task.task_hash ? `${task.task_hash.slice(0, 16)}...` : "-"}
                        </AndamioTableCell>
                        <AndamioTableCell className="text-center">
                          <AndamioBadge variant="outline">{formatLovelace(task.lovelace)}</AndamioBadge>
                        </AndamioTableCell>
                      </AndamioTableRow>
                    );
                  })}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>

            {/* TasksManage Transaction - only show when tasks are selected */}
            {selectedTasks.length > 0 && contributorStateId && (
              <>
                {/* Transaction preview */}
                <div className="rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                  <div><strong>Transaction Preview:</strong></div>
                  <div>Tasks to add: {tasksToAdd.length}</div>
                  <div>Total deposit: {totalLovelace / 1_000_000} ADA</div>
                  <div>Contributor State ID: {contributorStateId}</div>
                </div>

                <TasksManage
                  projectNftPolicyId={projectId}
                  contributorStateId={contributorStateId}
                  prerequisites={prerequisites}
                  tasksToAdd={tasksToAdd}
                  depositValue={depositValue}
                  taskCodes={taskCodes}
                  onSuccess={async (txHash) => {
                    // Sync on-chain tasks with DB
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

                    // Clear selection and refresh
                    setSelectedTaskIndices(new Set());
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

      {/* Live Tasks (read-only) */}
      {liveTasks.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2">
              <TreasuryIcon className="h-5 w-5" />
              Published Tasks
            </AndamioCardTitle>
            <AndamioCardDescription>
              These tasks are live on-chain and cannot be modified
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
                  {liveTasks.map((task) => (
                    <AndamioTableRow key={task.task_hash ?? task.index}>
                      <AndamioTableCell className="font-mono text-xs">
                        {task.index}
                      </AndamioTableCell>
                      <AndamioTableCell className="font-medium">{task.title}</AndamioTableCell>
                      <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                        {task.task_hash ? `${task.task_hash.slice(0, 16)}...` : "-"}
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelace)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="default" className="bg-success text-success-foreground">
                          <OnChainIcon className="h-3 w-3 mr-1" />
                          On-Chain
                        </AndamioBadge>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  ))}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
