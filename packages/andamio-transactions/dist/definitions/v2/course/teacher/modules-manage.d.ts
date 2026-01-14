import type { AndamioTransactionDefinition } from "../../../../types";
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
export declare const COURSE_TEACHER_MODULES_MANAGE: AndamioTransactionDefinition;
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
export declare function formatModulesPending(moduleCodes: string[], txHash: string): ModulePendingEntry[];
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
export declare function formatModulesConfirm(moduleCodes: string[], moduleHashes: string[]): ModuleConfirmEntry[];
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
export declare function formatBatchUpdateStatusBody(courseNftPolicyId: string, moduleCodes: string[], txHash: string): BatchUpdateStatusBody;
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
export declare function formatBatchConfirmBody(courseNftPolicyId: string, moduleCodes: string[], txHash: string, moduleHashes: string[]): BatchConfirmBody;
