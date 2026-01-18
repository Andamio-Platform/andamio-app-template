import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "course.teacher.assignments.assess";
const txName = "COURSE_TEACHER_ASSIGNMENTS_ASSESS" as const;

/**
 * WalletData schema for optional initiator data
 */
const initiatorDataSchema = z
  .object({
    used_addresses: z.array(z.string()), // Array of bech32 addresses
    change_address: z.string(), // Bech32 change address
  })
  .optional();

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
export const COURSE_TEACHER_ASSIGNMENTS_ASSESS: AndamioTransactionDefinition = {
  txType: txName,
  role: "course-teacher",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches AssessAssignmentsTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Teacher's alias (Alias type)
        course_id: z.string().length(56), // Course NFT policy ID (GYMintingPolicyId)
        assignment_decisions: z.array(
          z.object({
            alias: z.string().min(1).max(31), // Student's alias (Alias type)
            outcome: z.enum(["accept", "refuse"]), // Assessment outcome
          })
        ),
        initiator_data: initiatorDataSchema, // Optional wallet data (WalletData)
      }),
      // Side effect parameters - for single assessment operations
      // For batched assessments, iterate through assignment_decisions
      sideEffectParams: z.object({
        module_code: z.string().min(1),
        student_access_token_alias: z.string().min(1), // Student's access token alias
        assessment_result: z.enum(["accept", "refuse"]), // Passed through for conditional side effects
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/api/v2/tx/course/teacher/assignments/assess" },
    estimatedCost: getProtocolCost(protocolId),
  },
  // Two conditional side effects - one for accept, one for refuse
  onSubmit: [
    {
      def: "Update Assignment Commitment to Pending Accept",
      method: "POST",
      endpoint: "/course/shared/assignment-commitment/update-status",
      body: {
        policy_id: { source: "context", path: "txParams.course_id" },
        module_code: { source: "context", path: "sideEffectParams.module_code" },
        access_token_alias: { source: "context", path: "sideEffectParams.student_access_token_alias" },
        network_status: { source: "literal", value: "PENDING_TX_ASSIGNMENT_ACCEPTED" },
        pending_tx_hash: { source: "context", path: "txHash" },
      },
      condition: { path: "assessment_result", equals: "accept" },
    },
    {
      def: "Update Assignment Commitment to Pending Refuse",
      method: "POST",
      endpoint: "/course/shared/assignment-commitment/update-status",
      body: {
        policy_id: { source: "context", path: "txParams.course_id" },
        module_code: { source: "context", path: "sideEffectParams.module_code" },
        access_token_alias: { source: "context", path: "sideEffectParams.student_access_token_alias" },
        network_status: { source: "literal", value: "PENDING_TX_ASSIGNMENT_REFUSED" },
        pending_tx_hash: { source: "context", path: "txHash" },
      },
      condition: { path: "assessment_result", equals: "refuse" },
    },
  ],
  onConfirmation: [
    {
      def: "Confirm Assignment Assessment",
      method: "POST",
      endpoint: "/course/shared/assignment-commitment/confirm-transaction",
      body: {
        policy_id: { source: "context", path: "txParams.course_id" },
        module_code: { source: "context", path: "sideEffectParams.module_code" },
        access_token_alias: { source: "context", path: "sideEffectParams.student_access_token_alias" },
        tx_hash: { source: "context", path: "txHash" },
      },
      critical: true,
      // No condition needed - confirmation works for both accept and refuse
      // The DB API maps PENDING_TX_ASSIGNMENT_ACCEPTED → ASSIGNMENT_ACCEPTED
      // and PENDING_TX_ASSIGNMENT_REFUSED → ASSIGNMENT_REFUSED
    },
  ],
  ui: {
    buttonText: "Assess Assignment",
    title: "Assess Student Assignment",
    description: [
      "Review and assess a student's assignment submission. Accept to grant the student a credential for completing this module, or refuse with feedback for improvement.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/course/teacher/assignments/assess",
    footerLinkText: "Tx Documentation",
    successInfo: "Assignment assessment submitted successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/course/teacher/assignments/assess",
    apiDocs: "https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/index.html#/default/post_v2_tx_course_teacher_assignments_assess",
  },
};
