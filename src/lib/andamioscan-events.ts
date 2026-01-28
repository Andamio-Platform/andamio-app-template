/**
 * Andamioscan Events & Essential Data
 *
 * Minimal client for Andamioscan API endpoints needed by sync utilities
 * and event-based transaction confirmation.
 *
 * For merged V2 API data, use the hooks in ~/hooks/api/ instead.
 *
 * @see .claude/skills/project-manager/ANDAMIOSCAN-EVENTS-CONFIRMATION.md
 */

import { indexerLogger } from "./debug-logger";

// =============================================================================
// API Client
// =============================================================================

const PROXY_BASE = "/api/gateway";

/**
 * Fetch wrapper with error handling for Andamioscan API
 */
async function fetchAndamioscan<T>(path: string): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as {
      details?: string;
    };
    throw new Error(
      `Andamioscan API error: ${response.status} ${response.statusText}` +
        (errorData.details ? ` - ${errorData.details}` : "")
    );
  }

  return response.json() as Promise<T>;
}

// =============================================================================
// Types - Project Data (needed by sync utilities)
// =============================================================================

/**
 * Asset token info (used in tasks, credentials)
 */
export type AndamioscanAsset = {
  policy_id: string;
  name: string;
  amount: string;
};

/**
 * On-chain task from project
 */
export type AndamioscanTask = {
  task_id: string;
  content: string;
  created_by: string;
  lovelace_amount: number;
  assets: AndamioscanAsset[];
  contributor_state_policy_id: string;
  expiration: string;
  expiration_posix: number;
};

/**
 * Nullable timestamp (used for deletedAt)
 */
type NullableTimestamp = {
  time: string;
  valid: boolean;
} | null;

/**
 * Task submission from a contributor
 */
export type AndamioscanSubmission = {
  id: number;
  project_id: string;
  alias: string;
  content: string;
  task: AndamioscanTask;
  slot: number;
  tx_hash: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: NullableTimestamp;
};

/**
 * Treasury funding event
 */
export type AndamioscanTreasuryFunding = {
  id: number;
  project_id: string;
  alias: string;
  lovelace_amount: number;
  slot: number;
  tx_hash: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: NullableTimestamp;
};

/**
 * Project prerequisite (course completion requirement)
 */
export type AndamioscanPrerequisite = {
  course_id: string;
  assignment_ids: string[];
  project_state_policy_id: string;
};

/**
 * Full project details from Andamioscan
 */
export type AndamioscanProjectDetails = {
  project_id: string;
  contributors: string[];
  tasks: AndamioscanTask[];
  submissions: AndamioscanSubmission[];
  assessments: unknown[];
  credential_claims: unknown[];
  treasury_fundings: AndamioscanTreasuryFunding[];
  prerequisites: AndamioscanPrerequisite[];
};

// =============================================================================
// Project Data Endpoints (needed by sync utilities)
// =============================================================================

/**
 * Get project details by ID
 *
 * Endpoint: GET /api/v2/projects/{project_id}/details
 *
 * @param projectId - Project NFT Policy ID
 * @returns Full project details or null if not found
 */
