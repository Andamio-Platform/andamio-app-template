"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { AlertCircle, ArrowLeft, Users, CheckCircle, Clock, XCircle, Search } from "lucide-react";
import {
  type CourseOutput,
  type AssignmentCommitmentWithAssignmentOutput,
} from "andamio-db-api";

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

type CommitmentWithLearner = AssignmentCommitmentWithAssignmentOutput & {
  learner?: {
    name: string | null;
    walletAddress: string;
  };
};

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
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [commitments, setCommitments] = useState<CommitmentWithLearner[]>([]);
  const [filteredCommitments, setFilteredCommitments] = useState<CommitmentWithLearner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering state
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

  // Get unique assignments for filter
  const uniqueAssignments = Array.from(
    new Map(
      commitments.map((c) => [c.assignment.assignmentCode, c.assignment])
    ).values()
  );

  // Stats
  const stats = {
    total: commitments.length,
    pending: commitments.filter((c) => c.networkStatus.includes("PENDING")).length,
    accepted: commitments.filter((c) => c.networkStatus.includes("ACCEPTED")).length,
    denied: commitments.filter((c) => c.networkStatus.includes("DENIED")).length,
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/${courseNftPolicyId}`
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
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/course/${courseNftPolicyId}`
        );

        if (!commitmentsResponse.ok) {
          const errorData = (await commitmentsResponse.json()) as ApiError;
          throw new Error(errorData.message ?? "Failed to fetch assignment commitments");
        }

        const commitmentsData =
          (await commitmentsResponse.json()) as AssignmentCommitmentWithAssignmentOutput[];

        setCommitments(commitmentsData as CommitmentWithLearner[]);
        setFilteredCommitments(commitmentsData as CommitmentWithLearner[]);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseNftPolicyId, isAuthenticated]);

  // Apply filters whenever they change
  useEffect(() => {
    let filtered = [...commitments];

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.networkStatus === statusFilter);
    }

    // Assignment filter
    if (assignmentFilter !== "all") {
      filtered = filtered.filter((c) => c.assignment.assignmentCode === assignmentFilter);
    }

    // Search query (by learner ID for now)
    if (searchQuery) {
      filtered = filtered.filter((c) =>
        c.learnerId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCommitments(filtered);
  }, [statusFilter, assignmentFilter, searchQuery, commitments]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
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

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error ?? "Course not found"}</AlertDescription>
        </Alert>
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
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Course
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commitments</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Denied</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search assignment commitments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="AWAITING_EVIDENCE">Awaiting Evidence</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                  <SelectItem value="ASSIGNMENT_ACCEPTED">Accepted</SelectItem>
                  <SelectItem value="ASSIGNMENT_DENIED">Denied</SelectItem>
                  <SelectItem value="CREDENTIAL_CLAIMED">Credential Claimed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-filter">Assignment</Label>
              <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                <SelectTrigger id="assignment-filter">
                  <SelectValue placeholder="All assignments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignments</SelectItem>
                  {uniqueAssignments.map((assignment) => (
                    <SelectItem key={assignment.assignmentCode} value={assignment.assignmentCode}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="search">Search Learner ID</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by learner ID..."
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setAssignmentFilter("all");
                  setSearchQuery("");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setAssignmentFilter("all");
                setSearchQuery("");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Learner ID</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Network Status</TableHead>
                <TableHead>Private Status</TableHead>
                <TableHead>Evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCommitments.map((commitment) => (
                <TableRow key={commitment.id}>
                  <TableCell className="font-mono text-xs">
                    {commitment.learnerId.substring(0, 12)}...
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{commitment.assignment.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {commitment.assignment.assignmentCode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(commitment.networkStatus)}>
                      {formatNetworkStatus(commitment.networkStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatNetworkStatus(commitment.privateStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {commitment.networkEvidence ? (
                      <div className="max-w-xs truncate text-sm">
                        {typeof commitment.networkEvidence === "string"
                          ? commitment.networkEvidence
                          : JSON.stringify(commitment.networkEvidence)}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">No evidence</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
