"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_CONTRIBUTOR_TASK_ACTION = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "project.contributor.task-action";
const txName = "PROJECT_CONTRIBUTOR_TASK_ACTION";
/**
 * PROJECT_CONTRIBUTOR_TASK_ACTION Transaction Definition
 *
 * Contributors perform an action on their current task (update submission, etc).
 *
 * ## API Endpoint
 * POST /v2/tx/project/contributor/task/action
 *
 * ## Request Body (TaskActionTxRequest)
 * ```json
 * {
 *   "alias": "contributor1",              // Contributor's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "project_info": "optional_info..."    // Optional project info
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
 * ## Use Cases
 *
 * This transaction is used for various task-related actions after enrollment:
 * - Updating task submission evidence
 * - Performing task state transitions
 *
 * ## Side Effects
 *
 * **onSubmit**: Update task commitment to PENDING_TX_ADD_INFO status
 * **onConfirmation**: Confirm action, transition to PENDING_APPROVAL
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
exports.PROJECT_CONTRIBUTOR_TASK_ACTION = {
    txType: txName,
    role: "project-contributor",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches TaskActionTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Contributor's alias
                project_id: zod_1.z.string().length(56), // Project NFT policy ID (hex)
                project_info: zod_1.z.string().max(140).optional(), // Optional project info (ShortText140, max 140 chars)
            }),
            // Side effect parameters - matches DB API task-commitments/update-status
            sideEffectParams: zod_1.z.object({
                task_hash: zod_1.z.string().length(64), // Task hash (from on-chain contributor state)
                evidence: zod_1.z.any().optional(), // Updated evidence as Tiptap JSON document
            }),
        }),
        builder: { type: "api-endpoint", endpoint: "/v2/tx/project/contributor/task/action" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    onSubmit: [
        {
            def: "Update Task Status to Pending",
            method: "POST",
            endpoint: "/project/contributor/commitment/update-status",
            body: {
                task_hash: { source: "context", path: "sideEffectParams.task_hash" },
                status: { source: "literal", value: "PENDING_TX_ADD_INFO" },
                pending_tx_hash: { source: "context", path: "txHash" },
            },
        },
    ],
    onConfirmation: [
        {
            def: "Confirm Task Action",
            method: "POST",
            endpoint: "/project/contributor/commitment/confirm-transaction",
            body: {
                task_hash: { source: "context", path: "sideEffectParams.task_hash" },
                tx_hash: { source: "context", path: "txHash" },
            },
            critical: true,
        },
    ],
    ui: {
        buttonText: "Task Action",
        title: "Perform Task Action",
        description: [
            "Perform an action on your current task, such as updating your submission or transitioning task state.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/contributor/task-action",
        footerLinkText: "Tx Documentation",
        successInfo: "Task action completed successfully!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/contributor/task-action",
        apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/docs#/default/post_v2_tx_project_contributor_task_action",
    },
};
