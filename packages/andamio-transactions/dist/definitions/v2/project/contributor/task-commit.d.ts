import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * PROJECT_CONTRIBUTOR_TASK_COMMIT Transaction Definition
 *
 * Contributors commit to a new task after completing their current task.
 *
 * ## API Endpoint
 * POST /v2/tx/project/contributor/task/commit
 *
 * ## Request Body (CommitTaskTxRequest)
 * ```json
 * {
 *   "alias": "contributor1",              // Contributor's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "contributor_state_id": "def456...",  // Contributor state ID (56 char hex)
 *   "task_hash": "ghi789...",             // Task hash to commit to (64 char hex)
 *   "task_info": "jkl012..."              // Task info hash
 * }
 * ```
 *
 * ## Response (UnsignedTxResponse)
 * ```json
 * {
 *   "unsigned_tx": "84aa00..."
 * }
 * ```
 *
 * ## Use Cases
 *
 * After a task has been accepted:
 * - Contributor can commit to a new task in the same project
 * - Similar to initial enrollment but with existing contributor state
 *
 * ## Side Effects
 *
 * **onSubmit**: Create commitment and submit for review with evidence (direct commit + submit flow)
 * **onConfirmation**: Confirm commitment, set status to SUBMITTED
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export declare const PROJECT_CONTRIBUTOR_TASK_COMMIT: AndamioTransactionDefinition;
