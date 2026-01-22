/**
 * React Query hooks for Course Module API endpoints
 *
 * Provides cached, deduplicated access to course module data.
 *
 * @example
 * ```tsx
 * // Get all modules for a course - cached
 * const { data: modules } = useCourseModules(courseNftPolicyId);
 *
 * // Get a specific module - cached
 * const { data: module } = useCourseModule(courseNftPolicyId, moduleCode);
 * ```
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  type CourseModuleResponse,
  type CourseModuleListResponse,
} from "~/types/generated";

/**
 * Input for creating a course module
 */
interface CreateCourseModuleInput {
  course_module_code: string;
  title: string;
  description?: string;
}
import { courseKeys } from "./use-course";

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
 *
 * @example
 * ```tsx
 * function ModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules, isLoading } = useCourseModules(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   return modules?.map(m => <ModuleCard key={m.course_module_code} module={m} />);
 * }
 * ```
 */
export function useCourseModules(courseNftPolicyId: string | undefined) {
  return useQuery({
    queryKey: courseModuleKeys.list(courseNftPolicyId ?? ""),
    queryFn: async () => {
      // Go API: GET /course/user/modules/{course_id}
      const response = await fetch(
        `/api/gateway/api/v2/course/user/modules/${courseNftPolicyId}`
      );

      // 404 means no modules yet - return empty array
      if (response.status === 404) {
        return [] as CourseModuleListResponse;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const result = await response.json() as { data?: CourseModuleListResponse };
      return result.data ?? [];
    },
    enabled: !!courseNftPolicyId,
  });
}

/**
 * Fetch all modules for a course as a teacher (authenticated endpoint)
 *
 * Uses the teacher endpoint which returns ALL modules including drafts.
 * Use this in studio/edit contexts where teachers need to see unpublished modules.
 *
 * @example
 * ```tsx
 * function StudioModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules, isLoading } = useTeacherCourseModules(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   return modules?.map(m => <ModuleEditor key={m.course_module_code} module={m} />);
 * }
 * ```
 */
export function useTeacherCourseModules(courseNftPolicyId: string | undefined) {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  return useQuery({
    queryKey: courseModuleKeys.teacherList(courseNftPolicyId ?? ""),
    queryFn: async () => {
      // Go API: POST /course/teacher/course-modules/list
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
        return [] as CourseModuleListResponse;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher modules: ${response.statusText}`);
      }

      const result = await response.json() as { data?: CourseModuleListResponse } | CourseModuleListResponse;
      // Handle both wrapped { data: [...] } and raw array formats
      if (Array.isArray(result)) {
        return result;
      }
      return result.data ?? [];
    },
    enabled: !!courseNftPolicyId && isAuthenticated,
  });
}

/**
 * Fetch a single module by course and module code (public endpoint)
 *
 * NOTE: The single-module GET endpoint was removed in V2.
 * This now fetches the module list and filters client-side.
 *
 * @example
 * ```tsx
 * function ModuleDetail({ courseId, moduleCode }: Props) {
 *   const { data: module, isLoading } = useCourseModule(courseId, moduleCode);
 *
 *   if (isLoading) return <PageLoading />;
 *   if (!module) return <NotFound />;
 *
 *   return <ModuleContent module={module} />;
 * }
 * ```
 */
export function useCourseModule(
  courseNftPolicyId: string | undefined,
  moduleCode: string | undefined
) {
  return useQuery({
    queryKey: courseModuleKeys.detail(courseNftPolicyId ?? "", moduleCode ?? ""),
    queryFn: async () => {
      // Go API: GET /course/user/modules/{course_id}
      // Fetch list and filter client-side
      const response = await fetch(
        `/api/gateway/api/v2/course/user/modules/${courseNftPolicyId}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      const result = await response.json() as { data?: CourseModuleListResponse };
      const modules = result.data ?? [];
      const courseModule = modules.find((m) => m.course_module_code === moduleCode);

      if (!courseModule) {
        throw new Error(`Module ${moduleCode} not found`);
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
      input: CreateCourseModuleInput & { course_nft_policy_id: string }
    ) => {
      // Go API: POST /course/teacher/course-module/create
      // API expects "course_id" and "course_module_code"
      const { course_nft_policy_id, course_module_code, ...rest } = input;
      const url = `/api/gateway/api/v2/course/teacher/course-module/create`;
      const body = {
        course_id: course_nft_policy_id,
        course_module_code,
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

      return response.json() as Promise<CourseModuleResponse>;
    },
    onSuccess: (_, variables) => {
      // Invalidate the module list for this course (public endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.course_nft_policy_id),
      });
      // Invalidate the teacher module list (authenticated endpoint)
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(variables.course_nft_policy_id),
      });
      // Also invalidate the course detail to update module counts
      void queryClient.invalidateQueries({
        queryKey: courseKeys.detail(variables.course_nft_policy_id),
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

      return response.json() as Promise<CourseModuleResponse>;
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
 */
export function useUpdateCourseModuleStatus() {
  const queryClient = useQueryClient();
  const { authenticatedFetch } = useAndamioAuth();

  return useMutation({
    mutationFn: async ({
      courseNftPolicyId,
      moduleCode,
      status,
    }: {
      courseNftPolicyId: string;
      moduleCode: string;
      status: string;
    }) => {
      // Go API: POST /course/teacher/course-module/update-status
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-module/update-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update module status: ${response.statusText}`);
      }

      return response.json() as Promise<CourseModuleResponse>;
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
