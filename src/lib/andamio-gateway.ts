/**
 * Andamio Gateway API Client - Merged Endpoints
 *
 * Provides typed access to the unified Andamio API Gateway's merged endpoints.
 * These endpoints combine off-chain (DB) and on-chain (Andamioscan) data into
 * unified responses, eliminating the need for multiple API calls.
 *
 * Gateway Base: https://andamio-api-gateway-168705267033.us-central1.run.app
 * Proxy Base: /api/andamioscan (forwards to gateway)
 *
 * Merged Endpoint Categories:
 * - /api/v2/course/* - Combined course data (DB metadata + on-chain state)
 * - /api/v2/project/* - Combined project data (DB metadata + on-chain state)
 *
 * @see .claude/skills/audit-api-coverage/unified-api-endpoints.md
 */

import type { CourseResponse, ProjectV2Output } from "~/types/generated";

// =============================================================================
// Types - Merged Course Endpoints
// =============================================================================

/**
 * On-chain module data in merged response
 */
export type MergedOnChainModule = {
  assignment_id: string;
  created_by: string;
  slts: string[];
  prerequisites: string[];
};

/**
 * On-chain state in merged course response
 */
export type MergedCourseOnChainState = {
  course_id: string;
  course_address: string;
  course_state_policy_id: string;
  teachers: string[];
  modules: MergedOnChainModule[];
  students: string[];
  past_students: string[];
};

/**
 * Merged course from list endpoint
 * Combines DB metadata with on-chain state
 */
export type MergedCourseListItem = {
  // DB fields
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  access_tier: string | null;
  course_nft_policy_id: string | null;
  status: "draft" | "published" | "live";
  created_at: string;
  updated_at: string;
  // On-chain state (null if not live)
  on_chain: MergedCourseOnChainState | null;
};

/**
 * Response from merged courses list endpoint
 */
export type MergedCoursesListResponse = {
  courses: MergedCourseListItem[];
  total: number;
};

/**
 * DB module in merged course detail
 */
export type MergedDbModule = {
  id: string;
  module_code: string;
  title: string;
  content: unknown;
  slts: Array<{
    id: string;
    slt_text: string;
    module_index: number;
  }>;
  assignment_content: unknown;
  credential_content: unknown;
};

/**
 * Merged course detail response
 * Full course data with both DB and on-chain information
 */
export type MergedCourseDetail = {
  // DB fields
  id: string;
  title: string;
  description: string | null;
  introduction: unknown;
  category: string | null;
  access_tier: string | null;
  course_nft_policy_id: string | null;
  status: "draft" | "published" | "live";
  created_at: string;
  updated_at: string;
  modules: MergedDbModule[];
  // On-chain state
  on_chain: MergedCourseOnChainState | null;
};

/**
 * Student course status (merged)
 */
export type MergedStudentCourseStatus = {
  alias: string;
  course_id: string;
  is_enrolled: boolean;
  current_assignment: string | null;
  completed_assignments: string[];
  credentials: string[];
};

// =============================================================================
// Types - Merged Project Endpoints
// =============================================================================

/**
 * On-chain task in merged response
 */
export type MergedOnChainTask = {
  task_id: string;
  content: string;
  created_by: string;
  lovelace: number;
  assets: Array<{
    policy_id: string;
    name: string;
    amount: string;
  }>;
  expiration: string;
  expiration_posix: number;
};

/**
 * On-chain state in merged project response
 */
export type MergedProjectOnChainState = {
  project_id: string;
  project_address: string;
  project_state_policy_id: string;
  admin: string;
  managers: string[];
  contributors: string[];
  tasks: MergedOnChainTask[];
};

/**
 * Merged project from list endpoint
 */
export type MergedProjectListItem = {
  // DB fields
  id: string;
  title: string;
  description: string | null;
  project_nft_policy_id: string | null;
  status: "draft" | "published" | "live";
  created_at: string;
  updated_at: string;
  // On-chain state (null if not live)
  on_chain: MergedProjectOnChainState | null;
};

/**
 * Response from merged projects list endpoint
 */
export type MergedProjectsListResponse = {
  projects: MergedProjectListItem[];
  total: number;
};

