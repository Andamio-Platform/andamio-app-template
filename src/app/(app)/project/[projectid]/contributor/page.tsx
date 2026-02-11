"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useContributorCommitment, type ContributorCommitment } from "~/hooks/api/project/use-project-contributor";
import { RequireAuth } from "~/components/auth/require-auth";
import {
  AndamioBadge,
  AndamioButton,
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
import { useProject, useProjectTasks, projectKeys, type Task, type ProjectSubmission } from "~/hooks/api/project/use-project";
import { useQueryClient } from "@tanstack/react-query";
import { TaskCommit, ProjectCredentialClaim, TaskAction } from "~/components/tx";
import { formatLovelace } from "~/lib/cardano-utils";
import { checkProjectEligibility, type EligibilityResult, type MissingPrerequisite } from "~/lib/project-eligibility";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { useCourse } from "~/hooks/api/course/use-course";
import { useCourseModules } from "~/hooks/api/course/use-course-module";
import { computeTaskHash, type TaskData } from "@andamio/core/hashing";
import { ContentEditor, ContentViewer } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";
import { EditIcon, OnChainIcon, RefreshIcon } from "~/components/icons";
import { toast } from "sonner";

// Helper to extract string from NullableString (API returns object type for nullable strings)
function getString(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

// Contributor status derived from hook data
type ContributorStatus = "not_enrolled" | "enrolled" | "task_pending" | "task_accepted" | "can_claim";

/**
 * Contributor Dashboard Page
 *
 * A dedicated view for contributors to manage their project participation:
 * - Enroll in project (if not enrolled)
 * - View current task status
 * - Commit to new tasks
 * - Claim credentials
 *
 * All data sourced from useProject() merged hook — no direct Andamioscan calls.
 */

/**
 * Renders a single missing prerequisite with resolved course title and module names.
 */
function MissingPrerequisiteRow({ prereq }: { prereq: MissingPrerequisite }) {
  const { data: courseData } = useCourse(prereq.courseId);
  const { data: modules = [] } = useCourseModules(prereq.courseId);
  const courseTitle = courseData?.title;

  const moduleMap = new Map(
    modules.map((m) => [m.sltHash, { moduleCode: m.moduleCode, title: m.title }])
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

function ContributorDashboardContent() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { user } = useAndamioAuth();
  const queryClient = useQueryClient();

  // React Query hooks — single source of truth
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStateId = projectDetail?.contributorStateId ?? null;
  const { data: tasks = [], isLoading: isTasksLoading } = useProjectTasks(
    contributorStateId ?? undefined
  );

  // Status override: callbacks set this optimistically, cleared when derived status catches up
  const [statusOverride, setStatusOverride] = useState<ContributorStatus | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // DB commitment record for the current task (fetched reactively via hook)
  const [dbCommitment, setDbCommitment] = useState<ContributorCommitment | null>(null);

  // Task hash to look up commitment for (set by orchestration, triggers hook fetch)
  const [lookupTaskHash, setLookupTaskHash] = useState<string | null>(null);

  // Reactive commitment fetch via hook
  const {
    data: commitmentData,
    isLoading: isCommitmentLoading,
  } = useContributorCommitment(projectId, lookupTaskHash ?? undefined);

  // Last submitted task action tx hash
  const [pendingActionTxHash, setPendingActionTxHash] = useState<string | null>(null);

  // Prerequisite completions from course hooks
  const prereqCourseIds = useMemo(() => {
    if (!projectDetail?.prerequisites) return [];
    return projectDetail.prerequisites
      .map((p) => p.courseId)
      .filter((id): id is string => !!id);
  }, [projectDetail?.prerequisites]);

  const { completions } = useStudentCompletionsForPrereqs(prereqCourseIds);

  // Task evidence from editor
  const [taskEvidence, setTaskEvidence] = useState<JSONContent | null>(null);

  /**
   * Compute task hash from DB task data.
   */
  const computeTaskHashFromDb = (dbTask: Task): string => {
    const taskData: TaskData = {
      project_content: dbTask.title ?? "",
      expiration_time: parseInt(dbTask.expirationTime ?? "0") || 0,
      lovelace_amount: parseInt(dbTask.lovelaceAmount ?? "0") || 0,
      native_assets: [],
    };
    return computeTaskHash(taskData);
  };

  /**
   * Get the on-chain task_id for a selected task.
   */
  const getOnChainTaskId = (dbTask: Task | null): string => {
    if (!dbTask) return "";
    const taskHash = getString(dbTask.taskHash);
    if (taskHash.length === 64) return taskHash;
    return computeTaskHashFromDb(dbTask);
  };

  // Check if evidence is valid (has actual content)
  const hasValidEvidence = taskEvidence?.content &&
    Array.isArray(taskEvidence.content) &&
    taskEvidence.content.length > 0 &&
    !(taskEvidence.content.length === 1 &&
      taskEvidence.content[0]?.type === "paragraph" &&
      (!taskEvidence.content[0]?.content || taskEvidence.content[0]?.content.length === 0));

  // Orchestration trigger - increment to re-run status derivation
  const [orchestrationTrigger, setOrchestrationTrigger] = useState(0);

  // Refresh all data: invalidate React Query caches + re-run orchestration
  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    if (contributorStateId) {
      await queryClient.invalidateQueries({ queryKey: projectKeys.tasks(contributorStateId) });
    }
    setOrchestrationTrigger((prev) => prev + 1);
  }, [queryClient, projectId, contributorStateId]);

  // Auto-select first live task when tasks load
  useEffect(() => {
    if (tasks.length > 0 && !selectedTask) {
      const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");
      if (liveTasks.length > 0) {
        setSelectedTask(liveTasks[0] ?? null);
      }
    }
  }, [tasks, selectedTask]);

  // Derive contributor status from hook data
  // Replaces the old Andamioscan orchestration effect
  const mySubmission: ProjectSubmission | undefined = useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !projectDetail?.submissions) return undefined;
    return projectDetail.submissions.find((s) => s.submittedBy === alias);
  }, [user?.accessTokenAlias, projectDetail?.submissions]);

  const myAssessments = useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !projectDetail?.assessments) return [];
    // Assessments where the contributor's task was assessed
    return projectDetail.assessments.filter(
      (a) => a.assessedBy !== alias
    );
  }, [user?.accessTokenAlias, projectDetail?.assessments]);

  const myCredentials = useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !projectDetail?.credentialClaims) return [];
    return projectDetail.credentialClaims.filter((c) => c.alias === alias);
  }, [user?.accessTokenAlias, projectDetail?.credentialClaims]);

  const isEnrolled = useMemo(() => {
    const alias = user?.accessTokenAlias;
    if (!alias || !projectDetail?.contributors) return false;
    return projectDetail.contributors.some((c) => c.alias === alias);
  }, [user?.accessTokenAlias, projectDetail?.contributors]);

  // Derive contributor status synchronously from hook data
  const derivedStatus: ContributorStatus = useMemo(() => {
    if (isProjectLoading || isTasksLoading || !projectDetail || !user?.accessTokenAlias) {
      return "not_enrolled";
    }
    if (mySubmission) return "task_pending";
    if (myCredentials.length > 0) return "can_claim";
    if (myAssessments.some(a => a.decision === "accept")) return "task_accepted";
    if (isEnrolled) return "enrolled";
    return "not_enrolled";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProjectLoading, isTasksLoading, projectDetail, user?.accessTokenAlias, mySubmission, myCredentials.length, myAssessments.length, isEnrolled, orchestrationTrigger]);

  // Use override if set, otherwise use derived status
  const contributorStatus = statusOverride ?? derivedStatus;

  // Clear override when derived status catches up
  useEffect(() => {
    if (statusOverride !== null && derivedStatus === statusOverride) {
      setStatusOverride(null);
    }
  }, [derivedStatus, statusOverride]);

  // Set lookupTaskHash when status is task_pending
  useEffect(() => {
    if (derivedStatus === "task_pending" && mySubmission) {
      setLookupTaskHash(mySubmission.taskHash);
    }
  }, [derivedStatus, mySubmission]);

  // Derive eligibility synchronously — used directly, no state needed
  const eligibility: EligibilityResult | null = useMemo(() => {
    if (!projectDetail) return null;
    const prerequisites = projectDetail.prerequisites ?? [];
    return checkProjectEligibility(prerequisites, completions);
    // Stabilize: only recompute when the underlying data identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDetail?.prerequisites, completions]);

  // Commitment processing effect: reacts to hook data when lookupTaskHash triggers a fetch
  useEffect(() => {
    if (isCommitmentLoading || commitmentData === undefined) return;

    if (commitmentData) {
      setDbCommitment(commitmentData);

      // Check if DB says task is actually ACCEPTED
      if (commitmentData.commitmentStatus === "ACCEPTED") {
        setStatusOverride("task_accepted");
        setTaskEvidence(null);

        const acceptedTaskHash = commitmentData.taskHash;
        const availableTasks = tasks.filter(
          (t) => t.taskStatus === "ON_CHAIN" && getString(t.taskHash) !== acceptedTaskHash,
        );
        if (availableTasks.length > 0) {
          setSelectedTask(availableTasks[0] ?? null);
        }
      } else {
        // If commitment is PENDING_TX_SUBMIT, populate pendingActionTxHash
        if (commitmentData.commitmentStatus === "PENDING_TX_SUBMIT" && commitmentData.pendingTxHash) {
          setPendingActionTxHash(commitmentData.pendingTxHash);
        }

        // Pre-populate evidence editor with saved evidence
        if (commitmentData.evidence) {
          setTaskEvidence(commitmentData.evidence as JSONContent);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitmentData, isCommitmentLoading]);

  // Loading state
  if (isProjectLoading || isTasksLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  const errorMessage = projectError instanceof Error ? projectError.message : projectError ? "Failed to load project" : null;
  if (errorMessage || !projectDetail) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={errorMessage ?? "Project not found"} />
      </div>
    );
  }

  const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");

  // Stats
  const stats = {
    totalTasks: liveTasks.length,
    totalRewards: liveTasks.reduce((sum, t) => sum + (parseInt(t.lovelaceAmount ?? "0", 10) || 0), 0),
  };

  // Contributor progress derived from hook data
  const completedTaskCount = myAssessments.filter(a => a.decision === "accept").length;
  const pendingTaskCount = mySubmission ? 1 : 0;
  const credentialCount = myCredentials.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Contributor Dashboard"
        description={projectDetail.title || undefined}
      />

      {/* Project Info */}
      <div className="flex flex-wrap items-center gap-2">
        <AndamioBadge variant="outline">
          <span className="font-mono text-xs">{projectId.slice(0, 16)}...</span>
        </AndamioBadge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AndamioDashboardStat
          icon={ContributorIcon}
          label="Your Status"
          value={
            !eligibility?.eligible ? "Prerequisites Required" :
            contributorStatus === "not_enrolled" ? "Ready to Join" :
            contributorStatus === "enrolled" ? "Active Contributor" :
            contributorStatus === "task_pending" ? "Task Pending" :
            contributorStatus === "task_accepted" ? "Task Accepted" : "Can Claim"
          }
          valueColor={!eligibility?.eligible ? "warning" : contributorStatus === "can_claim" ? "success" : undefined}
          iconColor={!eligibility?.eligible ? "warning" : contributorStatus === "can_claim" ? "success" : undefined}
        />
        <AndamioDashboardStat icon={TaskIcon} label="Available Tasks" value={stats.totalTasks} />
        <AndamioDashboardStat
          icon={CredentialIcon}
          label="Total Rewards"
          value={formatLovelace(stats.totalRewards.toString())}
          valueColor="success"
          iconColor="success"
        />
      </div>

      {/* Prerequisites Check - Show if user doesn't meet requirements */}
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
            {/* Progress Summary */}
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

            {/* Missing Prerequisites List */}
            <div className="space-y-3">
              {eligibility.missingPrerequisites.map((prereq) => (
                <MissingPrerequisiteRow key={prereq.courseId} prereq={prereq} />
              ))}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Eligibility Met - Show success message if user just became eligible */}
      {eligibility?.eligible && contributorStatus === "not_enrolled" && (
        <AndamioCard className="border-primary">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-primary">
              <SuccessIcon className="h-5 w-5" />
              Prerequisites Met
            </AndamioCardTitle>
            <AndamioCardDescription>
              You&apos;ve completed all required prerequisites. Select a task below to get started!
            </AndamioCardDescription>
          </AndamioCardHeader>
        </AndamioCard>
      )}

      {/* Contributor Progress */}
      {isEnrolled && (
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
                <AndamioText className="text-2xl font-bold text-muted-foreground">{pendingTaskCount}</AndamioText>
                <AndamioText variant="small">Pending Review</AndamioText>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <AndamioText className="text-2xl font-bold text-primary">{credentialCount}</AndamioText>
                <AndamioText variant="small">Credentials Earned</AndamioText>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Pending Task Status */}
      {contributorStatus === "task_pending" && mySubmission && (() => {
        const taskId = mySubmission.taskHash;
        const txHash = mySubmission.submissionTx;

        // Match submission to DB task
        const matchedDbTask = tasks.find(t =>
          getString(t.taskHash) === taskId
        );
        const taskLovelace = matchedDbTask ? parseInt(matchedDbTask.lovelaceAmount ?? "0") : 0;

        return (
        <AndamioCard className={dbCommitment?.commitmentStatus === "REFUSED" ? "border-destructive" : "border-secondary"}>
          <AndamioCardHeader>
            <AndamioCardTitle className={`flex items-center gap-2 ${dbCommitment?.commitmentStatus === "REFUSED" ? "text-destructive" : "text-secondary"}`}>
              {dbCommitment?.commitmentStatus === "REFUSED" ? (
                <><AlertIcon className="h-5 w-5" />Resubmission Needed</>
              ) : (
                <><PendingIcon className="h-5 w-5" />Task Pending Review</>
              )}
            </AndamioCardTitle>
            <AndamioCardDescription>
              {dbCommitment?.commitmentStatus === "REFUSED"
                ? "Your work was not accepted. Update your evidence and resubmit."
                : dbCommitment?.commitmentStatus === "COMMITTED"
                  ? "You've joined this task. Your manager may review at any time — submit evidence when ready."
                  : dbCommitment?.commitmentStatus === "SUBMITTED"
                    ? "Evidence submitted. Waiting for manager review."
                    : "Your submission is awaiting manager review. You can update your evidence below."}
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {/* Task Info from DB (if matched) */}
            {matchedDbTask && (
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <TaskIcon className="h-4 w-4 text-primary" />
                  <AndamioText className="font-medium">{matchedDbTask.title}</AndamioText>
                  <AndamioBadge variant="outline">{formatLovelace(matchedDbTask.lovelaceAmount ?? "0")}</AndamioBadge>
                </div>
                {getString(matchedDbTask.description) && (
                  <AndamioText variant="small" className="text-muted-foreground">
                    {getString(matchedDbTask.description)}
                  </AndamioText>
                )}
              </div>
            )}

            <div className="grid gap-2 text-sm p-4 rounded-lg bg-muted/30">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Hash:</span>
                <span className="font-mono text-xs">{taskId.slice(0, 16)}...{taskId.slice(-8)}</span>
              </div>
              {txHash && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tx Hash:</span>
                  <a
                    href={`https://preprod.cardanoscan.io/transaction/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {txHash.slice(0, 16)}...{txHash.slice(-8)}
                  </a>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reward:</span>
                <span>{formatLovelace(taskLovelace.toString())}</span>
              </div>
            </div>

            {/* Evidence Section - Read-only when PENDING_TX_SUBMIT, editable otherwise */}
            {dbCommitment?.commitmentStatus === "PENDING_TX_SUBMIT" ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <PendingIcon className="h-4 w-4 text-muted-foreground" />
                  <AndamioText className="font-medium">Submitted Evidence</AndamioText>
                  <AndamioBadge variant="outline" className="text-xs">Awaiting Confirmation</AndamioBadge>
                </div>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your evidence has been submitted. Waiting for blockchain confirmation before you can make additional updates.
                </AndamioText>
                <div className="min-h-[150px] border rounded-lg bg-muted/20 p-4">
                  {(dbCommitment.evidence ?? taskEvidence) ? (
                    <ContentViewer content={dbCommitment.evidence ?? taskEvidence} />
                  ) : (
                    <AndamioText variant="small" className="text-muted-foreground italic">
                      No evidence recorded
                    </AndamioText>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <EditIcon className="h-4 w-4 text-muted-foreground" />
                    <AndamioText className="font-medium">
                      {dbCommitment?.commitmentStatus === "REFUSED" ? "Resubmit Your Evidence" : "Update Your Evidence"}
                    </AndamioText>
                  </div>
                  <AndamioText variant="small" className="text-muted-foreground">
                    {dbCommitment?.commitmentStatus === "REFUSED"
                      ? "Your previous submission was not accepted. Revise your evidence and resubmit."
                      : "Add or update your evidence before the manager reviews your submission. The evidence hash will be recorded on-chain."}
                  </AndamioText>
                  <div className="min-h-[200px] border rounded-lg">
                    <ContentEditor
                      content={taskEvidence}
                      onContentChange={(content) => {
                        setTaskEvidence(content);
                      }}
                    />
                  </div>
                  {!hasValidEvidence && (
                    <AndamioText variant="small" className="text-muted-foreground">
                      Please provide evidence describing your work on this task.
                    </AndamioText>
                  )}
                  {hasValidEvidence && (
                    <AndamioText variant="small" className="text-primary flex items-center gap-1">
                      <SuccessIcon className="h-4 w-4" />
                      Evidence ready for submission
                    </AndamioText>
                  )}
                </div>

                <TaskAction
                  projectNftPolicyId={projectId}
                  contributorStateId={contributorStateId ?? "0".repeat(56)}
                  taskHash={taskId}
                  taskCode={matchedDbTask ? `TASK_${matchedDbTask.index}` : "TASK"}
                  taskTitle={matchedDbTask?.title ?? undefined}
                  taskEvidence={taskEvidence ?? undefined}
                  onSuccess={async (result) => {
                    setPendingActionTxHash(result.txHash);
                    await refreshData();
                  }}
                />
              </>
            )}

            {/* Pending Transaction Status */}
            {pendingActionTxHash && (
              <div className="mt-4 p-4 rounded-lg bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <OnChainIcon className="h-4 w-4 text-muted-foreground" />
                    <AndamioText variant="small" className="font-medium">
                      Pending Transaction
                    </AndamioText>
                  </div>
                  <a
                    href={`https://preprod.cardanoscan.io/transaction/${pendingActionTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-primary hover:underline"
                  >
                    {pendingActionTxHash.slice(0, 12)}...
                  </a>
                </div>

                <AndamioText variant="small" className="text-muted-foreground">
                  The Gateway TX State Machine will update the status automatically once confirmed.
                </AndamioText>

                <AndamioButton
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await refreshData();
                    toast.info("Data refreshed", {
                      description: "Check back in a few seconds if the transaction hasn't confirmed yet.",
                    });
                  }}
                >
                  <RefreshIcon className="h-4 w-4 mr-2" />
                  Refresh Status
                </AndamioButton>
              </div>
            )}
          </AndamioCardContent>
        </AndamioCard>
        );
      })()}

      {/* Task Selection - Only show when eligible and not in pending state */}
      {eligibility?.eligible && liveTasks.length > 0 && contributorStatus !== "task_pending" && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2">
              <TaskIcon className="h-5 w-5" />
              Select a Task
            </AndamioCardTitle>
            <AndamioCardDescription>
              Choose a task to commit to
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-2">
            {liveTasks.map((task) => {
              const taskHashStr = getString(task.taskHash);
              const isAcceptedTask = dbCommitment?.taskHash === taskHashStr && dbCommitment?.commitmentStatus === "ACCEPTED";
              const isSelectable = !isAcceptedTask;

              return (
                <div
                  key={taskHashStr || task.index}
                  className={`p-4 border rounded-lg transition-colors ${
                    isAcceptedTask
                      ? "border-primary bg-primary/5 cursor-default"
                      : getString(selectedTask?.taskHash) === taskHashStr
                        ? "border-primary bg-primary/5 cursor-pointer"
                        : "hover:border-muted-foreground/50 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isSelectable) return;
                    if (getString(selectedTask?.taskHash) !== taskHashStr) {
                      setTaskEvidence(null);
                    }
                    setSelectedTask(task);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <AndamioText as="span" className={`font-medium ${isAcceptedTask ? "text-primary" : ""}`}>
                          {task.title}
                        </AndamioText>
                        {isAcceptedTask && (
                          <AndamioBadge variant="default" className="bg-primary text-primary-foreground">
                            <SuccessIcon className="h-3 w-3 mr-1" />
                            Accepted
                          </AndamioBadge>
                        )}
                      </div>
                      <AndamioText variant="small" className={isAcceptedTask ? "text-primary/70" : ""}>
                        {getString(task.description)}
                      </AndamioText>
                      {isAcceptedTask && (
                        <AndamioText variant="small" className="text-primary/70">
                          Your reward of {formatLovelace(task.lovelaceAmount ?? "0")} will be claimed when you commit to a new task or leave the project
                        </AndamioText>
                      )}
                    </div>
                    <AndamioBadge variant={isAcceptedTask ? "outline" : "outline"} className={isAcceptedTask ? "border-primary text-primary" : ""}>
                      {formatLovelace(task.lovelaceAmount ?? "0")}
                    </AndamioBadge>
                  </div>
                </div>
              );
            })}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Evidence Editor - Show when task selected and eligible */}
      {eligibility?.eligible && selectedTask && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2">
              <EditIcon className="h-5 w-5" />
              Your Evidence
            </AndamioCardTitle>
            <AndamioCardDescription>
              Describe how you will complete this task. This will be submitted with your commitment.
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            <div className="min-h-[200px] border rounded-lg">
              <ContentEditor
                content={taskEvidence}
                onContentChange={(content) => {
                  setTaskEvidence(content);
                }}
              />
            </div>
            {!hasValidEvidence && (
              <AndamioText variant="small" className="text-muted-foreground">
                Please provide evidence describing your approach to this task.
              </AndamioText>
            )}
            {hasValidEvidence && (
              <AndamioText variant="small" className="text-primary flex items-center gap-1">
                <SuccessIcon className="h-4 w-4" />
                Evidence ready for submission
              </AndamioText>
            )}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* TaskCommit - Used for enrollment AND subsequent commits (not_enrolled / enrolled only) */}
      {eligibility?.eligible && (contributorStatus === "not_enrolled" || contributorStatus === "enrolled") && selectedTask && (() => {
        const isFirstCommit = contributorStatus === "not_enrolled";
        return (
          <TaskCommit
            projectNftPolicyId={projectId}
            contributorStateId={contributorStateId ?? "0".repeat(56)}
            projectTitle={projectDetail.title || undefined}
            taskHash={getOnChainTaskId(selectedTask)}
            taskCode={`TASK_${selectedTask.index}`}
            taskTitle={selectedTask.title ?? undefined}
            taskEvidence={taskEvidence}
            isFirstCommit={isFirstCommit}
            willClaimRewards={false}
            onSuccess={async () => {
              setStatusOverride("task_pending");
              await refreshData();
            }}
          />
        );
      })()}

      {/* When contributor has an accepted task - show acceptance banner + decision options */}
      {eligibility?.eligible && contributorStatus === "task_accepted" && (() => {
        // Derive reward amount from the accepted task
        const acceptedAssessment = myAssessments.find(a => a.decision === "accept");
        const acceptedTaskHash = acceptedAssessment?.taskHash;
        const acceptedTask = acceptedTaskHash
          ? tasks.find(t => getString(t.taskHash) === acceptedTaskHash)
          : undefined;
        const acceptedTaskReward = acceptedTask?.lovelaceAmount ?? "0";
        const acceptedTaskTitle = acceptedTask?.title ?? "Your task";

        return (
          <div className="space-y-4">
            {/* Acceptance Banner */}
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="flex items-start gap-3">
                <SuccessIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <AndamioText className="font-medium text-primary">
                    {acceptedTaskTitle} was accepted!
                  </AndamioText>
                  <AndamioText variant="small" className="mt-1">
                    You earned {formatLovelace(acceptedTaskReward)}. Choose your next step:
                  </AndamioText>
                </div>
              </div>
            </div>

            {/* Decision Cards — side by side on desktop, stacked on mobile */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A: Continue Contributing */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ContributorIcon className="h-5 w-5 text-primary" />
                  <AndamioText className="font-medium">Continue Contributing</AndamioText>
                </div>
                <AndamioText variant="small">
                  Select a new task below and commit. Your {formatLovelace(acceptedTaskReward)} reward will be claimed automatically.
                </AndamioText>
                {!selectedTask && (
                  <AndamioText variant="small" className="text-muted-foreground italic">
                    Select a task from the list below to continue.
                  </AndamioText>
                )}
              </div>

              {/* Option B: Leave & Claim */}
              <div className="rounded-lg border border-primary/20 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <CredentialIcon className="h-5 w-5 text-primary" />
                  <AndamioText className="font-medium">Claim & Leave</AndamioText>
                </div>
                <AndamioText variant="small">
                  Leave the project, claim {formatLovelace(acceptedTaskReward)}, and mint your credential NFT.
                </AndamioText>
              </div>
            </div>

            {/* TaskCommit renders when a task is selected */}
            {selectedTask && (
              <TaskCommit
                projectNftPolicyId={projectId}
                contributorStateId={contributorStateId ?? "0".repeat(56)}
                projectTitle={projectDetail.title || undefined}
                taskHash={getOnChainTaskId(selectedTask)}
                taskCode={`TASK_${selectedTask.index}`}
                taskTitle={selectedTask.title ?? undefined}
                taskEvidence={taskEvidence}
                isFirstCommit={false}
                willClaimRewards={true}
                onSuccess={async () => {
                  setStatusOverride("task_pending");
                  await refreshData();
                }}
              />
            )}

            <ProjectCredentialClaim
              projectNftPolicyId={projectId}
              contributorStateId={contributorStateId ?? "0".repeat(56)}
              projectTitle={projectDetail.title || undefined}
              pendingRewardLovelace={acceptedTaskReward}
              onSuccess={async () => {
                await refreshData();
              }}
            />
          </div>
        );
      })()}

      {/* When contributor can claim credentials (post-unenroll state) */}
      {eligibility?.eligible && contributorStatus === "can_claim" && (
        <div className="space-y-4">
          {selectedTask && (
            <TaskCommit
              projectNftPolicyId={projectId}
              contributorStateId={contributorStateId ?? "0".repeat(56)}
              projectTitle={projectDetail.title || undefined}
              taskHash={getOnChainTaskId(selectedTask)}
              taskCode={`TASK_${selectedTask.index}`}
              taskTitle={selectedTask.title ?? undefined}
              taskEvidence={taskEvidence}
              isFirstCommit={false}
              willClaimRewards={true}
              onSuccess={async () => {
                setStatusOverride("task_pending");
                await refreshData();
              }}
            />
          )}

          <ProjectCredentialClaim
            projectNftPolicyId={projectId}
            contributorStateId={contributorStateId ?? "0".repeat(56)}
            projectTitle={projectDetail.title || undefined}
            onSuccess={async () => {
              await refreshData();
            }}
          />
        </div>
      )}

      {/* No tasks available */}
      {liveTasks.length === 0 && (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No Tasks Available"
          description="This project doesn't have any active tasks right now. Check back later."
        />
      )}

      {/* Tasks available but prerequisites not met */}
      {liveTasks.length > 0 && eligibility && !eligibility.eligible && (
        <AndamioEmptyState
          icon={AlertIcon}
          title="Complete Prerequisites First"
          description="Complete the required course modules above to unlock these tasks."
        />
      )}

      {/* Info about the contributor workflow */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>How It Works</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
            <div>
              <AndamioText className="font-medium">Commit to a Task</AndamioText>
              <AndamioText variant="small">Select a task, describe your approach, and commit on-chain. This automatically adds you as a project contributor.</AndamioText>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
            <div>
              <AndamioText className="font-medium">Complete the Work</AndamioText>
              <AndamioText variant="small">Work on your task and update your evidence as needed while awaiting review.</AndamioText>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
            <div>
              <AndamioText className="font-medium">Get Reviewed</AndamioText>
              <AndamioText variant="small">A project manager can review your commitment at any point — even before you submit evidence. If refused, you can resubmit.</AndamioText>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">4</div>
            <div>
              <AndamioText className="font-medium">Earn Rewards</AndamioText>
              <AndamioText variant="small">When your task is accepted, you have two choices: commit to another task (which claims your rewards and keeps you active in the project), or leave the project to claim your credential and rewards together.</AndamioText>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}

/**
 * Contributor Dashboard Page - Requires authentication
 */
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
