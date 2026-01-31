"use client";

import React, { useState } from "react";
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
import { formatLovelace } from "~/lib/cardano-utils";
import { useProject } from "~/hooks/api/project/use-project";
import { useManagerTasks, useDeleteTask } from "~/hooks/api/project/use-project-manager";

/**
 * Draft Tasks List - View and manage draft tasks for a project
 *
 * Uses React Query hooks:
 * - useProject(projectId) - Project detail for contributorStateId
 * - useManagerTasks(contributorStateId) - All tasks including DRAFT
 * - useDeleteTask() - Delete task mutation
 */
export default function DraftTasksPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated } = useAndamioAuth();

  // React Query hooks
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;
  const { data: tasks = [], isLoading: isTasksLoading } = useManagerTasks(contributorStateId);
  const deleteTask = useDeleteTask();

  const [deletingTaskIndex, setDeletingTaskIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On-chain task count derived from hook data
  const onChainTaskCount = projectDetail?.tasks?.filter(t => t.taskStatus === "ON_CHAIN").length ?? 0;

  const handleDeleteTask = async (taskIndex: number) => {
    if (!isAuthenticated || !contributorStateId) return;

    setDeletingTaskIndex(taskIndex);

    try {
      await deleteTask.mutateAsync({
        projectStatePolicyId: contributorStateId,
        index: taskIndex,
      });
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
  if (isProjectLoading || isTasksLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  const errorMessage = projectError instanceof Error ? projectError.message : projectError ? "Failed to load project" : error;
  if (errorMessage) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}`}
          label="Back to Project"
        />

        <AndamioErrorAlert error={errorMessage} />
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
                  const taskIndex = task.index ?? 0;
                  return (
                    <AndamioTableRow key={task.taskHash || `draft-${taskIndex}-${index}`}>
                      <AndamioTableCell className="font-mono text-xs">{taskIndex}</AndamioTableCell>
                      <AndamioTableCell className="font-medium">{task.title || "Untitled Task"}</AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant={getStatusVariant(task.taskStatus ?? "")}>{task.taskStatus}</AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell className="text-right">
                        <AndamioRowActions
                          editHref={`/studio/project/${projectId}/draft-tasks/${taskIndex}`}
                          onDelete={() => handleDeleteTask(taskIndex)}
                          itemName="task"
                          deleteDescription={`Are you sure you want to delete "${task.title || "Untitled Task"}"? This action cannot be undone.`}
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
                  const taskIndex = task.index ?? 0;
                  return (
                    <AndamioTableRow key={task.taskHash || taskIndex}>
                      <AndamioTableCell className="font-mono text-xs">{taskIndex}</AndamioTableCell>
                      <AndamioTableCell className="font-medium">
                        <Link
                          href={`/project/${projectId}/${task.taskHash}`}
                          className="hover:underline"
                        >
                          {task.title || "Untitled Task"}
                        </Link>
                      </AndamioTableCell>
                      <AndamioTableCell className="font-mono text-xs">
                        {task.taskHash ? `${task.taskHash.slice(0, 16)}...` : "-"}
                      </AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
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
                  const taskIndex = task.index ?? 0;
                  return (
                    <AndamioTableRow key={task.taskHash || taskIndex}>
                      <AndamioTableCell className="font-mono text-xs">{taskIndex}</AndamioTableCell>
                      <AndamioTableCell className="font-medium">{task.title || "Untitled Task"}</AndamioTableCell>
                      <AndamioTableCell className="text-center">
                        <AndamioBadge variant="outline">{formatLovelace(task.lovelaceAmount)}</AndamioBadge>
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
