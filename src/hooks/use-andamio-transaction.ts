/**
 * useAndamioTransaction Hook
 *
 * Enhanced transaction hook that includes side effect execution.
 * Wraps useTransaction and adds automatic onSubmit side effect execution
 * after transaction submission.
 *
 * This hook bridges the gap between the generic useTransaction hook and
 * Andamio transaction definitions with side effects.
 */

import { useCallback } from "react";
import { useAndamioAuth } from "./use-andamio-auth";
import { useTransaction } from "./use-transaction";
import {
  executeOnSubmit,
  type AndamioTransactionDefinition,
  type SubmissionContext,
} from "@andamio/transactions";
import { env } from "~/env";
import { toast } from "sonner";

export interface AndamioTransactionConfig<TParams = unknown> {
  /** Transaction definition from @andamio/transactions */
  definition: AndamioTransactionDefinition;
  /** Input parameters for building the transaction */
  params: TParams;
  /** Callback fired when transaction is successful (after side effects) */
  onSuccess?: (result: {
    txHash: string;
    blockchainExplorerUrl?: string;
    sideEffectsSuccess: boolean;
  }) => void | Promise<void>;
  /** Callback fired when transaction fails */
  onError?: (error: Error) => void;
  /** Optional callback fired when side effects complete */
  onSideEffectsComplete?: (result: {
    success: boolean;
    criticalErrors: string[];
  }) => void;
}

/**
 * Hook for executing Andamio transactions with automatic side effect handling
 *
 * @example
 * ```tsx
 * const { state, execute } = useAndamioTransaction();
 *
 * const handleMint = async () => {
 *   await execute({
 *     definition: MINT_MODULE_TOKENS,
 *     params: { policy: "...", module_infos: "..." },
 *     onSuccess: () => router.refresh(),
 *   });
 * };
 * ```
 */
export function useAndamioTransaction<TParams = unknown>() {
  const { user, jwt } = useAndamioAuth();
  const transaction = useTransaction<TParams>();

  const execute = useCallback(
    async (config: AndamioTransactionConfig<TParams>) => {
      // Filter params to only include txParams (not sideEffectParams)
      // The transaction API should only receive parameters defined in txApiSchema
      const txApiSchema = config.definition.buildTxConfig.txApiSchema;
      const allParams = config.params as Record<string, unknown>;

      // Extract only the keys that are in txApiSchema
      let txApiParams: Record<string, unknown> = {};

      try {
        // Try to parse the params with txApiSchema to get only valid keys
        if (txApiSchema) {
          const parsed = txApiSchema.parse(allParams);
          txApiParams = parsed as Record<string, unknown>;
        } else {
          // Fallback: if no schema, use all params
          txApiParams = allParams;
        }
      } catch (error) {
        // If parsing fails, try to extract keys manually
        // This handles partial matches where not all txApiSchema fields are provided
        const schemaShape = (txApiSchema as any)?.shape;
        if (schemaShape) {
          const txApiKeys = Object.keys(schemaShape);
          for (const key of txApiKeys) {
            if (key in allParams) {
              txApiParams[key] = allParams[key];
            }
          }
        } else {
          // Last fallback: use all params
          txApiParams = allParams;
        }
      }

      console.log('[useAndamioTransaction] Filtered params for tx API:', txApiParams);
      console.log('[useAndamioTransaction] Full params (including sideEffectParams):', allParams);

      await transaction.execute({
        endpoint: config.definition.buildTxConfig.builder.endpoint!,
        method: "GET", // NBA endpoints use GET with query params
        params: txApiParams as TParams, // Only send txParams to transaction API
        onSuccess: async (txResult) => {
          console.log(`[${config.definition.txType}] Transaction submitted:`, txResult.txHash);

          // Execute onSubmit side effects
          let sideEffectsSuccess = true;

          if (config.definition.onSubmit && config.definition.onSubmit.length > 0) {
            try {
              console.log(`[${config.definition.txType}] Executing onSubmit side effects...`);

              // Create submission context
              // Note: For transactions with multiple modules (like MINT_MODULE_TOKENS),
              // we may need to extract moduleCode from module_infos for side effect path resolution
              // Use allParams which includes both txParams AND sideEffectParams
              const buildInputs = allParams;

              // Try to extract moduleCode from module_infos if present
              if (buildInputs.module_infos && typeof buildInputs.module_infos === 'string') {
                try {
                  const moduleInfos = JSON.parse(buildInputs.module_infos) as Array<{ moduleId?: string }>;
                  if (Array.isArray(moduleInfos) && moduleInfos.length > 0) {
                    // For now, use the first module's code
                    // TODO: Handle multiple modules in side effects
                    buildInputs.moduleCode = moduleInfos[0]?.moduleId;
                  }
                } catch (parseError) {
                  console.warn('Failed to parse module_infos for moduleCode extraction', parseError);
                }
              }

              const submissionContext: SubmissionContext = {
                txHash: txResult.txHash!,
                signedCbor: "", // We don't have access to this in the current flow
                unsignedCbor: "", // We don't have access to this in the current flow
                userId: user?.id ?? "",
                walletAddress: user?.cardanoBech32Addr ?? "",
                buildInputs,
                timestamp: new Date(),
              };

              // Execute side effects
              const sideEffectResult = await executeOnSubmit(
                config.definition.onSubmit,
                submissionContext,
                {
                  apiBaseUrl: env.NEXT_PUBLIC_ANDAMIO_API_URL,
                  authToken: jwt ?? "",
                }
              );

              sideEffectsSuccess = sideEffectResult.success;

              // Log results
              console.log(`[${config.definition.txType}] Side effects executed:`, {
                success: sideEffectResult.success,
                results: sideEffectResult.results.length,
                criticalErrors: sideEffectResult.criticalErrors.length,
              });

              // Notify about side effect results
              config.onSideEffectsComplete?.(sideEffectResult);

              // Show warning if critical side effects failed
              if (!sideEffectResult.success && sideEffectResult.criticalErrors.length > 0) {
                toast.warning("Transaction Submitted", {
                  description: "Transaction was submitted, but some updates are pending. Please refresh the page.",
                });
                console.warn(
                  `[${config.definition.txType}] Critical side effects failed:`,
                  sideEffectResult.criticalErrors
                );
              }

              // Log individual side effect results
              for (const result of sideEffectResult.results) {
                if (result.skipped) {
                  console.log(`[SideEffect] Skipped: ${result.sideEffect.def}`);
                } else if (!result.success) {
                  console.error(
                    `[SideEffect] Failed: ${result.sideEffect.def}`,
                    result.error
                  );
                } else {
                  console.log(
                    `[SideEffect] Success: ${result.sideEffect.def}`,
                    result.response
                  );
                }
              }
            } catch (error) {
              // Side effect execution failed completely
              console.error(`[${config.definition.txType}] Side effect execution failed:`, error);
              sideEffectsSuccess = false;

              toast.warning("Transaction Submitted", {
                description: "Transaction was submitted, but database updates failed. Please refresh the page.",
              });
            }
          }

          // Call success callback
          await config.onSuccess?.({
            txHash: txResult.txHash!,
            blockchainExplorerUrl: txResult.blockchainExplorerUrl,
            sideEffectsSuccess,
          });
        },
        onError: (error) => {
          console.error(`[${config.definition.txType}] Transaction failed:`, error);
          config.onError?.(error);
        },
      });
    },
    [transaction, user, jwt]
  );

  return {
    ...transaction,
    execute,
  };
}
