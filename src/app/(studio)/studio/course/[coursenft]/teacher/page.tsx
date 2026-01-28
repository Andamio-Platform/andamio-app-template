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
  AndamioScrollArea,
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
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";
import { TransactionButton } from "~/components/tx/transaction-button";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AlertIcon } from "~/components/icons";
import { PendingReviewsList } from "~/components/teacher/pending-reviews-list";

/**
 * Teacher Dashboard Page
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

export default function TeacherDashboardPage() {
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
          clearAllDecisions();
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

  // Batch assessment decisions - keyed by "studentAlias-sltHash"
  const [pendingDecisions, setPendingDecisions] = useState<
    Map<string, { commitment: TeacherAssignmentCommitment; decision: "accept" | "refuse" }>
  >(new Map());

  // Selected commitment for viewing evidence detail
  const [selectedCommitment, setSelectedCommitment] = useState<TeacherAssignmentCommitment | null>(null);

  // Helper to create unique key for a commitment
  const getCommitmentKey = (commitment: TeacherAssignmentCommitment) =>
    `${commitment.studentAlias}-${commitment.sltHash}`;

  // Helper to set/update a decision
  const setDecision = (commitment: TeacherAssignmentCommitment, decision: "accept" | "refuse") => {
    const key = getCommitmentKey(commitment);
    setPendingDecisions((prev) => {
      const next = new Map(prev);
      next.set(key, { commitment, decision });
      return next;
    });
  };

  // Helper to remove a decision
  const removeDecision = (commitment: TeacherAssignmentCommitment) => {
    const key = getCommitmentKey(commitment);
    setPendingDecisions((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  };

  // Helper to clear all decisions
  const clearAllDecisions = () => {
    setPendingDecisions(new Map());
  };

  // Get decision for a commitment (if any)
  const getDecision = (commitment: TeacherAssignmentCommitment) => {
    const key = getCommitmentKey(commitment);
    return pendingDecisions.get(key)?.decision ?? null;
  };

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

  // Get unique assignments for filter (by moduleCode)
  const uniqueModuleCodes = Array.from(
    new Set(commitments.map((c) => c.moduleCode).filter((c): c is string => !!c))
  );

  // Stats - use optional chaining since commitmentStatus might be undefined
  // Status values: DRAFT, PENDING_TX, PENDING_APPROVAL, ON_CHAIN
  const stats = {
    total: commitments.length,
    draft: commitments.filter((c) => c.commitmentStatus === "DRAFT").length,
    pendingTx: commitments.filter((c) => c.commitmentStatus === "PENDING_TX").length,
    pendingReview: commitments.filter((c) => c.commitmentStatus === "PENDING_APPROVAL").length,
    completed: commitments.filter((c) => c.commitmentStatus === "ON_CHAIN" || c.commitmentStatus === "ACCEPTED").length,
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
      // Updated 2026-01-28: content object now populated with evidence
      // See: andamio-api/docs/REPL_NOTES/2026-01-28-teacher-commitments-fix.md
      interface RawCommitmentContent {
        evidence?: Record<string, unknown>;  // Tiptap JSON document
        assignment_evidence_hash?: string;
        commitment_status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
      }

      interface RawCommitment {
        course_id: string;
        slt_hash: string;
        course_module_code?: string;  // Human-readable module code (e.g., "101")
        student_alias: string;
        submission_tx?: string;
        submission_slot?: number;
        on_chain_content?: string;  // Hex-encoded on-chain content
        content?: RawCommitmentContent;  // Off-chain content from DB
        source: "merged" | "chain_only" | "db_only";
      }

      const result = (await commitmentsResponse.json()) as {
        data?: RawCommitment[];
        warning?: string;
      };

      // Debug: log the actual API response to see all available fields
      console.log("[TeacherDashboard] Assignment commitments response:", {
        count: result.data?.length ?? 0,
        warning: result.warning,
        items: result.data?.map((c) => ({
          student_alias: c.student_alias,
          slt_hash: c.slt_hash?.slice(0, 16),
          source: c.source,
          course_module_code: c.course_module_code,
          // Content object (from DB)
          has_content: !!c.content,
          content_status: c.content?.commitment_status,
          has_evidence: !!c.content?.evidence,
          evidence_hash: c.content?.assignment_evidence_hash?.slice(0, 16),
          // On-chain content (hex)
          on_chain_content: c.on_chain_content?.slice(0, 32),
        })),
      });

      if (result.warning) {
        console.warn("[TeacherDashboard] API warning:", result.warning);
      }

      // Helper to decode hex string to UTF-8 text
      const hexToText = (hex: string): string => {
        try {
          const bytes = new Uint8Array(
            hex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
          );
          return new TextDecoder().decode(bytes);
        } catch {
          return hex; // Return original if decode fails
        }
      };

      // Map source + content.commitment_status to a display-friendly status
      // API statuses: DRAFT, SUBMITTED, APPROVED, REJECTED
      // Display statuses: DRAFT, PENDING_TX, PENDING_APPROVAL, ON_CHAIN, ACCEPTED
      const mapToDisplayStatus = (
        source: string | undefined,
        contentStatus: string | undefined
      ): string => {
        // If we have content status, use it
        if (contentStatus) {
          switch (contentStatus) {
            case "SUBMITTED":
              return "PENDING_APPROVAL";  // Submitted = awaiting teacher review
            case "APPROVED":
              return "ACCEPTED";
            case "REJECTED":
              return "DENIED";
            case "DRAFT":
              return "DRAFT";
            default:
              return contentStatus;
          }
        }
        // Fall back to source-based status
        switch (source) {
          case "chain_only":
            return "PENDING_APPROVAL";  // On-chain but not in DB = pending review
          case "merged":
            return "PENDING_APPROVAL";  // Merged data = needs status from content
          case "db_only":
            return "DRAFT";
          default:
            return "UNKNOWN";
        }
      };

      // Transform API response to app types
      // Evidence is now under content.evidence (Tiptap JSON)
      const commitmentsData: TeacherAssignmentCommitment[] = (result.data ?? []).map((raw) => ({
        courseId: raw.course_id,
        studentAlias: raw.student_alias,
        sltHash: raw.slt_hash,
        submissionTx: raw.submission_tx,
        submissionSlot: raw.submission_slot,
        onChainContent: raw.on_chain_content ? hexToText(raw.on_chain_content) : undefined,
        moduleCode: raw.course_module_code,
        // Evidence is now under content.evidence (Tiptap JSON document)
        evidence: raw.content?.evidence,
        // Status from content.commitment_status, mapped to display status
        commitmentStatus: mapToDisplayStatus(raw.source, raw.content?.commitment_status),
      }));

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

  // Handle commitment selection - for viewing evidence
  const handleSelectCommitment = (commitment: TeacherAssignmentCommitment) => {
    setSelectedCommitment(selectedCommitment?.studentAlias === commitment.studentAlias &&
                          selectedCommitment?.sltHash === commitment.sltHash
                          ? null : commitment);
  };

  // Check if a commitment is ready for assessment
  const isReadyForAssessment = (commitment: TeacherAssignmentCommitment) => {
    return commitment.studentAlias && commitment.commitmentStatus === "PENDING_APPROVAL";
  };

  // Get commitments that are ready for assessment
  const assessableCommitments = filteredCommitments.filter(isReadyForAssessment);

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
      <div className="space-y-6 p-6">
        <AndamioPageHeader title="Teacher Dashboard" />
        <AndamioErrorAlert error={error ?? "Course not found"} />
      </div>
    );
  }

  return (
    <AndamioScrollArea className="h-full">
      <div className="space-y-6 p-6">
        <AndamioPageHeader
          title="Teacher Dashboard"
          description={typeof course.title === "string" ? course.title : undefined}
        />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <AndamioDashboardStat icon={TeacherIcon} label="Total" value={stats.total} />
        <AndamioDashboardStat icon={PendingIcon} label="Draft" value={stats.draft} />
        <AndamioDashboardStat icon={PendingIcon} label="Pending TX" value={stats.pendingTx} valueColor="warning" iconColor="warning" />
        <AndamioDashboardStat icon={TeacherIcon} label="Pending Review" value={stats.pendingReview} valueColor="info" iconColor="info" />
        <AndamioDashboardStat icon={SuccessIcon} label="Completed" value={stats.completed} valueColor="success" iconColor="success" />
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
                <AndamioTableHead>Learner</AndamioTableHead>
                <AndamioTableHead>Assignment</AndamioTableHead>
                <AndamioTableHead>Status</AndamioTableHead>
                <AndamioTableHead>Evidence</AndamioTableHead>
                <AndamioTableHead className="text-center">Decision</AndamioTableHead>
              </AndamioTableRow>
            </AndamioTableHeader>
            <AndamioTableBody>
              {filteredCommitments.map((commitment) => {
                const decision = getDecision(commitment);
                const canAssess = isReadyForAssessment(commitment);
                const isSelected = selectedCommitment?.studentAlias === commitment.studentAlias &&
                                   selectedCommitment?.sltHash === commitment.sltHash;

                return (
                  <AndamioTableRow
                    key={`${commitment.moduleCode}-${commitment.studentAlias}`}
                    className={`${isSelected ? "bg-muted" : ""} ${
                      decision === "accept" ? "bg-primary/5" : decision === "refuse" ? "bg-destructive/5" : ""
                    }`}
                  >
                    <AndamioTableCell
                      className="font-mono text-xs cursor-pointer hover:text-primary"
                      onClick={() => handleSelectCommitment(commitment)}
                    >
                      {commitment.studentAlias ?? "No access token"}
                    </AndamioTableCell>
                    <AndamioTableCell
                      className="cursor-pointer hover:text-primary"
                      onClick={() => handleSelectCommitment(commitment)}
                    >
                      <div className="font-medium">
                        {commitment.moduleCode ?? (commitment.sltHash ? `${commitment.sltHash.slice(0, 8)}...` : "Unknown")}
                      </div>
                    </AndamioTableCell>
                    <AndamioTableCell>
                      <AndamioBadge variant={getStatusVariant(commitment.commitmentStatus)}>
                        {formatNetworkStatus(commitment.commitmentStatus)}
                      </AndamioBadge>
                    </AndamioTableCell>
                    <AndamioTableCell>
                      {commitment.evidence || commitment.onChainContent ? (
                        <AndamioBadge variant="outline" className="text-primary">Has Evidence</AndamioBadge>
                      ) : (
                        <AndamioText variant="small" className="italic text-muted-foreground">None</AndamioText>
                      )}
                    </AndamioTableCell>
                    <AndamioTableCell>
                      {canAssess ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDecision(commitment, "accept")}
                            className={`rounded-md p-1.5 transition-all ${
                              decision === "accept"
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-primary/20 text-muted-foreground hover:text-primary"
                            }`}
                            title="Accept"
                          >
                            <SuccessIcon className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDecision(commitment, "refuse")}
                            className={`rounded-md p-1.5 transition-all ${
                              decision === "refuse"
                                ? "bg-destructive text-destructive-foreground"
                                : "hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                            }`}
                            title="Refuse"
                          >
                            <CloseIcon className="h-4 w-4" />
                          </button>
                          {decision && (
                            <button
                              type="button"
                              onClick={() => removeDecision(commitment)}
                              className="ml-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                              title="Clear decision"
                            >
                              <CloseIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <AndamioText variant="small" className="text-center text-muted-foreground">—</AndamioText>
                      )}
                    </AndamioTableCell>
                  </AndamioTableRow>
                );
              })}
            </AndamioTableBody>
          </AndamioTable>
        </AndamioTableContainer>
      )}

      {/* Assignment Detail Viewer - Shows when a commitment is selected */}
      {selectedCommitment && (
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <AndamioCardTitle>Assignment Details</AndamioCardTitle>
                <AndamioCardDescription>
                  Review submission details and evidence
                </AndamioCardDescription>
              </div>
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCommitment(null)}
              >
                <CloseIcon className="h-4 w-4" />
              </AndamioButton>
            </div>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {/* Assignment Info */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <AndamioLabel>Learner</AndamioLabel>
                <AndamioText variant="small" className="font-mono mt-1">
                  {selectedCommitment.studentAlias ?? "No access token"}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Assignment</AndamioLabel>
                <AndamioText variant="small" className="font-medium mt-1">
                  {selectedCommitment.moduleCode ?? (selectedCommitment.sltHash ? `${selectedCommitment.sltHash.slice(0, 12)}...` : "Unknown")}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Status</AndamioLabel>
                <div className="mt-1">
                  <AndamioBadge variant={getStatusVariant(selectedCommitment.commitmentStatus)}>
                    {formatNetworkStatus(selectedCommitment.commitmentStatus)}
                  </AndamioBadge>
                </div>
              </div>
              {selectedCommitment.submissionTx && (
                <div>
                  <AndamioLabel>Transaction</AndamioLabel>
                  <AndamioText variant="small" className="font-mono mt-1">
                    {selectedCommitment.submissionTx.slice(0, 12)}...
                  </AndamioText>
                </div>
              )}
            </div>

            {/* Evidence Section */}
            <div className="space-y-2 pt-4 border-t">
              <AndamioLabel>Student Evidence</AndamioLabel>
              {selectedCommitment.evidence ? (
                <div className="border rounded-md">
                  <ContentDisplay content={selectedCommitment.evidence as JSONContent} variant="muted" />
                </div>
              ) : selectedCommitment.onChainContent ? (
                <div className="py-4 px-3 border rounded-md bg-muted/20">
                  <AndamioText variant="small" className="font-mono break-all">
                    {selectedCommitment.onChainContent}
                  </AndamioText>
                  <AndamioText variant="small" className="text-muted-foreground italic mt-2">
                    On-chain evidence hash. Database record not found.
                  </AndamioText>
                </div>
              ) : (
                <div className="py-4 px-3 border rounded-md bg-muted/20">
                  <AndamioText variant="small" className="text-muted-foreground italic">
                    No evidence submitted yet.
                  </AndamioText>
                </div>
              )}
            </div>

            {/* Quick Decision Buttons */}
            {isReadyForAssessment(selectedCommitment) && (
              <div className="flex items-center gap-3 pt-4 border-t">
                <AndamioText variant="small" className="text-muted-foreground">Quick decision:</AndamioText>
                <div className="flex gap-2">
                  <AndamioButton
                    size="sm"
                    variant={getDecision(selectedCommitment) === "accept" ? "default" : "outline"}
                    onClick={() => setDecision(selectedCommitment, "accept")}
                  >
                    <SuccessIcon className="h-4 w-4 mr-1" />
                    Accept
                  </AndamioButton>
                  <AndamioButton
                    size="sm"
                    variant={getDecision(selectedCommitment) === "refuse" ? "destructive" : "outline"}
                    onClick={() => setDecision(selectedCommitment, "refuse")}
                  >
                    <CloseIcon className="h-4 w-4 mr-1" />
                    Refuse
                  </AndamioButton>
                </div>
                {getDecision(selectedCommitment) && (
                  <AndamioButton
                    size="sm"
                    variant="ghost"
                    onClick={() => removeDecision(selectedCommitment)}
                  >
                    Clear
                  </AndamioButton>
                )}
              </div>
            )}
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Batch Submit Card - Shows when there are pending decisions */}
      {pendingDecisions.size > 0 && (
        <AndamioCard className="border-primary/50">
          <AndamioCardHeader>
            <div className="flex items-center justify-between">
              <div>
                <AndamioCardTitle>Pending Assessment Decisions</AndamioCardTitle>
                <AndamioCardDescription>
                  {pendingDecisions.size} decision{pendingDecisions.size !== 1 ? "s" : ""} ready to submit
                </AndamioCardDescription>
              </div>
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={clearAllDecisions}
              >
                Clear All
              </AndamioButton>
            </div>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {/* Decision Summary Table */}
            <div className="rounded-md border">
              <AndamioTable>
                <AndamioTableHeader>
                  <AndamioTableRow>
                    <AndamioTableHead>Learner</AndamioTableHead>
                    <AndamioTableHead>Assignment</AndamioTableHead>
                    <AndamioTableHead>Decision</AndamioTableHead>
                    <AndamioTableHead className="w-10"></AndamioTableHead>
                  </AndamioTableRow>
                </AndamioTableHeader>
                <AndamioTableBody>
                  {Array.from(pendingDecisions.entries()).map(([key, { commitment, decision }]) => (
                    <AndamioTableRow key={key}>
                      <AndamioTableCell className="font-mono text-xs">
                        {commitment.studentAlias}
                      </AndamioTableCell>
                      <AndamioTableCell>
                        {commitment.moduleCode ?? commitment.sltHash?.slice(0, 8)}
                      </AndamioTableCell>
                      <AndamioTableCell>
                        <AndamioBadge variant={decision === "accept" ? "default" : "destructive"}>
                          {decision === "accept" ? "Accept" : "Refuse"}
                        </AndamioBadge>
                      </AndamioTableCell>
                      <AndamioTableCell>
                        <button
                          type="button"
                          onClick={() => removeDecision(commitment)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                          title="Remove"
                        >
                          <CloseIcon className="h-4 w-4" />
                        </button>
                      </AndamioTableCell>
                    </AndamioTableRow>
                  ))}
                </AndamioTableBody>
              </AndamioTable>
            </div>

            {/* Transaction Status */}
            {assessTx.state !== "idle" && !assessTxConfirmed && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
                  <div className="flex-1">
                    <AndamioText className="font-medium">
                      {assessTx.state === "fetching" && "Preparing assessments..."}
                      {assessTx.state === "signing" && "Please sign in your wallet..."}
                      {assessTx.state === "submitting" && "Submitting assessments..."}
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
                    All assessments submitted successfully!
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
                  if (!user?.accessTokenAlias) return;

                  // Build the assignment_decisions array from pending decisions
                  const decisions = Array.from(pendingDecisions.values()).map(({ commitment, decision }) => ({
                    alias: commitment.studentAlias!,
                    outcome: decision,
                  }));

                  await assessTx.execute({
                    txType: "COURSE_TEACHER_ASSIGNMENTS_ASSESS",
                    params: {
                      alias: user.accessTokenAlias,
                      course_id: courseNftPolicyId,
                      assignment_decisions: decisions,
                    },
                    onError: (err) => {
                      setError(err.message);
                    },
                  });
                }}
                disabled={!user?.accessTokenAlias || pendingDecisions.size === 0}
                stateText={{
                  idle: `Submit ${pendingDecisions.size} Assessment${pendingDecisions.size !== 1 ? "s" : ""}`,
                  fetching: "Preparing...",
                  signing: "Sign in Wallet",
                  submitting: "Submitting...",
                }}
                className="w-full"
              />
            )}
          </AndamioCardContent>
        </AndamioCard>
      )}
      </div>
    </AndamioScrollArea>
  );
}
