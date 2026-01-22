/**
 * React Query hooks for SLT (Student Learning Target) API endpoints
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
      // Go API: GET /course/user/slts/list/{policy_id}/{module_code}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/slts/list/${courseNftPolicyId}/${moduleCode}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch SLTs: ${response.statusText}`);
      }

      return response.json() as Promise<SLTListResponse>;
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
      moduleIndex: _moduleIndex,
      sltText,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      moduleIndex: number;
      sltText: string;
    }) => {
      // Go API: POST /course/teacher/slt/create
      // API requires camelCase: policyId, moduleCode, sltText
      // Note: moduleIndex is auto-assigned by the API on create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policyId: courseNftPolicyId,
            moduleCode,
            sltText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create SLT: ${response.statusText}`);
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
      moduleIndex,
      sltText,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      moduleIndex: number;
      sltText: string;
    }) => {
      // Go API: POST /course/teacher/slt/update
      // API requires camelCase: policyId, moduleCode, moduleIndex, sltText
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policyId: courseNftPolicyId,
            moduleCode,
            moduleIndex,
            sltText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update SLT: ${response.statusText}`);
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
      moduleIndex,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      moduleIndex: number;
    }) => {
      // Go API: POST /course/teacher/slt/delete
      // API requires camelCase: policyId, moduleCode, moduleIndex
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policyId: courseNftPolicyId,
            moduleCode,
            moduleIndex,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete SLT: ${response.statusText}`);
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
    },
  });
}
