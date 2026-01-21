"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProject } from "~/hooks/api";
import {
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
  AndamioEmptyState,
  AndamioSectionHeader,
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
} from "~/components/andamio";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import {
  TaskIcon,
  ContributorIcon,
  OnChainIcon,
  CourseIcon,
  CredentialIcon,
  TreasuryIcon,
} from "~/components/icons";
import { type OrchestrationMergedProjectDetail } from "~/types/generated";
import { formatLovelace } from "~/lib/cardano-utils";

/**
 * Project Data Component
 * Displays project data from the merged API
 */
function ProjectDataCard({
  project,
  isLoading,
}: {
  project: OrchestrationMergedProjectDetail | null | undefined;
  isLoading: boolean;
}) {
  // Loading state
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardIconHeader icon={OnChainIcon} title="On-Chain Data" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <AndamioSkeleton className="h-4 w-20" />
                <AndamioSkeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Not available
  if (!project) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardIconHeader icon={OnChainIcon} title="Project Data" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <OnChainIcon className="h-4 w-4" />
            <AndamioText variant="small">
              Project data not available
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Calculate totals
  const contributors = project.contributors ?? [];
  const tasks = project.tasks ?? [];
  const submissions = project.submissions ?? [];
  const assessments = project.assessments ?? [];
  const credentialClaims = project.credential_claims ?? [];
  const treasuryFundings = project.treasury_fundings ?? [];
  const prerequisites = project.prerequisites ?? [];

  const totalFunding = treasuryFundings.reduce(
    (sum, f) => sum + (f.lovelace_amount ?? 0),
    0
  );
  const pendingSubmissions = submissions.length;
  const completedAssessments = assessments.length;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader
            icon={OnChainIcon}
            title="Project Data"
            description="Live blockchain data"
          />
          {project.source === "merged" && (
            <AndamioBadge status="success">
              Verified
            </AndamioBadge>
          )}
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <ContributorIcon className="h-4 w-4" />
              <AndamioText variant="small">Contributors</AndamioText>
            </div>
            <AndamioText className="text-2xl font-bold">
              {contributors.length}
            </AndamioText>
          </div>

          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TaskIcon className="h-4 w-4" />
              <AndamioText variant="small">Tasks</AndamioText>
            </div>
            <AndamioText className="text-2xl font-bold">
              {tasks.length}
            </AndamioText>
          </div>

          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CredentialIcon className="h-4 w-4" />
              <AndamioText variant="small">Credentials Claimed</AndamioText>
            </div>
            <AndamioText className="text-2xl font-bold">
              {credentialClaims.length}
            </AndamioText>
          </div>

          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TreasuryIcon className="h-4 w-4" />
              <AndamioText variant="small">Total Funded</AndamioText>
            </div>
            <AndamioText className="text-2xl font-bold">
              {formatLovelace(totalFunding)}
            </AndamioText>
          </div>
        </div>

        {/* Activity Summary */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <AndamioText variant="small" className="font-medium mb-2">
              Submission Activity
            </AndamioText>
            <div className="flex items-center gap-4">
              <AndamioBadge variant="secondary">
                {submissions.length} submissions
              </AndamioBadge>
              <AndamioBadge variant="outline">
                {pendingSubmissions} pending
              </AndamioBadge>
              <AndamioBadge variant="default">
                {completedAssessments} assessed
              </AndamioBadge>
            </div>
          </div>

          {prerequisites.length > 0 && (
            <div>
              <AndamioText variant="small" className="font-medium mb-2">
                Prerequisites
              </AndamioText>
              <div className="flex flex-wrap gap-2">
                {prerequisites.map((prereq, i) => (
                  <AndamioBadge key={i} variant="outline" className="font-mono text-xs">
                    <CourseIcon className="h-3 w-3 mr-1" />
                    {prereq.course_id?.slice(0, 12)}... ({prereq.assignment_ids?.length ?? 0} assignments)
                  </AndamioBadge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contributors List */}
        {contributors.length > 0 && (
          <div>
            <AndamioText variant="small" className="font-medium mb-2">
              Active Contributors
            </AndamioText>
            <div className="flex flex-wrap gap-2">
              {contributors.slice(0, 10).map((contributor, i) => (
                <AndamioBadge key={contributor.alias ?? i} variant="secondary" className="font-mono text-xs">
                  {contributor.alias ?? "Unknown"}
                </AndamioBadge>
              ))}
              {contributors.length > 10 && (
                <AndamioBadge variant="outline">
                  +{contributors.length - 10} more
                </AndamioBadge>
              )}
            </div>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}

/**
 * Project detail page displaying project info and tasks list
 *
 * API Endpoint (V2 Merged):
 * - GET /api/v2/project/user/project/{project_id}
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectid as string;

  // Fetch project with all data from merged endpoint
  const {
    data: project,
    isLoading,
    error,
  } = useProject(projectId);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/project" label="Back to Projects" />
        <AndamioErrorAlert error={error?.message ?? "Project not found"} />
      </div>
    );
  }

  // Get tasks from merged project data
  const allTasks = project.tasks ?? [];
  // For on-chain tasks, filter based on availability (not deleted)
  const liveTasks = allTasks;

  // Get project title from content
  const projectTitle = project.content?.title ?? "Project";

  // Empty tasks state
  if (liveTasks.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/project" label="Back to Projects" />

        <AndamioPageHeader title={projectTitle} />
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            {project.project_id?.slice(0, 16)}...
          </AndamioBadge>
        </div>

        {/* Project Data Section */}
        <ProjectDataCard
          project={project}
          isLoading={false}
        />

        <AndamioEmptyState
          icon={TaskIcon}
          title="No tasks available"
          description="This project doesn't have any tasks yet. Check back later."
        />
      </div>
    );
  }

  // Project and tasks display
  return (
    <div className="space-y-6">
      <AndamioBackButton href="/project" label="Back to Projects" />

      <AndamioPageHeader
        title={projectTitle}
        action={
          <Link href={`/project/${projectId}/contributor`}>
            <AndamioButton>
              <ContributorIcon className="h-4 w-4 mr-2" />
              Contribute
            </AndamioButton>
          </Link>
        }
      />
      <div className="flex flex-wrap items-center gap-2">
        <AndamioBadge variant="outline" className="font-mono text-xs">
          {project.project_id?.slice(0, 16)}...
        </AndamioBadge>
      </div>

      {/* Project Data Section */}
      <ProjectDataCard
        project={project}
        isLoading={false}
      />

      <div className="space-y-4">
        <AndamioSectionHeader title="Available Tasks" />
        <AndamioTableContainer>
          <AndamioTable>
            <AndamioTableHeader>
              <AndamioTableRow>
                <AndamioTableHead className="w-12 sm:w-16">#</AndamioTableHead>
                <AndamioTableHead className="min-w-[150px]">Task ID</AndamioTableHead>
                <AndamioTableHead className="min-w-[200px] hidden md:table-cell">Expiration</AndamioTableHead>
                <AndamioTableHead className="w-24 sm:w-32 text-center">Reward</AndamioTableHead>
              </AndamioTableRow>
            </AndamioTableHeader>
            <AndamioTableBody>
              {liveTasks.map((task, index) => (
                <AndamioTableRow key={task.task_id ?? index}>
                  <AndamioTableCell className="font-mono text-xs">
                    {index + 1}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    {task.task_id ? (
                      <Link
                        href={`/project/${projectId}/${task.task_id}`}
                        className="font-medium font-mono text-sm hover:underline"
                      >
                        {task.task_id.slice(0, 16)}...
                      </Link>
                    ) : (
                      <AndamioText className="font-medium text-muted-foreground">No ID</AndamioText>
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="max-w-xs truncate hidden md:table-cell">
                    {task.expiration ? (
                      <AndamioText variant="small">
                        Expires: {new Date(task.expiration).toLocaleDateString()}
                      </AndamioText>
                    ) : (
                      <AndamioText variant="small" className="text-muted-foreground">
                        No expiration
                      </AndamioText>
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant="outline">
                      {formatLovelace(task.lovelace_amount ?? 0)}
                    </AndamioBadge>
                  </AndamioTableCell>
                </AndamioTableRow>
              ))}
            </AndamioTableBody>
          </AndamioTable>
        </AndamioTableContainer>
      </div>
    </div>
  );
}
