"use client";

import React, { useCallback, useEffect, useState } from "react";
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
import { useProject, useProjectTasks, projectKeys, type Task } from "~/hooks/api/project/use-project";
import { useQueryClient } from "@tanstack/react-query";
import { TaskCommit, ProjectCredentialClaim, TaskAction } from "~/components/tx";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProjectContributorStatus, getProject, type AndamioscanContributorStatus, type AndamioscanTask, type AndamioscanSubmission, type AndamioscanTaskSubmission } from "~/lib/andamioscan-events";
import { checkProjectEligibility, type EligibilityResult } from "~/lib/project-eligibility";
import { computeTaskHash, type TaskData } from "@andamio/core/hashing";
import { ContentEditor, ContentViewer } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";
import { EditIcon, OnChainIcon, RefreshIcon, LoadingIcon } from "~/components/icons";
import { toast } from "sonner";
import { useTaskSubmitConfirmation } from "~/hooks/tx/use-event-confirmation";

// Helper to extract string from NullableString (API returns object type for nullable strings)
function getString(value: string | object | undefined | null): string {
  if (typeof value === "string") return value;
  return "";
}

// Contributor status from on-chain data
type ContributorStatus = "not_enrolled" | "enrolled" | "task_pending" | "task_accepted" | "can_claim";

/**
 * Contributor Dashboard Page
 *
 * A dedicated view for contributors to manage their project participation:
 * - Enroll in project (if not enrolled)
 * - View current task status
 * - Commit to new tasks
 * - Claim credentials
 */

