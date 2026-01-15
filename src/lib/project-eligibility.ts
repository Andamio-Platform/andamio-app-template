/**
 * Project Eligibility Checker
 *
 * Determines if a user meets the prerequisites to contribute to a project.
 * Prerequisites are course modules that must be completed before joining.
 */

import {
  getProject,
  getUserGlobalState,
  getCourseStudent,
  type AndamioscanPrerequisite,
} from "~/lib/andamioscan";

/**
 * Missing prerequisite info for UI display
 */
export interface MissingPrerequisite {
  courseId: string;
  requiredModules: string[];
  completedModules: string[];
  missingModules: string[];
}

/**
 * Eligibility check result
 */
export interface EligibilityResult {
  /** Whether user meets all prerequisites */
  eligible: boolean;
  /** Prerequisites that are not yet met */
  missingPrerequisites: MissingPrerequisite[];
  /** Total modules required across all prerequisite courses */
  totalRequired: number;
  /** Total modules user has completed that count toward prerequisites */
  totalCompleted: number;
  /** Raw project prerequisites for reference */
  prerequisites: AndamioscanPrerequisite[];
}

/**
 * Check if a user meets the prerequisites for a project
 *
 * @param projectId - Project NFT Policy ID
 * @param userAlias - User's access token alias
 * @returns Eligibility result with details about missing prerequisites
 *
 * @example
 * ```typescript
 * const result = await checkProjectEligibility(projectId, userAlias);
 * if (result.eligible) {
 *   // User can contribute
 * } else {
 *   // Show missing prerequisites
 *   console.log(`Complete ${result.totalRequired - result.totalCompleted} more modules`);
 * }
 * ```
 */
export async function checkProjectEligibility(
  projectId: string,
  userAlias: string
): Promise<EligibilityResult> {
  // Fetch project details to get prerequisites
  const projectDetails = await getProject(projectId);

  if (!projectDetails) {
    throw new Error("Project not found");
  }

  const prerequisites = projectDetails.prerequisites ?? [];

  // No prerequisites = always eligible
  if (prerequisites.length === 0) {
    return {
      eligible: true,
      missingPrerequisites: [],
      totalRequired: 0,
      totalCompleted: 0,
      prerequisites: [],
    };
  }

  // Get user's global state for course progress
  let userState;
  try {
    userState = await getUserGlobalState(userAlias);
  } catch {
    // User not found on chain = no completed modules
    return {
      eligible: false,
      missingPrerequisites: prerequisites.map((prereq) => ({
        courseId: prereq.course_id,
        requiredModules: prereq.assignment_ids,
        completedModules: [],
        missingModules: prereq.assignment_ids,
      })),
      totalRequired: prerequisites.reduce((sum, p) => sum + p.assignment_ids.length, 0),
      totalCompleted: 0,
      prerequisites,
    };
  }

  // Check each prerequisite course
  const missingPrerequisites: MissingPrerequisite[] = [];
  let totalRequired = 0;
  let totalCompleted = 0;

  for (const prereq of prerequisites) {
    const requiredModules = prereq.assignment_ids;
    totalRequired += requiredModules.length;

    // Check if user is enrolled or has completed this course
    const courseProgress = userState.courses.find(
      (c) => c.course_id === prereq.course_id
    );

    // If not enrolled at all, user has no progress in this course
    if (!courseProgress) {
      missingPrerequisites.push({
        courseId: prereq.course_id,
        requiredModules,
        completedModules: [],
        missingModules: requiredModules,
      });
      continue;
    }

    // Fetch detailed student status to get completed modules
    let completedModules: string[] = [];
    try {
      const studentStatus = await getCourseStudent(prereq.course_id, userAlias);
      if (studentStatus) {
        completedModules = studentStatus.completed;
      }
    } catch {
      // Could not fetch student status, assume no completed modules
    }

    // Check which required modules are completed
    const missingModules = requiredModules.filter(
      (moduleHash) => !completedModules.includes(moduleHash)
    );

    const completedRequiredModules = requiredModules.filter(
      (moduleHash) => completedModules.includes(moduleHash)
    );

    totalCompleted += completedRequiredModules.length;

    if (missingModules.length > 0) {
      missingPrerequisites.push({
        courseId: prereq.course_id,
        requiredModules,
        completedModules: completedRequiredModules,
        missingModules,
      });
    }
  }

  return {
    eligible: missingPrerequisites.length === 0,
    missingPrerequisites,
    totalRequired,
    totalCompleted,
    prerequisites,
  };
}

/**
 * Quick eligibility check (just returns boolean)
 *
 * @param projectId - Project NFT Policy ID
 * @param userAlias - User's access token alias
 * @returns true if user meets all prerequisites
 */
export async function isUserEligible(
  projectId: string,
  userAlias: string
): Promise<boolean> {
  try {
    const result = await checkProjectEligibility(projectId, userAlias);
    return result.eligible;
  } catch {
    return false;
  }
}
