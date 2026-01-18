/**
 * Task Hashing Utility
 *
 * Computes the task token name (hash) from task data.
 * This hash is used as the task_id on-chain.
 *
 * The algorithm matches the on-chain Plutus validator serialization.
 *
 * @module task-hash
 */
/**
 * Native asset in ListValue format: [policyId.tokenName, quantity]
 */
type NativeAsset = [string, number];
/**
 * Task data structure matching the Atlas TX API ManageTasksTxRequest
 *
 * Fields must be arranged in this specific order for hashing:
 * 1. project_content (string, max 140 chars)
 * 2. expiration_time (number, Unix timestamp in milliseconds)
 * 3. lovelace_amount (number)
 * 4. native_assets (array of [asset_class, quantity] tuples)
 */
export interface TaskData {
    project_content: string;
    expiration_time: number;
    lovelace_amount: number;
    native_assets: NativeAsset[];
}
/**
 * Compute the task hash (token name / task_id) from task data.
 *
 * This produces the same hash as the on-chain Plutus validator, allowing
 * clients to pre-compute or verify task IDs.
 *
 * @param task - Task data object
 * @returns 64-character hex string (256-bit Blake2b hash)
 *
 * @example
 * ```typescript
 * import { computeTaskHash } from "@andamio/transactions";
 *
 * const task = {
 *   project_content: "Open Task #1",
 *   expiration_time: 1769027280000,
 *   lovelace_amount: 15000000,
 *   native_assets: []
 * };
 *
 * const taskId = computeTaskHash(task);
 * // Returns the on-chain task_id
 * ```
 */
export declare function computeTaskHash(task: TaskData): string;
/**
 * Verify that a given hash matches the computed hash for a task.
 *
 * @param task - Task data object
 * @param expectedHash - The hash to verify (64-character hex string)
 * @returns true if the computed hash matches the expected hash
 */
export declare function verifyTaskHash(task: TaskData, expectedHash: string): boolean;
/**
 * Validate that a string is a valid task hash format.
 *
 * Task hashes are 64-character hexadecimal strings (256-bit Blake2b hash).
 */
export declare function isValidTaskHash(hash: string): boolean;
/**
 * Debug function to show the CBOR encoding of a task.
 * Useful for comparing against on-chain data.
 *
 * @param task - Task data object
 * @returns Hex string of the CBOR-encoded data (before hashing)
 */
export declare function debugTaskCBOR(task: TaskData): string;
export {};
