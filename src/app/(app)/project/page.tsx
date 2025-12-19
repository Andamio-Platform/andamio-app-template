"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioPageLoading, AndamioEmptyState, AndamioTableContainer } from "~/components/andamio";
import { AlertCircle, FolderKanban } from "lucide-react";
import { type ListPublishedTreasuriesOutput } from "@andamio/db-api";
import { formatLovelace } from "~/lib/cardano-utils";

/**
 * Public page displaying all published projects (treasuries)
 *
 * API Endpoint: POST /projects/list (public)
 * Type Reference: ListPublishedTreasuriesOutput from @andamio/db-api
 */
export default function ProjectCatalogPage() {
  const [projects, setProjects] = useState<ListPublishedTreasuriesOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublishedProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/projects/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          }
        );

        // 404 means no published projects exist yet - treat as empty state, not error
        if (response.status === 404) {
          setProjects([]);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = (await response.json()) as ListPublishedTreasuriesOutput;
        setProjects(data ?? []);
      } catch (err) {
        console.error("Error fetching published projects:", err);
        setError(err instanceof Error ? err.message : "Failed to load projects");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPublishedProjects();
  }, []);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="list" />;
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader
          title="Projects"
          description="Browse all published projects"
        />

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
        <AndamioPageHeader
          title="Projects"
          description="Browse all published projects"
        />
        <AndamioEmptyState
          icon={FolderKanban}
          title="No Published Projects"
          description="There are currently no published projects available. Check back later."
        />
      </div>
    );
  }

  // Projects list
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Projects"
        description="Browse all published projects"
      />

      <AndamioTableContainer>
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead>Treasury NFT Policy ID</AndamioTableHead>
              <AndamioTableHead className="text-center">Tasks</AndamioTableHead>
              <AndamioTableHead className="text-center">Total ADA</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {projects.map((project) => {
              // Calculate total task count from escrows
              const totalTasks = project.escrows?.reduce(
                (sum, escrow) => sum + (escrow._count?.tasks ?? 0),
                0
              ) ?? 0;

              return (
                <AndamioTableRow key={project.treasury_nft_policy_id ?? project.title}>
                  <AndamioTableCell>
                    <Link
                      href={`/project/${project.treasury_nft_policy_id}`}
                      className="font-medium hover:underline"
                    >
                      {project.title}
                    </Link>
                  </AndamioTableCell>
                  <AndamioTableCell className="font-mono text-xs break-all max-w-xs">
                    {project.treasury_nft_policy_id ? (
                      <span title={project.treasury_nft_policy_id}>
                        {project.treasury_nft_policy_id.slice(0, 16)}...
                      </span>
                    ) : (
                      "-"
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant="secondary">
                      {totalTasks} {totalTasks === 1 ? "task" : "tasks"}
                    </AndamioBadge>
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant="outline">
                      {formatLovelace(project.total_ada).toLocaleString() ?? 0} ADA
                    </AndamioBadge>
                  </AndamioTableCell>
                </AndamioTableRow>
              );
            })}
          </AndamioTableBody>
        </AndamioTable>
      </AndamioTableContainer>
    </div>
  );
}
