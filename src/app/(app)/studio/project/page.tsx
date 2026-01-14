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
  PendingIcon,
  RefreshIcon,
  OnChainIcon,
  LoadingIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { type TreasuryListResponse } from "@andamio/db-api-types";
import { CreateProject } from "~/components/transactions";
import { toast } from "sonner";
import { getTokenExplorerUrl } from "~/lib/constants";

/**
 * Represents a project with hybrid on-chain + DB status
 */
interface HybridProjectStatus {
  projectId: string;
  title: string | null;
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
  dbProject?: TreasuryListResponse[number];
}

/**
 * Project list content - only rendered when authenticated
 */
function ProjectListContent() {
  const router = useRouter();
  const { user, authenticatedFetch } = useAndamioAuth();
  const alias = user?.accessTokenAlias ?? undefined;

  // DB projects (immediate after minting)
  const [dbProjects, setDbProjects] = useState<TreasuryListResponse>([]);
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
      // Go API: POST /project/owner/treasury/list-owned
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/owner/treasury/list-owned`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const data = (await response.json()) as TreasuryListResponse;
      setDbProjects(data ?? []);
    } catch (err) {
      console.error("Error fetching owned projects:", err);
      setError(err instanceof Error ? err.message : "Failed to load projects");
    } finally {
      setIsLoadingDb(false);
    }
  }, [authenticatedFetch]);

  useEffect(() => {
    void fetchDbProjects();
  }, [fetchDbProjects]);

  // Merge and dedupe projects from both sources
  const hybridProjects = useMemo<HybridProjectStatus[]>(() => {
    const projectMap = new Map<string, HybridProjectStatus>();

    // Create set of owned project IDs for quick lookup
    const ownedProjectIds = new Set(
      (ownedOnChainProjects ?? []).map((p) => p.project_id)
    );

    // First, add all DB projects (these show up immediately after mint)
    for (const dbProject of dbProjects) {
      if (dbProject.treasury_nft_policy_id) {
        projectMap.set(dbProject.treasury_nft_policy_id, {
          projectId: dbProject.treasury_nft_policy_id,
          title: dbProject.title,
          inDb: true,
          onChain: false,
          admin: null,
          managers: [],
          isOwned: ownedProjectIds.has(dbProject.treasury_nft_policy_id),
          dbProject,
        });
      }
    }

    // Then, merge in on-chain owned projects
    if (ownedOnChainProjects) {
      for (const onChainProject of ownedOnChainProjects) {
        const existing = projectMap.get(onChainProject.project_id);
        if (existing) {
          existing.onChain = true;
          existing.admin = onChainProject.admin;
          existing.managers = onChainProject.managers;
          existing.isOwned = true;
        } else {
          // On-chain project not in DB (needs registration)
          projectMap.set(onChainProject.project_id, {
            projectId: onChainProject.project_id,
            title: null,
            inDb: false,
            onChain: true,
            admin: onChainProject.admin,
            managers: onChainProject.managers,
            isOwned: true,
          });
        }
      }
    }

    // Merge in on-chain managing projects (user is manager but not owner)
    if (managingOnChainProjects) {
      for (const onChainProject of managingOnChainProjects) {
        const existing = projectMap.get(onChainProject.project_id);
        if (existing) {
          existing.onChain = true;
          existing.admin = onChainProject.admin;
          existing.managers = onChainProject.managers;
          // Don't override isOwned if already set
        } else {
          // On-chain project not in DB
          projectMap.set(onChainProject.project_id, {
            projectId: onChainProject.project_id,
            title: null,
            inDb: false,
            onChain: true,
            admin: onChainProject.admin,
            managers: onChainProject.managers,
            isOwned: false, // User is manager, not owner
          });
        }
      }
    }

    // Sort: DB projects first, then by projectId
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
  const onChainCount = hybridProjects.filter((p) => p.onChain).length;
  const pendingCount = hybridProjects.filter((p) => p.inDb && !p.onChain).length;
  const unregisteredCount = hybridProjects.filter((p) => !p.inDb && p.onChain && p.isOwned).length;

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
                <AndamioBadge variant="secondary">
                  {onChainCount} on-chain
                </AndamioBadge>
                {pendingCount > 0 && (
                  <AndamioTooltip>
                    <AndamioTooltipTrigger asChild>
                      <AndamioBadge variant="outline" className="text-info border-info">
                        <PendingIcon className="h-3 w-3 mr-1" />
                        {pendingCount} syncing
                      </AndamioBadge>
                    </AndamioTooltipTrigger>
                    <AndamioTooltipContent>
                      <p>Waiting for blockchain indexer to confirm</p>
                    </AndamioTooltipContent>
                  </AndamioTooltip>
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
              <AndamioTableHead>Treasury NFT Policy ID</AndamioTableHead>
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

  // Determine status icon
  const getStatusIcon = () => {
    if (project.inDb && project.onChain) {
      // Fully synced
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
          <SuccessIcon className="h-4 w-4 text-success" />
        </div>
      );
    } else if (project.inDb && !project.onChain) {
      // In DB but not yet on-chain (syncing)
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-info/10">
          <PendingIcon className="h-4 w-4 text-info animate-pulse" />
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
    if (project.inDb && project.onChain) {
      return <span className="text-xs text-success">Confirmed</span>;
    } else if (project.inDb && !project.onChain) {
      return <span className="text-xs text-info">Syncing...</span>;
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
      // Go API: POST /project/owner/treasury/mint
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/owner/treasury/mint`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            treasury_nft_policy_id: projectId,
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
              <AndamioText variant="small" className="text-xs mb-1">Treasury NFT Policy ID</AndamioText>
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
                You can change this later. This just gets your project registered.
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
 * API Endpoint: POST /projects/list-owned (protected)
 * Type Reference: TreasuryListResponse from @andamio/db-api
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
