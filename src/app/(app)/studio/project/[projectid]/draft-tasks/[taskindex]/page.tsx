"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import {
  AndamioAlert,
  AndamioAlertTitle,
  AndamioAlertDescription,
  AndamioBadge,
  AndamioButton,
  AndamioInput,
  AndamioLabel,
  AndamioTextarea,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioSaveButton,
  AndamioText,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioActionFooter,
} from "~/components/andamio";
import { ContentEditor } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";
import { useProject } from "~/hooks/api/project/use-project";
import { useManagerTasks, useUpdateTask } from "~/hooks/api/project/use-project-manager";

/**
 * Edit Draft Task Page
 *
 * Uses React Query hooks:
 * - useProject(projectId) - Project detail for contributorStateId
 * - useManagerTasks(contributorStateId) - All tasks including DRAFT
 * - useUpdateTask() - Update draft task mutation
 */
export default function EditTaskPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const taskIndex = parseInt(params.taskindex as string);
  const { isAuthenticated } = useAndamioAuth();

  // React Query hooks
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;
  const { data: allTasks = [], isLoading: isTasksLoading } = useManagerTasks(contributorStateId);
  const updateTask = useUpdateTask();

  // Find the specific task by index
  const taskData = allTasks.find((t) => t.index === taskIndex);
  const loadError = !isProjectLoading && !isTasksLoading && allTasks.length > 0 && !taskData
    ? "Task not found"
    : taskData && taskData.taskStatus !== "DRAFT"
      ? "Only DRAFT tasks can be edited"
      : null;

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lovelace, setLovelace] = useState("1000000");
  const [expirationTime, setExpirationTime] = useState("");

  // Content state for editor
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);
  const [formInitialized, setFormInitialized] = useState(false);

  const handleContentChange = (newContent: JSONContent) => {
    setContentJson(newContent);
  };

  // Save state
  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  // Initialize form when task data loads
  useEffect(() => {
    if (!taskData || formInitialized) return;
    setTitle(taskData.title ?? "");
    setContent(taskData.description ?? "");
    setLovelace(taskData.lovelaceAmount ?? "");
    setExpirationTime(taskData.expirationTime ?? "");
    setContentJson((taskData.contentJson as JSONContent) ?? null);
    setFormInitialized(true);
  }, [taskData, formInitialized]);

  // Calculate ADA from lovelace
  const adaValue = (parseInt(lovelace) || 0) / 1_000_000;

  // Form validation
  const isValid =
    title.trim().length > 0 &&
    parseInt(lovelace) >= 1000000 &&
    expirationTime.trim().length > 0;

  const handleSave = async () => {
    if (!isAuthenticated || !isValid || !contributorStateId || !taskData) return;

    setSaveError(null);

    try {
      await updateTask.mutateAsync({
        projectStatePolicyId: contributorStateId,
        index: taskData.index ?? taskIndex,
        title: title.trim(),
        content: content.trim() || undefined,
        lovelaceAmount: lovelace,
        expirationTime,
        contentJson,
      });
      showSuccess();
    } catch (err) {
      console.error("Error updating task:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to update task");
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}/draft-tasks`}
          label="Back to Tasks"
        />

        <AndamioPageHeader
          title="Edit Task"
          description="Connect your wallet to edit tasks"
        />

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  // Loading state
  if (isProjectLoading || isTasksLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  const errorMessage = projectError instanceof Error ? projectError.message : projectError ? "Failed to load project" : loadError;
  if (errorMessage || !taskData) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}/draft-tasks`}
          label="Back to Tasks"
        />

        <AndamioErrorAlert error={errorMessage ?? "Task not found"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton
          href={`/studio/project/${projectId}/draft-tasks`}
          label="Back to Tasks"
        />
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono">
            #{taskIndex}
          </AndamioBadge>
          <AndamioBadge variant="secondary">Draft</AndamioBadge>
        </div>
      </div>

      <AndamioPageHeader
        title="Edit Task"
        description="Update task details"
      />

      {/* Success/Error Messages */}
      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Task updated successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && <AndamioErrorAlert error={saveError} />}

      {/* Task Form */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Task Details</AndamioCardTitle>
          <AndamioCardDescription>
            Edit the task information. Changes will be saved to the draft.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">Title *</AndamioLabel>
            <AndamioInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={100}
            />
            <AndamioText variant="small" className="text-xs">{title.length}/100 characters</AndamioText>
          </div>

          {/* Content/Description */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="content">Description</AndamioLabel>
            <AndamioTextarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Brief description of the task"
              maxLength={360}
              rows={3}
            />
            <AndamioText variant="small" className="text-xs">{content.length}/360 characters</AndamioText>
          </div>

          {/* Rich Content */}
          <div className="space-y-2">
            <AndamioLabel>Detailed Content (Optional)</AndamioLabel>
            <AndamioText variant="small" className="text-xs mb-2">
              Add detailed instructions, examples, or resources for the task
            </AndamioText>
            <ContentEditor
              content={contentJson}
              onContentChange={handleContentChange}
              minHeight="200px"
              placeholder="Add detailed task instructions..."
            />
          </div>

          {/* Reward (Lovelace) */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="lovelace">Reward Amount (ADA) *</AndamioLabel>
            <div className="flex items-center gap-2">
              <AndamioInput
                id="lovelace"
                type="number"
                value={adaValue}
                onChange={(e) => {
                  const ada = parseFloat(e.target.value) || 0;
                  setLovelace(Math.floor(ada * 1_000_000).toString());
                }}
                min={1}
                step={0.1}
              />
              <AndamioText variant="small">ADA</AndamioText>
            </div>
            <AndamioText variant="small" className="text-xs">
              Minimum 1 ADA ({lovelace} lovelace)
            </AndamioText>
          </div>

          {/* Expiration Time */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="expiration">Expiration Time (POSIX Timestamp) *</AndamioLabel>
            <AndamioInput
              id="expiration"
              value={expirationTime}
              onChange={(e) => setExpirationTime(e.target.value)}
              placeholder="e.g., 1735689600000"
            />
            <AndamioText variant="small" className="text-xs">
              POSIX timestamp in milliseconds. Current time: {Date.now()}
            </AndamioText>
          </div>

          {/* Actions */}
          <AndamioActionFooter showBorder>
            <Link href={`/studio/project/${projectId}/draft-tasks`}>
              <AndamioButton variant="outline">Cancel</AndamioButton>
            </Link>
            <AndamioSaveButton
              onClick={handleSave}
              isSaving={updateTask.isPending}
              disabled={!isValid}
            />
          </AndamioActionFooter>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
