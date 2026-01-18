"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useManagerProjects, type ManagerProject } from "~/hooks/api";
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
import { CreateProject } from "~/components/transactions";
import { toast } from "sonner";
import { getTokenExplorerUrl } from "~/lib/constants";

/**
 * Project list content - only rendered when authenticated
 *
 * Uses merged manager projects endpoint for clean, single-source data.
 */
function ProjectListContent() {
  const router = useRouter();
  const { user } = useAndamioAuth();
  const alias = user?.accessTokenAlias;

  const [showCreateProject, setShowCreateProject] = useState(false);

  // Single merged API call for manager projects
  const {
    data: projects = [],
    isLoading,
    error,
    refetch,
  } = useManagerProjects();

  const handleRefresh = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handleImportSuccess = () => {
    handleRefresh();
  };

  // Stats
  const totalCount = projects.length;
  const hasDbContent = (p: ManagerProject) => p.title !== undefined && p.title !== null;
  const unregisteredCount = projects.filter((p) => !hasDbContent(p)).length;

  // Loading state (only show when no data yet)
  if (isLoading && projects.length === 0) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Project Studio"
          description="Manage and edit your Andamio projects"
        />

        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error.message}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Empty state
  if (!isLoading && projects.length === 0) {
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
                <AndamioBadge variant="default">
                  {totalCount} project{totalCount !== 1 ? "s" : ""}
                </AndamioBadge>
                {unregisteredCount > 0 && (
                  <AndamioBadge variant="outline" className="text-warning border-warning">
                    <AlertIcon className="h-3 w-3 mr-1" />
                    {unregisteredCount} unregistered
                  </AndamioBadge>
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
              <AndamioTableHead className="text-right">Actions</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {projects.map((project) => (
              <ProjectRow
                key={project.project_id}
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
 * Individual project row
 */
function ProjectRow({
  project,
  onImportSuccess,
}: {
  project: ManagerProject;
  onImportSuccess: () => void;
}) {
  const truncatedId = `${project.project_id.slice(0, 8)}...${project.project_id.slice(-8)}`;
  const hasDbContent = project.title !== undefined && project.title !== null;
  const isOnChain = project.source === "merged" || project.source === "chain_only";

  // Determine status icon
  const getStatusIcon = () => {
    if (hasDbContent && isOnChain) {
      // Registered and on-chain
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
          <SuccessIcon className="h-4 w-4 text-success" />
        </div>
      );
    } else if (hasDbContent) {
      // Draft (in DB but not on-chain)
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-warning/10">
          <AlertIcon className="h-4 w-4 text-warning" />
        </div>
      );
    } else {
      // On-chain but not in DB (needs registration)
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <AlertIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }
  };

  // Determine status text
  const getStatusText = () => {
    if (hasDbContent && isOnChain) {
      return <span className="text-xs text-success">Live</span>;
    } else if (hasDbContent) {
      return <span className="text-xs text-warning">Draft</span>;
    } else {
      return <span className="text-xs text-muted-foreground">Unregistered</span>;
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
        <span title={project.project_id}>{truncatedId}</span>
      </AndamioTableCell>
      <AndamioTableCell className="text-right">
        {hasDbContent ? (
          <Link href={`/studio/project/${project.project_id}`}>
            <AndamioButton variant="ghost" size="sm">
              <SettingsIcon className="h-4 w-4 mr-1" />
              Manage
            </AndamioButton>
          </Link>
        ) : (
          <RegisterProjectDrawer
            projectId={project.project_id}
            onSuccess={onImportSuccess}
          />
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
      // V2 API: POST /project/owner/project/register
      // Registers an existing on-chain project into the database with a title
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/owner/project/register`,
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
 * API Endpoint (V2): POST /project/owner/projects/list
 * Type Reference: ProjectV2Output from ~/types/generated
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
