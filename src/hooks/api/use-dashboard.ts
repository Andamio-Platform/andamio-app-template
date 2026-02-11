/**
 * React Query hook for the consolidated dashboard endpoint.
 *
 * Returns all user dashboard data in a single request, eliminating the N+1 query pattern.
 * This replaces multiple individual API calls with one consolidated call.
 *
 * Endpoint: POST /api/v2/user/dashboard
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const { data: dashboard, isLoading } = useDashboard();
 *
 *   if (isLoading) return <DashboardSkeleton />;
 *
 *   return (
 *     <>
 *       <Stats
 *         enrolled={dashboard.counts.enrolledCourses}
 *         credentials={dashboard.counts.totalCredentials}
 *       />
 *       <TeacherSection pending={dashboard.teacher.totalPendingReviews} />
 *       <ProjectsSection projects={dashboard.projects.contributing} />
 *     </>
 *   );
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import type {
  MergedHandlersDashboardResponseWrapper,
  OrchestrationDashboardResponse,
  OrchestrationDashboardCounts,
  OrchestrationDashboardUser,
  OrchestrationStudentDashboard,
  OrchestrationTeacherDashboard,
  OrchestrationProjectsDashboard,
  OrchestrationDashboardCourseSummary,
  OrchestrationDashboardCredentialSummary,
  OrchestrationDashboardCommitmentSummary,
  OrchestrationDashboardPendingReviewSummary,
  OrchestrationDashboardProjectSummary,
  OrchestrationDashboardProjectWithPrereqs,
} from "~/types/generated/gateway";

// =============================================================================
// App-Level Types
// =============================================================================

export interface DashboardUser {
  alias: string;
  walletAddress: string;
}

export interface DashboardCounts {
  enrolledCourses: number;
  completedCourses: number;
  totalCredentials: number;
  teachingCourses: number;
  pendingReviews: number;
  contributingProjects: number;
  managingProjects: number;
}

export interface DashboardCourseSummary {
  courseId: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface DashboardCredentialSummary {
  courseId: string;
  courseTitle: string;
  credentials: string[];
}

export interface DashboardCommitmentSummary {
  courseId: string;
  sltHash: string;
  status: string;
}

export interface DashboardPendingReview {
  courseId: string;
  courseTitle: string;
  count: number;
}

export interface DashboardProjectSummary {
  projectId: string;
  title: string;
  description: string;
  imageUrl: string;
}

export interface DashboardProjectPrerequisite {
  courseId: string;
  sltHashes: string[];
}

export interface DashboardProjectWithPrereqs {
  projectId: string;
  title: string;
  imageUrl: string;
  /** Whether user has all required credentials */
  qualified: boolean;
  prerequisites: DashboardProjectPrerequisite[];
}

export interface DashboardStudent {
  enrolledCourses: DashboardCourseSummary[];
  completedCourses: DashboardCourseSummary[];
  totalCredentials: number;
  credentialsByCourse: DashboardCredentialSummary[];
  commitments: DashboardCommitmentSummary[];
}

export interface DashboardTeacher {
  courses: DashboardCourseSummary[];
  pendingReviews: DashboardPendingReview[];
  totalPendingReviews: number;
}

export interface DashboardProjects {
  contributing: DashboardProjectSummary[];
  managing: DashboardProjectSummary[];
  withPrerequisites: DashboardProjectWithPrereqs[];
}

export interface Dashboard {
  user: DashboardUser;
  counts: DashboardCounts;
  student: DashboardStudent;
  teacher: DashboardTeacher;
  projects: DashboardProjects;
  warning?: string;
}

// =============================================================================
// Query Keys
// =============================================================================

export const dashboardKeys = {
  all: ["dashboard"] as const,
  user: () => [...dashboardKeys.all, "user"] as const,
};

// =============================================================================
// Transform Functions
// =============================================================================

function transformCourseSummary(
  api: OrchestrationDashboardCourseSummary,
): DashboardCourseSummary {
  return {
    courseId: api.course_id ?? "",
    title: api.title ?? "",
    description: api.description ?? "",
    imageUrl: api.image_url ?? "",
  };
}

function transformCredentialSummary(
  api: OrchestrationDashboardCredentialSummary,
): DashboardCredentialSummary {
  return {
    courseId: api.course_id ?? "",
    courseTitle: api.course_title ?? "",
    credentials: api.credentials ?? [],
  };
}

