/**
 * React Query hooks for Andamioscan on-chain data
 *
 * These hooks provide cached access to on-chain course and module data
 * with automatic refetching, deduplication, and proper cache invalidation.
 *
 * @example
 * ```tsx
 * import { useAndamioscanCourse } from "~/hooks/api/use-andamioscan";
 *
 * function CourseOnChain({ courseId }: { courseId: string }) {
 *   const { data: course, isLoading, refetch } = useAndamioscanCourse(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   if (!course) return <div>Not on chain</div>;
 *
 *   return <div>{course.modules.length} modules on-chain</div>;
 * }
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCourse, getAllCourses } from "~/lib/andamioscan";

// =============================================================================
// Query Keys
// =============================================================================

export const andamioscanKeys = {
  all: ["andamioscan"] as const,
  courses: () => [...andamioscanKeys.all, "courses"] as const,
  course: (courseId: string) => [...andamioscanKeys.courses(), courseId] as const,
};

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook to fetch a specific course from Andamioscan
 *
 * @param courseId - Course NFT Policy ID
 * @returns Query result with course data (or null if not on-chain)
 */
export function useAndamioscanCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: andamioscanKeys.course(courseId ?? ""),
    queryFn: async () => {
      if (!courseId) return null;
      return getCourse(courseId);
    },
    enabled: !!courseId,
    // Andamioscan data can be stale for a bit, but refetch on window focus
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to fetch all courses from Andamioscan
 *
 * @returns Query result with array of all courses
 */
export function useAndamioscanAllCourses() {
  return useQuery({
    queryKey: andamioscanKeys.courses(),
    queryFn: getAllCourses,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to invalidate Andamioscan cache
 *
 * Use this after transactions that modify on-chain state.
 *
 * @example
 * ```tsx
 * const invalidateAndamioscan = useInvalidateAndamioscan();
 *
 * // After a successful mint transaction
 * await invalidateAndamioscan.course(courseId);
 * ```
 */
export function useInvalidateAndamioscan() {
  const queryClient = useQueryClient();

  return {
    /** Invalidate a specific course */
    course: async (courseId: string) => {
      await queryClient.invalidateQueries({
        queryKey: andamioscanKeys.course(courseId),
      });
    },
    /** Invalidate all courses */
    allCourses: async () => {
      await queryClient.invalidateQueries({
        queryKey: andamioscanKeys.courses(),
      });
    },
    /** Invalidate everything */
    all: async () => {
      await queryClient.invalidateQueries({
        queryKey: andamioscanKeys.all,
      });
    },
  };
}
