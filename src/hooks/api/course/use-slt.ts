/**
 * React Query hooks for SLT (Student Learning Target) API endpoints
 *
 * SLT types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides standalone SLT CRUD operations.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { type SLT, transformSLT, courseModuleKeys } from "./use-course-module";

// =============================================================================
// Query Keys
// =============================================================================

export const sltKeys = {
  all: ["slts"] as const,
  lists: () => [...sltKeys.all, "list"] as const,
  list: (courseId: string, moduleCode: string) =>
    [...sltKeys.lists(), courseId, moduleCode] as const,
  details: () => [...sltKeys.all, "detail"] as const,
  detail: (courseId: string, moduleCode: string, moduleIndex: number) =>
    [...sltKeys.details(), courseId, moduleCode, moduleIndex] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all SLTs for a module
 *
 * @returns SLT[] with camelCase fields (sltText, moduleIndex, etc.)
 *
 * Handles both V1 and V2 API response formats:
 * - V1: Array or { data: [...] }
 * - V2: { data: { slts: [...], slt_hash, created_by, source } }
 *
 * @example
 * ```tsx
 * function SLTList({ courseId, moduleCode }: Props) {
 *   const { data: slts, isLoading } = useSLTs(courseId, moduleCode);
 *
 *   return slts?.map(slt => (
 *     <div key={slt.moduleIndex}>{slt.sltText}</div>
 *   ));
 * }
 * ```
 */
export function useSLTs(
  courseId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery<SLT[], Error>({
    queryKey: sltKeys.list(courseId ?? "", moduleCode ?? ""),
    queryFn: async () => {
      // Endpoint: GET /course/user/slts/{course_id}/{course_module_code}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/slts/${courseId}/${moduleCode}`
      );

      // 404 means module not on-chain (V2) or doesn't exist
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch SLTs: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      // Handle multiple response formats
      let rawSlts: unknown[];

      if (Array.isArray(result)) {
        // Raw array format
        rawSlts = result;
      } else if (result && typeof result === "object" && "data" in result) {
        const dataValue = (result as { data?: unknown }).data;

        if (Array.isArray(dataValue)) {
          // V1 format: { data: [...] }
          rawSlts = dataValue;
        } else if (dataValue && typeof dataValue === "object" && "slts" in dataValue) {
          // V2 format: { data: { slts: [...], slt_hash, created_by, source } }
          const sltsValue = (dataValue as { slts?: unknown }).slts;
          rawSlts = Array.isArray(sltsValue) ? sltsValue : [];
        } else {
          rawSlts = [];
        }
      } else {
        rawSlts = [];
      }

      return rawSlts.map((raw) => transformSLT(raw as Record<string, unknown>));
    },
    staleTime: 30 * 1000,
    enabled: !!courseId && !!moduleCode,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new SLT
 *
 * @returns The created SLT with camelCase fields
 */
export function useCreateSLT() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      sltText,
    }: {
      courseId: string;
      moduleCode: string;
      sltText: string;
    }): Promise<SLT> => {
      // Endpoint: POST /course/teacher/slt/create
      // Note: index is auto-assigned by the API on create (appends to end)
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            slt_text: sltText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to create SLT: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformSLT(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseId, variables.moduleCode),
      });
      // Also invalidate module as it might include SLT counts
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Invalidate teacher module list for sidebar updates
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}

/**
 * Update an SLT
 *
 * @returns The updated SLT with camelCase fields
 */
export function useUpdateSLT() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      sltIndex,
      sltText,
    }: {
      courseId: string;
      moduleCode: string;
      sltIndex: number;
      sltText: string;
    }): Promise<SLT> => {
      // Endpoint: POST /course/teacher/slt/update
      // Note: slt_index is 1-based
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            slt_index: sltIndex,
            slt_text: sltText,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to update SLT: ${response.statusText}`
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;
      return transformSLT(raw);
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseId, variables.moduleCode),
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
      courseId,
      moduleCode,
      sltIndex,
    }: {
      courseId: string;
      moduleCode: string;
      sltIndex: number;
    }): Promise<void> => {
      // Endpoint: POST /course/teacher/slt/delete
      // Note: slt_index is 1-based
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/delete`,
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
          errorData.message ?? `Failed to delete SLT: ${response.statusText}`
        );
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseId, variables.moduleCode),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(variables.courseId, variables.moduleCode),
      });
      // Invalidate teacher module list for sidebar updates
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseId),
      });
    },
  });
}

/**
 * Reorder SLTs (batch operation)
 *
 * @param sltIndices - Array of current SLT indices in the desired new order (1-based)
 */
export function useReorderSLT() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseId,
      moduleCode,
      sltIndices,
    }: {
      courseId: string;
      moduleCode: string;
      sltIndices: number[];
    }): Promise<void> => {
      // Endpoint: POST /course/teacher/slts/reorder
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slts/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            course_module_code: moduleCode,
            slt_indices: sltIndices,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as {
          message?: string;
        };
        throw new Error(
          errorData.message ?? `Failed to reorder SLTs: ${response.statusText}`
        );
      }
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sltKeys.list(variables.courseId, variables.moduleCode),
      });
    },
  });
}
