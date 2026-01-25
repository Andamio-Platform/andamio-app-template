/**
 * React Query hooks for Course Module API endpoints
 *
 * Provides cached, deduplicated access to course module data.
 *
 * Architecture: Colocated Types Pattern
 * - App-level types (CourseModule) defined here with camelCase fields
 * - Transform functions convert API snake_case to app camelCase
 * - Components import types from this hook, never from generated types
 *
 * @example
 * ```tsx
 * import { useCourseModules, type CourseModule } from "~/hooks/api/course/use-course-module";
 *
 * function ModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules } = useCourseModules(courseId);
 *   return modules?.map(m => <div key={m.sltHash}>{m.title}</div>);
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
// Import directly from gateway.ts to avoid circular dependency with ~/types/generated
import type {
  OrchestrationMergedCourseModuleItem,
  MergedHandlersMergedCourseModulesResponse,
} from "~/types/generated/gateway";

import { courseKeys } from "./use-course";

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Data source for a module
 * - "merged": Module exists in both on-chain and DB (full data)
 * - "chain_only": Module on-chain but no DB content (needs registration)
 * - "db_only": Module in DB but not on-chain (draft or not yet published)
 */
export type ModuleSource = "merged" | "chain_only" | "db_only";

/**
 * App-level SLT (Student Learning Target) type with camelCase fields
 */
export interface SLT {
  id?: number;
  sltId?: string;
  sltText?: string;
  moduleIndex?: number;
  moduleCode?: string;
  createdAt?: string;
  updatedAt?: string;
  // Nested lesson data (populated by some endpoints)
  lesson?: Lesson | null;
}

/**
 * App-level Lesson type with camelCase fields
 */
export interface Lesson {
  id?: number;
  contentJson?: unknown;
  sltId?: string;
  sltIndex?: number;
  moduleCode?: string;
  createdAt?: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  isLive?: boolean;
  imageUrl?: string;
  videoUrl?: string;
}

/**
 * App-level CourseModule type with camelCase fields
 *
 * Combines on-chain fields (sltHash, prerequisites, onChainSlts)
 * with off-chain content fields (title, description, slts, etc.)
 */
export interface CourseModule {
  // Primary identifier (on-chain slts_hash / DB slt_hash)
  sltHash: string;

  // Course context
  courseId: string;

  // On-chain fields
  createdBy?: string;
  prerequisites?: string[];
  onChainSlts?: string[];

  // Data source indicator
  source: ModuleSource;

  // Content fields (flattened from content.*)
  moduleCode?: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;
  status?: string;
  slts?: SLT[];
  assignment?: unknown;
  introduction?: unknown;
}

/**
 * Input for creating a course module
 */
