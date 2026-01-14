import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * PROJECT_OWNER_BLACKLIST_MANAGE Transaction Definition
 *
 * Project owner manages the contributor blacklist for a project.
 * Blacklisted contributors cannot enroll or participate in the project.
 *
 * ## API Endpoint
 * POST /v2/tx/project/owner/contributor-blacklist/manage
 *
 * ## Request Body (ManageContributorBlacklistTxRequest)
 * ```json
 * {
 *   "alias": "projectowner",           // Owner's access token alias
 *   "project_id": "abc123...",         // Project NFT policy ID (56 char hex)
 *   "aliases_to_add": ["badactor1"],   // Aliases to blacklist
 *   "aliases_to_remove": ["forgiven1"] // Aliases to remove from blacklist
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
 * **None** - This is a purely on-chain action. Blacklist status is determined by the
 * Project Governance UTxO on-chain.
 *
 * ## On-Chain Result
 *
 * Updates the Project Governance UTxO to add/remove aliases from the contributor blacklist.
 * Blacklisted contributors cannot:
 * - Enroll in the project
 * - Commit to tasks
 * - Receive rewards
 */
export declare const PROJECT_OWNER_BLACKLIST_MANAGE: AndamioTransactionDefinition;
