/**
 * React hooks for Andamioscan on-chain data
 *
 * These hooks provide easy access to on-chain course and user data
 * with loading states and error handling.
 *
 * @example
 * ```tsx
 * function CourseList() {
 *   const { courses, isLoading, error } = useAllCourses();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <Error message={error.message} />;
 *
 *   return courses.map(c => <CourseCard key={c.course_id} course={c} />);
 * }
 * ```
 */

import { useState, useEffect, useCallback } from "react";
import {
  getAllCourses,
  getCourse,
  getCourseStudents,
  getCourseStudent,
  getUserGlobalState,
  getCoursesOwnedByAlias,
  getCoursesOwnedByAliasWithDetails,
  getPendingAssessments,
  getEnrolledCourses,
  getCompletedCourses,
  getOwnedCourses,
  getAllProjects,
  getProject,
  getContributingProjects,
  getManagingProjects,
  getOwnedProjects,
  getCompletedProjects,
  getProjectContributorStatus,
  getManagerPendingAssessments,
  type AndamioscanCourse,
  type AndamioscanStudent,
  type AndamioscanUserGlobalState,
  type AndamioscanPendingAssessment,
  type AndamioscanProject,
  type AndamioscanProjectDetails,
  type AndamioscanContributorStatus,
  type AndamioscanProjectPendingAssessment,
} from "~/lib/andamioscan";

// =============================================================================
// Types
// =============================================================================

type UseQueryResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

// =============================================================================
// Generic Hook Factory
// =============================================================================

function useQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = []
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queryFn();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// =============================================================================
// Course Hooks
// =============================================================================

/**
 * Hook to fetch all courses on-chain
 *
 * @returns Query result with array of courses
 *
 * @example
 * ```tsx
 * const { data: courses, isLoading } = useAllCourses();
 * ```
 */
export function useAllCourses(): UseQueryResult<AndamioscanCourse[]> {
  return useQuery(getAllCourses);
}

/**
 * Hook to fetch a specific course by ID
 *
 * @param courseId - Course NFT Policy ID
 * @returns Query result with course data (or null if not found)
 *
 * @example
 * ```tsx
 * const { data: course, isLoading } = useCourse(courseNftPolicyId);
 * ```
 */
export function useCourse(courseId: string | undefined): UseQueryResult<AndamioscanCourse | null> {
  return useQuery(
    async () => (courseId ? getCourse(courseId) : null),
    [courseId]
  );
}

/**
 * Hook to fetch student aliases enrolled in a course
 *
 * Note: Returns string[] (aliases), not full student objects.
 * Use useCourseStudent() to get details for a specific student.
 *
 * @param courseId - Course NFT Policy ID
 * @returns Query result with array of student aliases
 *
 * @example
 * ```tsx
 * const { data: studentAliases, isLoading } = useCourseStudents(courseNftPolicyId);
 * console.log(`${studentAliases?.length ?? 0} students enrolled`);
 * ```
 */
export function useCourseStudents(
  courseId: string | undefined
): UseQueryResult<string[]> {
  return useQuery(
    async () => (courseId ? getCourseStudents(courseId) : []),
    [courseId]
  );
}

/**
 * Hook to fetch a specific student's enrollment
 *
 * @param courseId - Course NFT Policy ID
 * @param alias - Student's access token alias
 * @returns Query result with student data (or null if not enrolled)
 *
 * @example
 * ```tsx
 * const { data: student } = useCourseStudent(courseId, userAlias);
 * const isEnrolled = student !== null;
 * ```
 */
export function useCourseStudent(
  courseId: string | undefined,
  alias: string | undefined
): UseQueryResult<AndamioscanStudent | null> {
  return useQuery(
    async () => (courseId && alias ? getCourseStudent(courseId, alias) : null),
    [courseId, alias]
  );
}

// =============================================================================
// User Hooks
// =============================================================================

/**
 * Hook to fetch a user's global on-chain state
 *
 * @param alias - User's access token alias
 * @returns Query result with user's courses and credentials
 *
 * @example
 * ```tsx
 * const { data: userState, isLoading } = useUserGlobalState(userAlias);
 * const enrolledCourses = userState?.courses.filter(c => c.is_enrolled) ?? [];
 * ```
 */
export function useUserGlobalState(
  alias: string | undefined
): UseQueryResult<AndamioscanUserGlobalState | null> {
  return useQuery(
    async () => (alias ? getUserGlobalState(alias) : null),
    [alias]
  );
}

