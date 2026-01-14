"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTANCE_COURSE_CREATE = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../utils/schema-helpers");
const protocolId = "instance.owner.course.create";
const txName = "INSTANCE_COURSE_CREATE";
/**
 * Initiator data schema for transaction building
 */
const initiatorDataSchema = zod_1.z
    .object({
    used_addresses: zod_1.z.array(zod_1.z.string()),
    change_address: zod_1.z.string(),
})
    .optional();
/**
 * INSTANCE_COURSE_CREATE Transaction Definition
 *
 * Creates a new course on-chain by minting a Course NFT.
 * This is an instance-level transaction for course owners.
 *
 * ## API Endpoint
 * POST /v2/tx/instance/owner/course/create
 *
 * ## Request Body (CreateCourseTxRequest)
 * ```json
 * {
 *   "alias": "courseowner",           // Owner's access token alias
 *   "teachers": ["teacher1", "teacher2"],  // Teacher aliases (at least one)
 *   "initiator_data": {               // Optional wallet data
 *     "used_addresses": ["addr_test1..."],
 *     "change_address": "addr_test1..."
 *   }
 * }
 * ```
 *
 * ## Response (UnsignedTxResponseInitCourse)
 * ```json
 * {
 *   "unsigned_tx": "84aa00...",
 *   "course_id": "68396f1567f5b8d813517b82e1b07e62b4d61392621d916fa5dac3e7"
 * }
 * ```
 *
 * ## Side Effects
 *
 * **onSubmit**: Create course record in database with title and course_nft_policy_id.
 * The `course_id` comes from the transaction API response, so the frontend must
 * extract it and include it in `buildInputs.course_nft_policy_id` before executing side effects.
 * Teachers are NOT passed here - they are synced from on-chain data on confirmation.
 *
 * **onConfirmation**: Set course `live` status to true and sync teachers from on-chain.
 * The API fetches teacher data from AndamioScan, so teachers are source-of-truth from blockchain.
 */
exports.INSTANCE_COURSE_CREATE = {
    txType: txName,
    role: "instance-owner",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches CreateCourseTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Owner's access token alias
                teachers: zod_1.z.array(zod_1.z.string().min(1).max(31)).min(1), // Teacher aliases (at least one)
                initiator_data: initiatorDataSchema,
            }),
            // Side effect parameters (not used by transaction API)
            // course_nft_policy_id is extracted from API response (course_id) by frontend
            sideEffectParams: zod_1.z.object({
                title: zod_1.z.string().min(1),
                course_nft_policy_id: zod_1.z.string().length(56), // Extracted from API response course_id
            }),
        }),
        builder: { type: "api-endpoint", endpoint: "/v2/tx/instance/owner/course/create" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    onSubmit: [
        {
            def: "Create Course in Database",
            method: "POST",
            endpoint: "/course/owner/course/mint",
            body: {
                title: { source: "context", path: "buildInputs.title" },
                course_nft_policy_id: { source: "context", path: "buildInputs.course_nft_policy_id" },
            },
        },
    ],
    onConfirmation: [
        {
            def: "Confirm Course Creation and Sync Teachers",
            method: "POST",
            endpoint: "/course/owner/course/confirm-mint",
            body: {
                course_nft_policy_id: { source: "context", path: "buildInputs.course_nft_policy_id" },
                tx_hash: { source: "context", path: "txHash" },
            },
            critical: true,
        },
    ],
    ui: {
        buttonText: "Create Course",
        title: "Create Course",
        description: [
            "Create a new course on the Andamio platform. This will mint a Course NFT that represents ownership and enables on-chain course management.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/instance/owner/course/create",
        footerLinkText: "Tx Documentation",
        successInfo: "Course created successfully!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/instance/owner/course/create",
        apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/swagger/index.html#/default/post_v2_tx_instance_owner_course_create",
    },
};
