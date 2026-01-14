"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeSchemas = mergeSchemas;
exports.createSchemas = createSchemas;
/**
 * Merges transaction API schema with side effect schema
 *
 * @param txApiSchema - Schema for transaction API inputs
 * @param sideEffectSchema - Optional schema for side effect parameters
 * @returns Combined schema for validation
 *
 * @example
 * ```typescript
 * const txApiSchema = z.object({
 *   user_access_token: z.string(),
 *   policy: z.string(),
 * });
 *
 * const sideEffectSchema = z.object({
 *   moduleCode: z.string(),
 * });
 *
 * const inputSchema = mergeSchemas(txApiSchema, sideEffectSchema);
 * // Result: z.object({ user_access_token, policy, moduleCode })
 * ```
 */
function mergeSchemas(txApiSchema, sideEffectSchema) {
    if (!sideEffectSchema) {
        return txApiSchema;
    }
    return txApiSchema.merge(sideEffectSchema);
}
/**
 * Creates a BuildTxConfig with proper schema separation
 * Helper to ensure consistent schema structure across transaction definitions
 *
 * @param params - Object with labeled schema parameters
 * @param params.txParams - Schema for transaction API inputs only
 * @param params.sideEffectParams - Optional schema for side effect parameters
 * @returns Object with txApiSchema, sideEffectSchema, and merged inputSchema
 *
 * @example
 * ```typescript
 * const schemas = createSchemas({
 *   txParams: z.object({
 *     user_access_token: z.string(),
 *     policy: z.string(),
 *   }),
 *   sideEffectParams: z.object({
 *     moduleCode: z.string(),
 *   })
 * });
 *
 * // Use in transaction definition:
 * buildTxConfig: {
 *   ...schemas,
 *   builder: { ... },
 *   estimatedCost: { ... },
 * }
 * ```
 */
function createSchemas(params) {
    return {
        txApiSchema: params.txParams,
        sideEffectSchema: params.sideEffectParams,
        inputSchema: mergeSchemas(params.txParams, params.sideEffectParams),
    };
}
