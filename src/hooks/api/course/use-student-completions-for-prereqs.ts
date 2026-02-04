/**
 * Hook to bridge student credential data into the format
 * that `checkProjectEligibility()` expects.
 *
 * Uses the single `POST /api/v2/course/student/credentials/list` endpoint
 * instead of N+1 parallel queries — one network call for all prerequisite data.
 *
 * @example
 * ```tsx
 * const { completions, isLoading } = useStudentCompletionsForPrereqs(prereqCourseIds);
 * const result = checkProjectEligibility(prerequisites, completions);
 * ```
 */

import { useStudentCredentials } from "./use-student-credentials";
import type { StudentCompletionInput } from "~/lib/project-eligibility";

/**
 * Fetch student course completions for a set of prerequisite course IDs.
 *
 * Returns `StudentCompletionInput[]` ready for `checkProjectEligibility()`.
 * Uses the credentials endpoint which returns everything in one call.
 *
 * @param prerequisiteCourseIds - Unique course IDs from project prerequisites
 */
export function useStudentCompletionsForPrereqs(
  prerequisiteCourseIds: string[],
) {
  const {
    data: credentials,
    isLoading,
    isError,
  } = useStudentCredentials();

  // Build a lookup from credentials data
  const credentialMap = new Map(
    (credentials ?? []).map((c) => [c.courseId, c]),
  );

  // Map each prerequisite course to a StudentCompletionInput
  const completions: StudentCompletionInput[] = prerequisiteCourseIds.map(
    (courseId) => {
      const cred = credentialMap.get(courseId);

      if (!cred) {
        return {
          courseId,
          completedModuleHashes: [],
          isEnrolled: false,
        };
      }

      return {
        courseId,
        completedModuleHashes: cred.claimedCredentials,
        isEnrolled: cred.isEnrolled,
      };
    },
  );

  return {
    completions,
    isLoading,
    isAuthenticated: !isError,
  };
}
