"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useManagerPendingAssessments } from "~/hooks/use-andamioscan";
import { getProject, type AndamioscanProjectDetails, type AndamioscanTask } from "~/lib/andamioscan";
import { syncPendingAssessment, checkCommitmentExists } from "~/lib/project-commitment-sync";
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
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioTableContainer,
  AndamioBackButton,
  AndamioErrorAlert,
  AndamioSearchInput,
  AndamioText,
  AndamioDashboardStat,
  AndamioLabel,
} from "~/components/andamio";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import {
  ManagerIcon,
  SuccessIcon,
  ErrorIcon,
  CloseIcon,
  BlockIcon,
  RefreshIcon,
  AlertIcon,
  TaskIcon,
  DatabaseIcon,
} from "~/components/icons";
import { type ProjectV2Output } from "@andamio/db-api-types";
import { TasksAssess } from "~/components/transactions";
import type { AndamioscanProjectPendingAssessment } from "~/lib/andamioscan";
import { toast } from "sonner";

/**
 * Project Commitments Page
 *
 * View and assess contributor task submissions for a project.
 * Uses Andamioscan for on-chain pending assessments.
 *
 * API Endpoints:
 * - Andamioscan: GET /api/v2/projects/managers/{alias}/assessments/pending
 * - Andamioscan: GET /api/v2/projects/{project_id}/details
 * - DB API: GET /project-v2/public/project/:project_id
 */
