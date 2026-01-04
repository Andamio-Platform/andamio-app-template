"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
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
  AndamioTabs,
  AndamioTabsContent,
  AndamioTabsList,
  AndamioTabsTrigger,
  AndamioText,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioActionFooter,
} from "~/components/andamio";
import { TaskIcon, AssignmentIcon, HistoryIcon, TeacherIcon, TreasuryIcon, LessonIcon, ChartIcon, SettingsIcon, AlertIcon } from "~/components/icons";
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const treasuryNftPolicyId = params.treasurynft as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["overview", "tasks", "team", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

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
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

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

      showSuccess();
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
        <AndamioBackButton href="/studio/project" label="Back to Projects" />
        <AndamioErrorAlert
          error="Please connect your wallet to access the project dashboard."
          title="Authentication Required"
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/studio/project" label="Back to Projects" />
        <AndamioErrorAlert error={error ?? "Project not found"} />
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
        <AndamioBackButton href="/studio/project" label="Back to Projects" />
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            {treasuryNftPolicyId.slice(0, 16)}...
          </AndamioBadge>
          <AndamioBadge variant="default">Published</AndamioBadge>
        </div>
      </div>

      <AndamioPageHeader
        title="Project Dashboard"
        description={project.title ?? "Manage project details and tasks"}
      />

      {/* Success/Error Messages */}
      {saveSuccess && (
        <AndamioAlert>
          <AndamioAlertTitle>Success</AndamioAlertTitle>
          <AndamioAlertDescription>Project updated successfully</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {saveError && (
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{saveError}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Tabbed Interface */}
      <AndamioTabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <AndamioTabsList className="grid w-full grid-cols-4">
          <AndamioTabsTrigger value="overview" className="flex items-center gap-2">
            <ChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="tasks" className="flex items-center gap-2">
            <TaskIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Tasks</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="team" className="flex items-center gap-2">
            <TeacherIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Team</span>
          </AndamioTabsTrigger>
          <AndamioTabsTrigger value="settings" className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </AndamioTabsTrigger>
        </AndamioTabsList>

        {/* Overview Tab */}
        <AndamioTabsContent value="overview" className="mt-6 space-y-4">
          {/* Project Stats */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <ChartIcon className="h-5 w-5" />
                Project Stats
              </AndamioCardTitle>
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

          {/* Treasury Overview */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <TreasuryIcon className="h-5 w-5" />
                Treasury
              </AndamioCardTitle>
              <AndamioCardDescription>Project funds and transactions</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                  <div className="text-2xl font-bold">{project.total_ada?.toLocaleString() ?? 0} ADA</div>
                </div>
                <Link href={`/studio/project/${treasuryNftPolicyId}/manage-treasury`}>
                  <AndamioButton variant="outline">
                    <TreasuryIcon className="h-4 w-4 mr-2" />
                    Manage Treasury
                  </AndamioButton>
                </Link>
              </div>
              <Link href={`/studio/project/${treasuryNftPolicyId}/transaction-history`}>
                <AndamioButton variant="outline" className="w-full justify-start">
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  View Transaction History
                </AndamioButton>
              </Link>
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        {/* Tasks Tab */}
        <AndamioTabsContent value="tasks" className="mt-6 space-y-4">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <TaskIcon className="h-5 w-5" />
                Task Management
              </AndamioCardTitle>
              <AndamioCardDescription>Create and manage project tasks</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-3">
              <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}>
                <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                  <TaskIcon className="h-5 w-5 mr-3" />
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
                  <AssignmentIcon className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Task Commitments</div>
                    <div className="text-sm text-muted-foreground">
                      View and manage submissions
                    </div>
                  </div>
                </AndamioButton>
              </Link>
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        {/* Team Tab */}
        <AndamioTabsContent value="team" className="mt-6 space-y-4">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <TeacherIcon className="h-5 w-5" />
                Contributors
              </AndamioCardTitle>
              <AndamioCardDescription>Manage project contributors</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <Link href={`/studio/project/${treasuryNftPolicyId}/manage-contributors`}>
                <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                  <TeacherIcon className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">View Contributors</div>
                    <div className="text-sm text-muted-foreground">
                      View and manage enrolled contributors
                    </div>
                  </div>
                </AndamioButton>
              </Link>
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        {/* Settings Tab */}
        <AndamioTabsContent value="settings" className="mt-6">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <LessonIcon className="h-5 w-5" />
                Project Details
              </AndamioCardTitle>
              <AndamioCardDescription>Edit project information</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              {/* Treasury NFT Policy ID (Read-only) */}
              <div className="space-y-2">
                <AndamioLabel htmlFor="treasuryNft">Treasury NFT Policy ID</AndamioLabel>
                <AndamioInput id="treasuryNft" value={treasuryNftPolicyId} disabled />
                <AndamioText variant="small">Policy ID cannot be changed</AndamioText>
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
              <AndamioActionFooter>
                <AndamioButton variant="outline" onClick={() => router.push("/studio/project")}>
                  Cancel
                </AndamioButton>
                <AndamioSaveButton
                  onClick={handleSave}
                  isSaving={isSaving}
                  disabled={!hasChanges}
                />
              </AndamioActionFooter>
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>
      </AndamioTabs>
    </div>
  );
}
