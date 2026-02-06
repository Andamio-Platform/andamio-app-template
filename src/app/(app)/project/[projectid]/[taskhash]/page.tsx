"use client";

import React, { useState } from "react";
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
import type { JSONContent } from "@tiptap/core";
import { formatLovelace } from "~/lib/cardano-utils";
import { TaskCommit } from "~/components/tx";
import { ConnectWalletPrompt } from "~/components/auth/connect-wallet-prompt";
import { useProjectTask } from "~/hooks/api/project/use-project";
import { useContributorCommitment, projectContributorKeys } from "~/hooks/api/project/use-project-contributor";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Task Detail Page - Public view of a task with commitment functionality
 *
 * Data strategy: Two hooks, no redundancy.
 * - useProjectTask(projectId, taskHash) — selects one task from the shared
 *   projectKeys.tasks(projectId) cache. If the project page was visited first,
 *   this is a pure cache hit (zero network requests). All task fields including
 *   contentJson and contributorStateId come from this single source.
 * - useContributorCommitment(projectId, taskHash) — authenticated-only query
 *   for the user's commitment status on this task. 404 = no commitment yet.
 */
export default function TaskDetailPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const taskHash = params.taskhash as string;
  const { isAuthenticated } = useAndamioAuth();
  const queryClient = useQueryClient();

  // Task data from shared cache — includes contentJson, contributorStateId, etc.
  const { data: task, isLoading: isTaskLoading, error: taskError } = useProjectTask(projectId, taskHash);

  // Commitment status (authenticated only, 404 → null = no commitment yet)
  const { data: commitment, isLoading: isCommitmentLoading } = useContributorCommitment(
    projectId,
    taskHash
  );

  // Whether the user already has a commitment on this task
  const isEnrolled = !!commitment;

  // Evidence editor state
  const [evidence, setEvidence] = useState<JSONContent | null>(null);
  const [isEditingEvidence, setIsEditingEvidence] = useState(false);

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

  // Invalidate commitment cache after successful TX
  const invalidateCommitment = async () => {
    await queryClient.invalidateQueries({
      queryKey: projectContributorKeys.commitment(projectId, taskHash),
    });
  };

  // Loading: only wait for task data. Commitment loading doesn't block task display.
  if (isTaskLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  const errorMessage = taskError instanceof Error ? taskError.message : taskError ? "Failed to load task" : null;
  if (errorMessage || !task) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert error={errorMessage ?? "Task not found"} />
      </div>
    );
  }

  const createdBy = task.createdByAlias
    ? (task.createdByAlias.length > 12 ? task.createdByAlias.slice(0, 12) + "…" : task.createdByAlias)
    : "Unknown";

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
            {task.taskStatus === "ON_CHAIN" ? "Live" : task.taskStatus}
          </AndamioBadge>
        </div>
      </div>

      {/* Task Title and Description */}
      <AndamioPageHeader
        title={task.title || "Untitled Task"}
        description={task.description || undefined}
      />

      {/* Task Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <AndamioDashboardStat
          icon={TokenIcon}
          label="Reward"
          value={formatLovelace(task.lovelaceAmount ?? "0")}
          iconColor="success"
        />
        <AndamioDashboardStat
          icon={PendingIcon}
          label="Expires"
          value={formatTimestamp(task.expirationTime ?? "0")}
        />
        <AndamioDashboardStat
          icon={TeacherIcon}
          label="Created By"
          value={createdBy}
          iconColor="info"
        />
      </div>

      {/* Task Hash */}
      <div className="p-3 bg-muted rounded-lg">
        <AndamioText variant="small" className="text-xs mb-1">Task Hash (On-Chain ID)</AndamioText>
        <AndamioText className="font-mono text-sm break-all">
          {task.taskHash || taskHash}
        </AndamioText>
      </div>

      {/* Task Content (rich content from contentJson) */}
      {!!task.contentJson && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Task Details</AndamioCardTitle>
            <AndamioCardDescription>Full task instructions and requirements</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <ContentDisplay content={task.contentJson as JSONContent} />
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
                const displayName = token.assetName || (token.policyId ? token.policyId.slice(0, 16) : `Token ${idx + 1}`);
                return (
                  <div key={token.policyId || idx} className="flex items-center justify-between p-2 border rounded">
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
              ? isCommitmentLoading
                ? "Loading commitment status…"
                : commitment
                  ? "Track your progress on this task"
                  : "Commit to this task to get started"
              : "Connect your wallet to commit to this task"}
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          {!isAuthenticated ? (
            <div className="text-center py-6">
              <AndamioText variant="muted" className="mb-4">Connect your wallet to commit to this task</AndamioText>
              <ConnectWalletPrompt />
            </div>
          ) : isCommitmentLoading ? (
            <div className="text-center py-6">
              <AndamioText variant="muted">Checking commitment status…</AndamioText>
            </div>
          ) : commitment ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <AndamioText as="span" variant="small" className="font-medium">Status</AndamioText>
                <AndamioBadge variant={getCommitmentStatusVariant(commitment.commitmentStatus ?? "")}>
                  {(commitment.commitmentStatus ?? "").replace(/_/g, " ")}
                </AndamioBadge>
              </div>

              {commitment.submissionTx && (
                <>
                  <AndamioSeparator />
                  <div>
                    <AndamioText variant="small" className="mb-1">Pending Transaction</AndamioText>
                    <AndamioText className="font-mono text-xs break-all">{commitment.submissionTx}</AndamioText>
                  </div>
                </>
              )}

              {commitment.evidence !== undefined && commitment.evidence !== null && (
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

          {/* Transaction Component - PROJECT_CONTRIBUTOR_TASK_COMMIT */}
          {evidence && Object.keys(evidence).length > 0 && (
            <TaskCommit
              projectNftPolicyId={projectId}
              contributorStateId={task.contributorStateId ?? "0".repeat(56)}
              taskHash={taskHash}
              taskCode={`TASK_${task.index}`}
              taskTitle={task.title ?? undefined}
              taskEvidence={evidence}
              isFirstCommit={!isEnrolled}
              onSuccess={async () => {
                setIsEditingEvidence(false);
                await invalidateCommitment();
              }}
            />
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
