"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useProject } from "~/hooks/use-andamioscan";
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
import { type ProjectV2Output, type ProjectTaskV2Output } from "@andamio/db-api-types";
import { formatLovelace } from "~/lib/cardano-utils";

import type { AndamioscanProjectDetails } from "~/lib/andamioscan";

/**
 * On-Chain Project Data Component
 * Displays blockchain data from Andamioscan
 */
function OnChainProjectData({
  projectDetails,
  isLoading,
}: {
  projectDetails: AndamioscanProjectDetails | null | undefined;
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

  // Not on chain
  if (!projectDetails) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardIconHeader icon={OnChainIcon} title="On-Chain Data" />
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <OnChainIcon className="h-4 w-4" />
            <AndamioText variant="small">
              Project not yet indexed on-chain
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Calculate totals
  const totalFunding = projectDetails.treasury_fundings.reduce(
    (sum, f) => sum + f.lovelace,
    0
  );
  const pendingSubmissions = projectDetails.submissions.filter(
    (s) => !s.deletedAt?.valid
  ).length;
  const completedAssessments = projectDetails.assessments.filter(
    (a) => !a.deletedAt?.valid
  ).length;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader
            icon={OnChainIcon}
            title="On-Chain Data"
            description="Live blockchain data from Andamioscan"
          />
          <AndamioBadge status="success">
            Verified
          </AndamioBadge>
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
              {projectDetails.contributors.length}
            </AndamioText>
          </div>

          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TaskIcon className="h-4 w-4" />
              <AndamioText variant="small">On-Chain Tasks</AndamioText>
            </div>
            <AndamioText className="text-2xl font-bold">
              {projectDetails.tasks.length}
            </AndamioText>
          </div>

          <div className="rounded-lg bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CredentialIcon className="h-4 w-4" />
              <AndamioText variant="small">Credentials Claimed</AndamioText>
            </div>
            <AndamioText className="text-2xl font-bold">
              {projectDetails.credential_claims.length}
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
                {projectDetails.submissions.length} submissions
              </AndamioBadge>
              <AndamioBadge variant="outline">
                {pendingSubmissions} pending
              </AndamioBadge>
              <AndamioBadge variant="default">
                {completedAssessments} assessed
              </AndamioBadge>
            </div>
          </div>

          {projectDetails.prerequisites.length > 0 && (
            <div>
              <AndamioText variant="small" className="font-medium mb-2">
                Prerequisites
              </AndamioText>
              <div className="flex flex-wrap gap-2">
                {projectDetails.prerequisites.map((prereq, i) => (
                  <AndamioBadge key={i} variant="outline" className="font-mono text-xs">
                    <CourseIcon className="h-3 w-3 mr-1" />
                    {prereq.course_id.slice(0, 12)}... ({prereq.assignment_ids.length} assignments)
                  </AndamioBadge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contributors List */}
        {projectDetails.contributors.length > 0 && (
          <div>
            <AndamioText variant="small" className="font-medium mb-2">
              Active Contributors
            </AndamioText>
            <div className="flex flex-wrap gap-2">
              {projectDetails.contributors.slice(0, 10).map((alias) => (
                <AndamioBadge key={alias} variant="secondary" className="font-mono text-xs">
                  {alias}
                </AndamioBadge>
              ))}
              {projectDetails.contributors.length > 10 && (
                <AndamioBadge variant="outline">
                  +{projectDetails.contributors.length - 10} more
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
 * API Endpoints (V2):
 * - GET /project-v2/public/project/:project_id
 * - GET /project-v2/public/tasks/:project_state_policy_id
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectid as string;

  const [project, setProject] = useState<ProjectV2Output | null>(null);
  const [tasks, setTasks] = useState<ProjectTaskV2Output[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on-chain project details from Andamioscan
  const {
    data: onChainProject,
    isLoading: isOnChainLoading,
  } = useProject(projectId);

  useEffect(() => {
    const fetchProjectAndTasks = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // V2 API: GET /project-v2/public/project/:project_id
        const projectResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/public/project/${projectId}`
        );

        if (!projectResponse.ok) {
          const errorText = await projectResponse.text();
          console.error("Project fetch error:", {
            status: projectResponse.status,
            statusText: projectResponse.statusText,
            body: errorText,
          });
          throw new Error(`Project not found (${projectResponse.status})`);
        }

        const projectData = (await projectResponse.json()) as ProjectV2Output;
        setProject(projectData);

        // V2 API: GET /project-v2/public/tasks/:project_state_policy_id
        // Note: project_state_policy_id comes from the project's states array
        if (projectData.states && projectData.states.length > 0) {
          const projectStatePolicyId = projectData.states[0]?.project_state_policy_id;
          if (projectStatePolicyId) {
            const tasksResponse = await fetch(
              `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/public/tasks/${projectStatePolicyId}`
            );

            if (!tasksResponse.ok) {
              const errorText = await tasksResponse.text();
              console.error("Tasks fetch error:", {
                status: tasksResponse.status,
                statusText: tasksResponse.statusText,
                body: errorText,
              });
              // Don't throw - project might have no tasks yet
              console.warn("Failed to fetch tasks:", errorText);
            } else {
              const tasksData = (await tasksResponse.json()) as ProjectTaskV2Output[];
              setTasks(tasksData ?? []);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching project and tasks:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchProjectAndTasks();
  }, [projectId]);

  // Helper to check if a task is expired
  const isTaskExpired = (expirationTime: string | null): boolean => {
    if (!expirationTime) return false;
    const expiryTimestamp = parseInt(expirationTime, 10);
    const currentTimestamp = Date.now();
    return currentTimestamp > expiryTimestamp;
  };

  // Helper to get status badge variant
  const getStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    switch (status) {
      case "ON_CHAIN":
        return "default";
      case "DRAFT":
        return "secondary";
      case "EXPIRED":
      case "CANCELLED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/project" label="Back to Projects" />
        <AndamioErrorAlert error={error ?? "Project not found"} />
      </div>
    );
  }

  // Filter tasks to show only live tasks for public view
  const liveTasks = tasks.filter((task) => task.status === "ON_CHAIN");

  // Empty tasks state
  if (liveTasks.length === 0) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/project" label="Back to Projects" />

        <AndamioPageHeader title={project.title ?? "Project"} />
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            {project.project_id?.slice(0, 16)}...
          </AndamioBadge>
        </div>

        {/* On-Chain Data Section */}
        <OnChainProjectData
          projectDetails={onChainProject}
          isLoading={isOnChainLoading}
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
        title={project.title ?? "Project"}
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

      {/* On-Chain Data Section */}
      <OnChainProjectData
        projectDetails={onChainProject}
        isLoading={isOnChainLoading}
      />

      <div className="space-y-4">
        <AndamioSectionHeader title="Available Tasks" />
        <AndamioTableContainer>
          <AndamioTable>
            <AndamioTableHeader>
              <AndamioTableRow>
                <AndamioTableHead className="w-12 sm:w-16">#</AndamioTableHead>
                <AndamioTableHead className="min-w-[150px]">Title</AndamioTableHead>
                <AndamioTableHead className="min-w-[200px] hidden md:table-cell">Description</AndamioTableHead>
                <AndamioTableHead className="w-24 sm:w-32 text-center">Reward</AndamioTableHead>
                <AndamioTableHead className="w-24 sm:w-32 text-center">Status</AndamioTableHead>
              </AndamioTableRow>
            </AndamioTableHeader>
            <AndamioTableBody>
              {liveTasks.map((task) => (
                <AndamioTableRow key={task.task_hash ?? task.index}>
                  <AndamioTableCell className="font-mono text-xs">
                    {task.index}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    {task.task_hash ? (
                      <Link
                        href={`/project/${projectId}/${task.task_hash}`}
                        className="font-medium hover:underline"
                      >
                        {task.title}
                      </Link>
                    ) : (
                      <AndamioText className="font-medium">{task.title}</AndamioText>
                    )}
                  </AndamioTableCell>
                  <AndamioTableCell className="max-w-xs truncate hidden md:table-cell">
                    {task.content}
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    <AndamioBadge variant="outline">
                      {formatLovelace(task.lovelace)}
                    </AndamioBadge>
                  </AndamioTableCell>
                  <AndamioTableCell className="text-center">
                    {task.status === "ON_CHAIN" && isTaskExpired(task.expiration_time) ? (
                      <AndamioBadge variant="destructive">
                        Expired
                      </AndamioBadge>
                    ) : (
                      <AndamioBadge variant={getStatusVariant(task.status)}>
                        {task.status === "ON_CHAIN" ? "Live" : task.status}
                      </AndamioBadge>
                    )}
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
