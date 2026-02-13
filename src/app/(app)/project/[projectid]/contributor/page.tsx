"use client";

import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useContributorCommitments, type ContributorCommitment } from "~/hooks/api/project/use-project-contributor";
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
  AlertIcon,
  SuccessIcon,
  PendingIcon,
  OnChainIcon,
} from "~/components/icons";
import { useProject, useProjectTasks } from "~/hooks/api/project/use-project";
import { ProjectCredentialClaim } from "~/components/tx";
import { ContentViewer } from "~/components/editor";
import { formatLovelace } from "~/lib/cardano-utils";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { useStudentCompletionsForPrereqs } from "~/hooks/api/course/use-student-completions-for-prereqs";
import { checkProjectEligibility } from "~/lib/project-eligibility";
import { useQueryClient } from "@tanstack/react-query";
import { projectContributorKeys } from "~/hooks/api/project/use-project-contributor";
import { projectKeys } from "~/hooks/api/project/use-project";
import type { JSONContent } from "@tiptap/core";

/** Safely extract a string from a value that may be a string, object, or nullish (API nullable strings). */
function safeString(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

function getStatusStatColor(label: string): "success" | "warning" | undefined {
  if (label === "Welcome Back" || label === "Task Accepted") return "success";
  if (label === "Resubmission Needed") return "warning";
  return undefined;
}

const HOW_IT_WORKS_STEPS = [
  { title: "Commit to a Task", description: "Select a task, describe your approach, and commit on-chain. This automatically adds you as a project contributor." },
  { title: "Complete the Work", description: "Work on your task and update your evidence as needed while awaiting review." },
  { title: "Get Reviewed", description: "A project manager can review your commitment at any point — even before you submit evidence. If refused, you can resubmit." },
  { title: "Earn Rewards", description: "When your task is accepted, you have two choices: commit to another task (which claims your rewards and keeps you active in the project), or leave the project to claim your credential and rewards together." },
];

/**
 * My Contributions Page (read-only)
 *
 * Shows the contributor's stats, progress, and pending task status.
 * All workflow actions (commit, evidence editing, credential claims)
 * are handled on the Task Detail page.
 *
 * Data strategy:
 * - useProject() for project-level info (contributors, credentialClaims, submissions)
 * - useProjectTasks() for task details (titles, rewards)
 * - useContributorCommitments(projectId) for the user's ACTUAL commitment statuses
 *   (avoids API bug #178 where assessments.taskHash is empty)
 */
function MyContributionsContent() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { user } = useAndamioAuth();
  const queryClient = useQueryClient();
  const [showClaimFlow, setShowClaimFlow] = useState(false);

  // React Query hooks
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const { data: tasks = [], isLoading: isTasksLoading } = useProjectTasks(projectId);

  // All of the user's commitments in this project — the source of truth for statuses.
  // This avoids the assessments.taskHash API bug (#178).
  const { data: rawCommitments = [], isLoading: isCommitmentsLoading } = useContributorCommitments(projectId);

  // Prerequisite eligibility — safety net for credential claim gating
  const prereqCourseIds = useMemo(() => {
    if (!projectDetail?.prerequisites) return [];
    return projectDetail.prerequisites
      .map((p) => p.courseId)
      .filter((id): id is string => !!id);
  }, [projectDetail?.prerequisites]);

  const { completions } = useStudentCompletionsForPrereqs(prereqCourseIds);

  const prerequisites = useMemo(() => projectDetail?.prerequisites ?? [], [projectDetail?.prerequisites]);
  const eligibility = useMemo(() => {
    if (prerequisites.length === 0) return null;
    return checkProjectEligibility(prerequisites, completions);
  }, [prerequisites, completions]);

  const isEligible = eligibility === null || eligibility.eligible;

  // Deduplicate commitments by taskHash — API can return multiple records per task
  // (from chain/DB/merged sources). Keep the most relevant status per task.
  const commitments = useMemo(() => {
    const STATUS_PRIORITY: Record<string, number> = {
      REFUSED: 6, COMMITTED: 5, SUBMITTED: 4,
      PENDING_TX_SUBMIT: 3, ACCEPTED: 2, UNKNOWN: 1,
    };
    const byHash = new Map<string, ContributorCommitment>();
    for (const c of rawCommitments) {
      const key = c.taskHash;
      if (!key) continue;
      const existing = byHash.get(key);
      if (!existing) {
        byHash.set(key, c);
      } else {
        const existingPriority = STATUS_PRIORITY[existing.commitmentStatus ?? ""] ?? 0;
        const newPriority = STATUS_PRIORITY[c.commitmentStatus ?? ""] ?? 0;
        if (newPriority > existingPriority) {
          byHash.set(key, c);
        }
      }
    }
    return Array.from(byHash.values());
  }, [rawCommitments]);

  // Derive contributor context from project detail
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

  // Loading state
  if (isProjectLoading || isTasksLoading || isCommitmentsLoading) {
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

  // Filter to ON_CHAIN tasks (keep all instances — same taskHash = same content, different UTxOs)
  const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");

  // ── Derive stats from commitments (reliable source of truth) ──────────

  const acceptedCommitments = commitments.filter(c => c.commitmentStatus === "ACCEPTED");
  const pendingCommitments = commitments.filter(c =>
    c.commitmentStatus === "COMMITTED" ||
    c.commitmentStatus === "SUBMITTED" ||
    c.commitmentStatus === "REFUSED" ||
    c.commitmentStatus === "PENDING_TX_SUBMIT"
  );

  const completedTaskCount = acceptedCommitments.length;
  const pendingTaskCount = pendingCommitments.length;
  const credentialCount = myCredentials.length;

  // Earned rewards: only count rewards that have actually been CLAIMED.
  // In the Andamio protocol, rewards are claimed when you either:
  // (a) commit to a new task (auto-claims previous ACCEPTED task's reward), or
  // (b) leave the project via credential claim.
  // If no active pending commitment exists, the latest ACCEPTED task's reward
  // is still unclaimed — exclude it from the total.
  const earnedRewards = (() => {
    const totalAccepted = acceptedCommitments.reduce((sum, c) => {
      const matchedTask = liveTasks.find(t => safeString(t.taskHash) === c.taskHash);
      return sum + (matchedTask ? parseInt(matchedTask.lovelaceAmount ?? "0", 10) || 0 : 0);
    }, 0);

    // If there's an active pending commitment, all accepted rewards are claimed
    if (pendingCommitments.length > 0) return totalAccepted;

    // Otherwise, the latest accepted task's reward is unclaimed — subtract it
    if (acceptedCommitments.length > 0) {
      // Last element = most recently accepted (API returns oldest-first insertion order)
      const latestAccepted = acceptedCommitments.at(-1);
      const latestTask = liveTasks.find(t => safeString(t.taskHash) === latestAccepted?.taskHash);
      const unclaimedReward = latestTask ? parseInt(latestTask.lovelaceAmount ?? "0", 10) || 0 : 0;
      return totalAccepted - unclaimedReward;
    }

    return totalAccepted;
  })();

  // Available tasks: exclude tasks with any commitment from this user
  const committedTaskHashes = new Set(commitments.map(c => c.taskHash).filter(Boolean));
  const availableTaskCount = liveTasks.filter(t => !committedTaskHashes.has(safeString(t.taskHash))).length;

  // Find the "active" commitment (the one that needs attention — pending or refused)
  // Priority: REFUSED > COMMITTED > SUBMITTED > PENDING_TX_SUBMIT > ACCEPTED
  const activeCommitment: ContributorCommitment | undefined =
    pendingCommitments.find(c => c.commitmentStatus === "REFUSED") ??
    pendingCommitments.find(c => c.commitmentStatus === "COMMITTED") ??
    pendingCommitments.find(c => c.commitmentStatus === "SUBMITTED") ??
    pendingCommitments.find(c => c.commitmentStatus === "PENDING_TX_SUBMIT") ??
    // If no pending, show the most recent accepted (for the "next steps" CTA)
    acceptedCommitments[0];

  // Derive status label from actual commitment data
  const contributorStatusLabel = (() => {
    if (credentialCount > 0 && pendingCommitments.length === 0 && acceptedCommitments.length === 0) return "Welcome Back";
    if (acceptedCommitments.length > 0 && pendingCommitments.length === 0) return "Task Accepted";
    if (pendingCommitments.length > 0) {
      const activeStatus = activeCommitment?.commitmentStatus;
      if (activeStatus === "REFUSED") return "Resubmission Needed";
      if (activeStatus === "PENDING_TX_SUBMIT") return "Awaiting Confirmation";
      return "Task Pending";
    }
    if (isContributor) return "Active Contributor";
    return "Ready to Join";
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="My Contributions"
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
          value={contributorStatusLabel}
          valueColor={getStatusStatColor(contributorStatusLabel)}
          iconColor={getStatusStatColor(contributorStatusLabel)}
        />
        <AndamioDashboardStat icon={TaskIcon} label="Available Tasks" value={availableTaskCount} />
        <AndamioDashboardStat
          icon={CredentialIcon}
          label="Claimed Rewards"
          value={formatLovelace(earnedRewards.toString())}
          valueColor={earnedRewards > 0 ? "success" : undefined}
          iconColor={earnedRewards > 0 ? "success" : undefined}
        />
      </div>

      {/* Contributor Progress */}
      {(isContributor || commitments.length > 0) && (
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

      {/* Active Commitment Card (read-only) */}
      {activeCommitment && (() => {
        const taskId = activeCommitment.taskHash;
        const txHash = activeCommitment.submissionTx;
        const status = activeCommitment.commitmentStatus;

        // Match to DB task for title/reward
        const matchedDbTask = tasks.find(t => safeString(t.taskHash) === taskId);
        const taskLovelace = matchedDbTask ? parseInt(matchedDbTask.lovelaceAmount ?? "0") : 0;

        return (
          <AndamioCard className={
            status === "REFUSED" ? "border-destructive" :
            status === "ACCEPTED" ? "border-primary" : "border-secondary"
          }>
            <AndamioCardHeader>
              <AndamioCardTitle className={`flex items-center gap-2 ${
                status === "REFUSED" ? "text-destructive" :
                status === "ACCEPTED" ? "text-primary" : "text-secondary"
              }`}>
                {status === "REFUSED" ? (
                  <><AlertIcon className="h-5 w-5" />Resubmission Needed</>
                ) : status === "ACCEPTED" ? (
                  <><SuccessIcon className="h-5 w-5" />Task Accepted</>
                ) : status === "PENDING_TX_SUBMIT" ? (
                  <><PendingIcon className="h-5 w-5" />Awaiting Confirmation</>
                ) : (
                  <><PendingIcon className="h-5 w-5" />Task Pending Review</>
                )}
              </AndamioCardTitle>
              <AndamioCardDescription>
                {status === "REFUSED"
                  ? "Your work was not accepted. Go to the task page to update and resubmit."
                  : status === "ACCEPTED"
                    ? "Your work has been accepted! Choose your next step below."
                    : status === "COMMITTED"
                      ? "You've joined this task. Visit the task page to submit evidence."
                      : status === "SUBMITTED"
                        ? "Evidence submitted. Waiting for manager review."
                        : status === "PENDING_TX_SUBMIT"
                          ? "Waiting for blockchain confirmation."
                          : "Your submission is awaiting manager review."}
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
                  {safeString(matchedDbTask.description) && (
                    <AndamioText variant="small" className="text-muted-foreground">
                      {safeString(matchedDbTask.description)}
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
                      href={getTransactionExplorerUrl(txHash)}
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

              {/* Evidence Section — Read-only */}
              {!!activeCommitment.evidence && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <PendingIcon className="h-4 w-4 text-muted-foreground" />
                    <AndamioText className="font-medium">Your Evidence</AndamioText>
                    {status && (
                      <AndamioBadge variant="outline" className="text-xs">
                        {status.replace(/_/g, " ")}
                      </AndamioBadge>
                    )}
                  </div>
                  <div className="min-h-[100px] border rounded-lg bg-muted/20 p-4">
                    <ContentViewer content={activeCommitment.evidence as JSONContent} />
                  </div>
                </div>
              )}

              {/* Pending Transaction Status */}
              {activeCommitment.pendingTxHash && (
                <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <OnChainIcon className="h-4 w-4 text-muted-foreground" />
                      <AndamioText variant="small" className="font-medium">
                        Pending Transaction
                      </AndamioText>
                    </div>
                    <a
                      href={getTransactionExplorerUrl(activeCommitment.pendingTxHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline"
                    >
                      {activeCommitment.pendingTxHash.slice(0, 12)}...
                    </a>
                  </div>
                </div>
              )}

              {/* ACCEPTED: Decision cards + credential claim */}
              {status === "ACCEPTED" ? (
                <div className="space-y-4">
                  {!showClaimFlow ? (
                    <>
                      <AndamioText variant="small" className="font-medium">
                        Choose your next step:
                      </AndamioText>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Option A: Continue Contributing */}
                        <Link href={`/project/${projectId}`} className="block">
                          <div className="rounded-lg border p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer h-full">
                            <div className="flex items-center gap-2">
                              <ContributorIcon className="h-5 w-5 text-primary" />
                              <AndamioText className="font-medium">Continue Contributing</AndamioText>
                            </div>
                            <AndamioText variant="small">
                              Browse available tasks and commit to a new one. Your {formatLovelace(taskLovelace.toString())} reward will be claimed automatically.
                            </AndamioText>
                          </div>
                        </Link>

                        {/* Option B: Leave & Claim */}
                        <button
                          type="button"
                          onClick={() => setShowClaimFlow(true)}
                          className="rounded-lg border border-primary/20 p-4 space-y-3 hover:border-primary/50 transition-colors cursor-pointer h-full text-left"
                        >
                          <div className="flex items-center gap-2">
                            <CredentialIcon className="h-5 w-5 text-primary" />
                            <AndamioText className="font-medium">Leave & Claim</AndamioText>
                          </div>
                          <AndamioText variant="small">
                            Leave the project, claim {formatLovelace(taskLovelace.toString())} in rewards, and mint your credential NFT.
                          </AndamioText>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* ProjectCredentialClaim TX component — revealed after clicking Leave & Claim */}
                      {isEligible ? (
                        <ProjectCredentialClaim
                          projectNftPolicyId={projectId}
                          contributorStateId={projectDetail?.contributorStateId ?? "0".repeat(56)}
                          projectTitle={projectDetail?.title || undefined}
                          pendingRewardLovelace={taskLovelace.toString()}
                          onSuccess={async () => {
                            await Promise.all([
                              queryClient.invalidateQueries({ queryKey: projectContributorKeys.commitments(projectId) }),
                              queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) }),
                            ]);
                          }}
                        />
                      ) : (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                          <div className="flex items-start gap-3">
                            <AlertIcon className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                            <div>
                              <AndamioText className="font-medium text-destructive">
                                Prerequisites Not Met
                              </AndamioText>
                              <AndamioText variant="small" className="mt-1">
                                You need to complete the required course modules before claiming your credential.
                              </AndamioText>
                            </div>
                          </div>
                        </div>
                      )}
                      <AndamioButton
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowClaimFlow(false)}
                        className="cursor-pointer"
                      >
                        Back to options
                      </AndamioButton>
                    </>
                  )}
                </div>
              ) : (
                /* Non-ACCEPTED: View on Task Page CTA */
                <Link href={`/project/${projectId}/${taskId}`}>
                  <AndamioButton variant="outline" className="w-full cursor-pointer">
                    <TaskIcon className="h-4 w-4 mr-2" />
                    {status === "REFUSED"
                      ? "Go to Task Page to Resubmit"
                      : "View on Task Page"}
                  </AndamioButton>
                </Link>
              )}
            </AndamioCardContent>
          </AndamioCard>
        );
      })()}

      {/* No commitments empty state */}
      {commitments.length === 0 && !isContributor && (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No Contributions Yet"
          description="Browse the project tasks and commit to one to get started."
        />
      )}

      {/* Info about the contributor workflow */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>How It Works</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {index + 1}
              </div>
              <div>
                <AndamioText className="font-medium">{step.title}</AndamioText>
                <AndamioText variant="small">{step.description}</AndamioText>
              </div>
            </div>
          ))}
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}

/**
 * My Contributions Page - Requires authentication
 */
export default function MyContributionsPage() {
  return (
    <RequireAuth
      title="My Contributions"
      description="Connect your wallet to view your contributions to this project"
    >
      <MyContributionsContent />
    </RequireAuth>
  );
}
