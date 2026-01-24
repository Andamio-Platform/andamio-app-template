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

// Course hooks (courses, modules, SLTs, lessons)
export {
  useCourse,
  usePublishedCourses,
  useOwnedCoursesQuery,
  useUpdateCourse,
  useDeleteCourse,
  courseKeys,
  type CourseSource,
  type FlattenedCourseListItem,
  type FlattenedCourseDetail,
} from "./course/use-course";

export {
  useCourseModules,
  useTeacherCourseModules,
  useCourseModule,
  useCourseModuleMap,
  useCreateCourseModule,
  useUpdateCourseModule,
  useUpdateCourseModuleStatus,
  useDeleteCourseModule,
  courseModuleKeys,
  type MergedCourseModule,
  type ModuleSource,
} from "./course/use-course-module";

export {
  useSLTs,
  useCreateSLT,
  useUpdateSLT,
  useDeleteSLT,
  sltKeys,
} from "./course/use-slt";

export {
  useLessons,
  useLesson,
  useCreateLesson,
  lessonKeys,
} from "./course/use-lesson";

export {
  useTeacherCourses,
  useTeacherCommitments,
  useTeacherCoursesWithModules,
  useInvalidateTeacherCourses,
  teacherCourseKeys,
  type TeacherCourse,
  type TeacherCoursesResponse,
  type TeacherAssignmentCommitment,
  type TeacherAssignmentCommitmentsResponse,
  type TeacherCourseWithModules,
} from "./course/use-teacher-courses";

export {
  useStudentCourses,
  useInvalidateStudentCourses,
  studentCourseKeys,
  type StudentCourse,
  type StudentCoursesResponse,
} from "./course/use-student-courses";

export { useOwnedCourses } from "./course/use-owned-courses";

export { useModuleWizardData } from "./course/use-module-wizard-data";

// Project hooks
export {
  useProject,
  useProjects,
  useInvalidateProjects,
  projectKeys,
} from "./project/use-project";

export {
  useManagerProjects,
  useManagerCommitments,
  useInvalidateManagerProjects,
  managerProjectKeys,
  type ManagerProject,
  type ManagerProjectsResponse,
  type ManagerCommitment,
  type ManagerCommitmentsResponse,
} from "./project/use-manager-projects";

export {
  useContributorProjects,
  useInvalidateContributorProjects,
  contributorProjectKeys,
  type ContributorProject,
  type ContributorProjectsResponse,
} from "./project/use-contributor-projects";
