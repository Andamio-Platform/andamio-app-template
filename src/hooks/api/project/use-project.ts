/**
 * React Query hooks for Project API endpoints
 *
 * Provides cached, deduplicated access to project data across the app.
 * Returns app-level types (Project, Task) - not raw API types.
 *
 * All app-level types and transform functions are colocated here.
 * Components should import types from this file, not from ~/types/generated.
 *
 * @example
 * ```tsx
 * import { useProject, type Project, type Task } from "~/hooks/api/project/use-project";
 *
 * // Get a project by ID - cached across all components
 * const { data: project, isLoading } = useProject(projectId);
 * // project is type Project with flat fields: project.title, project.description
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
// Import directly from gateway.ts to avoid circular dependency with ~/types/generated/index.ts
import type {
  ApiTypesTask,
  ApiTypesProject,
  ApiTypesTaskCommitment,
  MergedHandlersMergedProjectDetailResponse,
  MergedHandlersMergedProjectsResponse,
  MergedHandlersMergedTasksResponse,
  OrchestrationMergedProjectDetail,
  OrchestrationMergedProjectListItem,
  OrchestrationMergedTaskListItem,
  OrchestrationProjectTaskOnChain,
  OrchestrationProjectContributorOnChain,
  OrchestrationProjectSubmissionOnChain,
  OrchestrationProjectAssessmentOnChain,
  OrchestrationProjectTreasuryFundingOnChain,
  OrchestrationProjectCredentialClaimOnChain,
  OrchestrationProjectPrerequisite,
} from "~/types/generated/gateway";

// =============================================================================
// App-Level Types (what components use)
// Uses camelCase following TypeScript conventions and API taxonomy
// =============================================================================

/**
 * Task - flattened task type for components
 * Uses taskHash as primary identifier (content-addressed)
 */
export interface Task {
  // Identity - taskHash is content-addressed, projectId is Cardano policy ID
  taskHash: string;
  projectId: string;
  index?: number;

  // Content (flattened from nested content object)
  title: string;
  description: string;
  imageUrl?: string;
  contentJson?: unknown;

  // Status & metadata (prefixed per taxonomy)
  taskStatus?: string;
  source?: string;
  createdByAlias?: string;

  // Rewards
  lovelaceAmount: string;
  expirationTime?: string;
  expirationPosix?: number;
  tokens?: TaskToken[];

  // Evidence (for commitments)
  taskEvidenceHash?: string;

  // On-chain data
  onChainContent?: string;
  contributorStateId?: string;
}

export interface TaskToken {
  policyId: string;
  assetName: string;
  quantity: number;
}

/**
 * Project - flattened project type for components
 * Uses projectId (Cardano policy ID) as primary identifier
 */
export interface Project {
  // Identity - projectId is Cardano policy ID
  projectId: string;
  source?: string;

  // Content (flattened from nested content object)
  title: string;
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  category?: string;
  isPublic?: boolean;

  // Ownership & management
  owner?: string;
  ownerAlias?: string;
  managers?: string[];

  // Addresses
  projectAddress?: string;
  treasuryAddress?: string;
  contributorStateId?: string;

  // Timestamps
  createdAt?: string;
  createdSlot?: number;
  createdTx?: string;

  // Related data (from merged endpoints)
  tasks?: Task[];
  contributors?: OrchestrationProjectContributorOnChain[];
  submissions?: OrchestrationProjectSubmissionOnChain[];
  assessments?: OrchestrationProjectAssessmentOnChain[];
  treasuryFundings?: OrchestrationProjectTreasuryFundingOnChain[];
  credentialClaims?: OrchestrationProjectCredentialClaimOnChain[];
  prerequisites?: OrchestrationProjectPrerequisite[];

  // Legacy compatibility - states array for project state indicators
  states?: ProjectState[];
}

export interface ProjectState {
  projectStateUtxo?: string;
  projectNftPolicyId?: string;
}

/**
 * TaskCommitment - flattened commitment type for components
 * Uses taskHash (content-addressed) + contributorAddress as composite key
 */
export interface TaskCommitment {
  // Identity - composite key: taskHash + contributorAddress
  taskHash: string;
  projectId: string;

  // Contributor
  contributorAddress: string;
  contributorAlias?: string;

  // Status (prefixed per taxonomy)
  taskCommitmentStatus: string;
  pendingTxHash?: string;

