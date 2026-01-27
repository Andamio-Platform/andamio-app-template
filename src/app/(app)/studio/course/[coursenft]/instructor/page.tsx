"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
} from "~/components/andamio/andamio-table";
import {
  AndamioPageHeader,
  AndamioTableContainer,
  AndamioDashboardStat,
  AndamioPageLoading,
  AndamioErrorAlert,
  AndamioEmptyState,
  AndamioSearchInput,
} from "~/components/andamio";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import {
  AndamioSelect,
  AndamioSelectContent,
  AndamioSelectItem,
  AndamioSelectTrigger,
  AndamioSelectValue,
} from "~/components/andamio/andamio-select";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { TeacherIcon, SuccessIcon, PendingIcon, CloseIcon, LoadingIcon } from "~/components/icons";
import { ContentDisplay } from "~/components/content-display";
import type { JSONContent } from "@tiptap/core";
import {
  type CourseDetail,
  type TeacherAssignmentCommitment,
} from "~/hooks/api";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";
import { TransactionButton } from "~/components/tx/transaction-button";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AlertIcon } from "~/components/icons";
import { PendingReviewsList } from "~/components/instructor/pending-reviews-list";

/**
 * Instructor Dashboard Page
 *
 * View all student assignment commitments for a course
 *
 * API Endpoint:
 * - POST /course/teacher/assignment-commitments/list (protected)
 *   Body: { policy_id: string }
 */

interface ApiError {
  message?: string;
}

// Network status color mapping based on workflow stages
const getStatusVariant = (
  status: string | undefined | null
): "default" | "secondary" | "destructive" | "outline" => {
  if (!status) return "outline";
  // Pending/in-progress states
  if (status.includes("PENDING")) return "secondary";
  // Success states
  if (status.includes("ACCEPTED") || status.includes("CLAIMED") || status === "ON_CHAIN") return "default";
  // Failure states
  if (status.includes("DENIED")) return "destructive";
  // Initial states
  if (status === "AWAITING_EVIDENCE" || status === "DRAFT") return "outline";
  // Other states
  return "default";
};

