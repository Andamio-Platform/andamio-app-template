"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COURSE_STUDENT_ASSIGNMENT_UPDATE = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "course.student.assignment.update";
const txName = "COURSE_STUDENT_ASSIGNMENT_UPDATE";
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
exports.COURSE_STUDENT_ASSIGNMENT_UPDATE = {
    txType: txName,
    role: "course-student",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches UpdateAssignmentTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Student's alias (Alias type)
                assignment_info: zod_1.z.string().min(1).max(140), // Updated assignment info (ShortText140, max 140 chars)
                course_id: zod_1.z.string().length(56), // Course NFT policy ID (GYMintingPolicyId)
                initiator_data: initiatorDataSchema, // Optional wallet data (WalletData)
            }),
            // Side effect parameters
            sideEffectParams: zod_1.z.object({
                module_code: zod_1.z.string().min(1), // Target module code
                network_evidence: zod_1.z.any(), // Tiptap JSON document
                network_evidence_hash: zod_1.z.string(), // Hash of the evidence
            }),
        }),
        builder: { type: "api-endpoint", endpoint: "/api/v2/tx/course/student/assignment/update" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
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
        apiDocs: "https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/index.html#/default/post_v2_tx_course_student_assignment_update",
    },
};
