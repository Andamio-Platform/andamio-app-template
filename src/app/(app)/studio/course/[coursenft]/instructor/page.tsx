"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import {
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
} from "~/components/andamio/andamio-table";
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AlertCircle, ArrowLeft, Users, CheckCircle, Clock, XCircle, Search, X } from "lucide-react";
import {
  type CourseOutput,
  type AssignmentCommitmentWithAssignmentOutput,
} from "@andamio/db-api";
import { ACCEPT_ASSIGNMENT, DENY_ASSIGNMENT } from "@andamio/transactions";
import { AndamioTransaction } from "~/components/transactions/andamio-transaction";
import { buildAccessTokenUnit } from "~/lib/access-token-utils";

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

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [commitments, setCommitments] = useState<AssignmentCommitmentWithAssignmentOutput[]>([]);
  const [filteredCommitments, setFilteredCommitments] = useState<AssignmentCommitmentWithAssignmentOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected commitment for management
  const [selectedCommitment, setSelectedCommitment] = useState<AssignmentCommitmentWithAssignmentOutput | null>(null);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

  // Get unique assignments for filter
  const uniqueAssignments = Array.from(
    new Map(
      commitments.map((c) => [c.assignment.assignment_code, c.assignment])
    ).values()
  );

  // Stats
  const stats = {
    total: commitments.length,
    pending: commitments.filter((c) => c.network_status.includes("PENDING")).length,
    accepted: commitments.filter((c) => c.network_status.includes("ACCEPTED")).length,
    denied: commitments.filter((c) => c.network_status.includes("DENIED")).length,
  };

  // Fetch data function - extracted so it can be called from transaction success handlers
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch course details (POST /courses/get)
      const courseResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course: ${courseResponse.statusText}`);
      }

      const courseData = (await courseResponse.json()) as CourseOutput;
      setCourse(courseData);

      // Fetch assignment commitments for this course
      if (!isAuthenticated) {
        throw new Error("You must be authenticated to view assignment commitments");
      }

      const commitmentsResponse = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/list-by-course`,
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
        (await commitmentsResponse.json()) as AssignmentCommitmentWithAssignmentOutput[];

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
      filtered = filtered.filter((c) => c.network_status === statusFilter);
    }

    // Assignment filter
    if (assignmentFilter !== "all") {
      filtered = filtered.filter((c) => c.assignment.assignment_code === assignmentFilter);
    }

    // Search query (by learner access token alias)
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.learner_access_token_alias?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCommitments(filtered);
  }, [statusFilter, assignmentFilter, searchQuery, commitments]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <AndamioSkeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <AndamioSkeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !course) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
        </div>

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error ?? "Course not found"}</AndamioAlertDescription>
        </AndamioAlert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href={`/studio/course/${courseNftPolicyId}`}>
              <AndamioButton variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Course
              </AndamioButton>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <AndamioCard>
          <AndamioCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AndamioCardTitle className="text-sm font-medium">Total Commitments</AndamioCardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </AndamioCardContent>
        </AndamioCard>

        <AndamioCard>
          <AndamioCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AndamioCardTitle className="text-sm font-medium">Pending</AndamioCardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </AndamioCardContent>
        </AndamioCard>

        <AndamioCard>
          <AndamioCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AndamioCardTitle className="text-sm font-medium">Accepted</AndamioCardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="text-2xl font-bold text-success">{stats.accepted}</div>
          </AndamioCardContent>
        </AndamioCard>

        <AndamioCard>
          <AndamioCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <AndamioCardTitle className="text-sm font-medium">Denied</AndamioCardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="text-2xl font-bold text-destructive">{stats.denied}</div>
          </AndamioCardContent>
        </AndamioCard>
      </div>

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
                  {uniqueAssignments.map((assignment) => (
                    <AndamioSelectItem key={assignment.assignment_code} value={assignment.assignment_code}>
                      {assignment.title}
                    </AndamioSelectItem>
                  ))}
                </AndamioSelectContent>
              </AndamioSelect>
            </div>

            <div className="space-y-2">
              <AndamioLabel htmlFor="search">Search Learner</AndamioLabel>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <AndamioInput
                  id="search"
                  placeholder="Search by access token alias..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {(statusFilter !== "all" || assignmentFilter !== "all" || searchQuery) && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {filteredCommitments.length} of {commitments.length} commitments
              </span>
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
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {commitments.length === 0
              ? "No assignment commitments yet."
              : "No commitments match your filters."}
          </p>
          {commitments.length > 0 && (
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
          )}
        </div>
      ) : (
        <div className="border rounded-md">
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
                  key={commitment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedCommitment(commitment)}
                >
                  <AndamioTableCell className="font-mono text-xs">
                    {commitment.learner_access_token_alias ?? "No access token"}
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <div>
                      <div className="font-medium">{commitment.assignment.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {commitment.assignment.assignment_code}
                      </div>
                    </div>
                  </AndamioTableCell>
                  <AndamioTableCell>
                    <AndamioBadge variant={getStatusVariant(commitment.network_status)}>
                      {formatNetworkStatus(commitment.network_status)}
                    </AndamioBadge>
                  </AndamioTableCell>
                  <AndamioTableCell>
                    {commitment.network_evidence ? (
                      <div className="max-w-xs truncate text-sm">
                        {typeof commitment.network_evidence === "string"
                          ? commitment.network_evidence
                          : JSON.stringify(commitment.network_evidence)}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No evidence</span>
                    )}
                  </AndamioTableCell>
                </AndamioTableRow>
              ))}
            </AndamioTableBody>
          </AndamioTable>
        </div>
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
                <X className="h-4 w-4" />
              </AndamioButton>
            </div>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-6">
            {/* Commitment Details */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <AndamioLabel>Learner Access Token</AndamioLabel>
                <p className="text-sm font-mono mt-1">
                  {selectedCommitment.learner_access_token_alias ?? "No access token"}
                </p>
              </div>
              <div>
                <AndamioLabel>Assignment</AndamioLabel>
                <p className="text-sm font-medium mt-1">{selectedCommitment.assignment.title}</p>
                <p className="text-xs text-muted-foreground">{selectedCommitment.assignment.assignment_code}</p>
              </div>
              <div>
                <AndamioLabel>Current Status</AndamioLabel>
                <div className="mt-1">
                  <AndamioBadge variant={getStatusVariant(selectedCommitment.network_status)}>
                    {formatNetworkStatus(selectedCommitment.network_status)}
                  </AndamioBadge>
                </div>
              </div>
              <div>
                <AndamioLabel>Evidence</AndamioLabel>
                <p className="text-sm mt-1 max-w-md break-words">
                  {selectedCommitment.network_evidence ? (
                    typeof selectedCommitment.network_evidence === "string"
                      ? selectedCommitment.network_evidence
                      : JSON.stringify(selectedCommitment.network_evidence)
                  ) : (
                    <span className="text-muted-foreground italic">No evidence submitted</span>
                  )}
                </p>
              </div>
            </div>

            {/* Transaction Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <AndamioTransaction
                definition={ACCEPT_ASSIGNMENT}
                inputs={{
                  user_access_token: user?.accessTokenAlias
                    ? buildAccessTokenUnit(user.accessTokenAlias, env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID)
                    : "",
                  student_alias: selectedCommitment.learner_access_token_alias ?? "",
                  policy: courseNftPolicyId,
                  moduleCode: selectedCommitment.assignment.module.module_code,
                }}
                onSuccess={async () => {
                  // Refresh commitments list
                  await fetchData();
                  setSelectedCommitment(null);
                }}
                requirements={{
                  check: !!(
                    selectedCommitment.learner_access_token_alias &&
                    !(
                      selectedCommitment.network_status === "PENDING_TX_ASSIGNMENT_ACCEPTED" ||
                      selectedCommitment.network_status === "ASSIGNMENT_ACCEPTED" ||
                      selectedCommitment.network_status === "CREDENTIAL_CLAIMED"
                    )
                  ),
                  failureMessage: selectedCommitment.learner_access_token_alias
                    ? "This assignment has already been accepted or claimed"
                    : "Learner does not have an access token",
                }}
              />
              <AndamioTransaction
                definition={DENY_ASSIGNMENT}
                inputs={{
                  user_access_token: user?.accessTokenAlias
                    ? buildAccessTokenUnit(user.accessTokenAlias, env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID)
                    : "",
                  student_alias: selectedCommitment.learner_access_token_alias ?? "",
                  policy: courseNftPolicyId,
                  moduleCode: selectedCommitment.assignment.module.module_code,
                }}
                onSuccess={async () => {
                  // Refresh commitments list
                  await fetchData();
                  setSelectedCommitment(null);
                }}
                requirements={{
                  check: !!(
                    selectedCommitment.learner_access_token_alias &&
                    !(
                      selectedCommitment.network_status === "PENDING_TX_ASSIGNMENT_DENIED" ||
                      selectedCommitment.network_status === "ASSIGNMENT_DENIED"
                    )
                  ),
                  failureMessage: selectedCommitment.learner_access_token_alias
                    ? "This assignment has already been denied"
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
