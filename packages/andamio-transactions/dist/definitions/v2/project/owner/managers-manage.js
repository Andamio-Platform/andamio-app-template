"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_OWNER_MANAGERS_MANAGE = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "project.owner.managers.manage";
const txName = "PROJECT_OWNER_MANAGERS_MANAGE";
/**
 * PROJECT_OWNER_MANAGERS_MANAGE Transaction Definition
 *
 * Project owner adds or removes managers from a project by updating the Project Governance UTxO.
 *
 * ## API Endpoint
 * POST /v2/tx/project/owner/managers/manage
 *
 * ## Request Body (ManageManagersTxRequest)
 * ```json
 * {
 *   "alias": "projectowner",              // Owner's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "managers_to_add": ["manager1"],      // Aliases of managers to add
 *   "managers_to_remove": ["manager2"]    // Aliases of managers to remove
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
 * **None** - This is a purely on-chain action. Manager access is determined by the
 * Project Governance UTxO on-chain.
 *
 * ## On-Chain Result
 *
 * Updates the Project Governance UTxO to add/remove manager aliases. Managers gain
 * the ability to:
 * - Manage project tasks
 * - Assess contributor task submissions (accept/refuse/deny)
 */
exports.PROJECT_OWNER_MANAGERS_MANAGE = {
    txType: txName,
    role: "project-owner",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches ManageManagersTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Owner's alias
                project_id: zod_1.z.string().length(56), // Project NFT policy ID (hex)
                managers_to_add: zod_1.z.array(zod_1.z.string().min(1).max(31)), // Aliases to add
                managers_to_remove: zod_1.z.array(zod_1.z.string().min(1).max(31)), // Aliases to remove
            }),
            // No side effect parameters - purely on-chain action
            sideEffectParams: zod_1.z.object({}),
        }),
        builder: { type: "api-endpoint", endpoint: "/api/v2/tx/project/owner/managers/manage" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    // No side effects - manager access is determined on-chain via Project Governance UTxO
    onSubmit: [],
    onConfirmation: [],
    ui: {
        buttonText: "Manage Managers",
        title: "Manage Project Managers",
        description: [
            "Add or remove managers from a project. Managers have the ability to manage project tasks and assess contributor submissions.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/owner/managers-manage",
        footerLinkText: "Tx Documentation",
        successInfo: "Project managers updated successfully!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/owner/managers-manage",
        apiDocs: "https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/index.html#/default/post_v2_tx_project_owner_managers_manage",
    },
};
