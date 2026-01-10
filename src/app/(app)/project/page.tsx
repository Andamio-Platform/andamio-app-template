"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { env } from "~/env";
import { useAllProjects } from "~/hooks/use-andamioscan";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioPageLoading, AndamioEmptyState, AndamioTableContainer } from "~/components/andamio";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import { AlertIcon, ProjectIcon, OnChainIcon } from "~/components/icons";
import { type TreasuryListResponse } from "@andamio/db-api-types";

/**
 * Public page displaying all published projects (treasuries)
 *
 * API Endpoint: POST /projects/list (public)
 * Type Reference: TreasuryListResponse from @andamio/db-api
 */
export default function ProjectCatalogPage() {
  const [projects, setProjects] = useState<TreasuryListResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on-chain projects for status indicator
  const { data: onChainProjects } = useAllProjects();

  // Create a Set of on-chain project IDs for quick lookup
  const onChainProjectIds = useMemo(() => {
    return new Set(onChainProjects?.map((p) => p.project_id) ?? []);
  }, [onChainProjects]);

  useEffect(() => {
    const fetchPublishedProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Go API: POST /project/public/treasury/list
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/public/treasury/list`,
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

        const data = (await response.json()) as TreasuryListResponse;
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
          title="Projects"
          description="Browse all published projects"
        />
        <AndamioEmptyState
          icon={ProjectIcon}
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
        description="Browse all published projects. Projects with a chain icon are verified on-chain."
      />

      <AndamioTableContainer>
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead>Treasury NFT Policy ID</AndamioTableHead>
              <AndamioTableHead className="text-center">Status</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {projects.map((project) => {
              // Check if project exists on-chain
              const isOnChain = project.treasury_nft_policy_id
                ? onChainProjectIds.has(project.treasury_nft_policy_id)
                : false;

              return (
                <AndamioTableRow key={project.treasury_nft_policy_id ?? project.title}>
                  <AndamioTableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/project/${project.treasury_nft_policy_id}`}
                        className="font-medium hover:underline"
                      >
                        {project.title}
                      </Link>
                      {isOnChain && (
                        <AndamioTooltip>
                          <AndamioTooltipTrigger asChild>
                            <div className="flex items-center">
                              <OnChainIcon className="h-4 w-4 text-success" />
                            </div>
                          </AndamioTooltipTrigger>
                          <AndamioTooltipContent>
                            Verified on-chain
                          </AndamioTooltipContent>
                        </AndamioTooltip>
                      )}
                    </div>
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
                    <AndamioBadge variant={project.live ? "default" : "secondary"}>
                      {project.live ? "Live" : "Draft"}
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