const formatNetworkStatus = (status: string | undefined | null): string => {
  if (!status) return "Unknown";
  // Convert SNAKE_CASE to Title Case
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export default function InstructorDashboardPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const { isAuthenticated, authenticatedFetch, user } = useAndamioAuth();

  // V2 Transaction hooks
  const assessTx = useTransaction();

  // Watch for gateway confirmation after assess TX submission
  const { status: assessTxStatus, isSuccess: assessTxConfirmed } = useTxWatcher(
    assessTx.result?.requiresDBUpdate ? assessTx.result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          // Refresh data and reset UI
          void fetchData();
          setSelectedCommitment(null);
          setDetailedCommitment(null);
          setAssessmentDecision("accept");
          assessTx.reset();
        }
      },
    }
  );

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [commitments, setCommitments] = useState<TeacherAssignmentCommitment[]>([]);
  const [filteredCommitments, setFilteredCommitments] = useState<TeacherAssignmentCommitment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected commitment for management
  const [selectedCommitment, setSelectedCommitment] = useState<TeacherAssignmentCommitment | null>(null);
  const [detailedCommitment, setDetailedCommitment] = useState<{
    evidence: JSONContent | null;
    status: string;
    txHash: string | null;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [assessmentDecision, setAssessmentDecision] = useState<"accept" | "refuse">("accept");

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

  // Get unique assignments for filter (by moduleCode)
  const uniqueModuleCodes = Array.from(
    new Set(commitments.map((c) => c.moduleCode).filter((c): c is string => !!c))
  );

  // Stats - use optional chaining since commitmentStatus might be undefined
  // Status values: DRAFT, PENDING_TX, ON_CHAIN
  const stats = {
    total: commitments.length,
    draft: commitments.filter((c) => c.commitmentStatus === "DRAFT").length,
    pending: commitments.filter((c) => c.commitmentStatus === "PENDING_TX").length,
    onChain: commitments.filter((c) => c.commitmentStatus === "ON_CHAIN").length,
  };

  // Fetch data function - extracted so it can be called from transaction success handlers
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Go API: GET /course/user/course/get/{policy_id}
      const courseResponse = await fetch(
        `/api/gateway/api/v2/course/user/course/get/${courseNftPolicyId}`
      );

      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
      }

      const courseData = (await courseResponse.json()) as CourseDetail;
      setCourse(courseData);

      // Fetch assignment commitments for this course
      if (!isAuthenticated) {
        throw new Error("You must be authenticated to view assignment commitments");
      }

      // Go API: POST /course/teacher/assignment-commitments/list
      const commitmentsResponse = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/assignment-commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseNftPolicyId }),
        }
      );

      // 404 means no commitments - use empty array
      if (commitmentsResponse.status === 404) {
        setCommitments([]);
        setFilteredCommitments([]);
        return;
      }

      if (!commitmentsResponse.ok) {
        const errorData = (await commitmentsResponse.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to fetch assignment commitments");
      }

      // API returns { data?: [...], warning?: string } wrapper
      const result = (await commitmentsResponse.json()) as {
        data?: TeacherAssignmentCommitment[];
        warning?: string;
      };

      // Debug: log the actual API response to see field names
      console.log("[InstructorDashboard] Assignment commitments response:", result);

      if (result.warning) {
        console.warn("[InstructorDashboard] API warning:", result.warning);
      }

      const commitmentsData = result.data ?? [];
      setCommitments(commitmentsData);
      setFilteredCommitments(commitmentsData);
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
  }, [courseNftPolicyId, isAuthenticated]);

  // Fetch detailed commitment data when a commitment is selected
  const fetchCommitmentDetail = async (commitment: TeacherAssignmentCommitment) => {
    if (!commitment.studentAlias) {
      setDetailedCommitment(null);
      return;
    }

    setIsLoadingDetail(true);
    setDetailedCommitment(null);

    try {
      // DB API: POST /course/shared/assignment-commitment/get
      const requestBody = {
        course_id: courseNftPolicyId,
        course_module_code: commitment.moduleCode,
        participant_alias: commitment.studentAlias,
      };
      console.log("[InstructorDashboard] Fetching commitment detail with:", requestBody);

      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/shared/assignment-commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("[InstructorDashboard] Response status:", response.status);

      if (response.status === 404) {
        // No detailed record found
        console.log("[InstructorDashboard] No detailed commitment found (404)");
        setDetailedCommitment(null);
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[InstructorDashboard] Failed to fetch commitment detail:", response.status, errorText);
        setDetailedCommitment(null);
        return;
      }

      const data = (await response.json()) as Record<string, unknown>;
      console.log("[InstructorDashboard] Detailed commitment response:", data);

      // API uses network_evidence, network_status, pending_tx_hash
      setDetailedCommitment({
        evidence: (data.network_evidence as JSONContent | null) ?? null,
        status: (data.network_status as string) ?? "UNKNOWN",
        txHash: (data.pending_tx_hash as string | null) ?? null,
      });
    } catch (err) {
      console.error("[InstructorDashboard] Error fetching commitment detail:", err);
      setDetailedCommitment(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Handle commitment selection - fetch detailed data
  const handleSelectCommitment = (commitment: TeacherAssignmentCommitment) => {
    setSelectedCommitment(commitment);
    void fetchCommitmentDetail(commitment);
  };

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...commitments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.commitmentStatus && c.commitmentStatus === statusFilter);
    }

    // Assignment filter (by moduleCode)
    if (assignmentFilter !== "all") {
      filtered = filtered.filter((c) => c.moduleCode === assignmentFilter);
    }

    // Search query (by learner participant alias)
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.studentAlias?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCommitments(filtered);
  }, [statusFilter, assignmentFilter, searchQuery, commitments]);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !course) {
    return (
      <div className="space-y-6">
        <CourseBreadcrumb
          mode="studio"
          currentPage="instructor"
        />

        <AndamioPageHeader title="Instructor Dashboard" />

        <AndamioErrorAlert error={error ?? "Course not found"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <CourseBreadcrumb
        mode="studio"
        course={{ nftPolicyId: courseNftPolicyId, title: typeof course.title === "string" ? course.title : "Course" }}
        currentPage="instructor"
      />

      <AndamioPageHeader
        title="Instructor Dashboard"
        description={typeof course.title === "string" ? course.title : undefined}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <AndamioDashboardStat icon={TeacherIcon} label="Total Commitments" value={stats.total} />
        <AndamioDashboardStat icon={PendingIcon} label="Draft" value={stats.draft} />
        <AndamioDashboardStat icon={PendingIcon} label="Pending TX" value={stats.pending} valueColor="warning" iconColor="warning" />
        <AndamioDashboardStat icon={SuccessIcon} label="On Chain" value={stats.onChain} valueColor="success" iconColor="success" />
      </div>

      {/* On-Chain Pending Assessments - Live data from merged API */}
      <PendingReviewsList
        courseId={courseNftPolicyId}
      />

      {/* Filters */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Filters</AndamioCardTitle>
          <AndamioCardDescription>Filter and search assignment commitments</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <AndamioLabel htmlFor="status-filter">Status</AndamioLabel>
              <AndamioSelect value={statusFilter} onValueChange={setStatusFilter}>
                <AndamioSelectTrigger id="status-filter">
                  <AndamioSelectValue placeholder="All statuses" />
                </AndamioSelectTrigger>
                <AndamioSelectContent>
                  <AndamioSelectItem value="all">All Statuses</AndamioSelectItem>
                  <AndamioSelectItem value="DRAFT">Draft</AndamioSelectItem>
                  <AndamioSelectItem value="PENDING_TX">Pending Transaction</AndamioSelectItem>
                  <AndamioSelectItem value="ON_CHAIN">On Chain</AndamioSelectItem>
                </AndamioSelectContent>
              </AndamioSelect>
            </div>

            <div className="space-y-2">
              <AndamioLabel htmlFor="assignment-filter">Assignment</AndamioLabel>
              <AndamioSelect value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <AndamioSelectTrigger id="assignment-filter">
                  <AndamioSelectValue placeholder="All assignments" />
                </AndamioSelectTrigger>
                <AndamioSelectContent>
                  <AndamioSelectItem value="all">All Assignments</AndamioSelectItem>
                  {uniqueModuleCodes.map((moduleCode) => (
                    <AndamioSelectItem key={moduleCode} value={moduleCode}>
                      {moduleCode}
                    </AndamioSelectItem>
                  ))}
                </AndamioSelectContent>
              </AndamioSelect>
            </div>

            <div className="space-y-2">
              <AndamioLabel htmlFor="search">Search Learner</AndamioLabel>
              <AndamioSearchInput
                id="search"
                placeholder="Search by access token alias..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {(statusFilter !== "all" || assignmentFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-2">
              <AndamioText variant="small">
                Showing {filteredCommitments.length} of {commitments.length} commitments
              </AndamioText>
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setAssignmentFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </AndamioButton>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      {/* Commitments Table */}
      {filteredCommitments.length === 0 ? (
        <AndamioEmptyState
          icon={TeacherIcon}
          title={commitments.length === 0 ? "No assignment commitments yet" : "No commitments match your filters"}
          description="Assignment commitments from learners will appear here for review."
          action={
            commitments.length > 0 ? (
              <AndamioButton
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setAssignmentFilter("all");
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
                <AndamioTableHead>Learner Access Token</AndamioTableHead>
                <AndamioTableHead>Assignment</AndamioTableHead>
                <AndamioTableHead>Network Status</AndamioTableHead>
                <AndamioTableHead>Evidence</AndamioTableHead>
              </AndamioTableRow>
            </AndamioTableHeader>
            <AndamioTableBody>
              {filteredCommitments.map((commitment) => (
                <AndamioTableRow
                  key={`${commitment.moduleCode}-${commitment.studentAlias}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSelectCommitment(commitment)}
                >
                  <AndamioTableCell className="font-mono text-xs">
                    {commitment.studentAlias ?? "No access token"}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <div>
                      <div className="font-medium">{commitment.assignment?.title ?? commitment.moduleCode}</div>
                      <div className="text-sm text-muted-foreground">
                        {commitment.moduleCode}
                      </div>
                    </div>
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <AndamioBadge variant={getStatusVariant(commitment.commitmentStatus)}>
                      {formatNetworkStatus(commitment.commitmentStatus)}
                    </AndamioBadge>
                  </AndamioTableCell>
                  <AndamioTableCell>
                    {commitment.evidence ? (
                      <AndamioText variant="small" className="max-w-xs truncate">
                        {typeof commitment.evidence === "string"
                          ? commitment.evidence
                          : JSON.stringify(commitment.evidence)}
                      </AndamioText>
                    ) : (
                      <AndamioText variant="small" className="italic">No evidence</AndamioText>
                    )}
                  </AndamioTableCell>
                </AndamioTableRow>
              ))}
            </AndamioTableBody>
          </AndamioTable>
        </AndamioTableContainer>
      )}

      {/* Selected Commitment Detail View */}
      {selectedCommitment && (
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <AndamioCardTitle>Manage Assignment Commitment</AndamioCardTitle>
                <AndamioCardDescription>
                  Review and accept or deny this assignment submission
                </AndamioCardDescription>
              </div>
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCommitment(null);
                  setDetailedCommitment(null);
                }}
              >
                <CloseIcon className="h-4 w-4" />
              </AndamioButton>
            </div>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-6">
            {/* Commitment Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <AndamioLabel>Learner Access Token</AndamioLabel>
                <AndamioText variant="small" className="font-mono mt-1 text-foreground">
                  {selectedCommitment.studentAlias ?? "No access token"}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Assignment</AndamioLabel>
                <AndamioText variant="small" className="font-medium mt-1 text-foreground">{selectedCommitment.assignment?.title ?? selectedCommitment.moduleCode}</AndamioText>
                <AndamioText variant="small" className="text-xs">{selectedCommitment.moduleCode}</AndamioText>
              </div>
              <div>
                <AndamioLabel>Current Status</AndamioLabel>
                <div className="mt-1">
                  <AndamioBadge variant={getStatusVariant(detailedCommitment?.status ?? selectedCommitment.commitmentStatus)}>
                    {formatNetworkStatus(detailedCommitment?.status ?? selectedCommitment.commitmentStatus)}
                  </AndamioBadge>
                </div>
              </div>
              {detailedCommitment?.txHash && (
                <div>
                  <AndamioLabel>Transaction Hash</AndamioLabel>
                  <AndamioText variant="small" className="font-mono mt-1 text-foreground">
                    {detailedCommitment.txHash.slice(0, 16)}...
                  </AndamioText>
                </div>
              )}
            </div>

            {/* Student Evidence - Full Tiptap Content */}
            <div className="space-y-2">
              <AndamioLabel>Student Evidence</AndamioLabel>
              {isLoadingDetail ? (
                <div className="flex items-center justify-center py-8 border rounded-md bg-muted/20">
                  <LoadingIcon className="h-6 w-6 animate-spin text-muted-foreground" />
                  <AndamioText variant="small" className="ml-2">Loading evidence...</AndamioText>
                </div>
              ) : detailedCommitment?.evidence ? (
                <div className="border rounded-md">
                  <ContentDisplay content={detailedCommitment.evidence} variant="muted" />
                </div>
              ) : (
                <div className="py-4 px-3 border rounded-md bg-muted/20">
                  <AndamioText variant="small" className="text-muted-foreground italic">
                    No evidence content available. The student may not have submitted evidence yet.
                  </AndamioText>
                </div>
              )}
            </div>

            {/* Assessment Decision */}
            <div className="space-y-3 pt-4 border-t">
              <AndamioLabel>Assessment Decision</AndamioLabel>
              <div className="flex gap-4">
                <AndamioButton
                  variant={assessmentDecision === "accept" ? "default" : "outline"}
                  onClick={() => setAssessmentDecision("accept")}
                  className="flex-1"
                >
                  <SuccessIcon className="h-4 w-4 mr-2" />
                  Accept
                </AndamioButton>
                <AndamioButton
                  variant={assessmentDecision === "refuse" ? "destructive" : "outline"}
                  onClick={() => setAssessmentDecision("refuse")}
                  className="flex-1"
                >
                  <CloseIcon className="h-4 w-4 mr-2" />
                  Refuse
                </AndamioButton>
              </div>
              <AndamioText variant="small" className="text-muted-foreground">
                {assessmentDecision === "accept"
                  ? "Accepting will grant the student credit for completing this module."
                  : "Refusing will reject the submission. The student can update and resubmit."}
              </AndamioText>
            </div>

            {/* Transaction Actions (V2) */}
            <div className="pt-4 space-y-3">
              {/* Requirements Check */}
              {!(
                selectedCommitment.studentAlias &&
                (detailedCommitment?.status ?? selectedCommitment.commitmentStatus) === "PENDING_APPROVAL"
              ) && (
                <AndamioAlert>
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>
                    {selectedCommitment.studentAlias
                      ? "This assignment is not ready for assessment"
                      : "Learner does not have an access token"}
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}

              {/* Transaction Status */}
              {assessTx.state !== "idle" && !assessTxConfirmed && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
                    <div className="flex-1">
                      <AndamioText className="font-medium">
                        {assessTx.state === "fetching" && "Preparing assessment..."}
                        {assessTx.state === "signing" && "Please sign in your wallet..."}
                        {assessTx.state === "submitting" && "Submitting assessment..."}
                        {assessTx.state === "success" && "Waiting for confirmation..."}
                      </AndamioText>
                      {assessTx.state === "success" && assessTxStatus && (
                        <AndamioText variant="small" className="text-xs">
                          {assessTxStatus.state === "pending" && "Waiting for block confirmation"}
                          {assessTxStatus.state === "confirmed" && "Processing database updates"}
                        </AndamioText>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Success State */}
              {assessTxConfirmed && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center gap-3">
                    <SuccessIcon className="h-5 w-5 text-primary" />
                    <AndamioText className="font-medium text-primary">
                      Assessment submitted successfully!
                    </AndamioText>
                  </div>
                </div>
              )}

              {/* Error State */}
              {assessTx.state === "error" && (
                <AndamioAlert variant="destructive">
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>
                    {assessTx.error?.message ?? "Assessment failed"}
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}

              {/* Submit Button */}
              {!assessTxConfirmed && (
                <TransactionButton
                  txState={assessTx.state}
                  onClick={async () => {
                    if (!user?.accessTokenAlias || !selectedCommitment.studentAlias) {
                      return;
                    }
                    await assessTx.execute({
                      txType: "COURSE_TEACHER_ASSIGNMENTS_ASSESS",
                      params: {
                        alias: user.accessTokenAlias,
                        course_id: courseNftPolicyId,
                        assignment_decisions: [
                          {
                            alias: selectedCommitment.studentAlias,
                            outcome: assessmentDecision,
                          },
                        ],
                      },
                      onError: (err) => {
                        setError(err.message);
                      },
                    });
                  }}
                  disabled={
                    !user?.accessTokenAlias ||
                    !selectedCommitment.studentAlias ||
                    (detailedCommitment?.status ?? selectedCommitment.commitmentStatus) !== "PENDING_APPROVAL"
                  }
                  stateText={{
                    idle: assessmentDecision === "accept" ? "Accept Assignment" : "Refuse Assignment",
                    fetching: "Preparing...",
                    signing: "Sign in Wallet",
                    submitting: "Submitting...",
                  }}
                  className="w-full"
                />
              )}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
