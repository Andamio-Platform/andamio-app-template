"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
import { type TaskResponse } from "@andamio/db-api-types";
import { formatLovelace } from "~/lib/cardano-utils";

type TaskListOutput = TaskResponse[];

interface ApiError {
  message?: string;
}

/**
 * Draft Tasks List - View and manage draft tasks for a project
 *
 * API Endpoints:
 * - POST /tasks/list (public) - Get all tasks for project
 * - POST /tasks/delete (protected) - Delete draft task
 */
export default function DraftTasksPage() {
  const params = useParams();
  const treasuryNftPolicyId = params.treasurynft as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [tasks, setTasks] = useState<TaskListOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingTaskIndex, setDeletingTaskIndex] = useState<number | null>(null);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Go API: GET /project/public/task/list/{treasury_nft_policy_id}
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/public/task/list/${treasuryNftPolicyId}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        // Handle "no escrows" errors as empty state (new project, no on-chain activity yet)
        // The API returns 400 when treasury exists but has no escrow records
        const noEscrowsError = errorText.toLowerCase().includes("no escrow") ||
                               errorText.toLowerCase().includes("escrow") && response.status === 400;
        if (noEscrowsError) {
          console.log("Project has no escrows yet - showing empty state");
          setTasks([]);
          return;
        }
        console.error("Tasks fetch error:", errorText);
        throw new Error("Failed to fetch tasks");
      }

      const data = (await response.json()) as TaskListOutput;
      setTasks(data ?? []);
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
  }, [treasuryNftPolicyId]);

  const handleDeleteTask = async (taskIndex: number) => {
    if (!isAuthenticated) return;

    setDeletingTaskIndex(taskIndex);

    try {
      // Go API: POST /project/manager/task/delete
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/manager/task/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treasury_nft_policy_id: treasuryNftPolicyId,
            task_index: taskIndex,
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
          href={`/studio/project/${treasuryNftPolicyId}`}
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
          href={`/studio/project/${treasuryNftPolicyId}`}
          label="Back to Project"
        />

        <AndamioErrorAlert error={error} />
      </div>
    );
  }

  // Separate tasks by status
  const draftTasks = tasks.filter((t) => t.status === "DRAFT");
  const liveTasks = tasks.filter((t) => t.status === "ON_CHAIN");
  const otherTasks = tasks.filter((t) => !["DRAFT", "ON_CHAIN"].includes(t.status));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton
          href={`/studio/project/${treasuryNftPolicyId}`}
          label="Back to Project"
        />

        <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks/new`}>
          <AndamioAddButton label="New Task" />
        </Link>
      </div>

      <AndamioPageHeader
        title="Tasks"
        description={`Manage tasks for this project - ${draftTasks.length} draft, ${liveTasks.length} live`}
      />

      {/* Draft Tasks Section */}
      {draftTasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <AndamioSectionHeader title="Draft Tasks" />
            <Link href={`/studio/project/${treasuryNftPolicyId}/manage-treasury`}>
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
                {draftTasks.map((task, index) => (
                  <AndamioTableRow key={task.task_hash ?? `draft-${task.task_index}-${index}`}>
                    <AndamioTableCell className="font-mono text-xs">{task.task_index}</AndamioTableCell>
                    <AndamioTableCell className="font-medium">{task.title}</AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant="outline">{formatLovelace(task.lovelace)}</AndamioBadge>
                    </AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant={getStatusVariant(task.status)}>{task.status}</AndamioBadge>
                    </AndamioTableCell>
                    <AndamioTableCell className="text-right">
                      <AndamioRowActions
                        editHref={`/studio/project/${treasuryNftPolicyId}/draft-tasks/${task.task_index}`}
                        onDelete={() => handleDeleteTask(task.task_index)}
                        itemName="task"
                        deleteDescription={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                        isDeleting={deletingTaskIndex === task.task_index}
                      />
                    </AndamioTableCell>
                  </AndamioTableRow>
                ))}
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
                {liveTasks.map((task) => (
                  <AndamioTableRow key={task.task_hash ?? task.task_index}>
                    <AndamioTableCell className="font-mono text-xs">{task.task_index}</AndamioTableCell>
                    <AndamioTableCell className="font-medium">
                      <Link
                        href={`/project/${treasuryNftPolicyId}/${task.task_hash}`}
                        className="hover:underline"
                      >
                        {task.title}
                      </Link>
                    </AndamioTableCell>
                    <AndamioTableCell className="font-mono text-xs">
                      {task.task_hash ? `${task.task_hash.slice(0, 16)}...` : "-"}
                    </AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant="outline">{formatLovelace(task.lovelace)}</AndamioBadge>
                    </AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant={getStatusVariant(task.status)}>Live</AndamioBadge>
                    </AndamioTableCell>
                  </AndamioTableRow>
                ))}
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
                {otherTasks.map((task) => (
                  <AndamioTableRow key={task.task_hash ?? task.task_index}>
                    <AndamioTableCell className="font-mono text-xs">{task.task_index}</AndamioTableCell>
                    <AndamioTableCell className="font-medium">{task.title}</AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant="outline">{formatLovelace(task.lovelace)}</AndamioBadge>
                    </AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant={getStatusVariant(task.status)}>{task.status}</AndamioBadge>
                    </AndamioTableCell>
                  </AndamioTableRow>
                ))}
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
            <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks/new`}>
              <AndamioAddButton label="Create Task" />
            </Link>
          }
        />
      )}
    </div>
  );
}
