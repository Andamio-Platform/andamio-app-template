"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useProjects } from "~/hooks/api";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioPageLoading, AndamioEmptyState, AndamioTableContainer, AndamioText } from "~/components/andamio";
import { AndamioTooltip, AndamioTooltipContent, AndamioTooltipTrigger } from "~/components/andamio/andamio-tooltip";
import { AlertIcon, ProjectIcon, SuccessIcon, PendingIcon, CredentialIcon } from "~/components/icons";
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

  // Derive eligibility from project prerequisites (pure computation, no API calls)
  // Note: Without student completion data on the list page, projects with prerequisites
  // will show progress as 0/N. Individual project pages do full eligibility checks.
  const eligibilityMap = useMemo(() => {
    const map = new Map<string, EligibilityResult>();
    if (!projects?.length) return map;

    for (const project of projects) {
      if (!project.projectId) continue;
      const result = checkProjectEligibility(project.prerequisites ?? [], []);
      map.set(project.projectId, result);
    }
    return map;
  }, [projects]);

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
                <SuccessIcon className="h-4 w-4 text-primary" />
                <AndamioBadge variant="outline" className="text-primary border-primary/30">
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
              <CredentialIcon className="h-4 w-4 text-primary" />
              <AndamioBadge variant="outline" className="text-primary border-primary/30">
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
            <PendingIcon className="h-4 w-4 text-muted-foreground" />
            <AndamioBadge variant="outline" className="text-muted-foreground border-muted-foreground/30">
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
              // App-level Project type has title flattened from content
              const title = project.title;

              return (
                <AndamioTableRow key={project.projectId ?? title ?? `project-${index}`}>
                  <AndamioTableCell>
                    <Link
                      href={`/project/${project.projectId}`}
                      className="font-medium hover:underline"
                    >
                      {title ?? project.projectId?.slice(0, 16) ?? "Untitled"}
                    </Link>
                  </AndamioTableCell>
                  <AndamioTableCell className="hidden md:table-cell font-mono text-xs break-all max-w-xs">
                    {project.projectId ? (
                      <span title={project.projectId}>
                        {project.projectId.slice(0, 16)}...
                      </span>
                    ) : (
                      "-"
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    {renderEligibilityBadge(project.projectId)}
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
