"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioPageHeader, AndamioPageLoading, AndamioSectionHeader, AndamioBackButton, AndamioErrorAlert, AndamioDashboardStat } from "~/components/andamio";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentDisplay } from "~/components/content-display";
import { ContentEditor } from "~/components/editor";
import { PendingIcon, TokenIcon, TeacherIcon, EditIcon } from "~/components/icons";
import { type ProjectTaskV2Output, type CommitmentV2Output } from "~/types/generated";
import type { JSONContent } from "@tiptap/core";
import { formatLovelace } from "~/lib/cardano-utils";
import { getProject, type AndamioscanTask } from "~/lib/andamioscan-events";
import { TaskCommit } from "~/components/tx";

/**
 * Task Detail Page - Public view of a task with commitment functionality
 *
 * API Endpoints (V2):
 * - GET /project/user/task/:task_hash
 * - POST /project/contributor/commitment/get (protected)
 */
export default function TaskDetailPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const taskHash = params.taskhash as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [task, setTask] = useState<ProjectTaskV2Output | null>(null);
  const [commitment, setCommitment] = useState<CommitmentV2Output | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contributor state - in a real app this would come from on-chain data
  const [isEnrolled, setIsEnrolled] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contributorStateId, _setContributorStateId] = useState<string | null>(null);

  // On-chain task data from Andamioscan (for contributor_state_policy_id)
  const [onChainTask, setOnChainTask] = useState<AndamioscanTask | null>(null);

  // Evidence editor state
  const [evidence, setEvidence] = useState<JSONContent | null>(null);
  const [isEditingEvidence, setIsEditingEvidence] = useState(false);

  useEffect(() => {
    const fetchTaskAndCommitment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // V2 API: GET /project/user/task/:task_hash
        const taskResponse = await fetch(
          `/api/gateway/api/v2/project/user/task/${taskHash}`
        );

        if (!taskResponse.ok) {
          throw new Error("Failed to fetch task");
        }

        const taskData = (await taskResponse.json()) as ProjectTaskV2Output;
        setTask(taskData);

        // Fetch on-chain task from Andamioscan (for contributor_state_policy_id)
        // The taskHash in the URL is the task_id in Andamioscan
        try {
          const projectDetails = await getProject(projectId);
          if (projectDetails?.tasks) {
            const matchingTask = projectDetails.tasks.find((t: AndamioscanTask) => t.task_id === taskHash);
            if (matchingTask) {
              setOnChainTask(matchingTask);
            }
          }
        } catch (scanErr) {
          console.warn("Failed to fetch on-chain task from Andamioscan:", scanErr);
        }

        // If authenticated, fetch commitment status
        if (isAuthenticated) {
          try {
            const commitmentResponse = await authenticatedFetch(
              `/api/gateway/api/v2/project/contributor/commitment/get`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task_hash: taskHash }),
              }
            );

            if (commitmentResponse.ok) {
              const commitmentData = (await commitmentResponse.json()) as CommitmentV2Output;
              setCommitment(commitmentData);
            }
          } catch {
            // User might not have a commitment yet - that's OK
            console.log("No commitment found for user");
          }
        }
      } catch (err) {
        console.error("Error fetching task:", err);
        setError(err instanceof Error ? err.message : "Failed to load task");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchTaskAndCommitment();
  }, [projectId, taskHash, isAuthenticated, authenticatedFetch]);

  // Helper to format POSIX timestamp
  const formatTimestamp = (timestamp: string): string => {
    const ms = parseInt(timestamp);
    if (isNaN(ms)) return timestamp;
    return new Date(ms).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper to get commitment status variant
  const getCommitmentStatusVariant = (status: string): "default" | "secondary" | "outline" | "destructive" => {
    if (status.includes("ACCEPTED") || status === "REWARDS_CLAIMED") return "default";
    if (status.includes("DENIED") || status.includes("REFUSED")) return "destructive";
    if (status.includes("PENDING")) return "outline";
    return "secondary";
  };

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (error || !task) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={error ?? "Task not found"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            #{task.index}
          </AndamioBadge>
          <AndamioBadge variant="default">
            {task.task_status === "ON_CHAIN" ? "Live" : task.task_status}
          </AndamioBadge>
        </div>
      </div>

      {/* Task Title and Description */}
      <AndamioPageHeader
        title={task.title ?? "Untitled Task"}
        description={typeof task.content === "string" ? task.content : undefined}
      />

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AndamioDashboardStat
          icon={TokenIcon}
          label="Reward"
          value={formatLovelace(task.lovelace_amount ?? "0")}
          iconColor="success"
        />
        <AndamioDashboardStat
          icon={PendingIcon}
          label="Expires"
          value={formatTimestamp(task.expiration_time ?? "0")}
        />
        <AndamioDashboardStat
          icon={TeacherIcon}
          label="Created By"
          value={task.created_by_alias?.slice(0, 12) + "..." || "Unknown"}
          iconColor="info"
        />
      </div>

      {/* Task Hash */}
      <div className="p-3 bg-muted rounded-lg">
        <AndamioText variant="small" className="text-xs mb-1">Task Hash (On-Chain ID)</AndamioText>
        <AndamioText className="font-mono text-sm break-all">
          {typeof task.task_hash === "string" ? task.task_hash : taskHash}
        </AndamioText>
      </div>

      {/* Task Content */}
      {task.content_json && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Task Details</AndamioCardTitle>
            <AndamioCardDescription>Full task instructions and requirements</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <ContentDisplay content={task.content_json as JSONContent} />
          </AndamioCardContent>
        </AndamioCard>
      )}


      {/* Token Rewards (if any) */}
      {task.tokens && task.tokens.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Additional Token Rewards</AndamioCardTitle>
            <AndamioCardDescription>Native tokens included with this task</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="space-y-2">
              {task.tokens.map((token, idx) => {
                // NullableString types are generated as `object`, so cast to unknown first for type check
                const rawPolicyId = token.policy_id as unknown;
                const rawAssetName = token.asset_name as unknown;
                const policyId = typeof rawPolicyId === "string" ? rawPolicyId : "";
                const assetName = typeof rawAssetName === "string" ? rawAssetName : "";
                const displayName = assetName || (policyId ? policyId.slice(0, 16) : `Token ${idx + 1}`);
                return (
                  <div key={policyId || idx} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <AndamioText className="font-medium font-mono text-sm">
                        {displayName}
                      </AndamioText>
                    </div>
                    <AndamioBadge variant="outline">{token.quantity}</AndamioBadge>
                  </div>
                );
              })}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Commitment Status */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Your Commitment</AndamioCardTitle>
          <AndamioCardDescription>
            {isAuthenticated
              ? commitment
                ? "Track your progress on this task"
                : "Commit to this task to get started"
              : "Connect your wallet to commit to this task"}
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {!isAuthenticated ? (
            <div className="text-center py-6">
              <AndamioText variant="muted" className="mb-4">Connect your wallet to commit to this task</AndamioText>
            </div>
          ) : commitment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <AndamioText as="span" variant="small" className="font-medium">Status</AndamioText>
                <AndamioBadge variant={getCommitmentStatusVariant(commitment.commitment_status ?? "")}>
                  {(commitment.commitment_status ?? "").replace(/_/g, " ")}
                </AndamioBadge>
              </div>

              {typeof commitment.pending_tx_hash === "string" && commitment.pending_tx_hash && (
                <>
                  <AndamioSeparator />
                  <div>
                    <AndamioText variant="small" className="mb-1">Pending Transaction</AndamioText>
                    <AndamioText className="font-mono text-xs break-all">{commitment.pending_tx_hash}</AndamioText>
                  </div>
                </>
              )}

              {commitment.evidence && (
                <>
                  <AndamioSeparator />
                  <div>
                    <AndamioText variant="small" className="font-medium mb-2">Your Evidence</AndamioText>
                    <ContentDisplay
                      content={commitment.evidence as JSONContent}
                      variant="muted"
                    />
                  </div>
                </>
              )}

            </div>
          ) : (
            <div className="text-center py-6">
              <AndamioText variant="muted" className="mb-4">
                You haven&apos;t committed to this task yet
              </AndamioText>
              <AndamioButton
                variant="outline"
                onClick={() => setIsEditingEvidence(true)}
              >
                <EditIcon className="h-4 w-4 mr-2" />
                Start Commitment
              </AndamioButton>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* Evidence Editor and Transaction */}
      {isAuthenticated && !commitment && isEditingEvidence && (
        <div className="space-y-6">
          <AndamioSectionHeader
            title="Submit Your Evidence"
            icon={<EditIcon className="h-5 w-5" />}
          />

          {/* Evidence Editor */}
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Task Evidence</AndamioCardTitle>
              <AndamioCardDescription>
                Describe how you&apos;ll complete this task or provide your initial submission
              </AndamioCardDescription>
            </AndamioCardHeader>
            <AndamioCardContent>
              <ContentEditor
                content={evidence}
                onContentChange={setEvidence}
                showWordCount
              />
            </AndamioCardContent>
          </AndamioCard>

          {/* Transaction Component */}
          {evidence && Object.keys(evidence).length > 0 && (
            isEnrolled ? (
              <TaskCommit
                projectNftPolicyId={projectId}
                contributorStateId={contributorStateId ?? "0".repeat(56)}
                contributorStatePolicyId={onChainTask?.contributor_state_policy_id ?? "0".repeat(56)}
                taskHash={taskHash}
                taskCode={`TASK_${task.index}`}
                taskTitle={task.title ?? undefined}
                taskEvidence={evidence}
                onSuccess={async () => {
                  setIsEditingEvidence(false);
                  // Refetch commitment status
                  try {
                    const commitmentResponse = await authenticatedFetch(
                      `/api/gateway/api/v2/project/contributor/commitment/get`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ task_hash: taskHash }),
                      }
                    );
                    if (commitmentResponse.ok) {
                      const commitmentData = (await commitmentResponse.json()) as CommitmentV2Output;
                      setCommitment(commitmentData);
                    }
                  } catch {
                    // Handled by transaction component
                  }
                }}
              />
            ) : (
              <TaskCommit
                projectNftPolicyId={projectId}
                contributorStateId={contributorStateId ?? "0".repeat(56)}
                contributorStatePolicyId={onChainTask?.contributor_state_policy_id ?? "0".repeat(56)}
                taskHash={taskHash}
                taskCode={`TASK_${task.index}`}
                taskTitle={task.title ?? undefined}
                taskEvidence={evidence}
                isFirstCommit={true}
                onSuccess={async () => {
                  setIsEnrolled(true);
                  setIsEditingEvidence(false);
                  // Refetch commitment status
                  try {
                    const commitmentResponse = await authenticatedFetch(
                      `/api/gateway/api/v2/project/contributor/commitment/get`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ task_hash: taskHash }),
                      }
                    );
                    if (commitmentResponse.ok) {
                      const commitmentData = (await commitmentResponse.json()) as CommitmentV2Output;
                      setCommitment(commitmentData);
                    }
                  } catch {
                    // Handled by transaction component
                  }
                }}
              />
            )
          )}

          {/* Cancel Button */}
          <div className="flex justify-end">
            <AndamioButton
              variant="ghost"
              onClick={() => {
                setIsEditingEvidence(false);
                setEvidence(null);
              }}
            >
              Cancel
            </AndamioButton>
          </div>
        </div>
      )}
    </div>
  );
}
