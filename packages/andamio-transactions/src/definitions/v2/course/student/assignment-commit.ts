import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "course.student.assignment.commit";
const txName = "COURSE_STUDENT_ASSIGNMENT_COMMIT" as const;

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
export const COURSE_STUDENT_ASSIGNMENT_COMMIT: AndamioTransactionDefinition = {
  txType: txName,
  role: "course-student",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches EnrollCourseTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Student's alias (1-31 chars, alphanumeric + underscores)
        course_id: z.string().length(56), // Course NFT policy ID (hex)
        slt_hash: z.string().length(64), // Module token name (REQUIRED)
        assignment_info: z.string().min(1).max(140), // Evidence hash (ShortText140, max 140 chars)
        initiator_data: z
          .object({
            used_addresses: z.array(z.string()),
            change_address: z.string(),
          })
          .optional(),
      }),
      // Side effect parameters for creating the assignment commitment
      sideEffectParams: z.object({
        module_code: z.string().min(1), // Module being committed to
        network_evidence: z.any(), // Tiptap JSON document (assignment submission)
        network_evidence_hash: z.string(), // Hash of the evidence
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/api/v2/tx/course/student/assignment/commit" },
    estimatedCost: getProtocolCost(protocolId),
  },
  onSubmit: [
    {
      def: "Create Assignment Commitment",
      method: "POST",
      endpoint: "/course/student/assignment-commitment/create",
      body: {
        policy_id: { source: "context", path: "txParams.course_id" },
        module_code: { source: "context", path: "sideEffectParams.module_code" },
        access_token_alias: { source: "context", path: "txParams.alias" },
        network_evidence: { source: "context", path: "sideEffectParams.network_evidence" },
        network_evidence_hash: { source: "context", path: "sideEffectParams.network_evidence_hash" },
        network_status: { source: "literal", value: "PENDING_TX_COMMITMENT_MADE" },
        pending_tx_hash: { source: "context", path: "txHash" },
      },
    },
  ],
  onConfirmation: [
    {
      def: "Confirm Assignment Commitment",
      method: "POST",
      endpoint: "/course/shared/assignment-commitment/confirm-transaction",
      body: {
        policy_id: { source: "context", path: "txParams.course_id" },
        module_code: { source: "context", path: "sideEffectParams.module_code" },
        access_token_alias: { source: "context", path: "txParams.alias" },
        tx_hash: { source: "context", path: "txHash" },
      },
      critical: true,
    },
  ],
  ui: {
    buttonText: "Commit to Assignment",
    title: "Commit to Assignment",
    description: [
      "Commit to an assignment in this course. This creates an on-chain record of your commitment.",
      "You must select a module and provide assignment evidence.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/course/student/assignment/commit",
    footerLinkText: "Tx Documentation",
    successInfo: "Successfully committed to assignment!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/course/student/assignment/commit",
    apiDocs: "https://dev-api.andamio.io/api/v1/docs/index.html#/default/post_v2_tx_course_student_assignment_commit",
  },
};
