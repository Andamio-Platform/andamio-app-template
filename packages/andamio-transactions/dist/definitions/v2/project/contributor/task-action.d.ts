import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * PROJECT_CONTRIBUTOR_TASK_ACTION Transaction Definition
 *
 * Contributors perform an action on their current task (update submission, etc).
 *
 * ## API Endpoint
 * POST /v2/tx/project/contributor/task/action
 *
 * ## Request Body (TaskActionTxRequest)
 * ```json
 * {
 *   "alias": "contributor1",              // Contributor's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "project_info": "optional_info..."    // Optional project info
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
 * This transaction is used for various task-related actions after enrollment:
 * - Updating task submission evidence
 * - Performing task state transitions
 *
 * ## Side Effects
 *
 * **onSubmit**: Update task commitment to PENDING_TX_ADD_INFO status
 * **onConfirmation**: Confirm action, transition to PENDING_APPROVAL
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export declare const PROJECT_CONTRIBUTOR_TASK_ACTION: AndamioTransactionDefinition;
