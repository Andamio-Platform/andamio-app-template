"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { env } from "~/env";
import { useManagerProjects, useOwnerProjects } from "~/hooks/api";
import { useRegisterProject } from "~/hooks/api/project/use-project-owner";
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
  AndamioSectionHeader,
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
  ManagerIcon,
  OwnerIcon,
} from "~/components/icons";
import { CreateProject } from "~/components/tx";
import { toast } from "sonner";
import { getTokenExplorerUrl } from "~/lib/constants";

/**
 * Shared project row type — both Project and ManagerProject share these fields
 */
interface ProjectRowData {
  projectId: string;
  status: string;
  title: string;
}

/**
 * Project list content - only rendered when authenticated
 *
 * Shows two separate lists:
 * 1. Projects I Own — from owner endpoint
 * 2. Projects I Manage — from manager endpoint
 */
function ProjectListContent() {
  const router = useRouter();

  const [showCreateProject, setShowCreateProject] = useState(false);

  // Two separate API calls for owner and manager projects
  const {
    data: ownedProjects = [],
    isLoading: ownedLoading,
    error: ownedError,
    refetch: refetchOwned,
  } = useOwnerProjects();

  const {
    data: managedProjects = [],
    isLoading: managedLoading,
    error: managedError,
    refetch: refetchManaged,
  } = useManagerProjects();

  const isLoading = ownedLoading || managedLoading;
  const error = ownedError ?? managedError;

  const handleRefresh = useCallback(() => {
    void refetchOwned();
    void refetchManaged();
  }, [refetchOwned, refetchManaged]);

  const handleImportSuccess = () => {
    handleRefresh();
  };

  // Deduplicate managed projects — exclude any that already appear in owned list
  const ownedIds = new Set(ownedProjects.map((p) => p.projectId));
  const managedOnly = managedProjects.filter((p) => !ownedIds.has(p.projectId));

  const totalCount = ownedProjects.length + managedOnly.length;
  const hasAnyProjects = totalCount > 0;

  // Loading state (only show when no data yet)
  if (isLoading && !hasAnyProjects) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error && !hasAnyProjects) {
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
  if (!isLoading && !hasAnyProjects) {
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

      {/* Projects I Own */}
      <section className="space-y-3">
        <AndamioSectionHeader
          title="Projects I Own"
          icon={<OwnerIcon className="h-5 w-5" />}
          action={
            ownedProjects.length > 0 ? (
              <AndamioBadge variant="default">
                {ownedProjects.length} project{ownedProjects.length !== 1 ? "s" : ""}
              </AndamioBadge>
            ) : undefined
          }
        />
        {ownedProjects.length > 0 ? (
          <ProjectTable
            projects={ownedProjects}
            onImportSuccess={handleImportSuccess}
          />
        ) : (
          <AndamioText variant="muted" className="text-sm pl-1">
            {ownedLoading ? "Loading..." : "You don\u2019t own any projects yet."}
          </AndamioText>
        )}
      </section>

      {/* Projects I Manage */}
      <section className="space-y-3">
        <AndamioSectionHeader
          title="Projects I Manage"
          icon={<ManagerIcon className="h-5 w-5" />}
          action={
            managedOnly.length > 0 ? (
              <AndamioBadge variant="secondary">
                {managedOnly.length} project{managedOnly.length !== 1 ? "s" : ""}
              </AndamioBadge>
            ) : undefined
          }
        />
        {managedOnly.length > 0 ? (
          <ProjectTable
            projects={managedOnly}
            onImportSuccess={handleImportSuccess}
          />
        ) : (
          <AndamioText variant="muted" className="text-sm pl-1">
            {managedLoading ? "Loading..." : "You\u2019re not managing any other projects."}
          </AndamioText>
        )}
      </section>
    </div>
  );
}

/**
 * Reusable project table
 */
function ProjectTable({
  projects,
  onImportSuccess,
}: {
  projects: ProjectRowData[];
  onImportSuccess: () => void;
}) {
  return (
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
              key={project.projectId}
              project={project}
              onImportSuccess={onImportSuccess}
            />
          ))}
        </AndamioTableBody>
      </AndamioTable>
    </AndamioTableContainer>
  );
}

/**
 * Individual project row
 */
function ProjectRow({
  project,
  onImportSuccess,
}: {
  project: ProjectRowData;
  onImportSuccess: () => void;
}) {
  const truncatedId = `${project.projectId.slice(0, 8)}...${project.projectId.slice(-8)}`;
  const isRegistered = project.status !== "unregistered";
  const isOnChain = project.status === "active" || project.status === "unregistered";

  // Determine status icon
  const getStatusIcon = () => {
    if (isRegistered && isOnChain) {
      // Registered and on-chain
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
          <SuccessIcon className="h-4 w-4 text-primary" />
        </div>
      );
    } else if (isRegistered) {
      // Draft (in DB but not on-chain)
      return (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10">
          <AlertIcon className="h-4 w-4 text-muted-foreground" />
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
    if (isRegistered && isOnChain) {
      return <span className="text-xs text-primary">Live</span>;
    } else if (isRegistered) {
      return <span className="text-xs text-muted-foreground">Draft</span>;
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
        <span title={project.projectId}>{truncatedId}</span>
      </AndamioTableCell>
      <AndamioTableCell className="text-right">
        {isRegistered ? (
          <Link href={`/studio/project/${project.projectId}`}>
            <AndamioButton variant="ghost" size="sm">
              <SettingsIcon className="h-4 w-4 mr-1" />
              Manage
            </AndamioButton>
          </Link>
        ) : (
          <RegisterProjectDrawer
            projectId={project.projectId}
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
  const registerProject = useRegisterProject();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const isSubmitting = registerProject.isPending;

  const handleRegister = async () => {
    if (!title.trim()) return;

    try {
      await registerProject.mutateAsync({
        projectId,
        title: title.trim(),
      });

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
