/**
 * React Query hooks for Lesson API endpoints
 *
 * Lesson types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides the Lesson query hooks for reading lessons.
 *
 * DEPRECATED MUTATIONS:
 * The following mutation hooks have been removed as of v2.0.0:
 * - useCreateLesson, useUpdateLesson, useDeleteLesson
 *
 * All Lesson modifications should now go through the aggregate-update endpoint
 * via the module draft store (useModuleDraft hook).
 */

import { useQuery } from "@tanstack/react-query";
import { type Lesson, transformLesson } from "./use-course-module";

// =============================================================================
// Query Keys
// =============================================================================

export const lessonKeys = {
  all: ["lessons"] as const,
  lists: () => [...lessonKeys.all, "list"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...lessonKeys.lists(), courseId, moduleCode] as const,
  details: () => [...lessonKeys.all, "detail"] as const,
  detail: (courseId: string, moduleCode: string, moduleIndex: number) =>
    [...lessonKeys.details(), courseId, moduleCode, moduleIndex] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all lessons for a module
 *
 * NOTE: No batch lesson endpoint exists in the API. This hook returns an empty array.
 * Use `useLesson()` for individual lessons, or get lessons embedded in SLTs via `useSLTs()`.
 *
 * @returns Empty Lesson[] (batch fetch not supported by API)
 *
 * @example
 * ```tsx
 * // Prefer using useSLTs which includes embedded lessons:
 * const { data: slts } = useSLTs(courseId, moduleCode);
 * const lessons = slts?.filter(slt => slt.lesson).map(slt => slt.lesson);
 * ```
 */
export function useLessons(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: lessonKeys.list(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Lesson[]> => {
      // No batch endpoint exists - lessons are fetched individually or embedded in SLTs
      return [];
    },
    staleTime: 30 * 1000,
    enabled: !!courseId && !!moduleCode,
  });
}

/**
 * Fetch a single lesson
 *
 * @returns Lesson with camelCase fields (contentJson, sltIndex, isLive, etc.)
 *
 * Handles both V1 and V2 API response formats:
 * - V1: Various nested formats with lesson content
 * - V2: { data: { course_id, slt_hash, slt_index, slt_text, created_by, content: {...}, source } }
 *
 * @example
 * ```tsx
 * function LessonViewer({ courseId, moduleCode, sltIndex }: Props) {
 *   const { data: lesson, isLoading } = useLesson(courseId, moduleCode, sltIndex);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!lesson) return <NotFound />;
 *
 *   return <LessonContent lesson={lesson} />;
 * }
 * ```
 */
export function useLesson(
  courseId: string | undefined,
  moduleCode: string | undefined,
  sltIndex: number | undefined
) {
  return useQuery({
    queryKey: lessonKeys.detail(courseId ?? "", moduleCode ?? "", sltIndex ?? 0),
    queryFn: async (): Promise<Lesson | null> => {
      // Endpoint: GET /course/user/lesson/{course_id}/{course_module_code}/{slt_index}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/lesson/${courseId}/${moduleCode}/${sltIndex}`
      );

      // 404 means module not on-chain (V2) or lesson doesn't exist
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      // Handle both wrapped { data: {...} } and raw object formats
      let raw: Record<string, unknown> | null = null;
      if (result && typeof result === "object") {
        if ("data" in result && (result as { data?: unknown }).data) {
          const dataRecord = (result as { data: Record<string, unknown> }).data;
          // V2 format has top-level fields (slt_hash, created_by, content, source)
          // The transform function handles the nested `content` object
          raw = dataRecord;
        } else if (
          "title" in result ||
          "content_json" in result ||
          "slt_index" in result ||
          "content" in result
        ) {
          raw = result as Record<string, unknown>;
        }
      }

      return raw ? transformLesson(raw) : null;
    },
    staleTime: 30 * 1000,
    enabled: !!courseId && !!moduleCode && sltIndex !== undefined,
  });
}

