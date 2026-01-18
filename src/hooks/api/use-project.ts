/**
 * React Query hooks for Project API endpoints
 *
 * Provides cached, deduplicated access to project data across the app.
 *
 * @example
 * ```tsx
 * // Get a project by ID - cached across all components
 * const { data: project, isLoading } = useProject(projectId);
 *
 * // List all published projects
 * const { data: projects } = useProjects();
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type OrchestrationMergedProjectDetail,
  type OrchestrationMergedProjectListItem,
  type MergedHandlersMergedProjectDetailResponse,
  type MergedHandlersMergedProjectsResponse,
} from "~/types/generated";

// =============================================================================
// Query Keys
// =============================================================================

export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  published: () => [...projectKeys.all, "published"] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (projectId: string) => [...projectKeys.details(), projectId] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch a single project by ID (merged endpoint)
 *
 * Returns both on-chain data (tasks, contributors) and off-chain content.
 * Uses: GET /api/v2/project/user/project/get/{project_id}
 *
 * @param projectId - Project NFT Policy ID
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: async (): Promise<OrchestrationMergedProjectDetail | null> => {
      const response = await fetch(
        `/api/gateway/api/v2/project/user/project/get/${projectId}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersMergedProjectDetailResponse;

      if (result.warning) {
        console.warn("[useProject] API warning:", result.warning);
      }

      return result.data ?? null;
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch all published projects (merged endpoint)
 *
 * Uses: GET /api/v2/project/user/projects/list
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.published(),
    queryFn: async (): Promise<OrchestrationMergedProjectListItem[]> => {
      const response = await fetch(
        `/api/gateway/api/v2/project/user/projects/list`
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersMergedProjectsResponse;

      if (result.warning) {
        console.warn("[useProjects] API warning:", result.warning);
      }

      return result.data ?? [];
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to invalidate project cache
 */
export function useInvalidateProjects() {
  const queryClient = useQueryClient();

  return {
    project: async (projectId: string) => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.detail(projectId),
      });
    },
    all: async () => {
      await queryClient.invalidateQueries({
        queryKey: projectKeys.all,
      });
    },
  };
}
