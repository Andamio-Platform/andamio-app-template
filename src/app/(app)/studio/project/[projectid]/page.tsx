"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
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
import { TaskIcon, AssignmentIcon, HistoryIcon, TeacherIcon, TreasuryIcon, LessonIcon, ChartIcon, SettingsIcon, AlertIcon, BlockIcon, OnChainIcon } from "~/components/icons";
import { ManagersManage, BlacklistManage } from "~/components/tx";
import { ProjectManagersCard } from "~/components/studio/project-managers-card";
import { useProject, projectKeys } from "~/hooks/api/project/use-project";
import { useManagerTasks, projectManagerKeys } from "~/hooks/api/project/use-project-manager";
import { useUpdateProject } from "~/hooks/api/project/use-project-owner";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Project Dashboard - Edit project details and access management areas
 *
 * Uses React Query hooks:
 * - useProject(projectId) - Project detail with on-chain data
 * - useManagerTasks(projectId) - Manager task list (includes DRAFT)
 * - useUpdateProject() - Update project metadata mutation
 */
export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, user } = useAndamioAuth();
  const queryClient = useQueryClient();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["overview", "tasks", "team", "blacklist", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // React Query hooks replace manual useState + useEffect + fetch
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId;
  const { data: tasks = [], isLoading: isTasksLoading } = useManagerTasks(projectId);
  const updateProject = useUpdateProject();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  // Initialize form state when project data loads
  useEffect(() => {
    if (!projectDetail) return;
    setTitle(projectDetail.title);
    setDescription(projectDetail.description ?? "");
    setImageUrl(projectDetail.imageUrl ?? "");
    // videoUrl not in merged API response
  }, [projectDetail]);

  // Derive user role from hook data
  const userRole = (() => {
    if (!projectDetail || !user?.accessTokenAlias) return null;
    const alias = user.accessTokenAlias;
    if (projectDetail.ownerAlias === alias || projectDetail.owner === alias) return "owner" as const;
    if (projectDetail.managers?.includes(alias)) return "manager" as const;
    return null;
  })();

  // On-chain counts from hook data
  const onChainTaskCount = projectDetail?.tasks?.filter(t => t.taskStatus === "ON_CHAIN").length ?? 0;
  const onChainContributorCount = projectDetail?.contributors?.length ?? 0;

  // Cache invalidation for onSuccess callbacks
  // Uses refetchQueries to force immediate refetch (not just mark stale)
  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.refetchQueries({ queryKey: projectKeys.detail(projectId) }),
      ...(contributorStateId
        ? [queryClient.invalidateQueries({ queryKey: projectManagerKeys.tasks(contributorStateId) })]
        : []),
    ]);
  }, [queryClient, projectId, contributorStateId]);

  const handleSave = async () => {
    if (!isAuthenticated || !projectDetail) {
      setSaveError("You must be authenticated to edit projects");
      return;
    }

    setSaveError(null);

    try {
      await updateProject.mutateAsync({
        projectId,
        data: {
          title: title || undefined,
          description: description || undefined,
          imageUrl: imageUrl || undefined,
          videoUrl: videoUrl || undefined,
        },
      });
      showSuccess();
    } catch (err) {
      console.error("Error saving project:", err);
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
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
  if (isProjectLoading || isTasksLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  const errorMessage = projectError instanceof Error ? projectError.message : projectError ? "Failed to load project" : null;
  if (errorMessage || !projectDetail) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/studio/project" label="Back to Projects" />
        <AndamioErrorAlert error={errorMessage ?? "Project not found"} />
      </div>
    );
  }

  // Count tasks by status
  const draftTasks = tasks.filter((t) => t.taskStatus === "DRAFT").length;
  const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN").length;

  const hasChanges = title !== projectDetail.title;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton href="/studio/project" label="Back to Projects" />
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            {projectId.slice(0, 16)}...
          </AndamioBadge>
          {userRole === "owner" && (
            <AndamioBadge variant="secondary">Owner</AndamioBadge>
          )}
          {userRole === "manager" && (
            <AndamioBadge variant="default">Manager</AndamioBadge>
          )}
          <AndamioBadge variant="default">Published</AndamioBadge>
        </div>
      </div>

      {/* Role Notice */}
      {userRole === "owner" && (
        <AndamioAlert>
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertTitle>Owner View</AndamioAlertTitle>
          <AndamioAlertDescription>
            As owner, you can add and remove managers. As manager, you can create tasks and review commitments.
          </AndamioAlertDescription>
        </AndamioAlert>
      )}

      <AndamioPageHeader
        title="Project Dashboard"
        description={projectDetail.title || "Manage project details and tasks"}
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
        <AndamioTabsList className="grid w-full grid-cols-5">
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
          <AndamioTabsTrigger value="blacklist" className="flex items-center gap-2">
            <BlockIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Blacklist</span>
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
                  <div className="text-sm text-muted-foreground">Total Tasks (DB)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{draftTasks}</div>
                  <div className="text-sm text-muted-foreground">Draft Tasks</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{liveTasks}</div>
                  <div className="text-sm text-muted-foreground">Live Tasks (DB)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <OnChainIcon className="h-5 w-5" />
                    {onChainTaskCount}
                  </div>
                  <div className="text-sm text-muted-foreground">On-Chain Tasks</div>
                </div>
              </div>
              {onChainContributorCount > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <OnChainIcon className="h-4 w-4" />
                    {onChainContributorCount} contributor{onChainContributorCount !== 1 ? "s" : ""} on-chain
                  </div>
                </div>
              )}
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
                  <div className="text-sm text-muted-foreground">Treasury Management</div>
                  <div className="text-lg font-medium">Configure project treasury settings</div>
                </div>
                <Link href={`/studio/project/${projectId}/manage-treasury`}>
                  <AndamioButton variant="outline">
                    <TreasuryIcon className="h-4 w-4 mr-2" />
                    Manage Treasury
                  </AndamioButton>
                </Link>
              </div>
              <AndamioButton variant="outline" className="w-full justify-start" disabled>
                <HistoryIcon className="h-4 w-4 mr-2" />
                View Transaction History
                <AndamioBadge variant="outline" className="ml-auto">Coming Soon</AndamioBadge>
              </AndamioButton>
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        {/* Tasks Tab */}
        <AndamioTabsContent value="tasks" className="mt-6 space-y-4">
          {/* Draft Tasks Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <TaskIcon className="h-5 w-5" />
                Draft Tasks
              </AndamioCardTitle>
              <AndamioCardDescription>Create tasks and publish them on-chain</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{draftTasks}</div>
                  <div className="text-sm text-muted-foreground">Draft Tasks</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{liveTasks}</div>
                  <div className="text-sm text-muted-foreground">Live Tasks</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <OnChainIcon className="h-5 w-5" />
                    {onChainTaskCount}
                  </div>
                  <div className="text-sm text-muted-foreground">On-Chain Tasks</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/studio/project/${projectId}/draft-tasks`}>
                  <AndamioButton className="w-full sm:w-auto">
                    <TaskIcon className="h-4 w-4 mr-2" />
                    {draftTasks === 0 && liveTasks === 0 ? "Create Your First Task" : "Manage Draft Tasks"}
                  </AndamioButton>
                </Link>
                {draftTasks > 0 && (
                  <Link href={`/studio/project/${projectId}/manage-treasury`}>
                    <AndamioButton variant="outline" className="w-full sm:w-auto">
                      <OnChainIcon className="h-4 w-4 mr-2" />
                      Publish to Chain
                    </AndamioButton>
                  </Link>
                )}
              </div>
            </AndamioCardContent>
          </AndamioCard>

          {/* Task Commitments Card */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle className="flex items-center gap-2">
                <AssignmentIcon className="h-5 w-5" />
                Task Commitments
              </AndamioCardTitle>
              <AndamioCardDescription>Review and assess contributor submissions</AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <Link href={`/studio/project/${projectId}/commitments`}>
                <AndamioButton className="w-full sm:w-auto">
                  <AssignmentIcon className="h-4 w-4 mr-2" />
                  Review Commitments
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
              <Link href={`/studio/project/${projectId}/manage-contributors`}>
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

          {/* Project Team Display */}
          <ProjectManagersCard projectId={projectId} />

          {/* Managers Management (On-Chain Transaction) */}
          <ManagersManage
            projectNftPolicyId={projectId}
            currentManagers={projectDetail.managers ?? []}
            onSuccess={() => {
              // Refresh project data
              void refreshData();
            }}
          />
        </AndamioTabsContent>

        {/* Blacklist Tab */}
        <AndamioTabsContent value="blacklist" className="mt-6 space-y-4">
          <BlacklistManage
            projectNftPolicyId={projectId}
            onSuccess={() => {
              // Refresh project data
              void refreshData();
            }}
          />
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
                <AndamioInput id="treasuryNft" value={projectId} disabled />
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
                  isSaving={updateProject.isPending}
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
