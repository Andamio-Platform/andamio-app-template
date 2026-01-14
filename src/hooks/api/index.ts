/**
 * React Query API Hooks
 *
 * Centralized exports for all Andamio Database API hooks.
 * These hooks provide cached, deduplicated access to API data.
 *
 * ## Benefits over raw fetch():
 * - **Caching**: Data is cached and shared across components
 * - **Deduplication**: Multiple components requesting the same data = 1 network request
 * - **Background refetching**: Stale data is automatically refreshed
 * - **Optimistic updates**: Mutations can update cache immediately
 * - **Loading/error states**: Consistent state management
 *
 * ## Usage
 *
 * ```tsx
 * import { useCourse, useCourseModules, useUpdateCourse } from "~/hooks/api";
 *
 * function CourseEditor({ courseId }: { courseId: string }) {
 *   // Read queries - automatically cached
 *   const { data: course, isLoading } = useCourse(courseId);
 *   const { data: modules } = useCourseModules(courseId);
 *
 *   // Mutations - automatically invalidate cache
 *   const updateCourse = useUpdateCourse();
 *
 *   const handleSave = async (data: UpdateCourseInput) => {
 *     await updateCourse.mutateAsync({ courseNftPolicyId: courseId, data });
 *     // Cache is automatically invalidated - no manual refetch needed!
 *   };
 *
 *   return <CourseForm course={course} onSave={handleSave} />;
 * }
 * ```
 *
 * ## Query Keys
 *
 * Each hook exports its query keys for advanced cache management:
 *
 * ```tsx
 * import { courseKeys, courseModuleKeys } from "~/hooks/api";
 *
 * // Invalidate all course data
 * queryClient.invalidateQueries({ queryKey: courseKeys.all });
 *
 * // Invalidate specific course
 * queryClient.invalidateQueries({ queryKey: courseKeys.detail(courseId) });
 * ```
 */

// Course hooks
export {
  useCourse,
  usePublishedCourses,
  useOwnedCoursesQuery,
  useUpdateCourse,
  useDeleteCourse,
  courseKeys,
} from "./use-course";

// Course Module hooks
export {
  useCourseModules,
  useCourseModule,
  useCourseModuleMap,
  useCreateCourseModule,
  useUpdateCourseModule,
  useUpdateCourseModuleStatus,
  useDeleteCourseModule,
  courseModuleKeys,
} from "./use-course-module";

// SLT hooks
export {
  useSLTs,
  useCreateSLT,
  useUpdateSLT,
  useDeleteSLT,
  sltKeys,
} from "./use-slt";

// Lesson hooks
export {
  useLessons,
  useLesson,
  useCreateLesson,
  lessonKeys,
} from "./use-lesson";

// Andamioscan (on-chain) hooks
export {
  useAndamioscanCourse,
  useAndamioscanAllCourses,
  useInvalidateAndamioscan,
  andamioscanKeys,
} from "./use-andamioscan";
