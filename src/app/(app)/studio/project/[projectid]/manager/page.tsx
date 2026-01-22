"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  AndamioBadge,
  AndamioButton,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioLabel,
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
  AndamioEmptyState,
  AndamioSearchInput,
  AndamioSelect,
  AndamioSelectContent,
  AndamioSelectItem,
  AndamioSelectTrigger,
  AndamioSelectValue,
  AndamioText,
  AndamioDashboardStat,
} from "~/components/andamio";
import {
  ManagerIcon,
  SuccessIcon,
  PendingIcon,
  ErrorIcon,
  CloseIcon,
  BlockIcon,
} from "~/components/icons";
import { type ProjectV2Output } from "~/types/generated";
import { TasksAssess } from "~/components/tx";

interface TaskSubmission {
  id: string;
  contributor_alias: string;
  contributor_state_id: string;
  task_code: string;
  task_hash: string;
  task_title?: string;
  status: string;
  evidence?: unknown;
  submitted_at?: string;
}

// Status color mapping
const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  if (status.includes("PENDING")) return "secondary";
  if (status.includes("ACCEPTED") || status.includes("COMPLETED")) return "default";
  if (status.includes("DENIED") || status.includes("REFUSED")) return "destructive";
  return "outline";
};

const formatStatus = (status: string): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Manager Dashboard Page
 *
 * View and assess contributor task submissions for a project.
 * Similar pattern to the Instructor Dashboard for courses.
 */
