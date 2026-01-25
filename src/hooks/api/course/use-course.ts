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

import { useQuery } from "@tanstack/react-query";
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
 * Lifecycle status for a course
 * - "draft": In DB only, not yet published on-chain
 * - "active": On-chain and registered in DB (fully operational)
 * - "unregistered": On-chain but missing DB registration (needs /register endpoint)
 */
export type CourseStatus = "draft" | "active" | "unregistered";

/**
 * API source field values (internal use in transformers)
 * Maps to CourseStatus for developer-friendly semantics
 */
type ApiSource = "merged" | "chain_only" | "db_only";

/**
 * Derive semantic status from API source field
 * Used whenever an API endpoint returns a `source` field
 */
function getStatusFromSource(source: string | undefined): CourseStatus {
  switch (source) {
    case "merged":
      return "active";
    case "chain_only":
      return "unregistered";
    case "db_only":
    default:
      return "draft";
  }
}

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

  // Lifecycle status (derived from API source field)
  status: CourseStatus;

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

    // Lifecycle status (derived from API source field)
    status: getStatusFromSource(item.source),

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

    // Lifecycle status (derived from API source field)
    status: getStatusFromSource(detail.source),

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
// Query Keys
// =============================================================================

/**
 * Centralized query keys for cache management
 */
export const courseKeys = {
  all: ["courses"] as const,
  lists: () => [...courseKeys.all, "list"] as const,
  list: (filters: string) => [...courseKeys.lists(), { filters }] as const,
  active: () => [...courseKeys.all, "active"] as const,
  details: () => [...courseKeys.all, "detail"] as const,
  detail: (courseId: string) =>
    [...courseKeys.details(), courseId] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch a single course by ID
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
      // Endpoint: GET /api/v2/course/user/course/get/{course_id}
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
 * Fetch all active courses
 *
 * Returns combined on-chain and off-chain data for all active courses.
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
 *   const { data: courses, isLoading } = useActiveCourses();
 *
 *   return (
 *     <div className="grid grid-cols-3 gap-4">
 *       {courses?.map(course => (
 *         <CourseCard
 *           key={course.courseId}
 *           title={course.title}
 *           description={course.description}
 *           status={course.status}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useActiveCourses() {
  return useQuery({
    queryKey: courseKeys.active(),
    queryFn: async (): Promise<Course[]> => {
      const response = await fetch(
        `/api/gateway/api/v2/course/user/courses/list`
      );

      // 404 means no published courses exist yet - treat as empty state, not error
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch active courses: ${response.statusText}`);
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
          console.warn("[useActiveCourses] API warning:", result.warning);
        }
        items = result.data ?? [];
      }

      // Transform to app-level types with camelCase fields
      return items.map(transformCourse);
    },
    staleTime: 30 * 1000,
  });
}
