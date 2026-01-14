import type { TxName, AndamioTransactionDefinition, ProtocolVersion } from "./types";
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
export declare const transactionRegistry: Map<TxName, AndamioTransactionDefinition>;
/**
 * Get a transaction definition by name
 */
export declare function getTransactionDefinition(txName: TxName): AndamioTransactionDefinition | undefined;
/**
 * Get all transaction definitions
 */
export declare function getAllTransactionDefinitions(): AndamioTransactionDefinition[];
/**
 * Get transaction definitions by role
 */
export declare function getTransactionsByRole(role: string): AndamioTransactionDefinition[];
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
export declare function getTransactionsByVersion(version: ProtocolVersion): AndamioTransactionDefinition[];
/**
 * Get transaction definitions by version and role
 *
 * @example
 * ```ts
 * // Get all V2 student transactions
 * const v2StudentTxs = getTransactionsByVersionAndRole("v2", "student");
 * ```
 */
export declare function getTransactionsByVersionAndRole(version: ProtocolVersion, role: string): AndamioTransactionDefinition[];
/**
 * Check if a transaction type exists
 */
export declare function hasTransaction(txName: TxName): boolean;
/**
 * Get all available protocol versions in the registry
 */
export declare function getAvailableVersions(): ProtocolVersion[];
/**
 * Get transaction count by version
 *
 * @example
 * ```ts
 * const counts = getTransactionCountByVersion();
 * // { v1: 8, v2: 7 }
 * ```
 */
export declare function getTransactionCountByVersion(): Record<ProtocolVersion, number>;
