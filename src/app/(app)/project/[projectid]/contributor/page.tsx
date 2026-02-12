"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { RequireAuth } from "~/components/auth/require-auth";
import {
  AndamioBadge,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioEmptyState,
  AndamioText,
  AndamioDashboardStat,
  AndamioRemoveButton,
} from "~/components/andamio";
import {
  ContributorIcon,
  TaskIcon,
  CredentialIcon,
  CourseIcon,
  AlertIcon,
  SuccessIcon,
  PendingIcon,
} from "~/components/icons";
import { useProject, useProjectTasks, projectKeys } from "~/hooks/api/project/use-project";
import { useContributorCommitments, projectContributorKeys } from "~/hooks/api/project/use-project-contributor";
import { useQueryClient } from "@tanstack/react-query";
import { ProjectCredentialClaim } from "~/components/tx";
import { formatLovelace } from "~/lib/cardano-utils";
import { checkProjectEligibility, type MissingPrerequisite } from "~/lib/project-eligibility";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { useCourse } from "~/hooks/api/course/use-course";
import { useCourseModules } from "~/hooks/api/course/use-course-module";
import { AndamioButton } from "~/components/andamio/andamio-button";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getString(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Contributor lifecycle status.
 *
 * Uses project terminology (not course):
 * - "not_joined" (not "not_enrolled")
 * - "active" (not "enrolled")
 */
type ContributorStatus =
  | "not_joined"
  | "active"
  | "task_pending"
  | "task_accepted"
  | "can_claim";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HOW_IT_WORKS_DISMISSED_KEY = "andamio_contributor_how_it_works_dismissed";

// ---------------------------------------------------------------------------
// Dismissable "How It Works"
// ---------------------------------------------------------------------------

function HowItWorksCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <AndamioCardTitle>How It Works</AndamioCardTitle>
          <AndamioRemoveButton onClick={onDismiss} ariaLabel="Dismiss guide" />
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
          <div>
            <AndamioText className="font-medium">Commit to a Task</AndamioText>
            <AndamioText variant="small">
              Select a task, describe your approach, and commit on-chain.
              This automatically adds you as a project contributor.
            </AndamioText>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
          <div>
            <AndamioText className="font-medium">Complete the Work</AndamioText>
            <AndamioText variant="small">
              Work on your task and update your evidence as needed while
              awaiting review.
            </AndamioText>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
          <div>
            <AndamioText className="font-medium">Get Reviewed</AndamioText>
            <AndamioText variant="small">
              A project manager reviews your commitment. If refused, you can
              resubmit from the task page.
            </AndamioText>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">4</div>
          <div>
            <AndamioText className="font-medium">Earn Rewards</AndamioText>
            <AndamioText variant="small">
              When accepted, commit to another task (which auto-collects your
              reward) or leave the project to claim your credential and rewards
              together.
            </AndamioText>
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}

// ---------------------------------------------------------------------------
// Missing prerequisite row (unchanged)
// ---------------------------------------------------------------------------

