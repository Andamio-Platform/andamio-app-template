/**
 * Andamioscan API Client
 *
 * Provides typed access to Andamioscan V2 endpoints for on-chain course and user data.
 * Uses the Next.js API proxy at /api/andamioscan to avoid CORS issues.
 *
 * API Base: https://preprod.andamioscan.io/api
 *
 * @see .claude/skills/project-manager/andamioscan-api.md for full endpoint documentation
 */

// =============================================================================
// Types - Raw API Response Types
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
 * Raw student status from API
 * Note: current_assignment can be either a string (hash) or an object with assignment_id
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

// =============================================================================
// Types - Normalized Types (for app consumption)
// =============================================================================

/**
 * On-chain module data from Andamioscan (normalized)
 */
export type AndamioscanModule = {
  /** Module hash (Blake2b-256 of SLTs) - matches computeSltHashDefinite() */
  assignment_id: string;
  /** Creator's access token alias */
  created_by: string;
  /** Prerequisite module hashes */
  prerequisites: string[];
  /** SLT content strings */
  slts: string[];
};

/**
 * On-chain course data from Andamioscan (normalized)
 */
export type AndamioscanCourse = {
  /** Course identifier (NFT policy ID) */
  course_id: string;
  /** Course script address */
  course_address: string;
  /** Course state token policy ID */
  course_state_policy_id: string;
  /** Array of teacher aliases */
  teachers: string[];
  /** Array of on-chain modules */
  modules: AndamioscanModule[];
  /** Array of enrolled student aliases (from details endpoint) */
  students?: string[];
  /** Array of past student aliases (from details endpoint) */
  past_students?: string[];
};

/**
 * On-chain student data from Andamioscan (normalized)
 */
export type AndamioscanStudent = {
  /** Student's access token alias */
  alias: string;
  /** Course ID they're enrolled in */
  course_id: string;
  /** Current assignment module hash (or null if none) */
  current: string | null;
  /** Current assignment evidence content (if available) */
  currentContent: string | null;
  /** Array of completed module hashes */
  completed: string[];
};

/**
 * User's enrollment in a course (normalized)
 */
export type AndamioscanUserCourse = {
  /** Course NFT Policy ID */
  course_id: string;
  /** Whether user is currently enrolled */
  is_enrolled: boolean;
  /** Credential token ID if earned (or null) */
  credential_id: string | null;
  /** All credentials earned in this course */
  credentials: string[];
};

/**
 * User's global on-chain state (normalized)
 */
export type AndamioscanUserGlobalState = {
  /** User's access token alias */
  alias: string;
  /** Array of courses with enrollment/credential status */
  courses: AndamioscanUserCourse[];
};

// =============================================================================
// Transform Functions
// =============================================================================

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
 * Transform raw API course details to normalized format
 */
function normalizeCourseDetails(raw: RawApiCourseDetails): AndamioscanCourse {
  return {
    course_id: raw.course_id,
    course_address: raw.course_address,
    course_state_policy_id: raw.course_state_policy_id,
    teachers: raw.teachers,
    modules: raw.modules.map(normalizeModule),
    students: raw.students,
    past_students: raw.past_students,
  };
}

/**
 * Transform raw API student status to normalized format
 */
