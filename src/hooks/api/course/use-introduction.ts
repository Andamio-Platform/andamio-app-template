/**
 * React Query hooks for Introduction API endpoints
 *
 * Introduction types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides the Introduction query hook for reading introductions.
 *
 * DEPRECATED MUTATIONS:
 * The following mutation hooks have been removed as of v2.0.0:
 * - useCreateIntroduction, useUpdateIntroduction, useDeleteIntroduction
 *
 * All Introduction modifications should now go through the aggregate-update endpoint
 * via the module draft store (useModuleDraft hook).
 */

import { useQuery } from "@tanstack/react-query";
import { type Introduction, transformIntroduction, introductionKeys } from "./use-course-module";

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