function ContributorDashboardContent() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { user } = useAndamioAuth();
  const queryClient = useQueryClient();

  // React Query hooks replace manual project/tasks fetching
  const { data: projectDetail, isLoading: isProjectLoading, error: projectError } = useProject(projectId);
  const contributorStatePolicyId = projectDetail?.contributorStateId;
  const { data: tasks = [], isLoading: isTasksLoading } = useProjectTasks(
    contributorStatePolicyId ?? undefined
  );

  // On-chain contributor state
  const [contributorStatus, setContributorStatus] = useState<ContributorStatus>("not_enrolled");
  const [onChainContributor, setOnChainContributor] = useState<AndamioscanContributorStatus | null>(null);
  const contributorStateId = contributorStatePolicyId ?? null;
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // On-chain tasks from Andamioscan (for task_id lookup)
  const [onChainTasks, setOnChainTasks] = useState<AndamioscanTask[]>([]);

  // On-chain submission for current contributor (when pending task exists)
  const [onChainSubmission, setOnChainSubmission] = useState<AndamioscanSubmission | null>(null);
  // Pending task from contributor status API (has task details but no tx_hash)
  const [pendingTaskSubmission, setPendingTaskSubmission] = useState<AndamioscanTaskSubmission | null>(null);

  // DB commitment record for the current task (fetched reactively via hook)
  const [dbCommitment, setDbCommitment] = useState<ContributorCommitment | null>(null);

  // Task hash to look up commitment for (set by orchestration, triggers hook fetch)
  const [lookupTaskHash, setLookupTaskHash] = useState<string | null>(null);

  // Reactive commitment fetch via hook
  const {
    data: commitmentData,
    isLoading: isCommitmentLoading,
  } = useContributorCommitment(projectId, lookupTaskHash ?? undefined);

  // Last submitted task action tx hash (for confirmation checking)
  // This can come from either a new submission OR from DB commitment's pending_tx_hash
  const [pendingActionTxHash, setPendingActionTxHash] = useState<string | null>(null);

  // Event-based confirmation check
  const { status: confirmStatus, event: confirmEvent, checkOnce: checkConfirmation } = useTaskSubmitConfirmation(pendingActionTxHash);

  // Eligibility state (prerequisites)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Task evidence from editor
  const [taskEvidence, setTaskEvidence] = useState<JSONContent | null>(null);

  /**
   * Compute task hash from DB task data.
   * Uses the same algorithm as on-chain to reliably match DB tasks to on-chain tasks.
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
   * Uses computeTaskHash for reliable matching instead of lovelace/index fallbacks.
   */
  const getOnChainTaskId = (dbTask: Task | null): string => {
    if (!dbTask) return "";

    // If DB already has task_hash, use it
    const taskHash = getString(dbTask.taskHash);
    if (taskHash.length === 64) {
      return taskHash;
    }

    // Compute the task hash from DB data
    const computedHash = computeTaskHashFromDb(dbTask);

    // Verify it exists on-chain
    const onChainTask = onChainTasks.find(t => t.task_id === computedHash);
    if (onChainTask) {
      console.log("[Contributor] Matched task by computed hash:", {
        computedHash: computedHash.slice(0, 16) + "...",
        title: dbTask.title,
      });
      return computedHash;
    }

    // Fallback: return computed hash even if not found on-chain yet
    console.log("[Contributor] Using computed hash (not yet on-chain):", {
      computedHash: computedHash.slice(0, 16) + "...",
      title: dbTask.title,
    });
    return computedHash;
  };

  /**
   * Get the contributor_state_policy_id from the matching on-chain task.
   * This is required by the Atlas TX API for task commits.
   * Uses computeTaskHash for reliable matching.
   */
  const getOnChainContributorStatePolicyId = (dbTask: Task | null): string => {
    if (!dbTask) return "";

    // Use existing task_hash or compute it
    const existingTaskHash = getString(dbTask.taskHash);
    const taskHash = existingTaskHash.length === 64
      ? existingTaskHash
      : computeTaskHashFromDb(dbTask);

    // Find matching on-chain task
    const matchedTask = onChainTasks.find(t => t.task_id === taskHash);
    if (matchedTask) {
      return matchedTask.contributor_state_policy_id;
    }

    // Fallback: use the first task's policy ID (all tasks in same project share the policy ID)
    if (onChainTasks.length > 0 && onChainTasks[0]) {
      return onChainTasks[0].contributor_state_policy_id;
    }

    return "";
  };

  // Check if evidence is valid (has actual content)
  const hasValidEvidence = taskEvidence?.content &&
    Array.isArray(taskEvidence.content) &&
    taskEvidence.content.length > 0 &&
    // Check it's not just an empty paragraph
    !(taskEvidence.content.length === 1 &&
      taskEvidence.content[0]?.type === "paragraph" &&
      (!taskEvidence.content[0]?.content || taskEvidence.content[0]?.content.length === 0));

  // Orchestration trigger - increment to re-run Andamioscan + contributor status checks
  const [orchestrationTrigger, setOrchestrationTrigger] = useState(0);
  const [isOrchestrating, setIsOrchestrating] = useState(false);

  // Refresh all data: invalidate React Query caches + re-run orchestration
  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    if (contributorStatePolicyId) {
      await queryClient.invalidateQueries({ queryKey: projectKeys.tasks(contributorStatePolicyId) });
    }
    setOrchestrationTrigger((prev) => prev + 1);
  }, [queryClient, projectId, contributorStatePolicyId]);

  // Auto-select first live task when tasks load
  useEffect(() => {
    if (tasks.length > 0 && !selectedTask) {
      const liveTasks = tasks.filter((t) => t.taskStatus === "ON_CHAIN");
      if (liveTasks.length > 0) {
        setSelectedTask(liveTasks[0] ?? null);
      }
    }
  }, [tasks, selectedTask]);

  // Orchestration effect: runs Andamioscan + contributor status checks
  // Triggered when project/tasks data loads or after refreshData()
  useEffect(() => {
    if (isProjectLoading || isTasksLoading || !projectDetail) return;
    const alias = user?.accessTokenAlias;
    if (!alias) return;

    const orchestrate = async () => {
      console.log("[Contributor] ========== ORCHESTRATION START ==========");
      setIsOrchestrating(true);

      // Fetch on-chain project details from Andamioscan (for task_id lookup and submission data)
      let onChainProjectDetails = null;
      try {
        console.log("[Contributor] Fetching on-chain project details from Andamioscan...");
        onChainProjectDetails = await getProject(projectId);
        if (onChainProjectDetails?.tasks) {
          console.log("[Contributor] On-chain tasks found:", onChainProjectDetails.tasks.length);
          setOnChainTasks(onChainProjectDetails.tasks);
        }
        if (onChainProjectDetails?.submissions) {
          console.log("[Contributor] On-chain submissions found:", onChainProjectDetails.submissions.length);
        }
      } catch (err) {
        console.error("[Contributor] Error fetching on-chain project details:", err);
        // Non-fatal - continue without on-chain data
      }

      // Fetch on-chain contributor status
      console.log("[Contributor] User authenticated, checking status. Alias:", alias);
      setIsCheckingEligibility(true);

      // Check contributor status from Andamioscan
      try {
        console.log("[Contributor] Fetching contributor status from Andamioscan...");
        const contributorData = await getProjectContributorStatus(projectId, alias);
        console.log("[Contributor] Contributor data from Andamioscan:", contributorData);
        setOnChainContributor(contributorData);

        if (contributorData) {
          console.log("[Contributor] On-chain contributor found:", {
            pending_tasks: contributorData.pending_tasks.length,
            completed_tasks: contributorData.completed_tasks.length,
            credentials: contributorData.credentials.length,
          });
          // Determine status based on on-chain data
          if (contributorData.pending_tasks.length > 0) {
            // Get the pending task submission data directly from contributor status
            const pendingTask = contributorData.tasks_submitted[0];

            // Set initial status to task_pending (may be overridden by commitment effect)
            console.log("[Contributor] Status: task_pending");
            setContributorStatus("task_pending");

            if (pendingTask) {
              console.log("[Contributor] Pending task submission from contributor status:", {
                task_id: pendingTask.task_id,
                content: pendingTask.content,
                lovelace_amount: pendingTask.lovelace_amount,
              });
              setPendingTaskSubmission(pendingTask);

              // Trigger reactive commitment fetch via hook
              setLookupTaskHash(pendingTask.task_id);

              // Also try to find full submission in project details for tx_hash
              if (onChainProjectDetails?.submissions) {
                const mySubmission = onChainProjectDetails.submissions.find(
                  (s) => s.alias === alias &&
                         s.task.task_id === pendingTask.task_id
                );
                if (mySubmission) {
                  console.log("[Contributor] Found full submission with tx_hash:", mySubmission.tx_hash);
                  setOnChainSubmission(mySubmission);
                }
              }
            }
          } else if (contributorData.completed_tasks.length > 0) {
            // Has completed tasks, can commit to new ones or claim credentials
            if (contributorData.credentials.length > 0) {
              console.log("[Contributor] Status: can_claim");
              setContributorStatus("can_claim");
            } else {
              console.log("[Contributor] Status: task_accepted");
              setContributorStatus("task_accepted");
            }
          } else {
            console.log("[Contributor] Status: enrolled (no pending/completed tasks from API)");

            // FALLBACK: Check project submissions directly
            // Sometimes the contributor status API doesn't return pending_submissions
            // but the submission exists in project details
            if (onChainProjectDetails?.submissions) {
              const mySubmission = onChainProjectDetails.submissions.find(
                (s) => s.alias === alias
              );
              if (mySubmission) {
                console.log("[Contributor] FALLBACK: Found submission in project details:", {
                  task_id: mySubmission.task.task_id,
                  tx_hash: mySubmission.tx_hash,
                  alias: mySubmission.alias,
                });
                // Override status to task_pending
                setContributorStatus("task_pending");
                setOnChainSubmission(mySubmission);

                // Trigger reactive commitment fetch via hook
                setLookupTaskHash(mySubmission.task.task_id);
              } else {
                setContributorStatus("enrolled");
              }
            } else {
              setContributorStatus("enrolled");
            }
          }
        } else {
          console.log("[Contributor] Status: not_enrolled (no contributor data)");

          // FALLBACK: Even if contributor status returns null, check project submissions
          // This handles the case where the user has a submission but isn't in contributors list yet
          if (onChainProjectDetails?.submissions) {
            const mySubmission = onChainProjectDetails.submissions.find(
              (s) => s.alias === alias
            );
            if (mySubmission) {
              console.log("[Contributor] FALLBACK: Not in contributors list but found submission:", {
                task_id: mySubmission.task.task_id,
                tx_hash: mySubmission.tx_hash,
                alias: mySubmission.alias,
              });
              setContributorStatus("task_pending");
              setOnChainSubmission(mySubmission);
              setOnChainContributor({
                alias,
                project_id: projectId,
                joined_at: 0,
                completed_tasks: [],
                pending_tasks: [mySubmission.task.task_id],
                tasks_submitted: [],
                tasks_accepted: [],
                credentials: [],
              });

              // Trigger reactive commitment fetch via hook
              setLookupTaskHash(mySubmission.task.task_id);
            } else {
              setContributorStatus("not_enrolled");
            }
          } else {
            setContributorStatus("not_enrolled");
          }
        }
      } catch (contributorError) {
        // User not a contributor yet - but still check project submissions
        console.log("[Contributor] Contributor status fetch error:", contributorError);

        // FALLBACK: Check project submissions even on error
        if (onChainProjectDetails?.submissions) {
          const mySubmission = onChainProjectDetails.submissions.find(
            (s) => s.alias === alias
          );
          if (mySubmission) {
            console.log("[Contributor] FALLBACK after error: Found submission:", {
              task_id: mySubmission.task.task_id,
              tx_hash: mySubmission.tx_hash,
            });
            setContributorStatus("task_pending");
            setOnChainSubmission(mySubmission);
            setOnChainContributor({
              alias,
              project_id: projectId,
              joined_at: 0,
              completed_tasks: [],
              pending_tasks: [mySubmission.task.task_id],
              tasks_submitted: [],
              tasks_accepted: [],
              credentials: [],
            });

            // Trigger reactive commitment fetch via hook
            setLookupTaskHash(mySubmission.task.task_id);
          } else {
            setContributorStatus("not_enrolled");
          }
        } else {
          setContributorStatus("not_enrolled");
        }
      }

      // Check prerequisites eligibility
      try {
        console.log("[Contributor] Checking prerequisites eligibility...");
        const eligibilityResult = await checkProjectEligibility(projectId, alias);
        console.log("[Contributor] Eligibility result:", {
          eligible: eligibilityResult.eligible,
          totalRequired: eligibilityResult.totalRequired,
          totalCompleted: eligibilityResult.totalCompleted,
          missingCount: eligibilityResult.missingPrerequisites.length,
        });
        setEligibility(eligibilityResult);
      } catch (eligibilityError) {
        console.error("[Contributor] Error checking eligibility:", eligibilityError);
        // If eligibility check fails, assume not eligible (safe default)
        setEligibility({
          eligible: false,
          missingPrerequisites: [],
          totalRequired: 0,
          totalCompleted: 0,
          prerequisites: [],
        });
      }

      setIsCheckingEligibility(false);
      setIsOrchestrating(false);
      console.log("[Contributor] ========== ORCHESTRATION COMPLETE ==========");
    };

    void orchestrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectDetail, tasks, user?.accessTokenAlias, orchestrationTrigger]);

  // Commitment processing effect: reacts to hook data when lookupTaskHash triggers a fetch
  useEffect(() => {
    // Skip if commitment is still loading or no data yet
    if (isCommitmentLoading || commitmentData === undefined) return;

    if (commitmentData) {
      console.log("[Contributor] Commitment data from hook:", {
        taskHash: commitmentData.taskHash,
        commitmentStatus: commitmentData.commitmentStatus,
        pendingTxHash: commitmentData.pendingTxHash,
        hasEvidence: !!commitmentData.evidence,
      });
      setDbCommitment(commitmentData);

      // Check if DB says task is actually ACCEPTED (Andamioscan may be out of sync)
      if (commitmentData.commitmentStatus === "ACCEPTED") {
        console.log("[Contributor] DB shows ACCEPTED - overriding to task_accepted");
        setContributorStatus("task_accepted");
        // DON'T pre-populate evidence - user needs fresh evidence for the NEW task
        setTaskEvidence(null);

        // Auto-select the first available (non-accepted) task
        const acceptedTaskHash = commitmentData.taskHash;
        const availableTasks = tasks.filter(
          (t) => t.taskStatus === "ON_CHAIN" && getString(t.taskHash) !== acceptedTaskHash,
        );
        if (availableTasks.length > 0) {
          console.log("[Contributor] Auto-selecting first available task:", availableTasks[0]?.title);
          setSelectedTask(availableTasks[0] ?? null);
        }
      } else {
        // If commitment is PENDING_TX_SUBMIT, populate pendingActionTxHash for confirmation checking
        if (commitmentData.commitmentStatus === "PENDING_TX_SUBMIT" && commitmentData.pendingTxHash) {
          console.log("[Contributor] Setting pendingActionTxHash from DB:", commitmentData.pendingTxHash);
          setPendingActionTxHash(commitmentData.pendingTxHash);
        }

        // Pre-populate evidence editor with saved evidence
        if (commitmentData.evidence) {
          setTaskEvidence(commitmentData.evidence as JSONContent);
        }
      }
    } else {
      console.log("[Contributor] No DB commitment found for lookupTaskHash:", lookupTaskHash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [commitmentData, isCommitmentLoading]);

  // Loading state
  if (isProjectLoading || isTasksLoading || isOrchestrating) {
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
{/* Treasury balance removed - total_ada not available in new API */}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AndamioDashboardStat
          icon={ContributorIcon}
          label="Your Status"
          value={
            isCheckingEligibility ? "Checking..." :
            !eligibility?.eligible ? "Prerequisites Required" :
            contributorStatus === "not_enrolled" ? "Ready to Enroll" :
            contributorStatus === "enrolled" ? "Enrolled" :
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
                <div key={prereq.courseId} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CourseIcon className="h-4 w-4 text-muted-foreground" />
                      <AndamioText className="font-mono text-sm">
                        Course: {prereq.courseId.slice(0, 16)}...
                      </AndamioText>
                    </div>
                    <AndamioBadge variant="outline">
                      {prereq.completedModules.length}/{prereq.requiredModules.length} completed
                    </AndamioBadge>
                  </div>

                  {/* Missing modules */}
                  <div className="flex flex-wrap gap-2">
                    {prereq.missingModules.map((moduleHash) => (
                      <AndamioBadge key={moduleHash} variant="secondary" className="text-xs font-mono">
                        <PendingIcon className="h-3 w-3 mr-1" />
                        {moduleHash.slice(0, 12)}...
                      </AndamioBadge>
                    ))}
                    {prereq.completedModules.map((moduleHash) => (
                      <AndamioBadge key={moduleHash} variant="default" className="text-xs font-mono bg-primary text-primary-foreground">
                        <SuccessIcon className="h-3 w-3 mr-1" />
                        {moduleHash.slice(0, 12)}...
                      </AndamioBadge>
                    ))}
                  </div>

                  {/* Link to course */}
                  <Link href={`/course/${prereq.courseId}`}>
                    <AndamioButton variant="outline" size="sm" className="mt-2">
                      <CourseIcon className="h-4 w-4 mr-2" />
                      Go to Course
                    </AndamioButton>
                  </Link>
                </div>
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

      {/* On-Chain Contributor Status */}
      {onChainContributor && (
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
                <AndamioText className="text-2xl font-bold">{onChainContributor.completed_tasks.length}</AndamioText>
                <AndamioText variant="small">Tasks Completed</AndamioText>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <AndamioText className="text-2xl font-bold text-muted-foreground">{onChainContributor.pending_tasks.length}</AndamioText>
                <AndamioText variant="small">Pending Review</AndamioText>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <AndamioText className="text-2xl font-bold text-primary">{onChainContributor.credentials.length}</AndamioText>
                <AndamioText variant="small">Credentials Earned</AndamioText>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Pending Task Status */}
      {contributorStatus === "task_pending" && (pendingTaskSubmission || onChainSubmission) && (() => {
        // Get task info from either source
        const taskId = onChainSubmission?.task.task_id ?? pendingTaskSubmission?.task_id ?? "";
        const taskLovelace = onChainSubmission?.task.lovelace_amount ?? pendingTaskSubmission?.lovelace_amount ?? 0;
        const txHash = onChainSubmission?.tx_hash;

        // Match on-chain submission to DB task
        const matchedDbTask = tasks.find(t =>
          getString(t.taskHash) === taskId ||
          (!getString(t.taskHash) && Number(t.lovelaceAmount) === taskLovelace)
        );

        return (
        <AndamioCard className="border-secondary">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-secondary">
              <PendingIcon className="h-5 w-5" />
              Task Pending Review
            </AndamioCardTitle>
            <AndamioCardDescription>
              Your submission is awaiting manager review. You can update your evidence below before the manager reviews it.
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
                <span className="text-muted-foreground">Task ID:</span>
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
              // Read-only view when waiting for transaction confirmation
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
              // Editable view when not pending confirmation
              <>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <EditIcon className="h-4 w-4 text-muted-foreground" />
                    <AndamioText className="font-medium">Update Your Evidence</AndamioText>
                  </div>
                  <AndamioText variant="small" className="text-muted-foreground">
                    Add or update your evidence before the manager reviews your submission. The evidence hash will be recorded on-chain.
                  </AndamioText>
                  <div className="min-h-[200px] border rounded-lg">
                    <ContentEditor
                      content={taskEvidence}
                      onContentChange={(content) => {
                        console.log("[Contributor] Task evidence updated:", {
                          hasContent: !!content,
                          contentLength: content?.content?.length,
                        });
                        setTaskEvidence(content);
                      }}
                    />
                  </div>
                  {/* Validation feedback */}
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

                {/* Task Action - Update evidence on-chain (only when not pending confirmation) */}
                <TaskAction
                  projectNftPolicyId={projectId}
                  taskHash={taskId}
                  taskCode={matchedDbTask ? `TASK_${matchedDbTask.index}` : "TASK"}
                  taskTitle={matchedDbTask?.title ?? undefined}
                  taskEvidence={taskEvidence ?? undefined}
                  onSuccess={async (result) => {
                    // Store tx hash for confirmation checking
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

                {confirmStatus === "confirmed" && confirmEvent && (
                  <div className="flex items-center gap-2 text-primary">
                    <SuccessIcon className="h-4 w-4" />
                    <AndamioText variant="small">
                      Confirmed at slot {confirmEvent.slot}
                    </AndamioText>
                  </div>
                )}

                {confirmStatus === "not_found" && (
                  <AndamioText variant="small" className="text-muted-foreground">
                    Transaction not yet indexed. The Gateway will update automatically once confirmed.
                  </AndamioText>
                )}

                {confirmStatus === "error" && (
                  <AndamioText variant="small" className="text-destructive">
                    Error checking confirmation status.
                  </AndamioText>
                )}

                <AndamioButton
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const result = await checkConfirmation();
                    if (result) {
                      toast.success("Transaction Confirmed!", {
                        description: `Confirmed at slot ${result.slot}. Gateway will update status shortly.`,
                      });
                      // Refresh data after confirmation
                      await refreshData();
                      // Clear pending tx hash
                      setPendingActionTxHash(null);
                    } else {
                      toast.info("Not yet confirmed", {
                        description: "Transaction not yet indexed. Try again in a few seconds.",
                      });
                    }
                  }}
                  disabled={confirmStatus === "checking"}
                >
                  {confirmStatus === "checking" ? (
                    <>
                      <LoadingIcon className="h-4 w-4 mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshIcon className="h-4 w-4 mr-2" />
                      Check Confirmation
                    </>
                  )}
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
              // Check if this task is the one that was accepted
              const taskHashStr = getString(task.taskHash);
              const isAcceptedTask = dbCommitment?.taskHash === taskHashStr && dbCommitment?.commitmentStatus === "ACCEPTED";
              const isSelectable = !isAcceptedTask;

              // Diagnostic logging for task data
              console.log("[Contributor] Task data:", {
                index: task.index,
                title: task.title,
                task_hash: taskHashStr,
                task_hash_length: taskHashStr.length,
                task_status: task.taskStatus,
                lovelace_amount: task.lovelaceAmount,
                isAcceptedTask,
                isSelectable,
              });

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
                    if (!isSelectable) return; // Don't allow selecting accepted tasks
                    console.log("[Contributor] Selected task:", {
                      index: task.index,
                      title: task.title,
                      task_hash: taskHashStr,
                      task_hash_length: taskHashStr.length,
                    });
                    // Clear evidence when selecting a different task
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
                          Your reward of {formatLovelace(task.lovelaceAmount ?? "0")} will be claimed with your next commitment
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
                  console.log("[Contributor] Evidence content changed:", {
                    hasContent: !!content,
                    contentType: content?.type,
                    contentLength: content?.content?.length,
                  });
                  setTaskEvidence(content);
                }}
              />
            </div>
            {/* Validation feedback */}
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
            {/* Debug info */}
            <AndamioText variant="small" className="text-muted-foreground font-mono text-xs">
              Debug: hasValidEvidence={String(hasValidEvidence)}, contentLength={taskEvidence?.content?.length ?? 0}
            </AndamioText>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* TaskCommit - Used for both enrollment AND subsequent commits
          The COMMIT transaction handles:
          1. Enrolling if not yet enrolled
          2. Claiming rewards from previous approved task (if any)
          3. Committing to the new task
      */}
      {eligibility?.eligible && (contributorStatus === "not_enrolled" || contributorStatus === "enrolled" || contributorStatus === "task_accepted") && selectedTask && (() => {
        // Diagnostic logging before rendering TaskCommit
        const isFirstCommit = contributorStatus === "not_enrolled";
        const hasApprovedTask = contributorStatus === "task_accepted";
        const selectedTaskHash = getString(selectedTask.taskHash);
        console.log("[Contributor] Rendering TaskCommit with:", {
          isFirstCommit,
          hasApprovedTask,
          willClaimRewards: hasApprovedTask,
          projectNftPolicyId: projectId,
          projectId_length: projectId.length,
          contributorStateId: contributorStateId,
          contributorStateId_length: contributorStateId?.length,
          taskHash: selectedTaskHash,
          taskHash_length: selectedTaskHash.length,
          taskCode: `TASK_${selectedTask.index}`,
          taskTitle: selectedTask.title,
          hasEvidence: !!taskEvidence,
          hasValidEvidence: hasValidEvidence,
          evidenceContentLength: taskEvidence?.content?.length,
        });
        return (
          <TaskCommit
            projectNftPolicyId={projectId}
            contributorStateId={contributorStateId ?? "0".repeat(56)}
            contributorStatePolicyId={getOnChainContributorStatePolicyId(selectedTask)}
            projectTitle={projectDetail.title || undefined}
            taskHash={getOnChainTaskId(selectedTask)}
            taskCode={`TASK_${selectedTask.index}`}
            taskTitle={selectedTask.title ?? undefined}
            taskEvidence={taskEvidence}
            isFirstCommit={isFirstCommit}
            willClaimRewards={hasApprovedTask}
            onSuccess={async () => {
              console.log("[Contributor] TaskCommit onSuccess triggered");
              setContributorStatus("task_pending");
              await refreshData();
            }}
          />
        );
      })()}

      {/* When contributor has approved task - show BOTH options:
          1. Commit to another task (claims rewards, stays enrolled)
          2. Claim credential (claims rewards, leaves project)
      */}
      {eligibility?.eligible && contributorStatus === "can_claim" && (
        <div className="space-y-4">
          {/* Option 1: Commit to Another Task */}
          {selectedTask && (
            <TaskCommit
              projectNftPolicyId={projectId}
              contributorStateId={contributorStateId ?? "0".repeat(56)}
              contributorStatePolicyId={getOnChainContributorStatePolicyId(selectedTask)}
              projectTitle={projectDetail.title || undefined}
              taskHash={getOnChainTaskId(selectedTask)}
              taskCode={`TASK_${selectedTask.index}`}
              taskTitle={selectedTask.title ?? undefined}
              taskEvidence={taskEvidence}
              isFirstCommit={false}
              willClaimRewards={true}
              onSuccess={async () => {
                console.log("[Contributor] TaskCommit (can_claim) onSuccess triggered");
                setContributorStatus("task_pending");
                await refreshData();
              }}
            />
          )}

          {/* Option 2: Claim Credential and Leave */}
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
              <AndamioText variant="small">Select a task, describe your approach, and commit on-chain. This automatically enrolls you in the project.</AndamioText>
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
              <AndamioText variant="small">A project manager reviews your work and approves, refuses, or denies it.</AndamioText>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">4</div>
            <div>
              <AndamioText className="font-medium">Earn Rewards & Keep Going</AndamioText>
              <AndamioText variant="small">When approved, your rewards become available. Commit to another task to claim them and continue, or claim your project credential to leave with your rewards.</AndamioText>
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
