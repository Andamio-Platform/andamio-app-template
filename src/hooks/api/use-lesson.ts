/**
 * React Query hooks for Lesson API endpoints
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { type LessonOutput, type LessonWithSLTOutput, type ListLessonsOutput } from "@andamio/db-api";
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
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lesson/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lessons: ${response.statusText}`);
      }

      return response.json() as Promise<ListLessonsOutput>;
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
    queryFn: async () => {
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lesson/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch lesson: ${response.statusText}`);
      }

      return response.json() as Promise<LessonWithSLTOutput>;
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lesson/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
            title,
            description,
            content_json: contentJson,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create lesson: ${response.statusText}`);
      }

      return response.json() as Promise<LessonOutput>;
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
