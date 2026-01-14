import type { AndamioTransactionDefinition } from "../../../types";
/**
 * INSTANCE_COURSE_CREATE Transaction Definition
 *
 * Creates a new course on-chain by minting a Course NFT.
 * This is an instance-level transaction for course owners.
 *
 * ## API Endpoint
 * POST /v2/tx/instance/owner/course/create
 *
 * ## Request Body (CreateCourseTxRequest)
 * ```json
 * {
 *   "alias": "courseowner",           // Owner's access token alias
 *   "teachers": ["teacher1", "teacher2"],  // Teacher aliases (at least one)
 *   "initiator_data": {               // Optional wallet data
 *     "used_addresses": ["addr_test1..."],
 *     "change_address": "addr_test1..."
 *   }
 * }
 * ```
 *
 * ## Response (UnsignedTxResponseInitCourse)
 * ```json
 * {
 *   "unsigned_tx": "84aa00...",
 *   "course_id": "68396f1567f5b8d813517b82e1b07e62b4d61392621d916fa5dac3e7"
 * }
 * ```
 *
 * ## Side Effects
 *
 * **onSubmit**: Create course record in database with title and course_nft_policy_id.
 * The `course_id` comes from the transaction API response, so the frontend must
 * extract it and include it in `buildInputs.course_nft_policy_id` before executing side effects.
 * Teachers are NOT passed here - they are synced from on-chain data on confirmation.
 *
 * **onConfirmation**: Set course `live` status to true and sync teachers from on-chain.
 * The API fetches teacher data from AndamioScan, so teachers are source-of-truth from blockchain.
 */
export declare const INSTANCE_COURSE_CREATE: AndamioTransactionDefinition;
