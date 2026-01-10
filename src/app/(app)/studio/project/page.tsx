"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { RequireAuth } from "~/components/auth/require-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioPageLoading, AndamioTableContainer, AndamioEmptyState } from "~/components/andamio";
import { AlertIcon, ProjectIcon, SettingsIcon, AddIcon } from "~/components/icons";
import { type TreasuryListResponse } from "@andamio/db-api-types";
import { CreateProject } from "~/components/transactions";

/**
 * Project list content - only rendered when authenticated
 */
function ProjectListContent() {
  const router = useRouter();
  const { authenticatedFetch } = useAndamioAuth();
  const [projects, setProjects] = useState<TreasuryListResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  useEffect(() => {
    const fetchOwnedProjects = async () => {
      setIsLoading(true);
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
        setProjects(data ?? []);
      } catch (err) {
        console.error("Error fetching owned projects:", err);
        setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOwnedProjects();
  }, [authenticatedFetch]);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error) {
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
  if (projects.length === 0) {
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
          <AndamioButton
            onClick={() => setShowCreateProject(!showCreateProject)}
            variant={showCreateProject ? "outline" : "default"}
          >
            <AddIcon className="h-4 w-4 mr-2" />
            {showCreateProject ? "Cancel" : "Create Project"}
          </AndamioButton>
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
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead>Treasury NFT Policy ID</AndamioTableHead>
              <AndamioTableHead className="text-center">Status</AndamioTableHead>
              <AndamioTableHead className="text-right">Actions</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {projects.map((project) => (
              <AndamioTableRow key={project.treasury_nft_policy_id ?? project.title}>
                <AndamioTableCell className="font-medium">
                  {project.title}
                </AndamioTableCell>
                <AndamioTableCell className="font-mono text-xs break-all max-w-xs">
                  {project.treasury_nft_policy_id ? (
                    <span title={project.treasury_nft_policy_id}>
                      {project.treasury_nft_policy_id.slice(0, 16)}...
                    </span>
                  ) : (
                    <AndamioBadge variant="secondary">Unpublished</AndamioBadge>
                  )}
                </AndamioTableCell>
                <AndamioTableCell className="text-center">
                  <AndamioBadge variant={project.live ? "default" : "secondary"}>
                    {project.live ? "Live" : "Draft"}
                  </AndamioBadge>
                </AndamioTableCell>
                <AndamioTableCell className="text-right">
                  {project.treasury_nft_policy_id && (
                    <Link href={`/studio/project/${project.treasury_nft_policy_id}`}>
                      <AndamioButton variant="ghost" size="sm">
                        <SettingsIcon className="h-4 w-4 mr-1" />
                        Manage
                      </AndamioButton>
                    </Link>
                  )}
                </AndamioTableCell>
              </AndamioTableRow>
            ))}
          </AndamioTableBody>
        </AndamioTable>
      </AndamioTableContainer>
    </div>
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
