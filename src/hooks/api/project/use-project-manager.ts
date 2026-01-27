/**
 * React Query hooks for Manager Project API endpoints
 *
 * Manager hooks handle project management operations:
 * - Listing managed projects
 * - Viewing pending task assessments
 * - Managing tasks (create, update, delete)
 *
 * Architecture: Role-based hook file
 * - Imports types and transforms from use-project.ts (entity file)
 * - Exports manager-specific query keys and hooks
 *
 * @example
 * ```tsx
 * import { useManagerProjects, type ManagerProject } from "~/hooks/api/project/use-project-manager";
 *
 * function ManagerStudio() {
 *   const { data: projects, isLoading } = useManagerProjects();
 *
 *   return projects?.map(project => (
 *     <ProjectCard key={project.projectId} project={project} />
 *   ));
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type {
  MergedHandlersManagerProjectsResponse,
  MergedHandlersManagerCommitmentsResponse,
  MergedHandlersMergedTasksResponse,
  OrchestrationManagerProjectListItem,
  OrchestrationManagerCommitmentItem,
  OrchestrationMergedTaskListItem,
  OrchestrationPendingAssessmentSummary,
} from "~/types/generated/gateway";
import {
  projectKeys,
  getProjectStatusFromSource,
  transformMergedTask,
  type ProjectStatus,
  type Task,
  type ProjectPrerequisite,
} from "./use-project";

// =============================================================================
// Query Keys
// =============================================================================

/**
 * Query keys for manager project operations
 * Extends the base projectKeys for cache invalidation
 */
export const projectManagerKeys = {
  all: ["manager-projects"] as const,
  list: () => [...projectManagerKeys.all, "list"] as const,
  commitments: (projectId?: string) =>
    [...projectManagerKeys.all, "commitments", projectId] as const,
  tasks: (projectId: string) =>
    [...projectManagerKeys.all, "tasks", projectId] as const,
};

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Pending assessment summary with camelCase fields
 */
export interface PendingAssessment {
  taskId: string;
  submittedBy: string;
  submissionTx?: string;
  onChainContent?: string;
}

/**
 * Manager project item with camelCase fields
 * Contains both on-chain and off-chain data
 */
export interface ManagerProject {
  // Identity
  projectId: string;
  status: ProjectStatus;

  // Content (flattened from content.*)
  title: string;
  description?: string;
  imageUrl?: string;

  // On-chain fields
  projectAddress?: string;
  treasuryAddress?: string;
  contributorStateId?: string;
  owner?: string;
  managers?: string[];
  createdTx?: string;
  createdSlot?: number;
  createdAt?: string;

  // Prerequisites
  prerequisites?: ProjectPrerequisite[];

  // Manager-specific: pending assessments
  pendingAssessments?: PendingAssessment[];
}

/**
 * Task context info from manager commitment
 */
export interface ManagerCommitmentTaskInfo {
  lovelaceAmount?: number;
  expirationTime?: string;
  expirationPosix?: number;
  onChainContent?: string;
  assets?: unknown;
}

/**
 * Manager commitment item with camelCase fields
 * Contains pending task submissions awaiting manager assessment
 */
export interface ManagerCommitment {
  // Identifiers
  projectId: string;
  taskId: string;
  submittedBy: string;

  // On-chain submission info
  submissionTx?: string;
  onChainContent?: string;

  // Off-chain content (contributor's evidence)
  commitmentStatus?: string;
  taskEvidenceHash?: string;
  evidence?: unknown;
  assessedBy?: string;
  taskOutcome?: string;

  // Task context
  task?: ManagerCommitmentTaskInfo;

