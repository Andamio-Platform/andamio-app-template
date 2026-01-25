/**
 * React Query hooks for Teacher Course API endpoints
 *
 * Architecture: Colocated Types Pattern
 * - App-level types (TeacherCourse) defined here with camelCase fields
 * - Transform functions convert API snake_case to app camelCase
 * - Components import types from this hook, never from generated types
 *
 * @example
 * ```tsx
 * function TeacherStudio() {
 *   const { data, isLoading } = useTeacherCourses();
 *
 *   return data?.map(course => (
 *     <CourseCard key={course.courseId} course={course} />
 *   ));
 * }
 * ```
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";

// =============================================================================
// Query Keys
// =============================================================================

export const teacherCourseKeys = {
  all: ["teacher-courses"] as const,
  list: () => [...teacherCourseKeys.all, "list"] as const,
  commitments: () => [...teacherCourseKeys.all, "commitments"] as const,
};

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Data source for a teacher course
 */
export type TeacherCourseSource = "merged" | "chain_only" | "db_only";

/**
 * Teacher course item with camelCase fields
 * Contains both on-chain and off-chain data
 */
export interface TeacherCourse {
  // On-chain fields
  courseId: string;
  courseAddress?: string;
  owner?: string;
  teachers?: string[];
  studentStateId?: string;
  createdTx?: string;
  createdSlot?: number;

  // Flattened content fields
  title?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
  isLive?: boolean;

  // Metadata
  source?: TeacherCourseSource;
}

export type TeacherCoursesResponse = TeacherCourse[];

/**
 * Teacher assignment commitment with camelCase fields
 * Contains pending assessment data with both on-chain and DB info
 */
export interface TeacherAssignmentCommitment {
  // On-chain fields
  courseId: string;
  assignmentId?: string;
  studentAlias: string;
  sltHash?: string;
  submissionTxHash?: string;
  submissionTx?: string;
  submissionSlot?: number;
  onChainContent?: string;

  // Off-chain content
  moduleCode?: string;
  moduleTitle?: string;
  evidenceUrl?: string;
  evidenceText?: string;
  evidence?: unknown;
  submittedAt?: string;
  commitmentStatus?: string; // DRAFT, PENDING_TX, PENDING_APPROVAL, ON_CHAIN

  // Nested assignment data
  assignment?: {
    title?: string;
    content?: unknown;
  };

  // Metadata
  source?: TeacherCourseSource;
}

export type TeacherAssignmentCommitmentsResponse = TeacherAssignmentCommitment[];

// =============================================================================
// Raw API Types (internal)
// =============================================================================

interface RawTeacherCourse {
  course_id: string;
  course_address?: string;
  owner?: string;
  teachers?: string[];
  student_state_id?: string;
  created_tx?: string;
  created_slot?: number;
  content?: {
    title?: string;
    code?: string;
    description?: string;
    image_url?: string;
    video_url?: string;
    live?: boolean;
  };
  title?: string;
  description?: string;
  image_url?: string;
  video_url?: string;
  source?: string;
}