function transformCommitmentSummary(
  api: OrchestrationDashboardCommitmentSummary,
): DashboardCommitmentSummary {
  return {
    courseId: api.course_id ?? "",
    sltHash: api.slt_hash ?? "",
    status: api.status ?? "",
  };
}

function transformPendingReview(
  api: OrchestrationDashboardPendingReviewSummary,
): DashboardPendingReview {
  return {
    courseId: api.course_id ?? "",
    courseTitle: api.course_title ?? "",
    count: api.count ?? 0,
  };
}

function transformProjectSummary(
  api: OrchestrationDashboardProjectSummary,
): DashboardProjectSummary {
  return {
    projectId: api.project_id ?? "",
    title: api.title ?? "",
    description: api.description ?? "",
    imageUrl: api.image_url ?? "",
  };
}

function transformProjectWithPrereqs(
  api: OrchestrationDashboardProjectWithPrereqs,
): DashboardProjectWithPrereqs {
  return {
    projectId: api.project_id ?? "",
    title: api.title ?? "",
    imageUrl: api.image_url ?? "",
    qualified: api.qualified ?? false,
    prerequisites: (api.prerequisites ?? []).map((p) => ({
      courseId: p.course_id ?? "",
      sltHashes: p.slt_hashes ?? [],
    })),
  };
}

function transformUser(api: OrchestrationDashboardUser | undefined): DashboardUser {
  return {
    alias: api?.alias ?? "",
    walletAddress: api?.wallet_address ?? "",
  };
}

function transformCounts(api: OrchestrationDashboardCounts | undefined): DashboardCounts {
  return {
    enrolledCourses: api?.enrolled_courses ?? 0,
    completedCourses: api?.completed_courses ?? 0,
    totalCredentials: api?.total_credentials ?? 0,
    teachingCourses: api?.teaching_courses ?? 0,
    pendingReviews: api?.pending_reviews ?? 0,
    contributingProjects: api?.contributing_projects ?? 0,
    managingProjects: api?.managing_projects ?? 0,
  };
}

function transformStudent(api: OrchestrationStudentDashboard | undefined): DashboardStudent {
  return {
    enrolledCourses: (api?.enrolled_courses ?? []).map(transformCourseSummary),
    completedCourses: (api?.completed_courses ?? []).map(transformCourseSummary),
    totalCredentials: api?.total_credentials ?? 0,
    credentialsByCourse: (api?.credentials_by_course ?? []).map(transformCredentialSummary),
    commitments: (api?.commitments ?? []).map(transformCommitmentSummary),
  };
}

function transformTeacher(api: OrchestrationTeacherDashboard | undefined): DashboardTeacher {
  return {
    courses: (api?.courses ?? []).map(transformCourseSummary),
    pendingReviews: (api?.pending_reviews ?? []).map(transformPendingReview),
    totalPendingReviews: api?.total_pending_reviews ?? 0,
  };
}

function transformProjects(api: OrchestrationProjectsDashboard | undefined): DashboardProjects {
  return {
    contributing: (api?.contributing ?? []).map(transformProjectSummary),
    managing: (api?.managing ?? []).map(transformProjectSummary),
    withPrerequisites: (api?.with_prerequisites ?? []).map(transformProjectWithPrereqs),
  };
}

function transformDashboard(
  api: OrchestrationDashboardResponse,
  warning?: string,
): Dashboard {
  return {
    user: transformUser(api.user),
    counts: transformCounts(api.counts),
    student: transformStudent(api.student),
    teacher: transformTeacher(api.teacher),
    projects: transformProjects(api.projects),
    warning,
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch the authenticated user's consolidated dashboard data.
 *
 * Returns all dashboard data in a single request:
 * - User info (alias, wallet)
 * - Counts (enrolled, completed, credentials, teaching, pending reviews, projects)
 * - Student data (courses, credentials, commitments)
 * - Teacher data (courses, pending reviews)
 * - Projects (contributing, managing, with prerequisites)
 *
 * @returns Dashboard data with warning field if partial content (HTTP 206)
 */
export function useDashboard() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: dashboardKeys.user(),
    queryFn: async (): Promise<Dashboard> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/user/dashboard`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard: ${response.statusText}`);
      }

      const result = (await response.json()) as MergedHandlersDashboardResponseWrapper;

      if (result.warning) {
        console.warn("[useDashboard] API warning (partial content):", result.warning);
      }

      return transformDashboard(result.data ?? {}, result.warning);
    },
    enabled: isAuthenticated,
    staleTime: 30_000, // 30 seconds - dashboard data should be relatively fresh
  });
}