  // Evidence
  taskEvidenceHash?: string;
  evidence?: string;
  evidenceUrl?: string;
  evidenceText?: string;
  notes?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// Transform Functions (API snake_case → App camelCase)
// =============================================================================

/**
 * Transform assets from on-chain format
 */
function transformAssets(assets: unknown): TaskToken[] {
  if (!assets || typeof assets !== "object") return [];

  // Assets can be various formats - handle common ones
  if (Array.isArray(assets)) {
    return assets.map((a) => ({
      policyId: String(a.policy_id ?? a.policyId ?? ""),
      assetName: String(a.asset_name ?? a.assetName ?? ""),
      quantity: Number(a.quantity ?? a.amount ?? 0),
    }));
  }

  // Object format { policyId: { assetName: quantity } }
  const result: TaskToken[] = [];
  for (const [policyId, assetMap] of Object.entries(assets)) {
    if (typeof assetMap === "object" && assetMap !== null) {
      for (const [assetName, quantity] of Object.entries(assetMap as Record<string, unknown>)) {
        result.push({
          policyId,
          assetName,
          quantity: Number(quantity) || 0,
        });
      }
    }
  }
  return result;
}

/**
 * Transform OrchestrationProjectTaskOnChain → Task
 */
export function transformOnChainTask(
  api: OrchestrationProjectTaskOnChain,
  projectId: string
): Task {
  // Try to decode on-chain content as title
  let title = "";
  if (api.on_chain_content) {
    try {
      const bytes = new Uint8Array(
        api.on_chain_content.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? []
      );
      title = new TextDecoder().decode(bytes);
    } catch {
      title = "";
    }
  }

  const taskHash = api.task_id ?? "";
  return {
    taskHash,
    projectId,
    title,
    description: "",
    lovelaceAmount: String(api.lovelace_amount ?? 0),
    expirationTime: api.expiration,
    expirationPosix: api.expiration_posix,
    createdByAlias: api.created_by,
    onChainContent: api.on_chain_content,
    contributorStateId: api.contributor_state_id,
    tokens: api.assets ? transformAssets(api.assets) : undefined,
    taskStatus: "ON_CHAIN",
    source: "on_chain",
  };
}

/**
 * Transform ApiTypesTask → Task
 */
export function transformApiTask(api: ApiTypesTask): Task {
  const title = api.content?.title ?? "";
  const description = api.content?.description ?? "";
  const imageUrl = api.content?.image_url;
  return {
    taskHash: api.task_hash,
    projectId: api.project_id,
    title,
    description,
    imageUrl,
    lovelaceAmount: String(api.lovelace_amount ?? 0),
    expirationTime: api.expiration,
    expirationPosix: api.expiration_posix,
    createdByAlias: api.created_by,
    onChainContent: api.on_chain_content,
    contributorStateId: api.contributor_state_id,
    source: api.source,
  };
}

/**
 * Transform OrchestrationMergedTaskListItem → Task
 *
 * Used for merged endpoint responses that combine on-chain and off-chain data.
 * Note: `task_id` in merged response IS the task_hash (content-addressed).
 */
export function transformMergedTask(api: OrchestrationMergedTaskListItem): Task {
  const title = api.content?.title ?? "";
  const description = api.content?.description ?? "";
  return {
    taskHash: api.task_id ?? "",
    projectId: api.project_id ?? "",
    index: api.content?.task_index,
    title,
    description,
    lovelaceAmount: String(api.lovelace_amount ?? 0),
    expirationTime: api.expiration,
    expirationPosix: api.expiration_posix,
    createdByAlias: api.created_by,
    onChainContent: api.on_chain_content,
    contributorStateId: api.contributor_state_id,
    source: api.source,
  };
}

/**
 * Transform OrchestrationMergedProjectDetail → Project
 */
export function transformProjectDetail(api: OrchestrationMergedProjectDetail): Project {
  // Cast content to access potential extra fields from api_types if present
  const apiContent = api.content as Record<string, unknown> | undefined;
  const title = api.content?.title ?? "";
  const description = api.content?.description ?? "";
  const imageUrl = api.content?.image_url;
  const videoUrl = apiContent?.video_url as string | undefined;
  const category = apiContent?.category as string | undefined;
  const isPublic = apiContent?.is_public as boolean | undefined;
  return {
    projectId: api.project_id ?? "",
    source: api.source,
    title,
    description,
    imageUrl,
    videoUrl,
    category,
    isPublic,
    owner: api.owner,
    ownerAlias: api.owner,
    managers: api.managers,
    treasuryAddress: api.treasury_address,
    contributorStateId: api.contributor_state_id,
    tasks: api.tasks?.map((t) => transformOnChainTask(t, api.project_id ?? "")),
    contributors: api.contributors,
    submissions: api.submissions,
    assessments: api.assessments,
    treasuryFundings: api.treasury_fundings,
    credentialClaims: api.credential_claims,
    prerequisites: api.prerequisites,
  };
}

/**
 * Transform OrchestrationMergedProjectListItem → Project
 */
export function transformProjectListItem(api: OrchestrationMergedProjectListItem): Project {
  // Cast content to access potential extra fields from api_types if present
  const apiContent = api.content as Record<string, unknown> | undefined;
  const title = api.content?.title ?? "";
  const description = api.content?.description ?? "";
  const imageUrl = api.content?.image_url;
  const videoUrl = apiContent?.video_url as string | undefined;
  const category = apiContent?.category as string | undefined;
  const isPublic = apiContent?.is_public as boolean | undefined;
  return {
    projectId: api.project_id ?? "",
    source: api.source,
    title,
    description,
    imageUrl,
    videoUrl,
    category,
    isPublic,
    owner: api.owner,
    ownerAlias: api.owner,
    managers: api.managers,
    projectAddress: api.project_address,
    treasuryAddress: api.treasury_address,
    contributorStateId: api.contributor_state_id,
    createdAt: api.created_at,
    createdSlot: api.created_slot,
    createdTx: api.created_tx,
    prerequisites: api.prerequisites,
  };
}

/**
 * Transform ApiTypesProject → Project
 */
export function transformApiProject(api: ApiTypesProject): Project {
  const title = api.content?.title ?? "";
  const description = api.content?.description ?? "";
  const imageUrl = api.content?.image_url;
  const videoUrl = api.content?.video_url;
  const category = api.content?.category;
  const isPublic = api.content?.is_public;
  return {
    projectId: api.project_id,
    source: api.source,
    title,
    description,
    imageUrl,
    videoUrl,
    category,
    isPublic,
    owner: api.owner,
    ownerAlias: api.owner,
    managers: api.managers,
    projectAddress: api.project_address,
    treasuryAddress: api.treasury_address,
    contributorStateId: api.contributor_state_id,
    createdAt: api.created_at,
    createdSlot: api.created_slot,
    createdTx: api.created_tx,
  };
}

/**
 * Transform ApiTypesTaskCommitment → TaskCommitment
 */
export function transformApiCommitment(api: ApiTypesTaskCommitment): TaskCommitment {
  return {
    taskHash: api.task_hash,
    projectId: api.project_id,
    contributorAddress: api.contributor_address,
    taskCommitmentStatus: api.task_commitment_status ?? "unknown",
    taskEvidenceHash: api.task_evidence_hash,
    evidence: api.content?.evidence_url,
    evidenceUrl: api.content?.evidence_url,
    notes: api.content?.notes,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

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
 * Uses: GET /api/v2/project/user/project/{project_id}
 *
 * @param projectId - Project NFT Policy ID
 * @returns Project with flat fields (title, description, etc.)
 */
export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectKeys.detail(projectId ?? ""),
    queryFn: async (): Promise<Project | null> => {
      const response = await fetch(
        `/api/gateway/api/v2/project/user/project/${projectId}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const result = (await response.json()) as MergedHandlersMergedProjectDetailResponse;

      if (result.warning) {
        console.warn("[useProject] API warning:", result.warning);
      }

      if (!result.data) return null;

      return transformProjectDetail(result.data);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });
}

/**
 * Fetch raw project data without transformation
 * Use this when you need the original API response structure
 */
export function useProjectRaw(projectId: string | undefined) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId ?? ""), "raw"] as const,
    queryFn: async (): Promise<OrchestrationMergedProjectDetail | null> => {
      const response = await fetch(
        `/api/gateway/api/v2/project/user/project/${projectId}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const result = (await response.json()) as MergedHandlersMergedProjectDetailResponse;

      if (result.warning) {
        console.warn("[useProjectRaw] API warning:", result.warning);
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
 * @returns Project[] with flat fields
 */
export function useProjects() {
  return useQuery({
    queryKey: projectKeys.published(),
    queryFn: async (): Promise<Project[]> => {
      const response = await fetch(
        `/api/gateway/api/v2/project/user/projects/list`
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | MergedHandlersMergedProjectsResponse
        | OrchestrationMergedProjectListItem[];

      // Handle both wrapped { data: [...] } and raw array formats
      let items: OrchestrationMergedProjectListItem[];

      if (Array.isArray(result)) {
        // Legacy/raw array format
        items = result;
      } else {
        // Wrapped format with data property
        if (result.warning) {
          console.warn("[useProjects] API warning:", result.warning);
        }
        items = result.data ?? [];
      }

      return items.map(transformProjectListItem);
    },
    staleTime: 60 * 1000,
  });
}

/**
 * Fetch tasks for a project
 *
 * Uses: POST /api/v2/project/user/tasks/list with { project_id }
 * Returns Task[] with flat camelCase fields
 *
 * @param projectId - Project NFT Policy ID (the project_state_policy_id)
 */
export function useProjectTasks(projectId: string | undefined) {
  return useQuery({
    queryKey: [...projectKeys.detail(projectId ?? ""), "tasks"] as const,
    queryFn: async (): Promise<Task[]> => {
      const response = await fetch(
        `/api/gateway/api/v2/project/user/tasks/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId }),
        }
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch tasks: ${response.statusText}`);
      }

      const result = (await response.json()) as
        | MergedHandlersMergedTasksResponse
        | OrchestrationMergedTaskListItem[];

      // Handle both wrapped { data: [...] } and raw array formats
      let items: OrchestrationMergedTaskListItem[];

      if (Array.isArray(result)) {
        items = result;
      } else {
        if (result.warning) {
          console.warn("[useProjectTasks] API warning:", result.warning);
        }
        items = result.data ?? [];
      }

      return items.map(transformMergedTask);
    },
    enabled: !!projectId,
    staleTime: 30 * 1000,
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
