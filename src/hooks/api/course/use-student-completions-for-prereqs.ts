/**
 * Hook to bridge student course completion data into the format
 * that `checkProjectEligibility()` expects.
 *
 * Uses `useQueries()` to fetch commitments for each prerequisite course
 * in parallel, sharing cache keys with `useStudentAssignmentCommitments`.
 *
 * @example
 * ```tsx
 * const { completions, isLoading } = useStudentCompletionsForPrereqs(prereqCourseIds);
 * const result = checkProjectEligibility(prerequisites, completions);
 * ```
 */

import { useQueries } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useStudentCourses } from "./use-course-student";
import {
  fetchStudentCommitments,
  studentCommitmentsQueryKey,
} from "./use-student-assignment-commitments";
import type { StudentCompletionInput } from "~/lib/project-eligibility";

/**
 * Fetch student course completions for a set of prerequisite course IDs.
 *
 * Returns `StudentCompletionInput[]` ready for `checkProjectEligibility()`.
 *
 * @param prerequisiteCourseIds - Unique course IDs from project prerequisites
 */
export function useStudentCompletionsForPrereqs(
  prerequisiteCourseIds: string[],
) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // Fetch enrolled courses for enrollment status
  const { data: studentCourses } = useStudentCourses();

  // Build enrollment lookup
  const enrollmentMap = new Map(
    (studentCourses ?? []).map((c) => [c.courseId, true]),
  );

  // Parallel queries for commitments per course
  const commitmentQueries = useQueries({
    queries: prerequisiteCourseIds.map((courseId) => ({
      queryKey: studentCommitmentsQueryKey(courseId),
      queryFn: () => fetchStudentCommitments(courseId, authenticatedFetch),
      enabled: isAuthenticated && !!courseId,
      staleTime: 30_000,
    })),
  });

  const isLoading = commitmentQueries.some((q) => q.isLoading);

  // Transform into StudentCompletionInput[]
  const completions: StudentCompletionInput[] = prerequisiteCourseIds.map(
    (courseId, index) => {
      const query = commitmentQueries[index];
      const commitments = query?.data ?? [];

      // Only count ASSIGNMENT_ACCEPTED commitments as completed
      const completedModuleHashes = commitments
        .filter((c) => c.networkStatus === "ASSIGNMENT_ACCEPTED")
        .map((c) => c.sltHash)
        .filter((hash): hash is string => hash !== null);

      return {
        courseId,
        completedModuleHashes,
        isEnrolled: enrollmentMap.has(courseId),
      };
    },
  );

  return {
    completions,
    isLoading,
    isAuthenticated,
  };
}
