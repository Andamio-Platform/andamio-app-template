/**
 * React Query hooks for Teacher Course API endpoints
 *
 * Provides cached access to courses the authenticated user teaches.
 * Uses the merged endpoint that returns both on-chain and DB data.
 *
 * @example
 * ```tsx
 * function TeacherStudio() {
 *   const { data, isLoading } = useTeacherCourses();
 *
 *   return data?.map(course => (
 *     <CourseCard key={course.course_id} course={course} />
 *   ));
 * }
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";

// =============================================================================
// Query Keys
// =============================================================================

export const teacherCourseKeys = {
  all: ["teacher-courses"] as const,
  list: () => [...teacherCourseKeys.all, "list"] as const,
  commitments: () => [...teacherCourseKeys.all, "commitments"] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Teacher course item from merged API endpoint
 * Contains both on-chain and off-chain data
 */
export interface TeacherCourse {
  // On-chain fields
  course_id: string;
  course_address?: string;
  owner?: string;
  teachers?: string[];
  student_state_id?: string;
  created_tx?: string;
  created_slot?: number;

  // Off-chain content (nested under "content" from API)
  content?: {
    title?: string;
    code?: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    live?: boolean;
  };

  // Flattened accessors for backwards compatibility
  // These are populated by the hook from content.*
  title?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  course_code?: string;

  // Metadata
  source?: string; // "merged" | "chain_only" | "db_only"
}

export type TeacherCoursesResponse = TeacherCourse[];

/**
 * Teacher assignment commitment from merged API endpoint
 * Contains pending assessment data with both on-chain and DB info
 */
export interface TeacherAssignmentCommitment {
  // On-chain fields
  course_id: string;
  assignment_id: string;
  student_alias: string;
  submission_tx_hash?: string;
  submission_slot?: number;
  content?: string;

  // Off-chain content
  module_code?: string;
  module_title?: string;
  evidence_url?: string;
  evidence_text?: string;
  submitted_at?: string;

  // Metadata
  source?: string;
}

export type TeacherAssignmentCommitmentsResponse = TeacherAssignmentCommitment[];

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch courses the authenticated user teaches
 *
 * Uses merged endpoint: POST /api/v2/course/teacher/courses/list
 * Returns courses with both on-chain state and DB content.
 *
 * @example
 * ```tsx
 * function CourseStudio() {
 *   const { data: courses, isLoading, error, refetch } = useTeacherCourses();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!courses?.length) return <EmptyState />;
 *
 *   return <CourseList courses={courses} />;
 * }
 * ```
 */
export function useTeacherCourses() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: teacherCourseKeys.list(),
    queryFn: async (): Promise<TeacherCoursesResponse> => {
      // Merged endpoint: POST /api/v2/course/teacher/courses/list
      console.log("[useTeacherCourses] Making request...");

      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      console.log("[useTeacherCourses] Response status:", response.status);

      // 404 means no courses - return empty array
      if (response.status === 404) {
        console.log("[useTeacherCourses] Got 404 - returning empty array");
        return [];
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useTeacherCourses] Error response:", errorText);
        throw new Error(`Failed to fetch teacher courses: ${response.statusText}`);
      }

      const result = await response.json() as { data?: TeacherCourse[]; warning?: string };

      // Debug: log the full response
      console.log("[useTeacherCourses] API response:", JSON.stringify(result, null, 2));

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useTeacherCourses] API warning:", result.warning);
      }

      // Flatten content fields for backwards compatibility with UI
      const courses = (result.data ?? []).map((course) => ({
        ...course,
        // Flatten content.* to top level for UI components
        title: course.content?.title ?? course.title,
        description: course.content?.description ?? course.description,
        image_url: course.content?.image_url ?? course.image_url,
        video_url: course.content?.video_url ?? course.video_url,
        course_code: course.content?.code ?? course.course_code,
      }));

      return courses;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch assignment commitments pending teacher review
 *
 * Uses merged endpoint: POST /api/v2/course/teacher/assignment-commitments/list
 * Returns pending assessments with both on-chain and DB data.
 *
 * @example
 * ```tsx
 * function PendingReviews() {
 *   const { data: commitments, isLoading, error, refetch } = useTeacherCommitments();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!commitments?.length) return <AllCaughtUp />;
 *
 *   return <CommitmentList commitments={commitments} />;
 * }
 * ```
 */
export function useTeacherCommitments() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: teacherCourseKeys.commitments(),
    queryFn: async (): Promise<TeacherAssignmentCommitmentsResponse> => {
      // Merged endpoint: POST /api/v2/course/teacher/assignment-commitments/list
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/assignment-commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no pending assessments - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher commitments: ${response.statusText}`);
      }

      const result = await response.json() as { data?: TeacherAssignmentCommitment[]; warning?: string };

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useTeacherCommitments] API warning:", result.warning);
      }

      return result.data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Teacher course with module details for prerequisite selection
 */
export interface TeacherCourseWithModules {
  course_id: string;
  title?: string;
  modules: Array<{
    assignment_id: string;
    slts: string[];
  }>;
}

/**
 * Fetch teacher courses with module details
 *
 * This hook combines teacher courses list with individual course details
 * to provide module information needed for prerequisite selection.
 *
 * Note: This makes multiple API calls. Use sparingly (e.g., project creation wizard).
 *
 * @example
 * ```tsx
 * function PrereqSelector() {
 *   const { data: courses, isLoading } = useTeacherCoursesWithModules();
 *
 *   return courses?.map(course => (
 *     <CourseModuleSelector key={course.course_id} course={course} />
 *   ));
 * }
 * ```
 */
export function useTeacherCoursesWithModules() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: [...teacherCourseKeys.all, "with-modules"],
    queryFn: async (): Promise<TeacherCourseWithModules[]> => {
      // Step 1: Fetch teacher courses list
      const coursesResponse = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (coursesResponse.status === 404) {
        return [];
      }

      if (!coursesResponse.ok) {
        throw new Error(`Failed to fetch teacher courses: ${coursesResponse.statusText}`);
      }

      const coursesResult = (await coursesResponse.json()) as {
        data?: TeacherCourse[];
      };
      const courses = coursesResult.data ?? [];

      if (courses.length === 0) {
        return [];
      }

      // Step 2: Fetch full details for each course to get modules
      const coursesWithModules: TeacherCourseWithModules[] = [];

      for (const course of courses) {
        try {
          const detailResponse = await fetch(
            `/api/gateway/api/v2/course/user/course/${course.course_id}`
          );

          if (detailResponse.ok) {
            const detailResult = (await detailResponse.json()) as {
              data?: {
                course_id?: string;
                content?: { title?: string };
                modules?: Array<{ assignment_id?: string; slts?: string[] }>;
              };
            };

            const detail = detailResult.data;
            if (detail?.modules && detail.modules.length > 0) {
              coursesWithModules.push({
                course_id: course.course_id,
                title: detail.content?.title ?? course.title,
                modules: detail.modules
                  .filter((m) => m.assignment_id)
                  .map((m) => ({
                    assignment_id: m.assignment_id!,
                    slts: m.slts ?? [],
                  })),
              });
            }
          }
        } catch {
          // Skip courses that fail to load details
          console.warn(`Failed to load details for course ${course.course_id}`);
        }
      }

      return coursesWithModules;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute (longer since this is expensive)
  });
}

/**
 * Hook to invalidate teacher courses cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateTeacherCourses();
 *
 * // After creating a new course
 * await invalidate();
 * ```
 */
export function useInvalidateTeacherCourses() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: teacherCourseKeys.all,
    });
  };
}
