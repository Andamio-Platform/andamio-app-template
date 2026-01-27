/**
 * React Query hooks for Introduction API endpoints
 *
 * Introduction types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides query and mutation hooks for introductions.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { type Introduction, transformIntroduction, courseModuleKeys, introductionKeys } from "./use-course-module";

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch an introduction for a specific module (public endpoint)
 *
 * @returns Introduction with camelCase fields, or null if no introduction exists
 *
 * V2 API response format:
 * { data: { course_id, course_module_code, slt_hash, created_by, content: {...}, source } }
 *
 * @example
 * ```tsx
 * function IntroductionViewer({ courseId, moduleCode }: Props) {
 *   const { data: introduction, isLoading } = useIntroduction(courseId, moduleCode);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!introduction) return <NoIntroduction />;
 *
 *   return <IntroductionContent introduction={introduction} />;
 * }
 * ```
 */
export function useIntroduction(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: introductionKeys.detail(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Introduction | null> => {
      // Endpoint: GET /course/user/introduction/{course_id}/{course_module_code}
      // NEW in V2 - public introduction endpoint
      const response = await fetch(
        `/api/gateway/api/v2/course/user/introduction/${courseId}/${moduleCode}`
      );

      // 404 means no introduction exists or module not on-chain
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch introduction: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      // Handle wrapped { data: {...} } format
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
          "introduction_content" in result ||
          "content" in result
        ) {
          raw = result as Record<string, unknown>;
        }
      }

      return raw ? transformIntroduction(raw) : null;
    },
    staleTime: 30 * 1000,
    enabled: !!courseId && !!moduleCode,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new introduction for a module
 *
 * @returns The created Introduction with camelCase fields
 *
 * @example
 * ```tsx
 * function IntroductionCreator({ courseId, moduleCode }: Props) {
 *   const createIntroduction = useCreateIntroduction();
 *
 *   const handleCreate = async (data: IntroductionFormData) => {
 *     await createIntroduction.mutateAsync({
 *       courseId,
 *       moduleCode,
 *       title: data.title,
 *       contentJson: data.content,
 *     });
 *     toast.success("Introduction created");
 *   };
 *
 *   return <IntroductionForm onSubmit={handleCreate} />;
 * }
 * ```
 */
export function useCreateIntroduction() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      title,
      contentJson,
    }: {
      courseId: string;
      moduleCode: string;
      title: string;
      contentJson?: unknown;
    }): Promise<Introduction> => {
      // Endpoint: POST /course/teacher/introduction/create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/introduction/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            title,
            content_json: contentJson,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to create introduction: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformIntroduction(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: introductionKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Also invalidate module list as introductions are embedded in modules
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}

/**
 * Update an existing introduction
 *
 * @returns The updated Introduction with camelCase fields
 *
 * @example
 * ```tsx
 * function IntroductionEditor({ courseId, moduleCode }: Props) {
 *   const updateIntroduction = useUpdateIntroduction();
 *
 *   const handleSave = async (data: IntroductionFormData) => {
 *     await updateIntroduction.mutateAsync({
 *       courseId,
 *       moduleCode,
 *       ...data,
 *     });
 *     toast.success("Introduction updated");
 *   };
 *
 *   return <IntroductionForm onSubmit={handleSave} />;
 * }
 * ```
 */
export function useUpdateIntroduction() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      title,
      contentJson,
    }: {
      courseId: string;
      moduleCode: string;
      title?: string;
      contentJson?: unknown;
    }): Promise<Introduction> => {
      // Endpoint: POST /course/teacher/introduction/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/introduction/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            title,
            content_json: contentJson,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to update introduction: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformIntroduction(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: introductionKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Also invalidate module list as introductions are embedded in modules
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}

/**
 * Delete an introduction
 *
 * @example
 * ```tsx
 * function DeleteIntroductionButton({ courseId, moduleCode }: Props) {
 *   const deleteIntroduction = useDeleteIntroduction();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Delete this introduction?")) {
 *       await deleteIntroduction.mutateAsync({ courseId, moduleCode });
 *       toast.success("Introduction deleted");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteIntroduction() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
    }: {
      courseId: string;
      moduleCode: string;
    }): Promise<void> => {
      // Endpoint: POST /course/teacher/introduction/delete
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/introduction/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to delete introduction: ${response.statusText}`
        );
      }
    },
    onSuccess: (_, variables) => {
      // Remove the specific introduction from cache
      queryClient.removeQueries({
        queryKey: introductionKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Also invalidate module list as introductions are embedded in modules
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}