export async function getProject(
  projectId: string
): Promise<AndamioscanProjectDetails | null> {
  try {
    return await fetchAndamioscan<AndamioscanProjectDetails>(
      `/api/v2/projects/${projectId}/details`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Raw project from list endpoint
 */
type RawApiProjectListItem = {
  tx_hash: string;
  slot: number;
  project_id: string;
  admin: string;
  managers: string[];
  project_address: string;
  project_state_policy_id: string;
};

/**
 * On-chain project data from Andamioscan (normalized)
 */
export type AndamioscanProject = {
  project_id: string;
  project_address: string;
  project_state_policy_id: string;
  admin: string;
  managers: string[];
  tx_hash: string;
  slot: number;
};

/**
 * Get all projects a user is managing
 *
 * Endpoint: GET /api/v2/users/{alias}/projects/managing
 */
export async function getManagingProjects(
  alias: string
): Promise<AndamioscanProject[]> {
  try {
    const raw = await fetchAndamioscan<RawApiProjectListItem[]>(
      `/api/v2/users/${alias}/projects/managing`
    );
    return raw.map((project) => ({
      project_id: project.project_id,
      project_address: project.project_address,
      project_state_policy_id: project.project_state_policy_id,
      admin: project.admin,
      managers: project.managers,
      tx_hash: project.tx_hash,
      slot: project.slot,
    }));
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

// =============================================================================
// Types - Course Data (needed by eligibility and assignment page)
// =============================================================================

/**
 * Raw module data from API (nested structure)
 */
type RawApiModule = {
  assignment_id: string;
  module: {
    slts: string[];
    prerequisites: string[];
  };
  created_by: string;
};

/**
 * On-chain module data from Andamioscan (normalized)
 */
export type AndamioscanModule = {
  assignment_id: string;
  created_by: string;
  prerequisites: string[];
  slts: string[];
};

/**
 * Transform raw API module to normalized format
 */
function normalizeModule(raw: RawApiModule): AndamioscanModule {
  return {
    assignment_id: raw.assignment_id,
    created_by: raw.created_by,
    slts: raw.module.slts,
    prerequisites: raw.module.prerequisites,
  };
}

/**
 * Raw course details from API
 */
type RawApiCourseDetails = {
  course_id: string;
  course_address: string;
  course_state_policy_id: string;
  teachers: string[];
  modules: RawApiModule[];
  students: string[];
  past_students: string[];
};

/**
 * On-chain course data from Andamioscan (normalized)
 */
export type AndamioscanCourse = {
  course_id: string;
  course_address: string;
  course_state_policy_id: string;
  teachers: string[];
  modules: AndamioscanModule[];
  students?: string[];
  past_students?: string[];
};

/**
 * Get a specific course by ID with full details
 *
 * Endpoint: GET /api/v2/courses/{course_id}/details
 */
export async function getCourse(
  courseId: string
): Promise<AndamioscanCourse | null> {
  try {
    const raw = await fetchAndamioscan<RawApiCourseDetails>(
      `/api/v2/courses/${courseId}/details`
    );
    return {
      course_id: raw.course_id,
      course_address: raw.course_address,
      course_state_policy_id: raw.course_state_policy_id,
      teachers: raw.teachers,
      modules: raw.modules.map(normalizeModule),
      students: raw.students,
      past_students: raw.past_students,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

// =============================================================================
// Types - User/Student Data (needed by eligibility check)
// =============================================================================

/**
 * Raw student status from API
 */
type RawApiStudentStatus = {
  alias: string;
  course_id: string;
  completed_assignments: Array<{
    assignment_id: string;
    content: string;
  }>;
  current_assignment: string | { assignment_id: string; content: string } | null;
};

/**
 * On-chain student data from Andamioscan (normalized)
 */
export type AndamioscanStudent = {
  alias: string;
  course_id: string;
  current: string | null;
  currentContent: string | null;
  completed: string[];
};

/**
 * Get a specific student's enrollment status in a course
 *
 * Endpoint: GET /api/v2/courses/{course_id}/students/{alias}/status
 */
export async function getCourseStudent(
  courseId: string,
  alias: string
): Promise<AndamioscanStudent | null> {
  try {
    const raw = await fetchAndamioscan<RawApiStudentStatus>(
      `/api/v2/courses/${courseId}/students/${alias}/status`
    );

    let current: string | null = null;
    let currentContent: string | null = null;

    if (raw.current_assignment !== null) {
      if (typeof raw.current_assignment === "string") {
        current = raw.current_assignment;
      } else if (typeof raw.current_assignment === "object") {
        const assignment = raw.current_assignment as Record<string, unknown>;
        current = (assignment.assignment_id as string) ?? null;
        currentContent = (assignment.content as string) ?? null;
      }
    }

    return {
      alias: raw.alias,
      course_id: raw.course_id,
      current,
      currentContent,
      completed: raw.completed_assignments.map((a) => a.assignment_id),
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Raw user state from API
 */
type RawApiUserState = {
  alias: string;
  enrolled_courses: string[];
  completed_courses: Array<{
    course_id: string;
    claimed_credentials: string[];
  }>;
  joined_projects: string[];
  completed_projects: Array<{
    project_id: string;
    credentials: Array<{
      policy_id: string;
      name: string;
      amount: string;
    }>;
  }>;
};

/**
 * User's enrollment in a course (normalized)
 */
export type AndamioscanUserCourse = {
  course_id: string;
  is_enrolled: boolean;
  credential_id: string | null;
  credentials: string[];
};

/**
 * User's global on-chain state (normalized)
 */
export type AndamioscanUserGlobalState = {
  alias: string;
  courses: AndamioscanUserCourse[];
};

/**
 * Get a user's global on-chain state
 *
 * Endpoint: GET /api/v2/users/{alias}/state
 */
export async function getUserGlobalState(
  alias: string
): Promise<AndamioscanUserGlobalState> {
  const raw = await fetchAndamioscan<RawApiUserState>(
    `/api/v2/users/${alias}/state`
  );

  const courseMap = new Map<string, AndamioscanUserCourse>();

  for (const courseId of raw.enrolled_courses) {
    courseMap.set(courseId, {
      course_id: courseId,
      is_enrolled: true,
      credential_id: null,
      credentials: [],
    });
  }

  for (const completed of raw.completed_courses) {
    const existing = courseMap.get(completed.course_id);
    if (existing) {
      existing.credentials = completed.claimed_credentials;
      existing.credential_id = completed.claimed_credentials[0] ?? null;
    } else {
      courseMap.set(completed.course_id, {
        course_id: completed.course_id,
        is_enrolled: false,
        credential_id: completed.claimed_credentials[0] ?? null,
        credentials: completed.claimed_credentials,
      });
    }
  }

  return {
    alias: raw.alias,
    courses: Array.from(courseMap.values()),
  };
}

// =============================================================================
// Types - Contributor Status (needed by contributor page)
// =============================================================================

/**
 * Task submission info from contributor status
 */
export type AndamioscanTaskSubmission = {
  task_id: string;
  created_by: string;
  project_state_policy_id: string;
  content: string;
  expiration: string;
  expiration_posix: number;
  lovelace_amount: number;
  assets: AndamioscanAsset[];
};

/**
 * Contributor status in a project
 */
export type AndamioscanContributorStatus = {
  alias: string;
  project_id: string;
  joined_at: number;
  completed_tasks: string[];
  pending_tasks: string[];
  tasks_submitted: AndamioscanTaskSubmission[];
  tasks_accepted: AndamioscanTaskSubmission[];
  credentials: AndamioscanAsset[];
};

/**
 * Raw contributor status from API
 */
type RawApiContributorStatus = {
  alias: string;
  project_id: string;
  joined_at: number;
  tasks_submitted: AndamioscanTaskSubmission[];
  tasks_accepted: AndamioscanTaskSubmission[];
  claimed_credentials: AndamioscanAsset[];
};

/**
 * Get a contributor's status in a project
 *
 * Endpoint: GET /api/v2/projects/{project_id}/contributors/{alias}/status
 */
export async function getProjectContributorStatus(
  projectId: string,
  alias: string
): Promise<AndamioscanContributorStatus | null> {
  try {
    const raw = await fetchAndamioscan<RawApiContributorStatus>(
      `/api/v2/projects/${projectId}/contributors/${alias}/status`
    );
    return {
      alias: raw.alias,
      project_id: raw.project_id,
      joined_at: raw.joined_at,
      completed_tasks: (raw.tasks_accepted ?? []).map((t) => t.task_id),
      pending_tasks: (raw.tasks_submitted ?? []).map((t) => t.task_id),
      tasks_submitted: raw.tasks_submitted ?? [],
      tasks_accepted: raw.tasks_accepted ?? [],
      credentials: raw.claimed_credentials ?? [],
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

// =============================================================================
// Events API - Transaction Confirmation
// =============================================================================

/**
 * Task Submit Event from Andamioscan
 *
 * Returned when a PROJECT_CONTRIBUTOR_TASK_ACTION transaction is confirmed.
 */
export type AndamioscanTaskSubmitEvent = {
  tx_hash: string;
  slot: number;
  alias: string;
  project_id: string;
  task: AndamioscanTask;
  content: string;
};

/**
 * Mapping of transaction types to event endpoints
 */
export const TX_TO_EVENT_MAP: Record<string, string> = {
  // Global
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: "/api/v2/events/access-tokens/mint",

  // Course
  INSTANCE_COURSE_CREATE: "/api/v2/events/courses/create",
  COURSE_OWNER_TEACHERS_MANAGE: "/api/v2/events/teachers/update",
  COURSE_TEACHER_MODULES_MANAGE: "/api/v2/events/modules/manage",
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: "/api/v2/events/assessments/assess",
  COURSE_STUDENT_ASSIGNMENT_COMMIT: "/api/v2/events/enrollments/enroll",
  COURSE_STUDENT_ASSIGNMENT_UPDATE: "/api/v2/events/assignments/submit",
  COURSE_STUDENT_CREDENTIAL_CLAIM: "/api/v2/events/credential-claims/claim",

  // Project
  INSTANCE_PROJECT_CREATE: "/api/v2/events/projects/create",
  PROJECT_MANAGER_TASKS_MANAGE: "/api/v2/events/tasks/manage",
  PROJECT_MANAGER_TASKS_ASSESS: "/api/v2/events/tasks/assess",
  PROJECT_CONTRIBUTOR_TASK_COMMIT: "/api/v2/events/projects/join",
  PROJECT_CONTRIBUTOR_TASK_ACTION: "/api/v2/events/tasks/submit",
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: "/api/v2/events/credential-claims/project",
};

/**
 * Get Task Submit Event by transaction hash
 *
 * Endpoint: GET /api/v2/events/tasks/submit/{tx_hash}
 *
 * @param txHash - Transaction hash to check
 * @returns Event data if confirmed, null if not yet indexed
 */
export async function getTaskSubmitEvent(
  txHash: string
): Promise<AndamioscanTaskSubmitEvent | null> {
  try {
    return await fetchAndamioscan<AndamioscanTaskSubmitEvent>(
      `/api/v2/events/tasks/submit/${txHash}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Generic event fetcher for any transaction type
 *
 * @param txType - Transaction type from TX_TO_EVENT_MAP
 * @param txHash - Transaction hash to check
 * @returns Event data if confirmed, null if not yet indexed
 */
export async function getEventByTxType(
  txType: string,
  txHash: string
): Promise<unknown> {
  const eventPath = TX_TO_EVENT_MAP[txType];
  if (!eventPath) {
    indexerLogger.warn(`No event endpoint mapped for tx type: ${txType}`);
    return null;
  }

  try {
    return await fetchAndamioscan(`${eventPath}/${txHash}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Wait for transaction confirmation via Andamioscan Events API
 *
 * Polls the appropriate event endpoint until the transaction is confirmed
 * or the maximum number of attempts is reached.
 *
 * @param txType - Transaction type (e.g., "PROJECT_CONTRIBUTOR_TASK_ACTION")
 * @param txHash - Transaction hash to wait for
 * @param options - Polling options
 * @returns Event data if confirmed, null if timeout
 */
export async function waitForEventConfirmation(
  txType: string,
  txHash: string,
  options: {
    maxAttempts?: number;
    intervalMs?: number;
    onPoll?: (attempt: number) => void;
  } = {}
): Promise<unknown> {
  const { maxAttempts = 30, intervalMs = 2000, onPoll } = options;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    onPoll?.(attempt);

    const event = await getEventByTxType(txType, txHash);
    if (event) {
      indexerLogger.info(`Transaction confirmed after ${attempt} attempts`);
      return event;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  indexerLogger.warn(
    `Transaction confirmation timeout after ${maxAttempts} attempts`
  );
  return null;
}
