"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRegistry = void 0;
exports.getTransactionDefinition = getTransactionDefinition;
exports.getAllTransactionDefinitions = getAllTransactionDefinitions;
exports.getTransactionsByRole = getTransactionsByRole;
exports.getTransactionsByVersion = getTransactionsByVersion;
exports.getTransactionsByVersionAndRole = getTransactionsByVersionAndRole;
exports.hasTransaction = hasTransaction;
exports.getAvailableVersions = getAvailableVersions;
exports.getTransactionCountByVersion = getTransactionCountByVersion;
// V2 Imports - Global
const general_1 = require("./definitions/v2/global/general");
// V2 Imports - Instance
const instance_1 = require("./definitions/v2/instance");
// V2 Imports - Course System
const course_1 = require("./definitions/v2/course");
// V2 Imports - Project System
const project_1 = require("./definitions/v2/project");
/**
 * Transaction Registry
 *
 * Central registry mapping transaction names to their complete definitions.
 * This unifies protocol specs, API lifecycle, side effects, and UI metadata.
 *
 * The registry contains all transactions from all protocol versions.
 * Use helper functions to filter by version, role, or other criteria.
 *
 * @example
 * ```ts
 * import { transactionRegistry, getTransactionsByVersion } from "@andamio/transactions";
 *
 * // Get a specific transaction
 * const definition = transactionRegistry.get("CREATE_COURSE");
 *
 * // Get all V2 transactions
 * const v2Transactions = getTransactionsByVersion("v2");
 * ```
 */
exports.transactionRegistry = new Map([
    // ==========================================
    // V2 TRANSACTIONS (Current - 15 implemented)
    // ==========================================
    // Global General Transactions - v2 (1)
    ["GLOBAL_GENERAL_ACCESS_TOKEN_MINT", general_1.GLOBAL_GENERAL_ACCESS_TOKEN_MINT],
    // Instance Transactions - v2 (2)
    ["INSTANCE_COURSE_CREATE", instance_1.INSTANCE_COURSE_CREATE],
    ["INSTANCE_PROJECT_CREATE", instance_1.INSTANCE_PROJECT_CREATE],
    // Course Owner Transactions - v2 (1)
    ["COURSE_OWNER_TEACHERS_MANAGE", course_1.COURSE_OWNER_TEACHERS_MANAGE],
    // Course Teacher Transactions - v2 (2)
    ["COURSE_TEACHER_MODULES_MANAGE", course_1.COURSE_TEACHER_MODULES_MANAGE],
    ["COURSE_TEACHER_ASSIGNMENTS_ASSESS", course_1.COURSE_TEACHER_ASSIGNMENTS_ASSESS],
    // Course Student Transactions - v2 (3)
    ["COURSE_STUDENT_ASSIGNMENT_COMMIT", course_1.COURSE_STUDENT_ASSIGNMENT_COMMIT],
    ["COURSE_STUDENT_ASSIGNMENT_UPDATE", course_1.COURSE_STUDENT_ASSIGNMENT_UPDATE],
    ["COURSE_STUDENT_CREDENTIAL_CLAIM", course_1.COURSE_STUDENT_CREDENTIAL_CLAIM],
    // Project Owner Transactions - v2 (2)
    ["PROJECT_OWNER_MANAGERS_MANAGE", project_1.PROJECT_OWNER_MANAGERS_MANAGE],
    ["PROJECT_OWNER_BLACKLIST_MANAGE", project_1.PROJECT_OWNER_BLACKLIST_MANAGE],
    // Project Manager Transactions - v2 (2)
    ["PROJECT_MANAGER_TASKS_MANAGE", project_1.PROJECT_MANAGER_TASKS_MANAGE],
    ["PROJECT_MANAGER_TASKS_ASSESS", project_1.PROJECT_MANAGER_TASKS_ASSESS],
    // Project Contributor Transactions - v2 (3)
    ["PROJECT_CONTRIBUTOR_TASK_COMMIT", project_1.PROJECT_CONTRIBUTOR_TASK_COMMIT],
    ["PROJECT_CONTRIBUTOR_TASK_ACTION", project_1.PROJECT_CONTRIBUTOR_TASK_ACTION],
    ["PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM", project_1.PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM],
]);
/**
 * Get a transaction definition by name
 */
function getTransactionDefinition(txName) {
    return exports.transactionRegistry.get(txName);
}
/**
 * Get all transaction definitions
 */
function getAllTransactionDefinitions() {
    return Array.from(exports.transactionRegistry.values());
}
/**
 * Get transaction definitions by role
 */
function getTransactionsByRole(role) {
    return Array.from(exports.transactionRegistry.values()).filter((def) => def.role === role);
}
/**
 * Get transaction definitions by protocol version
 *
 * @example
 * ```ts
 * // Get all V2 transactions (recommended for new implementations)
 * const v2Txs = getTransactionsByVersion("v2");
 *
 * // Get legacy V1 transactions
 * const v1Txs = getTransactionsByVersion("v1");
 * ```
 */
function getTransactionsByVersion(version) {
    return Array.from(exports.transactionRegistry.values()).filter((def) => def.protocolSpec.version === version);
}
/**
 * Get transaction definitions by version and role
 *
 * @example
 * ```ts
 * // Get all V2 student transactions
 * const v2StudentTxs = getTransactionsByVersionAndRole("v2", "student");
 * ```
 */
function getTransactionsByVersionAndRole(version, role) {
    return Array.from(exports.transactionRegistry.values()).filter((def) => def.protocolSpec.version === version && def.role === role);
}
/**
 * Check if a transaction type exists
 */
function hasTransaction(txName) {
    return exports.transactionRegistry.has(txName);
}
/**
 * Get all available protocol versions in the registry
 */
function getAvailableVersions() {
    const versions = new Set();
    for (const def of exports.transactionRegistry.values()) {
        versions.add(def.protocolSpec.version);
    }
    return Array.from(versions).sort();
}
/**
 * Get transaction count by version
 *
 * @example
 * ```ts
 * const counts = getTransactionCountByVersion();
 * // { v1: 8, v2: 7 }
 * ```
 */
function getTransactionCountByVersion() {
    const counts = {};
    for (const def of exports.transactionRegistry.values()) {
        const version = def.protocolSpec.version;
        counts[version] = (counts[version] || 0) + 1;
    }
    return counts;
}
