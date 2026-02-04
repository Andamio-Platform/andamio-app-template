"use client";

import React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProject } from "~/hooks/api";
import { useProjectTasks } from "~/hooks/api/project/use-project";
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
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
} from "~/components/andamio";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioCardDescription,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  TaskIcon,
  ContributorIcon,
  CredentialIcon,
  TreasuryIcon,
  SuccessIcon,
  AlertIcon,
  CourseIcon,
} from "~/components/icons";
import { PrerequisiteList } from "~/components/project/prerequisite-list";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { checkProjectEligibility } from "~/lib/project-eligibility";
import { formatLovelace } from "~/lib/cardano-utils";

/**
 * Project detail page — the public-facing view of a project.
 *
 * Layout:
 * 1. Header (title, policy ID, Contribute CTA)
 * 2. Stats bar (treasury, tasks, contributors, credentials)
 * 3. Prerequisites + eligibility (combined, only if project has prereqs)
 * 4. Available Tasks table
 */
export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.projectid as string;

  const { data: project, isLoading, error } = useProject(projectId);
  const { data: mergedTasks } = useProjectTasks(projectId);
  const { isAuthenticated } = useAndamioAuth();

  // Prerequisite eligibility
  const prereqCourseIds = React.useMemo(() => {
    if (!project?.prerequisites) return [];
    return project.prerequisites
      .map((p) => p.courseId)
      .filter((id): id is string => !!id);
  }, [project?.prerequisites]);

  const { completions } = useStudentCompletionsForPrereqs(prereqCourseIds);

  const prerequisites = project?.prerequisites ?? [];
  const eligibility = React.useMemo(() => {
    if (!isAuthenticated || prerequisites.length === 0) return null;
    return checkProjectEligibility(prerequisites, completions);
  }, [isAuthenticated, prerequisites, completions]);

  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href="/project" label="Back to Projects" />
        <AndamioErrorAlert error={error?.message ?? "Project not found"} />
      </div>
    );
  }

  const allTasks = mergedTasks ?? project.tasks ?? [];
  const liveTasks = allTasks.filter((t) => t.taskStatus === "ON_CHAIN");
  const projectTitle = project.title ?? "Project";

  // Derived stats
  const contributors = project.contributors ?? [];
  const credentialClaims = project.credentialClaims ?? [];
  const treasuryFundings = project.treasuryFundings ?? [];
  const totalFunding = treasuryFundings.reduce(
    (sum, f) => sum + (f.lovelaceAmount ?? 0),
    0,
  );
  const totalRewards = liveTasks.reduce(
    (sum, t) => sum + (parseInt(t.lovelaceAmount ?? "0", 10) || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* ── Header ────────────────────────────────────────────────── */}
      <div>
        <AndamioBackButton href="/project" label="Back to Projects" />

        <div className="mt-4">
          <AndamioPageHeader
            title={projectTitle}
            description={project.description || undefined}
            action={
              liveTasks.length > 0 ? (
                <Link href={`/project/${projectId}/contributor`}>
                  <AndamioButton>
                    <ContributorIcon className="h-4 w-4 mr-2" />
                    Contribute
                  </AndamioButton>
                </Link>
              ) : undefined
            }
          />
        </div>

        <AndamioText variant="small" className="font-mono text-muted-foreground mt-1">
          {project.projectId}
        </AndamioText>
      </div>

      {/* ── Stats Bar ─────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TreasuryIcon className="h-4 w-4" />
            <AndamioText variant="small">Treasury</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {formatLovelace(totalFunding)}
          </AndamioText>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TaskIcon className="h-4 w-4" />
            <AndamioText variant="small">Available Rewards</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {formatLovelace(totalRewards)}
          </AndamioText>
          <AndamioText variant="small" className="text-muted-foreground">
            across {liveTasks.length} task{liveTasks.length !== 1 ? "s" : ""}
          </AndamioText>
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ContributorIcon className="h-4 w-4" />
            <AndamioText variant="small">Contributors</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {contributors.length}
          </AndamioText>
          {contributors.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {contributors.slice(0, 5).map((c, i) => (
                <AndamioBadge key={c.alias ?? i} variant="secondary" className="font-mono text-xs">
                  {c.alias ?? "?"}
                </AndamioBadge>
              ))}
              {contributors.length > 5 && (
                <AndamioBadge variant="outline" className="text-xs">
                  +{contributors.length - 5}
                </AndamioBadge>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CredentialIcon className="h-4 w-4" />
            <AndamioText variant="small">Credentials Claimed</AndamioText>
          </div>
          <AndamioText className="text-2xl font-bold">
            {credentialClaims.length}
          </AndamioText>
        </div>
      </div>

      {/* ── Prerequisites + Eligibility (combined) ────────────────── */}
      {prerequisites.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CourseIcon className="h-5 w-5" />
                <div>
                  <AndamioCardTitle>Prerequisites</AndamioCardTitle>
                  <AndamioCardDescription>
                    Complete these course modules to contribute
                  </AndamioCardDescription>
                </div>
              </div>
              {eligibility && (
                eligibility.eligible ? (
                  <AndamioBadge status="success" className="gap-1">
                    <SuccessIcon className="h-3.5 w-3.5" />
                    Eligible
                  </AndamioBadge>
                ) : (
                  <AndamioBadge variant="outline" className="gap-1 text-muted-foreground">
                    <AlertIcon className="h-3.5 w-3.5" />
                    {eligibility.totalCompleted}/{eligibility.totalRequired} completed
                  </AndamioBadge>
                )
              )}
            </div>
          </AndamioCardHeader>
          <AndamioCardContent>
            <PrerequisiteList prerequisites={prerequisites} completions={completions} />

            {/* Eligibility CTA for authenticated users */}
            {eligibility?.eligible && (
              <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <SuccessIcon className="h-4 w-4 text-primary shrink-0" />
                <AndamioText variant="small" className="text-primary">
                  You meet all prerequisites
                </AndamioText>
                <Link href={`/project/${projectId}/contributor`} className="ml-auto">
                  <AndamioButton size="sm" variant="outline">
                    <ContributorIcon className="h-3.5 w-3.5 mr-1.5" />
                    Get Started
                  </AndamioButton>
                </Link>
              </div>
            )}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* ── Available Tasks ───────────────────────────────────────── */}
      {liveTasks.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TaskIcon className="h-5 w-5" />
              <AndamioText className="text-lg font-semibold">Available Tasks</AndamioText>
            </div>
          </div>
          <AndamioTableContainer>
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead className="w-12">#</AndamioTableHead>
                  <AndamioTableHead>Task</AndamioTableHead>
                  <AndamioTableHead className="hidden md:table-cell">Expiration</AndamioTableHead>
                  <AndamioTableHead className="text-right">Reward</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {liveTasks.map((task, index) => (
                  <AndamioTableRow key={task.taskHash ?? index}>
                    <AndamioTableCell className="font-mono text-xs text-muted-foreground">
                      {task.index ?? index + 1}
                    </AndamioTableCell>
                    <AndamioTableCell>
                      {task.taskHash ? (
                        <Link href={`/project/${projectId}/${task.taskHash}`}>
                          <AndamioText className="font-medium hover:underline">
                            {task.title || "Untitled Task"}
                          </AndamioText>
                          <AndamioText variant="small" className="font-mono text-xs text-muted-foreground">
                            {task.taskHash.slice(0, 20)}...
                          </AndamioText>
                        </Link>
                      ) : (
                        <AndamioText className="text-muted-foreground">No ID</AndamioText>
                      )}
                    </AndamioTableCell>
                    <AndamioTableCell className="hidden md:table-cell">
                      {task.expirationTime ? (
                        <AndamioText variant="small">
                          {new Date(Number(task.expirationTime)).toLocaleDateString()}
                        </AndamioText>
                      ) : (
                        <AndamioText variant="small" className="text-muted-foreground">
                          None
                        </AndamioText>
                      )}
                    </AndamioTableCell>
                    <AndamioTableCell className="text-right">
                      <AndamioBadge variant="outline">
                        {formatLovelace(task.lovelaceAmount ?? "0")}
                      </AndamioBadge>
                    </AndamioTableCell>
                  </AndamioTableRow>
                ))}
              </AndamioTableBody>
            </AndamioTable>
          </AndamioTableContainer>
        </div>
      ) : (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No tasks available"
          description="This project doesn't have any active tasks yet. Check back later."
        />
      )}
    </div>
  );
}
