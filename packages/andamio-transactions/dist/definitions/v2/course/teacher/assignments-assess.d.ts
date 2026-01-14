import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * COURSE_TEACHER_ASSIGNMENTS_ASSESS Transaction Definition
 *
 * Teachers assess student assignment submissions by accepting or refusing them.
 *
 * ## API Endpoint
 * POST /v2/tx/course/teacher/assignments/assess
 *
 * ## Request Body (AssessAssignmentsTxRequest)
 * ```json
 * {
 *   "alias": "teacher1",                // Teacher's access token alias
 *   "course_id": "abc123...",           // Course NFT policy ID (56 char hex)
 *   "assignment_decisions": [           // Array of decisions
 *     {
 *       "alias": "student1",            // Student's alias
 *       "outcome": "accept"             // "accept" or "refuse"
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
 * ## Assessment Flow
 *
 * - **Accept**: Student's SLT hash is added to their completed list on-chain
 * - **Refuse**: Assignment is rejected, student can update and resubmit
 *
 * ## Side Effects
 *
 * The side effects use conditional execution based on `assessment_result`:
 *
 * **onSubmit**:
 * - If accept: Set status to `PENDING_TX_ASSIGNMENT_ACCEPTED`
 * - If refuse: Set status to `PENDING_TX_ASSIGNMENT_REFUSED`
 *
 * **onConfirmation**:
 * - Confirms the assessment, transitions to final status
 *
 * ## Batching
 *
 * The transaction API supports batching multiple assignment decisions in a single
 * transaction. For batch operations, the frontend should iterate through
 * `assignment_decisions` and execute side effects for each.
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. These set PENDING_TX status. If they fail, the
 *   transaction can be retried without permanent state inconsistency.
 * - **onConfirmation**: CRITICAL. These finalize DB state to match on-chain state.
 *   If confirmation fails, DB and blockchain are out of sync - this must succeed.
 *
 * This pattern applies to ALL transactions with side effects.
 */
export declare const COURSE_TEACHER_ASSIGNMENTS_ASSESS: AndamioTransactionDefinition;
