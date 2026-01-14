"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_CONTRIBUTOR_TASK_COMMIT = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "project.contributor.task.commit";
const txName = "PROJECT_CONTRIBUTOR_TASK_COMMIT";
/**
 * PROJECT_CONTRIBUTOR_TASK_COMMIT Transaction Definition
 *
 * Contributors commit to a new task after completing their current task.
 *
 * ## API Endpoint
 * POST /v2/tx/project/contributor/task/commit
 *
 * ## Request Body (CommitTaskTxRequest)
 * ```json
 * {
 *   "alias": "contributor1",              // Contributor's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "contributor_state_id": "def456...",  // Contributor state ID (56 char hex)
 *   "task_hash": "ghi789...",             // Task hash to commit to (64 char hex)
 *   "task_info": "jkl012..."              // Task info hash
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
 * After a task has been accepted:
 * - Contributor can commit to a new task in the same project
 * - Similar to initial enrollment but with existing contributor state
 *
 * ## Side Effects
 *
 * **onSubmit**: Create new task commitment with PENDING_TX_COMMITMENT_MADE status
 * **onConfirmation**: Confirm commitment, set status to PENDING_APPROVAL
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
exports.PROJECT_CONTRIBUTOR_TASK_COMMIT = {
    txType: txName,
    role: "project-contributor",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches CommitTaskTxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Contributor's alias
                project_id: zod_1.z.string().length(56), // Project NFT policy ID (hex)
                contributor_state_id: zod_1.z.string().length(56), // Contributor state ID
                task_hash: zod_1.z.string().length(64), // Task hash to commit to
                task_info: zod_1.z.string().max(140), // Task info (ShortText140, max 140 chars)
            }),
            // Side effect parameters - matches DB API task-commitments/create
            sideEffectParams: zod_1.z.object({
                evidence: zod_1.z.any().optional(), // Initial evidence as Tiptap JSON document
            }),
        }),
        builder: { type: "api-endpoint", endpoint: "/v2/tx/project/contributor/task/commit" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    onSubmit: [
        {
            def: "Create Task Commitment",
            method: "POST",
            endpoint: "/project/contributor/commitment/create",
            body: {
                task_hash: { source: "context", path: "txParams.task_hash" },
                evidence: { source: "context", path: "sideEffectParams.evidence" },
                status: { source: "literal", value: "PENDING_TX_COMMITMENT_MADE" },
                pending_tx_hash: { source: "context", path: "txHash" },
            },
        },
    ],
    onConfirmation: [
        {
            def: "Confirm Task Commitment",
            method: "POST",
            endpoint: "/project/contributor/commitment/confirm-transaction",
            body: {
                task_hash: { source: "context", path: "txParams.task_hash" },
                tx_hash: { source: "context", path: "txHash" },
            },
            critical: true,
        },
    ],
    ui: {
        buttonText: "Commit to Task",
        title: "Commit to New Task",
        description: [
            "Commit to a new task in this project. This creates an on-chain commitment to the task.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/contributor/task-commit",
        footerLinkText: "Tx Documentation",
        successInfo: "Successfully committed to task!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/contributor/task-commit",
        apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/docs#/default/post_v2_tx_project_contributor_task_commit",
    },
};
