"use client";

import React, { useEffect, useState } from "react";
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
import { TaskIcon, AssignmentIcon, HistoryIcon, TeacherIcon, TreasuryIcon, LessonIcon, ChartIcon, SettingsIcon, AlertIcon, BlockIcon, ManagerIcon, OnChainIcon, RefreshIcon } from "~/components/icons";
import { type ProjectV2Output, type ProjectTaskV2Output } from "~/types/generated";
import { ManagersManage, BlacklistManage } from "~/components/tx";
import { ProjectManagersCard } from "~/components/studio/project-managers-card";
import { getManagingProjects, getProject } from "~/lib/andamioscan-events";
import { syncProjectTasks } from "~/lib/project-task-sync";
import { toast } from "sonner";

interface ApiError {
  message?: string;
}

/**
 * Project Dashboard - Edit project details and access management areas
 *
 * API Endpoints:
 * - POST /projects/list-owned (protected) - with project_id filter
 * - POST /projects/update (protected) - Update project metadata
 * - POST /tasks/list (public) - Get task summary
 */
export default function ProjectDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, authenticatedFetch, user } = useAndamioAuth();

  // URL-based tab persistence
  const urlTab = searchParams.get("tab");
  const validTabs = ["overview", "tasks", "team", "blacklist", "settings"];
  const activeTab = urlTab && validTabs.includes(urlTab) ? urlTab : "overview";

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [project, setProject] = useState<ProjectV2Output | null>(null);
  const [tasks, setTasks] = useState<ProjectTaskV2Output[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track user's role: "owner" can view but not manage, "manager" can manage
  const [userRole, setUserRole] = useState<"owner" | "manager" | null>(null);

  // On-chain status tracking
  const [onChainTaskCount, setOnChainTaskCount] = useState<number>(0);
  const [onChainContributorCount, setOnChainContributorCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { isSuccess: saveSuccess, showSuccess } = useSuccessNotification();

  // Fetch function extracted so it can be called from transaction success handlers
  const fetchProjectAndTasks = async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setUserRole(null);

    try {
      let projectData: ProjectV2Output | null = null;
      let detectedRole: "owner" | "manager" | null = null;

      // Step 1: Try to fetch project directly (V2 API)
      const projectResponse = await fetch(
        `/api/gateway/api/v2/project/user/project/${projectId}`
      );

      if (projectResponse.ok) {
        projectData = (await projectResponse.json()) as ProjectV2Output;
        // Check if user is owner
        if (user?.accessTokenAlias && projectData.owner_alias === user.accessTokenAlias) {
          detectedRole = "owner";
        }
      }

      // Step 2: If not owner, check if user is a manager via Andamioscan
      if (detectedRole !== "owner" && user?.accessTokenAlias) {
        try {
          const managingProjects = await getManagingProjects(user.accessTokenAlias);
          const isManager = managingProjects.some(
            (p) => p.project_id === projectId
          );

          if (isManager) {
            detectedRole = "manager";
          }
        } catch (scanErr) {
          console.warn("Andamioscan check failed, continuing:", scanErr);
        }
      }

      if (!projectData) {
        throw new Error("Project not found or you don't have access");
      }

      setProject(projectData);
      setUserRole(detectedRole);
      setTitle(typeof projectData.title === "string" ? projectData.title : "");
      setDescription(typeof projectData.description === "string" ? projectData.description : "");
      setImageUrl(typeof projectData.image_url === "string" ? projectData.image_url : "");
      // Note: video_url not available in V2 API

      // V2 API: POST /project/manager/tasks/list with {project_id} in body
      // Manager endpoint returns all tasks including DRAFT status
      if (projectData.states && projectData.states.length > 0) {
        const projectStatePolicyId = projectData.states[0]?.project_state_policy_id;
        if (projectStatePolicyId) {
          const tasksResponse = await authenticatedFetch(
            `/api/gateway/api/v2/project/manager/tasks/list`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ project_id: projectStatePolicyId }),
            }
          );

          if (tasksResponse.ok) {
            const tasksData = (await tasksResponse.json()) as ProjectTaskV2Output[];
            setTasks(tasksData ?? []);
          }
        }
      }

      // Fetch on-chain data from Andamioscan
      try {
        const onChainProject = await getProject(projectId);
        if (onChainProject) {
          setOnChainTaskCount(onChainProject.tasks?.length ?? 0);
          setOnChainContributorCount(onChainProject.contributors?.length ?? 0);
        }
      } catch {
        // If Andamioscan fails, just ignore - we'll show DB data only
        setOnChainTaskCount(0);
        setOnChainContributorCount(0);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError(err instanceof Error ? err.message : "Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchProjectAndTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, projectId, user?.accessTokenAlias]);

  const handleSave = async () => {
    if (!isAuthenticated || !project) {
      setSaveError("You must be authenticated to edit projects");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      // V2 API: POST /project/owner/project/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/owner/project/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            title: title || undefined,
            description: description || undefined,
            image_url: imageUrl || undefined,
            video_url: videoUrl || undefined,
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

  const handleSync = async () => {
    const rawPolicyId = project?.states?.[0]?.project_state_policy_id;
    const projectStatePolicyId = typeof rawPolicyId === "string" ? rawPolicyId : null;
    if (!projectStatePolicyId) {
      toast.error("Cannot sync: missing project state policy ID");
      return;
    }

    setIsSyncing(true);
    toast.info("Syncing with blockchain...");

    try {
      const syncResult = await syncProjectTasks(
        projectId,
        projectStatePolicyId,
        "", // Empty txHash - will be fetched from treasury_fundings
        authenticatedFetch,
        false // Not a dry run
      );

      if (syncResult.confirmed > 0) {
        toast.success(`Synced ${syncResult.confirmed} task(s) with blockchain`);
      } else if (syncResult.errors.length > 0) {
        toast.error("Sync failed", {
          description: syncResult.errors[0],
        });
      } else {
        toast.success("Database is in sync with blockchain");
      }

      // Refresh data
      await fetchProjectAndTasks();
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsSyncing(false);
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
  const draftTasks = tasks.filter((t) => t.task_status === "DRAFT").length;
  const liveTasks = tasks.filter((t) => t.task_status === "ON_CHAIN").length;
  // Count tasks that are ON_CHAIN but missing task_hash - these need syncing
  const tasksNeedingHashSync = tasks.filter((t) => t.task_status === "ON_CHAIN" && !t.task_hash).length;
  // Check if any tasks need syncing (either status or hash)
  const needsSync = onChainTaskCount > liveTasks || tasksNeedingHashSync > 0;

  const hasChanges = title !== (project.title ?? "");

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
            As the project owner, you can view project details and manage team settings.
            To manage tasks and assess contributor work, you need to be added as a Manager.
          </AndamioAlertDescription>
        </AndamioAlert>
      )}

      <AndamioPageHeader
        title="Project Dashboard"
        description={typeof project.title === "string" ? project.title : "Manage project details and tasks"}
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
          {/* Sync Warning - show when on-chain data doesn't match DB */}
          {needsSync && (
            <AndamioCard className="border-warning bg-warning/5">
              <AndamioCardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertIcon className="h-6 w-6 text-warning shrink-0 mt-0.5" />
                    <div>
                      <AndamioText className="font-semibold text-warning">Action Required: Sync Task Hashes</AndamioText>
                      <AndamioText variant="small" className="mt-1">
                        {onChainTaskCount > liveTasks && (
                          <span>{onChainTaskCount} task{onChainTaskCount !== 1 ? "s" : ""} on-chain, but only {liveTasks} marked as live in database. </span>
                        )}
                        {tasksNeedingHashSync > 0 && (
                          <span>{tasksNeedingHashSync} task{tasksNeedingHashSync !== 1 ? "s" : ""} missing task hash. </span>
                        )}
                        <strong>Contributors cannot sync their commitments until tasks are synced.</strong>
                      </AndamioText>
                    </div>
                  </div>
                  <AndamioButton
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="shrink-0"
                  >
                    <RefreshIcon className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing ? "Syncing..." : "Sync Tasks Now"}
                  </AndamioButton>
                </div>
              </AndamioCardContent>
            </AndamioCard>
          )}

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
                  <div className="text-2xl font-bold text-success">{liveTasks}</div>
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
              <Link href={`/studio/project/${projectId}/transaction-history`}>
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
              <Link href={`/studio/project/${projectId}/draft-tasks`}>
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

              <Link href={`/studio/project/${projectId}/commitments`}>
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

              <Link href={`/studio/project/${projectId}/manager`}>
                <AndamioButton variant="outline" className="w-full justify-start h-auto py-4">
                  <ManagerIcon className="h-5 w-5 mr-3" />
                  <div className="text-left">
                    <div className="font-medium">Manager Dashboard</div>
                    <div className="text-sm text-muted-foreground">
                      Assess contributor submissions
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

          {/* On-Chain Managers Sync */}
          <ProjectManagersCard projectId={projectId} />

          {/* Managers Management (On-Chain Transaction) */}
          <ManagersManage
            projectNftPolicyId={projectId}
            onSuccess={() => {
              // Refresh project data
              void fetchProjectAndTasks();
            }}
          />
        </AndamioTabsContent>

        {/* Blacklist Tab */}
        <AndamioTabsContent value="blacklist" className="mt-6 space-y-4">
          <BlacklistManage
            projectNftPolicyId={projectId}
            onSuccess={() => {
              // Refresh project data
              void fetchProjectAndTasks();
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