  // Metadata
  status: ProjectStatus;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform OrchestrationPendingAssessmentSummary → PendingAssessment
 */
function transformPendingAssessment(
  api: OrchestrationPendingAssessmentSummary
): PendingAssessment {
  return {
    taskId: api.task_id ?? "",
    submittedBy: api.submitted_by ?? "",
    submissionTx: api.submission_tx,
    onChainContent: api.on_chain_content,
  };
}

/**
 * Transform OrchestrationManagerProjectListItem → ManagerProject
 */
function transformManagerProject(api: OrchestrationManagerProjectListItem): ManagerProject {
  return {
    // Identity
    projectId: api.project_id ?? "",
    status: getProjectStatusFromSource(api.source),

    // Flattened content fields
    title: api.content?.title ?? "",
    description: api.content?.description,
    imageUrl: api.content?.image_url,

    // On-chain fields
    projectAddress: api.project_address,
    treasuryAddress: api.treasury_address,
    contributorStateId: api.contributor_state_id,
    owner: api.owner,
    managers: api.managers,
    createdTx: api.created_tx,
    createdSlot: api.created_slot,
    createdAt: api.created_at,

    // Prerequisites
    prerequisites: api.prerequisites?.map((p) => ({
      courseId: p.course_id ?? "",
      sltHashes: p.slt_hashes,
    })),

    // Manager-specific
    pendingAssessments: api.pending_assessments?.map(transformPendingAssessment),
  };
}

/**
 * Transform OrchestrationManagerCommitmentItem → ManagerCommitment
 */
function transformManagerCommitment(api: OrchestrationManagerCommitmentItem): ManagerCommitment {
  return {
    // Identifiers
    projectId: api.project_id ?? "",
    taskId: api.task_id ?? "",
    submittedBy: api.submitted_by ?? "",

    // On-chain submission info
    submissionTx: api.submission_tx,
    onChainContent: api.on_chain_content,

    // Off-chain content
    commitmentStatus: api.content?.commitment_status,
    taskEvidenceHash: api.content?.task_evidence_hash,
    evidence: api.content?.evidence,
    assessedBy: api.content?.assessed_by,
    taskOutcome: api.content?.task_outcome,

    // Task context
    task: api.task
      ? {
          lovelaceAmount: api.task.lovelace_amount,
          expirationTime: api.task.expiration,
          expirationPosix: api.task.expiration_posix,
          onChainContent: api.task.on_chain_content,
          assets: api.task.assets,
        }
      : undefined,

    // Metadata
    status: getProjectStatusFromSource(api.source),
  };
}

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch projects the authenticated user manages
 *
 * Uses merged endpoint: POST /api/v2/project/manager/projects/list
 * Returns projects with both on-chain state and DB content.
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
    queryFn: async (): Promise<ManagerProject[]> => {
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

      const result = (await response.json()) as MergedHandlersManagerProjectsResponse;

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useManagerProjects] API warning:", result.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformManagerProject);
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
    queryFn: async (): Promise<ManagerCommitment[]> => {
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

      const result = (await response.json()) as MergedHandlersManagerCommitmentsResponse;

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useManagerCommitments] API warning:", result.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformManagerCommitment);
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch tasks for a managed project
 *
 * Uses: GET /api/v2/project/manager/tasks/{project_state_policy_id}
 * Returns Task[] with flat camelCase fields
 *
 * @param projectId - Project NFT Policy ID
 *
 * @example
 * ```tsx
 * function ManagerTaskList({ projectId }: { projectId: string }) {
 *   const { data: tasks, isLoading } = useManagerTasks(projectId);
 *
 *   if (isLoading) return <Skeleton />;
 *
 *   return tasks?.map(task => (
 *     <TaskEditor key={task.taskHash} task={task} />
 *   ));
 * }
 * ```
 */
export function useManagerTasks(projectId: string | undefined) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: projectManagerKeys.tasks(projectId ?? ""),
    queryFn: async (): Promise<Task[]> => {
      // GET endpoint with project ID in path
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/tasks/${projectId}`
      );

      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch manager tasks: ${response.statusText}`);
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
          console.warn("[useManagerTasks] API warning:", result.warning);
        }
        items = result.data ?? [];
      }

      return items.map(transformMergedTask);
    },
    enabled: !!projectId && isAuthenticated,
    staleTime: 30 * 1000,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new task in a project
 *
 * @example
 * ```tsx
 * function CreateTaskForm({ projectId }: { projectId: string }) {
 *   const createTask = useCreateTask();
 *
 *   const handleSubmit = async (data: TaskFormData) => {
 *     await createTask.mutateAsync({
 *       projectId,
 *       title: data.title,
 *       description: data.description,
 *       lovelaceAmount: data.reward,
 *       expirationPosix: data.deadline,
 *     });
 *     toast.success("Task created!");
 *   };
 *
 *   return <TaskForm onSubmit={handleSubmit} isLoading={createTask.isPending} />;
 * }
 * ```
 */
