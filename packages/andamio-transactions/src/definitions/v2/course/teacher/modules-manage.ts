import { z } from "zod";
import type { AndamioTransactionDefinition } from "../../../../types";
import { createProtocolSpec, getProtocolCost } from "../../../../utils/protocol-reference";
import { createSchemas } from "../../../../utils/schema-helpers";

const protocolId = "course.teacher.modules.manage";
const txName = "COURSE_TEACHER_MODULES_MANAGE" as const;

/**
 * WalletData schema for optional initiator data
 */
const initiatorDataSchema = z
  .object({
    used_addresses: z.array(z.string()), // Array of bech32 addresses
    change_address: z.string(), // Bech32 change address
  })
  .optional();

/**
 * COURSE_TEACHER_MODULES_MANAGE Transaction Definition
 *
 * Teachers mint, update, or burn course modules. This transaction can handle
 * multiple modules in a single transaction.
 *
 * ## API Endpoint
 * POST /v2/tx/course/teacher/modules/manage
 *
 * ## Request Body (ManageModulesTxRequest)
 * ```json
 * {
 *   "alias": "teacher1",                // Teacher's access token alias
 *   "course_id": "abc123...",           // Course NFT policy ID (56 char hex)
 *   "modules_to_mint": [{               // Modules to create
 *     "slts": ["I can do X.", "I can do Y."],
 *     "allowed_course_state_ids": [],   // Minting policy IDs for course states
 *     "prereq_slt_hashes": []           // Prerequisite SLT hashes (64 char hex)
 *   }],
 *   "modules_to_update": [{             // Modules to update
 *     "slt_hash": "abc123...",          // 64 char hex
 *     "allowed_course_state_ids": [],
 *     "prereq_slt_hashes": []
 *   }],
 *   "modules_to_burn": ["abc123..."]    // SLT hashes to burn (64 char hex)
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
 * ## Module Hash Computation
 *
 * The module token name (hash) is computed from the SLTs using Blake2b-256:
 * ```typescript
 * import { computeSltHash } from "@andamio/transactions";
 *
 * const slts = ["I can do X.", "I can do Y."];
 * const moduleHash = computeSltHash(slts);
 * // This hash becomes the token name on-chain
 * ```
 *
 * ## Side Effects
 *
 * **onSubmit**: Batch update all affected modules to `PENDING_TX` status.
 * Use `formatModulesPending()` helper to construct `sideEffectParams.modules_pending`.
 *
 * **onConfirmation**: Batch confirm all modules and save their on-chain hashes.
 * Use `formatModulesConfirm()` helper to construct `sideEffectParams.modules_confirm`.
 */
