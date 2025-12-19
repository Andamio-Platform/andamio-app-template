"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, ArrowLeft, CheckSquare, Edit, Plus, Trash2 } from "lucide-react";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioPageHeader, AndamioPageLoading, AndamioSectionHeader, AndamioTableContainer, AndamioEmptyState } from "~/components/andamio";
import { AndamioText } from "~/components/andamio/andamio-text";
import { type CreateTaskOutput } from "@andamio/db-api";
import { formatLovelace } from "~/lib/cardano-utils";

type TaskListOutput = CreateTaskOutput[];

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
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/tasks/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ treasury_nft_policy_id: treasuryNftPolicyId }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/tasks/delete`,
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
        <Link href={`/studio/project/${treasuryNftPolicyId}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Project
          </AndamioButton>
        </Link>

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
        <Link href={`/studio/project/${treasuryNftPolicyId}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Project
          </AndamioButton>
        </Link>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error}</AndamioAlertDescription>
        </AndamioAlert>
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
        <Link href={`/studio/project/${treasuryNftPolicyId}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Project
          </AndamioButton>
        </Link>

        <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks/new`}>
          <AndamioButton>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </AndamioButton>
        </Link>
      </div>

      <AndamioPageHeader
        title="Tasks"
        description={`Manage tasks for this project - ${draftTasks.length} draft, ${liveTasks.length} live`}
      />

      {/* Draft Tasks Section */}
      {draftTasks.length > 0 && (
        <div className="space-y-3">
          <AndamioSectionHeader title="Draft Tasks" />
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
                {draftTasks.map((task) => (
                  <AndamioTableRow key={task.index}>
                    <AndamioTableCell className="font-mono text-xs">{task.index}</AndamioTableCell>
                    <AndamioTableCell className="font-medium">{task.title}</AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant="outline">{formatLovelace(task.lovelace)}</AndamioBadge>
                    </AndamioTableCell>
                    <AndamioTableCell className="text-center">
                      <AndamioBadge variant={getStatusVariant(task.status)}>{task.status}</AndamioBadge>
                    </AndamioTableCell>
                    <AndamioTableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks/${task.index}`}>
                          <AndamioButton variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </AndamioButton>
                        </Link>
                        <AndamioConfirmDialog
                          trigger={
                            <AndamioButton
                              variant="ghost"
                              size="sm"
                              disabled={deletingTaskIndex === task.index}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </AndamioButton>
                          }
                          title="Delete Task"
                          description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                          confirmText="Delete"
                          variant="destructive"
                          onConfirm={() => handleDeleteTask(task.index)}
                          isLoading={deletingTaskIndex === task.index}
                        />
                      </div>
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
                  <AndamioTableRow key={task.task_hash ?? task.index}>
                    <AndamioTableCell className="font-mono text-xs">{task.index}</AndamioTableCell>
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
                  <AndamioTableRow key={task.task_hash ?? task.index}>
                    <AndamioTableCell className="font-mono text-xs">{task.index}</AndamioTableCell>
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
          icon={CheckSquare}
          title="No tasks yet"
          description="Create your first task to get started"
          action={
            <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks/new`}>
              <AndamioButton>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </AndamioButton>
            </Link>
          }
        />
      )}
    </div>
  );
}
