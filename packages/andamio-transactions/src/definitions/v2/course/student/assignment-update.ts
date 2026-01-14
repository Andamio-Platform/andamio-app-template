import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "course.student.assignment.update";
const txName = "COURSE_STUDENT_ASSIGNMENT_UPDATE" as const;

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
export const COURSE_STUDENT_ASSIGNMENT_UPDATE: AndamioTransactionDefinition = {
  txType: txName,
  role: "course-student",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches UpdateAssignmentTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Student's alias (Alias type)
        assignment_info: z.string().min(1).max(140), // Updated assignment info (ShortText140, max 140 chars)
        course_id: z.string().length(56), // Course NFT policy ID (GYMintingPolicyId)
        initiator_data: initiatorDataSchema, // Optional wallet data (WalletData)
      }),
      // Side effect parameters
      sideEffectParams: z.object({
        module_code: z.string().min(1), // Target module code
        network_evidence: z.any(), // Tiptap JSON document
        network_evidence_hash: z.string(), // Hash of the evidence
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/v2/tx/course/student/assignment/update" },
    estimatedCost: getProtocolCost(protocolId),
  },
  onSubmit: [
    {
      def: "Update Assignment Commitment Evidence",
      method: "POST",
      endpoint: "/course/student/assignment-commitment/update-evidence",
      body: {
        policy_id: { source: "context", path: "txParams.course_id" },
        module_code: { source: "context", path: "sideEffectParams.module_code" },
        access_token_alias: { source: "context", path: "txParams.alias" },
        network_evidence: { source: "context", path: "sideEffectParams.network_evidence" },
        network_evidence_hash: { source: "context", path: "sideEffectParams.network_evidence_hash" },
        network_status: { source: "literal", value: "PENDING_TX_ADD_INFO" },
        pending_tx_hash: { source: "context", path: "txHash" },
      },
    },
  ],
  onConfirmation: [
    {
      def: "Confirm Assignment Update",
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
    buttonText: "Update Assignment",
    title: "Update Assignment",
    description: [
      "Update your assignment evidence while keeping the same module commitment.",
      "To commit to a different module, use the commit transaction instead.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/course/student/assignment/update",
    footerLinkText: "Tx Documentation",
    successInfo: "Assignment updated successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/course/student/assignment/update",
    apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/swagger/index.html#/default/post_v2_tx_course_student_assignment_update",
  },
};
