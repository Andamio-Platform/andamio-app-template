/**
 * V2 Course System Transactions
 *
 * Transactions for the Andamio Course Management System.
 * Covers the complete course lifecycle: enrollment, learning, and credentialing.
 *
 * Roles:
 * - owner: Course owners who manage teachers
 * - teacher: Instructors who manage modules and assess assignments
 * - student: Learners who enroll in courses and complete assignments
 *
 * Note: Course creation is in the instance folder (/v2/tx/instance/owner/course/create)
 */
export * from "./owner";
export * from "./teacher";
export * from "./student";
export { COURSE_OWNER_TEACHERS_MANAGE } from "./owner";
export { COURSE_TEACHER_MODULES_MANAGE, COURSE_TEACHER_ASSIGNMENTS_ASSESS } from "./teacher";
export { COURSE_STUDENT_ASSIGNMENT_COMMIT, COURSE_STUDENT_ASSIGNMENT_UPDATE, COURSE_STUDENT_CREDENTIAL_CLAIM } from "./student";
