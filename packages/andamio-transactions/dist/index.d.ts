/**
 * @andamio/transactions
 *
 * Unified transaction definition system for Andamio platform.
 *
 * This package provides a comprehensive specification for all Andamio transactions,
 * unifying three layers:
 * 1. Protocol Layer - On-chain transaction structure (from YAML specs)
 * 2. API Layer - Off-chain integration, side effects, database updates
 * 3. UI Layer - User-facing metadata and strings
 *
 * @example
 * ```ts
 * import { transactionRegistry, getTransactionDefinition } from "@andamio/transactions";
 *
 * // Get a specific transaction definition
 * const mintModuleDef = getTransactionDefinition("MINT_MODULE_TOKENS");
 *
 * // Access different aspects
 * console.log(mintModuleDef.protocolSpec); // Protocol YAML reference
 * console.log(mintModuleDef.buildTxConfig);  // How to build the transaction
 * console.log(mintModuleDef.onConfirmation); // Side effects on confirmation
 * console.log(mintModuleDef.ui); // UI metadata
 * ```
 */
export type { TxName, TransactionRole, ProtocolVersion, ProtocolSpec, TransactionCost, InputHelper, BuildTxConfig, RetryPolicy, HttpMethod, PathParams, BodyField, SideEffectCondition, SideEffect, OnSubmit, OnConfirmation, UIMetadata, Documentation, AndamioTransactionDefinition, TransactionRegistry, SubmissionContext, ConfirmationContext, OnChainData, } from "./types";
export * from "./definitions";
export { formatBatchUpdateStatusBody, formatBatchConfirmBody, type BatchUpdateStatusBody, type BatchConfirmBody, } from "./definitions/v2/course/teacher/modules-manage";
export { v2 } from "./definitions";
export { transactionRegistry, getTransactionDefinition, getAllTransactionDefinitions, getTransactionsByRole, getTransactionsByVersion, getTransactionsByVersionAndRole, getAvailableVersions, getTransactionCountByVersion, hasTransaction, } from "./registry";
export { createProtocolSpec, getProtocolCost, PROTOCOL_COSTS } from "./utils/protocol-reference";
export { mergeSchemas, createSchemas } from "./utils/schema-helpers";
export { resolvePathParams, constructRequestBody, getValueFromPath, validateSideEffect, createMockSubmissionContext, createMockConfirmationContext, testSideEffect, } from "./testing";
export { executeSideEffect, executeOnSubmit, checkSideEffectCondition, shouldExecuteSideEffect, getExecutableSideEffects, } from "./execution";
export type { SideEffectExecutionResult, ExecuteOnSubmitResult, ExecuteSideEffectOptions, SideEffectRequestLog, SideEffectResultLog, } from "./execution";
export { decodeTransactionCbor, extractMints, extractMintsByPolicy, extractAssetNames, extractTxId, } from "./utils/cbor-decoder";
export type { DecodedTransaction, DecodedMint, DecodedOutput, DecodedInput, } from "./utils/cbor-decoder";
