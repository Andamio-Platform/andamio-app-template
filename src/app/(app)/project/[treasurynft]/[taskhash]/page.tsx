"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioPageHeader, AndamioPageLoading, AndamioSectionHeader, AndamioBackButton, AndamioErrorAlert, AndamioDashboardStat } from "~/components/andamio";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentDisplay } from "~/components/content-display";
import { ContentEditor } from "~/components/editor";
import { SuccessIcon, PendingIcon, TokenIcon, TaskIcon, TeacherIcon, EditIcon } from "~/components/icons";
import { type CreateTaskOutput, type GetTaskCommitmentByTaskHashOutput } from "@andamio/db-api";
import type { JSONContent } from "@tiptap/core";
import { formatLovelace } from "~/lib/cardano-utils";
import { ProjectEnroll, TaskCommit } from "~/components/transactions";

type TaskListOutput = CreateTaskOutput[];

/**
 * Task Detail Page - Public view of a task with commitment functionality
 *
 * API Endpoints:
 * - POST /tasks/list (public) - Get task by filtering
 * - POST /task-commitments/get (protected) - Get user's commitment
 */
export default function TaskDetailPage() {
  const params = useParams();
  const treasuryNftPolicyId = params.treasurynft as string;
  const taskHash = params.taskhash as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [task, setTask] = useState<CreateTaskOutput | null>(null);
  const [commitment, setCommitment] = useState<GetTaskCommitmentByTaskHashOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contributor state - in a real app this would come from on-chain data
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [contributorStateId, setContributorStateId] = useState<string | null>(null);

  // Evidence editor state
  const [evidence, setEvidence] = useState<JSONContent | null>(null);
  const [isEditingEvidence, setIsEditingEvidence] = useState(false);

  useEffect(() => {
    const fetchTaskAndCommitment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all tasks for this project
        const tasksResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/tasks/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ treasury_nft_policy_id: treasuryNftPolicyId }),
          }
        );

        if (!tasksResponse.ok) {
          throw new Error("Failed to fetch tasks");
        }

        const tasks = (await tasksResponse.json()) as TaskListOutput;
        const taskData = tasks.find((t) => t.task_hash === taskHash);

        if (!taskData) {
          throw new Error("Task not found");
        }

        setTask(taskData);

        // If authenticated, fetch commitment status
        if (isAuthenticated) {
          try {
            const commitmentResponse = await authenticatedFetch(
              `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/task-commitments/get`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task_hash: taskHash }),
              }
            );

            if (commitmentResponse.ok) {
              const commitmentData = (await commitmentResponse.json()) as GetTaskCommitmentByTaskHashOutput;
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
  }, [treasuryNftPolicyId, taskHash, isAuthenticated, authenticatedFetch]);

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
        <AndamioBackButton href={`/project/${treasuryNftPolicyId}`} label="Back to Project" />
        <AndamioErrorAlert error={error ?? "Task not found"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <AndamioBackButton href={`/project/${treasuryNftPolicyId}`} label="Back to Project" />
        <div className="flex items-center gap-2">
          <AndamioBadge variant="outline" className="font-mono text-xs">
            #{task.index}
          </AndamioBadge>
          <AndamioBadge variant="default">
            {task.status === "ON_CHAIN" ? "Live" : task.status}
          </AndamioBadge>
        </div>
      </div>

      {/* Task Title and Description */}
      <AndamioPageHeader
        title={task.title}
        description={task.description}
      />

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <AndamioDashboardStat
          icon={TokenIcon}
          label="Reward"
          value={formatLovelace(task.lovelace)}
          iconColor="success"
        />
        <AndamioDashboardStat
          icon={PendingIcon}
          label="Expires"
          value={formatTimestamp(task.expiration_time)}
        />
        <AndamioDashboardStat
          icon={TeacherIcon}
          label="Commitments"
          value={`${task.num_allocated_commitments} / ${task.num_allowed_commitments}`}
          iconColor="info"
        />
        <AndamioDashboardStat
          icon={TaskIcon}
          label="Criteria"
          value={`${task.acceptance_criteria.length} items`}
        />
      </div>

      {/* Task Hash */}
      <div className="p-3 bg-muted rounded-lg">
        <AndamioText variant="small" className="text-xs mb-1">Task Hash (On-Chain ID)</AndamioText>
        <AndamioText className="font-mono text-sm break-all">{task.task_hash}</AndamioText>
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

      {/* Acceptance Criteria */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Acceptance Criteria</AndamioCardTitle>
          <AndamioCardDescription>What you need to deliver to complete this task</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <ul className="space-y-2">
            {task.acceptance_criteria.map((criterion, index) => (
              <li key={index} className="flex items-start gap-2">
                <SuccessIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                <AndamioText as="span">{criterion}</AndamioText>
              </li>
            ))}
          </ul>
        </AndamioCardContent>
      </AndamioCard>

      {/* Token Rewards (if any) */}
      {task.tokens && task.tokens.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Additional Token Rewards</AndamioCardTitle>
            <AndamioCardDescription>Native tokens included with this task</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="space-y-2">
              {task.tokens.map((token) => (
                <div key={token.subject} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <AndamioText className="font-medium">
                      {token.name ?? token.asset_name_decoded ?? token.asset_name}
                    </AndamioText>
                    {token.ticker && (
                      <AndamioText variant="small">{token.ticker}</AndamioText>
                    )}
                  </div>
                  <AndamioBadge variant="outline">{token.quantity}</AndamioBadge>
                </div>
              ))}
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
                <AndamioBadge variant={getCommitmentStatusVariant(commitment.status)}>
                  {commitment.status.replace(/_/g, " ")}
                </AndamioBadge>
              </div>

              {commitment.pending_tx_hash && (
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

              <AndamioSeparator />

              <div className="flex justify-between">
                <AndamioText variant="small">Started: {new Date(commitment.created).toLocaleDateString()}</AndamioText>
                <AndamioText variant="small">Updated: {new Date(commitment.updated).toLocaleDateString()}</AndamioText>
              </div>
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
                projectNftPolicyId={treasuryNftPolicyId}
                contributorStateId={contributorStateId ?? "0".repeat(56)}
                taskHash={taskHash}
                taskCode={`TASK_${task.index}`}
                taskTitle={task.title ?? undefined}
                taskEvidence={evidence}
                onSuccess={async () => {
                  setIsEditingEvidence(false);
                  // Refetch commitment status
                  try {
                    const commitmentResponse = await authenticatedFetch(
                      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/task-commitments/get`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ task_hash: taskHash }),
                      }
                    );
                    if (commitmentResponse.ok) {
                      const commitmentData = (await commitmentResponse.json()) as GetTaskCommitmentByTaskHashOutput;
                      setCommitment(commitmentData);
                    }
                  } catch {
                    // Handled by transaction component
                  }
                }}
              />
            ) : (
              <ProjectEnroll
                projectNftPolicyId={treasuryNftPolicyId}
                contributorStateId={contributorStateId ?? "0".repeat(56)}
                taskHash={taskHash}
                taskCode={`TASK_${task.index}`}
                taskTitle={task.title ?? undefined}
                taskEvidence={evidence}
                onSuccess={async () => {
                  setIsEnrolled(true);
                  setIsEditingEvidence(false);
                  // Refetch commitment status
                  try {
                    const commitmentResponse = await authenticatedFetch(
                      `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/task-commitments/get`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ task_hash: taskHash }),
                      }
                    );
                    if (commitmentResponse.ok) {
                      const commitmentData = (await commitmentResponse.json()) as GetTaskCommitmentByTaskHashOutput;
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
