"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INSTANCE_PROJECT_CREATE = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../utils/schema-helpers");
const protocolId = "instance.owner.project.create";
const txName = "INSTANCE_PROJECT_CREATE";
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
 * List value schema for deposit specification
 */
const listValueSchema = zod_1.z.object({
    lovelace: zod_1.z.number(),
    native_assets: zod_1.z.array(zod_1.z.object({
        policy_id: zod_1.z.string().length(56),
        assets: zod_1.z.array(zod_1.z.object({
            asset_name: zod_1.z.string(),
            quantity: zod_1.z.number(),
        })),
    })),
});
/**
 * INSTANCE_PROJECT_CREATE Transaction Definition
 *
 * Creates a new project on-chain by minting a Project NFT.
 * This is an instance-level transaction for project owners.
 *
 * ## API Endpoint
 * POST /v2/tx/instance/owner/project/create
 *
 * ## Request Body (CreateProjectTxRequest)
 * ```json
 * {
 *   "alias": "projectowner",           // Owner's access token alias
 *   "managers": ["manager1", "manager2"],  // Manager aliases
 *   "course_prereqs": ["abc123..."],   // Course policy IDs as prerequisites
 *   "deposit_value": {                 // Required deposit for contributors
 *     "lovelace": 5000000,
 *     "native_assets": []
 *   },
 *   "initiator_data": {                // Optional wallet data
 *     "used_addresses": ["addr_test1..."],
 *     "change_address": "addr_test1..."
 *   }
 * }
 * ```
 *
 * ## Response (UnsignedTxResponseInitProject)
 * ```json
 * {
 *   "unsigned_tx": "84aa00...",
 *   "project_id": "68396f1567f5b8d813517b82e1b07e62b4d61392621d916fa5dac3e7"
 * }
 * ```
 *
 * ## Side Effects
 *
 * **onSubmit**: Create project record in database with title and project_id.
 * The `project_id` comes from the transaction API response, so the frontend must
 * extract it and include it in `buildInputs.project_nft_policy_id` before executing side effects.
 *
 * **onConfirmation**: Set project `live` status to true once confirmed on-chain.
 */
exports.INSTANCE_PROJECT_CREATE = {
    txType: txName,
    role: "instance-owner",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    partialSign: true, // V2 transactions require partial signing for Atlas backend
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches CreateProjectTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Owner's access token alias
                managers: zod_1.z.array(zod_1.z.string().min(1).max(31)), // Manager aliases
                // course_prereqs: [[course_id, [slt_hash]]] - each entry is [courseId, [required module hashes]]
                course_prereqs: zod_1.z.array(zod_1.z.tuple([
                    zod_1.z.string().length(56), // course_id (LocalStateNFT policy ID)
                    zod_1.z.array(zod_1.z.string().length(64)), // slt_hashes (module token names to complete)
                ])),
                // deposit_value: [[asset_unit, amount]] pairs - flat array format
                deposit_value: zod_1.z.array(zod_1.z.tuple([zod_1.z.string(), zod_1.z.number()])),
                initiator_data: initiatorDataSchema,
            }),
            // Side effect parameters (not used by transaction API)
            // project_nft_policy_id is extracted from API response (project_id) by frontend
            sideEffectParams: zod_1.z.object({
                title: zod_1.z.string().min(1),
                project_nft_policy_id: zod_1.z.string().length(56), // Extracted from API response project_id
            }),
        }),
        builder: { type: "api-endpoint", endpoint: "/api/v2/tx/instance/owner/project/create" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    onSubmit: [
        {
            def: "Create Project in Database",
            method: "POST",
            endpoint: "/project/owner/treasury/mint",
            body: {
                title: { source: "context", path: "sideEffectParams.title" },
                treasury_nft_policy_id: { source: "context", path: "sideEffectParams.project_nft_policy_id" },
            },
        },
    ],
    onConfirmation: [
        {
            def: "Confirm Project Creation",
            method: "POST",
            endpoint: "/project/owner/treasury/confirm-mint",
            body: {
                treasury_nft_policy_id: { source: "context", path: "sideEffectParams.project_nft_policy_id" },
                tx_hash: { source: "context", path: "txHash" },
            },
            critical: true,
        },
    ],
    ui: {
        buttonText: "Create Project",
        title: "Create Project",
        description: [
            "Create a new project on the Andamio platform. This will mint a Project NFT that represents ownership and enables on-chain project management.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/instance/owner/project/create",
        footerLinkText: "Tx Documentation",
        successInfo: "Project created successfully!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/instance/owner/project/create",
        apiDocs: "https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/index.html#/default/post_v2_tx_instance_owner_project_create",
    },
};