/**
 * DB task in merged project detail
 */
export type MergedDbTask = {
  id: string;
  task_index: number;
  title: string;
  description: unknown;
  lovelace_reward: number;
  token_rewards: unknown[];
};

/**
 * Merged project detail response
 */
export type MergedProjectDetail = {
  // DB fields
  id: string;
  title: string;
  description: string | null;
  introduction: unknown;
  project_nft_policy_id: string | null;
  status: "draft" | "published" | "live";
  created_at: string;
  updated_at: string;
  tasks: MergedDbTask[];
  // On-chain state
  on_chain: MergedProjectOnChainState | null;
};

/**
 * Contributor project status (merged)
 */
export type MergedContributorStatus = {
  alias: string;
  project_id: string;
  joined_at: number;
  completed_tasks: string[];
  pending_tasks: string[];
  credentials: Array<{
    policy_id: string;
    name: string;
    amount: string;
  }>;
};

// =============================================================================
// API Client
// =============================================================================

/**
 * Proxy base for gateway requests
 * Uses the existing andamioscan proxy which forwards to the unified gateway
 */
const PROXY_BASE = "/api/andamioscan";

/**
 * Fetch wrapper with error handling for Gateway API
 */
async function fetchGateway<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(
      `Gateway API error: ${response.status} ${response.statusText}` +
        (errorData.message ?? errorData.error ? ` - ${errorData.message ?? errorData.error}` : "")
    );
  }

  return response.json() as Promise<T>;
}

/**
 * Fetch wrapper with JWT authentication
 */
