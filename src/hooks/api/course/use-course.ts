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
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type {
  CourseResponse,
  OrchestrationMergedCourseDetail,
  MergedHandlersMergedCourseDetailResponse,
  OrchestrationMergedCourseListItem,
  MergedHandlersMergedCoursesResponse,
} from "~/types/generated";
import type { MergedCourseModule } from "./use-course-module";

// =============================================================================
// Flattened Course Types
// =============================================================================

/**
 * Data source for a merged course
 * - "merged": Course exists in both on-chain and DB (full data)
 * - "chain_only": Course on-chain but no DB content (needs registration)
 * - "db_only": Course in DB but not on-chain (draft)
 */
export type CourseSource = "merged" | "chain_only" | "db_only";

/**
 * Flattened course list item for UI components
 * Combines on-chain fields with off-chain content for backward compatibility.
 */
export interface FlattenedCourseListItem {
  // On-chain fields
  course_id?: string;
  course_address?: string;
  owner?: string;
  teachers?: string[];
  student_state_id?: string;
  created_tx?: string;
  created_slot?: number;

  // Data source
  source?: CourseSource;

  // Flattened content fields (from content.*)
  title?: string;
  description?: string;
  image_url?: string;
  is_public?: boolean;
}

/**
 * Flattened course detail for UI components
 * Extends list item with modules and additional detail fields.
 */
export interface FlattenedCourseDetail extends FlattenedCourseListItem {
  // Modules (flattened from nested format)
  modules?: MergedCourseModule[];
}

/**
 * Transform API response to flattened course list item format
 * Exported for reuse in other hooks (e.g., useOwnedCourses)
 */
export function flattenCourseListItem(item: OrchestrationMergedCourseListItem): FlattenedCourseListItem {
  return {
    // On-chain fields
    course_id: item.course_id,
    course_address: item.course_address,
    owner: item.owner,
    teachers: item.teachers,
    student_state_id: item.student_state_id,
    created_tx: item.created_tx,
    created_slot: item.created_slot,
    source: item.source as CourseSource,

    // Flattened content fields
    title: item.content?.title,
    description: item.content?.description,
    image_url: item.content?.image_url,
    is_public: item.content?.is_public,
  };
}

/**
 * Transform API response to flattened course detail format
 */
function flattenCourseDetail(detail: OrchestrationMergedCourseDetail): FlattenedCourseDetail {
  return {
    // On-chain fields (note: owner, created_tx, created_slot not available in detail endpoint)
    course_id: detail.course_id,
    course_address: detail.course_address,
    teachers: detail.teachers,
    student_state_id: detail.student_state_id,
    source: detail.source as CourseSource,

    // Flattened content fields
    title: detail.content?.title,
    description: detail.content?.description,
    image_url: detail.content?.image_url,
    is_public: detail.content?.is_public,

    // Modules - map to flattened format
    modules: detail.modules?.map((m) => ({
      slt_hash: m.slt_hash,
      course_id: detail.course_id,
      created_by: m.created_by,
      prerequisites: m.prerequisites,
      on_chain_slts: m.slts,
      source: "merged" as const, // Detail modules are always merged
      // Note: module content is not included in course detail response
    })),
  };
}

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
 * Fetch a single course by ID (merged endpoint)
 *
 * Returns both on-chain data (modules, teachers, students) and off-chain content.
 * Data is cached and shared across all components using the same courseId.
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
 *   return <h1>{course.content?.title}</h1>;
 * }
 * ```
 */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(courseId ?? ""),
    queryFn: async (): Promise<FlattenedCourseDetail | null> => {
      // Merged endpoint: GET /api/v2/course/user/course/get/{course_id}
      // Returns both on-chain and off-chain data
      const response = await fetch(
        `/api/gateway/api/v2/course/user/course/get/${courseId}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch course: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersMergedCourseDetailResponse;

      if (result.warning) {
        console.warn("[useCourse] API warning:", result.warning);
      }

      if (!result.data) return null;

      // Transform to flattened format for backward compatibility
      return flattenCourseDetail(result.data);
    },
    enabled: !!courseId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch all published courses (merged endpoint)
 *
 * Returns combined on-chain and off-chain data for all published courses.
 * Used for the public course catalog. Cached globally.
 *
 * Uses: GET /api/v2/course/user/courses/list
 *
 * Response format:
 * - data: Array of courses with nested content
 * - warning: Optional message for partial data scenarios
 *
 * @example
 * ```tsx
 * function CourseCatalog() {
 *   const { data: courses, isLoading } = usePublishedCourses();
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {courses?.map(course => (
 *         <CourseCard
 *           key={course.course_id}
 *           title={course.content?.title}
 *           description={course.content?.description}
 *           source={course.source}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePublishedCourses() {
  return useQuery({
    queryKey: courseKeys.published(),
    queryFn: async (): Promise<FlattenedCourseListItem[]> => {
      const response = await fetch(
        `/api/gateway/api/v2/course/user/courses/list`
      );

      // 404 means no published courses exist yet - treat as empty state, not error
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch published courses: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersMergedCoursesResponse | OrchestrationMergedCourseListItem[];

      // Handle both wrapped { data: [...] } and raw array formats
      let items: OrchestrationMergedCourseListItem[];
      if (Array.isArray(result)) {
        // Legacy/raw array format
        items = result;
      } else {
        // Wrapped format with data property
        if (result.warning) {
          console.warn("[usePublishedCourses] API warning:", result.warning);
        }
        items = result.data ?? [];
      }

      // Transform to flattened format for backward compatibility
      return items.map(flattenCourseListItem);
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
    queryFn: async (): Promise<FlattenedCourseListItem[]> => {
      // Go API: POST /course/owner/courses/list - returns courses owned by authenticated user
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/owner/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch owned courses: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | OrchestrationMergedCourseListItem[]
        | MergedHandlersMergedCoursesResponse;

      // Handle both wrapped { data: [...] } and raw array formats
      const items = Array.isArray(result) ? result : (result.data ?? []);

      // Transform to flattened format for backward compatibility
      return items.map(flattenCourseListItem);
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
      // API expects: { course_id, data: { title?, description?, ... } }
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/owner/course/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            data,
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
        `/api/gateway/api/v2/course/owner/course/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseNftPolicyId }),
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
