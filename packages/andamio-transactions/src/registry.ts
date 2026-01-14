import type {
  TransactionRegistry,
  TxName,
  AndamioTransactionDefinition,
  ProtocolVersion,
} from "./types";

// V2 Imports - Global
import { GLOBAL_GENERAL_ACCESS_TOKEN_MINT } from "./definitions/v2/global/general";

// V2 Imports - Instance
import { INSTANCE_COURSE_CREATE, INSTANCE_PROJECT_CREATE } from "./definitions/v2/instance";

// V2 Imports - Course System
import {
  COURSE_OWNER_TEACHERS_MANAGE,
  COURSE_TEACHER_MODULES_MANAGE,
  COURSE_TEACHER_ASSIGNMENTS_ASSESS,
  COURSE_STUDENT_ASSIGNMENT_COMMIT,
  COURSE_STUDENT_ASSIGNMENT_UPDATE,
  COURSE_STUDENT_CREDENTIAL_CLAIM,
} from "./definitions/v2/course";

// V2 Imports - Project System
import {
  PROJECT_OWNER_MANAGERS_MANAGE,
  PROJECT_OWNER_BLACKLIST_MANAGE,
  PROJECT_MANAGER_TASKS_MANAGE,
  PROJECT_MANAGER_TASKS_ASSESS,
  PROJECT_CONTRIBUTOR_TASK_COMMIT,
  PROJECT_CONTRIBUTOR_TASK_ACTION,
  PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM,
} from "./definitions/v2/project";

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
export const transactionRegistry = new Map<TxName, AndamioTransactionDefinition>([
  // ==========================================
  // V2 TRANSACTIONS (Current - 15 implemented)
  // ==========================================

  // Global General Transactions - v2 (1)
  ["GLOBAL_GENERAL_ACCESS_TOKEN_MINT", GLOBAL_GENERAL_ACCESS_TOKEN_MINT],

  // Instance Transactions - v2 (2)
  ["INSTANCE_COURSE_CREATE", INSTANCE_COURSE_CREATE],
  ["INSTANCE_PROJECT_CREATE", INSTANCE_PROJECT_CREATE],

  // Course Owner Transactions - v2 (1)
  ["COURSE_OWNER_TEACHERS_MANAGE", COURSE_OWNER_TEACHERS_MANAGE],

  // Course Teacher Transactions - v2 (2)
  ["COURSE_TEACHER_MODULES_MANAGE", COURSE_TEACHER_MODULES_MANAGE],
  ["COURSE_TEACHER_ASSIGNMENTS_ASSESS", COURSE_TEACHER_ASSIGNMENTS_ASSESS],

  // Course Student Transactions - v2 (3)
  ["COURSE_STUDENT_ASSIGNMENT_COMMIT", COURSE_STUDENT_ASSIGNMENT_COMMIT],
  ["COURSE_STUDENT_ASSIGNMENT_UPDATE", COURSE_STUDENT_ASSIGNMENT_UPDATE],
  ["COURSE_STUDENT_CREDENTIAL_CLAIM", COURSE_STUDENT_CREDENTIAL_CLAIM],

  // Project Owner Transactions - v2 (2)
  ["PROJECT_OWNER_MANAGERS_MANAGE", PROJECT_OWNER_MANAGERS_MANAGE],
  ["PROJECT_OWNER_BLACKLIST_MANAGE", PROJECT_OWNER_BLACKLIST_MANAGE],

  // Project Manager Transactions - v2 (2)
  ["PROJECT_MANAGER_TASKS_MANAGE", PROJECT_MANAGER_TASKS_MANAGE],
  ["PROJECT_MANAGER_TASKS_ASSESS", PROJECT_MANAGER_TASKS_ASSESS],

  // Project Contributor Transactions - v2 (3)
  ["PROJECT_CONTRIBUTOR_TASK_COMMIT", PROJECT_CONTRIBUTOR_TASK_COMMIT],
  ["PROJECT_CONTRIBUTOR_TASK_ACTION", PROJECT_CONTRIBUTOR_TASK_ACTION],
  ["PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM", PROJECT_CONTRIBUTOR_CREDENTIAL_CLAIM],
]);

/**
 * Get a transaction definition by name
 */
export function getTransactionDefinition(txName: TxName): AndamioTransactionDefinition | undefined {
  return transactionRegistry.get(txName);
}

/**
 * Get all transaction definitions
 */
export function getAllTransactionDefinitions(): AndamioTransactionDefinition[] {
  return Array.from(transactionRegistry.values());
}

/**
 * Get transaction definitions by role
 */
export function getTransactionsByRole(role: string): AndamioTransactionDefinition[] {
  return Array.from(transactionRegistry.values()).filter((def) => def.role === role);
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
export function getTransactionsByVersion(version: ProtocolVersion): AndamioTransactionDefinition[] {
  return Array.from(transactionRegistry.values()).filter(
    (def) => def.protocolSpec.version === version
  );
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
export function getTransactionsByVersionAndRole(
  version: ProtocolVersion,
  role: string
): AndamioTransactionDefinition[] {
  return Array.from(transactionRegistry.values()).filter(
    (def) => def.protocolSpec.version === version && def.role === role
  );
}

/**
 * Check if a transaction type exists
 */
export function hasTransaction(txName: TxName): boolean {
  return transactionRegistry.has(txName);
}

/**
 * Get all available protocol versions in the registry
 */
export function getAvailableVersions(): ProtocolVersion[] {
  const versions = new Set<ProtocolVersion>();
  for (const def of transactionRegistry.values()) {
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
export function getTransactionCountByVersion(): Record<ProtocolVersion, number> {
  const counts: Record<string, number> = {};
  for (const def of transactionRegistry.values()) {
    const version = def.protocolSpec.version;
    counts[version] = (counts[version] || 0) + 1;
  }
  return counts as Record<ProtocolVersion, number>;
}
