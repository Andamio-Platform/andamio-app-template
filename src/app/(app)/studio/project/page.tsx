"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useOwnedProjects, useManagingProjects } from "~/hooks/use-andamioscan";
import { RequireAuth } from "~/components/auth/require-auth";
import {
  AndamioAlert,
  AndamioAlertDescription,
  AndamioAlertTitle,
  AndamioBadge,
  AndamioButton,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioTableContainer,
  AndamioEmptyState,
  AndamioInput,
  AndamioLabel,
  AndamioDrawer,
  AndamioDrawerClose,
  AndamioDrawerContent,
  AndamioDrawerDescription,
  AndamioDrawerFooter,
  AndamioDrawerHeader,
  AndamioDrawerTitle,
  AndamioDrawerTrigger,
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
  AndamioText,
} from "~/components/andamio";
import {
  AlertIcon,
  ProjectIcon,
  SettingsIcon,
  AddIcon,
  SuccessIcon,
  RefreshIcon,
  LoadingIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { type ProjectV2Output } from "@andamio/db-api-types";
import { CreateProject } from "~/components/transactions";
import { toast } from "sonner";
import { getTokenExplorerUrl } from "~/lib/constants";

/**
 * Represents a project with hybrid on-chain + DB status
 */
interface HybridProjectStatus {
  projectId: string;
  title: string | null | undefined;
  /** Project exists in our database */
  inDb: boolean;
  /** Project found on-chain via Andamioscan */
  onChain: boolean;
  /** Admin alias from on-chain data */
  admin: string | null;
  /** Managers from on-chain data */
  managers: string[];
  /** Whether user is the admin/owner (vs just a manager) */
  isOwned: boolean;
  /** Full DB project data if available */
  dbProject?: ProjectV2Output;
}

/**
 * Project list content - only rendered when authenticated
 */
function ProjectListContent() {
  const router = useRouter();
  const { user } = useAndamioAuth();
  const alias = user?.accessTokenAlias ?? undefined;

  // DB projects (immediate after minting)
  const [dbProjects, setDbProjects] = useState<ProjectV2Output[]>([]);
  const [isLoadingDb, setIsLoadingDb] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  // On-chain projects where user is owner/admin
  const {
    data: ownedOnChainProjects,
    isLoading: isLoadingOwned,
    refetch: refetchOwned,
  } = useOwnedProjects(alias);

  // On-chain projects where user is manager
  const {
    data: managingOnChainProjects,
    isLoading: isLoadingManaging,
    refetch: refetchManaging,
  } = useManagingProjects(alias);

  const fetchDbProjects = useCallback(async () => {
    setIsLoadingDb(true);
    setError(null);

    try {
      // V2 API: GET /project-v2/public/projects/list
      // Returns all ON_CHAIN projects - we filter by ownership using Andamioscan data
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/public/projects/list`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = (await response.json()) as ProjectV2Output[];
      setDbProjects(data ?? []);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoadingDb(false);
    }
  }, []);

  useEffect(() => {
    void fetchDbProjects();
  }, [fetchDbProjects]);

  // Merge projects from on-chain sources (owned + managed) with DB metadata
  // Only shows projects where user has on-chain ownership or management role
  const hybridProjects = useMemo<HybridProjectStatus[]>(() => {
    const projectMap = new Map<string, HybridProjectStatus>();

    // Create lookup maps for DB projects
    const dbProjectMap = new Map(
      dbProjects
        .filter((p): p is typeof p & { project_id: string } => !!p.project_id)
        .map((p) => [p.project_id, p])
    );

    // Add on-chain owned projects (user is admin)
    if (ownedOnChainProjects) {
      for (const onChainProject of ownedOnChainProjects) {
        const dbProject = dbProjectMap.get(onChainProject.project_id);
        projectMap.set(onChainProject.project_id, {
          projectId: onChainProject.project_id,
          title: dbProject?.title ?? null,
          inDb: !!dbProject,
          onChain: true,
          admin: onChainProject.admin,
          managers: onChainProject.managers,
          isOwned: true,
          dbProject,
        });
      }
    }

    // Add on-chain managing projects (user is manager but not owner)
    if (managingOnChainProjects) {
      for (const onChainProject of managingOnChainProjects) {
        // Skip if already added as owned
        if (projectMap.has(onChainProject.project_id)) continue;

        const dbProject = dbProjectMap.get(onChainProject.project_id);
        projectMap.set(onChainProject.project_id, {
          projectId: onChainProject.project_id,
          title: dbProject?.title ?? null,
          inDb: !!dbProject,
          onChain: true,
          admin: onChainProject.admin,
          managers: onChainProject.managers,
          isOwned: false, // User is manager, not owner
          dbProject,
        });
      }
    }

    // Sort: DB projects first (have title), then by projectId
    return Array.from(projectMap.values()).sort((a, b) => {
      if (a.inDb && !b.inDb) return -1;
      if (!a.inDb && b.inDb) return 1;
      return a.projectId.localeCompare(b.projectId);
    });
  }, [dbProjects, ownedOnChainProjects, managingOnChainProjects]);

  const handleRefresh = useCallback(() => {
    void fetchDbProjects();
    void refetchOwned();
    void refetchManaging();
  }, [fetchDbProjects, refetchOwned, refetchManaging]);

  const handleImportSuccess = () => {
    handleRefresh();
  };

  const isLoading = isLoadingDb || isLoadingOwned || isLoadingManaging;

  // Stats
  const totalCount = hybridProjects.length;
  const unregisteredCount = hybridProjects.filter((p) => !p.inDb && p.isOwned).length;
  const ownedCount = hybridProjects.filter((p) => p.isOwned).length;
  const managingCount = hybridProjects.filter((p) => !p.isOwned).length;

  // Loading state (only show when no data yet)
  if (isLoading && hybridProjects.length === 0) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error && hybridProjects.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Project Studio"
          description="Manage and edit your Andamio projects"
        />

        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Empty state
  if (!isLoading && hybridProjects.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Project Studio"
          description="Manage and edit your Andamio projects"
        />

        <AndamioEmptyState
          icon={ProjectIcon}
          title="No Projects Found"
          description="You don't have any projects yet. Create your first project to start managing contributors and tasks."
        />

        <CreateProject
          onSuccess={(projectId) => {
            router.push(`/studio/project/${projectId}`);
          }}
        />
      </div>
    );
  }

  // Projects list
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Project Studio"
        description="Manage and edit your Andamio projects"
        action={
          <div className="flex items-center gap-2">
            {/* Status badges */}
            {!isLoading && totalCount > 0 && (
              <div className="flex gap-2">
                {ownedCount > 0 && (
                  <AndamioBadge variant="default">
                    {ownedCount} owned
                  </AndamioBadge>
                )}
                {managingCount > 0 && (
                  <AndamioBadge variant="secondary">
                    {managingCount} managing
                  </AndamioBadge>
                )}
                {unregisteredCount > 0 && (
                  <AndamioTooltip>
                    <AndamioTooltipTrigger asChild>
                      <AndamioBadge variant="outline" className="text-warning border-warning">
                        <AlertIcon className="h-3 w-3 mr-1" />
                        {unregisteredCount} unregistered
                      </AndamioBadge>
                    </AndamioTooltipTrigger>
                    <AndamioTooltipContent>
                      <p>On-chain projects not yet registered in database</p>
                    </AndamioTooltipContent>
                  </AndamioTooltip>
                )}
              </div>
            )}
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshIcon className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </AndamioButton>
            <AndamioButton
              onClick={() => setShowCreateProject(!showCreateProject)}
              variant={showCreateProject ? "outline" : "default"}
            >
              <AddIcon className="h-4 w-4 mr-2" />
              {showCreateProject ? "Cancel" : "Create Project"}
            </AndamioButton>
          </div>
        }
      />

      {showCreateProject && (
        <CreateProject
          onSuccess={(projectId) => {
            setShowCreateProject(false);
            router.push(`/studio/project/${projectId}`);
          }}
        />
      )}

      <AndamioTableContainer>
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead className="w-[50px]">Status</AndamioTableHead>
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead>Project ID</AndamioTableHead>
              <AndamioTableHead className="text-center hidden md:table-cell">Role</AndamioTableHead>
              <AndamioTableHead className="text-right">Actions</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {hybridProjects.map((project) => (
              <HybridProjectRow
                key={project.projectId}
                project={project}
                onImportSuccess={handleImportSuccess}
              />
            ))}
          </AndamioTableBody>
        </AndamioTable>
      </AndamioTableContainer>
    </div>
  );
}

/**
 * Individual project row with hybrid status
 */
function HybridProjectRow({
  project,
  onImportSuccess,
}: {
  project: HybridProjectStatus;
  onImportSuccess: () => void;
}) {
  const truncatedId = `${project.projectId.slice(0, 8)}...${project.projectId.slice(-8)}`;

  // Determine status icon - all projects are on-chain (that's the source of truth)
  const getStatusIcon = () => {
    if (project.inDb) {
      // Registered in database
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
          <SuccessIcon className="h-4 w-4 text-success" />
        </div>
      );
    } else {
      // On-chain but not in DB (needs registration)
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
          <AlertIcon className="h-4 w-4 text-warning" />
        </div>
      );
    }
  };

  // Determine status text
  const getStatusText = () => {
    if (project.inDb) {
      return <span className="text-xs text-success">Registered</span>;
    } else {
      return <span className="text-xs text-warning">Unregistered</span>;
    }
  };

  return (
    <AndamioTableRow>
      <AndamioTableCell>
        <div className="flex flex-col items-center gap-1">
          {getStatusIcon()}
          {getStatusText()}
        </div>
      </AndamioTableCell>
      <AndamioTableCell className="font-medium">
        {project.title ? (
          project.title
        ) : (
          <span className="text-muted-foreground italic">Untitled Project</span>
        )}
      </AndamioTableCell>
      <AndamioTableCell className="font-mono text-xs">
        <span title={project.projectId}>{truncatedId}</span>
      </AndamioTableCell>
      <AndamioTableCell className="text-center hidden md:table-cell">
        <AndamioBadge variant={project.isOwned ? "default" : "secondary"}>
          {project.isOwned ? "Owner" : "Manager"}
        </AndamioBadge>
      </AndamioTableCell>
      <AndamioTableCell className="text-right">
        {project.inDb ? (
          <Link href={`/studio/project/${project.projectId}`}>
            <AndamioButton variant="ghost" size="sm">
              <SettingsIcon className="h-4 w-4 mr-1" />
              Manage
            </AndamioButton>
          </Link>
        ) : project.isOwned ? (
          <RegisterProjectDrawer
            projectId={project.projectId}
            onSuccess={onImportSuccess}
          />
        ) : (
          <AndamioTooltip>
            <AndamioTooltipTrigger asChild>
              <AndamioButton variant="ghost" size="sm" disabled>
                <AlertIcon className="h-4 w-4 mr-1" />
                Not Registered
              </AndamioButton>
            </AndamioTooltipTrigger>
            <AndamioTooltipContent>
              <p>Only the project owner can register this project</p>
            </AndamioTooltipContent>
          </AndamioTooltip>
        )}
      </AndamioTableCell>
    </AndamioTableRow>
  );
}

/**
 * Drawer for registering an unregistered Project NFT
 */
function RegisterProjectDrawer({
  projectId,
  onSuccess,
}: {
  projectId: string;
  onSuccess: () => void;
}) {
  const { authenticatedFetch } = useAndamioAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // V2 API: POST /project-v2/admin/project/register
      // Registers an existing on-chain project into the database with a title
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/admin/project/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            title: title.trim(),
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to register project");
      }

      toast.success("Project Registered!", {
        description: `"${title.trim()}" is now ready for configuration.`,
      });

      setOpen(false);
      setTitle("");
      onSuccess();
    } catch (err) {
      console.error("Error registering project:", err);
      toast.error("Registration Failed", {
        description: err instanceof Error ? err.message : "Failed to register project",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const truncatedId = `${projectId.slice(0, 12)}...${projectId.slice(-12)}`;

  return (
    <AndamioDrawer open={open} onOpenChange={setOpen}>
      <AndamioDrawerTrigger asChild>
        <AndamioButton variant="default" size="sm">
          <AddIcon className="h-4 w-4 mr-1" />
          Register
        </AndamioButton>
      </AndamioDrawerTrigger>
      <AndamioDrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <AndamioDrawerHeader className="text-left">
            <AndamioDrawerTitle>Register Project</AndamioDrawerTitle>
            <AndamioDrawerDescription>
              You own this Project NFT on-chain. Give it a title to register it
              in your studio and start managing contributors.
            </AndamioDrawerDescription>
          </AndamioDrawerHeader>

          <div className="space-y-4 px-4">
            {/* Project ID display */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <AndamioText variant="small" className="text-xs mb-1">Project ID</AndamioText>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono flex-1 truncate">
                  {truncatedId}
                </span>
                <a
                  href={getTokenExplorerUrl(projectId, env.NEXT_PUBLIC_CARDANO_NETWORK ?? "preprod")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLinkIcon className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Title input */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="register-title">Project Title</AndamioLabel>
              <AndamioInput
                id="register-title"
                placeholder="Enter a title for your project"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isSubmitting}
                autoFocus
              />
              <AndamioText variant="small" className="text-xs">
                You can change this later in project settings.
              </AndamioText>
            </div>
          </div>

          <AndamioDrawerFooter className="flex-row gap-3 pt-6">
            <AndamioDrawerClose asChild>
              <AndamioButton variant="outline" className="flex-1" disabled={isSubmitting}>
                Cancel
              </AndamioButton>
            </AndamioDrawerClose>
            <AndamioButton
              className="flex-1"
              onClick={handleRegister}
              disabled={!title.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <AddIcon className="h-4 w-4 mr-2" />
                  Register Project
                </>
              )}
            </AndamioButton>
          </AndamioDrawerFooter>
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}

/**
 * Project Studio Page - Lists projects owned/managed by the authenticated user
 *
 * API Endpoint (V2): POST /project-v2/admin/projects/list
 * Type Reference: ProjectV2Output from @andamio/db-api-types
 */
export default function ProjectStudioPage() {
  return (
    <RequireAuth
      title="Project Studio"
      description="Connect your wallet to manage your projects"
    >
      <ProjectListContent />
    </RequireAuth>
  );
}
