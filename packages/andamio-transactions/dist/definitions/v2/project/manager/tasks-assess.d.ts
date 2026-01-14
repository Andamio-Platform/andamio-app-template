import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * PROJECT_MANAGER_TASKS_ASSESS Transaction Definition
 *
 * Project managers assess contributor task submissions by accepting, refusing, or denying them.
 *
 * ## API Endpoint
 * POST /v2/tx/project/manager/tasks/assess
 *
 * ## Request Body (TasksAssessV2TxRequest)
 * ```json
 * {
 *   "alias": "manager1",                  // Manager's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "contributor_state_id": "def456...",  // Contributor state ID (56 char hex)
 *   "task_decisions": [                   // Array of task decisions (ProjectOutcome)
 *     {
 *       "alias": "contributor1",          // Contributor's alias
 *       "outcome": "accept"               // "accept", "refuse", or "deny"
 *     }
 *   ]
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
 * ## Assessment Outcomes
 *
 * - **Accept**: Contributor receives the task reward, task is marked complete
 * - **Refuse**: Task is rejected but contributor can resubmit
 * - **Deny**: Task is permanently rejected, contributor loses deposit
 *
 * ## Side Effects
 *
 * **onSubmit**: Update task commitment status to pending assessment state
 * (PENDING_TX_TASK_ACCEPTED, PENDING_TX_TASK_REFUSED, or PENDING_TX_TASK_DENIED)
 *
 * **onConfirmation**: Confirm assessment, finalize task commitment status
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export declare const PROJECT_MANAGER_TASKS_ASSESS: AndamioTransactionDefinition;
