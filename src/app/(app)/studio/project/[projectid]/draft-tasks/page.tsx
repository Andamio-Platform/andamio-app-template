"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import {
  AndamioBadge,
  AndamioButton,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioSectionHeader,
  AndamioTableContainer,
  AndamioEmptyState,
  AndamioText,
  AndamioBackButton,
  AndamioAddButton,
  AndamioRowActions,
  AndamioErrorAlert,
} from "~/components/andamio";
import { TaskIcon, OnChainIcon } from "~/components/icons";
import { type ProjectTaskV2Output } from "~/types/generated";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProject } from "~/lib/andamioscan-events";

interface ApiError {
  message?: string;
}

/**
 * Draft Tasks List - View and manage draft tasks for a project
 *
 * API Endpoints (V2):
 * - GET /project/user/tasks/:project_state_policy_id - Get all tasks
 * - POST /project/manager/task/delete - Delete draft task
 */
export default function DraftTasksPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [tasks, setTasks] = useState<ProjectTaskV2Output[]>([]);
  const [projectStatePolicyId, setProjectStatePolicyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingTaskIndex, setDeletingTaskIndex] = useState<number | null>(null);

  // On-chain status tracking
  const [onChainTaskCount, setOnChainTaskCount] = useState<number>(0);

  const fetchTasks = async () => {
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

      const projectData = await projectResponse.json() as { states?: Array<{ projectNftPolicyId?: string }> };
      const statePolicyId = projectData.states?.[0]?.projectNftPolicyId;

      if (!statePolicyId) {
        // No states yet - empty state
        setProjectStatePolicyId(null);
        setTasks([]);
        return;
      }

      setProjectStatePolicyId(statePolicyId);

      // V2 API: POST /project/manager/tasks/list with {project_id} in body
      // Manager endpoint returns all tasks including DRAFT status
      const tasksResponse = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/tasks/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: statePolicyId }),
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

      const data = (await tasksResponse.json()) as ProjectTaskV2Output[];
      setTasks(data ?? []);

      // Fetch on-chain task count from Andamioscan
      try {
        const projectDetails = await getProject(projectId);
        setOnChainTaskCount(projectDetails?.tasks?.length ?? 0);
      } catch {
        // If Andamioscan fails, just ignore - we'll show DB count only
        setOnChainTaskCount(0);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleDeleteTask = async (taskIndex: number) => {
    if (!isAuthenticated || !projectStatePolicyId) return;

    setDeletingTaskIndex(taskIndex);

    try {
      // V2 API: POST /project/manager/task/delete
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/task/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_state_policy_id: projectStatePolicyId,
            index: taskIndex,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to delete task");
      }

      // Refresh tasks list
      await fetchTasks();
    } catch (err) {
      console.error("Error deleting task:", err);
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeletingTaskIndex(null);
    }
  };

  // Helper to get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "ON_CHAIN":
        return "default";
      case "DRAFT":
        return "secondary";
      case "EXPIRED":
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}`}
          label="Back to Project"
        />

        <AndamioPageHeader
          title="Draft Tasks"
          description="Connect your wallet to manage tasks"
        />

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}`}
          label="Back to Project"
        />

        <AndamioErrorAlert error={error} />
      </div>
    );
  }

  // Separate tasks by status
  const draftTasks = tasks.filter((t) => t.taskStatus === "DRAFT");
  const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");
  const otherTasks = tasks.filter((t) => !["DRAFT", "ON_CHAIN"].includes(t.taskStatus ?? ""));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton
          href={`/studio/project/${projectId}`}
          label="Back to Project"
        />

        <Link href={`/studio/project/${projectId}/draft-tasks/new`}>
          <AndamioAddButton label="New Task" />
        </Link>
      </div>

      <AndamioPageHeader
        title="Tasks"
        description="Manage tasks for this project"
      />

      {/* Status Badges */}
      <div className="flex flex-wrap items-center gap-3">
        <AndamioBadge variant="secondary">
          {draftTasks.length} Draft
        </AndamioBadge>
        <AndamioBadge variant="default" className="bg-primary text-primary-foreground">
          <OnChainIcon className="h-3 w-3 mr-1" />
          {liveTasks.length} Live (DB)
        </AndamioBadge>
        {onChainTaskCount > 0 && (
          <AndamioBadge variant="outline">
            <OnChainIcon className="h-3 w-3 mr-1" />
            {onChainTaskCount} On-Chain
          </AndamioBadge>
        )}
      </div>

      {/* Draft Tasks Section */}
      {draftTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <AndamioSectionHeader title="Draft Tasks" />
            <Link href={`/studio/project/${projectId}/manage-treasury`}>
              <AndamioButton variant="default" size="sm">
                <OnChainIcon className="h-4 w-4 mr-2" />
                Publish Tasks
              </AndamioButton>
            </Link>
          </div>
          <AndamioText variant="small">These tasks are not yet published to the blockchain</AndamioText>
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead className="w-16">#</AndamioTableHead>
                  <AndamioTableHead>Title</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Status</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-right">Actions</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {draftTasks.map((task, index) => {
                  const taskHash = typeof task.taskHash === "string" ? task.taskHash : null;
                  const taskIndex = task.index ?? 0;
                  const taskTitle = typeof task.title === "string" ? task.title : "Untitled Task";
                  return (
                    <AndamioTableRow key={taskHash ?? `draft-${taskIndex}-${index}`}>
                      <AndamioTableCell className="font-mono text-xs">{taskIndex}</AndamioTableCell>
                      <AndamioTableCell className="font-medium">{taskTitle}</AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount ?? 0)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant={getStatusVariant(task.taskStatus ?? "")}>{task.taskStatus}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-right">
                        <AndamioRowActions
                          editHref={`/studio/project/${projectId}/draft-tasks/${taskIndex}`}
                          onDelete={() => handleDeleteTask(taskIndex)}
                          itemName="task"
                          deleteDescription={`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`}
                          isDeleting={deletingTaskIndex === taskIndex}
                        />
                      </AndamioTableCell>
                    </AndamioTableRow>
                  );
                })}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      )}

      {/* Live Tasks Section */}
      {liveTasks.length > 0 && (
        <div className="space-y-3">
          <AndamioSectionHeader title="Live Tasks" />
          <AndamioText variant="small">These tasks are published on-chain and cannot be edited</AndamioText>
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead className="w-16">#</AndamioTableHead>
                  <AndamioTableHead>Title</AndamioTableHead>
                  <AndamioTableHead>Task Hash</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Status</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {liveTasks.map((task) => {
                  // NullableString types are generated as `object`, cast to unknown first for type check
                  const rawHash = task.taskHash as unknown;
                  const rawTitle = task.title as unknown;
                  const taskHash = typeof rawHash === "string" ? rawHash : null;
                  const taskIndex = task.index ?? 0;
                  const taskTitle = typeof rawTitle === "string" ? rawTitle : "Untitled Task";
                  return (
                    <AndamioTableRow key={taskHash ?? taskIndex}>
                      <AndamioTableCell className="font-mono text-xs">{taskIndex}</AndamioTableCell>
                      <AndamioTableCell className="font-medium">
                        <Link
                          href={`/project/${projectId}/${taskHash ?? ""}`}
                          className="hover:underline"
                        >
                          {taskTitle}
                        </Link>
                      </AndamioTableCell>
                      <AndamioTableCell className="font-mono text-xs">
                        {taskHash ? `${taskHash.slice(0, 16)}...` : "-"}
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(parseInt(task.lovelaceAmount ?? "0") || 0)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="default" className="bg-primary text-primary-foreground">
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
        </div>
      )}

      {/* Other Tasks Section */}
      {otherTasks.length > 0 && (
        <div className="space-y-3">
          <AndamioSectionHeader title="Other Tasks" />
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead className="w-16">#</AndamioTableHead>
                  <AndamioTableHead>Title</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Reward</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-center">Status</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {otherTasks.map((task) => {
                  const taskHash = typeof task.taskHash === "string" ? task.taskHash : null;
                  const taskIndex = task.index ?? 0;
                  const taskTitle = typeof task.title === "string" ? task.title : "Untitled Task";
                  return (
                    <AndamioTableRow key={taskHash ?? taskIndex}>
                      <AndamioTableCell className="font-mono text-xs">{taskIndex}</AndamioTableCell>
                      <AndamioTableCell className="font-medium">{taskTitle}</AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount ?? 0)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant={getStatusVariant(task.taskStatus ?? "")}>{task.taskStatus}</AndamioBadge>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  );
                })}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      )}

      {/* Empty State */}
      {tasks.length === 0 && (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Link href={`/studio/project/${projectId}/draft-tasks/new`}>
              <AndamioAddButton label="Create Task" />
            </Link>
          }
        />
      )}
    </div>
  );
}
