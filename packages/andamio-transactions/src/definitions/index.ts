/**
 * Transaction Definitions - Organized by Protocol Version
 *
 * This module exports transaction definitions organized by protocol version.
 * Currently supports V2 (production protocol).
 *
 * @example
 * // Import V2 transactions
 * import { INSTANCE_COURSE_CREATE, COURSE_STUDENT_ASSIGNMENT_COMMIT } from "@andamio/transactions";
 */

// Export version namespaces
import * as v2Exports from "./v2";

export const v2 = v2Exports;

// Export all V2 transactions
export * from "./v2";
