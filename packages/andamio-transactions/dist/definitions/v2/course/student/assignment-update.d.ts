import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * COURSE_STUDENT_ASSIGNMENT_UPDATE Transaction Definition
 *
 * Students update their assignment submission (assignment_info) while keeping
 * the same SLT hash commitment. This is for revising evidence only.
 *
 * For committing to a new module (different slt_hash), use COURSE_STUDENT_ASSIGNMENT_COMMIT.
 *
 * ## API Endpoint
 * POST /v2/tx/course/student/assignment/update
 *
 * ## Request Body (UpdateAssignmentTxRequest)
 * ```json
 * {
 *   "alias": "student_001",           // Student's access token alias
 *   "assignment_info": "new info...", // Updated assignment submission information
 *   "course_id": "e276a1f2..."        // Course NFT policy ID (56 char hex)
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
 * ## Update Flow
 *
 * This is a "spend and recreate" pattern - no minting occurs:
 * 1. Course state UTxO is spent
 * 2. Recreated with updated assignment_info in the datum
 * 3. SLT hash CANNOT be changed via update (must match existing commitment)
 *
 * ## Side Effects
 *
 * **onSubmit**: Updates evidence and sets status to `PENDING_TX_ADD_INFO`
 * **onConfirmation**: Confirms the update, transitions to `PENDING_APPROVAL`
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export declare const COURSE_STUDENT_ASSIGNMENT_UPDATE: AndamioTransactionDefinition;
