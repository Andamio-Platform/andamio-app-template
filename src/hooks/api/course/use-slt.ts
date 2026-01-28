/**
 * React Query hooks for SLT (Student Learning Target) API endpoints
 *
 * SLT types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides the SLT query hook for reading SLTs.
 *
 * DEPRECATED MUTATIONS:
 * The following mutation hooks have been removed as of v2.0.0:
 * - useCreateSLT, useUpdateSLT, useDeleteSLT, useReorderSLT
 *
 * All SLT modifications should now go through the aggregate-update endpoint
 * via the module draft store (useModuleDraft hook).
 */

import { useQuery } from "@tanstack/react-query";
import { type SLT, transformSLT } from "./use-course-module";

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

