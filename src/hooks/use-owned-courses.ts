"use client";

import { useState, useEffect, useCallback } from "react";
import { useAndamioAuth } from "./use-andamio-auth";
import { type CourseListResponse } from "~/types/generated";

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
  courses: CourseListResponse;

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
  const [courses, setCourses] = useState<CourseListResponse>([]);
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
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
        throw new Error(`Failed to fetch courses: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | CourseListResponse
        | { data?: CourseListResponse; warning?: string };

      // Handle both wrapped { data: [...] } and raw array formats
      const data = Array.isArray(result) ? result : (result.data ?? []);
      setCourses(data);

      // Fetch module counts for all courses using batch endpoint
      // Go API: POST /course/teacher/modules/list
      if (data && data.length > 0) {
        try {
          const courseIds = data
            .map((c) => c.course_id)
            .filter((id): id is string => id !== null && id !== undefined);

          if (courseIds.length > 0) {
            const modulesResponse = await authenticatedFetch(
              `/api/gateway/api/v2/course/teacher/modules/list`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ course_ids: courseIds }),
              }
            );

            if (modulesResponse.ok) {
              const modulesData = (await modulesResponse.json()) as Record<
                string,
                Array<{ course_module_code: string; title: string }>
              >;

              // Convert to counts keyed by course_id
              const counts: Record<string, number> = {};
              for (const [courseId, modules] of Object.entries(modulesData)) {
                counts[courseId] = modules.length;
              }
              setModuleCounts(counts);
            }
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
