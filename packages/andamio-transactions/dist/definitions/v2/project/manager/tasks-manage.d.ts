import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * PROJECT_MANAGER_TASKS_MANAGE Transaction Definition
 *
 * Project managers add or remove tasks from a project.
 *
 * ## API Endpoint
 * POST /v2/tx/project/manager/tasks/manage
 *
 * ## Request Body (ManageTasksTxRequest)
 * ```json
 * {
 *   "alias": "manager1",                  // Manager's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "contributor_state_id": "def456...",  // Contributor state policy ID (56 char hex)
 *   "prerequisites": [],                  // Course prerequisites (from Andamioscan, [] if none)
 *   "tasks_to_add": [{
 *     "project_content": "Task description text",  // Task content (max 140 chars)
 *     "expiration_time": 1735689600000,            // Unix timestamp in MILLISECONDS
 *     "lovelace_amount": 5000000,
 *     "native_assets": []                          // ListValue: [["policy.name", qty], ...]
 *   }],
 *   "tasks_to_remove": [{                 // Full ProjectData objects, NOT just hashes!
 *     "project_content": "Task to remove",
 *     "expiration_time": 1735689600000,
 *     "lovelace_amount": 5000000,
 *     "native_assets": []
 *   }],
 *   "deposit_value": []                   // Required ListValue: [["lovelace", amount]]
 * }
 * ```
 *
 * ## ListValue Format
 * Array of [asset_class, quantity] tuples:
 * - For lovelace: `[["lovelace", 5000000]]`
 * - For native assets: `[["policyId.tokenName", 100]]`
 * - Combined: `[["lovelace", 5000000], ["policy.token", 100]]`
 *
 * ## Response (UnsignedTxResponse)
 * ```json
 * {
 *   "unsigned_tx": "84aa00..."
 * }
 * ```
 *
 * ## Task Hash Fields
 *
 * Each Task in the database has two hash fields:
 * - **arbitraryHash**: Our internal DB identifier, computed from task content (title, description, etc.)
 *   Set when task is created/approved. Used to identify tasks in side effects.
 * - **taskHash**: The on-chain identifier, received after transaction confirmation.
 *   This is the token name on the blockchain.
 *
 * ## Side Effects
 *
 * **onSubmit**: Batch update all affected tasks to `PENDING_TX` status.
 * Use `formatTasksPending()` helper to construct `sideEffectParams.tasks_pending`.
 *
 * **onConfirmation**: Batch confirm all tasks and save their on-chain taskHash.
 * Use `formatTasksConfirm()` helper to construct `sideEffectParams.tasks_confirm`.
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export declare const PROJECT_MANAGER_TASKS_MANAGE: AndamioTransactionDefinition;
/**
 * Type for tasks_pending array in sideEffectParams
 */
export type TaskPendingEntry = {
    arbitrary_hash: string;
    status: "PENDING_TX";
    pending_tx_hash: string;
};
/**
 * Type for tasks_confirm array in sideEffectParams
 */
export type TaskConfirmEntry = {
    arbitrary_hash: string;
    task_hash: string;
};
/**
 * Constructs the tasks_pending array for sideEffectParams.
 *
 * Call this after transaction submission to prepare the onSubmit side effect data.
 *
 * @param arbitraryHashes - Array of arbitrary hashes (DB identifiers) for tasks being managed
 * @param txHash - The transaction hash from wallet.submitTx()
 * @returns Array for sideEffectParams.tasks_pending
 *
 * @example
 * ```typescript
 * import { formatTasksPending } from "@andamio/transactions";
 *
 * // After building the transaction, prepare side effect params
 * const tasks_pending = formatTasksPending(
 *   ["abc123...", "def456..."],  // arbitrary hashes from DB
 *   txHash
 * );
 *
 * const sideEffectParams = { tasks_pending, tasks_confirm: [] };
 * ```
 */
export declare function formatTasksPending(arbitraryHashes: string[], txHash: string): TaskPendingEntry[];
/**
 * Constructs the tasks_confirm array for sideEffectParams.
 *
 * Call this after transaction confirmation to prepare the onConfirmation side effect data.
 * Task hashes are the on-chain identifiers received after confirmation.
 *
 * @param arbitraryHashes - Array of arbitrary hashes (DB identifiers) - same order as taskHashes
 * @param taskHashes - Array of on-chain task hashes - same order as arbitraryHashes
 * @returns Array for sideEffectParams.tasks_confirm
 *
 * @example
 * ```typescript
 * import { formatTasksConfirm } from "@andamio/transactions";
 *
 * // After confirmation, prepare side effect params
 * const tasks_confirm = formatTasksConfirm(
 *   ["abc123...", "def456..."],  // arbitrary hashes from DB
 *   ["onchain1...", "onchain2..."]  // task hashes from on-chain
 * );
 *
 * const sideEffectParams = { tasks_pending: [], tasks_confirm };
 * ```
 */
export declare function formatTasksConfirm(arbitraryHashes: string[], taskHashes: string[]): TaskConfirmEntry[];
