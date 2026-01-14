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
import * as v2Exports from "./v2";
export declare const v2: typeof v2Exports;
export * from "./v2";
