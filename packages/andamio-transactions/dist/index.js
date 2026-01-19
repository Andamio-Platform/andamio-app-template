"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTxId = exports.extractAssetNames = exports.extractMintsByPolicy = exports.extractMints = exports.decodeTransactionCbor = exports.getExecutableSideEffects = exports.shouldExecuteSideEffect = exports.checkSideEffectCondition = exports.executeOnSubmit = exports.executeSideEffect = exports.testSideEffect = exports.createMockConfirmationContext = exports.createMockSubmissionContext = exports.validateSideEffect = exports.getValueFromPath = exports.constructRequestBody = exports.resolvePathParams = exports.createSchemas = exports.mergeSchemas = exports.PROTOCOL_COSTS = exports.getProtocolCost = exports.createProtocolSpec = exports.hasTransaction = exports.getTransactionCountByVersion = exports.getAvailableVersions = exports.getTransactionsByVersionAndRole = exports.getTransactionsByVersion = exports.getTransactionsByRole = exports.getAllTransactionDefinitions = exports.getTransactionDefinition = exports.transactionRegistry = exports.v2 = exports.formatBatchConfirmBody = exports.formatBatchUpdateStatusBody = void 0;
// Export transaction definitions
__exportStar(require("./definitions"), exports);
// Export input helper functions (V2)
var modules_manage_1 = require("./definitions/v2/course/teacher/modules-manage");
Object.defineProperty(exports, "formatBatchUpdateStatusBody", { enumerable: true, get: function () { return modules_manage_1.formatBatchUpdateStatusBody; } });
Object.defineProperty(exports, "formatBatchConfirmBody", { enumerable: true, get: function () { return modules_manage_1.formatBatchConfirmBody; } });
// Export version namespaces for explicit version access
var definitions_1 = require("./definitions");
Object.defineProperty(exports, "v2", { enumerable: true, get: function () { return definitions_1.v2; } });
// Export registry functions
var registry_1 = require("./registry");
Object.defineProperty(exports, "transactionRegistry", { enumerable: true, get: function () { return registry_1.transactionRegistry; } });
Object.defineProperty(exports, "getTransactionDefinition", { enumerable: true, get: function () { return registry_1.getTransactionDefinition; } });
Object.defineProperty(exports, "getAllTransactionDefinitions", { enumerable: true, get: function () { return registry_1.getAllTransactionDefinitions; } });
Object.defineProperty(exports, "getTransactionsByRole", { enumerable: true, get: function () { return registry_1.getTransactionsByRole; } });
Object.defineProperty(exports, "getTransactionsByVersion", { enumerable: true, get: function () { return registry_1.getTransactionsByVersion; } });
Object.defineProperty(exports, "getTransactionsByVersionAndRole", { enumerable: true, get: function () { return registry_1.getTransactionsByVersionAndRole; } });
Object.defineProperty(exports, "getAvailableVersions", { enumerable: true, get: function () { return registry_1.getAvailableVersions; } });
Object.defineProperty(exports, "getTransactionCountByVersion", { enumerable: true, get: function () { return registry_1.getTransactionCountByVersion; } });
Object.defineProperty(exports, "hasTransaction", { enumerable: true, get: function () { return registry_1.hasTransaction; } });
// Export utilities
var protocol_reference_1 = require("./utils/protocol-reference");
Object.defineProperty(exports, "createProtocolSpec", { enumerable: true, get: function () { return protocol_reference_1.createProtocolSpec; } });
Object.defineProperty(exports, "getProtocolCost", { enumerable: true, get: function () { return protocol_reference_1.getProtocolCost; } });
Object.defineProperty(exports, "PROTOCOL_COSTS", { enumerable: true, get: function () { return protocol_reference_1.PROTOCOL_COSTS; } });
var schema_helpers_1 = require("./utils/schema-helpers");
Object.defineProperty(exports, "mergeSchemas", { enumerable: true, get: function () { return schema_helpers_1.mergeSchemas; } });
Object.defineProperty(exports, "createSchemas", { enumerable: true, get: function () { return schema_helpers_1.createSchemas; } });
// NOTE: Hash utilities have been migrated to the main app at ~/lib/utils/
// - computeSltHashDefinite -> ~/lib/utils/slt-hash.ts
// - computeAssignmentInfoHash -> ~/lib/utils/assignment-info-hash.ts
// - computeTaskHash -> ~/lib/utils/task-hash.ts
// Export testing utilities
var testing_1 = require("./testing");
Object.defineProperty(exports, "resolvePathParams", { enumerable: true, get: function () { return testing_1.resolvePathParams; } });
Object.defineProperty(exports, "constructRequestBody", { enumerable: true, get: function () { return testing_1.constructRequestBody; } });
Object.defineProperty(exports, "getValueFromPath", { enumerable: true, get: function () { return testing_1.getValueFromPath; } });
Object.defineProperty(exports, "validateSideEffect", { enumerable: true, get: function () { return testing_1.validateSideEffect; } });
Object.defineProperty(exports, "createMockSubmissionContext", { enumerable: true, get: function () { return testing_1.createMockSubmissionContext; } });
Object.defineProperty(exports, "createMockConfirmationContext", { enumerable: true, get: function () { return testing_1.createMockConfirmationContext; } });
Object.defineProperty(exports, "testSideEffect", { enumerable: true, get: function () { return testing_1.testSideEffect; } });
// Export execution utilities
var execution_1 = require("./execution");
Object.defineProperty(exports, "executeSideEffect", { enumerable: true, get: function () { return execution_1.executeSideEffect; } });
Object.defineProperty(exports, "executeOnSubmit", { enumerable: true, get: function () { return execution_1.executeOnSubmit; } });
Object.defineProperty(exports, "checkSideEffectCondition", { enumerable: true, get: function () { return execution_1.checkSideEffectCondition; } });
Object.defineProperty(exports, "shouldExecuteSideEffect", { enumerable: true, get: function () { return execution_1.shouldExecuteSideEffect; } });
Object.defineProperty(exports, "getExecutableSideEffects", { enumerable: true, get: function () { return execution_1.getExecutableSideEffects; } });
// Export CBOR decoder utilities
var cbor_decoder_1 = require("./utils/cbor-decoder");
Object.defineProperty(exports, "decodeTransactionCbor", { enumerable: true, get: function () { return cbor_decoder_1.decodeTransactionCbor; } });
Object.defineProperty(exports, "extractMints", { enumerable: true, get: function () { return cbor_decoder_1.extractMints; } });
Object.defineProperty(exports, "extractMintsByPolicy", { enumerable: true, get: function () { return cbor_decoder_1.extractMintsByPolicy; } });
Object.defineProperty(exports, "extractAssetNames", { enumerable: true, get: function () { return cbor_decoder_1.extractAssetNames; } });
Object.defineProperty(exports, "extractTxId", { enumerable: true, get: function () { return cbor_decoder_1.extractTxId; } });
