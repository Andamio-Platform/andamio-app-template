/**
 * React Query hooks for SLT (Student Learning Target) API endpoints
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { type SLTListResponse, type SLTResponse } from "~/types/generated";
import { courseModuleKeys } from "./use-course-module";

// =============================================================================
// Query Keys
// =============================================================================

export const sltKeys = {
  all: ["slts"] as const,
  lists: () => [...sltKeys.all, "list"] as const,
  list: (courseNftPolicyId: string, moduleCode: string) =>
    [...sltKeys.lists(), courseNftPolicyId, moduleCode] as const,
  details: () => [...sltKeys.all, "detail"] as const,
  detail: (courseNftPolicyId: string, moduleCode: string, moduleIndex: number) =>
    [...sltKeys.details(), courseNftPolicyId, moduleCode, moduleIndex] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all SLTs for a module
 *
 * @example
 * ```tsx
 * function SLTList({ courseId, moduleCode }: Props) {
 *   const { data: slts, isLoading } = useSLTs(courseId, moduleCode);
 *
 *   return slts?.map(slt => <SLTItem key={slt.id} slt={slt} />);
 * }
 * ```
 */
export function useSLTs(
  courseNftPolicyId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: sltKeys.list(courseNftPolicyId ?? "", moduleCode ?? ""),
    queryFn: async () => {
      // Go API: GET /course/user/slts/{course_id}/{course_module_code}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/slts/${courseNftPolicyId}/${moduleCode}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch SLTs: ${response.statusText}`);
      }

      const result = await response.json() as SLTListResponse | { data?: SLTListResponse };
      // Handle both wrapped { data: [...] } and raw array formats
      if (Array.isArray(result)) {
        return result;
      } else if (result && typeof result === "object" && "data" in result && result.data) {
        console.log("[useSLTs] Response was wrapped, unwrapped:", result.data.length, "SLTs");
        return result.data;
      }
      console.log("[useSLTs] Response has unexpected shape:", result);
      return [] as SLTListResponse;
    },
    enabled: !!courseNftPolicyId && !!moduleCode,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new SLT
 */
export function useCreateSLT() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      sltText,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      sltText: string;
    }) => {
      // Go API: POST /course/teacher/slt/create
      // API requires snake_case: course_id, course_module_code, slt_text
      // Note: index is auto-assigned by the API on create (appends to end)
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_text: sltText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorData.message ?? `Failed to create SLT: ${response.statusText}`);
      }

      return response.json() as Promise<SLTResponse>;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseNftPolicyId, variables.moduleCode),
      });
      // Also invalidate module as it might include SLT counts
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseNftPolicyId,
          variables.moduleCode
        ),
      });
      // Invalidate teacher module list for sidebar updates
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseNftPolicyId),
      });
    },
  });
}

/**
 * Update an SLT
 */
export function useUpdateSLT() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      sltIndex,
      sltText,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      sltIndex: number;
      sltText: string;
    }) => {
      // Go API: POST /course/teacher/slt/update
      // API requires snake_case: course_id, course_module_code, slt_index, slt_text
      // Note: slt_index is 1-based (API v2.0.0+)
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_index: sltIndex,
            slt_text: sltText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorData.message ?? `Failed to update SLT: ${response.statusText}`);
      }

      return response.json() as Promise<SLTResponse>;
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseNftPolicyId, variables.moduleCode),
      });
    },
  });
}

/**
 * Delete an SLT
 */
export function useDeleteSLT() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      sltIndex,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      sltIndex: number;
    }) => {
      // Go API: POST /course/teacher/slt/delete
      // API requires snake_case: course_id, course_module_code, slt_index
      // Note: slt_index is 1-based (API v2.0.0+)
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_index: sltIndex,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorData.message ?? `Failed to delete SLT: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseNftPolicyId, variables.moduleCode),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseNftPolicyId,
          variables.moduleCode
        ),
      });
      // Invalidate teacher module list for sidebar updates
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseNftPolicyId),
      });
    },
  });
}

/**
 * Reorder an SLT (move from old index to new index)
 */
export function useReorderSLT() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      sltIndices,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      /** Array of current SLT indices in the desired new order (1-based) */
      sltIndices: number[];
    }) => {
      // Go API v2.0.0+: POST /api/v2/course/teacher/slts/reorder (batch endpoint)
      // Accepts full list of indices in desired order
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slts/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_indices: sltIndices,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorData.message ?? `Failed to reorder SLTs: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseNftPolicyId, variables.moduleCode),
      });
    },
  });
}
