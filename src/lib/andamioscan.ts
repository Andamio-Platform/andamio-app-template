/**
 * Andamioscan API Client
 *
 * Provides typed access to Andamioscan V2 endpoints for on-chain course and user data.
 * Uses the Next.js API proxy at /api/andamioscan to avoid CORS issues.
 *
 * @see docs/sitemaps/andamioscan-api.md for full endpoint documentation
 */

// =============================================================================
// Types
// =============================================================================

/**
 * On-chain module data from Andamioscan
 */
export type AndamioscanModule = {
  /** Module hash (Blake2b-256 of SLTs) - matches computeSltHash() */
  assignment_id: string;
  /** Creator's access token alias */
  created_by: string;
  /** Prerequisite module hashes */
  prerequisites: string[];
  /** SLT content strings */
  slts: string[];
};

/**
 * On-chain course data from Andamioscan
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
};

/**
 * On-chain student data from Andamioscan
 */
export type AndamioscanStudent = {
  /** Student's access token alias */
  alias: string;
  /** Course ID they're enrolled in */
  course_id: string;
  /** Current assignment module hash (or null if none) */
  current: string | null;
  /** Array of completed module hashes */
  completed: string[];
};

/**
 * User's enrollment in a course
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
 * User's global on-chain state
 */
export type AndamioscanUserGlobalState = {
  /** User's access token alias */
  alias: string;
  /** Array of courses with enrollment/credential status */
  courses: AndamioscanUserCourse[];
};

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
 * Get all courses on-chain
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
  return fetchAndamioscan<AndamioscanCourse[]>("/v2/courses");
}

/**
 * Get a specific course by ID
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
    return await fetchAndamioscan<AndamioscanCourse>(`/v2/courses/${courseId}`);
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
 * @param courseId - Course NFT Policy ID
 * @returns Array of enrolled students
 *
 * @example
 * ```typescript
 * const students = await getCourseStudents(courseNftPolicyId);
 * const activeStudents = students.filter(s => s.current !== null);
 * ```
 */
export async function getCourseStudents(courseId: string): Promise<AndamioscanStudent[]> {
  return fetchAndamioscan<AndamioscanStudent[]>(`/v2/courses/${courseId}/students`);
}

/**
 * Get a specific student's enrollment in a course
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
    return await fetchAndamioscan<AndamioscanStudent>(
      `/v2/courses/${courseId}/students/${alias}`
    );
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
 * Get all user aliases on the platform
 *
 * @returns Array of all user aliases who have minted access tokens
 *
 * @example
 * ```typescript
 * const allUsers = await getAllUsers();
 * console.log(`${allUsers.length} users on platform`);
 * ```
 */
export async function getAllUsers(): Promise<string[]> {
  return fetchAndamioscan<string[]>("/v2/user/all");
}

/**
 * Get a user's global on-chain state
 *
 * @param alias - User's access token alias
 * @returns User's courses and credentials
 *
 * @example
 * ```typescript
 * const userState = await getUserGlobalState(alias);
 * const enrolledCourses = userState.courses.filter(c => c.is_enrolled);
 * const credentials = userState.courses.flatMap(c => c.credentials);
 * ```
 */
export async function getUserGlobalState(alias: string): Promise<AndamioscanUserGlobalState> {
  return fetchAndamioscan<AndamioscanUserGlobalState>(`/v2/user/global-state/${alias}`);
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
 * @param moduleHash - Module hash (from computeSltHash)
 * @returns true if module exists on-chain
 */
export async function isModuleOnChain(courseId: string, moduleHash: string): Promise<boolean> {
  const course = await getCourse(courseId);
  if (!course) return false;
  return course.modules.some((m) => m.assignment_id === moduleHash);
}

/**
 * Get all courses owned (taught) by a specific user
 *
 * A user "owns" a course if their alias appears in the course's teachers array.
 *
 * @param alias - User's access token alias
 * @returns Array of courses where the user is a teacher
 *
 * @example
 * ```typescript
 * const ownedCourses = await getCoursesOwnedByAlias("alice");
 * console.log(`Alice owns ${ownedCourses.length} courses on-chain`);
 * ```
 */
export async function getCoursesOwnedByAlias(alias: string): Promise<AndamioscanCourse[]> {
  const allCourses = await getAllCourses();
  return allCourses.filter((course) => course.teachers.includes(alias));
}