export function useCreateTask() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (input: {
      projectId: string;
      title: string;
      description?: string;
      lovelaceAmount?: number;
      expirationPosix?: number;
    }) => {
      // Endpoint: POST /project/manager/task/create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/task/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: input.projectId,
            title: input.title,
            description: input.description,
            lovelace_amount: input.lovelaceAmount,
            expiration_posix: input.expirationPosix,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create task: ${response.statusText} - ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate manager tasks for this project
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.tasks(variables.projectId),
      });
      // Invalidate public tasks
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(variables.projectId),
      });
      // Invalidate project detail (task counts may have changed)
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
  });
}

/**
 * Update an existing task
 *
 * @example
 * ```tsx
 * function EditTaskForm({ task }: { task: Task }) {
 *   const updateTask = useUpdateTask();
 *
 *   const handleSubmit = async (data: TaskFormData) => {
 *     await updateTask.mutateAsync({
 *       projectId: task.projectId,
 *       taskHash: task.taskHash,
 *       data: {
 *         title: data.title,
 *         description: data.description,
 *       },
 *     });
 *     toast.success("Task updated!");
 *   };
 *
 *   return <TaskForm task={task} onSubmit={handleSubmit} isLoading={updateTask.isPending} />;
 * }
 * ```
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskHash,
      data,
    }: {
      projectId: string;
      taskHash: string;
      data: Partial<{
        title: string;
        description: string;
        lovelaceAmount: number;
        expirationPosix: number;
      }>;
    }) => {
      // Endpoint: POST /project/manager/task/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/task/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            task_hash: taskHash,
            title: data.title,
            description: data.description,
            lovelace_amount: data.lovelaceAmount,
            expiration_posix: data.expirationPosix,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update task: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate manager tasks for this project
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.tasks(variables.projectId),
      });
      // Invalidate public tasks
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(variables.projectId),
      });
    },
  });
}

/**
 * Delete a task from a project
 *
 * @example
 * ```tsx
 * function DeleteTaskButton({ task }: { task: Task }) {
 *   const deleteTask = useDeleteTask();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Are you sure?")) {
 *       await deleteTask.mutateAsync({
 *         projectId: task.projectId,
 *         taskHash: task.taskHash,
 *       });
 *       toast.success("Task deleted!");
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      projectId,
      taskHash,
    }: {
      projectId: string;
      taskHash: string;
    }) => {
      // Endpoint: POST /project/manager/task/delete
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/project/manager/task/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_id: projectId,
            task_hash: taskHash,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete task: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate manager tasks for this project
      void queryClient.invalidateQueries({
        queryKey: projectManagerKeys.tasks(variables.projectId),
      });
      // Invalidate public tasks
      void queryClient.invalidateQueries({
        queryKey: projectKeys.tasks(variables.projectId),
      });
      // Invalidate project detail
      void queryClient.invalidateQueries({
        queryKey: projectKeys.detail(variables.projectId),
      });
    },
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

// =============================================================================
// Response Type Aliases (for backward compatibility)
// =============================================================================

/**
 * Response wrapper for manager projects list
 * @deprecated Import ManagerProject[] directly
 */
export type ManagerProjectsResponse = ManagerProject[];

/**
 * Response wrapper for manager commitments list
 * @deprecated Import ManagerCommitment[] directly
 */
export type ManagerCommitmentsResponse = ManagerCommitment[];
