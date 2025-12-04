"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AlertCircle, FolderKanban, Settings } from "lucide-react";
import { type ListOwnedTreasuriesOutput } from "@andamio/db-api";

/**
 * Project Studio Page - Lists projects owned/managed by the authenticated user
 *
 * API Endpoint: POST /projects/list-owned (protected)
 * Type Reference: ListOwnedTreasuriesOutput from @andamio/db-api
 */
export default function ProjectStudioPage() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [projects, setProjects] = useState<ListOwnedTreasuriesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchOwnedProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/projects/list-owned`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = (await response.json()) as ListOwnedTreasuriesOutput;
        setProjects(data ?? []);
      } catch (err) {
        console.error("Error fetching owned projects:", err);
        setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOwnedProjects();
  }, [isAuthenticated, authenticatedFetch]);

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Project Studio</h1>
          <p className="text-muted-foreground">
            Connect your wallet to manage your projects
          </p>
        </div>

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Project Studio</h1>
          <p className="text-muted-foreground">
            Manage and edit your Andamio projects
          </p>
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <AndamioSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Project Studio</h1>
          <p className="text-muted-foreground">
            Manage and edit your Andamio projects
          </p>
        </div>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
        <div>
          <h1 className="text-3xl font-bold">Project Studio</h1>
          <p className="text-muted-foreground">
            Manage and edit your Andamio projects
          </p>
        </div>

        <AndamioAlert>
          <FolderKanban className="h-4 w-4" />
          <AndamioAlertTitle>No Projects Found</AndamioAlertTitle>
          <AndamioAlertDescription>
            You don&apos;t have any projects yet. Projects are created through the Andamio treasury system.
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Projects list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Project Studio</h1>
          <p className="text-muted-foreground">
            Manage and edit your Andamio projects
          </p>
        </div>
      </div>

      <div className="border rounded-md">
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead>Treasury NFT Policy ID</AndamioTableHead>
              <AndamioTableHead className="text-center">Escrows</AndamioTableHead>
              <AndamioTableHead className="text-center">Total ADA</AndamioTableHead>
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
                  <AndamioBadge variant="outline">{project._count?.escrows ?? 0}</AndamioBadge>
                </AndamioTableCell>
                <AndamioTableCell className="text-center">
                  <AndamioBadge variant="secondary">
                    {project.total_ada?.toLocaleString() ?? 0} ADA
                  </AndamioBadge>
                </AndamioTableCell>
                <AndamioTableCell className="text-right">
                  {project.treasury_nft_policy_id && (
                    <Link href={`/studio/project/${project.treasury_nft_policy_id}`}>
                      <AndamioButton variant="ghost" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Manage
                      </AndamioButton>
                    </Link>
                  )}
                </AndamioTableCell>
              </AndamioTableRow>
            ))}
          </AndamioTableBody>
        </AndamioTable>
      </div>
    </div>
  );
}