async function fetchGatewayAuth<T>(
  path: string,
  jwt: string,
  options?: RequestInit
): Promise<T> {
  return fetchGateway<T>(path, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${jwt}`,
    },
  });
}

// =============================================================================
// Merged Course Endpoints
// =============================================================================

/**
 * List all published courses with on-chain state
 *
 * Endpoint: GET /api/v2/course/user/courses/list
 *
 * Returns courses that have been published, with their on-chain state
 * merged in if they are live on the blockchain.
 *
 * @returns Array of courses with combined DB + on-chain data
 *
 * @example
 * ```typescript
 * const { courses } = await getMergedCoursesList();
 * const liveCourses = courses.filter(c => c.on_chain !== null);
 * console.log(`${liveCourses.length} courses are live on-chain`);
 * ```
 */
export async function getMergedCoursesList(): Promise<MergedCoursesListResponse> {
  return fetchGateway<MergedCoursesListResponse>("/api/v2/course/user/courses/list");
}

/**
 * Get a specific course with full merged details
 *
 * Endpoint: GET /api/v2/course/user/course/get/{policy_id}
 *
 * @param policyId - Course NFT Policy ID
 * @returns Course with combined DB metadata and on-chain state
 *
 * @example
 * ```typescript
 * const course = await getMergedCourse(courseNftPolicyId);
 * if (course.on_chain) {
 *   console.log(`Course has ${course.on_chain.modules.length} modules on-chain`);
 * }
 * ```
 */
export async function getMergedCourse(policyId: string): Promise<MergedCourseDetail | null> {
  try {
    return await fetchGateway<MergedCourseDetail>(
      `/api/v2/course/user/course/get/${policyId}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get a student's course status
 *
 * Endpoint: POST /api/v2/course/student/course-status
 *
 * @param courseId - Course NFT Policy ID
 * @param alias - Student's access token alias
 * @param jwt - Authentication JWT
 * @returns Student's enrollment and progress status
 *
 * @example
 * ```typescript
 * const status = await getStudentCourseStatus(courseId, alias, jwt);
 * if (status.is_enrolled) {
 *   console.log(`Completed ${status.completed_assignments.length} modules`);
 * }
 * ```
 */
export async function getStudentCourseStatus(
  courseId: string,
  alias: string,
  jwt: string
): Promise<MergedStudentCourseStatus | null> {
  try {
    return await fetchGatewayAuth<MergedStudentCourseStatus>(
      "/api/v2/course/student/course-status",
      jwt,
      {
        method: "POST",
        body: JSON.stringify({
          course_id: courseId,
          alias: alias,
        }),
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

// =============================================================================
// Merged Project Endpoints
// =============================================================================

/**
 * List all published projects with on-chain state
 *
 * Endpoint: GET /api/v2/project/user/projects/list
 *
 * Returns projects that have been published, with their on-chain state
 * merged in if they are live on the blockchain.
 *
 * @returns Array of projects with combined DB + on-chain data
 *
 * @example
 * ```typescript
 * const { projects } = await getMergedProjectsList();
 * const liveProjects = projects.filter(p => p.on_chain !== null);
 * console.log(`${liveProjects.length} projects are live on-chain`);
 * ```
 */
export async function getMergedProjectsList(): Promise<MergedProjectsListResponse> {
  return fetchGateway<MergedProjectsListResponse>("/api/v2/project/user/projects/list");
}

/**
 * Get a specific project with full merged details
 *
 * Endpoint: GET /api/v2/project/user/project/{project_id}
 *
 * @param projectId - Project NFT Policy ID
 * @returns Project with combined DB metadata and on-chain state
 *
 * @example
 * ```typescript
 * const project = await getMergedProject(projectNftPolicyId);
 * if (project.on_chain) {
 *   console.log(`Project has ${project.on_chain.tasks.length} tasks on-chain`);
 * }
 * ```
 */
export async function getMergedProject(projectId: string): Promise<MergedProjectDetail | null> {
  try {
    return await fetchGateway<MergedProjectDetail>(
      `/api/v2/project/user/project/${projectId}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get a contributor's project status
 *
 * Endpoint: GET /api/v2/project/contributor/status/{project_id}/{alias}
 *
 * @param projectId - Project NFT Policy ID
 * @param alias - Contributor's access token alias
 * @returns Contributor's status in the project
 *
 * @example
 * ```typescript
 * const status = await getContributorProjectStatus(projectId, alias);
 * if (status) {
 *   console.log(`Completed ${status.completed_tasks.length} tasks`);
 * }
 * ```
 */
export async function getContributorProjectStatus(
  projectId: string,
  alias: string
): Promise<MergedContributorStatus | null> {
  try {
    return await fetchGateway<MergedContributorStatus>(
      `/api/v2/project/contributor/status/${projectId}/${alias}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

// =============================================================================
// Owner Registration Endpoints (V2)
// =============================================================================

/**
 * Register an on-chain course that's not yet in the database
 *
 * Endpoint: POST /api/v2/course/owner/course/register
 *
 * When an owner sees an on-chain course that doesn't have a DB record,
 * this endpoint creates the DB entry. This can happen after migration
 * or if the course was created through another interface.
 *
 * @param jwt - User's JWT token
 * @param policyId - Course NFT Policy ID (on-chain identifier)
 * @param title - Title for the course in the database
 * @returns The newly registered course
 *
 * @example
 * ```typescript
 * const course = await registerCourse(jwt, onChainCourse.policy_id, "My Course");
 * console.log(`Registered course: ${course.id}`);
 * ```
 */
export async function registerCourse(
  jwt: string,
  policyId: string,
  title: string
): Promise<CourseResponse> {
  return fetchGatewayAuth<CourseResponse>(
    "/api/v2/course/owner/course/register",
    jwt,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_id: policyId, title }),
    }
  );
}

/**
 * Register an on-chain project that's not yet in the database
 *
 * Endpoint: POST /api/v2/project/owner/project/register
 *
 * When an owner sees an on-chain project that doesn't have a DB record,
 * this endpoint creates the DB entry.
 *
 * @param jwt - User's JWT token
 * @param policyId - Project State Policy ID (on-chain identifier)
 * @param title - Title for the project in the database
 * @returns The newly registered project
 *
 * @example
 * ```typescript
 * const project = await registerProject(jwt, onChainProject.policy_id, "My Project");
 * console.log(`Registered project: ${project.id}`);
 * ```
 */
export async function registerProject(
  jwt: string,
  policyId: string,
  title: string
): Promise<ProjectV2Output> {
  return fetchGatewayAuth<ProjectV2Output>(
    "/api/v2/project/owner/project/register",
    jwt,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policy_id: policyId, title }),
    }
  );
}
