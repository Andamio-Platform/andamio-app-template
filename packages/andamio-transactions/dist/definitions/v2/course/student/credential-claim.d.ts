import type { AndamioTransactionDefinition } from "../../../../types";
/**
 * COURSE_STUDENT_CREDENTIAL_CLAIM Transaction Definition
 *
 * Students claim a credential token after completing all required assignments.
 * This transfers the course state to the global state.
 *
 * ## API Endpoint
 * POST /v2/tx/course/student/credential/claim
 *
 * ## Request Body (ClaimCourseCredentialTxRequest)
 * ```json
 * {
 *   "alias": "student1",              // Student's access token alias
 *   "course_id": "abc123..."          // Course NFT policy ID (56 char hex)
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
 * ## Why No Side Effects?
 *
 * This transaction has no database side effects because:
 *
 * 1. **Final Step in Flow**: By the time a student claims a credential, all
 *    assignment commitments have already been completed and recorded via
 *    earlier transactions (ASSIGNMENT_ACTION, ASSIGNMENTS_ASSESS).
 *
 * 2. **Pure On-Chain Operation**: The credential claim simply mints the
 *    credential token on-chain. The on-chain state already proves eligibility.
 *
 * 3. **Blockchain Verification**: Credential ownership is verified via
 *    blockchain queries, not database lookups.
 *
 * The credential token itself IS the proof of completion.
 */
export declare const COURSE_STUDENT_CREDENTIAL_CLAIM: AndamioTransactionDefinition;