export interface CreateCourseModuleInput {
  moduleCode: string;
  title: string;
  description?: string;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform raw API SLT to app-level SLT type
 */
function transformSLT(raw: Record<string, unknown>): SLT {
  return {
    id: raw.id as number | undefined,
    sltId: raw.slt_id as string | undefined,
    sltText: raw.slt_text as string | undefined,
    moduleIndex: raw.module_index as number | undefined,
    moduleCode: raw.course_module_code as string | undefined,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
    lesson: raw.lesson ? transformLesson(raw.lesson as Record<string, unknown>) : null,
  };
}

/**
 * Transform raw API Lesson to app-level Lesson type
 */
function transformLesson(raw: Record<string, unknown>): Lesson {
  return {
    id: raw.id as number | undefined,
    contentJson: raw.lesson_content ?? raw.content_json,
    sltId: raw.slt_id as string | undefined,
    sltIndex: raw.slt_index as number | undefined,
    moduleCode: raw.course_module_code as string | undefined,
    createdAt: raw.created_at as string | undefined,
    updatedAt: raw.updated_at as string | undefined,
    title: raw.title as string | undefined,
    description: raw.description as string | undefined,
    isLive: raw.is_live as boolean | undefined,
    imageUrl: raw.image_url as string | undefined,
    videoUrl: raw.video_url as string | undefined,
  };
}

/**
 * Transform API response to app-level CourseModule type
 * Handles snake_case → camelCase conversion and field flattening
 */
export function transformCourseModule(item: OrchestrationMergedCourseModuleItem): CourseModule {
  // Transform SLTs if present
  const rawSlts = item.content?.slts as Record<string, unknown>[] | undefined;
  const slts = rawSlts?.map(transformSLT);

  return {
    // On-chain fields
    sltHash: item.slt_hash ?? "",
    courseId: item.course_id ?? "",
    createdBy: item.created_by,
    prerequisites: item.prerequisites,
    onChainSlts: item.on_chain_slts,
    source: (item.source as ModuleSource) ?? "db_only",

    // Flattened content fields
    moduleCode: item.content?.course_module_code,
    title: item.content?.title,
    description: item.content?.description,
    imageUrl: item.content?.image_url,
    videoUrl: item.content?.video_url,
    isLive: item.content?.is_live,
    status: item.content?.module_status,
    slts,
    assignment: item.content?.assignment,
    introduction: item.content?.introduction,
  };
}

// =============================================================================
// Backward Compatibility Exports (DEPRECATED)
// =============================================================================

/**
 * @deprecated Use CourseModule instead. Will be removed after component migration.
 */
export type MergedCourseModule = CourseModule;

/**
 * @deprecated Use transformCourseModule instead. Will be removed after component migration.
 */
export const flattenMergedModule = transformCourseModule;

// =============================================================================
// Query Keys
// =============================================================================

export const courseModuleKeys = {
  all: ["courseModules"] as const,
  lists: () => [...courseModuleKeys.all, "list"] as const,
  list: (courseNftPolicyId: string) =>
    [...courseModuleKeys.lists(), courseNftPolicyId] as const,
  teacherLists: () => [...courseModuleKeys.all, "teacherList"] as const,
  teacherList: (courseNftPolicyId: string) =>
    [...courseModuleKeys.teacherLists(), courseNftPolicyId] as const,
  details: () => [...courseModuleKeys.all, "detail"] as const,
  detail: (courseNftPolicyId: string, moduleCode: string) =>
    [...courseModuleKeys.details(), courseNftPolicyId, moduleCode] as const,
  map: (courseNftPolicyIds: string[]) =>
    [...courseModuleKeys.all, "map", courseNftPolicyIds.sort().join(",")] as const,
};

// =============================================================================
// Query Hooks
// =============================================================================

/**
 * Fetch all modules for a course (public endpoint)
 *
 * Uses the user endpoint which does not require authentication.
 * Returns app-level CourseModule types with camelCase fields.
 *
 * @example
 * ```tsx
 * function ModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules, isLoading } = useCourseModules(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   return modules?.map(m => <ModuleCard key={m.moduleCode} module={m} />);
 * }
 * ```
 */
export function useCourseModules(courseNftPolicyId: string | undefined) {
  return useQuery({
    queryKey: courseModuleKeys.list(courseNftPolicyId ?? ""),
    queryFn: async (): Promise<CourseModule[]> => {
      // Go API: GET /course/user/modules/{course_id}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/modules/${courseNftPolicyId}`
      );

      // 404 means no modules yet - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersMergedCourseModulesResponse;

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useCourseModules] API warning:", result.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformCourseModule);
    },
    enabled: !!courseNftPolicyId,
  });
}

/**
 * Fetch all modules for a course as a teacher (merged endpoint)
 *
 * Uses the merged teacher endpoint which returns UNION of on-chain and DB modules.
 * This gives teachers visibility into:
 * - `chain_only`: Modules on-chain but no DB content (needs registration)
 * - `db_only`: Draft modules not yet published on-chain
 * - `merged`: Full modules with both on-chain and DB data
 *
 * @example
 * ```tsx
 * function StudioModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules, isLoading } = useTeacherCourseModules(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   return modules?.map(m => (
 *     <ModuleEditor
 *       key={m.moduleCode ?? m.sltHash}
 *       module={m}
 *       needsContent={m.source === "chain_only"}
 *     />
 *   ));
 * }
 * ```
 */
