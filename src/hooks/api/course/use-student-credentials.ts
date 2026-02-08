/**
 * React Query hook for the student credentials endpoint.
 *
 * Returns the authenticated student's full credential record in a single call:
 * enrolled courses, completed courses, claimed credential hashes, and module metadata.
 *
 * Endpoint: POST /api/v2/course/student/credentials/list
 *
 * @example
 * ```tsx
 * function MyCredentials() {
 *   const { data: credentials, isLoading } = useStudentCredentials();
 *
 *   return credentials?.map(cred => (
 *     <CredentialCard
 *       key={cred.courseId}
 *       title={cred.courseTitle}
 *       status={cred.enrollmentStatus}
 *       completedCount={cred.claimedCredentials.length}
 *     />
 *   ));
 * }
 * ```
 */

import { useQuery } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { GATEWAY_API_BASE } from "~/lib/api-utils";
import type {
  MergedHandlersStudentCredentialsResponse,
  OrchestrationStudentCourseCredential,
  OrchestrationCredentialModuleInfo,
} from "~/types/generated/gateway";
import { courseStudentKeys } from "./use-course-student";

// =============================================================================
// App-Level Types
// =============================================================================

/**
 * Module info within a credential record
 */
export interface CredentialModuleInfo {
  sltHash: string;
  courseModuleCode: string;
  title: string;
}

/**
 * A student's credential record for a single course.
 *
 * - Enrolled courses have empty `claimedCredentials` but populated `modules`
 * - Completed courses have both populated
 * - `claimedCredentials` is a flat string[] of slt_hashes for set-intersection
 */
export interface StudentCourseCredential {
  courseId: string;
  courseTitle: string;
  isEnrolled: boolean;
  enrollmentStatus: "enrolled" | "completed";
  claimedCredentials: string[];
  modules: CredentialModuleInfo[];
  source: string;
}

// =============================================================================
// Query Keys
// =============================================================================

export const studentCredentialKeys = {
  all: [...courseStudentKeys.all, "credentials"] as const,
  list: () => [...studentCredentialKeys.all, "list"] as const,
};

// =============================================================================
// Transform
// =============================================================================

function transformModuleInfo(api: OrchestrationCredentialModuleInfo): CredentialModuleInfo {
  return {
    sltHash: api.slt_hash ?? "",
    courseModuleCode: api.course_module_code ?? "",
    title: api.title ?? "",
  };
}

function transformStudentCredential(
  api: OrchestrationStudentCourseCredential,
): StudentCourseCredential {
  return {
    courseId: api.course_id ?? "",
    courseTitle: api.course_title ?? "",
    isEnrolled: api.is_enrolled ?? false,
    enrollmentStatus:
      api.enrollment_status === "completed" ? "completed" : "enrolled",
    claimedCredentials: api.claimed_credentials ?? [],
    modules: (api.modules ?? []).map(transformModuleInfo),
    source: api.source ?? "merged",
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Fetch the authenticated student's full credential record.
 *
 * Returns all enrolled and completed courses with claimed credential hashes
 * and module metadata in a single call.
 *
 * @returns StudentCourseCredential[] — safe for .map()/.filter() (never null)
 */
export function useStudentCredentials() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: studentCredentialKeys.list(),
    queryFn: async (): Promise<StudentCourseCredential[]> => {
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/student/credentials/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(
          `Failed to fetch student credentials: ${response.statusText}`,
        );
      }

      const result =
        (await response.json()) as MergedHandlersStudentCredentialsResponse;

      if (result.warning) {
        console.warn("[useStudentCredentials] API warning:", result.warning);
      }

      return (result.data ?? []).map(transformStudentCredential);
    },
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}