export const COURSE_TEACHER_MODULES_MANAGE: AndamioTransactionDefinition = {
  txType: txName,
  role: "course-teacher",
  protocolSpec: {
    ...createProtocolSpec("v2", protocolId),
    requiredTokens: ["global-state.access-token-user"],
  },
  buildTxConfig: {
    ...createSchemas({
      // Transaction API inputs - matches ManageModulesTxRequest
      txParams: z.object({
        alias: z.string().min(1).max(31), // Teacher's alias (Alias type)
        course_id: z.string().length(56), // Course NFT policy ID (GYMintingPolicyId)
        modules_to_mint: z.array(
          z.object({
            slts: z.array(z.string()), // Array of SLT strings
            allowed_course_state_ids: z.array(z.string().length(56)), // LocalStateNFT minting policy IDs (GYMintingPolicyId)
            prereq_slt_hashes: z.array(z.string().length(64)), // Prerequisite SLT hashes (SltHash)
          })
        ),
        modules_to_update: z.array(
          z.object({
            slt_hash: z.string().length(64), // Module hash to update (SltHash)
            allowed_course_state_ids: z.array(z.string().length(56)), // LocalStateNFT minting policy IDs (GYMintingPolicyId)
            prereq_slt_hashes: z.array(z.string().length(64)), // Prerequisite SLT hashes (SltHash)
          })
        ),
        modules_to_burn: z.array(z.string().length(64)), // SLT hashes of modules to burn (SltHash)
        initiator_data: initiatorDataSchema, // Optional wallet data (WalletData)
      }),
      // Side effect parameters - caller constructs these using helper functions
      sideEffectParams: z.object({
        // For onSubmit: array of modules to mark as PENDING_TX
        modules_pending: z.array(
          z.object({
            module_code: z.string(),
            status: z.literal("PENDING_TX"),
            pending_tx_hash: z.string().length(64),
          })
        ),
        // For onConfirmation: array of modules with their on-chain hashes
        modules_confirm: z.array(
          z.object({
            module_code: z.string(),
            module_hash: z.string().length(64),
          })
        ),
      }),
    }),
    builder: { type: "api-endpoint", endpoint: "/v2/tx/course/teacher/modules/manage" },
    estimatedCost: getProtocolCost(protocolId),
    inputHelpers: {
      modules_pending: {
        helperName: "formatModulesPending",
        description:
          "Constructs the modules_pending array for sideEffectParams. " +
          "Call after transaction submission with module codes and txHash.",
        example: `const modules_pending = formatModulesPending(moduleCodes, txHash);
const sideEffectParams = { modules_pending, modules_confirm: [] };`,
      },
      modules_confirm: {
        helperName: "formatModulesConfirm",
        description:
          "Constructs the modules_confirm array for sideEffectParams. " +
          "Call after confirmation with module codes and their pre-computed hashes.",
        example: `const moduleHashes = modules.map(m => computeSltHash(m.slts));
const modules_confirm = formatModulesConfirm(moduleCodes, moduleHashes);
const sideEffectParams = { modules_pending: [], modules_confirm };`,
      },
    },
  },
  // Side effects - caller constructs sideEffectParams using helper functions
  onSubmit: [
    {
      def: "Batch Update Module Status to Pending",
      method: "POST",
      endpoint: "/course/teacher/course-modules/batch-update-status",
      body: {
        policy_id: { source: "context", path: "buildInputs.course_id" },
        course_modules: { source: "context", path: "buildInputs.modules_pending" },
      },
    },
  ],
  onConfirmation: [
    {
      def: "Batch Confirm Module Management",
      method: "POST",
      endpoint: "/course/teacher/course-modules/batch-confirm",
      body: {
        policy_id: { source: "context", path: "buildInputs.course_id" },
        tx_hash: { source: "context", path: "txHash" },
        course_modules: { source: "context", path: "buildInputs.modules_confirm" },
      },
      critical: true,
    },
  ],
  ui: {
    buttonText: "Manage Modules",
    title: "Manage Course Modules",
    description: [
      "Add, update, or manage course modules. This transaction allows teachers to mint module tokens and update module content on-chain.",
      "Module token names are computed as Blake2b-256 hashes of the SLT content.",
    ],
    footerLink: "https://docs.andamio.io/docs/protocol/v2/transactions/course/teacher/modules/manage",
    footerLinkText: "Tx Documentation",
    successInfo: "Course modules managed successfully!",
  },
  docs: {
    protocolDocs: "https://docs.andamio.io/docs/protocol/v2/transactions/course/teacher/modules/manage",
    apiDocs: "https://atlas-api-preprod-507341199760.us-central1.run.app/docs#/default/post_v2_tx_course_teacher_modules_manage",
  },
};

// =============================================================================
// Helper Functions for sideEffectParams
// =============================================================================

/**
 * Type for modules_pending array in sideEffectParams
 */
export type ModulePendingEntry = {
  module_code: string;
  status: "PENDING_TX";
  pending_tx_hash: string;
};

/**
 * Type for modules_confirm array in sideEffectParams
 */
export type ModuleConfirmEntry = {
  module_code: string;
  module_hash: string;
};

/**
 * Constructs the modules_pending array for sideEffectParams.
 *
 * Call this after transaction submission to prepare the onSubmit side effect data.
 *
 * @param moduleCodes - Array of module codes being managed
 * @param txHash - The transaction hash from wallet.submitTx()
 * @returns Array for sideEffectParams.modules_pending
 *
 * @example
 * ```typescript
 * import { formatModulesPending } from "@andamio/transactions";
 *
 * // After building the transaction, prepare side effect params
 * const modules_pending = formatModulesPending(
 *   ["MODULE_1", "MODULE_2"],
 *   txHash
 * );
 *
 * const sideEffectParams = { modules_pending, modules_confirm: [] };
 * ```
 */
export function formatModulesPending(
  moduleCodes: string[],
  txHash: string
): ModulePendingEntry[] {
  return moduleCodes.map((module_code) => ({
    module_code,
    status: "PENDING_TX" as const,
    pending_tx_hash: txHash,
  }));
}

