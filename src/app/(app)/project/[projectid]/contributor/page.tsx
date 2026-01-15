"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
import { type ProjectV2Output, type ProjectTaskV2Output } from "@andamio/db-api-types";
import { TaskCommit, ProjectCredentialClaim } from "~/components/transactions";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProjectContributorStatus, getProject, type AndamioscanContributorStatus, type AndamioscanTask } from "~/lib/andamioscan";
import { checkProjectEligibility, type EligibilityResult } from "~/lib/project-eligibility";
import { ContentEditor } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";
import { EditIcon } from "~/components/icons";

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

  const [project, setProject] = useState<ProjectV2Output | null>(null);
  const [tasks, setTasks] = useState<ProjectTaskV2Output[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On-chain contributor state
  const [contributorStatus, setContributorStatus] = useState<ContributorStatus>("not_enrolled");
  const [onChainContributor, setOnChainContributor] = useState<AndamioscanContributorStatus | null>(null);
  const [contributorStateId, setContributorStateId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTaskV2Output | null>(null);

  // On-chain tasks from Andamioscan (for task_id lookup)
  const [onChainTasks, setOnChainTasks] = useState<AndamioscanTask[]>([]);

  // Eligibility state (prerequisites)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Task evidence from editor
  const [taskEvidence, setTaskEvidence] = useState<JSONContent | null>(null);

  /**
   * Get the on-chain task_id for a selected task.
   * Matches DB task with on-chain task by:
   * 1. Existing task_hash (if already in DB)
   * 2. Lovelace amount (if unique)
   * 3. Task index (fallback)
   */
  const getOnChainTaskId = (dbTask: ProjectTaskV2Output | null): string => {
    if (!dbTask) return "";

    // If DB already has task_hash, use it
    if (dbTask.task_hash?.length === 64) {
      return dbTask.task_hash;
    }

    // Try to match with on-chain task
    if (onChainTasks.length === 0) return "";

    // Match by lovelace amount (most reliable if unique)
    const matchByLovelace = onChainTasks.find(
      (t) => t.lovelace === Number(dbTask.lovelace)
    );
    if (matchByLovelace) {
      console.log("[Contributor] Matched task by lovelace:", {
        dbLovelace: dbTask.lovelace,
        onChainTaskId: matchByLovelace.task_id,
      });
      return matchByLovelace.task_id;
    }

    // Fallback: match by index (assuming same order)
    const taskIndex = dbTask.index ?? 0;
    if (taskIndex < onChainTasks.length) {
      const matchByIndex = onChainTasks[taskIndex];
      if (matchByIndex) {
        console.log("[Contributor] Matched task by index:", {
          index: taskIndex,
          onChainTaskId: matchByIndex.task_id,
        });
        return matchByIndex.task_id;
      }
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

  const fetchData = async () => {
    console.log("[Contributor] ========== FETCH DATA START ==========");
    console.log("[Contributor] Fetching data for projectId:", projectId, "length:", projectId.length);
    setIsLoading(true);
    setError(null);

    try {
      // V2 API: GET /project-v2/public/project/:project_id
      const projectUrl = `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/public/project/${projectId}`;
      console.log("[Contributor] Fetching project from:", projectUrl);
      const projectResponse = await fetch(projectUrl);

      if (!projectResponse.ok) {
        console.error("[Contributor] Project fetch failed:", projectResponse.status);
        throw new Error(`Project not found (${projectResponse.status})`);
      }

      const projectData = (await projectResponse.json()) as ProjectV2Output;
      console.log("[Contributor] Project data received:", {
        title: projectData.title,
        statesCount: projectData.states?.length,
        states: projectData.states?.map(s => ({
          project_state_policy_id: s.project_state_policy_id,
          project_state_policy_id_length: s.project_state_policy_id?.length,
        })),
      });
      setProject(projectData);

      // V2 API: GET /project-v2/public/tasks/:project_state_policy_id
      if (projectData.states && projectData.states.length > 0) {
        const projectStatePolicyId = projectData.states[0]?.project_state_policy_id;
        console.log("[Contributor] Project state policy ID:", projectStatePolicyId, "length:", projectStatePolicyId?.length);
        if (projectStatePolicyId) {
          setContributorStateId(projectStatePolicyId);

          const tasksUrl = `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/public/tasks/${projectStatePolicyId}`;
          console.log("[Contributor] Fetching tasks from:", tasksUrl);
          const tasksResponse = await fetch(tasksUrl);

          if (tasksResponse.ok) {
            const tasksData = (await tasksResponse.json()) as ProjectTaskV2Output[];
            console.log("[Contributor] Tasks received:", tasksData?.length, "tasks");
            console.log("[Contributor] Tasks detail:", tasksData?.map(t => ({
              index: t.index,
              title: t.title,
              task_hash: t.task_hash,
              task_hash_length: t.task_hash?.length,
              status: t.status,
              lovelace: t.lovelace,
            })));
            setTasks(tasksData ?? []);
            // Select first available task by default
            const liveTasks = tasksData.filter((t) => t.status === "ON_CHAIN");
            console.log("[Contributor] Live tasks (ON_CHAIN):", liveTasks.length);
            if (liveTasks.length > 0 && !selectedTask) {
              console.log("[Contributor] Auto-selecting first task:", {
                index: liveTasks[0]?.index,
                task_hash: liveTasks[0]?.task_hash,
                task_hash_length: liveTasks[0]?.task_hash?.length,
              });
              setSelectedTask(liveTasks[0] ?? null);
            }
          } else {
            console.error("[Contributor] Tasks fetch failed:", tasksResponse.status);
          }
        }
      } else {
        console.log("[Contributor] No project states found");
      }

      // Fetch on-chain tasks from Andamioscan (for task_id lookup)
      try {
        console.log("[Contributor] Fetching on-chain tasks from Andamioscan...");
        const onChainProjectDetails = await getProject(projectId);
        if (onChainProjectDetails?.tasks) {
          console.log("[Contributor] On-chain tasks found:", onChainProjectDetails.tasks.length);
          console.log("[Contributor] On-chain tasks:", onChainProjectDetails.tasks.map(t => ({
            task_id: t.task_id,
            task_id_length: t.task_id.length,
            content: t.content.slice(0, 20) + "...",
            lovelace: t.lovelace,
          })));
          setOnChainTasks(onChainProjectDetails.tasks);
        }
      } catch (err) {
        console.error("[Contributor] Error fetching on-chain tasks:", err);
        // Non-fatal - continue without on-chain task data
      }

      // Fetch on-chain contributor status and eligibility if user is authenticated
      if (user?.accessTokenAlias) {
        console.log("[Contributor] User authenticated, checking status. Alias:", user.accessTokenAlias);
        setIsCheckingEligibility(true);

        // Check contributor status from Andamioscan
        try {
          console.log("[Contributor] Fetching contributor status from Andamioscan...");
          const contributorData = await getProjectContributorStatus(projectId, user.accessTokenAlias);
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
              console.log("[Contributor] Status: task_pending");
              setContributorStatus("task_pending");
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
              console.log("[Contributor] Status: enrolled");
              setContributorStatus("enrolled");
            }
          } else {
            console.log("[Contributor] Status: not_enrolled (no contributor data)");
            setContributorStatus("not_enrolled");
          }
        } catch (contributorError) {
          // User not a contributor yet
          console.log("[Contributor] Status: not_enrolled (fetch error):", contributorError);
          setContributorStatus("not_enrolled");
        }

        // Check prerequisites eligibility
        try {
          console.log("[Contributor] Checking prerequisites eligibility...");
          const eligibilityResult = await checkProjectEligibility(projectId, user.accessTokenAlias);
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
        console.log("[Contributor] ========== FETCH DATA COMPLETE ==========");
      } else {
        console.log("[Contributor] User not authenticated, skipping contributor checks");
      }

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={error ?? "Project not found"} />
      </div>
    );
  }

  const liveTasks = tasks.filter((t) => t.status === "ON_CHAIN");

  // Stats
  const stats = {
    totalTasks: liveTasks.length,
    totalRewards: liveTasks.reduce((sum, t) => sum + (parseInt(t.lovelace ?? "0", 10) || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Contributor Dashboard"
        description={project.title ?? undefined}
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
        <AndamioCard className="border-warning">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-warning">
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
                  className="h-full bg-warning transition-all"
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
                      <AndamioBadge key={moduleHash} variant="default" className="text-xs font-mono bg-success text-success-foreground">
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
        <AndamioCard className="border-success">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-success">
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
                <AndamioText className="text-2xl font-bold text-warning">{onChainContributor.pending_tasks.length}</AndamioText>
                <AndamioText variant="small">Pending Review</AndamioText>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <AndamioText className="text-2xl font-bold text-success">{onChainContributor.credentials.length}</AndamioText>
                <AndamioText variant="small">Credentials Earned</AndamioText>
              </div>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Task Selection - Only show when eligible */}
      {eligibility?.eligible && liveTasks.length > 0 && (
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
              // Diagnostic logging for task data
              console.log("[Contributor] Task data:", {
                index: task.index,
                title: task.title,
                task_hash: task.task_hash,
                task_hash_length: task.task_hash?.length,
                status: task.status,
                lovelace: task.lovelace,
              });

              return (
                <div
                  key={task.task_hash ?? task.index}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedTask?.task_hash === task.task_hash
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => {
                    console.log("[Contributor] Selected task:", {
                      index: task.index,
                      title: task.title,
                      task_hash: task.task_hash,
                      task_hash_length: task.task_hash?.length,
                    });
                    setSelectedTask(task);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <AndamioText as="div" className="font-medium">{task.title}</AndamioText>
                      <AndamioText variant="small">{task.content}</AndamioText>
                      {/* Debug: Show task_hash for debugging */}
                      <AndamioText variant="small" className="text-muted-foreground font-mono text-xs">
                        Hash: {task.task_hash ? `${task.task_hash.slice(0, 16)}... (${task.task_hash.length} chars)` : "NONE"}
                      </AndamioText>
                    </div>
                    <AndamioBadge variant="outline">
                      {formatLovelace(task.lovelace)}
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
              <AndamioText variant="small" className="text-warning">
                Please provide evidence describing your approach to this task.
              </AndamioText>
            )}
            {hasValidEvidence && (
              <AndamioText variant="small" className="text-success flex items-center gap-1">
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
        console.log("[Contributor] Rendering TaskCommit with:", {
          isFirstCommit,
          hasApprovedTask,
          willClaimRewards: hasApprovedTask,
          projectNftPolicyId: projectId,
          projectId_length: projectId.length,
          contributorStateId: contributorStateId,
          contributorStateId_length: contributorStateId?.length,
          taskHash: selectedTask.task_hash,
          taskHash_length: selectedTask.task_hash?.length,
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
            projectTitle={project.title ?? undefined}
            taskHash={getOnChainTaskId(selectedTask)}
            taskCode={`TASK_${selectedTask.index}`}
            taskTitle={selectedTask.title ?? undefined}
            taskEvidence={taskEvidence}
            isFirstCommit={isFirstCommit}
            willClaimRewards={hasApprovedTask}
            onSuccess={async () => {
              console.log("[Contributor] TaskCommit onSuccess triggered");
              setContributorStatus("task_pending");
              await fetchData();
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
              projectTitle={project.title ?? undefined}
              taskHash={getOnChainTaskId(selectedTask)}
              taskCode={`TASK_${selectedTask.index}`}
              taskTitle={selectedTask.title ?? undefined}
              taskEvidence={taskEvidence}
              isFirstCommit={false}
              willClaimRewards={true}
              onSuccess={async () => {
                console.log("[Contributor] TaskCommit (can_claim) onSuccess triggered");
                setContributorStatus("task_pending");
                await fetchData();
              }}
            />
          )}

          {/* Option 2: Claim Credential and Leave */}
          <ProjectCredentialClaim
            projectNftPolicyId={projectId}
            contributorStateId={contributorStateId ?? "0".repeat(56)}
            projectTitle={project.title ?? undefined}
            onSuccess={async () => {
              await fetchData();
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success font-bold">4</div>
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
