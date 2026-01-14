/**
 * V2 Transaction Definitions
 *
 * Current production transactions for Andamio Protocol V2.
 * V2 consolidates roles and dramatically reduces transaction count.
 *
 * Key improvements over V1:
 * - Batch module management (single tx for multiple modules)
 * - SLT hash token naming (tamper-evident design)
 * - Simplified role structure
 * - Lower operational costs
 *
 * Organized by system (matching API URL structure):
 * - global/: Global system transactions (access tokens)
 * - instance/: Instance-level transactions (course/project creation)
 * - course/: Course management system transactions
 * - project/: Project management system transactions
 *
 * Legacy paths (deprecated):
 * - general/: Moved to global/general/
 *
 * Total V2 Transactions: 15
 * - Global General: 1
 * - Instance: 2
 * - Course: 6 (1 owner + 2 teacher + 3 student)
 * - Project: 7 (2 owner + 2 manager + 3 contributor)
 *
 * @example
 * // Import all course transactions
 * import { course } from "@andamio/transactions/definitions/v2";
 *
 * // Import specific transactions
 * import { INSTANCE_COURSE_CREATE, COURSE_STUDENT_ASSIGNMENT_COMMIT } from "@andamio/transactions";
 */
import * as courseExports from "./course";
import * as globalExports from "./global";
import * as instanceExports from "./instance";
import * as projectExports from "./project";
export declare const course: typeof courseExports;
export declare const global: typeof globalExports;
export declare const instance: typeof instanceExports;
export declare const project: typeof projectExports;
export * from "./course";
export * from "./global";
export * from "./instance";
export * from "./project";
export { GLOBAL_GENERAL_ACCESS_TOKEN_MINT } from "./global/general";
export { INSTANCE_COURSE_CREATE, INSTANCE_PROJECT_CREATE } from "./instance";
export { COURSE_OWNER_TEACHERS_MANAGE } from "./course/owner";
export { COURSE_TEACHER_MODULES_MANAGE, COURSE_TEACHER_ASSIGNMENTS_ASSESS } from "./course/teacher";
export { COURSE_STUDENT_ASSIGNMENT_COMMIT, COURSE_STUDENT_ASSIGNMENT_UPDATE, COURSE_STUDENT_CREDENTIAL_CLAIM } from "./course/student";
export { PROJECT_OWNER_MANAGERS_MANAGE, PROJECT_OWNER_BLACKLIST_MANAGE } from "./project/owner";
export { PROJECT_MANAGER_TASKS_MANAGE, PROJECT_MANAGER_TASKS_ASSESS } from "./project/manager";
export { PROJECT_CONTRIBUTOR_TASK_COMMIT, PROJECT_CONTRIBUTOR_TASK_ACTION, PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM, } from "./project/contributor";
