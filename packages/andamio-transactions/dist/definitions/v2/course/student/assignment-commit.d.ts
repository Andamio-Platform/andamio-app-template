import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * COURSE_STUDENT_ASSIGNMENT_COMMIT Transaction Definition
 *
 * Students commit to an assignment in a course. This handles both:
 * - First-time enrollment (mints course-state token)
 * - Subsequent commitments (spends existing course-state UTxO)
 *
 * ## API Endpoint
 * POST /v2/tx/course/student/assignment/commit
 *
 * ## Request Body (EnrollCourseTxRequest)
 * ```json
 * {
 *   "alias": "student_001",           // Student's access token alias
 *   "course_id": "e276a1f2...",       // Course NFT policy ID (56 char hex)
 *   "slt_hash": "10dde6f0...",        // Module token name (64 char hex) - REQUIRED
 *   "assignment_info": "some...",     // Evidence hash - REQUIRED
 *   "initiator_data": {               // Optional wallet data
 *     "used_addresses": ["addr_test1..."],
 *     "change_address": "addr_test1..."
 *   }
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
 * ## Commitment Flow
 *
 * When student is NOT enrolled in the course:
 * 1. Mint a course-state token with the student's alias as token name
 * 2. Spend and recreate global state, adding course_id -> enrollment_hash to the map
 * 3. Create course-state UTxO with commitment data (constructor 1 datum)
 *
 * When student IS already enrolled but has no active commitment:
 * - Spends the existing course-state UTxO (constructor 0)
 * - Recreates it with a new commitment (constructor 1)
 * - No minting occurs in this case
 *
 * ## Side Effects
 *
 * **onSubmit**: Creates a new assignment commitment with `PENDING_TX_COMMITMENT_MADE` status
 * **onConfirmation**: Confirms the commitment, sets status to `PENDING_APPROVAL`
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export declare const COURSE_STUDENT_ASSIGNMENT_COMMIT: AndamioTransactionDefinition;