export function useTeacherCourseModules(courseNftPolicyId: string | undefined) {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  return useQuery({
    queryKey: courseModuleKeys.teacherList(courseNftPolicyId ?? ""),
    queryFn: async (): Promise<CourseModule[]> => {
      // Merged endpoint: POST /api/v2/course/teacher/course-modules/list
      // Returns UNION of on-chain and DB modules with source indicator
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-modules/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseNftPolicyId }),
        }
      );

      // 404 means no modules yet - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher modules: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersMergedCourseModulesResponse;

      // Debug: Log full API response to diagnose empty module list issue
      console.log("[useTeacherCourseModules] API response:", {
        dataLength: result.data?.length ?? 0,
        data: result.data,
        warning: result.warning,
      });

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useTeacherCourseModules] API warning:", result.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformCourseModule);
    },
    enabled: !!courseNftPolicyId && isAuthenticated,
  });
}

/**
 * Fetch a single module by course and module code (public endpoint)
 *
 * NOTE: The single-module GET endpoint was removed in V2.
 * This now fetches the module list and filters client-side.
 * Returns app-level CourseModule type with camelCase fields.
 *
 * @example
 * ```tsx
 * function ModuleDetail({ courseId, moduleCode }: Props) {
 *   const { data: courseModule, isLoading } = useCourseModule(courseId, moduleCode);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!courseModule) return <NotFound />;
 *
 *   return <ModuleContent module={courseModule} />;
 * }
 * ```
 */
export function useCourseModule(
  courseNftPolicyId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: courseModuleKeys.detail(courseNftPolicyId ?? "", moduleCode ?? ""),
    queryFn: async (): Promise<CourseModule | null> => {
      // Go API: GET /course/user/modules/{course_id}
      // Fetch list and filter client-side
      const response = await fetch(
        `/api/gateway/api/v2/course/user/modules/${courseNftPolicyId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const result = await response.json() as MergedHandlersMergedCourseModulesResponse;

      // Transform to app-level types
      const modules = (result.data ?? []).map(transformCourseModule);
      const courseModule = modules.find((m) => m.moduleCode === moduleCode);

      if (!courseModule) {
        return null;
      }

      return courseModule;
    },
    enabled: !!courseNftPolicyId && !!moduleCode,
  });
}

/**
 * Batch fetch modules for multiple courses by policy ID
 *
 * Used for dashboard views showing module counts across courses.
 * Uses POST /course/teacher/modules/list endpoint.
 *
 * @example
 * ```tsx
 * function CourseCards({ policyIds }: { policyIds: string[] }) {
 *   const { data: moduleMap } = useCourseModuleMap(policyIds);
 *
 *   return policyIds.map(id => (
 *     <CourseCard
 *       key={id}
 *       moduleCount={moduleMap?.[id]?.length ?? 0}
 *     />
 *   ));
 * }
 * ```
 */
export function useCourseModuleMap(courseNftPolicyIds: string[]) {
  const { authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseModuleKeys.map(courseNftPolicyIds),
    queryFn: async () => {
      // Go API: POST /course/teacher/modules/list - returns modules grouped by policy ID
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/modules/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_ids: courseNftPolicyIds }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch module map: ${response.statusText}`);
      }

      return response.json() as Promise<
        Record<string, Array<{ course_module_code: string; title: string }>>
      >;
    },
    enabled: courseNftPolicyIds.length > 0,
  });
}

// =============================================================================
// Mutation Hooks
// =============================================================================

/**
 * Create a new course module
 *
 * @example
 * ```tsx
 * function CreateModuleForm({ courseId }: { courseId: string }) {
 *   const createModule = useCreateCourseModule();
 *
 *   const handleSubmit = async (data: CreateCourseModuleInput) => {
 *     await createModule.mutateAsync({
 *       courseNftPolicyId: courseId,
 *       ...data,
 *     });
 *     toast.success("Module created!");
 *   };
 *
 *   return <ModuleForm onSubmit={handleSubmit} isLoading={createModule.isPending} />;
 * }
 * ```
 */