export default function ManagerDashboardPage() {
  const params = useParams();
  const projectId = params.projectid as string;
  const { isAuthenticated } = useAndamioAuth();

  const [project, setProject] = useState<ProjectV2Output | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<TaskSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected submission for management
  const [selectedSubmission, setSelectedSubmission] = useState<TaskSubmission | null>(null);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Stats
  const stats = {
    total: submissions.length,
    pending: submissions.filter((s) => s.status.includes("PENDING")).length,
    accepted: submissions.filter((s) => s.status.includes("ACCEPTED")).length,
    denied: submissions.filter((s) => s.status.includes("DENIED") || s.status.includes("REFUSED")).length,
  };

  // Fetch data function
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // V2 API: GET /project/user/project/:project_id
      const projectResponse = await fetch(
        `/api/gateway/api/v2/project/user/project/${projectId}`
      );

      if (!projectResponse.ok) {
        throw new Error(`Failed to fetch project: ${projectResponse.statusText}`);
      }

      const projectData = (await projectResponse.json()) as ProjectV2Output;

      if (!projectData) {
        throw new Error("Project not found or you don't have access");
      }

      setProject(projectData);

      // TODO: Fetch actual task submissions from the API
      // For now, we'll use mock data to demonstrate the UI pattern
      // In a real implementation, you would call:
      // const submissionsResponse = await authenticatedFetch(
      //   `/api/gateway/api/v2/task-submissions/by-project`,
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ project_id: projectId }),
      //   }
      // );

      // Mock submissions for UI demonstration
      const mockSubmissions: TaskSubmission[] = [
        // Empty for now - real submissions would come from API
      ];

      setSubmissions(mockSubmissions);
      setFilteredSubmissions(mockSubmissions);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, projectId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...submissions];

    if (statusFilter !== "all") {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchQuery) {
      filtered = filtered.filter((s) =>
        s.contributor_alias?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.task_code?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredSubmissions(filtered);
  }, [statusFilter, searchQuery, submissions]);

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioErrorAlert
          title="Authentication Required"
          error="Please connect your wallet to access the manager dashboard."
        />
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !project) {
    return (
      <div className="space-y-6">
        <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />
        <AndamioPageHeader title="Manager Dashboard" />
        <AndamioErrorAlert error={error ?? "Project not found"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioBackButton href={`/studio/project/${projectId}`} label="Back to Project" />

      <AndamioPageHeader
        title="Manager Dashboard"
        description={typeof project.title === "string" ? project.title : undefined}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <AndamioDashboardStat icon={ManagerIcon} label="Total Submissions" value={stats.total} />
        <AndamioDashboardStat icon={PendingIcon} label="Pending Review" value={stats.pending} />
        <AndamioDashboardStat icon={SuccessIcon} label="Accepted" value={stats.accepted} valueColor="success" iconColor="success" />
        <AndamioDashboardStat icon={ErrorIcon} label="Denied/Refused" value={stats.denied} valueColor="destructive" iconColor="destructive" />
      </div>

      {/* Filters */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Filters</AndamioCardTitle>
          <AndamioCardDescription>Filter and search task submissions</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <AndamioLabel htmlFor="status-filter">Status</AndamioLabel>
              <AndamioSelect value={statusFilter} onValueChange={setStatusFilter}>
                <AndamioSelectTrigger id="status-filter">
                  <AndamioSelectValue placeholder="All statuses" />
                </AndamioSelectTrigger>
                <AndamioSelectContent>
                  <AndamioSelectItem value="all">All Statuses</AndamioSelectItem>
                  <AndamioSelectItem value="PENDING_APPROVAL">Pending Approval</AndamioSelectItem>
                  <AndamioSelectItem value="TASK_ACCEPTED">Accepted</AndamioSelectItem>
                  <AndamioSelectItem value="TASK_REFUSED">Refused</AndamioSelectItem>
                  <AndamioSelectItem value="TASK_DENIED">Denied</AndamioSelectItem>
                </AndamioSelectContent>
              </AndamioSelect>
            </div>

            <div className="space-y-2">
              <AndamioLabel htmlFor="search">Search</AndamioLabel>
              <AndamioSearchInput
                id="search"
                placeholder="Search by contributor or task..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {(statusFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-2">
              <AndamioText as="span" variant="small">
                Showing {filteredSubmissions.length} of {submissions.length} submissions
              </AndamioText>
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </AndamioButton>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* Submissions Table */}
      {filteredSubmissions.length === 0 ? (
        <AndamioEmptyState
          icon={ManagerIcon}
          title={submissions.length === 0 ? "No task submissions yet" : "No submissions match your filters"}
          description="Task submissions from contributors will appear here for review."
          action={
            submissions.length > 0 ? (
              <AndamioButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </AndamioButton>
            ) : undefined
          }
        />
      ) : (
        <AndamioTableContainer>
          <AndamioTable>
            <AndamioTableHeader>
              <AndamioTableRow>
                <AndamioTableHead>Contributor</AndamioTableHead>
                <AndamioTableHead>Task</AndamioTableHead>
                <AndamioTableHead>Status</AndamioTableHead>
                <AndamioTableHead>Evidence</AndamioTableHead>
              </AndamioTableRow>
            </AndamioTableHeader>
            <AndamioTableBody>
              {filteredSubmissions.map((submission) => (
                <AndamioTableRow
                  key={submission.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedSubmission(submission)}
                >
                  <AndamioTableCell className="font-mono text-xs">
                    {submission.contributor_alias}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <div>
                      <AndamioText as="div" className="font-medium">{submission.task_title ?? submission.task_code}</AndamioText>
                      <AndamioText variant="small">
                        {submission.task_code}
                      </AndamioText>
                    </div>
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <AndamioBadge variant={getStatusVariant(submission.status)}>
                      {formatStatus(submission.status)}
                    </AndamioBadge>
                  </AndamioTableCell>
                  <AndamioTableCell>
                    {submission.evidence ? (
                      <AndamioText as="div" variant="small" className="max-w-xs truncate">
                        {typeof submission.evidence === "string"
                          ? submission.evidence
                          : JSON.stringify(submission.evidence)}
                      </AndamioText>
                    ) : (
                      <AndamioText as="span" variant="small" className="italic">No evidence</AndamioText>
                    )}
                  </AndamioTableCell>
                </AndamioTableRow>
              ))}
            </AndamioTableBody>
          </AndamioTable>
        </AndamioTableContainer>
      )}

      {/* Selected Submission Detail View */}
      {selectedSubmission && (
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
                onClick={() => setSelectedSubmission(null)}
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
                  {selectedSubmission.contributor_alias}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Task</AndamioLabel>
                <AndamioText variant="small" className="font-medium mt-1 text-foreground">
                  {selectedSubmission.task_title ?? selectedSubmission.task_code}
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {selectedSubmission.task_code}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Current Status</AndamioLabel>
                <div className="mt-1">
                  <AndamioBadge variant={getStatusVariant(selectedSubmission.status)}>
                    {formatStatus(selectedSubmission.status)}
                  </AndamioBadge>
                </div>
              </div>
              <div>
                <AndamioLabel>Evidence</AndamioLabel>
                {selectedSubmission.evidence ? (
                  <AndamioText variant="small" className="mt-1 max-w-md break-words">
                    {typeof selectedSubmission.evidence === "string"
                      ? selectedSubmission.evidence
                      : JSON.stringify(selectedSubmission.evidence)}
                  </AndamioText>
                ) : (
                  <AndamioText variant="small" className="mt-1 italic">No evidence submitted</AndamioText>
                )}
              </div>
            </div>

            {/* Assessment Options Info */}
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <AndamioText variant="small" className="font-medium">Assessment Options:</AndamioText>
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <SuccessIcon className="h-3 w-3 text-success" />
                  <span><strong>Accept</strong>: Approve and release reward to contributor</span>
                </div>
                <div className="flex items-center gap-2">
                  <ErrorIcon className="h-3 w-3 text-warning" />
                  <span><strong>Refuse</strong>: Reject but allow contributor to resubmit</span>
                </div>
                <div className="flex items-center gap-2">
                  <BlockIcon className="h-3 w-3 text-destructive" />
                  <span><strong>Deny</strong>: Permanently reject, contributor loses deposit</span>
                </div>
              </div>
            </div>

            {/* TasksAssess Transaction Component */}
            <TasksAssess
              projectNftPolicyId={projectId}
              contributorStateId={selectedSubmission.contributor_state_id}
              contributorAlias={selectedSubmission.contributor_alias}
              taskHash={selectedSubmission.task_hash}
              taskCode={selectedSubmission.task_code}
              taskTitle={selectedSubmission.task_title}
              onSuccess={async () => {
                await fetchData();
                setSelectedSubmission(null);
              }}
            />
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
