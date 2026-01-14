import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "course.student.credential.claim";
const txName = "COURSE_STUDENT_CREDENTIAL_CLAIM" as const;

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
export const COURSE_STUDENT_CREDENTIAL_CLAIM: AndamioTransactionDefinition = {
  txType: txName,
  role: "course-student",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches ClaimCourseCredentialTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Student's alias (Alias type)
        course_id: z.string().length(56), // Course NFT policy ID (GYMintingPolicyId)
        initiator_data: initiatorDataSchema, // Optional wallet data (WalletData)
      }),
      // No sideEffectParams - this transaction has no database side effects
    }),
    builder: { type: "api-endpoint", endpoint: "/v2/tx/course/student/credential/claim" },
    estimatedCost: getProtocolCost(protocolId),
  },
  // No side effects - see JSDoc above for rationale
  onSubmit: [],
  onConfirmation: [],
  ui: {
    buttonText: "Claim Credential",
    title: "Claim Course Credential",
    description: [
      "Claim your credential for completing this course. Once claimed, you will receive an on-chain credential token that proves your achievement.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/course/student/credential/claim",
    footerLinkText: "Tx Documentation",
    successInfo: "Credential claimed successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/course/student/credential/claim",
    apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/docs#/default/post_v2_tx_course_student_credential_claim",
  },
};
