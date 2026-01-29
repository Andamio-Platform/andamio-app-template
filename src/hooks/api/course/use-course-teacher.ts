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
import { GATEWAY_API_BASE } from "~/lib/api-utils";

// =============================================================================
// Query Keys
// =============================================================================

export const courseTeacherKeys = {
  all: ["teacher-courses"] as const,
  list: () => [...courseTeacherKeys.all, "list"] as const,
  commitments: () => [...courseTeacherKeys.all, "commitments"] as const,
};

// =============================================================================
// App-Level Types (exported for components)
// =============================================================================

/**
 * Data source/status for a teacher course
 * - "synced": Data exists both on-chain and in database (merged)
 * - "onchain_only": Only on-chain data (not in database)
 * - "db_only": Only in database (not yet on-chain or minting failed)
 */
export type TeacherCourseStatus = "synced" | "onchain_only" | "db_only";

/**
 * @deprecated Use TeacherCourseStatus instead
 */
export type TeacherCourseSource = TeacherCourseStatus;

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
  status?: TeacherCourseStatus;
}

export type TeacherCoursesResponse = TeacherCourse[];

/**
 * Teacher assignment commitment with camelCase fields
 * Contains pending assessment data with both on-chain and DB info
 *
 * Updated 2026-01-28: Evidence is now Tiptap JSON from content.evidence
 * See: andamio-api/docs/REPL_NOTES/2026-01-28-teacher-commitments-fix.md
 */
export interface TeacherAssignmentCommitment {
  // On-chain fields
  courseId: string;
  studentAlias: string;
  sltHash?: string;
  submissionTx?: string;
  submissionSlot?: number;
  onChainContent?: string;  // Hex-encoded on-chain content

  // Off-chain content (from content object)
  moduleCode?: string;  // Human-readable module code (e.g., "101")
  evidence?: unknown;  // Tiptap JSON document from content.evidence
  commitmentStatus?: string;  // DRAFT, SUBMITTED, APPROVED, REJECTED (from content.commitment_status)

  // Metadata
  status?: TeacherCourseStatus;  // synced, onchain_only, db_only
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

/**
 * Raw API response for teacher commitment
 * Updated 2026-01-28: content object now populated with evidence
 */
interface RawTeacherCommitmentContent {
  evidence?: Record<string, unknown>;  // Tiptap JSON document
  assignment_evidence_hash?: string;
  commitment_status?: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";
}

interface RawTeacherCommitment {
  course_id: string;
  slt_hash: string;
  course_module_code?: string;  // Human-readable module code
  student_alias: string;
  submission_tx?: string;
  submission_slot?: number;
  on_chain_content?: string;  // Hex-encoded on-chain content
  content?: RawTeacherCommitmentContent;  // Off-chain content from DB
  source: "merged" | "chain_only" | "db_only";
}

// =============================================================================
// Transform Functions
// =============================================================================

/**
 * Convert API source value to status
 */
function mapSourceToStatus(source?: string): TeacherCourseStatus | undefined {
  if (!source) return undefined;
  switch (source) {
    case "merged":
      return "synced";
    case "chain_only":
      return "onchain_only";
    case "db_only":
      return "db_only";
    default:
      return undefined;
  }
}

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
    status: mapSourceToStatus(raw.source),
  };
}

/**
 * Transform raw API commitment to app-level TeacherAssignmentCommitment type
 * Updated 2026-01-28: Evidence is now under content.evidence
 */
function transformTeacherCommitment(raw: RawTeacherCommitment): TeacherAssignmentCommitment {
  return {
    courseId: raw.course_id,
    studentAlias: raw.student_alias,
    sltHash: raw.slt_hash,
    submissionTx: raw.submission_tx,
    submissionSlot: raw.submission_slot,
    onChainContent: raw.on_chain_content,
    moduleCode: raw.course_module_code,
    // Evidence is now under content.evidence (Tiptap JSON document)
    evidence: raw.content?.evidence,
    // Commitment status is now under content.commitment_status
    commitmentStatus: raw.content?.commitment_status,
    status: mapSourceToStatus(raw.source),
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
    queryKey: courseTeacherKeys.list(),
    queryFn: async (): Promise<TeacherCoursesResponse> => {
      // Endpoint: POST /api/v2/course/teacher/courses/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/courses/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      // 404 means no courses - return empty array
      if (response.status === 404) {
        return [];
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch teacher courses: ${response.statusText}`);
      }

      const result = await response.json() as { data?: RawTeacherCourse[]; warning?: string };

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
 *   const { data: commitments, isLoading, error, refetch } = useTeacherAssignmentCommitments();
 *
 *   if (isLoading) return <Skeleton />;
 *   if (error) return <ErrorAlert message={error.message} />;
 *   if (!commitments?.length) return <AllCaughtUp />;
 *
 *   return <CommitmentList commitments={commitments} />;
 * }
 * ```
 */
export function useTeacherAssignmentCommitments() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  return useQuery({
    queryKey: courseTeacherKeys.commitments(),
    queryFn: async (): Promise<TeacherAssignmentCommitmentsResponse> => {
      // Merged endpoint: POST /api/v2/course/teacher/assignment-commitments/list
      const response = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/assignment-commitments/list`,
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
    queryKey: [...courseTeacherKeys.all, "with-modules"],
    queryFn: async (): Promise<TeacherCourseWithModules[]> => {
      // Step 1: Fetch teacher courses list
      const coursesResponse = await authenticatedFetch(
        `${GATEWAY_API_BASE}/course/teacher/courses/list`,
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
            `${GATEWAY_API_BASE}/course/user/course/${course.courseId}`
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
      queryKey: courseTeacherKeys.all,
    });
  };
}
