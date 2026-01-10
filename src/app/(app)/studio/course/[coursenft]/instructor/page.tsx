"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
import { TeacherIcon, SuccessIcon, PendingIcon, ErrorIcon, CloseIcon } from "~/components/icons";
import {
  type CourseResponse,
  type AssignmentCommitmentResponse,
} from "@andamio/db-api-types";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { COURSE_TEACHER_ASSIGNMENTS_ASSESS } from "@andamio/transactions";
import { AndamioTransaction } from "~/components/transactions/andamio-transaction";
import { buildAccessTokenUnit } from "~/lib/access-token-utils";
import { PendingReviewsList } from "~/components/instructor/pending-reviews-list";

/**
 * Instructor Dashboard Page
 *
 * View all student assignment commitments for a course
 *
 * API Endpoint:
 * - GET /assignment-commitments/course/{courseNftPolicyId} (protected)
 */

interface ApiError {
  message?: string;
}

// Network status color mapping based on workflow stages
const getStatusVariant = (
  status: string
): "default" | "secondary" | "destructive" | "outline" => {
  // Pending/in-progress states
  if (status.includes("PENDING")) return "secondary";
  // Success states
  if (status.includes("ACCEPTED") || status.includes("CLAIMED")) return "default";
  // Failure states
  if (status.includes("DENIED")) return "destructive";
  // Initial states
  if (status === "AWAITING_EVIDENCE") return "outline";
  // Other states
  return "default";
};

const formatNetworkStatus = (status: string): string => {
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

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [commitments, setCommitments] = useState<AssignmentCommitmentResponse[]>([]);
  const [filteredCommitments, setFilteredCommitments] = useState<AssignmentCommitmentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected commitment for management
  const [selectedCommitment, setSelectedCommitment] = useState<AssignmentCommitmentResponse | null>(null);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

  // Get unique assignments for filter (by module_code)
  const uniqueModuleCodes = Array.from(
    new Set(commitments.map((c) => c.module_code))
  );

  // Stats
  const stats = {
    total: commitments.length,
    pending: commitments.filter((c) => c.status.includes("PENDING")).length,
    accepted: commitments.filter((c) => c.status.includes("ACCEPTED")).length,
    denied: commitments.filter((c) => c.status.includes("DENIED")).length,
  };

  // Fetch data function - extracted so it can be called from transaction success handlers
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Go API: GET /course/public/course/get/{policy_id}
      const courseResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/course/get/${courseNftPolicyId}`
      );

      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
      }

      const courseData = (await courseResponse.json()) as CourseResponse;
      setCourse(courseData);

      // Fetch assignment commitments for this course
      if (!isAuthenticated) {
        throw new Error("You must be authenticated to view assignment commitments");
      }

      // Go API: POST /course/teacher/assignment-commitment/by-course
      const commitmentsResponse = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/teacher/assignment-commitment/by-course`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (!commitmentsResponse.ok) {
        const errorData = (await commitmentsResponse.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to fetch assignment commitments");
      }

      const commitmentsData =
        (await commitmentsResponse.json()) as AssignmentCommitmentResponse[];

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

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...commitments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    // Assignment filter (by module_code)
    if (assignmentFilter !== "all") {
      filtered = filtered.filter((c) => c.module_code === assignmentFilter);
    }

    // Search query (by learner access token alias)
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.access_token_alias?.toLowerCase().includes(searchQuery.toLowerCase())
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
        course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
        currentPage="instructor"
      />

      <AndamioPageHeader
        title="Instructor Dashboard"
        description={course.title}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <AndamioDashboardStat icon={TeacherIcon} label="Total Commitments" value={stats.total} />
        <AndamioDashboardStat icon={PendingIcon} label="Pending" value={stats.pending} />
        <AndamioDashboardStat icon={SuccessIcon} label="Accepted" value={stats.accepted} valueColor="success" iconColor="success" />
        <AndamioDashboardStat icon={ErrorIcon} label="Denied" value={stats.denied} valueColor="destructive" iconColor="destructive" />
      </div>

      {/* On-Chain Pending Assessments - Live data from Andamioscan */}
      <PendingReviewsList
        accessTokenAlias={user?.accessTokenAlias}
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
                  <AndamioSelectItem value="AWAITING_EVIDENCE">Awaiting Evidence</AndamioSelectItem>
                  <AndamioSelectItem value="PENDING_APPROVAL">Pending Approval</AndamioSelectItem>
                  <AndamioSelectItem value="ASSIGNMENT_ACCEPTED">Accepted</AndamioSelectItem>
                  <AndamioSelectItem value="ASSIGNMENT_DENIED">Denied</AndamioSelectItem>
                  <AndamioSelectItem value="CREDENTIAL_CLAIMED">Credential Claimed</AndamioSelectItem>
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
                  key={`${commitment.module_code}-${commitment.access_token_alias}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCommitment(commitment)}
                >
                  <AndamioTableCell className="font-mono text-xs">
                    {commitment.access_token_alias ?? "No access token"}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <div>
                      <div className="font-medium">{commitment.assignment_title ?? commitment.module_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {commitment.module_code}
                      </div>
                    </div>
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <AndamioBadge variant={getStatusVariant(commitment.status)}>
                      {formatNetworkStatus(commitment.status)}
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
                onClick={() => setSelectedCommitment(null)}
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
                  {selectedCommitment.access_token_alias ?? "No access token"}
                </AndamioText>
              </div>
              <div>
                <AndamioLabel>Assignment</AndamioLabel>
                <AndamioText variant="small" className="font-medium mt-1 text-foreground">{selectedCommitment.assignment_title ?? selectedCommitment.module_code}</AndamioText>
                <AndamioText variant="small" className="text-xs">{selectedCommitment.module_code}</AndamioText>
              </div>
              <div>
                <AndamioLabel>Current Status</AndamioLabel>
                <div className="mt-1">
                  <AndamioBadge variant={getStatusVariant(selectedCommitment.status)}>
                    {formatNetworkStatus(selectedCommitment.status)}
                  </AndamioBadge>
                </div>
              </div>
              <div>
                <AndamioLabel>Evidence</AndamioLabel>
                <AndamioText variant="small" className="mt-1 max-w-md break-words text-foreground">
                  {selectedCommitment.evidence ? (
                    typeof selectedCommitment.evidence === "string"
                      ? selectedCommitment.evidence
                      : JSON.stringify(selectedCommitment.evidence)
                  ) : (
                    <span className="text-muted-foreground italic">No evidence submitted</span>
                  )}
                </AndamioText>
              </div>
            </div>

            {/* Transaction Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <AndamioTransaction
                definition={COURSE_TEACHER_ASSIGNMENTS_ASSESS}
                inputs={{
                  user_access_token: user?.accessTokenAlias
                    ? buildAccessTokenUnit(user.accessTokenAlias, env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID)
                    : "",
                  student_alias: selectedCommitment.access_token_alias ?? "",
                  policy: courseNftPolicyId,
                  moduleCode: selectedCommitment.module_code,
                }}
                onSuccess={async () => {
                  // Refresh commitments list
                  await fetchData();
                  setSelectedCommitment(null);
                }}
                requirements={{
                  check: !!(
                    selectedCommitment.access_token_alias &&
                    selectedCommitment.status !== "ON_CHAIN"
                  ),
                  failureMessage: selectedCommitment.access_token_alias
                    ? "This assignment has already been processed"
                    : "Learner does not have an access token",
                }}
              />
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
