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
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import {
  type CourseModuleOutput,
  type ListCourseModulesOutput,
  type CreateCourseModuleInput,
} from "@andamio/db-api";
import { courseKeys } from "./use-course";

// =============================================================================
// Query Keys
// =============================================================================

export const courseModuleKeys = {
  all: ["courseModules"] as const,
  lists: () => [...courseModuleKeys.all, "list"] as const,
  list: (courseNftPolicyId: string) =>
    [...courseModuleKeys.lists(), courseNftPolicyId] as const,
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
 * Fetch all modules for a course
 *
 * @example
 * ```tsx
 * function ModuleList({ courseId }: { courseId: string }) {
 *   const { data: modules, isLoading } = useCourseModules(courseId);
 *
 *   if (isLoading) return <Skeleton />;
 *   return modules?.map(m => <ModuleCard key={m.module_code} module={m} />);
 * }
 * ```
 */
export function useCourseModules(courseNftPolicyId: string | undefined) {
  return useQuery({
    queryKey: courseModuleKeys.list(courseNftPolicyId ?? ""),
    queryFn: async () => {
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      return response.json() as Promise<ListCourseModulesOutput>;
    },
    enabled: !!courseNftPolicyId,
  });
}

/**
 * Fetch a single module by course and module code
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
      const response = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch module: ${response.statusText}`);
      }

      return response.json() as Promise<CourseModuleOutput>;
    },
    enabled: !!courseNftPolicyId && !!moduleCode,
  });
}

/**
 * Batch fetch modules for multiple courses
 *
 * Used for dashboard views showing module counts across courses.
 *
 * @example
 * ```tsx
 * function CourseCards({ courseIds }: { courseIds: string[] }) {
 *   const { data: moduleMap } = useCourseModuleMap(courseIds);
 *
 *   return courseIds.map(id => (
 *     <CourseCard
 *       key={id}
 *       moduleCount={moduleMap?.[id]?.length ?? 0}
 *     />
 *   ));
 * }
 * ```
 */
export function useCourseModuleMap(courseCodes: string[]) {
  const { authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseModuleKeys.map(courseCodes),
    queryFn: async () => {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/map`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_codes: courseCodes }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch module map: ${response.statusText}`);
      }

      return response.json() as Promise<
        Record<string, Array<{ module_code: string; title: string }>>
      >;
    },
    enabled: courseCodes.length > 0,
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create module: ${response.statusText}`);
      }

      return response.json() as Promise<CourseModuleOutput>;
    },
    onSuccess: (_, variables) => {
      // Invalidate the module list for this course
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.course_nft_policy_id),
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/update`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            ...data,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update module: ${response.statusText}`);
      }

      return response.json() as Promise<CourseModuleOutput>;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific module
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.detail(
          variables.courseNftPolicyId,
          variables.moduleCode
        ),
      });
      // Invalidate the module list
      void queryClient.invalidateQueries({
        queryKey: courseModuleKeys.list(variables.courseNftPolicyId),
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/update-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update module status: ${response.statusText}`);
      }

      return response.json() as Promise<CourseModuleOutput>;
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
    },
  });
}
