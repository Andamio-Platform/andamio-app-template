/**
 * Course API Hooks
 *
 * React Query hooks for course-related API operations.
 * Organized per Gateway API taxonomy: /api/v2/course/*
 *
 * File Organization:
 * - use-course.ts          - Core types + public queries
 * - use-course-owner.ts    - Owner mutations (create, update, delete, register)
 * - use-course-teacher.ts  - Teacher queries + mutations
 * - use-course-student.ts  - Student queries + mutations
 * - use-course-module.ts   - Module entity CRUD
 * - use-slt.ts             - SLT entity CRUD
 * - use-lesson.ts          - Lesson entity CRUD
 */

export * from "./use-course";
export * from "./use-course-owner";
export * from "./use-course-module";
export * from "./use-lesson";
export * from "./use-slt";
export * from "./use-course-student";
export * from "./use-course-teacher";
export * from "./use-module-wizard-data";
