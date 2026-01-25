/**
 * React Query hooks for Student Course API endpoints
 *
 * Provides cached access to courses the authenticated user is enrolled in or has completed.
 * Uses the merged endpoint that returns both on-chain and DB data.
 *
 * @example
 * ```tsx
 * function MyLearning() {
 *   const { data, isLoading } = useStudentCourses();
 *
 *   return data?.map(course => (
 *     <CourseCard key={course.course_id} course={course} />
 *   ));
 * }
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  type OrchestrationStudentCourseListItem,
  type MergedHandlersStudentCoursesResponse,
} from "~/types/generated";

// =============================================================================
// Query Keys
// =============================================================================

export const courseStudentKeys = {
  all: ["student-courses"] as const,
  list: () => [...courseStudentKeys.all, "list"] as const,
  commitments: () => [...courseStudentKeys.all, "commitments"] as const,
  courseStatus: (courseId: string) => [...courseStudentKeys.all, "status", courseId] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Student course item from merged API endpoint
 * Uses the generated type from the gateway OpenAPI spec.
 */
export type StudentCourse = OrchestrationStudentCourseListItem;

export type StudentCoursesResponse = StudentCourse[];

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch courses the authenticated user is enrolled in or has completed
 *
 * Uses merged endpoint: POST /api/v2/course/student/courses/list
 * Returns courses with both on-chain enrollment status and DB content.
 *
 * @example
 * ```tsx
 * function EnrolledCourses() {
 *   const { data: courses, isLoading, error, refetch } = useStudentCourses();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!courses?.length) return <EmptyState />;
 *
 *   return <CourseList courses={courses} />;
 * }
 * ```
 */
export function useStudentCourses() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseStudentKeys.list(),
    queryFn: async (): Promise<StudentCoursesResponse> => {
      // Merged endpoint: POST /api/v2/course/student/courses/list
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/student/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no enrolled courses - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch student courses: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersStudentCoursesResponse;

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useStudentCourses] API warning:", result.warning);
      }

      return result.data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to invalidate student courses cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateStudentCourses();
 *
 * // After enrolling in a new course
 * await invalidate();
 * ```
 */
export function useInvalidateStudentCourses() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: courseStudentKeys.all,
    });
  };
}