interface RawTeacherCommitment {
  course_id: string;
  assignment_id?: string;
  student_alias: string;
  slt_hash?: string;
  submission_tx_hash?: string;
  submission_tx?: string;
  submission_slot?: number;
  on_chain_content?: string;
  course_module_code?: string;
  module_title?: string;
  evidence_url?: string;
  evidence_text?: string;
  evidence?: unknown;
  submitted_at?: string;
  commitment_status?: string;
  assignment?: {
    title?: string;
    content?: unknown;
  };
  source?: string;
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Transform raw API course to app-level TeacherCourse type
 */
function transformTeacherCourse(raw: RawTeacherCourse): TeacherCourse {
  return {
    courseId: raw.course_id,
    courseAddress: raw.course_address,
    owner: raw.owner,
    teachers: raw.teachers,
    studentStateId: raw.student_state_id,
    createdTx: raw.created_tx,
    createdSlot: raw.created_slot,
    // Flatten content.* to top level
    title: raw.content?.title ?? raw.title,
    description: raw.content?.description ?? raw.description,
    imageUrl: raw.content?.image_url ?? raw.image_url,
    videoUrl: raw.video_url, // video_url not in OrchestrationCourseContent
    isLive: raw.content?.live,
    source: raw.source as TeacherCourseSource | undefined,
  };
}

/**
 * Transform raw API commitment to app-level TeacherAssignmentCommitment type
 */
function transformTeacherCommitment(raw: RawTeacherCommitment): TeacherAssignmentCommitment {
  return {
    courseId: raw.course_id,
    assignmentId: raw.assignment_id,
    studentAlias: raw.student_alias,
    sltHash: raw.slt_hash,
    submissionTxHash: raw.submission_tx_hash,
    submissionTx: raw.submission_tx,
    submissionSlot: raw.submission_slot,
    onChainContent: raw.on_chain_content,
    moduleCode: raw.course_module_code,
    moduleTitle: raw.module_title,
    evidenceUrl: raw.evidence_url,
    evidenceText: raw.evidence_text,
    evidence: raw.evidence,
    submittedAt: raw.submitted_at,
    commitmentStatus: raw.commitment_status,
    assignment: raw.assignment,
    source: raw.source as TeacherCourseSource | undefined,
  };
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Fetch courses the authenticated user teaches
 *
 * Uses merged endpoint: POST /api/v2/course/teacher/courses/list
 * Returns courses with both on-chain state and DB content.
 *
 * @example
 * ```tsx
 * function CourseStudio() {
 *   const { data: courses, isLoading, error, refetch } = useTeacherCourses();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!courses?.length) return <EmptyState />;
 *
 *   return <CourseList courses={courses} />;
 * }
 * ```
 */
export function useTeacherCourses() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: teacherCourseKeys.list(),
    queryFn: async (): Promise<TeacherCoursesResponse> => {
      // Merged endpoint: POST /api/v2/course/teacher/courses/list
      console.log("[useTeacherCourses] Making request...");

      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      console.log("[useTeacherCourses] Response status:", response.status);

      // 404 means no courses - return empty array
      if (response.status === 404) {
        console.log("[useTeacherCourses] Got 404 - returning empty array");
        return [];
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useTeacherCourses] Error response:", errorText);
        throw new Error(`Failed to fetch teacher courses: ${response.statusText}`);
      }

      const result = await response.json() as { data?: RawTeacherCourse[]; warning?: string };

      // Debug: log the full response
      console.log("[useTeacherCourses] API response:", JSON.stringify(result, null, 2));

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useTeacherCourses] API warning:", result.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformTeacherCourse);
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Fetch assignment commitments pending teacher review
 *
 * Uses merged endpoint: POST /api/v2/course/teacher/assignment-commitments/list
 * Returns pending assessments with both on-chain and DB data.
 *
 * @example
 * ```tsx
 * function PendingReviews() {
 *   const { data: commitments, isLoading, error, refetch } = useTeacherCommitments();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!commitments?.length) return <AllCaughtUp />;
 *
 *   return <CommitmentList commitments={commitments} />;
 * }
 * ```
 */
export function useTeacherCommitments() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: teacherCourseKeys.commitments(),
    queryFn: async (): Promise<TeacherAssignmentCommitmentsResponse> => {
      // Merged endpoint: POST /api/v2/course/teacher/assignment-commitments/list
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/assignment-commitments/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no pending assessments - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher commitments: ${response.statusText}`);
      }

      const result = await response.json() as { data?: RawTeacherCommitment[]; warning?: string };

      // Log warning if partial data returned
      if (result.warning) {
        console.warn("[useTeacherCommitments] API warning:", result.warning);
      }

      // Transform to app-level types with camelCase fields
      return (result.data ?? []).map(transformTeacherCommitment);
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Teacher course with module details for prerequisite selection
 */
export interface TeacherCourseWithModules {
  courseId: string;
  title?: string;
  modules: Array<{
    assignmentId: string;
    slts: string[];
  }>;
}

/**
 * Fetch teacher courses with module details
 *
 * This hook combines teacher courses list with individual course details
 * to provide module information needed for prerequisite selection.
 *
 * Note: This makes multiple API calls. Use sparingly (e.g., project creation wizard).
 *
 * @example
 * ```tsx
 * function PrereqSelector() {
 *   const { data: courses, isLoading } = useTeacherCoursesWithModules();
 *
 *   return courses?.map(course => (
 *     <CourseModuleSelector key={course.course_id} course={course} />
 *   ));
 * }
 * ```
 */
export function useTeacherCoursesWithModules() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: [...teacherCourseKeys.all, "with-modules"],
    queryFn: async (): Promise<TeacherCourseWithModules[]> => {
      // Step 1: Fetch teacher courses list
      const coursesResponse = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      if (coursesResponse.status === 404) {
        return [];
      }

      if (!coursesResponse.ok) {
        throw new Error(`Failed to fetch teacher courses: ${coursesResponse.statusText}`);
      }

      const coursesResult = (await coursesResponse.json()) as {
        data?: RawTeacherCourse[];
      };
      const rawCourses = coursesResult.data ?? [];

      if (rawCourses.length === 0) {
        return [];
      }

      // Transform to app-level types
      const courses = rawCourses.map(transformTeacherCourse);

      // Step 2: Fetch full details for each course to get modules
      const coursesWithModules: TeacherCourseWithModules[] = [];

      for (const course of courses) {
        try {
          const detailResponse = await fetch(
            `/api/gateway/api/v2/course/user/course/${course.courseId}`
          );

          if (detailResponse.ok) {
            const detailResult = (await detailResponse.json()) as {
              data?: {
                course_id?: string;
                content?: { title?: string };
                modules?: Array<{ assignment_id?: string; slts?: string[] }>;
              };
            };

            const detail = detailResult.data;
            if (detail?.modules && detail.modules.length > 0) {
              coursesWithModules.push({
                courseId: course.courseId,
                title: detail.content?.title ?? course.title,
                modules: detail.modules
                  .filter((m) => m.assignment_id)
                  .map((m) => ({
                    assignmentId: m.assignment_id!,
                    slts: m.slts ?? [],
                  })),
              });
            }
          }
        } catch {
          // Skip courses that fail to load details
          console.warn(`Failed to load details for course ${course.courseId}`);
        }
      }

      return coursesWithModules;
    },
    enabled: isAuthenticated,
    staleTime: 60 * 1000, // 1 minute (longer since this is expensive)
  });
}

/**
 * Hook to invalidate teacher courses cache
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidateTeacherCourses();
 *
 * // After creating a new course
 * await invalidate();
 * ```
 */
export function useInvalidateTeacherCourses() {
  const queryClient = useQueryClient();

  return async () => {
    await queryClient.invalidateQueries({
      queryKey: teacherCourseKeys.all,
    });
  };
}
