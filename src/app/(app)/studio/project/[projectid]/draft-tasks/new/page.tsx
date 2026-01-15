"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
import { type ProjectV2Output } from "@andamio/db-api-types";
import { toast } from "sonner";

interface ApiError {
  message?: string;
}

/**
 * Create New Task Page
 *
 * API Endpoints (V2):
 * - GET /project-v2/user/project/:project_id - Get project with states
 * - POST /project-v2/manager/task/create - Create new task
 */
export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectid as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // Project state - need to fetch to get project_state_policy_id
  const [projectStatePolicyId, setProjectStatePolicyId] = useState<string | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);

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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch project to get project_state_policy_id
  useEffect(() => {
    const fetchProject = async () => {
      setIsLoadingProject(true);
      setProjectError(null);

      try {
        // V2 API: GET /project-v2/user/project/:project_id
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/user/project/${projectId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch project");
        }

        const projectData = (await response.json()) as ProjectV2Output;
        const statePolicyId = projectData.states?.[0]?.project_state_policy_id;

        if (!statePolicyId) {
          throw new Error("Project has no on-chain state yet. Please ensure the project is minted first.");
        }

        setProjectStatePolicyId(statePolicyId);
      } catch (err) {
        console.error("Error fetching project:", err);
        setProjectError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setIsLoadingProject(false);
      }
    };

    void fetchProject();
  }, [projectId]);

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
    if (!projectStatePolicyId) {
      setError("Project state not found. Please ensure the project is minted on-chain.");
      return;
    }
    if (!isValid) {
      setError("Please fill in all required fields: title, reward amount (min 1 ADA), and expiration time.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // V2 API: POST /project-v2/manager/task/create
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/manager/task/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_state_policy_id: projectStatePolicyId,
            title: title.trim(),
            content: content.trim() || undefined,
            lovelace: lovelace,
            expiration_time: expirationTime,
            content_json: contentJson,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = "Failed to create task";
        try {
          const errorData = JSON.parse(errorText) as ApiError;
          errorMessage = errorData.message ?? errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("Task Created!", {
        description: `"${title.trim()}" saved as draft.`,
      });

      // Redirect to draft tasks list
      router.push(`/studio/project/${projectId}/draft-tasks`);
      router.refresh();
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
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
  if (isLoadingProject) {
    return <AndamioPageLoading variant="content" />;
  }

  // Project error state
  if (projectError || !projectStatePolicyId) {
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
              isLoading={isSaving}
              disabled={!isValid}
              label="Create Task"
            />
          </AndamioActionFooter>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