function MissingPrerequisiteRow({ prereq }: { prereq: MissingPrerequisite }) {
  const { data: courseData } = useCourse(prereq.courseId);
  const { data: modules = [] } = useCourseModules(prereq.courseId);
  const courseTitle = courseData?.title;

  const moduleMap = new Map(
    modules.map((m) => [m.sltHash, { moduleCode: m.moduleCode, title: m.title }]),
  );

  const getModuleLabel = (hash: string) => {
    const mod = moduleMap.get(hash);
    if (mod?.moduleCode && mod?.title) return `${mod.moduleCode}: ${mod.title}`;
    if (mod?.moduleCode) return mod.moduleCode;
    return `${hash.slice(0, 12)}...`;
  };

  return (
    <div className="p-3 rounded-lg bg-muted/30 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CourseIcon className="h-4 w-4 text-muted-foreground" />
          <AndamioText className="text-sm font-medium">
            {courseTitle ?? `${prereq.courseId.slice(0, 16)}...`}
          </AndamioText>
        </div>
        <AndamioBadge variant="outline">
          {prereq.completedModules.length}/{prereq.requiredModules.length} completed
        </AndamioBadge>
      </div>

      <div className="flex flex-wrap gap-2">
        {prereq.missingModules.map((moduleHash) => (
          <AndamioBadge key={moduleHash} variant="secondary" className="text-xs">
            <PendingIcon className="h-3 w-3 mr-1" />
            {getModuleLabel(moduleHash)}
          </AndamioBadge>
        ))}
        {prereq.completedModules.map((moduleHash) => (
          <AndamioBadge key={moduleHash} variant="default" className="text-xs bg-primary text-primary-foreground">
            <SuccessIcon className="h-3 w-3 mr-1" />
            {getModuleLabel(moduleHash)}
          </AndamioBadge>
        ))}
      </div>

      <Link href={`/course/${prereq.courseId}`}>
        <AndamioButton variant="outline" size="sm" className="mt-2">
          <CourseIcon className="h-4 w-4 mr-2" />
          Go to Course
        </AndamioButton>
      </Link>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main dashboard content
// ---------------------------------------------------------------------------

function ContributorDashboardContent() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { user } = useAndamioAuth();
  const queryClient = useQueryClient();

  // ---- Data hooks ----
  const {
    data: projectDetail,
    isLoading: isProjectLoading,
    error: projectError,
  } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId ?? null;
  const { data: tasks = [], isLoading: isTasksLoading } = useProjectTasks(projectId);
  const { data: myCommitments = [], isLoading: isCommitmentsLoading } =
    useContributorCommitments(projectId);

  // ---- UI state ----
  const [statusOverride, setStatusOverride] = useState<ContributorStatus | null>(null);
  const [orchestrationTrigger, setOrchestrationTrigger] = useState(0);

  // How It Works — default to hidden to avoid flash, then check localStorage
  const [howItWorksDismissed, setHowItWorksDismissed] = useState(true);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHowItWorksDismissed(
        localStorage.getItem(HOW_IT_WORKS_DISMISSED_KEY) === "true",
      );
    }
  }, []);

  // ---- Prerequisites ----
  const prereqCourseIds = useMemo(() => {
    if (!projectDetail?.prerequisites) return [];
    return projectDetail.prerequisites
      .map((p) => p.courseId)
      .filter((id): id is string => !!id);
  }, [projectDetail?.prerequisites]);

  const { completions } = useStudentCompletionsForPrereqs(prereqCourseIds);

  const eligibility = useMemo(() => {
    if (!projectDetail) return null;
    return checkProjectEligibility(projectDetail.prerequisites ?? [], completions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDetail?.prerequisites, completions]);

  // ---- Status derivation (from authenticated contributor commitments) ----
  const pendingCommitment = useMemo(
    () => myCommitments.find((c) => c.commitmentStatus === "SUBMITTED" || c.commitmentStatus === "COMMITTED"),
    [myCommitments],
  );

  const acceptedCommitments = useMemo(
    () => myCommitments.filter((c) => c.commitmentStatus === "ACCEPTED"),
    [myCommitments],
  );

  const myCredentials = useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !projectDetail?.credentialClaims) return [];
    return projectDetail.credentialClaims.filter((c) => c.alias === alias);
  }, [user?.accessTokenAlias, projectDetail?.credentialClaims]);

  const isContributor = useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !projectDetail?.contributors) return false;
    return projectDetail.contributors.some((c) => c.alias === alias);
  }, [user?.accessTokenAlias, projectDetail?.contributors]);

  const derivedStatus: ContributorStatus = useMemo(() => {
    if (isProjectLoading || isTasksLoading || isCommitmentsLoading || !projectDetail || !user?.accessTokenAlias) {
      return "not_joined";
    }
    if (acceptedCommitments.length > 0) return "task_accepted";
    if (pendingCommitment) return "task_pending";
    if (myCredentials.length > 0) return "can_claim";
    if (isContributor) return "active";
    return "not_joined";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isProjectLoading,
    isTasksLoading,
    isCommitmentsLoading,
    projectDetail,
    user?.accessTokenAlias,
    pendingCommitment,
    acceptedCommitments.length,
    myCredentials.length,
    isContributor,
    orchestrationTrigger,
  ]);

  const contributorStatus = statusOverride ?? derivedStatus;

  // Clear override when derived status catches up
  useEffect(() => {
    if (statusOverride !== null && derivedStatus === statusOverride) {
      setStatusOverride(null);
    }
  }, [derivedStatus, statusOverride]);

  // ---- Refresh ----
  const refreshData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
      queryClient.invalidateQueries({ queryKey: projectContributorKeys.commitments(projectId) }),
    ]);
    setOrchestrationTrigger((prev) => prev + 1);
  }, [queryClient, projectId]);

  // ---- Dismiss How It Works ----
  const dismissHowItWorks = () => {
    setHowItWorksDismissed(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(HOW_IT_WORKS_DISMISSED_KEY, "true");
    }
  };

  // ---- Loading / Error ----
  if (isProjectLoading || isTasksLoading || isCommitmentsLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  const errorMessage =
    projectError instanceof Error
      ? projectError.message
      : projectError
        ? "Failed to load project"
        : null;

  if (errorMessage || !projectDetail) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={errorMessage ?? "Project not found"} />
      </div>
    );
  }

  // ---- Derived data ----
  const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");

  // Accepted tasks info (for task_accepted state — may be multiple)
  const acceptedTasks = acceptedCommitments.map((c) => {
    const task = tasks.find((t) => getString(t.taskHash) === c.taskHash);
    return {
      taskHash: c.taskHash,
      title: task?.title ?? "Task",
      reward: task?.lovelaceAmount ?? "0",
    };
  });

  // Total earned reward across all accepted commitments
  const totalEarnedLovelace = acceptedTasks.reduce(
    (sum, t) => sum + (parseInt(t.reward, 10) || 0),
    0,
  );

  // Pending task info (for task_pending state)
  const pendingTaskHash = pendingCommitment?.taskHash;
  const pendingTask = pendingTaskHash
    ? tasks.find((t) => getString(t.taskHash) === pendingTaskHash)
    : undefined;

  // Exclude tasks the current user has pending or accepted commitments for
  const myCommitmentHashes = new Set(
    myCommitments.map((c) => c.taskHash),
  );

  // Tasks with at least one accepted assessment (from ANY contributor) are
  // treated as filled. Currently each task supports one approved commit;
  // the N-commits feature will make this configurable (see GH backlog).
  const filledTaskHashes = new Set(
    (projectDetail.assessments ?? [])
      .filter((a) => a.decision === "accept")
      .map((a) => a.taskHash),
  );

  // Available tasks: exclude filled tasks and user's own commitments
  const excludedHashes = new Set<string>([
    ...filledTaskHashes,
    ...myCommitmentHashes,
  ]);

  const availableTasks = liveTasks.filter(
    (t) => !excludedHashes.has(getString(t.taskHash)),
  );

  // Stats — show contributor-relevant numbers, not raw project totals
  const stats = {
    availableTasks: availableTasks.length,
    earnedRewards: totalEarnedLovelace,
  };

  const completedTaskCount = myCommitments.filter((c) => c.commitmentStatus === "ACCEPTED").length;
  const pendingTaskCount = pendingCommitment ? 1 : 0;
  const credentialCount = myCredentials.length;

  // Status display label
  const statusLabel =
    !eligibility?.eligible
      ? "Prerequisites Required"
      : contributorStatus === "not_joined"
        ? "Ready to Join"
        : contributorStatus === "active"
          ? "Active Contributor"
          : contributorStatus === "task_pending"
            ? "Task Pending"
            : contributorStatus === "task_accepted"
              ? "Task Accepted"
              : "Can Claim";

  // ---- Render ----
  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Contributor Dashboard"
        description={projectDetail.title || undefined}
      />

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <AndamioDashboardStat
          icon={ContributorIcon}
          label="Your Status"
          value={statusLabel}
          valueColor={
            !eligibility?.eligible
              ? "warning"
              : contributorStatus === "can_claim" || contributorStatus === "task_accepted"
                ? "success"
                : undefined
          }
          iconColor={
            !eligibility?.eligible
              ? "warning"
              : contributorStatus === "can_claim" || contributorStatus === "task_accepted"
                ? "success"
                : undefined
          }
        />
        <AndamioDashboardStat
          icon={TaskIcon}
          label="Available Tasks"
          value={stats.availableTasks}
        />
        <AndamioDashboardStat
          icon={CredentialIcon}
          label={stats.earnedRewards > 0 ? "Earned Rewards" : "Available Rewards"}
          value={formatLovelace(
            stats.earnedRewards > 0
              ? stats.earnedRewards.toString()
              : availableTasks
                  .reduce((sum, t) => sum + (parseInt(t.lovelaceAmount ?? "0", 10) || 0), 0)
                  .toString(),
          )}
          valueColor="success"
          iconColor="success"
        />
      </div>

      {/* ================================================================ */}
      {/* Contribution Progress — always visible for contributors           */}
      {/* ================================================================ */}

      {isContributor && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2">
              <ContributorIcon className="h-5 w-5" />
              Your Contribution Progress
            </AndamioCardTitle>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <AndamioText className="text-2xl font-bold">{completedTaskCount}</AndamioText>
                <AndamioText variant="small">Tasks Completed</AndamioText>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <AndamioText className="text-2xl font-bold text-muted-foreground">
                  {pendingTaskCount}
                </AndamioText>
                <AndamioText variant="small">Pending Review</AndamioText>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <AndamioText className="text-2xl font-bold text-primary">
                  {credentialCount}
                </AndamioText>
                <AndamioText variant="small">Credentials Earned</AndamioText>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* ================================================================ */}
      {/* PRIMARY ACTION — depends on contributor status                    */}
      {/* ================================================================ */}

      {/* --- Task Accepted: Reward claim is the priority --- */}
      {eligibility?.eligible && contributorStatus === "task_accepted" && (
        <div className="space-y-4">
          {/* Acceptance Banner — lists ALL accepted tasks */}
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <SuccessIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                {acceptedTasks.length === 1 ? (
                  <AndamioText className="font-medium text-primary">
                    {acceptedTasks[0]?.title} was accepted!
                  </AndamioText>
                ) : (
                  <AndamioText className="font-medium text-primary">
                    {acceptedTasks.length} tasks accepted!
                  </AndamioText>
                )}
                {acceptedTasks.length > 1 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {acceptedTasks.map((t) => (
                      <AndamioBadge key={t.taskHash} variant="outline" className="text-xs">
                        {t.title} — {formatLovelace(t.reward)}
                      </AndamioBadge>
                    ))}
                  </div>
                )}
                <AndamioText variant="small" className="mt-1">
                  You earned {formatLovelace(totalEarnedLovelace.toString())}. You have two ways to collect your rewards:
                </AndamioText>
              </div>
            </div>
          </div>

          {/* Decision Cards */}
          {availableTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Commit to another task */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TaskIcon className="h-5 w-5 text-primary" />
                  <AndamioText className="font-medium">Commit to Another Task</AndamioText>
                </div>
                <AndamioText variant="small">
                  When you commit to a new task, your{" "}
                  {formatLovelace(totalEarnedLovelace.toString())} reward is
                  automatically sent to your wallet as part of the commitment
                  transaction. You stay in the project and keep contributing.
                </AndamioText>
                <AndamioBadge variant="outline" className="text-xs">
                  Rewards collected automatically
                </AndamioBadge>
              </div>

              {/* Option B: Leave & Claim */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CredentialIcon className="h-5 w-5 text-primary" />
                  <AndamioText className="font-medium">Leave &amp; Claim Everything</AndamioText>
                </div>
                <AndamioText variant="small">
                  Exit the project to collect your{" "}
                  {formatLovelace(totalEarnedLovelace.toString())} reward and mint
                  your on-chain credential in a single transaction. You can
                  rejoin the project later.
                </AndamioText>
                <ProjectCredentialClaim
                  projectNftPolicyId={projectId}
                  contributorStateId={contributorStateId ?? "0".repeat(56)}
                  projectTitle={projectDetail.title || undefined}
                  pendingRewardLovelace={totalEarnedLovelace.toString()}
                  onSuccess={async () => {
                    await refreshData();
                  }}
                />
              </div>
            </div>
          ) : (
            /* No more tasks — leave is the only option */
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CredentialIcon className="h-5 w-5 text-primary" />
                <AndamioText className="font-medium">Claim Your Rewards &amp; Credential</AndamioText>
              </div>
              <AndamioText variant="small">
                No more tasks are available in this project. Leave the project to
                collect your {formatLovelace(totalEarnedLovelace.toString())} reward
                and mint your on-chain credential. You can rejoin the project later
                if new tasks are added.
              </AndamioText>
              <ProjectCredentialClaim
                projectNftPolicyId={projectId}
                contributorStateId={contributorStateId ?? "0".repeat(56)}
                projectTitle={projectDetail.title || undefined}
                pendingRewardLovelace={totalEarnedLovelace.toString()}
                onSuccess={async () => {
                  await refreshData();
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* --- Task Pending: compact status card --- */}
      {contributorStatus === "task_pending" && pendingCommitment && (
        <AndamioCard className="border-secondary">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-secondary">
              <PendingIcon className="h-5 w-5" />
              Task Pending Review
            </AndamioCardTitle>
            <AndamioCardDescription>
              Your submission is awaiting manager review.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {/* Task info */}
            {pendingTask && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <AndamioText className="font-medium">{pendingTask.title}</AndamioText>
                  {getString(pendingTask.description) && (
                    <AndamioText variant="small" className="text-muted-foreground">
                      {getString(pendingTask.description)}
                    </AndamioText>
                  )}
                </div>
                <AndamioBadge variant="outline">
                  {formatLovelace(pendingTask.lovelaceAmount ?? "0")}
                </AndamioBadge>
              </div>
            )}

            {/* Link to task detail */}
            <Link href={`/project/${projectId}/${pendingCommitment.taskHash}`}>
              <AndamioButton variant="outline" className="cursor-pointer">
                <TaskIcon className="h-4 w-4 mr-2" />
                View Task Details
              </AndamioButton>
            </Link>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* --- Can Claim: credential claim --- */}
      {eligibility?.eligible && contributorStatus === "can_claim" && (
        <ProjectCredentialClaim
          projectNftPolicyId={projectId}
          contributorStateId={contributorStateId ?? "0".repeat(56)}
          projectTitle={projectDetail.title || undefined}
          onSuccess={async () => {
            await refreshData();
          }}
        />
      )}

      {/* ================================================================ */}
      {/* Prerequisites                                                     */}
      {/* ================================================================ */}

      {eligibility && !eligibility.eligible && (
        <AndamioCard className="border-muted-foreground">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-muted-foreground">
              <AlertIcon className="h-5 w-5" />
              Prerequisites Required
            </AndamioCardTitle>
            <AndamioCardDescription>
              Complete the following course modules before contributing to this project
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {/* Progress bar */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-muted transition-all"
                  style={{
                    width: `${eligibility.totalRequired > 0 ? (eligibility.totalCompleted / eligibility.totalRequired) * 100 : 0}%`,
                  }}
                />
              </div>
              <AndamioText variant="small" className="font-medium">
                {eligibility.totalCompleted}/{eligibility.totalRequired} modules
              </AndamioText>
            </div>

            <div className="space-y-3">
              {eligibility.missingPrerequisites.map((prereq) => (
                <MissingPrerequisiteRow key={prereq.courseId} prereq={prereq} />
              ))}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Eligibility met banner (for first-time visitors who just qualified) */}
      {eligibility?.eligible && contributorStatus === "not_joined" && (
        <AndamioCard className="border-primary">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-primary">
              <SuccessIcon className="h-5 w-5" />
              Prerequisites Met
            </AndamioCardTitle>
            <AndamioCardDescription>
              You&apos;ve completed all required prerequisites.
              Select a task below to get started!
            </AndamioCardDescription>
          </AndamioCardHeader>
        </AndamioCard>
      )}

      {/* ================================================================ */}
      {/* Completed Tasks                                                   */}
      {/* ================================================================ */}

      {acceptedTasks.length > 0 && contributorStatus !== "task_accepted" && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2">
              <SuccessIcon className="h-5 w-5 text-primary" />
              Completed Tasks
            </AndamioCardTitle>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-2">
            {acceptedTasks.map((task) => (
              <Link key={task.taskHash} href={`/project/${projectId}/${task.taskHash}`}>
                <div className="p-3 border rounded-lg flex items-center justify-between hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-2">
                    <SuccessIcon className="h-4 w-4 text-primary shrink-0" />
                    <AndamioText className="font-medium">{task.title}</AndamioText>
                  </div>
                  <AndamioBadge variant="outline">{formatLovelace(task.reward)}</AndamioBadge>
                </div>
              </Link>
            ))}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* ================================================================ */}
      {/* Available Tasks — links to task detail pages                      */}
      {/* ================================================================ */}

      {eligibility?.eligible && availableTasks.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2">
              <TaskIcon className="h-5 w-5" />
              Available Tasks
            </AndamioCardTitle>
            <AndamioCardDescription>
              {contributorStatus === "task_accepted"
                ? "Committing to a new task will also collect your pending reward"
                : "Select a task to view details and commit"}
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-2">
            {availableTasks.map((task, idx) => {
              const hash = getString(task.taskHash);
              return (
                <Link
                  key={`task-${idx}`}
                  href={`/project/${projectId}/${hash}`}
                >
                  <div className="p-4 border rounded-lg hover:border-primary transition-colors cursor-pointer flex items-center justify-between">
                    <div className="min-w-0 flex-1 mr-4">
                      <AndamioText className="font-medium">{task.title}</AndamioText>
                      {getString(task.description) && (
                        <AndamioText variant="small" className="text-muted-foreground truncate">
                          {getString(task.description)}
                        </AndamioText>
                      )}
                    </div>
                    <AndamioBadge variant="outline" className="shrink-0">
                      {formatLovelace(task.lovelaceAmount ?? "0")}
                    </AndamioBadge>
                  </div>
                </Link>
              );
            })}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* No tasks available */}
      {eligibility?.eligible && availableTasks.length === 0 && liveTasks.length > 0 && contributorStatus !== "task_accepted" && (
        <AndamioEmptyState
          icon={SuccessIcon}
          title="All Tasks Completed"
          description="You've completed all available tasks. Leave the project to claim your credential and rewards."
        />
      )}
      {liveTasks.length === 0 && (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No Tasks Available"
          description="This project doesn't have any active tasks right now. Check back later."
        />
      )}

      {/* Tasks exist but prerequisites not met */}
      {liveTasks.length > 0 && eligibility && !eligibility.eligible && (
        <AndamioEmptyState
          icon={AlertIcon}
          title="Complete Prerequisites First"
          description="Complete the required course modules above to unlock these tasks."
        />
      )}

      {/* ================================================================ */}
      {/* How It Works — dismissable, at bottom                            */}
      {/* ================================================================ */}

      {!howItWorksDismissed && <HowItWorksCard onDismiss={dismissHowItWorks} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page export
// ---------------------------------------------------------------------------

export default function ContributorDashboardPage() {
  return (
    <RequireAuth
      title="Contributor Dashboard"
      description="Connect your wallet to participate in this project"
    >
      <ContributorDashboardContent />
    </RequireAuth>
  );
}
