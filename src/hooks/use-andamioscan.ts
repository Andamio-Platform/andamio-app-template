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
  type AndamioscanCourse,
  type AndamioscanStudent,
  type AndamioscanUserGlobalState,
} from "~/lib/andamioscan";

// =============================================================================
// Types
// =============================================================================

type UseQueryResult<T> = {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
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
 * Hook to fetch students enrolled in a course
 *
 * @param courseId - Course NFT Policy ID
 * @returns Query result with array of students
 *
 * @example
 * ```tsx
 * const { data: students, isLoading } = useCourseStudents(courseNftPolicyId);
 * const activeCount = students?.filter(s => s.current !== null).length ?? 0;
 * ```
 */
export function useCourseStudents(
  courseId: string | undefined
): UseQueryResult<AndamioscanStudent[]> {
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
