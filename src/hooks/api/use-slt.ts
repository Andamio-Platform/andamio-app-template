/**
 * React Query hooks for SLT (Student Learning Target) API endpoints
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { type ListSLTsOutput, type SLTOutput } from "@andamio/db-api";
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
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/list`,
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
        throw new Error(`Failed to fetch SLTs: ${response.statusText}`);
      }

      return response.json() as Promise<ListSLTsOutput>;
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
            slt_text: sltText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create SLT: ${response.statusText}`);
      }

      return response.json() as Promise<SLTOutput>;
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/update`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
            slt_text: sltText,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update SLT: ${response.statusText}`);
      }

      return response.json() as Promise<SLTOutput>;
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/delete`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
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
