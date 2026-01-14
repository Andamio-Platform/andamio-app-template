"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_OWNER_BLACKLIST_MANAGE = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "project.owner.contributor-blacklist.manage";
const txName = "PROJECT_OWNER_BLACKLIST_MANAGE";
/**
 * PROJECT_OWNER_BLACKLIST_MANAGE Transaction Definition
 *
 * Project owner manages the contributor blacklist for a project.
 * Blacklisted contributors cannot enroll or participate in the project.
 *
 * ## API Endpoint
 * POST /v2/tx/project/owner/contributor-blacklist/manage
 *
 * ## Request Body (ManageContributorBlacklistTxRequest)
 * ```json
 * {
 *   "alias": "projectowner",           // Owner's access token alias
 *   "project_id": "abc123...",         // Project NFT policy ID (56 char hex)
 *   "aliases_to_add": ["badactor1"],   // Aliases to blacklist
 *   "aliases_to_remove": ["forgiven1"] // Aliases to remove from blacklist
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
 * ## Side Effects
 *
 * **None** - This is a purely on-chain action. Blacklist status is determined by the
 * Project Governance UTxO on-chain.
 *
 * ## On-Chain Result
 *
 * Updates the Project Governance UTxO to add/remove aliases from the contributor blacklist.
 * Blacklisted contributors cannot:
 * - Enroll in the project
 * - Commit to tasks
 * - Receive rewards
 */
exports.PROJECT_OWNER_BLACKLIST_MANAGE = {
    txType: txName,
    role: "project-owner",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches ManageContributorBlacklistTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Owner's alias
                project_id: zod_1.z.string().length(56), // Project NFT policy ID (hex)
                aliases_to_add: zod_1.z.array(zod_1.z.string().min(1).max(31)), // Aliases to blacklist
                aliases_to_remove: zod_1.z.array(zod_1.z.string().min(1).max(31)), // Aliases to remove from blacklist
            }),
            // No side effect parameters - purely on-chain action
            sideEffectParams: zod_1.z.object({}),
        }),
        builder: { type: "api-endpoint", endpoint: "/v2/tx/project/owner/contributor-blacklist/manage" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    // No side effects - blacklist status is determined on-chain
    onSubmit: [],
    onConfirmation: [],
    ui: {
        buttonText: "Manage Blacklist",
        title: "Manage Contributor Blacklist",
        description: [
            "Add or remove contributors from the project blacklist. Blacklisted contributors cannot participate in this project.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/owner/blacklist-manage",
        footerLinkText: "Tx Documentation",
        successInfo: "Contributor blacklist updated successfully!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/owner/blacklist-manage",
        apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/docs#/default/post_v2_tx_project_owner_contributor_blacklist_manage",
    },
};
