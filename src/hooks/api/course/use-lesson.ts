/**
 * React Query hooks for Lesson API endpoints
 *
 * Lesson types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides standalone Lesson CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { type Lesson, transformLesson } from "./use-course-module";
import { sltKeys } from "./use-slt";

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

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      // Handle both wrapped { data: {...} } and raw object formats
      let raw: Record<string, unknown> | null = null;
      if (result && typeof result === "object") {
        if ("data" in result && (result as { data?: unknown }).data) {
          raw = (result as { data: Record<string, unknown> }).data;
        } else if (
          "title" in result ||
          "content_json" in result ||
          "slt_index" in result
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

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new lesson
 *
 * @returns The created Lesson with camelCase fields
 */
export function useCreateLesson() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      sltIndex,
      title,
      description,
      contentJson,
    }: {
      courseId: string;
      moduleCode: string;
      sltIndex: number;
      title: string;
      description?: string;
      contentJson?: unknown;
    }): Promise<Lesson> => {
      // Endpoint: POST /course/teacher/lesson/create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/lesson/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            slt_index: sltIndex,
            title,
            description,
            content_json: contentJson,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to create lesson: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformLesson(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.list(variables.courseId, variables.moduleCode),
      });
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.courseId, variables.moduleCode, variables.sltIndex),
      });
      // Also invalidate SLTs as lessons are embedded in SLTs
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseId, variables.moduleCode),
      });
    },
  });
}

/**
 * Update an existing lesson
 *
 * @returns The updated Lesson with camelCase fields
 *
 * @example
 * ```tsx
 * function LessonEditor({ courseId, moduleCode, sltIndex }: Props) {
 *   const updateLesson = useUpdateLesson();
 *
 *   const handleSave = async (data: LessonFormData) => {
 *     await updateLesson.mutateAsync({
 *       courseId,
 *       moduleCode,
 *       sltIndex,
 *       ...data,
 *     });
 *     toast.success("Lesson updated");
 *   };
 *
 *   return <LessonForm onSubmit={handleSave} />;
 * }
 * ```
 */
export function useUpdateLesson() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      sltIndex,
      title,
      description,
      contentJson,
      imageUrl,
      videoUrl,
      isLive,
    }: {
      courseId: string;
      moduleCode: string;
      sltIndex: number;
      title?: string;
      description?: string;
      contentJson?: unknown;
      imageUrl?: string;
      videoUrl?: string;
      isLive?: boolean;
    }): Promise<Lesson> => {
      // Endpoint: POST /course/teacher/lesson/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/lesson/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            slt_index: sltIndex,
            title,
            description,
            content_json: contentJson,
            image_url: imageUrl,
            video_url: videoUrl,
            is_live: isLive,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to update lesson: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformLesson(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.detail(variables.courseId, variables.moduleCode, variables.sltIndex),
      });
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.list(variables.courseId, variables.moduleCode),
      });
      // Also invalidate SLTs as lessons are embedded in SLTs
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseId, variables.moduleCode),
      });
    },
  });
}

/**
 * Delete a lesson
 *
 * @example
 * ```tsx
 * function DeleteLessonButton({ courseId, moduleCode, sltIndex }: Props) {
 *   const deleteLesson = useDeleteLesson();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Delete this lesson?")) {
 *       await deleteLesson.mutateAsync({ courseId, moduleCode, sltIndex });
 *       toast.success("Lesson deleted");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteLesson() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      sltIndex,
    }: {
      courseId: string;
      moduleCode: string;
      sltIndex: number;
    }): Promise<void> => {
      // Endpoint: POST /course/teacher/lesson/delete
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/lesson/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            slt_index: sltIndex,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to delete lesson: ${response.statusText}`
        );
      }
    },
    onSuccess: (_, variables) => {
      // Remove the specific lesson from cache
      queryClient.removeQueries({
        queryKey: lessonKeys.detail(variables.courseId, variables.moduleCode, variables.sltIndex),
      });
      void queryClient.invalidateQueries({
        queryKey: lessonKeys.list(variables.courseId, variables.moduleCode),
      });
      // Also invalidate SLTs as lessons are embedded in SLTs
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseId, variables.moduleCode),
      });
    },
  });
}
