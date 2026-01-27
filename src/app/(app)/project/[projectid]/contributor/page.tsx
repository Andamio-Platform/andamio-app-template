"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
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
import { type ProjectV2Output, type ProjectTaskV2Output } from "~/types/generated";
import { TaskCommit, ProjectCredentialClaim, TaskAction } from "~/components/tx";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProjectContributorStatus, getProject, type AndamioscanContributorStatus, type AndamioscanTask, type AndamioscanSubmission, type AndamioscanTaskSubmission } from "~/lib/andamioscan-events";
import { checkProjectEligibility, type EligibilityResult } from "~/lib/project-eligibility";
import { createCommitmentRecord, hexToText, confirmCommitmentTransaction } from "~/lib/project-commitment-sync";
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

// DB Commitment status type
type CommitmentV2Status =
  | "DRAFT"
  | "PENDING_TX_SUBMIT"
  | "SUBMITTED"
  | "PENDING_TX_ASSESS"
  | "ACCEPTED"
  | "REFUSED"
  | "DENIED"
  | "PENDING_TX_CLAIM"
  | "REWARDED"
  | "PENDING_TX_LEAVE"
  | "ABANDONED";

// DB Commitment output type (from /project/contributor/commitment/get)
// Uses camelCase for app-level consistency
type CommitmentV2Output = {
  taskHash: string;
  contributorAlias: string;
  taskCommitmentStatus: CommitmentV2Status;
  pendingTxHash?: string | null;
  evidence?: JSONContent | null;
  taskEvidenceHash?: string | null;
  assessedBy?: string | null;
  taskOutcome?: string | null;
  commitTxHash?: string | null;
  submitTxHash?: string | null;
  assessTxHash?: string | null;
  claimTxHash?: string | null;
};

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
  const { user, authenticatedFetch } = useAndamioAuth();

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

  // On-chain submission for current contributor (when pending task exists)
  const [onChainSubmission, setOnChainSubmission] = useState<AndamioscanSubmission | null>(null);
  // Pending task from contributor status API (has task details but no tx_hash)
  const [pendingTaskSubmission, setPendingTaskSubmission] = useState<AndamioscanTaskSubmission | null>(null);

  // DB commitment record for the current task
  const [dbCommitment, setDbCommitment] = useState<CommitmentV2Output | null>(null);

  // Last submitted task action tx hash (for confirmation checking)
  // This can come from either a new submission OR from DB commitment's pending_tx_hash
  const [pendingActionTxHash, setPendingActionTxHash] = useState<string | null>(null);

  // Event-based confirmation check
  const { status: confirmStatus, event: confirmEvent, checkOnce: checkConfirmation } = useTaskSubmitConfirmation(pendingActionTxHash);
  const [submissionHasDbRecord, setSubmissionHasDbRecord] = useState<boolean | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Eligibility state (prerequisites)
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);

  // Task evidence from editor
  const [taskEvidence, setTaskEvidence] = useState<JSONContent | null>(null);

  /**
   * Compute task hash from DB task data.
   * Uses the same algorithm as on-chain to reliably match DB tasks to on-chain tasks.
   */
  const computeTaskHashFromDb = (dbTask: ProjectTaskV2Output): string => {
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
  const getOnChainTaskId = (dbTask: ProjectTaskV2Output | null): string => {
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
  const getOnChainContributorStatePolicyId = (dbTask: ProjectTaskV2Output | null): string => {
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

  /**
   * Fetch the full commitment record from DB API
   * Returns the commitment with status, evidence, pending_tx_hash, etc.
   */
  const fetchDbCommitment = async (taskHash: string): Promise<CommitmentV2Output | null> => {
    try {
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/contributor/commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task_hash: taskHash }),
        }
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        console.warn("[Contributor] Failed to fetch commitment:", response.status);
        return null;
      }

      const commitment = (await response.json()) as CommitmentV2Output;
      console.log("[Contributor] Fetched DB commitment:", {
        task_hash: commitment.taskHash,
        commitment_status: commitment.taskCommitmentStatus,
        pending_tx_hash: commitment.pendingTxHash,
        hasEvidence: !!commitment.evidence,
      });
      return commitment;
    } catch (err) {
      console.error("[Contributor] Error fetching commitment:", err);
      return null;
    }
  };

  /**
   * Sync on-chain submission to database
   * Creates a commitment record from the on-chain data
   */
  const handleSyncSubmission = async () => {
    // Get task info from either source
    const taskId = onChainSubmission?.task.task_id ?? pendingTaskSubmission?.task_id;
    const txHash = onChainSubmission?.tx_hash ?? "";
    const submissionContent = onChainSubmission?.content ?? "";

    if (!taskId) {
      toast.error("No task ID found - cannot sync");
      return;
    }

    setIsSyncing(true);
    try {
      const evidence = submissionContent ? hexToText(submissionContent) : null;

      console.log("[Contributor] Syncing commitment to database...", {
        taskId,
        taskIdLength: taskId?.length,
        evidence: evidence?.slice(0, 50),
        txHash: txHash || "(not available)",
        txHashLength: txHash?.length,
        source: onChainSubmission ? "project_details" : "contributor_status",
      });

      // Create commitment record
      // Note: This requires the task to already exist in DB with its task_hash.
      // If this fails with "Task not found", the project manager needs to sync
      // task hashes first via Project Studio.
      const result = await createCommitmentRecord(
        taskId,
        evidence,
        txHash,
        authenticatedFetch
      );

      if (result.success) {
        console.log("[Contributor] Sync successful!");
        toast.success("Submission synced to database");
        setSubmissionHasDbRecord(true);
        // Refresh data
        await fetchData();
      } else {
        console.error("[Contributor] Sync failed:", result.error);
        // Check if it's a "Task not found" error - this means task hashes need to be synced first
        if (result.error?.includes("Task not found")) {
          toast.error("Task not found in database. Please ask the project manager to sync task hashes from Project Studio.");
        } else {
          toast.error(`Sync failed: ${result.error}`);
        }
      }
    } catch (err) {
      console.error("[Contributor] Sync error:", err);
      toast.error(`Sync error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchData = async () => {
    console.log("[Contributor] ========== FETCH DATA START ==========");
    console.log("[Contributor] Fetching data for projectId:", projectId, "length:", projectId.length);
    setIsLoading(true);
    setError(null);

    try {
      // V2 API: GET /project/user/project/:project_id
      const projectUrl = `/api/gateway/api/v2/project/user/project/${projectId}`;
      console.log("[Contributor] Fetching project from:", projectUrl);
      const projectResponse = await fetch(projectUrl);

      if (!projectResponse.ok) {
        console.error("[Contributor] Project fetch failed:", projectResponse.status);
        throw new Error(`Project not found (${projectResponse.status})`);
      }

      const projectData = (await projectResponse.json()) as ProjectV2Output;
      console.log("[Contributor] Project data received:", {
        title: getString(projectData.title),
        statesCount: projectData.states?.length,
        states: projectData.states?.map(s => ({
          project_state_policy_id: getString(s.projectNftPolicyId),
          project_state_policy_id_length: getString(s.projectNftPolicyId).length,
        })),
      });
      setProject(projectData);

      // V2 API: POST /project/user/tasks/list with {project_id} in body
      if (projectData.states && projectData.states.length > 0) {
        const projectStatePolicyId = getString(projectData.states[0]?.projectNftPolicyId);
        console.log("[Contributor] Project state policy ID:", projectStatePolicyId, "length:", projectStatePolicyId.length);
        if (projectStatePolicyId) {
          setContributorStateId(projectStatePolicyId);

          const tasksUrl = `/api/gateway/api/v2/project/user/tasks/list`;
          console.log("[Contributor] Fetching tasks from:", tasksUrl);
          const tasksResponse = await fetch(tasksUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ project_id: projectStatePolicyId }),
          });

          if (tasksResponse.ok) {
            const tasksData = (await tasksResponse.json()) as ProjectTaskV2Output[];
            console.log("[Contributor] Tasks received:", tasksData?.length, "tasks");
            console.log("[Contributor] Tasks detail:", tasksData?.map(t => ({
              index: t.index,
              title: t.title,
              task_hash: getString(t.taskHash),
              task_hash_length: getString(t.taskHash).length,
              task_status: t.taskStatus,
              lovelace_amount: t.lovelaceAmount,
            })));
            setTasks(tasksData ?? []);
            // Select first available task by default
            const liveTasks = tasksData.filter((t) => t.taskStatus === "ON_CHAIN");
            console.log("[Contributor] Live tasks (ON_CHAIN):", liveTasks.length);
            if (liveTasks.length > 0 && !selectedTask) {
              const firstTask = liveTasks[0];
              console.log("[Contributor] Auto-selecting first task:", {
                index: firstTask?.index,
                task_hash: getString(firstTask?.taskHash),
                task_hash_length: getString(firstTask?.taskHash).length,
              });
              setSelectedTask(firstTask ?? null);
            }
          } else {
            console.error("[Contributor] Tasks fetch failed:", tasksResponse.status);
          }
        }
      } else {
        console.log("[Contributor] No project states found");
      }

      // Fetch on-chain project details from Andamioscan (for task_id lookup and submission data)
      let onChainProjectDetails = null;
      try {
        console.log("[Contributor] Fetching on-chain project details from Andamioscan...");
        onChainProjectDetails = await getProject(projectId);
        if (onChainProjectDetails?.tasks) {
          console.log("[Contributor] On-chain tasks found:", onChainProjectDetails.tasks.length);
          console.log("[Contributor] On-chain tasks:", onChainProjectDetails.tasks.map(t => ({
            task_id: t.task_id,
            task_id_length: t.task_id.length,
            content: t.content.slice(0, 20) + "...",
            lovelace_amount: t.lovelace_amount,
          })));
          setOnChainTasks(onChainProjectDetails.tasks);
        }
        if (onChainProjectDetails?.submissions) {
          console.log("[Contributor] On-chain submissions found:", onChainProjectDetails.submissions.length);
        }
      } catch (err) {
        console.error("[Contributor] Error fetching on-chain project details:", err);
        // Non-fatal - continue without on-chain data
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
              // Get the pending task submission data directly from contributor status
              const pendingTask = contributorData.tasks_submitted[0];

              // Fetch full commitment record from DB FIRST to check actual status
              let commitment: CommitmentV2Output | null = null;
              if (pendingTask) {
                commitment = await fetchDbCommitment(pendingTask.task_id);
              }

              // Check if DB says task is actually ACCEPTED (Andamioscan may be out of sync)
              if (commitment?.taskCommitmentStatus === "ACCEPTED") {
                console.log("[Contributor] Andamioscan shows pending, but DB shows ACCEPTED - using DB status");
                console.log("[Contributor] Status: task_accepted (DB override)");
                setContributorStatus("task_accepted");
                setDbCommitment(commitment);
                setSubmissionHasDbRecord(true);
                // DON'T pre-populate evidence - user needs fresh evidence for the NEW task
                // Clear any existing evidence so they start fresh
                setTaskEvidence(null);

                // Auto-select the first available (non-accepted) task
                const acceptedTaskHash = commitment.taskHash;
                const availableTasks = tasks.filter(t => t.taskStatus === "ON_CHAIN" && getString(t.taskHash) !== acceptedTaskHash);
                if (availableTasks.length > 0) {
                  console.log("[Contributor] Auto-selecting first available task:", availableTasks[0]?.title);
                  setSelectedTask(availableTasks[0] ?? null);
                }
              } else {
                // Normal pending flow
                console.log("[Contributor] Status: task_pending");
                setContributorStatus("task_pending");

                if (pendingTask) {
                  console.log("[Contributor] Pending task submission from contributor status:", {
                    task_id: pendingTask.task_id,
                    content: pendingTask.content,
                    lovelace_amount: pendingTask.lovelace_amount,
                  });
                  setPendingTaskSubmission(pendingTask);

                  if (commitment) {
                    console.log("[Contributor] DB commitment found:", {
                      commitment_status: commitment.taskCommitmentStatus,
                      pending_tx_hash: commitment.pendingTxHash,
                      hasEvidence: !!commitment.evidence,
                    });
                    setDbCommitment(commitment);
                    setSubmissionHasDbRecord(true);

                    // If commitment is PENDING_TX_SUBMIT, populate pendingActionTxHash for confirmation checking
                    if (commitment.taskCommitmentStatus === "PENDING_TX_SUBMIT" && commitment.pendingTxHash) {
                      console.log("[Contributor] Setting pendingActionTxHash from DB:", commitment.pendingTxHash);
                      setPendingActionTxHash(commitment.pendingTxHash);
                    }

                    // Pre-populate evidence editor with saved evidence
                    if (commitment.evidence) {
                      setTaskEvidence(commitment.evidence);
                    }
                  } else {
                    console.log("[Contributor] No DB commitment found");
                    setSubmissionHasDbRecord(false);
                  }

                  // Also try to find full submission in project details for tx_hash
                  if (onChainProjectDetails?.submissions) {
                    const mySubmission = onChainProjectDetails.submissions.find(
                      (s) => s.alias === user.accessTokenAlias &&
                             s.task.task_id === pendingTask.task_id
                    );
                    if (mySubmission) {
                      console.log("[Contributor] Found full submission with tx_hash:", mySubmission.tx_hash);
                      setOnChainSubmission(mySubmission);
                    }
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
                  (s) => s.alias === user.accessTokenAlias
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

                  // Fetch full commitment record from DB
                  const commitment = await fetchDbCommitment(mySubmission.task.task_id);
                  if (commitment) {
                    console.log("[Contributor] FALLBACK: DB commitment found:", {
                      commitment_status: commitment.taskCommitmentStatus,
                      pending_tx_hash: commitment.pendingTxHash,
                    });
                    setDbCommitment(commitment);
                    setSubmissionHasDbRecord(true);
                    if (commitment.taskCommitmentStatus === "PENDING_TX_SUBMIT" && commitment.pendingTxHash) {
                      setPendingActionTxHash(commitment.pendingTxHash);
                    }
                    if (commitment.evidence) {
                      setTaskEvidence(commitment.evidence);
                    }
                  } else {
                    setSubmissionHasDbRecord(false);
                  }
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
                (s) => s.alias === user.accessTokenAlias
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
                  alias: user.accessTokenAlias,
                  project_id: projectId,
                  joined_at: 0,
                  completed_tasks: [],
                  pending_tasks: [mySubmission.task.task_id],
                  tasks_submitted: [],
                  tasks_accepted: [],
                  credentials: [],
                });

                // Fetch full commitment record from DB
                const commitment = await fetchDbCommitment(mySubmission.task.task_id);
                if (commitment) {
                  console.log("[Contributor] FALLBACK: DB commitment found:", {
                    commitment_status: commitment.taskCommitmentStatus,
                    pending_tx_hash: commitment.pendingTxHash,
                  });
                  setDbCommitment(commitment);
                  setSubmissionHasDbRecord(true);
                  if (commitment.taskCommitmentStatus === "PENDING_TX_SUBMIT" && commitment.pendingTxHash) {
                    setPendingActionTxHash(commitment.pendingTxHash);
                  }
                  if (commitment.evidence) {
                    setTaskEvidence(commitment.evidence);
                  }
                } else {
                  setSubmissionHasDbRecord(false);
                }
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
              (s) => s.alias === user?.accessTokenAlias
            );
            if (mySubmission) {
              console.log("[Contributor] FALLBACK after error: Found submission:", {
                task_id: mySubmission.task.task_id,
                tx_hash: mySubmission.tx_hash,
              });
              setContributorStatus("task_pending");
              setOnChainSubmission(mySubmission);
              setOnChainContributor({
                alias: user?.accessTokenAlias ?? "",
                project_id: projectId,
                joined_at: 0,
                completed_tasks: [],
                pending_tasks: [mySubmission.task.task_id],
                tasks_submitted: [],
                tasks_accepted: [],
                credentials: [],
              });

              // Fetch full commitment record from DB
              const commitment = await fetchDbCommitment(mySubmission.task.task_id);
              if (commitment) {
                console.log("[Contributor] FALLBACK after error: DB commitment found:", {
                  commitment_status: commitment.taskCommitmentStatus,
                  pending_tx_hash: commitment.pendingTxHash,
                });
                setDbCommitment(commitment);
                setSubmissionHasDbRecord(true);
                if (commitment.taskCommitmentStatus === "PENDING_TX_SUBMIT" && commitment.pendingTxHash) {
                  setPendingActionTxHash(commitment.pendingTxHash);
                }
                if (commitment.evidence) {
                  setTaskEvidence(commitment.evidence);
                }
              } else {
                setSubmissionHasDbRecord(false);
              }
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
        description={getString(project.title) || undefined}
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

      {/* On-Chain Submission Without DB Record - Show sync option */}
      {contributorStatus === "task_pending" && (pendingTaskSubmission || onChainSubmission) && submissionHasDbRecord === false && (() => {
        // Get task details from either source
        const taskId = onChainSubmission?.task.task_id ?? pendingTaskSubmission?.task_id ?? "";
        const taskLovelace = onChainSubmission?.task.lovelace_amount ?? pendingTaskSubmission?.lovelace_amount ?? 0;
        const txHash = onChainSubmission?.tx_hash;
        const submissionContent = onChainSubmission?.content ?? "";

        // Match to DB task
        const matchedDbTask = tasks.find(t =>
          getString(t.taskHash) === taskId ||
          (!getString(t.taskHash) && Number(t.lovelaceAmount) === taskLovelace)
        );

        return (
        <AndamioCard className="border-muted-foreground">
          <AndamioCardHeader>
            <AndamioCardTitle className="flex items-center gap-2 text-muted-foreground">
              <AlertIcon className="h-5 w-5" />
              On-Chain Submission Found
            </AndamioCardTitle>
            <AndamioCardDescription>
              Your task commitment exists on-chain but wasn&apos;t saved to the database.
              This can happen if the transaction succeeded but the confirmation step failed.
              Verify this is your submission and sync it to continue.
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

            {/* Submission Details */}
            <div className="space-y-3 p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <OnChainIcon className="h-4 w-4 text-primary" />
                <AndamioText variant="small" className="font-medium">On-Chain Data</AndamioText>
              </div>

              <div className="grid gap-2 text-sm">
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
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submitted by:</span>
                  <span className="font-mono text-xs">{user?.accessTokenAlias}</span>
                </div>
              </div>

              {/* Evidence Preview */}
              {submissionContent && (
                <div className="pt-2 border-t">
                  <AndamioText variant="small" className="text-muted-foreground mb-2">Your Evidence (hex-decoded):</AndamioText>
                  <div className="p-2 bg-background rounded border text-sm">
                    {hexToText(submissionContent) || <span className="text-muted-foreground italic">Unable to decode evidence</span>}
                  </div>
                </div>
              )}
            </div>

            {/* Warning if no tx_hash - we can't fully sync without it */}
            {!txHash && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/10 border border-muted-foreground/20">
                <AlertIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <AndamioText variant="small">
                  Transaction hash not found. The sync may not complete fully.
                  Check <a href={`https://preprod.andamioscan.io/view/project/${projectId}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Andamioscan</a> for your submission details.
                </AndamioText>
              </div>
            )}

            {/* Verification Note */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/10 border border-secondary/20">
              <AlertIcon className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
              <AndamioText variant="small">
                This submission was found on-chain for your alias: <strong className="font-mono">{user?.accessTokenAlias}</strong>
              </AndamioText>
            </div>

            {/* Sync Button */}
            <AndamioButton
              onClick={handleSyncSubmission}
              disabled={isSyncing || !taskId}
              className="w-full"
            >
              {isSyncing ? (
                <>
                  <RefreshIcon className="h-4 w-4 mr-2 animate-spin" />
                  Syncing to Database...
                </>
              ) : (
                <>
                  <RefreshIcon className="h-4 w-4 mr-2" />
                  Sync Submission to Database
                </>
              )}
            </AndamioButton>
          </AndamioCardContent>
        </AndamioCard>
        );
      })()}

      {/* Pending Task Status - When DB record exists */}
      {contributorStatus === "task_pending" && (pendingTaskSubmission || onChainSubmission) && submissionHasDbRecord === true && (() => {
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
            {dbCommitment?.taskCommitmentStatus === "PENDING_TX_SUBMIT" ? (
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
                    await fetchData();
                  }}
                />
              </>
            )}

            {/* Check Confirmation via Andamioscan Events API */}
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
                    Transaction not yet indexed by Andamioscan. Try again in a few seconds.
                  </AndamioText>
                )}

                {confirmStatus === "error" && (
                  <AndamioText variant="small" className="text-destructive">
                    Error checking confirmation. Please try again.
                  </AndamioText>
                )}

                <AndamioButton
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const result = await checkConfirmation();
                    if (result) {
                      // Transaction confirmed on-chain - now update DB
                      const taskHash = dbCommitment?.taskHash ?? result.task?.task_id;
                      if (taskHash && pendingActionTxHash) {
                        const confirmResult = await confirmCommitmentTransaction(
                          taskHash,
                          pendingActionTxHash,
                          authenticatedFetch
                        );
                        if (confirmResult.success) {
                          toast.success("Transaction Confirmed!", {
                            description: `Confirmed at slot ${result.slot}. Database updated.`,
                          });
                        } else {
                          toast.warning("On-chain confirmed, DB update failed", {
                            description: confirmResult.error ?? "Please try syncing again",
                          });
                        }
                      } else {
                        toast.success("Transaction Confirmed!", {
                          description: `Confirmed at slot ${result.slot}`,
                        });
                      }
                      // Refresh data after confirmation
                      await fetchData();
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
              const isAcceptedTask = dbCommitment?.taskHash === taskHashStr && dbCommitment?.taskCommitmentStatus === "ACCEPTED";
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
            projectTitle={getString(project.title) || undefined}
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
              contributorStatePolicyId={getOnChainContributorStatePolicyId(selectedTask)}
              projectTitle={getString(project.title) || undefined}
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
            projectTitle={getString(project.title) || undefined}
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
