"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
} from "~/components/andamio";
import {
  ContributorIcon,
  TaskIcon,
  CredentialIcon,
} from "~/components/icons";
import { type TreasuryListResponse, type TaskResponse } from "@andamio/db-api-types";
import { ProjectEnroll, TaskCommit, ProjectCredentialClaim } from "~/components/transactions";
import { formatLovelace } from "~/lib/cardano-utils";

type TaskListOutput = TaskResponse[];

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
  const treasuryNftPolicyId = params.treasurynft as string;
  useAndamioAuth(); // Auth context required for authenticated routes

  const [project, setProject] = useState<TreasuryListResponse[0] | null>(null);
  const [tasks, setTasks] = useState<TaskListOutput>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Contributor state - in a real app this would come from on-chain data
  const [contributorStatus, setContributorStatus] = useState<ContributorStatus>("not_enrolled");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [contributorStateId, _setContributorStateId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskResponse | null>(null);

  // Mock evidence for demo - in real app this would come from an editor
  const [taskEvidence] = useState({ type: "doc", content: [{ type: "paragraph", content: [{ type: "text", text: "My task submission..." }] }] });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Go API: POST /project/public/treasury/list
      const projectResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/public/treasury/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ treasury_nft_policy_id: treasuryNftPolicyId }),
        }
      );

      if (!projectResponse.ok) {
        throw new Error(`Project not found (${projectResponse.status})`);
      }

      const projectsData = (await projectResponse.json()) as TreasuryListResponse;
      const projectData = projectsData.find(
        (p) => p.treasury_nft_policy_id === treasuryNftPolicyId
      );

      if (!projectData) {
        throw new Error("Project not found");
      }

      setProject(projectData);

      // Go API: GET /project/public/tasks/list/{treasury_nft_policy_id}
      const tasksResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project/public/tasks/list/${treasuryNftPolicyId}`
      );

      if (tasksResponse.ok) {
        const tasksData = (await tasksResponse.json()) as TaskListOutput;
        setTasks(tasksData ?? []);
        // Select first available task by default
        const liveTasks = tasksData.filter((t) => t.status === "ON_CHAIN");
        if (liveTasks.length > 0 && !selectedTask) {
          setSelectedTask(liveTasks[0] ?? null);
        }
      }

      // TODO: Fetch actual contributor state from on-chain data
      // For now, we'll assume not enrolled
      // In a real implementation, you would query the blockchain for the contributor state token

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
  }, [treasuryNftPolicyId]);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/project/${treasuryNftPolicyId}`} label="Back to Project" />
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
      <AndamioBackButton href={`/project/${treasuryNftPolicyId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Contributor Dashboard"
        description={project.title}
      />

      {/* Project Info */}
      <div className="flex flex-wrap items-center gap-2">
        <AndamioBadge variant="outline">
          <span className="font-mono text-xs">{treasuryNftPolicyId.slice(0, 16)}...</span>
        </AndamioBadge>
{/* Treasury balance removed - total_ada not available in new API */}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AndamioDashboardStat
          icon={ContributorIcon}
          label="Your Status"
          value={
            contributorStatus === "not_enrolled" ? "Not Enrolled" :
            contributorStatus === "enrolled" ? "Enrolled" :
            contributorStatus === "task_pending" ? "Task Pending" :
            contributorStatus === "task_accepted" ? "Task Accepted" : "Can Claim"
          }
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

      {/* Task Selection */}
      {liveTasks.length > 0 && (
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
            {liveTasks.map((task) => (
              <div
                key={task.task_hash ?? task.task_index}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedTask?.task_hash === task.task_hash
                    ? "border-primary bg-primary/5"
                    : "hover:border-muted-foreground/50"
                }`}
                onClick={() => setSelectedTask(task)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <AndamioText as="div" className="font-medium">{task.title}</AndamioText>
                    <AndamioText variant="small">{task.description}</AndamioText>
                  </div>
                  <AndamioBadge variant="outline">
                    {formatLovelace(task.lovelace)}
                  </AndamioBadge>
                </div>
              </div>
            ))}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Action Cards based on status */}
      {contributorStatus === "not_enrolled" && selectedTask && (
        <ProjectEnroll
          projectNftPolicyId={treasuryNftPolicyId}
          contributorStateId={contributorStateId ?? "0".repeat(56)} // Placeholder - would be generated
          projectTitle={project.title}
          taskHash={selectedTask.task_hash ?? ""}
          taskCode={`TASK_${selectedTask.task_index}`}
          taskTitle={selectedTask.title ?? undefined}
          taskEvidence={taskEvidence}
          onSuccess={async () => {
            setContributorStatus("task_pending");
            await fetchData();
          }}
        />
      )}

      {(contributorStatus === "enrolled" || contributorStatus === "task_accepted") && selectedTask && (
        <TaskCommit
          projectNftPolicyId={treasuryNftPolicyId}
          contributorStateId={contributorStateId ?? "0".repeat(56)}
          projectTitle={project.title}
          taskHash={selectedTask.task_hash ?? ""}
          taskCode={`TASK_${selectedTask.task_index}`}
          taskTitle={selectedTask.title ?? undefined}
          taskEvidence={taskEvidence}
          onSuccess={async () => {
            setContributorStatus("task_pending");
            await fetchData();
          }}
        />
      )}

      {contributorStatus === "can_claim" && (
        <ProjectCredentialClaim
          projectNftPolicyId={treasuryNftPolicyId}
          contributorStateId={contributorStateId ?? "0".repeat(56)}
          projectTitle={project.title}
          onSuccess={async () => {
            await fetchData();
          }}
        />
      )}

      {/* No tasks available */}
      {liveTasks.length === 0 && (
        <AndamioEmptyState
          icon={TaskIcon}
          title="No Tasks Available"
          description="This project doesn't have any active tasks right now. Check back later."
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
              <AndamioText className="font-medium">Enroll & Commit</AndamioText>
              <AndamioText variant="small">Select a task and submit your initial evidence to enroll in the project.</AndamioText>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
            <div>
              <AndamioText className="font-medium">Complete the Task</AndamioText>
              <AndamioText variant="small">Work on your task and update your submission as needed.</AndamioText>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
            <div>
              <AndamioText className="font-medium">Get Assessed</AndamioText>
              <AndamioText variant="small">A project manager will review your submission and accept, refuse, or deny it.</AndamioText>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-success font-bold">4</div>
            <div>
              <AndamioText className="font-medium">Claim Credentials</AndamioText>
              <AndamioText variant="small">Once accepted, claim your on-chain credential tokens as proof of your contribution.</AndamioText>
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
