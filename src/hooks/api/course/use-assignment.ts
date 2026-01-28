/**
 * React Query hooks for Assignment API endpoints
 *
 * Assignment types and transforms are defined in use-course-module.ts (the owner file).
 * This file provides the Assignment query hook for reading assignments.
 *
 * DEPRECATED MUTATIONS:
 * The following mutation hooks have been removed as of v2.0.0:
 * - useCreateAssignment, useUpdateAssignment, useDeleteAssignment
 *
 * All Assignment modifications should now go through the aggregate-update endpoint
 * via the module draft store (useModuleDraft hook).
 */

import { useQuery } from "@tanstack/react-query";
import { type Assignment, transformAssignment, assignmentKeys } from "./use-course-module";

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch an assignment for a specific module
 *
 * @returns Assignment with camelCase fields, or null if no assignment exists
 *
 * Handles both V1 and V2 API response formats:
 * - V1: Various nested formats with assignment content at different levels
 * - V2: { data: { course_id, slt_hash, created_by, content: {...}, source } }
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

      // 404 means no assignment exists for this module (or module not on-chain in V2)
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch assignment: ${response.statusText}`);
      }

      const result = (await response.json()) as unknown;

      const asRecord = (value: unknown): Record<string, unknown> | null =>
        value && typeof value === "object" ? (value as Record<string, unknown>) : null;

      // Handle wrapped and nested formats
      let raw: Record<string, unknown> | null = null;
      const resultRecord = asRecord(result);
      if (resultRecord) {
        if ("data" in resultRecord && resultRecord.data) {
          const dataRecord = asRecord(resultRecord.data);
          if (dataRecord) {
            // V2 format: data has top-level fields (slt_hash, created_by, content, source)
            // Check if this is V2 format by looking for `content` with nested fields
            if ("content" in dataRecord && dataRecord.content && typeof dataRecord.content === "object") {
              // V2 format - pass the whole data object to transform (it handles nested content)
              raw = dataRecord;
            } else if ("assignment" in dataRecord && dataRecord.assignment) {
              raw = asRecord(dataRecord.assignment);
            } else if ("data" in dataRecord && dataRecord.data) {
              const innerRecord = asRecord(dataRecord.data);
              if (innerRecord && "assignment" in innerRecord && innerRecord.assignment) {
                raw = asRecord(innerRecord.assignment);
              } else {
                raw = innerRecord;
              }
            } else {
              raw = dataRecord;
            }
          }
        } else if ("assignment" in resultRecord && resultRecord.assignment) {
          raw = asRecord(resultRecord.assignment);
        } else if (
          "title" in resultRecord ||
          "content_json" in resultRecord ||
          "assignment_content" in resultRecord ||
          "content" in resultRecord
        ) {
          raw = resultRecord;
        }
      }

      return raw ? transformAssignment(raw) : null;
    },
    staleTime: 30 * 1000,
    enabled: !!courseId && !!moduleCode,
  });
}