function normalizeStudentStatus(raw: RawApiStudentStatus): AndamioscanStudent {
  // Handle current_assignment being either a string or an object
  let current: string | null = null;
  let currentContent: string | null = null;

  if (raw.current_assignment !== null) {
    if (typeof raw.current_assignment === "string") {
      current = raw.current_assignment;
    } else if (typeof raw.current_assignment === "object") {
      // It's an object - extract assignment_id and content
      const assignment = raw.current_assignment as Record<string, unknown>;
      current = (assignment.assignment_id as string) ?? null;
      // Content is hex-encoded evidence hash from on-chain
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
}

/**
 * Transform raw API user state to normalized format
 */
function normalizeUserState(raw: RawApiUserState): AndamioscanUserGlobalState {
  // Build courses array from enrolled and completed courses
  const courseMap = new Map<string, AndamioscanUserCourse>();

  // Add enrolled courses
  for (const courseId of raw.enrolled_courses) {
    courseMap.set(courseId, {
      course_id: courseId,
      is_enrolled: true,
      credential_id: null,
      credentials: [],
    });
  }

  // Add/update completed courses with credentials
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
// API Client
// =============================================================================

const PROXY_BASE = "/api/andamioscan";

/**
 * Fetch wrapper with error handling for Andamioscan API
 */
async function fetchAndamioscan<T>(path: string): Promise<T> {
  const url = `${PROXY_BASE}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { details?: string };
    throw new Error(
      `Andamioscan API error: ${response.status} ${response.statusText}` +
        (errorData.details ? ` - ${errorData.details}` : "")
    );
  }

  return response.json() as Promise<T>;
}

// =============================================================================
// Course Endpoints
// =============================================================================

/**
 * Raw course from list endpoint (simpler structure than details)
 */
type RawApiCourseListItem = {
  tx_hash: string;
  slot: number;
  course_id: string;
  admin: string;
  teachers: string[];
  course_address: string;
  course_state_policy_id: string;
};

/**
 * Get all courses on-chain
 *
 * Endpoint: GET /api/v2/courses
 *
 * @returns Array of all courses indexed from blockchain
 *
 * @example
 * ```typescript
 * const courses = await getAllCourses();
 * console.log(`Found ${courses.length} courses on-chain`);
 * ```
 */
export async function getAllCourses(): Promise<AndamioscanCourse[]> {
  const raw = await fetchAndamioscan<RawApiCourseListItem[]>("/v2/courses");
  // List endpoint doesn't include modules - return basic course info
  return raw.map((course) => ({
    course_id: course.course_id,
    course_address: course.course_address,
    course_state_policy_id: course.course_state_policy_id,
    teachers: course.teachers,
    modules: [], // Not available in list endpoint
  }));
}

/**
 * Get a specific course by ID with full details
 *
 * Endpoint: GET /api/v2/courses/{course_id}/details
 *
 * @param courseId - Course NFT Policy ID
 * @returns Course data or null if not found
 *
 * @example
 * ```typescript
 * const course = await getCourse(courseNftPolicyId);
 * if (course) {
 *   console.log(`Course has ${course.modules.length} modules on-chain`);
 * }
 * ```
 */
export async function getCourse(courseId: string): Promise<AndamioscanCourse | null> {
  try {
    const raw = await fetchAndamioscan<RawApiCourseDetails>(
      `/v2/courses/${courseId}/details`
    );
    return normalizeCourseDetails(raw);
  } catch (error) {
    // Return null for 404s, rethrow other errors
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get all students enrolled in a course
 *
 * Note: The API doesn't have a separate students list endpoint.
 * This uses the course details endpoint which includes students.
 *
 * @param courseId - Course NFT Policy ID
 * @returns Array of student aliases (not full student objects)
 *
 * @example
 * ```typescript
 * const studentAliases = await getCourseStudents(courseNftPolicyId);
 * console.log(`${studentAliases.length} students enrolled`);
 * ```
 */
export async function getCourseStudents(courseId: string): Promise<string[]> {
  const course = await getCourse(courseId);
  return course?.students ?? [];
}

/**
 * Get a specific student's enrollment status in a course
 *
 * Endpoint: GET /api/v2/courses/{course_id}/students/{alias}/status
 *
 * @param courseId - Course NFT Policy ID
 * @param alias - Student's access token alias
 * @returns Student data or null if not found
 *
 * @example
 * ```typescript
 * const student = await getCourseStudent(courseId, userAlias);
 * if (student) {
 *   console.log(`Completed ${student.completed.length} modules`);
 * }
 * ```
 */
export async function getCourseStudent(
  courseId: string,
  alias: string
): Promise<AndamioscanStudent | null> {
  try {
    const raw = await fetchAndamioscan<RawApiStudentStatus>(
      `/v2/courses/${courseId}/students/${alias}/status`
    );
    return normalizeStudentStatus(raw);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

// =============================================================================
// User Endpoints
// =============================================================================

/**
 * Get a user's global on-chain state
 *
 * Endpoint: GET /api/v2/users/{alias}/state
 *
 * @param alias - User's access token alias
 * @returns User's courses and credentials (normalized)
 *
 * @example
 * ```typescript
 * const userState = await getUserGlobalState(alias);
 * const enrolledCourses = userState.courses.filter(c => c.is_enrolled);
 * const credentials = userState.courses.flatMap(c => c.credentials);
 * ```
 */
export async function getUserGlobalState(alias: string): Promise<AndamioscanUserGlobalState> {
  const raw = await fetchAndamioscan<RawApiUserState>(`/v2/users/${alias}/state`);
  return normalizeUserState(raw);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Check if a user is enrolled in a specific course
 *
 * @param alias - User's access token alias
 * @param courseId - Course NFT Policy ID
 * @returns true if enrolled, false otherwise
 */
export async function isUserEnrolled(alias: string, courseId: string): Promise<boolean> {
  try {
    const userState = await getUserGlobalState(alias);
    const course = userState.courses.find((c) => c.course_id === courseId);
    return course?.is_enrolled ?? false;
  } catch {
    return false;
  }
}

/**
 * Get all credentials a user has earned
 *
 * @param alias - User's access token alias
 * @returns Array of credential info with course IDs
 */
export async function getUserCredentials(
  alias: string
): Promise<Array<{ courseId: string; credentials: string[] }>> {
  const userState = await getUserGlobalState(alias);
  return userState.courses
    .filter((c) => c.credentials.length > 0)
    .map((c) => ({
      courseId: c.course_id,
      credentials: c.credentials,
    }));
}

/**
 * Check if a module exists on-chain for a course
 *
 * @param courseId - Course NFT Policy ID
 * @param moduleHash - Module hash (from computeSltHashDefinite)
 * @returns true if module exists on-chain
 */
export async function isModuleOnChain(courseId: string, moduleHash: string): Promise<boolean> {
  const course = await getCourse(courseId);
  if (!course) return false;
  return course.modules.some((m) => m.assignment_id === moduleHash);
}

/**
 * Get all courses taught by a specific user
 *
 * Endpoint: GET /api/v2/users/{alias}/courses/teaching
 *
 * Note: This returns basic course info without modules. To get module counts,
 * you need to call getCourse() for each course individually.
 *
 * @param alias - User's access token alias
 * @returns Array of courses where the user is a teacher (without module details)
 *
 * @example
 * ```typescript
 * const teachingCourses = await getCoursesOwnedByAlias("alice");
 * console.log(`Alice teaches ${teachingCourses.length} courses on-chain`);
 * ```
 */
export async function getCoursesOwnedByAlias(alias: string): Promise<AndamioscanCourse[]> {
  const raw = await fetchAndamioscan<RawApiCourseListItem[]>(
    `/v2/users/${alias}/courses/teaching`
  );
  return raw.map((course) => ({
    course_id: course.course_id,
    course_address: course.course_address,
    course_state_policy_id: course.course_state_policy_id,
    teachers: course.teachers,
    modules: [], // Not available in list endpoint - use getCourse() for details
  }));
}

/**
 * Get all courses a user is enrolled in
 *
 * Endpoint: GET /api/v2/users/{alias}/courses/enrolled
 *
 * Note: This returns basic course info without modules. To get module counts,
 * you need to call getCourse() for each course individually.
 *
 * @param alias - User's access token alias
 * @returns Array of courses the user is enrolled in (without module details)
 *
 * @example
 * ```typescript
 * const enrolledCourses = await getEnrolledCourses("alice");
 * console.log(`Alice is enrolled in ${enrolledCourses.length} courses on-chain`);
 * ```
 */
export async function getEnrolledCourses(alias: string): Promise<AndamioscanCourse[]> {
  try {
    const raw = await fetchAndamioscan<RawApiCourseListItem[]>(
      `/v2/users/${alias}/courses/enrolled`
    );
    return raw.map((course) => ({
      course_id: course.course_id,
      course_address: course.course_address,
      course_state_policy_id: course.course_state_policy_id,
      teachers: course.teachers,
      modules: [], // Not available in list endpoint - use getCourse() for details
    }));
  } catch (error) {
    // Return empty array for 404s (no enrolled courses)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all courses a user has completed
 *
 * Endpoint: GET /api/v2/users/{alias}/courses/completed
 *
 * Note: This returns basic course info without modules. To get module counts,
 * you need to call getCourse() for each course individually.
 *
 * @param alias - User's access token alias
 * @returns Array of courses the user has completed (without module details)
 *
 * @example
 * ```typescript
 * const completedCourses = await getCompletedCourses("alice");
 * console.log(`Alice has completed ${completedCourses.length} courses on-chain`);
 * ```
 */
export async function getCompletedCourses(alias: string): Promise<AndamioscanCourse[]> {
  try {
    const raw = await fetchAndamioscan<RawApiCourseListItem[]>(
      `/v2/users/${alias}/courses/completed`
    );
    return raw.map((course) => ({
      course_id: course.course_id,
      course_address: course.course_address,
      course_state_policy_id: course.course_state_policy_id,
      teachers: course.teachers,
      modules: [], // Not available in list endpoint - use getCourse() for details
    }));
  } catch (error) {
    // Return empty array for 404s (no completed courses)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all courses a user owns (created/is admin of)
 *
 * Endpoint: GET /api/v2/users/{alias}/courses/owned
 *
 * Note: This is different from courses/teaching - owned means the user is the
 * admin/creator of the course, not just listed as a teacher.
 *
 * @param alias - User's access token alias
 * @returns Array of courses the user owns (without module details)
 *
 * @example
 * ```typescript
 * const ownedCourses = await getOwnedCourses("alice");
 * console.log(`Alice owns ${ownedCourses.length} courses on-chain`);
 * ```
 */
export async function getOwnedCourses(alias: string): Promise<AndamioscanCourse[]> {
  try {
    const raw = await fetchAndamioscan<RawApiCourseListItem[]>(
      `/v2/users/${alias}/courses/owned`
    );
    return raw.map((course) => ({
      course_id: course.course_id,
      course_address: course.course_address,
      course_state_policy_id: course.course_state_policy_id,
      teachers: course.teachers,
      modules: [], // Not available in list endpoint - use getCourse() for details
    }));
  } catch (error) {
    // Return empty array for 404s (no owned courses)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all courses taught by a user with full details (including modules)
 *
 * This fetches the list of teaching courses, then fetches details for each.
 * More expensive but includes module data.
 *
 * @param alias - User's access token alias
 * @returns Array of courses with full details including modules
 */
export async function getCoursesOwnedByAliasWithDetails(
  alias: string
): Promise<AndamioscanCourse[]> {
  const basicCourses = await getCoursesOwnedByAlias(alias);
  const detailedCourses = await Promise.all(
    basicCourses.map((c) => getCourse(c.course_id))
  );
  return detailedCourses.filter((c): c is AndamioscanCourse => c !== null);
}

/**
 * Get all courses a user can use as prerequisites (owner OR teacher)
 *
 * This fetches both owned courses (admin) and teaching courses, deduplicates them,
 * and fetches full details including modules.
 *
 * @param alias - User's access token alias
 * @returns Array of courses with full details including modules
 *
 * @example
 * ```typescript
 * const courses = await getTeachableCoursesWithDetails("alice");
 * // Returns courses where Alice is either the owner/admin OR a teacher
 * ```
 */
export async function getTeachableCoursesWithDetails(
  alias: string
): Promise<AndamioscanCourse[]> {
  // Fetch both owned and teaching courses in parallel
  const [ownedCourses, teachingCourses] = await Promise.all([
    getOwnedCourses(alias),
    getCoursesOwnedByAlias(alias),
  ]);

  // Deduplicate by course_id (user could be both owner and teacher)
  const uniqueCourseIds = new Set<string>();
  const allCourses: AndamioscanCourse[] = [];

  for (const course of [...ownedCourses, ...teachingCourses]) {
    if (!uniqueCourseIds.has(course.course_id)) {
      uniqueCourseIds.add(course.course_id);
      allCourses.push(course);
    }
  }

  // Fetch full details for each unique course
  const detailedCourses = await Promise.all(
    allCourses.map((c) => getCourse(c.course_id))
  );

  return detailedCourses.filter((c): c is AndamioscanCourse => c !== null);
}

// =============================================================================
// Teacher Endpoints
// =============================================================================

/**
 * Pending assessment data from Andamioscan
 */
export type AndamioscanPendingAssessment = {
  /** Course NFT Policy ID */
  course_id: string;
  /** Assignment/Module hash */
  assignment_id: string;
  /** Student's access token alias */
  student_alias: string;
  /** Transaction hash of the submission */
  submission_tx_hash: string;
  /** Slot number when submission occurred */
  submission_slot: number;
  /** Submission content/evidence */
  content: string;
};

/**
 * Get pending assessments for a teacher
 *
 * Endpoint: GET /api/v2/courses/teachers/{alias}/assessments/pending
 *
 * @param alias - Teacher's access token alias
 * @returns Array of pending assessments awaiting teacher review
 *
 * @example
 * ```typescript
 * const pending = await getPendingAssessments(teacherAlias);
 * console.log(`${pending.length} assignments awaiting review`);
 * ```
 */
export async function getPendingAssessments(
  alias: string
): Promise<AndamioscanPendingAssessment[]> {
  try {
    return await fetchAndamioscan<AndamioscanPendingAssessment[]>(
      `/v2/courses/teachers/${alias}/assessments/pending`
    );
  } catch (error) {
    // Return empty array for 404s (no pending assessments)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

// =============================================================================
// Project Endpoints
// =============================================================================

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
  /** Project identifier (NFT policy ID) */
  project_id: string;
  /** Project script address */
  project_address: string;
  /** Project state token policy ID */
  project_state_policy_id: string;
  /** Admin alias (creator) */
  admin: string;
  /** Array of manager aliases */
  managers: string[];
  /** Transaction hash when project was created */
  tx_hash: string;
  /** Slot number when project was created */
  slot: number;
};

/**
 * Get all projects on-chain
 *
 * Endpoint: GET /api/v2/projects
 *
 * @returns Array of all projects indexed from blockchain
 *
 * @example
 * ```typescript
 * const projects = await getAllProjects();
 * console.log(`Found ${projects.length} projects on-chain`);
 * ```
 */
export async function getAllProjects(): Promise<AndamioscanProject[]> {
  try {
    const raw = await fetchAndamioscan<RawApiProjectListItem[]>("/v2/projects");
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
    // Return empty array for 404s (no projects)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Project Details Types
// -----------------------------------------------------------------------------

/**
 * Asset token info (used in tasks, credentials)
 */
export type AndamioscanAsset = {
  policy_id: string;
  name: string;
  amount: string;
};

/**
 * Nullable timestamp (used for deletedAt)
 */
type NullableTimestamp = {
  time: string;
  valid: boolean;
} | null;

/**
 * On-chain task from project
 */
export type AndamioscanTask = {
  task_id: string;
  content: string;
  created_by: string;
  lovelace: number;
  assets: AndamioscanAsset[];
  contributor_state_policy_id: string;
  expiration: string;
  expiration_posix: number;
};

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
 * Assessment decision
 */
export type AndamioscanAssessmentDecision = {
  contributor_alias: string;
  decision: "Accept" | "Reject";
};

/**
 * Task assessment by manager
 */
export type AndamioscanAssessment = {
  id: number;
  project_id: string;
  alias: string;
  task: AndamioscanTask;
  assessments: AndamioscanAssessmentDecision[];
  slot: number;
  tx_hash: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: NullableTimestamp;
};

/**
 * Credential claim by contributor
 */
export type AndamioscanCredentialClaim = {
  id: number;
  project_id: string;
  alias: string;
  credential_id: string;
  credentials: AndamioscanAsset[];
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
  lovelace: number;
  slot: number;
  tx_hash: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: NullableTimestamp;
};

/**
 * Project prerequisite (course completion requirement)
 * @see https://github.com/Andamio-Platform/andamioscan/issues/10
 */
export type AndamioscanPrerequisite = {
  course_id: string;
  assignment_ids: string[];
  /** Added in issue #10 - the project state policy ID for this prerequisite set */
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
  assessments: AndamioscanAssessment[];
  credential_claims: AndamioscanCredentialClaim[];
  treasury_fundings: AndamioscanTreasuryFunding[];
  prerequisites: AndamioscanPrerequisite[];
};

/**
 * Get project details by ID
 *
 * Endpoint: GET /api/v2/projects/{project_id}/details
 *
 * @param projectId - Project NFT Policy ID
 * @returns Full project details or null if not found
 *
 * @example
 * ```typescript
 * const project = await getProject(projectId);
 * if (project) {
 *   console.log(`Project has ${project.tasks.length} tasks`);
 *   console.log(`${project.contributors.length} contributors`);
 * }
 * ```
 */
export async function getProject(projectId: string): Promise<AndamioscanProjectDetails | null> {
  try {
    return await fetchAndamioscan<AndamioscanProjectDetails>(
      `/v2/projects/${projectId}/details`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null;
    }
    throw error;
  }
}

/**
 * Get all projects a user is contributing to
 *
 * Endpoint: GET /api/v2/users/{alias}/projects/contributing
 *
 * @param alias - User's access token alias
 * @returns Array of projects the user is contributing to
 *
 * @example
 * ```typescript
 * const projects = await getContributingProjects("alice");
 * console.log(`Alice is contributing to ${projects.length} projects`);
 * ```
 */
export async function getContributingProjects(alias: string): Promise<AndamioscanProject[]> {
  try {
    const raw = await fetchAndamioscan<RawApiProjectListItem[]>(
      `/v2/users/${alias}/projects/contributing`
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
    // Return empty array for 404s (no contributing projects)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all projects a user is managing
 *
 * Endpoint: GET /api/v2/users/{alias}/projects/managing
 *
 * @param alias - User's access token alias
 * @returns Array of projects the user is a manager of
 *
 * @example
 * ```typescript
 * const projects = await getManagingProjects("alice");
 * console.log(`Alice is managing ${projects.length} projects`);
 * ```
 */
export async function getManagingProjects(alias: string): Promise<AndamioscanProject[]> {
  try {
    const raw = await fetchAndamioscan<RawApiProjectListItem[]>(
      `/v2/users/${alias}/projects/managing`
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
    // Return empty array for 404s (no managing projects)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all projects a user owns (created/is admin of)
 *
 * Endpoint: GET /api/v2/users/{alias}/projects/owned
 *
 * @param alias - User's access token alias
 * @returns Array of projects the user owns
 *
 * @example
 * ```typescript
 * const projects = await getOwnedProjects("alice");
 * console.log(`Alice owns ${projects.length} projects`);
 * ```
 */
export async function getOwnedProjects(alias: string): Promise<AndamioscanProject[]> {
  try {
    const raw = await fetchAndamioscan<RawApiProjectListItem[]>(
      `/v2/users/${alias}/projects/owned`
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
    // Return empty array for 404s (no owned projects)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all projects a user has completed (earned credentials)
 *
 * Endpoint: GET /api/v2/users/{alias}/projects/completed
 *
 * @param alias - User's access token alias
 * @returns Array of projects the user has completed
 *
 * @example
 * ```typescript
 * const projects = await getCompletedProjects("alice");
 * console.log(`Alice has completed ${projects.length} projects`);
 * ```
 */
export async function getCompletedProjects(alias: string): Promise<AndamioscanProject[]> {
  try {
    const raw = await fetchAndamioscan<RawApiProjectListItem[]>(
      `/v2/users/${alias}/projects/completed`
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
    // Return empty array for 404s (no completed projects)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
    }
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Project Contributor Status
// -----------------------------------------------------------------------------

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
  lovelace: number;
  assets: AndamioscanAsset[];
};

/**
 * Contributor status in a project
 */
export type AndamioscanContributorStatus = {
  /** Contributor's access token alias */
  alias: string;
  /** Project ID */
  project_id: string;
  /** When the contributor joined (slot) */
  joined_at: number;
  /** Completed task IDs */
  completed_tasks: string[];
  /** Pending submission task IDs (awaiting assessment) */
  pending_tasks: string[];
  /** Full pending task submission data */
  tasks_submitted: AndamioscanTaskSubmission[];
  /** Full accepted task data */
  tasks_accepted: AndamioscanTaskSubmission[];
  /** Credentials earned from this project */
  credentials: AndamioscanAsset[];
};

/**
 * Task submission from contributor status API
 */
type RawApiTaskSubmission = {
  task_id: string;
  created_by: string;
  project_state_policy_id: string;
  content: string;
  expiration: string;
  expiration_posix: number;
  lovelace: number;
  assets: AndamioscanAsset[];
};

/**
 * Raw contributor status from API
 * Note: API uses tasks_submitted/tasks_accepted, not pending_submissions/completed_tasks
 */
type RawApiContributorStatus = {
  alias: string;
  project_id: string;
  joined_at: number;
  tasks_submitted: RawApiTaskSubmission[];
  tasks_accepted: RawApiTaskSubmission[];
  claimed_credentials: AndamioscanAsset[];
};

/**
 * Get a contributor's status in a project
 *
 * Endpoint: GET /api/v2/projects/{project_id}/contributors/{alias}/status
 *
 * @param projectId - Project NFT Policy ID
 * @param alias - Contributor's access token alias
 * @returns Contributor status or null if not found
 *
 * @example
 * ```typescript
 * const status = await getProjectContributorStatus(projectId, userAlias);
 * if (status) {
 *   console.log(`Completed ${status.completed_tasks.length} tasks`);
 * }
 * ```
 */
export async function getProjectContributorStatus(
  projectId: string,
  alias: string
): Promise<AndamioscanContributorStatus | null> {
  try {
    const raw = await fetchAndamioscan<RawApiContributorStatus>(
      `/v2/projects/${projectId}/contributors/${alias}/status`
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

// -----------------------------------------------------------------------------
// Manager Endpoints
// -----------------------------------------------------------------------------

/**
 * Pending project assessment data from Andamioscan
 */
export type AndamioscanProjectPendingAssessment = {
  /** Project NFT Policy ID */
  project_id: string;
  /** Task ID (may be empty from API - use task_lovelace/task_content to match) */
  task_id: string;
  /** Task lovelace amount (for matching to known tasks) */
  task_lovelace: number;
  /** Task content hex (for matching to known tasks) */
  task_content: string;
  /** Contributor's access token alias */
  contributor_alias: string;
  /** Submission content/evidence */
  content: string;
  /** Transaction hash of the submission */
  submission_tx_hash: string;
  /** Slot number when submission occurred (0 if not available) */
  submission_slot: number;
};

/**
 * Raw task object from pending assessment API
 * Note: task_id is often empty in this response - match by lovelace/content instead
 */
type RawApiPendingAssessmentTask = {
  task_id: string;
  content: string;
  lovelace: number;
  expiration: string;
  expiration_posix: number;
};

/**
 * Raw pending assessment from API
 * Note: task.task_id is often empty - use lovelace/content to match
 */
type RawApiProjectPendingAssessment = {
  project_id: string;
  task: RawApiPendingAssessmentTask;
  submitted_by: string;
  submission_tx_hash: string;
  content: string;
};

/**
 * Get pending assessments for a project manager
 *
 * Endpoint: GET /api/v2/projects/managers/{alias}/assessments/pending
 *
 * @param alias - Manager's access token alias
 * @returns Array of pending assessments awaiting manager review
 *
 * @example
 * ```typescript
 * const pending = await getManagerPendingAssessments(managerAlias);
 * console.log(`${pending.length} task submissions awaiting review`);
 * ```
 */
export async function getManagerPendingAssessments(
  alias: string
): Promise<AndamioscanProjectPendingAssessment[]> {
  try {
    const raw = await fetchAndamioscan<RawApiProjectPendingAssessment[]>(
      `/v2/projects/managers/${alias}/assessments/pending`
    );
    return raw.map((assessment) => ({
      project_id: assessment.project_id,
      // task_id may be empty - consumer should match by lovelace/content
      task_id: assessment.task?.task_id ?? "",
      task_lovelace: assessment.task?.lovelace ?? 0,
      task_content: assessment.task?.content ?? "",
      contributor_alias: assessment.submitted_by,
      content: assessment.content,
      submission_tx_hash: assessment.submission_tx_hash,
      submission_slot: 0, // Not available in this API response
    }));
  } catch (error) {
    // Return empty array for 404s (no pending assessments)
    if (error instanceof Error && error.message.includes("404")) {
      return [];
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
 * Used to verify transaction confirmation instead of Koios polling.
 *
 * @see .claude/skills/project-manager/ANDAMIOSCAN-EVENTS-CONFIRMATION.md
 */
export type AndamioscanTaskSubmitEvent = {
  /** Transaction hash */
  tx_hash: string;
  /** Slot number when confirmed */
  slot: number;
  /** Contributor's access token alias */
  alias: string;
  /** Project NFT Policy ID (may be empty in some responses) */
  project_id: string;
  /** Task data */
  task: AndamioscanTask;
  /** Submission content (evidence hash, hex-encoded) */
  content: string;
};

// NOTE: Additional event types (ProjectJoin, TaskAssess, ProjectCredentialClaim)
// will be added after team alignment on the pattern.
// See .claude/skills/project-manager/ANDAMIOSCAN-EVENTS-CONFIRMATION.md for full mapping.

/**
 * Mapping of transaction types to event endpoints
 *
 * Used by waitForEventConfirmation to determine which endpoint to poll.
 */
export const TX_TO_EVENT_MAP: Record<string, string> = {
  // Global
  GLOBAL_GENERAL_ACCESS_TOKEN_MINT: "/v2/events/access-tokens/mint",

  // Course
  INSTANCE_COURSE_CREATE: "/v2/events/courses/create",
  COURSE_OWNER_TEACHERS_MANAGE: "/v2/events/teachers/update",
  COURSE_TEACHER_MODULES_MANAGE: "/v2/events/modules/manage",
  COURSE_TEACHER_ASSIGNMENTS_ASSESS: "/v2/events/assessments/assess",
  COURSE_STUDENT_ASSIGNMENT_COMMIT: "/v2/events/enrollments/enroll",
  COURSE_STUDENT_ASSIGNMENT_UPDATE: "/v2/events/assignments/submit",
  COURSE_STUDENT_CREDENTIAL_CLAIM: "/v2/events/credential-claims/claim",

  // Project
  INSTANCE_PROJECT_CREATE: "/v2/events/projects/create",
  PROJECT_MANAGER_TASKS_MANAGE: "/v2/events/tasks/manage",
  PROJECT_MANAGER_TASKS_ASSESS: "/v2/events/tasks/assess",
  PROJECT_CONTRIBUTOR_TASK_COMMIT: "/v2/events/projects/join",
  PROJECT_CONTRIBUTOR_TASK_ACTION: "/v2/events/tasks/submit",
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM: "/v2/events/credential-claims/project",
};

/**
 * Get Task Submit Event by transaction hash
 *
 * Endpoint: GET /api/v2/events/tasks/submit/{tx_hash}
 *
 * @param txHash - Transaction hash to check
 * @returns Event data if confirmed, null if not yet indexed
 *
 * @example
 * ```typescript
 * const event = await getTaskSubmitEvent(txHash);
 * if (event) {
 *   console.log(`Task ${event.task.task_id} confirmed at slot ${event.slot}`);
 * }
 * ```
 */
export async function getTaskSubmitEvent(
  txHash: string
): Promise<AndamioscanTaskSubmitEvent | null> {
  try {
    return await fetchAndamioscan<AndamioscanTaskSubmitEvent>(
      `/v2/events/tasks/submit/${txHash}`
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return null; // Not confirmed yet
    }
    throw error;
  }
}

// NOTE: Additional event fetch functions (getProjectJoinEvent, getTaskAssessEvent, etc.)
// will be added after team alignment on the pattern.

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
    console.warn(`[andamioscan] No event endpoint mapped for tx type: ${txType}`);
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
 *
 * @example
 * ```typescript
 * const event = await waitForEventConfirmation(
 *   "PROJECT_CONTRIBUTOR_TASK_ACTION",
 *   txHash,
 *   { maxAttempts: 30, intervalMs: 2000 }
 * );
 * if (event) {
 *   console.log("Transaction confirmed!");
 * }
 * ```
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
      console.log(`[andamioscan] Transaction confirmed after ${attempt} attempts`);
      return event;
    }

    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
  }

  console.warn(`[andamioscan] Transaction confirmation timeout after ${maxAttempts} attempts`);
  return null;
}
