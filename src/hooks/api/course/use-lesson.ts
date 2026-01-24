/**
 * React Query hooks for Lesson API endpoints
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { type LessonResponse, type LessonListResponse } from "~/types/generated";
import { sltKeys } from "./use-slt";

// =============================================================================
// Query Keys
// =============================================================================

export const lessonKeys = {
  all: ["lessons"] as const,
  lists: () => [...lessonKeys.all, "list"] as const,
  list: (courseNftPolicyId: string, moduleCode: string) =>
    [...lessonKeys.lists(), courseNftPolicyId, moduleCode] as const,
  details: () => [...lessonKeys.all, "detail"] as const,
  detail: (courseNftPolicyId: string, moduleCode: string, moduleIndex: number) =>
    [...lessonKeys.details(), courseNftPolicyId, moduleCode, moduleIndex] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all lessons for a module
 *
 * @example
 * ```tsx
 * function LessonList({ courseId, moduleCode }: Props) {
 *   const { data: lessons, isLoading } = useLessons(courseId, moduleCode);
 *
 *   return lessons?.map(lesson => <LessonRow key={lesson.id} lesson={lesson} />);
 * }
 * ```
 */
export function useLessons(
  courseNftPolicyId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: lessonKeys.list(courseNftPolicyId ?? "", moduleCode ?? ""),
    queryFn: async () => {
      // NOTE: No list endpoint exists in API - only individual lesson fetch via:
      // GET /course/user/lesson/{course_id}/{course_module_code}/{slt_index}
      // To get all lessons for a module, you must iterate SLTs and fetch each individually.
      // Return empty array since batch fetch is not supported.
      console.warn(
        "[useLessons] No batch lesson endpoint exists. Use useLesson() for individual lessons."
      );
      return [] as LessonListResponse;
    },
    enabled: !!courseNftPolicyId && !!moduleCode,
  });
}

/**
 * Fetch a single lesson
 *
 * @example
 * ```tsx
 * function LessonViewer({ courseId, moduleCode, index }: Props) {
 *   const { data: lesson, isLoading } = useLesson(courseId, moduleCode, index);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!lesson) return <NotFound />;
 *
 *   return <LessonContent lesson={lesson} />;
 * }
 * ```
 */
export function useLesson(
  courseNftPolicyId: string | undefined,
  moduleCode: string | undefined,
  moduleIndex: number | undefined
) {
  return useQuery({
    queryKey: lessonKeys.detail(
      courseNftPolicyId ?? "",
      moduleCode ?? "",
      moduleIndex ?? 0
    ),
    queryFn: async (): Promise<LessonResponse> => {
      // Go API: GET /course/user/lesson/{course_id}/{course_module_code}/{slt_index}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/lesson/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.statusText}`);
      }

      const result = await response.json() as LessonResponse | { data?: LessonResponse };
      // Handle both wrapped { data: {...} } and raw object formats
      if (result && typeof result === "object") {
        if ("data" in result && result.data) {
          console.log("[useLesson] Response was wrapped, unwrapped:", result.data);
          return result.data;
        } else if ("title" in result || "content_json" in result || "slt_index" in result) {
          console.log("[useLesson] Response (raw):", result);
          return result;
        }
      }
      console.log("[useLesson] Response has unexpected shape:", result);
      return result as LessonResponse; // Fallback cast for unexpected shapes
    },
    enabled:
      !!courseNftPolicyId && !!moduleCode && moduleIndex !== undefined,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new lesson
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      moduleIndex,
      title,
      description,
      contentJson,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      moduleIndex: number;
      title: string;
      description?: string;
      contentJson?: object;
    }) => {
      // Go API: POST /course/teacher/lesson/create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/lesson/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_index: moduleIndex,
            title,
            description,
            content_json: contentJson,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create lesson: ${response.statusText}`);
      }

      return response.json() as Promise<LessonResponse>;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.list(variables.courseNftPolicyId, variables.moduleCode),
      });
      // Also invalidate SLTs as lessons are linked to SLTs
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseNftPolicyId, variables.moduleCode),
      });
    },
  });
}
