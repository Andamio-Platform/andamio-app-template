/**
 * React Query hooks for Course API endpoints
 *
 * Provides cached, deduplicated access to course data across the app.
 * Uses React Query for automatic caching, background refetching, and request deduplication.
 *
 * Architecture: Colocated Types Pattern
 * - App-level types (Course, CourseDetail) defined here with camelCase fields
 * - Transform functions convert API snake_case to app camelCase
 * - Components import types from this hook, never from generated types
 *
 * @example
 * ```tsx
 * import { useCourse, type Course } from "~/hooks/api/course/use-course";
 *
 * function CourseHeader({ courseId }: { courseId: string }) {
 *   const { data: course, isLoading } = useCourse(courseId);
 *   if (!course) return null;
 *   return <h1>{course.title}</h1>; // camelCase, flattened
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
// Import directly from gateway.ts to avoid circular dependency with ~/types/generated
import type {
  OrchestrationMergedCourseDetail,
  MergedHandlersMergedCourseDetailResponse,
  OrchestrationMergedCourseListItem,
  MergedHandlersMergedCoursesResponse,
} from "~/types/generated/gateway";
import type { CourseModule } from "./use-course-module";

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Data source for a merged course
 * - "merged": Course exists in both on-chain and DB (full data)
 * - "chain_only": Course on-chain but no DB content (needs registration)
 * - "db_only": Course in DB but not on-chain (draft)
 */
export type CourseSource = "merged" | "chain_only" | "db_only";

/**
 * App-level Course type with camelCase fields
 * Used for course lists and basic course info
 */
export interface Course {
  // On-chain fields
  courseId: string;
  courseAddress?: string;
  owner?: string;
  teachers?: string[];
  studentStateId?: string;
  createdTx?: string;
  createdSlot?: number;

  // Data source
  source: CourseSource;

  // Content fields (flattened from content.*)
  title: string;
  description?: string;
  imageUrl?: string;
  isPublic?: boolean;
}

/**
 * App-level CourseDetail type with modules
 * Extends Course with additional detail fields
 */
export interface CourseDetail extends Course {
  // Modules (will be CourseModule[] when use-course-module is updated)
  modules?: CourseModule[];
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform API response to app-level Course type
 * Handles snake_case → camelCase conversion and field flattening
 */
export function transformCourse(item: OrchestrationMergedCourseListItem): Course {
  return {
    // On-chain fields
    courseId: item.course_id ?? "",
    courseAddress: item.course_address,
    owner: item.owner,
    teachers: item.teachers,
    studentStateId: item.student_state_id,
    createdTx: item.created_tx,
    createdSlot: item.created_slot,
    source: (item.source as CourseSource) ?? "db_only",

    // Flattened content fields
    title: item.content?.title ?? "",
    description: item.content?.description,
    imageUrl: item.content?.image_url,
    isPublic: item.content?.is_public,
  };
}

/**
 * Transform API response to app-level CourseDetail type
 * Includes modules mapping
 */
export function transformCourseDetail(detail: OrchestrationMergedCourseDetail): CourseDetail {
  return {
    // On-chain fields (note: owner, created_tx, created_slot not available in detail endpoint)
    courseId: detail.course_id ?? "",
    courseAddress: detail.course_address,
    teachers: detail.teachers,
    studentStateId: detail.student_state_id,
    source: (detail.source as CourseSource) ?? "db_only",

    // Flattened content fields
    title: detail.content?.title ?? "",
    description: detail.content?.description,
    imageUrl: detail.content?.image_url,
    isPublic: detail.content?.is_public,

    // Modules - map to CourseModule format
    // Note: This uses the old format temporarily until use-course-module is updated
    modules: detail.modules?.map((m) => ({
      sltHash: m.slt_hash ?? "",
      courseId: detail.course_id ?? "",
      createdBy: m.created_by,
      prerequisites: m.prerequisites,
      onChainSlts: m.slts,
      source: "merged" as const,
      // Note: module content is not included in course detail response
    })),
  };
}

// =============================================================================
// Backward Compatibility Exports (DEPRECATED)
// =============================================================================

/**
 * @deprecated Use Course instead. Will be removed after component migration.
 */
export type FlattenedCourseListItem = Course;

/**
 * @deprecated Use CourseDetail instead. Will be removed after component migration.
 */
export type FlattenedCourseDetail = CourseDetail;

/**
 * @deprecated Use transformCourse instead. Will be removed after component migration.
 */
export const flattenCourseListItem = transformCourse;

/**
 * @deprecated Use transformCourseDetail instead. Will be removed after component migration.
 */
export const flattenCourseDetail = transformCourseDetail;

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
 *   return <h1>{course.title}</h1>;
 * }
 * ```
 */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(courseId ?? ""),
    queryFn: async (): Promise<CourseDetail | null> => {
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

      // Transform to app-level type with camelCase fields
      return transformCourseDetail(result.data);
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
 *           key={course.courseId}
 *           title={course.title}
 *           description={course.description}
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
    queryFn: async (): Promise<Course[]> => {
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

      // Transform to app-level types with camelCase fields
      return items.map(transformCourse);
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
    queryFn: async (): Promise<Course[]> => {
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

      // Transform to app-level types with camelCase fields
      return items.map(transformCourse);
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
 * function EditCourseForm({ course }: { course: Course }) {
 *   const updateCourse = useUpdateCourse();
 *
 *   const handleSubmit = async (data: UpdateCourseInput) => {
 *     await updateCourse.mutateAsync({
 *       courseNftPolicyId: course.courseId,
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

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
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
