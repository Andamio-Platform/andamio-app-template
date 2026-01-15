"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { env } from "~/env";
import { useAllProjects } from "~/hooks/use-andamioscan";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioPageLoading, AndamioEmptyState, AndamioTableContainer, AndamioText } from "~/components/andamio";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import { AlertIcon, ProjectIcon, OnChainIcon, SuccessIcon, PendingIcon, CredentialIcon, LoadingIcon } from "~/components/icons";
import { type ProjectV2Output } from "@andamio/db-api-types";
import { checkProjectEligibility, type EligibilityResult } from "~/lib/project-eligibility";

/**
 * Public page displaying all published projects
 *
 * Shows eligibility status for authenticated users based on their
 * completed courses/credentials from Andamioscan.
 *
 * API Endpoint (V2): GET /project-v2/public/projects/list
 * Andamioscan: GET /api/v2/users/{alias}/state
 */
export default function ProjectCatalogPage() {
  const [projects, setProjects] = useState<ProjectV2Output[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth for eligibility checking
  const { user, isAuthenticated } = useAndamioAuth();
  const userAlias = user?.accessTokenAlias;

  // Eligibility state: projectId -> result
  const [eligibilityMap, setEligibilityMap] = useState<Map<string, EligibilityResult>>(new Map());
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Fetch on-chain projects for status indicator
  const { data: onChainProjects } = useAllProjects();

  // Create a Set of on-chain project IDs for quick lookup
  const onChainProjectIds = useMemo(() => {
    return new Set(onChainProjects?.map((p) => p.project_id) ?? []);
  }, [onChainProjects]);

  // Fetch published projects
  useEffect(() => {
    const fetchPublishedProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // V2 API: GET /project-v2/public/projects/list
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/public/projects/list`
        );

        // 404 means no published projects exist yet - treat as empty state, not error
        if (response.status === 404) {
          setProjects([]);
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = (await response.json()) as ProjectV2Output[];
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

  // Check eligibility for on-chain projects when user is authenticated
  const checkEligibility = useCallback(async () => {
    if (!userAlias || !onChainProjectIds.size) return;

    // Only check on-chain projects (prerequisites come from Andamioscan)
    // Filter to projects with valid project_id that exist on-chain
    const onChainProjectList = projects
      .filter((p): p is ProjectV2Output & { project_id: string } =>
        typeof p.project_id === "string" && onChainProjectIds.has(p.project_id)
      );

    if (onChainProjectList.length === 0) return;

    setIsCheckingEligibility(true);

    try {
      // Check eligibility for each on-chain project in parallel
      const results = await Promise.all(
        onChainProjectList.map(async (project) => {
          try {
            const result = await checkProjectEligibility(project.project_id, userAlias);
            return { projectId: project.project_id, result };
          } catch (err) {
            console.error(`Error checking eligibility for ${project.project_id}:`, err);
            return null;
          }
        })
      );

      // Build eligibility map
      const newMap = new Map<string, EligibilityResult>();
      for (const entry of results) {
        if (entry) {
          newMap.set(entry.projectId, entry.result);
        }
      }
      setEligibilityMap(newMap);
    } catch (err) {
      console.error("Error checking eligibility:", err);
    } finally {
      setIsCheckingEligibility(false);
    }
  }, [userAlias, projects, onChainProjectIds]);

  // Trigger eligibility check when dependencies are ready
  useEffect(() => {
    if (isAuthenticated && userAlias && projects.length > 0 && onChainProjectIds.size > 0) {
      void checkEligibility();
    }
  }, [isAuthenticated, userAlias, projects, onChainProjectIds, checkEligibility]);

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

  // Helper to render eligibility status
  const renderEligibilityBadge = (projectId: string | null, isOnChain: boolean) => {
    // Not authenticated - show login prompt
    if (!isAuthenticated || !userAlias) {
      return (
        <AndamioText variant="small" className="text-muted-foreground">
          Connect to check
        </AndamioText>
      );
    }

    // Not on-chain - can't check prerequisites
    if (!isOnChain || !projectId) {
      return (
        <AndamioText variant="small" className="text-muted-foreground">
          -
        </AndamioText>
      );
    }

    // Still loading eligibility
    if (isCheckingEligibility && !eligibilityMap.has(projectId)) {
      return (
        <div className="flex items-center gap-1.5">
          <LoadingIcon className="h-3 w-3 animate-spin text-muted-foreground" />
          <AndamioText variant="small" className="text-muted-foreground">
            Checking...
          </AndamioText>
        </div>
      );
    }

    const eligibility = eligibilityMap.get(projectId);
    if (!eligibility) {
      return (
        <AndamioText variant="small" className="text-muted-foreground">
          -
        </AndamioText>
      );
    }

    // User is eligible
    if (eligibility.eligible) {
      // No prerequisites required
      if (eligibility.totalRequired === 0) {
        return (
          <AndamioTooltip>
            <AndamioTooltipTrigger asChild>
              <div className="flex items-center gap-1.5">
                <SuccessIcon className="h-4 w-4 text-success" />
                <AndamioBadge variant="outline" className="text-success border-success/30">
                  Open
                </AndamioBadge>
              </div>
            </AndamioTooltipTrigger>
            <AndamioTooltipContent>
              No prerequisites required - anyone can contribute
            </AndamioTooltipContent>
          </AndamioTooltip>
        );
      }
      // Has prerequisites and user meets them
      return (
        <AndamioTooltip>
          <AndamioTooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <CredentialIcon className="h-4 w-4 text-success" />
              <AndamioBadge variant="outline" className="text-success border-success/30">
                Qualified
              </AndamioBadge>
            </div>
          </AndamioTooltipTrigger>
          <AndamioTooltipContent>
            You meet all {eligibility.totalRequired} prerequisite requirement{eligibility.totalRequired !== 1 ? "s" : ""}
          </AndamioTooltipContent>
        </AndamioTooltip>
      );
    }

    // User is not eligible - show progress
    const progress = eligibility.totalRequired > 0
      ? Math.round((eligibility.totalCompleted / eligibility.totalRequired) * 100)
      : 0;

    return (
      <AndamioTooltip>
        <AndamioTooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <PendingIcon className="h-4 w-4 text-warning" />
            <AndamioBadge variant="outline" className="text-warning border-warning/30">
              {eligibility.totalCompleted}/{eligibility.totalRequired}
            </AndamioBadge>
          </div>
        </AndamioTooltipTrigger>
        <AndamioTooltipContent>
          <div className="space-y-1">
            <div>Prerequisites: {eligibility.totalCompleted} of {eligibility.totalRequired} completed ({progress}%)</div>
            {eligibility.missingPrerequisites.length > 0 && (
              <div className="text-xs">
                Complete {eligibility.missingPrerequisites.length} more course{eligibility.missingPrerequisites.length !== 1 ? "s" : ""} to qualify
              </div>
            )}
          </div>
        </AndamioTooltipContent>
      </AndamioTooltip>
    );
  };

  // Projects list
  return (
    <div className="space-y-6">
      <AndamioPageHeader
        title="Projects"
        description={isAuthenticated
          ? "Browse projects and see which ones you qualify for based on your completed courses."
          : "Browse all published projects. Connect your wallet to see eligibility."
        }
      />

      <AndamioTableContainer>
        <AndamioTable>
          <AndamioTableHeader>
            <AndamioTableRow>
              <AndamioTableHead>Title</AndamioTableHead>
              <AndamioTableHead className="hidden md:table-cell">Project ID</AndamioTableHead>
              <AndamioTableHead className="text-center">Status</AndamioTableHead>
              <AndamioTableHead className="text-center">Eligibility</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {projects.map((project) => {
              // Check if project exists on-chain
              const isOnChain = project.project_id
                ? onChainProjectIds.has(project.project_id)
                : false;

              return (
                <AndamioTableRow key={project.project_id ?? project.title}>
                  <AndamioTableCell>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/project/${project.project_id}`}
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
                  <AndamioTableCell className="hidden md:table-cell font-mono text-xs break-all max-w-xs">
                    {project.project_id ? (
                      <span title={project.project_id}>
                        {project.project_id.slice(0, 16)}...
                      </span>
                    ) : (
                      "-"
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant={project.status === "ON_CHAIN" ? "default" : "secondary"}>
                      {project.status === "ON_CHAIN" ? "Live" : project.status}
                    </AndamioBadge>
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    {renderEligibilityBadge(project.project_id ?? null, isOnChain)}
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
