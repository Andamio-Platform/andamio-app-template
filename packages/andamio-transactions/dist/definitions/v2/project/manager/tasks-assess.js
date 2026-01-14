"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROJECT_MANAGER_TASKS_ASSESS = void 0;
const zod_1 = require("zod");
const protocol_reference_1 = require("../../../../utils/protocol-reference");
const schema_helpers_1 = require("../../../../utils/schema-helpers");
const protocolId = "project.manager.tasks.assess";
const txName = "PROJECT_MANAGER_TASKS_ASSESS";
/**
 * PROJECT_MANAGER_TASKS_ASSESS Transaction Definition
 *
 * Project managers assess contributor task submissions by accepting, refusing, or denying them.
 *
 * ## API Endpoint
 * POST /v2/tx/project/manager/tasks/assess
 *
 * ## Request Body (TasksAssessV2TxRequest)
 * ```json
 * {
 *   "alias": "manager1",                  // Manager's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "contributor_state_id": "def456...",  // Contributor state ID (56 char hex)
 *   "task_decisions": [                   // Array of task decisions (ProjectOutcome)
 *     {
 *       "alias": "contributor1",          // Contributor's alias
 *       "outcome": "accept"               // "accept", "refuse", or "deny"
 *     }
 *   ]
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
 * ## Assessment Outcomes
 *
 * - **Accept**: Contributor receives the task reward, task is marked complete
 * - **Refuse**: Task is rejected but contributor can resubmit
 * - **Deny**: Task is permanently rejected, contributor loses deposit
 *
 * ## Side Effects
 *
 * **onSubmit**: Update task commitment status to pending assessment state
 * (PENDING_TX_TASK_ACCEPTED, PENDING_TX_TASK_REFUSED, or PENDING_TX_TASK_DENIED)
 *
 * **onConfirmation**: Confirm assessment, finalize task commitment status
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
exports.PROJECT_MANAGER_TASKS_ASSESS = {
    txType: txName,
    role: "project-manager",
    protocolSpec: {
        ...(0, protocol_reference_1.createProtocolSpec)("v2", protocolId),
        requiredTokens: ["global-state.access-token-user"],
    },
    buildTxConfig: {
        ...(0, schema_helpers_1.createSchemas)({
            // Transaction API inputs - matches TasksAssessV2TxRequest
            txParams: zod_1.z.object({
                alias: zod_1.z.string().min(1).max(31), // Manager's alias
                project_id: zod_1.z.string().length(56), // Project NFT policy ID (hex)
                contributor_state_id: zod_1.z.string().length(56), // Contributor state ID
                task_decisions: zod_1.z.array(zod_1.z.object({
                    alias: zod_1.z.string().min(1).max(31), // Contributor's alias (ProjectOutcome schema)
                    outcome: zod_1.z.enum(["accept", "refuse", "deny"]),
                })),
            }),
            // Side effect parameters - matches DB API task-commitments/update-status
            sideEffectParams: zod_1.z.object({
                task_hash: zod_1.z.string().length(64), // Task hash being assessed
                assessment_result: zod_1.z.enum(["accept", "refuse", "deny"]),
            }),
        }),
        builder: { type: "api-endpoint", endpoint: "/v2/tx/project/manager/tasks/assess" },
        estimatedCost: (0, protocol_reference_1.getProtocolCost)(protocolId),
    },
    // Conditional side effects based on assessment_result
    onSubmit: [
        {
            def: "Update Task Commitment to Pending Accept",
            method: "POST",
            endpoint: "/project/manager/commitment/update-status",
            body: {
                task_hash: { source: "context", path: "sideEffectParams.task_hash" },
                status: { source: "literal", value: "PENDING_TX_TASK_ACCEPTED" },
                pending_tx_hash: { source: "context", path: "txHash" },
            },
            condition: { path: "assessment_result", equals: "accept" },
        },
        {
            def: "Update Task Commitment to Pending Refuse",
            method: "POST",
            endpoint: "/project/manager/commitment/update-status",
            body: {
                task_hash: { source: "context", path: "sideEffectParams.task_hash" },
                status: { source: "literal", value: "PENDING_TX_TASK_REFUSED" },
                pending_tx_hash: { source: "context", path: "txHash" },
            },
            condition: { path: "assessment_result", equals: "refuse" },
        },
        {
            def: "Update Task Commitment to Pending Deny",
            method: "POST",
            endpoint: "/project/manager/commitment/update-status",
            body: {
                task_hash: { source: "context", path: "sideEffectParams.task_hash" },
                status: { source: "literal", value: "PENDING_TX_TASK_DENIED" },
                pending_tx_hash: { source: "context", path: "txHash" },
            },
            condition: { path: "assessment_result", equals: "deny" },
        },
    ],
    onConfirmation: [
        {
            def: "Confirm Task Assessment",
            method: "POST",
            endpoint: "/project/manager/commitment/confirm-transaction",
            body: {
                task_hash: { source: "context", path: "sideEffectParams.task_hash" },
                tx_hash: { source: "context", path: "txHash" },
            },
            critical: true,
        },
    ],
    ui: {
        buttonText: "Assess Task",
        title: "Assess Task Submission",
        description: [
            "Review and assess a contributor's task submission. Accept to approve and reward, refuse to allow resubmission, or deny to permanently reject.",
        ],
        footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/manager/tasks-assess",
        footerLinkText: "Tx Documentation",
        successInfo: "Task assessment submitted successfully!",
    },
    docs: {
        protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/manager/tasks-assess",
        apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/docs#/default/post_v2_tx_project_manager_tasks_assess",
    },
};
