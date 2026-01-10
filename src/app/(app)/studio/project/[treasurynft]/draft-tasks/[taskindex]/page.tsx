"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
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
  AndamioRemoveButton,
  AndamioErrorAlert,
  AndamioActionFooter,
} from "~/components/andamio";
import { ContentEditor } from "~/components/editor";
import { AddIcon } from "~/components/icons";
import { type TaskResponse } from "@andamio/db-api-types";
import type { JSONContent } from "@tiptap/core";

type TaskListOutput = TaskResponse[];

interface ApiError {
  message?: string;
}

/**
 * Edit Draft Task Page
 *
 * API Endpoints:
 * - POST /tasks/list (public) - Get task by index
 * - POST /tasks/update (protected) - Update draft task
 */
export default function EditTaskPage() {
  const params = useParams();
  const treasuryNftPolicyId = params.treasurynft as string;
  const taskIndex = parseInt(params.taskindex as string);
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // Task state
  const [task, setTask] = useState<TaskResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lovelace, setLovelace] = useState("1000000");
  const [expirationTime, setExpirationTime] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([""]);
  const [numAllowedCommitments, setNumAllowedCommitments] = useState(1);

  // Content state for editor
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);

  const handleContentChange = (content: JSONContent) => {
    setContentJson(content);
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
        // Go API: GET /project/public/tasks/list/{treasury_nft_policy_id}
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/public/tasks/list/${treasuryNftPolicyId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const tasks = (await response.json()) as TaskListOutput;
        const taskData = tasks.find((t) => t.task_index === taskIndex);

        if (!taskData) {
          throw new Error("Task not found");
        }

        if (taskData.status !== "DRAFT") {
          throw new Error("Only DRAFT tasks can be edited");
        }

        setTask(taskData);
        setTitle(taskData.title);
        setDescription(taskData.description ?? "");
        setLovelace(taskData.lovelace);
        setExpirationTime(taskData.expiration_time);
        setAcceptanceCriteria(taskData.acceptance_criteria && taskData.acceptance_criteria.length > 0 ? taskData.acceptance_criteria : [""]);
        setNumAllowedCommitments(taskData.num_allowed_commitments);
        setContentJson((taskData.content_json as JSONContent) ?? null);
      } catch (err) {
        console.error("Error fetching task:", err);
        setLoadError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTask();
  }, [treasuryNftPolicyId, taskIndex]);

  // Acceptance criteria handlers
  const addCriterion = () => {
    setAcceptanceCriteria([...acceptanceCriteria, ""]);
  };

  const updateCriterion = (index: number, value: string) => {
    const updated = [...acceptanceCriteria];
    updated[index] = value;
    setAcceptanceCriteria(updated);
  };

  const removeCriterion = (index: number) => {
    if (acceptanceCriteria.length > 1) {
      setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
    }
  };

  // Calculate ADA from lovelace
  const adaValue = (parseInt(lovelace) || 0) / 1_000_000;

  // Form validation
  const isValid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    parseInt(lovelace) >= 1000000 &&
    expirationTime.trim().length > 0 &&
    acceptanceCriteria.filter((c) => c.trim().length > 0).length > 0;

  const handleSave = async () => {
    if (!isAuthenticated || !isValid) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Filter out empty acceptance criteria
      const validCriteria = acceptanceCriteria.filter((c) => c.trim().length > 0);

      // Go API: POST /project/owner/task/update
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/owner/task/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treasury_nft_policy_id: treasuryNftPolicyId,
            task_index: taskIndex,
            data: {
              title: title.trim(),
              description: description.trim(),
              lovelace: lovelace,
              expiration_time: expirationTime,
              acceptance_criteria: validCriteria,
              num_allowed_commitments: numAllowedCommitments,
              content_json: contentJson,
            },
          }),
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
          href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}
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
          href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}
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
          href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}
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

          {/* Description */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="description">Description *</AndamioLabel>
            <AndamioTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the task"
              maxLength={360}
              rows={3}
            />
            <AndamioText variant="small" className="text-xs">{description.length}/360 characters</AndamioText>
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

          {/* Number of Commitments */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="commitments">Number of Allowed Commitments</AndamioLabel>
            <AndamioInput
              id="commitments"
              type="number"
              value={numAllowedCommitments}
              onChange={(e) => setNumAllowedCommitments(parseInt(e.target.value) || 1)}
              min={1}
            />
            <AndamioText variant="small" className="text-xs">
              How many contributors can commit to this task
            </AndamioText>
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <AndamioLabel>Acceptance Criteria *</AndamioLabel>
              <AndamioButton variant="outline" size="sm" onClick={addCriterion}>
                <AddIcon className="h-4 w-4 mr-1" />
                Add
              </AndamioButton>
            </div>
            <AndamioText variant="small" className="text-xs mb-2">
              Define what contributors must deliver to complete the task
            </AndamioText>
            <div className="space-y-2">
              {acceptanceCriteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AndamioInput
                    value={criterion}
                    onChange={(e) => updateCriterion(index, e.target.value)}
                    placeholder={`Criterion ${index + 1}`}
                  />
                  {acceptanceCriteria.length > 1 && (
                    <AndamioRemoveButton
                      onClick={() => removeCriterion(index)}
                      ariaLabel={`Remove criterion ${index + 1}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <AndamioActionFooter showBorder>
            <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}>
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
