"use client";

import { useState, useEffect, useCallback } from "react";
import { env } from "~/env";
import { useAndamioAuth } from "./use-andamio-auth";
import { type ListOwnedCoursesOutput } from "@andamio/db-api";

/**
 * useOwnedCourses - Fetches owned courses with module counts
 *
 * Consolidates the duplicate fetch logic from course-manager.tsx and owned-courses-list.tsx.
 * Provides consistent loading, error, and empty states with module counts.
 *
 * @example
 * ```tsx
 * const { courses, moduleCounts, isLoading, error, refetch } = useOwnedCourses();
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorAlert message={error} />;
 * if (courses.length === 0) return <EmptyState />;
 *
 * return <CourseList courses={courses} moduleCounts={moduleCounts} />;
 * ```
 */
export interface UseOwnedCoursesResult {
  /**
   * List of owned courses (empty array until loaded)
   */
  courses: ListOwnedCoursesOutput;

  /**
   * Module counts per course code
   */
  moduleCounts: Record<string, number>;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error message (null if no error)
   */
  error: string | null;

  /**
   * Manually trigger a refetch
   */
  refetch: () => Promise<void>;
}

export function useOwnedCourses(): UseOwnedCoursesResult {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [courses, setCourses] = useState<ListOwnedCoursesOutput>([]);
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOwnedCourses = useCallback(async () => {
    if (!isAuthenticated) {
      setCourses([]);
      setModuleCounts({});
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/owned`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.statusText}`);
      }

      const data = (await response.json()) as ListOwnedCoursesOutput;
      setCourses(data ?? []);

      // Fetch module counts for all courses using batch endpoint
      // Note: This endpoint is public but we use authenticatedFetch for consistency
      if (data && data.length > 0) {
        try {
          const courseCodes = data.map((c) => c.course_code);
          const modulesResponse = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/list-by-courses`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ course_codes: courseCodes }),
            }
          );

          if (modulesResponse.ok) {
            const modulesData = (await modulesResponse.json()) as Record<
              string,
              Array<{ module_code: string; title: string }>
            >;

            // Convert to counts
            const counts: Record<string, number> = {};
            for (const [courseCode, modules] of Object.entries(modulesData)) {
              counts[courseCode] = modules.length;
            }
            setModuleCounts(counts);
          }
        } catch (err) {
          console.error("Error fetching module counts:", err);
          // Don't set error state, module counts are optional enhancement
        }
      }
    } catch (err) {
      console.error("Error fetching owned courses:", err);
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authenticatedFetch]);

  useEffect(() => {
    void fetchOwnedCourses();
  }, [fetchOwnedCourses]);

  return {
    courses,
    moduleCounts,
    isLoading,
    error,
    refetch: fetchOwnedCourses,
  };
}