/**
 * Hook to check if current user is enrolled in a course
 *
 * @param courseId - Course NFT Policy ID
 * @param alias - User's access token alias
 * @returns Object with isEnrolled boolean and loading state
 *
 * @example
 * ```tsx
 * const { isEnrolled, isLoading } = useIsEnrolled(courseId, userAlias);
 *
 * if (!isEnrolled) {
 *   return <EnrollButton />;
 * }
 * ```
 */
export function useIsEnrolled(
  courseId: string | undefined,
  alias: string | undefined
): { isEnrolled: boolean; isLoading: boolean; error: Error | null } {
  const { data: student, isLoading, error } = useCourseStudent(courseId, alias);
  return {
    isEnrolled: student !== null,
    isLoading,
    error,
  };
}

// =============================================================================
// Combined Hooks
// =============================================================================

/**
 * Hook to get course with on-chain status
 *
 * Combines course existence check with module count.
 *
 * @param courseId - Course NFT Policy ID
 * @returns Course data with isOnChain flag and module counts
 */
export function useCourseOnChainStatus(courseId: string | undefined): {
  isOnChain: boolean;
  moduleCount: number;
  teachers: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: course, isLoading, error } = useCourse(courseId);

  return {
    isOnChain: course !== null,
    moduleCount: course?.modules.length ?? 0,
    teachers: course?.teachers ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook to get student progress in a course
 *
 * @param courseId - Course NFT Policy ID
 * @param alias - Student's access token alias
 * @returns Progress data with counts and current assignment
 */
export function useStudentProgress(
  courseId: string | undefined,
  alias: string | undefined
): {
  isEnrolled: boolean;
  currentModule: string | null;
  completedCount: number;
  completedModules: string[];
  isLoading: boolean;
  error: Error | null;
} {
  const { data: student, isLoading, error } = useCourseStudent(courseId, alias);

  return {
    isEnrolled: student !== null,
    currentModule: student?.current ?? null,
    completedCount: student?.completed.length ?? 0,
    completedModules: student?.completed ?? [],
    isLoading,
    error,
  };
}

/**
 * Hook to get all courses taught by a user (basic info, no modules)
 *
 * Note: This returns courses without module details. Use useCoursesOwnedByAliasWithDetails
 * if you need module information.
 *
 * @param alias - User's access token alias
 * @returns Query result with array of owned courses (without module details)
 *
 * @example
 * ```tsx
 * const { data: ownedCourses, isLoading } = useCoursesOwnedByAlias(userAlias);
 * const courseIds = ownedCourses?.map(c => c.course_id) ?? [];
 * ```
 */
export function useCoursesOwnedByAlias(
  alias: string | undefined
): UseQueryResult<AndamioscanCourse[]> {
  return useQuery(
    async () => (alias ? getCoursesOwnedByAlias(alias) : []),
    [alias]
  );
}

/**
 * Hook to get all courses taught by a user with full details (including modules)
 *
 * This makes additional API calls to fetch details for each course.
 * Use this when you need module counts or other detailed information.
 *
 * @param alias - User's access token alias
 * @returns Query result with array of owned courses with full details
 *
 * @example
 * ```tsx
 * const { data: ownedCourses, isLoading } = useCoursesOwnedByAliasWithDetails(userAlias);
 * const totalModules = ownedCourses?.reduce((sum, c) => sum + c.modules.length, 0) ?? 0;
 * ```
 */
export function useCoursesOwnedByAliasWithDetails(
  alias: string | undefined
): UseQueryResult<AndamioscanCourse[]> {
  return useQuery(
    async () => (alias ? getCoursesOwnedByAliasWithDetails(alias) : []),
    [alias]
  );
}

// =============================================================================
// Teacher Hooks
// =============================================================================

/**
 * Hook to get pending assessments for a teacher
 *
 * @param alias - Teacher's access token alias
 * @returns Query result with array of pending assessments
 *
 * @example
 * ```tsx
 * const { data: pending, isLoading, error, refetch } = usePendingAssessments(teacherAlias);
 * console.log(`${pending?.length ?? 0} assignments awaiting review`);
 * ```
 */
export function usePendingAssessments(
  alias: string | undefined
): UseQueryResult<AndamioscanPendingAssessment[]> {
  return useQuery(
    async () => (alias ? getPendingAssessments(alias) : []),
    [alias]
  );
}

// =============================================================================
// Learner Hooks
// =============================================================================

/**
 * Hook to get all courses a user is enrolled in (on-chain data)
 *
 * @param alias - User's access token alias
 * @returns Query result with array of enrolled courses
 *
 * @example
 * ```tsx
 * const { data: enrolledCourses, isLoading, error, refetch } = useEnrolledCourses(userAlias);
 * console.log(`${enrolledCourses?.length ?? 0} courses enrolled on-chain`);
 * ```
 */
export function useEnrolledCourses(
  alias: string | undefined
): UseQueryResult<AndamioscanCourse[]> {
  return useQuery(
    async () => (alias ? getEnrolledCourses(alias) : []),
    [alias]
  );
}

/**
 * Hook to get all courses a user has completed (on-chain data)
 *
 * @param alias - User's access token alias
 * @returns Query result with array of completed courses (credentials earned)
 *
 * @example
 * ```tsx
 * const { data: completedCourses, isLoading, error, refetch } = useCompletedCourses(userAlias);
 * console.log(`${completedCourses?.length ?? 0} credentials earned on-chain`);
 * ```
 */
export function useCompletedCourses(
  alias: string | undefined
): UseQueryResult<AndamioscanCourse[]> {
  return useQuery(
    async () => (alias ? getCompletedCourses(alias) : []),
    [alias]
  );
}

/**
 * Hook to get all courses a user owns (created/is admin of) on-chain
 *
 * Note: This is different from useCoursesOwnedByAlias (teaching) - owned means
 * the user is the admin/creator of the course.
 *
 * @param alias - User's access token alias
 * @returns Query result with array of owned courses
 *
 * @example
 * ```tsx
 * const { data: ownedCourses, isLoading, error, refetch } = useOwnedCourses(userAlias);
 * console.log(`${ownedCourses?.length ?? 0} courses owned on-chain`);
 * ```
 */
export function useOwnedCourses(
  alias: string | undefined
): UseQueryResult<AndamioscanCourse[]> {
  return useQuery(
    async () => (alias ? getOwnedCourses(alias) : []),
    [alias]
  );
}

// =============================================================================
// Project Hooks
// =============================================================================

/**
 * Hook to fetch all projects on-chain
 *
 * @returns Query result with array of projects
 *
 * @example
 * ```tsx
 * const { data: projects, isLoading, error, refetch } = useAllProjects();
 * console.log(`${projects?.length ?? 0} projects on-chain`);
 * ```
 */
export function useAllProjects(): UseQueryResult<AndamioscanProject[]> {
  return useQuery(getAllProjects);
}

/**
 * Hook to fetch project details by ID
 *
 * @param projectId - Project NFT Policy ID
 * @returns Query result with full project details (tasks, contributors, submissions, etc.)
 *
 * @example
 * ```tsx
 * const { data: project, isLoading, error } = useProject(projectId);
 * if (project) {
 *   console.log(`${project.tasks.length} tasks, ${project.contributors.length} contributors`);
 * }
 * ```
 */
export function useProject(
  projectId: string | undefined
): UseQueryResult<AndamioscanProjectDetails | null> {
  return useQuery(
    async () => (projectId ? getProject(projectId) : null),
    [projectId]
  );
}

/**
 * Hook to get all projects a user is contributing to (on-chain data)
 *
 * @param alias - User's access token alias
 * @returns Query result with array of projects the user contributes to
 *
 * @example
 * ```tsx
 * const { data: projects, isLoading, error, refetch } = useContributingProjects(userAlias);
 * console.log(`${projects?.length ?? 0} projects contributing to on-chain`);
 * ```
 */
export function useContributingProjects(
  alias: string | undefined
): UseQueryResult<AndamioscanProject[]> {
  return useQuery(
    async () => (alias ? getContributingProjects(alias) : []),
    [alias]
  );
}

/**
 * Hook to get all projects a user is managing (on-chain data)
 *
 * @param alias - User's access token alias
 * @returns Query result with array of projects the user manages
 *
 * @example
 * ```tsx
 * const { data: projects, isLoading, error, refetch } = useManagingProjects(userAlias);
 * console.log(`${projects?.length ?? 0} projects managing on-chain`);
 * ```
 */
export function useManagingProjects(
  alias: string | undefined
): UseQueryResult<AndamioscanProject[]> {
  return useQuery(
    async () => (alias ? getManagingProjects(alias) : []),
    [alias]
  );
}

/**
 * Hook to get all projects a user owns (created/is admin of) on-chain
 *
 * @param alias - User's access token alias
 * @returns Query result with array of owned projects
 *
 * @example
 * ```tsx
 * const { data: ownedProjects, isLoading, error, refetch } = useOwnedProjects(userAlias);
 * console.log(`${ownedProjects?.length ?? 0} projects owned on-chain`);
 * ```
 */
export function useOwnedProjects(
  alias: string | undefined
): UseQueryResult<AndamioscanProject[]> {
  return useQuery(
    async () => (alias ? getOwnedProjects(alias) : []),
    [alias]
  );
}

/**
 * Hook to get all projects a user has completed (earned credentials) on-chain
 *
 * @param alias - User's access token alias
 * @returns Query result with array of completed projects
 *
 * @example
 * ```tsx
 * const { data: completedProjects, isLoading, error, refetch } = useCompletedProjects(userAlias);
 * console.log(`${completedProjects?.length ?? 0} projects completed on-chain`);
 * ```
 */
export function useCompletedProjects(
  alias: string | undefined
): UseQueryResult<AndamioscanProject[]> {
  return useQuery(
    async () => (alias ? getCompletedProjects(alias) : []),
    [alias]
  );
}

/**
 * Hook to get a contributor's status in a project
 *
 * @param projectId - Project NFT Policy ID
 * @param alias - Contributor's access token alias
 * @returns Query result with contributor status (or null if not a contributor)
 *
 * @example
 * ```tsx
 * const { data: status } = useProjectContributorStatus(projectId, userAlias);
 * const isContributor = status !== null;
 * ```
 */
export function useProjectContributorStatus(
  projectId: string | undefined,
  alias: string | undefined
): UseQueryResult<AndamioscanContributorStatus | null> {
  return useQuery(
    async () => (projectId && alias ? getProjectContributorStatus(projectId, alias) : null),
    [projectId, alias]
  );
}

/**
 * Hook to check if current user is a contributor in a project
 *
 * @param projectId - Project NFT Policy ID
 * @param alias - User's access token alias
 * @returns Object with isContributor boolean and loading state
 *
 * @example
 * ```tsx
 * const { isContributor, isLoading } = useIsProjectContributor(projectId, userAlias);
 *
 * if (!isContributor) {
 *   return <JoinProjectButton />;
 * }
 * ```
 */
export function useIsProjectContributor(
  projectId: string | undefined,
  alias: string | undefined
): { isContributor: boolean; isLoading: boolean; error: Error | null } {
  const { data: status, isLoading, error } = useProjectContributorStatus(projectId, alias);
  return {
    isContributor: status !== null,
    isLoading,
    error,
  };
}

/**
 * Hook to get contributor progress in a project
 *
 * @param projectId - Project NFT Policy ID
 * @param alias - Contributor's access token alias
 * @returns Progress data with task counts and credentials
 */
export function useContributorProgress(
  projectId: string | undefined,
  alias: string | undefined
): {
  isContributor: boolean;
  completedCount: number;
  pendingCount: number;
  credentialsEarned: number;
  isLoading: boolean;
  error: Error | null;
} {
  const { data: status, isLoading, error } = useProjectContributorStatus(projectId, alias);

  return {
    isContributor: status !== null,
    completedCount: status?.completed_tasks.length ?? 0,
    pendingCount: status?.pending_tasks.length ?? 0,
    credentialsEarned: status?.credentials.length ?? 0,
    isLoading,
    error,
  };
}

// =============================================================================
// Manager Hooks
// =============================================================================

/**
 * Hook to get pending assessments for a project manager
 *
 * @param alias - Manager's access token alias
 * @returns Query result with array of pending assessments
 *
 * @example
 * ```tsx
 * const { data: pending, isLoading, error, refetch } = useManagerPendingAssessments(managerAlias);
 * console.log(`${pending?.length ?? 0} task submissions awaiting review`);
 * ```
 */
export function useManagerPendingAssessments(
  alias: string | undefined
): UseQueryResult<AndamioscanProjectPendingAssessment[]> {
  return useQuery(
    async () => (alias ? getManagerPendingAssessments(alias) : []),
    [alias]
  );
}