/**
 * Constructs the modules_confirm array for sideEffectParams.
 *
 * Call this after transaction confirmation to prepare the onConfirmation side effect data.
 * Module hashes should be pre-computed using `computeSltHash()` at build time.
 *
 * @param moduleCodes - Array of module codes being managed
 * @param moduleHashes - Array of module hashes (Blake2b-256 of SLTs) - same order as moduleCodes
 * @returns Array for sideEffectParams.modules_confirm
 *
 * @example
 * ```typescript
 * import { formatModulesConfirm, computeSltHash } from "@andamio/transactions";
 *
 * // Pre-compute hashes at build time
 * const moduleHashes = modules.map(m => computeSltHash(m.slts));
 *
 * // After confirmation, prepare side effect params
 * const modules_confirm = formatModulesConfirm(
 *   modules.map(m => m.moduleCode),
 *   moduleHashes
 * );
 *
 * const sideEffectParams = { modules_pending: [], modules_confirm };
 * ```
 */
export function formatModulesConfirm(
  moduleCodes: string[],
  moduleHashes: string[]
): ModuleConfirmEntry[] {
  if (moduleCodes.length !== moduleHashes.length) {
    throw new Error(
      `Module codes and hashes arrays must have the same length. ` +
        `Got ${moduleCodes.length} codes and ${moduleHashes.length} hashes.`
    );
  }
  return moduleCodes.map((module_code, index) => ({
    module_code,
    module_hash: moduleHashes[index]!,
  }));
}

// =============================================================================
// Complete Request Body Types and Formatters
// =============================================================================

/**
 * Request body for POST /course-module/batch-update-status
 */
export type BatchUpdateStatusBody = {
  course_nft_policy_id: string;
  modules: ModulePendingEntry[];
};

/**
 * Request body for POST /course-module/batch-confirm
 */
export type BatchConfirmBody = {
  course_nft_policy_id: string;
  tx_hash: string;
  modules: ModuleConfirmEntry[];
};

/**
 * Formats the complete request body for the batch-update-status endpoint.
 *
 * Call this after transaction submission to prepare the onSubmit API request.
 *
 * @param courseNftPolicyId - The course NFT policy ID (56 char hex)
 * @param moduleCodes - Array of module codes being managed
 * @param txHash - The transaction hash from wallet.submitTx()
 * @returns Complete request body for `/course-module/batch-update-status`
 *
 * @example
 * ```typescript
 * import { formatBatchUpdateStatusBody } from "@andamio/transactions";
 *
 * const body = formatBatchUpdateStatusBody(
 *   courseNftPolicyId,
 *   ["MODULE_1", "MODULE_2"],
 *   txHash
 * );
 *
 * await fetch("/api/course-module/batch-update-status", {
 *   method: "POST",
 *   body: JSON.stringify(body)
 * });
 * ```
 */
export function formatBatchUpdateStatusBody(
  courseNftPolicyId: string,
  moduleCodes: string[],
  txHash: string
): BatchUpdateStatusBody {
  return {
    course_nft_policy_id: courseNftPolicyId,
    modules: formatModulesPending(moduleCodes, txHash),
  };
}

/**
 * Formats the complete request body for the batch-confirm endpoint.
 *
 * Call this after transaction confirmation to prepare the onConfirmation API request.
 *
 * @param courseNftPolicyId - The course NFT policy ID (56 char hex)
 * @param moduleCodes - Array of module codes being managed
 * @param txHash - The confirmed transaction hash
 * @param moduleHashes - Array of module hashes (Blake2b-256 of SLTs) - same order as moduleCodes
 * @returns Complete request body for `/course-module/batch-confirm`
 *
 * @example
 * ```typescript
 * import { formatBatchConfirmBody, extractAssetNames } from "@andamio/transactions";
 *
 * // Extract module hashes from the confirmed transaction
 * const moduleHashes = extractAssetNames(unsignedTxCBOR, modulePolicy);
 *
 * const body = formatBatchConfirmBody(
 *   courseNftPolicyId,
 *   moduleCodes,
 *   txHash,
 *   moduleHashes
 * );
 *
 * await fetch("/api/course-module/batch-confirm", {
 *   method: "POST",
 *   body: JSON.stringify(body)
 * });
 * ```
 */
export function formatBatchConfirmBody(
  courseNftPolicyId: string,
  moduleCodes: string[],
  txHash: string,
  moduleHashes: string[]
): BatchConfirmBody {
  return {
    course_nft_policy_id: courseNftPolicyId,
    tx_hash: txHash,
    modules: formatModulesConfirm(moduleCodes, moduleHashes),
  };
}
