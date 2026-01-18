/**
 * React Query hooks for Contributor Project API endpoints
 *
 * Provides cached access to projects the authenticated user is contributing to.
 * Uses the merged endpoint that returns both on-chain and DB data.
 *
 * @example
 * ```tsx
 * function MyContributions() {
 *   const { data, isLoading } = useContributorProjects();
 *
 *   return data?.map(project => (
 *     <ProjectCard key={project.project_id} project={project} />
 *   ));
 * }
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";

// =============================================================================
// Query Keys
// =============================================================================

export const contributorProjectKeys = {
  all: ["contributor-projects"] as const,
  list: () => [...contributorProjectKeys.all, "list"] as const,
  commitments: () => [...contributorProjectKeys.all, "commitments"] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Contributor project item from merged API endpoint
 * Contains both on-chain contribution status and off-chain content
 */
export interface ContributorProject {
  // On-chain fields
  project_id: string;
  project_address?: string;
  admin?: string;
  managers?: string[];

  // Contribution status
  is_contributor?: boolean;
  tasks_completed?: number;
  tasks_pending?: number;
  total_tasks?: number;
  credentials_earned?: number;

  // Off-chain content
  title?: string;
  description?: string;
  image_url?: string;

  // Metadata
  source?: string; // "merged" | "on-chain-only" | "db-only"
}

export type ContributorProjectsResponse = ContributorProject[];

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch projects the authenticated user is contributing to
 *
 * Uses merged endpoint: POST /api/v2/project/contributor/projects/list
 * Returns projects with both on-chain contribution status and DB content.
 *
 * NOTE: This endpoint may not be implemented yet. The hook will return
 * an empty array if the endpoint returns 404.
 *
 * @example
 * ```tsx
 * function ContributingProjects() {
 *   const { data: projects, isLoading, error, refetch } = useContributorProjects();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!projects?.length) return <EmptyState />;
 *
 *   return <ProjectList projects={projects} />;
 * }
 * ```
 */
export function useContributorProjects() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: contributorProjectKeys.list(),
    queryFn: async (): Promise<ContributorProjectsResponse> => {
      // Merged endpoint: POST /api/v2/project/contributor/projects/list
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/contributor/projects/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no contributing projects or endpoint not implemented - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch contributor projects: ${response.statusText}`);
      }

      const result = await response.json() as { data?: ContributorProject[]; warning?: string };

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useContributorProjects] API warning:", result.warning);
      }

      return result.data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to invalidate contributor projects cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateContributorProjects();
 *
 * // After joining a new project
 * await invalidate();
 * ```
 */
export function useInvalidateContributorProjects() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: contributorProjectKeys.all,
    });
  };
}
