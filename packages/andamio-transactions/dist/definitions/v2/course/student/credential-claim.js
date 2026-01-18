"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COURSE_STUDENT_CREDENTIAL_CLAIM = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "course.student.credential.claim";
const txName = "COURSE_STUDENT_CREDENTIAL_CLAIM";
/**
 * WalletData schema for optional initiator data
 */
const initiatorDataSchema = zod_1.z
    .object({
    used_addresses: zod_1.z.array(zod_1.z.string()), // Array of bech32 addresses
    change_address: zod_1.z.string(), // Bech32 change address
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
exports.COURSE_STUDENT_CREDENTIAL_CLAIM = {
    txType: txName,
    role: "course-student",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches ClaimCourseCredentialTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Student's alias (Alias type)
                course_id: zod_1.z.string().length(56), // Course NFT policy ID (GYMintingPolicyId)
                initiator_data: initiatorDataSchema, // Optional wallet data (WalletData)
            }),
            // No sideEffectParams - this transaction has no database side effects
        }),
        builder: { type: "api-endpoint", endpoint: "/api/v2/tx/course/student/credential/claim" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
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
        apiDocs: "https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/index.html#/default/post_v2_tx_course_student_credential_claim",
    },
};
