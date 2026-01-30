"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import {
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
  AndamioText,
  AndamioBackButton,
  AndamioAddButton,
  AndamioErrorAlert,
  AndamioActionFooter,
} from "~/components/andamio";
import { ContentEditor } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";
import { toast } from "sonner";
import { useProject } from "~/hooks/api/project/use-project";
import { useCreateTask } from "~/hooks/api/project/use-project-manager";

/**
 * Create New Task Page
 *
 * Uses React Query hooks:
 * - useProject(projectId) - Project detail for contributorStateId
 * - useCreateTask() - Create task mutation
 */
export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectid as string;
  const { isAuthenticated } = useAndamioAuth();

  // React Query hooks
  const { data: projectDetail, isLoading: isProjectLoading, error: projectFetchError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;
  const createTask = useCreateTask();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [lovelace, setLovelace] = useState("1000000"); // Default 1 ADA
  const [expirationTime, setExpirationTime] = useState("");

  // Content state for editor
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);

  const handleContentChange = (newContent: JSONContent) => {
    setContentJson(newContent);
  };

  // Save state
  const [error, setError] = useState<string | null>(null);

  // Calculate ADA from lovelace
  const adaValue = (parseInt(lovelace) || 0) / 1_000_000;

  // Form validation
  const isValid =
    title.trim().length > 0 &&
    parseInt(lovelace) >= 1000000 &&
    expirationTime.trim().length > 0;

  const handleCreate = async () => {
    if (!isAuthenticated) {
      setError("You must be authenticated to create tasks");
      return;
    }
    if (!contributorStateId) {
      setError("Project state not found. Please ensure the project is minted on-chain.");
      return;
    }
    if (!isValid) {
      setError("Please fill in all required fields: title, reward amount (min 1 ADA), and expiration time.");
      return;
    }

    setError(null);

    try {
      await createTask.mutateAsync({
        projectStatePolicyId: contributorStateId,
        title: title.trim(),
        content: content.trim() || undefined,
        lovelaceAmount: lovelace,
        expirationTime,
        contentJson,
      });

      toast.success("Task Created!", {
        description: `"${title.trim()}" saved as draft.`,
      });

      // Redirect to draft tasks list
      router.push(`/studio/project/${projectId}/draft-tasks`);
      router.refresh();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
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
          title="Create Task"
          description="Connect your wallet to create tasks"
        />

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  // Loading project state
  if (isProjectLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Project error state
  const projectError = projectFetchError instanceof Error ? projectFetchError.message : projectFetchError ? "Failed to load project" : null;
  if (projectError || !contributorStateId) {
    return (
      <div className="space-y-6">
        <AndamioBackButton
          href={`/studio/project/${projectId}/draft-tasks`}
          label="Back to Tasks"
        />
        <AndamioErrorAlert error={projectError ?? "Project not ready for tasks"} />
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
        <AndamioBadge variant="secondary">Draft</AndamioBadge>
      </div>

      <AndamioPageHeader
        title="Create New Task"
        description="Define a new task for contributors"
      />

      {/* Error Message */}
      {error && <AndamioErrorAlert error={error} />}

      {/* Task Form */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Task Details</AndamioCardTitle>
          <AndamioCardDescription>
            Fill in the task information. Task will be saved as a draft.
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
              <AndamioButton variant="outline" type="button">Cancel</AndamioButton>
            </Link>
            <AndamioAddButton
              type="button"
              onClick={handleCreate}
              isLoading={createTask.isPending}
              disabled={!isValid}
              label="Create Task"
            />
          </AndamioActionFooter>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
