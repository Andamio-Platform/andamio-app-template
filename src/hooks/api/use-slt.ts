/**
 * React Query hooks for SLT (Student Learning Target) API endpoints
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { type SLTListResponse, type SLTResponse } from "@andamio/db-api-types";
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
      // Go API: GET /course/public/slts/list/{policy_id}/{module_code}
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/slts/list/${courseNftPolicyId}/${moduleCode}`
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
      moduleIndex,
      sltText,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      moduleIndex: number;
      sltText: string;
    }) => {
      // Go API: POST /course/teacher/slt/create
      // API expects "policy_id" not "course_nft_policy_id"
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/teacher/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
            slt_text: sltText,
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
      // API expects "policy_id" not "course_nft_policy_id"
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/teacher/slt/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
            slt_text: sltText,
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
      // API expects "policy_id" not "course_nft_policy_id"
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/teacher/slt/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
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
