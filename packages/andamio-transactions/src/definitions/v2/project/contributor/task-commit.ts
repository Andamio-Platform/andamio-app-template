import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "project.contributor.task.commit";
const txName = "PROJECT_CONTRIBUTOR_TASK_COMMIT" as const;

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
 * **onSubmit**: Create commitment and submit for review with evidence (direct commit + submit flow)
 * **onConfirmation**: Confirm commitment, set status to SUBMITTED
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export const PROJECT_CONTRIBUTOR_TASK_COMMIT: AndamioTransactionDefinition = {
  txType: txName,
  role: "project-contributor",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches CommitTaskTxRequest from Atlas TX API
      // NOTE: Swagger shows flat fields, but backend internally expects a `tasks` array
      // with `contributor_state_policy_id` in each task object.
      txParams: z.object({
        alias: z.string().min(1).max(31), // Contributor's alias
        project_id: z.string().length(56), // Project NFT policy ID (hex)
        contributor_state_id: z.string().length(56), // Contributor state ID (same as project_state_policy_id)
        task_hash: z.string().length(64), // Task hash to commit to (64 char hex)
        task_info: z.string().max(140), // Task info hash (ShortText140, max 140 chars)
        // Backend expects tasks array with contributor_state_policy_id from Andamioscan
        // @see https://github.com/Andamio-Platform/andamioscan/issues/10
        tasks: z.array(z.object({
          task_hash: z.string().length(64),
          task_info: z.string().max(140),
          contributor_state_policy_id: z.string().length(56), // From Andamioscan task
        })).min(1).max(1),
      }),
      // Side effect parameters - matches DB API task-commitments/create
      sideEffectParams: z.object({
        evidence: z.any().optional(), // Initial evidence as Tiptap JSON document
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/api/v2/tx/project/contributor/task/commit" },
    estimatedCost: getProtocolCost(protocolId),
  },
  onSubmit: [
    {
      def: "Create Task Commitment",
      method: "POST",
      endpoint: "/project-v2/contributor/commitment/create",
      body: {
        task_hash: { source: "context", path: "txParams.task_hash" },
      },
      // Non-critical: Task may not exist in DB yet if task_hash wasn't synced
      // See: https://github.com/Andamio-Platform/andamio-t3-app-template/issues/44
      critical: false,
    },
    {
      def: "Submit Commitment for Review",
      method: "POST",
      endpoint: "/project-v2/contributor/commitment/submit",
      body: {
        task_hash: { source: "context", path: "txParams.task_hash" },
        evidence: { source: "context", path: "sideEffectParams.evidence" },
        pending_tx_hash: { source: "context", path: "txHash" },
      },
      // Non-critical: Depends on Create succeeding
      critical: false,
    },
  ],
  onConfirmation: [
    {
      def: "Confirm Task Commitment",
      method: "POST",
      endpoint: "/project-v2/contributor/commitment/confirm-tx",
      body: {
        task_hash: { source: "context", path: "txParams.task_hash" },
        tx_hash: { source: "context", path: "txHash" },
      },
      // Non-critical until task sync is implemented
      // See: https://github.com/Andamio-Platform/andamio-t3-app-template/issues/44
      critical: false,
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
    apiDocs: "https://andamio-api-gateway-168705267033.us-central1.run.app/api/v1/docs/index.html#/default/post_v2_tx_project_contributor_task_commit",
  },
};
