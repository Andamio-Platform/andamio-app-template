import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "project.manager.tasks.manage";
const txName = "PROJECT_MANAGER_TASKS_MANAGE" as const;

/**
 * ListValue schema - Array of [asset_class, quantity] tuples
 *
 * Format: [["policyId.tokenName", quantity], ...] or [["lovelace", quantity]]
 *
 * Example: [["ff80aaaf03a273b8f5c558168dc0e2377eea810badbae6eceefc14ef.474f4c44", 1000000]]
 */
const listValueSchema = z.array(
  z.tuple([z.string(), z.number()])
);

/**
 * ProjectData schema - Task to add or remove
 *
 * @property project_content - Task content/description text (max 140 chars, NOT a hash)
 * @property expiration_time - Unix timestamp in milliseconds
 * @property lovelace_amount - Reward in lovelace
 * @property native_assets - ListValue array of [asset_class, quantity] tuples
 */
const projectDataSchema = z.object({
  project_content: z.string().max(140), // Task content text (max 140 chars)
  expiration_time: z.number(), // Unix timestamp in milliseconds
  lovelace_amount: z.number(),
  native_assets: listValueSchema,
});

/**
 * PROJECT_MANAGER_TASKS_MANAGE Transaction Definition
 *
 * Project managers add or remove tasks from a project.
 *
 * ## API Endpoint
 * POST /v2/tx/project/manager/tasks/manage
 *
 * ## Request Body (ManageTasksTxRequest)
 * ```json
 * {
 *   "alias": "manager1",                  // Manager's access token alias
 *   "project_id": "abc123...",            // Project NFT policy ID (56 char hex)
 *   "contributor_state_id": "def456...",  // Contributor state policy ID (56 char hex) - from Andamioscan
 *   "tasks_to_add": [{
 *     "project_content": "Task description text",  // Task content (max 140 chars)
 *     "expiration_time": 1735689600000,            // Unix timestamp in MILLISECONDS
 *     "lovelace_amount": 5000000,
 *     "native_assets": []                          // ListValue: [["policy.name", qty], ...]
 *   }],
 *   "tasks_to_remove": [{                 // Full ProjectData objects, NOT just hashes!
 *     "project_content": "Task to remove",
 *     "expiration_time": 1735689600000,
 *     "lovelace_amount": 5000000,
 *     "native_assets": []
 *   }],
 *   "deposit_value": []                   // Required ListValue: [["lovelace", amount]]
 * }
 * ```
 *
 * ## ListValue Format
 * Array of [asset_class, quantity] tuples:
 * - For lovelace: `[["lovelace", 5000000]]`
 * - For native assets: `[["policyId.tokenName", 100]]`
 * - Combined: `[["lovelace", 5000000], ["policy.token", 100]]`
 *
 * ## Response (UnsignedTxResponse)
 * ```json
 * {
 *   "unsigned_tx": "84aa00..."
 * }
 * ```
 *
 * ## Task Hash Fields
 *
 * Each Task in the database has two hash fields:
 * - **arbitraryHash**: Our internal DB identifier, computed from task content (title, description, etc.)
 *   Set when task is created/approved. Used to identify tasks in side effects.
 * - **taskHash**: The on-chain identifier, received after transaction confirmation.
 *   This is the token name on the blockchain.
 *
 * ## Side Effects
 *
 * **onSubmit**: Batch update all affected tasks to `PENDING_TX` status.
 * Use `formatTasksPending()` helper to construct `sideEffectParams.tasks_pending`.
 *
 * **onConfirmation**: Batch confirm all tasks and save their on-chain taskHash.
 * Use `formatTasksConfirm()` helper to construct `sideEffectParams.tasks_confirm`.
 *
 * ## Critical Flag Pattern
 *
 * - **onSubmit**: NOT critical. Sets PENDING_TX status. Can retry without permanent inconsistency.
 * - **onConfirmation**: CRITICAL. Finalizes DB state to match on-chain. Must succeed.
 */
