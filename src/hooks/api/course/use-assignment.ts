/**
 * React Query hooks for Assignment API endpoints
 *
 * Assignment types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides query and mutation hooks for assignments.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { type Assignment, transformAssignment, courseModuleKeys, assignmentKeys } from "./use-course-module";

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch an assignment for a specific module
 *
 * @returns Assignment with camelCase fields, or null if no assignment exists
 *
 * @example
 * ```tsx
 * function AssignmentViewer({ courseId, moduleCode }: Props) {
 *   const { data: assignment, isLoading } = useAssignment(courseId, moduleCode);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!assignment) return <NoAssignment />;
 *
 *   return <AssignmentContent assignment={assignment} />;
 * }
 * ```
 */
export function useAssignment(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: assignmentKeys.detail(courseId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<Assignment | null> => {
      // Endpoint: GET /course/user/assignment/{course_id}/{course_module_code}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/assignment/${courseId}/${moduleCode}`
      );

      // 404 means no assignment exists for this module
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch assignment: ${response.statusText}`);
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
          "assignment_content" in result
        ) {
          raw = result as Record<string, unknown>;
        }
      }

      return raw ? transformAssignment(raw) : null;
    },
    staleTime: 30 * 1000,
    enabled: !!courseId && !!moduleCode,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new assignment for a module
 *
 * @returns The created Assignment with camelCase fields
 *
 * @example
 * ```tsx
 * function AssignmentCreator({ courseId, moduleCode }: Props) {
 *   const createAssignment = useCreateAssignment();
 *
 *   const handleCreate = async (data: AssignmentFormData) => {
 *     await createAssignment.mutateAsync({
 *       courseId,
 *       moduleCode,
 *       title: data.title,
 *       contentJson: data.content,
 *     });
 *     toast.success("Assignment created");
 *   };
 *
 *   return <AssignmentForm onSubmit={handleCreate} />;
 * }
 * ```
 */
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      title,
      description,
      contentJson,
      imageUrl,
      videoUrl,
    }: {
      courseId: string;
      moduleCode: string;
      title: string;
      description?: string;
      contentJson?: unknown;
      imageUrl?: string;
      videoUrl?: string;
    }): Promise<Assignment> => {
      // Endpoint: POST /course/teacher/assignment/create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/assignment/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            title,
            description,
            content_json: contentJson,
            image_url: imageUrl,
            video_url: videoUrl,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to create assignment: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformAssignment(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Also invalidate module list as assignments are embedded in modules
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
 * Update an existing assignment
 *
 * @returns The updated Assignment with camelCase fields
 *
 * @example
 * ```tsx
 * function AssignmentEditor({ courseId, moduleCode }: Props) {
 *   const updateAssignment = useUpdateAssignment();
 *
 *   const handleSave = async (data: AssignmentFormData) => {
 *     await updateAssignment.mutateAsync({
 *       courseId,
 *       moduleCode,
 *       ...data,
 *     });
 *     toast.success("Assignment updated");
 *   };
 *
 *   return <AssignmentForm onSubmit={handleSave} />;
 * }
 * ```
 */
export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      title,
      description,
      contentJson,
      imageUrl,
      videoUrl,
      isLive,
    }: {
      courseId: string;
      moduleCode: string;
      title?: string;
      description?: string;
      contentJson?: unknown;
      imageUrl?: string;
      videoUrl?: string;
      isLive?: boolean;
    }): Promise<Assignment> => {
      // Endpoint: POST /course/teacher/assignment/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/assignment/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
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
          errorData.message ?? `Failed to update assignment: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformAssignment(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: assignmentKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Also invalidate module list as assignments are embedded in modules
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
 * Delete an assignment
 *
 * @example
 * ```tsx
 * function DeleteAssignmentButton({ courseId, moduleCode }: Props) {
 *   const deleteAssignment = useDeleteAssignment();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Delete this assignment?")) {
 *       await deleteAssignment.mutateAsync({ courseId, moduleCode });
 *       toast.success("Assignment deleted");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteAssignment() {
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
      // Endpoint: POST /course/teacher/assignment/delete
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/assignment/delete`,
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
          errorData.message ?? `Failed to delete assignment: ${response.statusText}`
        );
      }
    },
    onSuccess: (_, variables) => {
      // Remove the specific assignment from cache
      queryClient.removeQueries({
        queryKey: assignmentKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Also invalidate module list as assignments are embedded in modules
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseId),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}
