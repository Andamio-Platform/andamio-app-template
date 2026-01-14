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
import { TaskIcon, TreasuryIcon } from "~/components/icons";
import { type TaskResponse } from "@andamio/db-api-types";
import { TasksManage } from "~/components/transactions";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProject } from "~/lib/andamioscan";

type TaskListOutput = TaskResponse[];

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
  const treasuryNftPolicyId = params.treasurynft as string;
  const { isAuthenticated, authenticatedFetch, user } = useAndamioAuth();

  const [tasks, setTasks] = useState<TaskListOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected tasks for publishing
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());

  // Contributor state ID (needed for transaction)
  const [contributorStateId, setContributorStateId] = useState<string | null>(null);

  const fetchData = async () => {
    console.group("[ManageTreasury] 📥 Fetching data");
    console.log("Treasury NFT Policy ID:", treasuryNftPolicyId);

    setIsLoading(true);
    setError(null);

    try {
      // Go API: GET /project/public/task/list/{treasury_nft_policy_id}
      const apiUrl = `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/public/task/list/${treasuryNftPolicyId}`;
      console.log("Fetching tasks from:", apiUrl);

      const tasksResponse = await fetch(apiUrl);

      if (!tasksResponse.ok) {
        const errorText = await tasksResponse.text();
        console.log("Task fetch error:", tasksResponse.status, errorText);

        // Handle "no escrows" errors as empty state
        const noEscrowsError = errorText.toLowerCase().includes("no escrow") ||
                               errorText.toLowerCase().includes("escrow") && tasksResponse.status === 400;
        if (noEscrowsError) {
          console.log("No escrows found - treating as empty task list");
          setTasks([]);
          console.groupEnd();
          return;
        }
        throw new Error("Failed to fetch tasks");
      }

      const tasksData = (await tasksResponse.json()) as TaskListOutput;
      console.log("Tasks fetched:", tasksData?.length ?? 0);
      console.log("Draft tasks:", tasksData?.filter(t => t.status === "DRAFT").length ?? 0);
      console.log("Live tasks:", tasksData?.filter(t => t.status === "ON_CHAIN").length ?? 0);
      setTasks(tasksData ?? []);

      // Try to get project details from Andamioscan for contributor state ID
      console.log("Fetching project details from Andamioscan...");
      try {
        const projectDetails = await getProject(treasuryNftPolicyId);
        if (projectDetails) {
          console.log("Andamioscan project details:", {
            contributors: projectDetails.contributors?.length ?? 0,
            tasks: projectDetails.tasks?.length ?? 0,
            submissions: projectDetails.submissions?.length ?? 0,
          });

          if (projectDetails.tasks.length > 0) {
            // Get the contributor_state_policy_id from an existing task
            const existingTask = projectDetails.tasks[0];
            if (existingTask) {
              console.log("Found contributor_state_policy_id:", existingTask.contributor_state_policy_id);
              setContributorStateId(existingTask.contributor_state_policy_id);
            }
          } else {
            console.log("No on-chain tasks found - contributor_state_id will be omitted (it's optional)");
          }
        } else {
          console.log("Project not found on Andamioscan - may not be indexed yet");
        }
      } catch (scanErr) {
        console.warn("Could not fetch project details from Andamioscan:", scanErr);
        // Not critical - we can still show the UI
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, treasuryNftPolicyId]);

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
      setSelectedTaskIndices(new Set(draftTasks.map((t) => t.task_index)));
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${treasuryNftPolicyId}`} label="Back to Project" />
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
        <AndamioBackButton href={`/studio/project/${treasuryNftPolicyId}`} label="Back to Project" />
        <AndamioErrorAlert error={error} />
      </div>
    );
  }

  // Filter draft tasks
  const draftTasks = tasks.filter((t) => t.status === "DRAFT");
  const liveTasks = tasks.filter((t) => t.status === "ON_CHAIN");

  // Get selected tasks
  const selectedTasks = draftTasks.filter((t) => selectedTaskIndices.has(t.task_index));

  // Convert selected tasks to ProjectData format for the transaction
  // IMPORTANT: project_content is the task description (max 140 chars), NOT a hash!
  // expiration_time must be in MILLISECONDS
  const tasksToAdd: ProjectData[] = selectedTasks.map((task) => {
    // Use task title/description as project_content (truncate to 140 chars)
    const projectContent = (task.title ?? task.description ?? "Task").substring(0, 140);

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

    console.log(`[ManageTreasury] Converting task ${task.task_index}:`, {
      title: task.title,
      project_content: projectData.project_content,
      expiration_time: projectData.expiration_time,
      expiration_date: new Date(projectData.expiration_time).toISOString(),
      lovelace_amount: projectData.lovelace_amount,
      ada_amount: projectData.lovelace_amount / 1_000_000,
    });

    return projectData;
  });

  // Calculate total deposit value (sum of all lovelace amounts)
  const totalLovelace = tasksToAdd.reduce((sum, t) => sum + t.lovelace_amount, 0);
  const depositValue: ListValue = totalLovelace > 0 ? [["lovelace", totalLovelace]] : [];

  // Task codes for side effects
  const taskCodes = selectedTasks.map((t) => `TASK_${t.task_index}`);

  // Log the conversion summary
  if (selectedTasks.length > 0) {
    console.group("[ManageTreasury] 📋 Task Conversion Summary");
    console.log("Selected tasks:", selectedTasks.length);
    console.log("Total deposit:", `${totalLovelace / 1_000_000} ADA`);
    console.log("Deposit value (ListValue format):", depositValue);
    console.log("Task codes:", taskCodes);
    console.log("ProjectData array:", JSON.stringify(tasksToAdd, null, 2));
    console.groupEnd();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/studio/project/${treasuryNftPolicyId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Manage Treasury"
        description="Publish draft tasks on-chain and manage treasury settings"
      />

      {/* Stats */}
      <div className="flex flex-wrap gap-4">
        <AndamioBadge variant="secondary">
          {draftTasks.length} Draft Task{draftTasks.length !== 1 ? "s" : ""}
        </AndamioBadge>
        <AndamioBadge variant="default">
          {liveTasks.length} Live Task{liveTasks.length !== 1 ? "s" : ""}
        </AndamioBadge>
        {selectedTasks.length > 0 && (
          <AndamioBadge variant="outline" className="bg-primary/10">
            {selectedTasks.length} Selected
          </AndamioBadge>
        )}
      </div>

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
                    const isSelected = selectedTaskIndices.has(task.task_index);
                    // Task is valid if it has a title (used as project_content)
                    const isValid = task.title && task.title.length > 0 && task.title.length <= 140;

                    return (
                      <AndamioTableRow
                        key={task.task_hash ?? `draft-${task.task_index}`}
                        className={isSelected ? "bg-primary/5" : ""}
                      >
                        <AndamioTableCell>
                          <AndamioCheckbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleTask(task.task_index)}
                            disabled={!isValid}
                            aria-label={`Select task ${task.task_index}`}
                          />
                        </AndamioTableCell>
                        <AndamioTableCell className="font-mono text-xs">
                          {task.task_index}
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
            {selectedTasks.length > 0 && (
              <>
                {/* Debug info for developers */}
                <div className="rounded-md border bg-muted/30 p-3 text-xs font-mono space-y-1">
                  <div><strong>Transaction Preview:</strong></div>
                  <div>Tasks to add: {tasksToAdd.length}</div>
                  <div>Total deposit: {totalLovelace / 1_000_000} ADA</div>
                  <div>Contributor State ID: {contributorStateId ?? "⚠️ MISSING - waiting for Andamioscan endpoint"}</div>
                </div>

                {contributorStateId ? (
                  <TasksManage
                    projectNftPolicyId={treasuryNftPolicyId}
                    contributorStateId={contributorStateId}
                    tasksToAdd={tasksToAdd}
                    depositValue={depositValue}
                    taskCodes={taskCodes}
                    onSuccess={async () => {
                      console.log("[ManageTreasury] ✅ Tasks published successfully!");
                      // Clear selection and refresh
                      setSelectedTaskIndices(new Set());
                      await fetchData();
                    }}
                  />
                ) : (
                  <div className="rounded-md border border-warning bg-warning/10 p-4 text-sm">
                    <div className="font-medium text-warning-foreground">🚧 Blocked: Missing Contributor State ID</div>
                    <div className="text-muted-foreground mt-1">
                      Task publishing requires a <code className="text-xs bg-muted px-1 rounded">contributor_state_id</code> from Andamioscan.
                      Waiting for updated endpoint from the Andamioscan team.
                    </div>
                  </div>
                )}
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
                    <AndamioTableRow key={task.task_hash ?? task.task_index}>
                      <AndamioTableCell className="font-mono text-xs">
                        {task.task_index}
                      </AndamioTableCell>
                      <AndamioTableCell className="font-medium">{task.title}</AndamioTableCell>
                      <AndamioTableCell className="hidden md:table-cell font-mono text-xs">
                        {task.task_hash ? `${task.task_hash.slice(0, 16)}...` : "-"}
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelace)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="default">Live</AndamioBadge>
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
