import { z } from "zod";

/**
 * Parameters for createSchemas function
 */
export type CreateSchemasParams = {
  /** Schema for transaction API inputs only */
  txParams: z.ZodObject<any>;
  /** Optional schema for side effect parameters */
  sideEffectParams?: z.ZodObject<any>;
};

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
export function mergeSchemas(
  txApiSchema: z.ZodObject<any>,
  sideEffectSchema?: z.ZodObject<any>
): z.ZodObject<any> {
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
export function createSchemas(params: CreateSchemasParams) {
  return {
    txApiSchema: params.txParams,
    sideEffectSchema: params.sideEffectParams,
    inputSchema: mergeSchemas(params.txParams, params.sideEffectParams),
  };
}