export default function ProjectCommitmentsPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated, user, authenticatedFetch } = useAndamioAuth();
  const managerAlias = user?.accessTokenAlias;

  // Project data from DB API and Andamioscan
  const [project, setProject] = useState<ProjectV2Output | null>(null);
  const [onChainProject, setOnChainProject] = useState<AndamioscanProjectDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state - track which submissions are being synced
  const [syncingSubmissions, setSyncingSubmissions] = useState<Set<string>>(new Set());

  // DB status for each commitment (task_id -> { exists, status })
  const [dbStatus, setDbStatus] = useState<Map<string, { exists: boolean; status?: string; checking?: boolean }>>(new Map());

  // Pending assessments from Andamioscan
  const {
    data: allPendingAssessments,
    isLoading: isLoadingAssessments,
    error: assessmentsError,
    refetch,
  } = useManagerPendingAssessments(managerAlias ?? undefined);

  // Filter pending assessments to this project
  const pendingAssessments = useMemo(() => {
    if (!allPendingAssessments) return [];
    return allPendingAssessments.filter((a) => a.project_id === projectId);
  }, [allPendingAssessments, projectId]);

  // Map task_id to task details from on-chain project
  const taskMap = useMemo(() => {
    const map = new Map<string, AndamioscanTask>();
    if (onChainProject?.tasks) {
      for (const task of onChainProject.tasks) {
        map.set(task.task_id, task);
      }
    }
    return map;
  }, [onChainProject]);

  // Selected assessment for management
  const [selectedAssessment, setSelectedAssessment] =
    useState<AndamioscanProjectPendingAssessment | null>(null);

  // Filtering state
  const [searchQuery, setSearchQuery] = useState("");

  // Apply search filter
  const filteredAssessments = useMemo(() => {
    if (!searchQuery) return pendingAssessments;
    return pendingAssessments.filter(
      (a) =>
        a.contributor_alias.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.task_id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [pendingAssessments, searchQuery]);

  // Fetch project data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch DB API project
        const projectResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/public/project/${projectId}`
        );

        if (!projectResponse.ok) {
          throw new Error(`Failed to fetch project: ${projectResponse.statusText}`);
        }

        const projectData = (await projectResponse.json()) as ProjectV2Output;
        setProject(projectData);

        // Fetch on-chain project details for task info
        try {
          const onChainData = await getProject(projectId);
          setOnChainProject(onChainData);
        } catch {
          // On-chain data optional - continue without it
          console.warn("Could not fetch on-chain project data");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(err instanceof Error ? err.message : "Failed to load project");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [projectId]);

  // Check DB status for each pending assessment
  useEffect(() => {
    if (!pendingAssessments.length || !isAuthenticated) return;

    const checkAllDbStatus = async () => {
      for (const assessment of pendingAssessments) {
        const taskId = assessment.task_id;

        // Skip if already checked or checking
        if (dbStatus.has(taskId)) continue;

        // Mark as checking
        setDbStatus((prev) => new Map(prev).set(taskId, { exists: false, checking: true }));

        try {
          const result = await checkCommitmentExists(taskId, assessment.contributor_alias, authenticatedFetch);
          setDbStatus((prev) => new Map(prev).set(taskId, {
            exists: result.exists,
            status: result.status,
            checking: false
          }));
        } catch {
          setDbStatus((prev) => new Map(prev).set(taskId, { exists: false, checking: false }));
        }
      }
    };

    void checkAllDbStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAssessments, isAuthenticated]);

  // Format slot number to approximate date
  const formatSlot = (slot: number): string => {
    // Preprod genesis time: 2022-04-01T00:00:00Z = 1648771200
    const genesisTime = 1648771200;
    const timestamp = (genesisTime + slot) * 1000;
    return new Date(timestamp).toLocaleDateString();
  };

  // Get task title from task_id
  const getTaskTitle = (taskId: string | undefined): string => {
    if (!taskId) return "Unknown Task";
    const task = taskMap.get(taskId);
    return task?.lovelace
      ? `Task ${taskId.slice(0, 8)}... (${(task.lovelace / 1_000_000).toFixed(0)} ADA)`
      : `Task ${taskId.slice(0, 8)}...`;
  };

  // Sync a single submission to DB
  const handleSyncSubmission = useCallback(async (assessment: AndamioscanProjectPendingAssessment) => {
    const syncKey = `${assessment.task_id}-${assessment.contributor_alias}`;
    setSyncingSubmissions((prev) => new Set(prev).add(syncKey));

    try {
      // Sync directly from pending assessment data
      const result = await syncPendingAssessment(
        assessment.task_id,
        assessment.content,
        assessment.submission_tx_hash,
        authenticatedFetch
      );
      if (result.success) {
        toast.success("Commitment synced to database", {
          description: `${assessment.contributor_alias}'s submission is now ready for assessment`,
        });
        // Update DB status to show it now exists
        setDbStatus((prev) => new Map(prev).set(assessment.task_id, {
          exists: true,
          status: "SUBMITTED",
          checking: false
        }));
      } else {
        toast.error("Failed to sync commitment", {
          description: result.error,
        });
      }
    } catch (err) {
      toast.error("Sync failed", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setSyncingSubmissions((prev) => {
        const next = new Set(prev);
        next.delete(syncKey);
        return next;
      });
    }
  }, [authenticatedFetch]);

  // Not authenticated
  if (!isAuthenticated || !managerAlias) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert
          title="Authentication Required"
          error="Please connect your wallet to access project commitments."
        />
      </div>
    );
  }

  // Loading project
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioPageHeader title="Task Commitments" />
        <AndamioErrorAlert error={error ?? "Project not found"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Task Commitments"
        description={`Review and assess contributor submissions for ${project.title}`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <AndamioDashboardStat
          icon={TaskIcon}
          label="Pending Reviews"
          value={pendingAssessments.length}
          valueColor={pendingAssessments.length > 0 ? "warning" : undefined}
          iconColor={pendingAssessments.length > 0 ? "warning" : undefined}
        />
        <AndamioDashboardStat
          icon={ManagerIcon}
          label="Total Tasks"
          value={onChainProject?.tasks.length ?? 0}
        />
        <AndamioDashboardStat
          icon={SuccessIcon}
          label="Contributors"
          value={onChainProject?.contributors.length ?? 0}
          valueColor="success"
          iconColor="success"
        />
      </div>

      {/* Pending Assessments Card */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader
              icon={ManagerIcon}
              title="Pending Task Assessments"
              description="Task submissions from contributors awaiting your review"
            />
            <div className="flex items-center gap-2">
              {pendingAssessments.length > 0 && (
                <AndamioBadge variant="secondary">
                  {pendingAssessments.length} pending
                </AndamioBadge>
              )}
              <AndamioButton
                variant="ghost"
                size="icon-sm"
                onClick={() => void refetch()}
                disabled={isLoadingAssessments}
              >
                <RefreshIcon className={`h-4 w-4 ${isLoadingAssessments ? "animate-spin" : ""}`} />
              </AndamioButton>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          {/* Search filter */}
          {pendingAssessments.length > 0 && (
            <div className="max-w-sm">
              <AndamioLabel htmlFor="search" className="sr-only">
                Search
              </AndamioLabel>
              <AndamioSearchInput
                id="search"
                placeholder="Search by contributor or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {/* Loading state */}
          {isLoadingAssessments && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-md bg-muted/30">
                  <AndamioSkeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <AndamioSkeleton className="h-4 w-48" />
                    <AndamioSkeleton className="h-3 w-32" />
                  </div>
                  <AndamioSkeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {assessmentsError && !isLoadingAssessments && (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
                <AlertIcon className="h-6 w-6 text-destructive" />
              </div>
              <AndamioText variant="small" className="font-medium text-destructive">
                Failed to load pending assessments
              </AndamioText>
              <AndamioText variant="small" className="text-xs mt-1 max-w-[250px]">
                {assessmentsError.message}
              </AndamioText>
              <AndamioButton
                variant="outline"
                size="sm"
                onClick={() => void refetch()}
                className="mt-4"
              >
                <RefreshIcon className="mr-2 h-4 w-4" />
                Retry
              </AndamioButton>
            </div>
          )}

          {/* Empty state */}
          {!isLoadingAssessments && !assessmentsError && pendingAssessments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
                <SuccessIcon className="h-6 w-6 text-success" />
              </div>
              <AndamioText className="font-medium">All caught up!</AndamioText>
              <AndamioText variant="muted" className="mt-1 max-w-[250px]">
                No pending task reviews for this project at this time
              </AndamioText>
            </div>
          )}

          {/* Pending assessments table */}
          {!isLoadingAssessments && !assessmentsError && filteredAssessments.length > 0 && (
            <AndamioTableContainer>
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead>Contributor</AndamioTableHead>
                    <AndamioTableHead>Task</AndamioTableHead>
                    <AndamioTableHead className="hidden sm:table-cell">Submitted</AndamioTableHead>
                    <AndamioTableHead>Evidence</AndamioTableHead>
                    <AndamioTableHead className="w-[80px]">DB Status</AndamioTableHead>
                    <AndamioTableHead className="w-[100px]">Actions</AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {filteredAssessments.map((assessment) => (
                    <AndamioTableRow
                      key={`${assessment.task_id}-${assessment.contributor_alias}`}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedAssessment(assessment)}
                    >
                      <AndamioTableCell className="font-mono text-xs">
                        {assessment.contributor_alias}
                      </AndamioTableCell>
                      <AndamioTableCell>
                        <code className="text-xs font-mono truncate block max-w-[150px]">
                          {getTaskTitle(assessment.task_id)}
                        </code>
                      </AndamioTableCell>
                      <AndamioTableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                        {formatSlot(assessment.submission_slot)}
                      </AndamioTableCell>
                      <AndamioTableCell>
                        <AndamioText variant="small" className="max-w-[200px] truncate">
                          {assessment.content || (
                            <span className="italic text-muted-foreground">No content</span>
                          )}
                        </AndamioText>
                      </AndamioTableCell>
                      <AndamioTableCell>
                        {(() => {
                          const status = dbStatus.get(assessment.task_id);
                          if (status?.checking) {
                            return <RefreshIcon className="h-4 w-4 animate-spin text-muted-foreground" />;
                          }
                          if (status?.exists) {
                            return (
                              <div className="flex items-center gap-1">
                                <SuccessIcon className="h-4 w-4 text-success" />
                                <span className="text-xs text-success">{status.status ?? "OK"}</span>
                              </div>
                            );
                          }
                          return (
                            <div className="flex items-center gap-1">
                              <ErrorIcon className="h-4 w-4 text-warning" />
                              <span className="text-xs text-warning">Missing</span>
                            </div>
                          );
                        })()}
                      </AndamioTableCell>
                      <AndamioTableCell>
                        {(() => {
                          const status = dbStatus.get(assessment.task_id);
                          // Only show sync button if DB record is missing
                          if (status?.exists) {
                            return <span className="text-xs text-muted-foreground">—</span>;
                          }
                          return (
                            <AndamioButton
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleSyncSubmission(assessment);
                              }}
                              disabled={syncingSubmissions.has(`${assessment.task_id}-${assessment.contributor_alias}`) || status?.checking}
                            >
                              {syncingSubmissions.has(`${assessment.task_id}-${assessment.contributor_alias}`) ? (
                                <RefreshIcon className="h-3 w-3 animate-spin" />
                              ) : (
                                <DatabaseIcon className="h-3 w-3" />
                              )}
                              <span className="ml-1.5 hidden sm:inline">Sync</span>
                            </AndamioButton>
                          );
                        })()}
                      </AndamioTableCell>
                    </AndamioTableRow>
                  ))}
                </AndamioTableBody>
              </AndamioTable>
            </AndamioTableContainer>
          )}

          {/* Filter results info */}
          {searchQuery && filteredAssessments.length !== pendingAssessments.length && (
            <div className="flex items-center gap-2">
              <AndamioText variant="small">
                Showing {filteredAssessments.length} of {pendingAssessments.length} pending reviews
              </AndamioText>
              <AndamioButton variant="ghost" size="sm" onClick={() => setSearchQuery("")}>
                Clear
              </AndamioButton>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* Selected Assessment Detail View */}
      {selectedAssessment && (
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <AndamioCardTitle>Assess Task Submission</AndamioCardTitle>
                <AndamioCardDescription>
                  Review and accept, refuse, or deny this task submission
                </AndamioCardDescription>
              </div>
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAssessment(null)}
              >
                <CloseIcon className="h-4 w-4" />
              </AndamioButton>
            </div>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-6">
            {/* Submission Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <AndamioLabel>Contributor</AndamioLabel>
                <AndamioText variant="small" className="font-mono mt-1 text-foreground">
                  {selectedAssessment.contributor_alias}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Task</AndamioLabel>
                <AndamioText variant="small" className="font-mono mt-1 text-foreground">
                  {selectedAssessment.task_id ? `${selectedAssessment.task_id.slice(0, 16)}...` : "Unknown"}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Submitted</AndamioLabel>
                <AndamioText variant="small" className="mt-1 text-foreground">
                  {formatSlot(selectedAssessment.submission_slot)}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Submission TX</AndamioLabel>
                <AndamioText variant="small" className="font-mono mt-1 text-foreground">
                  {selectedAssessment.submission_tx_hash.slice(0, 16)}...
                </AndamioText>
              </div>
            </div>

            {/* Evidence Content */}
            <div>
              <AndamioLabel>Submitted Evidence</AndamioLabel>
              <div className="mt-2 rounded-md border bg-muted/30 p-4">
                <AndamioText variant="small" className="whitespace-pre-wrap">
                  {selectedAssessment.content || (
                    <span className="italic text-muted-foreground">
                      No evidence content submitted
                    </span>
                  )}
                </AndamioText>
              </div>
            </div>

            {/* DB Sync Section */}
            <div className="space-y-3 rounded-lg border border-info/30 bg-info/5 p-4">
              <div className="flex items-start gap-3">
                <DatabaseIcon className="h-5 w-5 text-info shrink-0 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <AndamioText variant="small" className="font-medium">
                    Database Sync
                  </AndamioText>
                  <AndamioText variant="small" className="text-muted-foreground">
                    If the assessment fails because the commitment record doesn&apos;t exist in the database,
                    use this button to sync the on-chain submission data.
                  </AndamioText>
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    onClick={() => void handleSyncSubmission(selectedAssessment)}
                    disabled={syncingSubmissions.has(`${selectedAssessment.task_id}-${selectedAssessment.contributor_alias}`)}
                  >
                    {syncingSubmissions.has(`${selectedAssessment.task_id}-${selectedAssessment.contributor_alias}`) ? (
                      <>
                        <RefreshIcon className="h-4 w-4 mr-2 animate-spin" />
                        Syncing...
                      </>
                    ) : (
                      <>
                        <DatabaseIcon className="h-4 w-4 mr-2" />
                        Sync to Database
                      </>
                    )}
                  </AndamioButton>
                </div>
              </div>
            </div>

            {/* Assessment Options Info */}
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <AndamioText variant="small" className="font-medium">
                Assessment Options:
              </AndamioText>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <SuccessIcon className="h-3 w-3 text-success" />
                  <span>
                    <strong>Accept</strong>: Approve and release reward to contributor
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ErrorIcon className="h-3 w-3 text-warning" />
                  <span>
                    <strong>Refuse</strong>: Reject but allow contributor to resubmit
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BlockIcon className="h-3 w-3 text-destructive" />
                  <span>
                    <strong>Deny</strong>: Permanently reject, contributor loses deposit
                  </span>
                </div>
              </div>
            </div>

            {/* TasksAssess Transaction Component */}
            <TasksAssess
              projectNftPolicyId={projectId}
              contributorStateId={project.states?.[0]?.project_state_policy_id ?? ""}
              contributorAlias={selectedAssessment.contributor_alias}
              taskHash={selectedAssessment.task_id}
              taskCode={selectedAssessment.task_id.slice(0, 8)}
              onSuccess={async () => {
                await refetch();
                setSelectedAssessment(null);
              }}
            />
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
