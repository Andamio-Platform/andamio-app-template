/**
 * React Query hooks for Course API endpoints
 *
 * Provides cached, deduplicated access to course data across the app.
 * Uses React Query for automatic caching, background refetching, and request deduplication.
 *
 * @example
 * ```tsx
 * // Get a course by NFT policy ID - cached across all components
 * const { data: course, isLoading } = useCourse(courseNftPolicyId);
 *
 * // When user navigates from /course/[id] to /course/[id]/[module],
 * // the course data is already cached - no duplicate request!
 * ```
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import {
  type CourseResponse,
  type CourseListResponse,
} from "@andamio/db-api-types";

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Centralized query keys for cache management
 */
export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters: string) => [...courseKeys.lists(), { filters }] as const,
  published: () => [...courseKeys.all, "published"] as const,
  owned: () => [...courseKeys.all, "owned"] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (courseNftPolicyId: string) =>
    [...courseKeys.details(), courseNftPolicyId] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch a single course by NFT policy ID
 *
 * Data is cached and shared across all components using the same courseNftPolicyId.
 * Stale time: 30 seconds (matches QueryClient default)
 *
 * @example
 * ```tsx
 * function CourseHeader({ courseId }: { courseId: string }) {
 *   const { data: course, isLoading, error } = useCourse(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!course) return <NotFound />;
 *
 *   return <h1>{course.title}</h1>;
 * }
 * ```
 */
export function useCourse(courseNftPolicyId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(courseNftPolicyId ?? ""),
    queryFn: async () => {
      // Go API: GET /course/user/course/get/{policy_id}
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/user/course/get/${courseNftPolicyId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.statusText}`);
      }

      return response.json() as Promise<CourseResponse>;
    },
    enabled: !!courseNftPolicyId,
  });
}

/**
 * Fetch all published courses
 *
 * Used for the public course catalog. Cached globally.
 *
 * @example
 * ```tsx
 * function CourseCatalog() {
 *   const { data: courses, isLoading } = usePublishedCourses();
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {courses?.map(course => <CourseCard key={course.id} course={course} />)}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePublishedCourses() {
  return useQuery({
    queryKey: courseKeys.published(),
    queryFn: async () => {
      // Go API endpoint: /course/user/courses/list
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/user/courses/list`
      );

      // 404 means no published courses exist yet - treat as empty state, not error
      if (response.status === 404) {
        return [] as CourseListResponse;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch published courses: ${response.statusText}`);
      }

      return response.json() as Promise<CourseListResponse>;
    },
  });
}

/**
 * Fetch courses owned by the authenticated user
 *
 * Requires authentication. Automatically skips query if user is not authenticated.
 *
 * @example
 * ```tsx
 * function MyCoursesPage() {
 *   const { data: courses, isLoading, error } = useOwnedCoursesQuery();
 *
 *   if (isLoading) return <PageLoading />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!courses?.length) return <EmptyState title="No courses yet" />;
 *
 *   return <CourseList courses={courses} />;
 * }
 * ```
 */
export function useOwnedCoursesQuery() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseKeys.owned(),
    queryFn: async () => {
      // Go API: POST /course/owner/courses/list - returns courses owned by authenticated user
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/owner/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch owned courses: ${response.statusText}`);
      }

      return response.json() as Promise<CourseListResponse>;
    },
    enabled: isAuthenticated,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Update course metadata
 *
 * Automatically invalidates the course cache on success.
 *
 * @example
 * ```tsx
 * function EditCourseForm({ course }: { course: CourseResponse }) {
 *   const updateCourse = useUpdateCourse();
 *
 *   const handleSubmit = async (data: UpdateCourseInput) => {
 *     await updateCourse.mutateAsync({
 *       courseNftPolicyId: course.course_nft_policy_id,
 *       data,
 *     });
 *     toast.success("Course updated!");
 *   };
 *
 *   return <CourseForm onSubmit={handleSubmit} isLoading={updateCourse.isPending} />;
 * }
 * ```
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      data,
    }: {
      courseNftPolicyId: string;
      data: Partial<{
        title?: string;
        description?: string;
        image_url?: string;
        video_url?: string;
        live?: boolean;
      }>;
    }) => {
      // Go API: POST /course/owner/course/update
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/owner/course/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            ...data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update course: ${response.statusText}`);
      }

      return response.json() as Promise<CourseResponse>;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific course
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.courseNftPolicyId),
      });
      // Also invalidate lists that might contain this course
      void queryClient.invalidateQueries({
        queryKey: courseKeys.lists(),
      });
    },
  });
}

/**
 * Delete a course
 *
 * Automatically invalidates all course caches on success.
 *
 * @example
 * ```tsx
 * function DeleteCourseButton({ courseId }: { courseId: string }) {
 *   const deleteCourse = useDeleteCourse();
 *   const router = useRouter();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Are you sure?")) {
 *       await deleteCourse.mutateAsync(courseId);
 *       router.push("/studio/course");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteCourse() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (courseNftPolicyId: string) => {
      // Go API: POST /course/owner/course/delete
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/owner/course/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete course: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, courseNftPolicyId) => {
      // Remove the specific course from cache
      queryClient.removeQueries({
        queryKey: courseKeys.detail(courseNftPolicyId),
      });
      // Invalidate all lists
      void queryClient.invalidateQueries({
        queryKey: courseKeys.all,
      });
    },
  });
}
