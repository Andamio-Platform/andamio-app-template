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
import { type ProjectTaskV2Output, type ProjectV2Output } from "~/types/generated";
import type { JSONContent } from "@tiptap/core";

interface ApiError {
  message?: string;
}

/**
 * Edit Draft Task Page
 *
 * API Endpoints (V2):
 * - GET /project/user/project/:project_id - Get project with states
 * - GET /project/manager/tasks/:project_state_policy_id - Get all tasks (including DRAFT)
 * - POST /project/manager/task/update - Update draft task
 */
export default function EditTaskPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const taskIndex = parseInt(params.taskindex as string);
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // Task state
  const [task, setTask] = useState<ProjectTaskV2Output | null>(null);
  const [projectStatePolicyId, setProjectStatePolicyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lovelace, setLovelace] = useState("1000000");
  const [expirationTime, setExpirationTime] = useState("");

  // Content state for editor
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);

  const handleContentChange = (newContent: JSONContent) => {
    setContentJson(newContent);
  };

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  // Fetch task data
  useEffect(() => {
    const fetchTask = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        // V2 API: Get project first to get project_state_policy_id
        const projectResponse = await fetch(
          `/api/gateway/api/v2/project/user/project/${projectId}`
        );

        if (!projectResponse.ok) {
          throw new Error("Failed to fetch project");
        }

        const project = (await projectResponse.json()) as ProjectV2Output;
        const rawStatePolicyId = project.states?.[0]?.project_state_policy_id;
        const statePolicyId = typeof rawStatePolicyId === "string" ? rawStatePolicyId : null;

        if (!statePolicyId) {
          throw new Error("Project has no states");
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
          throw new Error("Failed to fetch tasks");
        }

        const tasks = (await tasksResponse.json()) as ProjectTaskV2Output[];
        const taskData = tasks.find((t) => t.index === taskIndex);

        if (!taskData) {
          throw new Error("Task not found");
        }

        if (taskData.task_status !== "DRAFT") {
          throw new Error("Only DRAFT tasks can be edited");
        }

        setTask(taskData);
        setTitle(taskData.title ?? "");
        setContent(typeof taskData.content === "string" ? taskData.content : "");
        setLovelace(taskData.lovelace_amount ?? "");
        setExpirationTime(taskData.expiration_time ?? "");
        setContentJson((taskData.content_json as JSONContent) ?? null);
      } catch (err) {
        console.error("Error fetching task:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTask();
  }, [projectId, taskIndex, authenticatedFetch]);

  // Calculate ADA from lovelace
  const adaValue = (parseInt(lovelace) || 0) / 1_000_000;

  // Form validation
  const isValid =
    title.trim().length > 0 &&
    parseInt(lovelace) >= 1000000 &&
    expirationTime.trim().length > 0;

  const handleSave = async () => {
    if (!isAuthenticated || !isValid || !projectStatePolicyId || !task) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // V2 API: POST /project/manager/task/update
      // Use task.index from loaded task data, not URL param
      const requestBody = {
        project_state_policy_id: projectStatePolicyId,
        index: task.index,
        title: title.trim(),
        content: content.trim() || undefined,
        lovelace: lovelace,
        expiration_time: expirationTime,
        content_json: contentJson,
      };

      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/task/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update task");
      }

      showSuccess();
    } catch (err) {
      console.error("Error updating task:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setIsSaving(false);
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
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (loadError || !task) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}/draft-tasks`}
          label="Back to Tasks"
        />

        <AndamioErrorAlert error={loadError ?? "Task not found"} />
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
              isSaving={isSaving}
              disabled={!isValid}
            />
          </AndamioActionFooter>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
