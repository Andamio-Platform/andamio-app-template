import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "project.manager.tasks.assess";
const txName = "PROJECT_MANAGER_TASKS_ASSESS" as const;

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
 * **onSubmit**: Call assess endpoint with decision (accept/refuse/deny)
 * Sets commitment to PENDING_TX_ASSESS status
 *
 * **onConfirmation**: Confirm assessment, finalize commitment status to ACCEPTED/REFUSED/DENIED
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export const PROJECT_MANAGER_TASKS_ASSESS: AndamioTransactionDefinition = {
  txType: txName,
  role: "project-manager",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches TasksAssessV2TxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Manager's alias
        project_id: z.string().length(56), // Project NFT policy ID (hex)
        contributor_state_id: z.string().length(56), // Contributor state ID
        task_decisions: z.array(
          z.object({
            alias: z.string().min(1).max(31), // Contributor's alias (ProjectOutcome schema)
            outcome: z.enum(["accept", "refuse", "deny"]),
          })
        ),
      }),
      // Side effect parameters - matches DB API /project-v2/manager/commitment/assess
      sideEffectParams: z.object({
        task_hash: z.string().length(64), // Task hash being assessed
        contributor_alias: z.string().min(1).max(31), // Contributor's alias for the commitment
        decision: z.enum(["accept", "refuse", "deny"]), // Assessment decision
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/v2/tx/project/manager/tasks/assess" },
    estimatedCost: getProtocolCost(protocolId),
  },
  onSubmit: [
    {
      def: "Assess Task Commitment",
      method: "POST",
      endpoint: "/project-v2/manager/commitment/assess",
      body: {
        task_hash: { source: "context", path: "sideEffectParams.task_hash" },
        contributor_alias: { source: "context", path: "sideEffectParams.contributor_alias" },
        decision: { source: "context", path: "sideEffectParams.decision" },
        pending_tx_hash: { source: "context", path: "txHash" },
      },
    },
  ],
  onConfirmation: [
    {
      def: "Confirm Task Assessment",
      method: "POST",
      endpoint: "/project-v2/manager/commitment/confirm-assess",
      body: {
        task_hash: { source: "context", path: "sideEffectParams.task_hash" },
        contributor_alias: { source: "context", path: "sideEffectParams.contributor_alias" },
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
