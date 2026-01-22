"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useProjects } from "~/hooks/api";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioPageLoading, AndamioEmptyState, AndamioTableContainer, AndamioText } from "~/components/andamio";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import { AlertIcon, ProjectIcon, SuccessIcon, PendingIcon, CredentialIcon, LoadingIcon } from "~/components/icons";
import { checkProjectEligibility, type EligibilityResult } from "~/lib/project-eligibility";

/**
 * Public page displaying all published projects
 *
 * Shows eligibility status for authenticated users based on their
 * completed courses/credentials.
 *
 * API Endpoint: GET /api/v2/project/user/projects/list
 */
export default function ProjectCatalogPage() {
  // Fetch projects from gateway
  const { data: projects, isLoading, error } = useProjects();

  // Auth for eligibility checking
  const { user, isAuthenticated } = useAndamioAuth();
  const userAlias = user?.accessTokenAlias;

  // Eligibility state: projectId -> result
  const [eligibilityMap, setEligibilityMap] = useState<Map<string, EligibilityResult>>(new Map());
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Check eligibility for projects when user is authenticated
  const checkEligibility = useCallback(async () => {
    if (!userAlias || !projects?.length) return;

    // Filter to projects with valid project_id
    const projectsWithId = projects.filter(
      (p): p is typeof p & { project_id: string } => typeof p.project_id === "string"
    );

    if (projectsWithId.length === 0) return;

    setIsCheckingEligibility(true);

    try {
      const results = await Promise.all(
        projectsWithId.map(async (project) => {
          try {
            const result = await checkProjectEligibility(project.project_id, userAlias);
            return { projectId: project.project_id, result };
          } catch (err) {
            console.error(`Error checking eligibility for ${project.project_id}:`, err);
            return null;
          }
        })
      );

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
  }, [userAlias, projects]);

  // Trigger eligibility check when dependencies are ready
  useEffect(() => {
    if (isAuthenticated && userAlias && projects && projects.length > 0) {
      void checkEligibility();
    }
  }, [isAuthenticated, userAlias, projects, checkEligibility]);

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
          <AndamioAlertDescription>{error.message}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  // Empty state
  if (!projects || projects.length === 0) {
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
  const renderEligibilityBadge = (projectId: string | undefined) => {
    if (!isAuthenticated || !userAlias) {
      return (
        <AndamioText variant="small" className="text-muted-foreground">
          Connect to check
        </AndamioText>
      );
    }

    if (!projectId) {
      return (
        <AndamioText variant="small" className="text-muted-foreground">
          -
        </AndamioText>
      );
    }

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

    if (eligibility.eligible) {
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
              <AndamioTableHead className="text-center">Eligibility</AndamioTableHead>
            </AndamioTableRow>
          </AndamioTableHeader>
          <AndamioTableBody>
            {projects.map((project, index) => {
              // Handle both merged format (content.title) and legacy format (title at top level)
              const title = project.content?.title ?? (project as unknown as { title?: string }).title;

              return (
                <AndamioTableRow key={project.project_id ?? title ?? `project-${index}`}>
                  <AndamioTableCell>
                    <Link
                      href={`/project/${project.project_id}`}
                      className="font-medium hover:underline"
                    >
                      {title ?? project.project_id?.slice(0, 16) ?? "Untitled"}
                    </Link>
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
                    {renderEligibilityBadge(project.project_id)}
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
