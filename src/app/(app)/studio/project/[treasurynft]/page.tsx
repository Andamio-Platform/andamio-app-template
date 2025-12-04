"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AlertCircle, ArrowLeft, CheckSquare, ClipboardList, History, Save, Users, Wallet } from "lucide-react";
import { type ListOwnedTreasuriesOutput, type CreateTaskOutput } from "@andamio/db-api";

type TaskListOutput = CreateTaskOutput[];

interface ApiError {
  message?: string;
}

/**
 * Project Dashboard - Edit project details and access management areas
 *
 * API Endpoints:
 * - POST /projects/list-owned (protected) - with treasury_nft_policy_id filter
 * - POST /projects/update (protected) - Update project metadata
 * - POST /tasks/list (public) - Get task summary
 */
export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const treasuryNftPolicyId = params.treasurynft as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [project, setProject] = useState<ListOwnedTreasuriesOutput[0] | null>(null);
  const [tasks, setTasks] = useState<TaskListOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchProjectAndTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch owned projects (POST with body)
        const projectResponse = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/projects/list-owned`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ treasury_nft_policy_id: treasuryNftPolicyId }),
          }
        );

        if (!projectResponse.ok) {
          throw new Error(`Failed to fetch project: ${projectResponse.statusText}`);
        }

        const projectsData = (await projectResponse.json()) as ListOwnedTreasuriesOutput;

        // Find the specific project
        const projectData = projectsData.find(
          (p) => p.treasury_nft_policy_id === treasuryNftPolicyId
        );

        if (!projectData) {
          throw new Error("Project not found or you don't have access");
        }

        setProject(projectData);
        setTitle(projectData.title ?? "");
        // Note: description, imageUrl, videoUrl are not in the list-owned response
        // They would need to be fetched from a separate endpoint if needed

        // Fetch tasks (POST with body)
        const tasksResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/tasks/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ treasury_nft_policy_id: treasuryNftPolicyId }),
          }
        );

        if (tasksResponse.ok) {
          const tasksData = (await tasksResponse.json()) as TaskListOutput;
          setTasks(tasksData ?? []);
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjectAndTasks();
  }, [isAuthenticated, authenticatedFetch, treasuryNftPolicyId]);

  const handleSave = async () => {
    if (!isAuthenticated || !project) {
      setSaveError("You must be authenticated to edit projects");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/projects/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treasury_nft_policy_id: treasuryNftPolicyId,
            data: {
              title: title || undefined,
              description: description || undefined,
              image_url: imageUrl || undefined,
              video_url: videoUrl || undefined,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to update project");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving project:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Link href="/studio/project">
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </AndamioButton>
        </Link>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Authentication Required</AndamioAlertTitle>
          <AndamioAlertDescription>
            Please connect your wallet to access the project dashboard.
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <AndamioSkeleton className="h-8 w-32" />
        <AndamioSkeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link href="/studio/project">
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </AndamioButton>
        </Link>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error ?? "Project not found"}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Count tasks by status
  const draftTasks = tasks.filter((t) => t.status === "DRAFT").length;
  const liveTasks = tasks.filter((t) => t.status === "ON_CHAIN").length;

  const hasChanges = title !== (project.title ?? "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/studio/project">
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Projects
          </AndamioButton>
        </Link>
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            {treasuryNftPolicyId.slice(0, 16)}...
          </AndamioBadge>
          <AndamioBadge variant="default">Published</AndamioBadge>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Project Dashboard</h1>
        <p className="text-muted-foreground">Manage project details and tasks</p>
      </div>

      {/* Success/Error Messages */}
      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Project updated successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && (
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Project Details Form */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Project Details</AndamioCardTitle>
          <AndamioCardDescription>Edit project information</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {/* Treasury NFT Policy ID (Read-only) */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="treasuryNft">Treasury NFT Policy ID</AndamioLabel>
            <AndamioInput id="treasuryNft" value={treasuryNftPolicyId} disabled />
            <p className="text-sm text-muted-foreground">Policy ID cannot be changed</p>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">Title *</AndamioLabel>
            <AndamioInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="description">Description</AndamioLabel>
            <AndamioTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project description"
              rows={4}
            />
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="imageUrl">Image URL</AndamioLabel>
            <AndamioInput
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Video URL */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="videoUrl">Video URL</AndamioLabel>
            <AndamioInput
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <AndamioButton variant="outline" onClick={() => router.push("/studio/project")}>
              Cancel
            </AndamioButton>
            <AndamioButton onClick={handleSave} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </AndamioButton>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Quick Links - Management Areas */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Management</AndamioCardTitle>
          <AndamioCardDescription>Quick access to project management areas</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}>
              <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                <CheckSquare className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Draft Tasks</div>
                  <div className="text-sm text-muted-foreground">
                    {draftTasks} draft, {liveTasks} live
                  </div>
                </div>
              </AndamioButton>
            </Link>

            <Link href={`/studio/project/${treasuryNftPolicyId}/commitments`}>
              <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                <ClipboardList className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Task Commitments</div>
                  <div className="text-sm text-muted-foreground">
                    View and manage submissions
                  </div>
                </div>
              </AndamioButton>
            </Link>

            <Link href={`/studio/project/${treasuryNftPolicyId}/manage-contributors`}>
              <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                <Users className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Contributors</div>
                  <div className="text-sm text-muted-foreground">
                    View enrolled contributors
                  </div>
                </div>
              </AndamioButton>
            </Link>

            <Link href={`/studio/project/${treasuryNftPolicyId}/manage-treasury`}>
              <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                <Wallet className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Treasury</div>
                  <div className="text-sm text-muted-foreground">
                    {project.total_ada?.toLocaleString() ?? 0} ADA available
                  </div>
                </div>
              </AndamioButton>
            </Link>

            <Link href={`/studio/project/${treasuryNftPolicyId}/transaction-history`}>
              <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                <History className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <div className="font-medium">Transaction History</div>
                  <div className="text-sm text-muted-foreground">
                    View past transactions
                  </div>
                </div>
              </AndamioButton>
            </Link>
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Project Stats */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Project Stats</AndamioCardTitle>
          <AndamioCardDescription>Overview of project activity</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{tasks.length}</div>
              <div className="text-sm text-muted-foreground">Total Tasks</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{draftTasks}</div>
              <div className="text-sm text-muted-foreground">Draft Tasks</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{liveTasks}</div>
              <div className="text-sm text-muted-foreground">Live Tasks</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">{project._count?.escrows ?? 0}</div>
              <div className="text-sm text-muted-foreground">Escrows</div>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
