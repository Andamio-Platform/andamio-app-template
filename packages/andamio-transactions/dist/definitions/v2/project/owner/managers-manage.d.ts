import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * PROJECT_OWNER_MANAGERS_MANAGE Transaction Definition
 *
 * Project owner adds or removes managers from a project by updating the Project Governance UTxO.
 *
 * ## API Endpoint
 * POST /v2/tx/project/owner/managers/manage
 *
 * ## Request Body (ManageManagersTxRequest)
 * ```json
 * {
 *   "alias": "projectowner",              // Owner's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "managers_to_add": ["manager1"],      // Aliases of managers to add
 *   "managers_to_remove": ["manager2"]    // Aliases of managers to remove
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
 * ## Side Effects
 *
 * **None** - This is a purely on-chain action. Manager access is determined by the
 * Project Governance UTxO on-chain.
 *
 * ## On-Chain Result
 *
 * Updates the Project Governance UTxO to add/remove manager aliases. Managers gain
 * the ability to:
 * - Manage project tasks
 * - Assess contributor task submissions (accept/refuse/deny)
 */
export declare const PROJECT_OWNER_MANAGERS_MANAGE: AndamioTransactionDefinition;