export const PROJECT_MANAGER_TASKS_MANAGE: AndamioTransactionDefinition = {
  txType: txName,
  role: "project-manager",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches ManageTasksTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Manager's alias
        project_id: z.string().length(56), // Project NFT policy ID (hex)
        contributor_state_id: z.string().length(56), // Contributor state ID (required - get from Andamioscan)
        tasks_to_add: z.array(projectDataSchema), // Array of ProjectData objects
        tasks_to_remove: z.array(projectDataSchema), // Array of ProjectData objects (NOT just hashes!)
        deposit_value: listValueSchema, // Required ListValue array
      }),
      // Side effect parameters - caller constructs these using helper functions
      sideEffectParams: z.object({
        // For onSubmit: array of tasks to mark as PENDING_TX
        tasks_pending: z.array(
          z.object({
            arbitrary_hash: z.string().length(64),
            status: z.literal("PENDING_TX"),
            pending_tx_hash: z.string().length(64),
          })
        ),
        // For onConfirmation: array of tasks with their on-chain hashes
        tasks_confirm: z.array(
          z.object({
            arbitrary_hash: z.string().length(64),
            task_hash: z.string().length(64),
          })
        ),
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/v2/tx/project/manager/tasks/manage" },
    estimatedCost: getProtocolCost(protocolId),
    inputHelpers: {
      tasks_pending: {
        helperName: "formatTasksPending",
        description:
          "Constructs the tasks_pending array for sideEffectParams. " +
          "Call after transaction submission with arbitrary hashes and txHash.",
        example: `const tasks_pending = formatTasksPending(arbitraryHashes, txHash);
const sideEffectParams = { tasks_pending, tasks_confirm: [] };`,
      },
      tasks_confirm: {
        helperName: "formatTasksConfirm",
        description:
          "Constructs the tasks_confirm array for sideEffectParams. " +
          "Call after confirmation with arbitrary hashes and their on-chain task hashes.",
        example: `const tasks_confirm = formatTasksConfirm(arbitraryHashes, taskHashes);
const sideEffectParams = { tasks_pending: [], tasks_confirm };`,
      },
    },
  },
  // Side effects - caller constructs sideEffectParams using helper functions
  onSubmit: [
    {
      def: "Batch Update Task Status to Pending",
      method: "POST",
      endpoint: "/project/manager/task/batch-update-status",
      body: {
        treasury_nft_policy_id: { source: "context", path: "txParams.project_id" },
        tasks: { source: "context", path: "sideEffectParams.tasks_pending" },
      },
    },
  ],
  onConfirmation: [
    {
      def: "Batch Confirm Task Management",
      method: "POST",
      endpoint: "/project/manager/task/batch-confirm",
      body: {
        treasury_nft_policy_id: { source: "context", path: "txParams.project_id" },
        tx_hash: { source: "context", path: "txHash" },
        tasks: { source: "context", path: "sideEffectParams.tasks_confirm" },
      },
      critical: true,
    },
  ],
  ui: {
    buttonText: "Manage Tasks",
    title: "Manage Project Tasks",
    description: [
      "Add or remove tasks from a project. Each task specifies its reward, expiration time, and content hash.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/project/manager/tasks-manage",
    footerLinkText: "Tx Documentation",
    successInfo: "Project tasks managed successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/project/manager/tasks-manage",
    apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/docs#/default/post_v2_tx_project_manager_tasks_manage",
  },
};

// =============================================================================
// Helper Functions for sideEffectParams
// =============================================================================

/**
 * Type for tasks_pending array in sideEffectParams
 */
export type TaskPendingEntry = {
  arbitrary_hash: string;
  status: "PENDING_TX";
  pending_tx_hash: string;
};

/**
 * Type for tasks_confirm array in sideEffectParams
 */
export type TaskConfirmEntry = {
  arbitrary_hash: string;
  task_hash: string;
};

/**
 * Constructs the tasks_pending array for sideEffectParams.
 *
 * Call this after transaction submission to prepare the onSubmit side effect data.
 *
 * @param arbitraryHashes - Array of arbitrary hashes (DB identifiers) for tasks being managed
 * @param txHash - The transaction hash from wallet.submitTx()
 * @returns Array for sideEffectParams.tasks_pending
 *
 * @example
 * ```typescript
 * import { formatTasksPending } from "@andamio/transactions";
 *
 * // After building the transaction, prepare side effect params
 * const tasks_pending = formatTasksPending(
 *   ["abc123...", "def456..."],  // arbitrary hashes from DB
 *   txHash
 * );
 *
 * const sideEffectParams = { tasks_pending, tasks_confirm: [] };
 * ```
 */
export function formatTasksPending(
  arbitraryHashes: string[],
  txHash: string
): TaskPendingEntry[] {
  return arbitraryHashes.map((arbitrary_hash) => ({
    arbitrary_hash,
    status: "PENDING_TX" as const,
    pending_tx_hash: txHash,
  }));
}

/**
 * Constructs the tasks_confirm array for sideEffectParams.
 *
 * Call this after transaction confirmation to prepare the onConfirmation side effect data.
 * Task hashes are the on-chain identifiers received after confirmation.
 *
 * @param arbitraryHashes - Array of arbitrary hashes (DB identifiers) - same order as taskHashes
 * @param taskHashes - Array of on-chain task hashes - same order as arbitraryHashes
 * @returns Array for sideEffectParams.tasks_confirm
 *
 * @example
 * ```typescript
 * import { formatTasksConfirm } from "@andamio/transactions";
 *
 * // After confirmation, prepare side effect params
 * const tasks_confirm = formatTasksConfirm(
 *   ["abc123...", "def456..."],  // arbitrary hashes from DB
 *   ["onchain1...", "onchain2..."]  // task hashes from on-chain
 * );
 *
 * const sideEffectParams = { tasks_pending: [], tasks_confirm };
 * ```
 */
export function formatTasksConfirm(
  arbitraryHashes: string[],
  taskHashes: string[]
): TaskConfirmEntry[] {
  if (arbitraryHashes.length !== taskHashes.length) {
    throw new Error(
      `Arbitrary hashes and task hashes arrays must have the same length. ` +
        `Got ${arbitraryHashes.length} arbitrary hashes and ${taskHashes.length} task hashes.`
    );
  }
  return arbitraryHashes.map((arbitrary_hash, index) => ({
    arbitrary_hash,
    task_hash: taskHashes[index]!,
  }));
}