export function useCreateCourseModule() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async (
      input: { courseNftPolicyId: string; moduleCode: string; title: string; description?: string }
    ) => {
      // Go API: POST /course/teacher/course-module/create
      // API expects "course_id" and "course_module_code"
      const { courseNftPolicyId, moduleCode, ...rest } = input;
      const url = `/api/gateway/api/v2/course/teacher/course-module/create`;
      const body = {
        course_id: courseNftPolicyId,
        course_module_code: moduleCode,
        ...rest,
      };
      console.log("[CreateModule] URL:", url);
      console.log("[CreateModule] Body:", body);
      const response = await authenticatedFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      console.log("[CreateModule] Response status:", response.status);
      const responseText = await response.clone().text();
      console.log("[CreateModule] Response body:", responseText);

      if (!response.ok) {
        throw new Error(`Failed to create module: ${response.statusText} - ${responseText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the module list for this course (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseNftPolicyId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseNftPolicyId),
      });
      // Also invalidate the course detail to update module counts
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.courseNftPolicyId),
      });
    },
  });
}

/**
 * Update a course module
 */
export function useUpdateCourseModule() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      data,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      data: Partial<{ title: string; description: string }>;
    }) => {
      // Go API: POST /course/teacher/course-module/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-module/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            ...data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update module: ${response.statusText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific module
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseNftPolicyId,
          variables.moduleCode
        ),
      });
      // Invalidate the module list (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseNftPolicyId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseNftPolicyId),
      });
    },
  });
}

/**
 * Update course module status
 *
 * When setting status to "APPROVED", the sltHash is required.
 * The sltHash should be computed from the module's SLTs using computeSltHash().
 *
 * @example
 * ```tsx
 * const updateStatus = useUpdateCourseModuleStatus();
 *
 * // Approve a module (requires sltHash)
 * await updateStatus.mutateAsync({
 *   courseNftPolicyId: "...",
 *   moduleCode: "101",
 *   status: "APPROVED",
 *   sltHash: computeSltHash(slts),
 * });
 *
 * // Revert to draft (no sltHash needed)
 * await updateStatus.mutateAsync({
 *   courseNftPolicyId: "...",
 *   moduleCode: "101",
 *   status: "DRAFT",
 * });
 * ```
 */
export function useUpdateCourseModuleStatus() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      status,
      sltHash,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      status: string;
      /** Required when status is "APPROVED" */
      sltHash?: string;
    }) => {
      // Go API: POST /course/teacher/course-module/update-status
      const body: Record<string, string> = {
        course_id: courseNftPolicyId,
        course_module_code: moduleCode,
        status,
      };

      // Include slt_hash when approving (required by API)
      if (sltHash) {
        body.slt_hash = sltHash;
      }

      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-module/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update module status: ${response.statusText}`);
      }

      // Response consumed but not returned - cache invalidation triggers refetch
      await response.json();
    },
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseNftPolicyId,
          variables.moduleCode
        ),
      });
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseNftPolicyId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseNftPolicyId),
      });
    },
  });
}

// =============================================================================
// Delete Course Module
// =============================================================================

/**
 * Delete a course module
 *
 * Permanently removes a course module from the database.
 * Only works for modules that are not on-chain (DRAFT status).
 *
 * Automatically invalidates course module caches on success.
 *
 * @example
 * ```tsx
 * function DeleteModuleButton({ courseNftPolicyId, moduleCode }: Props) {
 *   const deleteModule = useDeleteCourseModule();
 *
 *   const handleDelete = async () => {
 *     if (confirm("Are you sure?")) {
 *       await deleteModule.mutateAsync({ courseNftPolicyId, moduleCode });
 *     }
 *   };
 *
 *   return <Button onClick={handleDelete} variant="destructive">Delete</Button>;
 * }
 * ```
 */
export function useDeleteCourseModule() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
    }) => {
      // Go API: POST /course/teacher/course-module/delete
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-module/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string };
        throw new Error(errorData.message ?? `Failed to delete module: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      // Remove the specific module from cache
      queryClient.removeQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseNftPolicyId,
          variables.moduleCode
        ),
      });
      // Invalidate the list (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseNftPolicyId),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.courseNftPolicyId),
      });
    },
  });
}
