import type { AndamioTransactionDefinition } from "../../../types";
/**
 * INSTANCE_PROJECT_CREATE Transaction Definition
 *
 * Creates a new project on-chain by minting a Project NFT.
 * This is an instance-level transaction for project owners.
 *
 * ## API Endpoint
 * POST /v2/tx/instance/owner/project/create
 *
 * ## Request Body (CreateProjectTxRequest)
 * ```json
 * {
 *   "alias": "projectowner",           // Owner's access token alias
 *   "managers": ["manager1", "manager2"],  // Manager aliases
 *   "course_prereqs": ["abc123..."],   // Course policy IDs as prerequisites
 *   "deposit_value": {                 // Required deposit for contributors
 *     "lovelace": 5000000,
 *     "native_assets": []
 *   },
 *   "initiator_data": {                // Optional wallet data
 *     "used_addresses": ["addr_test1..."],
 *     "change_address": "addr_test1..."
 *   }
 * }
 * ```
 *
 * ## Response (UnsignedTxResponseInitProject)
 * ```json
 * {
 *   "unsigned_tx": "84aa00...",
 *   "project_id": "68396f1567f5b8d813517b82e1b07e62b4d61392621d916fa5dac3e7"
 * }
 * ```
 *
 * ## Side Effects
 *
 * **onSubmit**: Create project record in database with title and project_id.
 * The `project_id` comes from the transaction API response, so the frontend must
 * extract it and include it in `buildInputs.project_nft_policy_id` before executing side effects.
 *
 * **onConfirmation**: Set project `live` status to true once confirmed on-chain.
 */
export declare const INSTANCE_PROJECT_CREATE: AndamioTransactionDefinition;
