/**
 * React Query hooks for Manager Project API endpoints
 *
 * Provides cached access to projects the authenticated user manages.
 * Uses the merged endpoint that returns both on-chain and DB data.
 *
 * @example
 * ```tsx
 * function ManagerStudio() {
 *   const { data, isLoading } = useManagerProjects();
 *
 *   return data?.map(project => (
 *     <ProjectCard key={project.project_id} project={project} />
 *   ));
 * }
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";

// =============================================================================
// Query Keys
// =============================================================================

export const projectManagerKeys = {
  all: ["manager-projects"] as const,
  list: () => [...projectManagerKeys.all, "list"] as const,
  commitments: (projectId?: string) =>
    [...projectManagerKeys.all, "commitments", projectId] as const,
};

// =============================================================================
// Types
// =============================================================================

/**
 * Manager project item from merged API endpoint
 * Contains both on-chain and off-chain data
 */
export interface ManagerProject {
  // On-chain fields
  project_id: string;
  project_address?: string;
  admin?: string;
  managers?: string[];
  created_tx?: string;
  created_slot?: number;

  // Off-chain content (nested under "content" from API)
  content?: {
    title?: string;
    description?: string;
    image_url?: string;
  };

  // Flattened accessors for backwards compatibility
  title?: string;
  description?: string;
  image_url?: string;

  // Metadata
  source?: string; // "merged" | "chain_only" | "db_only"
}

export type ManagerProjectsResponse = ManagerProject[];

/**
 * Manager commitment item from merged API endpoint
 * Contains pending task submissions awaiting manager assessment
 */
export interface ManagerCommitment {
  // Identifiers
  project_id: string;
  task_id: string;
  contributor_alias: string;

  // On-chain submission info
  submission_tx_hash?: string;
  submission_slot?: number;
  on_chain_content?: string;

  // Off-chain content (contributor's evidence)
  content?: {
    evidence_url?: string;
    evidence_text?: string;
    submitted_at?: string;
  };

  // Task context
  task?: {
    lovelace?: number;
    expiration?: string;
    expiration_posix?: number;
  };

  // Metadata
  source?: string; // "merged" | "chain_only" | "db-only"
}

export type ManagerCommitmentsResponse = ManagerCommitment[];

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch projects the authenticated user manages
 *
 * Uses merged endpoint: POST /api/v2/project/manager/projects/list
 * Returns projects with both on-chain state and DB content.
 *
 * NOTE: This endpoint may not be implemented yet. The hook will return
 * an empty array if the endpoint returns 404.
 *
 * @example
 * ```tsx
 * function ProjectStudio() {
 *   const { data: projects, isLoading, error, refetch } = useManagerProjects();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!projects?.length) return <EmptyState />;
 *
 *   return <ProjectList projects={projects} />;
 * }
 * ```
 */
export function useManagerProjects() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectManagerKeys.list(),
    queryFn: async (): Promise<ManagerProjectsResponse> => {
      // Merged endpoint: POST /api/v2/project/manager/projects/list
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/projects/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no projects or endpoint not implemented - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch manager projects: ${response.statusText}`);
      }

      const result = await response.json() as { data?: ManagerProject[]; warning?: string };

      // Debug: log the full response
      console.log("[useManagerProjects] API response:", JSON.stringify(result, null, 2));

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useManagerProjects] API warning:", result.warning);
      }

      // Flatten content fields for backwards compatibility with UI
      const projects = (result.data ?? []).map((project) => ({
        ...project,
        // Flatten content.* to top level for UI components
        title: project.content?.title ?? project.title,
        description: project.content?.description ?? project.description,
        image_url: project.content?.image_url ?? project.image_url,
      }));

      return projects;
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch pending task commitments for a manager
 *
 * Uses merged endpoint: POST /api/v2/project/manager/commitments/list
 * Returns pending task submissions awaiting assessment.
 *
 * @param projectId - Optional project ID to filter commitments
 *
 * @example
 * ```tsx
 * function PendingReviews() {
 *   const { data: commitments, isLoading, error, refetch } = useManagerCommitments();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!commitments?.length) return <AllCaughtUp />;
 *
 *   return <CommitmentList commitments={commitments} />;
 * }
 * ```
 */
export function useManagerCommitments(projectId?: string) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectManagerKeys.commitments(projectId),
    queryFn: async (): Promise<ManagerCommitmentsResponse> => {
      // Merged endpoint: POST /api/v2/project/manager/commitments/list
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(projectId ? { project_id: projectId } : {}),
        }
      );

      // 404 means no commitments - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch manager commitments: ${response.statusText}`);
      }

      const result = (await response.json()) as {
        data?: ManagerCommitment[];
        warning?: string;
      };

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useManagerCommitments] API warning:", result.warning);
      }

      return result.data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to invalidate manager projects cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateManagerProjects();
 *
 * // After creating a new project
 * await invalidate();
 * ```
 */
export function useInvalidateManagerProjects() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: projectManagerKeys.all,
    });
  };
}
