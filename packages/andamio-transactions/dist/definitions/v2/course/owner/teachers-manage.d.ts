import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * COURSE_OWNER_TEACHERS_MANAGE Transaction Definition
 *
 * Course owner adds or removes teachers from a course by updating the Course Governance UTxO.
 *
 * ## API Endpoint
 * POST /v2/tx/course/owner/teachers/manage
 *
 * ## Request Body (ManageTeachersTxRequest)
 * ```json
 * {
 *   "alias": "courseowner",              // Owner's access token alias
 *   "course_id": "abc123...",            // Course NFT policy ID (56 char hex)
 *   "teachers_to_add": ["teacher1"],     // Aliases of teachers to add
 *   "teachers_to_remove": ["teacher2"]   // Aliases of teachers to remove
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
 * **None** - This is a purely on-chain action. Teacher access is determined by the
 * Course Governance UTxO on-chain. Connected access token holders with teacher access
 * will see their permissions reflected via Andamioscan API queries.
 *
 * ## On-Chain Result
 *
 * Updates the Course Governance UTxO to add/remove teacher aliases. Teachers gain
 * the ability to:
 * - Manage course modules (mint, update, burn)
 * - Assess student assignment submissions (accept/refuse)
 */
export declare const COURSE_OWNER_TEACHERS_MANAGE: AndamioTransactionDefinition;
