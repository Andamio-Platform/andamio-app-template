/**
 * useAndamioTransaction Hook
 *
 * Enhanced transaction hook that includes side effect execution.
 * Wraps useTransaction and adds automatic onSubmit side effect execution
 * after transaction submission.
 *
 * This hook bridges the gap between the generic useTransaction hook and
 * Andamio transaction definitions with side effects.
 *
 * ## Automatic Behaviors
 *
 * ### Unconfirmed Transaction Tracking
 * After every successful transaction submission, this hook automatically:
 * 1. Calls `PATCH /user/unconfirmed-tx` with the txHash
 * 2. This sets `user.unconfirmedTx` in the database
 * 3. Frontend should check this field to block new transactions while pending
 * 4. When tx is confirmed on-chain (via polling), call the endpoint with `null`
 *
 * This prevents UTxO conflicts from rapid transaction submissions.
 *
 * @see andamio-db-api/src/routers/user.ts - API endpoint documentation
 * @see pending-tx-watcher.tsx - Polling component that clears on confirmation
 */

import { useCallback } from "react";
import { useAndamioAuth } from "./use-andamio-auth";
import { useTransaction } from "./use-transaction";
import {
  executeOnSubmit,
  type AndamioTransactionDefinition,
  type SubmissionContext,
  type SideEffectRequestLog,
  type SideEffectResultLog,
} from "@andamio/transactions";
import { env } from "~/env";
import { toast } from "sonner";
import { txLogger } from "~/lib/tx-logger";

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
    apiResponse?: Record<string, unknown>;
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
          const parsed = txApiSchema.parse(allParams) as Record<string, unknown>;
          txApiParams = parsed;
        } else {
          // Fallback: if no schema, use all params
          txApiParams = allParams;
        }
      } catch {
        // If parsing fails, try to extract keys manually
        // This handles partial matches where not all txApiSchema fields are provided
        const schemaShape = (txApiSchema as unknown as { shape?: Record<string, unknown> })?.shape;
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

      await transaction.execute({
        endpoint: config.definition.buildTxConfig.builder.endpoint!,
        method: "POST", // V2 endpoints use POST with JSON body
        params: txApiParams as TParams, // Only send txParams to transaction API
        txType: config.definition.txType,
        // Pass partialSign from definition (e.g., INSTANCE_PROJECT_CREATE requires it)
        partialSign: config.definition.partialSign,
        onSuccess: async (txResult) => {
          // Update user's unconfirmedTx (blocks further transactions until confirmed)
          const unconfirmedTxUrl = `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user/unconfirmed-tx`;
          const unconfirmedTxBody = { tx_hash: txResult.txHash };
          txLogger.sideEffectRequest("onSubmit", "Set User Unconfirmed Tx", "PATCH", unconfirmedTxUrl, unconfirmedTxBody);
          try {
            const unconfirmedTxResponse = await fetch(unconfirmedTxUrl, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${jwt}`,
              },
              body: JSON.stringify(unconfirmedTxBody),
            });
            if (unconfirmedTxResponse.ok) {
              const responseData = (await unconfirmedTxResponse.json()) as Record<string, unknown>;
              txLogger.sideEffectResult("onSubmit", "Set User Unconfirmed Tx", true, responseData);
            } else {
              txLogger.sideEffectResult("onSubmit", "Set User Unconfirmed Tx", false, undefined, await unconfirmedTxResponse.text());
            }
          } catch (unconfirmedTxError) {
            // Non-critical - log but don't fail the transaction
            txLogger.sideEffectResult("onSubmit", "Set User Unconfirmed Tx", false, undefined, unconfirmedTxError);
          }

          // Execute onSubmit side effects
          let sideEffectsSuccess = true;

          if (config.definition.onSubmit && config.definition.onSubmit.length > 0) {
            try {

              // Create submission context
              // Note: For transactions with multiple modules (like MINT_MODULE_TOKENS),
              // we may need to extract moduleCode from module_infos for side effect path resolution
              // Use allParams which includes both txParams AND sideEffectParams
              const buildInputs = { ...allParams };

              // Extract values from API response and add to buildInputs
              // This allows side effects to reference API response fields
              const apiResponse = txResult.apiResponse;
              if (apiResponse) {
                // Map common API response fields to buildInputs
                // course_id -> course_nft_policy_id (used by INSTANCE_COURSE_CREATE)
                // API returns snake_case, side effects expect snake_case
                if (apiResponse.course_id && typeof apiResponse.course_id === 'string') {
                  buildInputs.course_nft_policy_id = apiResponse.course_id;
                }
                // Add other API response mappings as needed
                if (apiResponse.module_code && typeof apiResponse.module_code === 'string') {
                  buildInputs.module_code = apiResponse.module_code;
                }
              }

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

              // Track counts for summary
              let succeeded = 0, failed = 0, skipped = 0;

              // Execute side effects with logging callbacks
              const sideEffectResult = await executeOnSubmit(
                config.definition.onSubmit,
                submissionContext,
                {
                  apiBaseUrl: env.NEXT_PUBLIC_ANDAMIO_API_URL,
                  authToken: jwt ?? "",
                  onRequest: (log: SideEffectRequestLog) => {
                    txLogger.sideEffectRequest(log.phase, log.description, log.method, log.endpoint, log.body);
                  },
                  onResult: (log: SideEffectResultLog) => {
                    if (log.skipped) {
                      skipped++;
                      txLogger.sideEffectSkipped(log.phase, log.description, log.skipReason ?? "Skipped");
                    } else if (log.success) {
                      succeeded++;
                      txLogger.sideEffectResult(log.phase, log.description, true, log.response);
                    } else {
                      failed++;
                      txLogger.sideEffectResult(log.phase, log.description, false, undefined, log.error);
                    }
                  },
                }
              );

              sideEffectsSuccess = sideEffectResult.success;

              // Log summary
              txLogger.sideEffectsSummary("onSubmit", sideEffectResult.results.length, succeeded, failed, skipped);

              // Notify about side effect results
              config.onSideEffectsComplete?.(sideEffectResult);

              // Show warning if critical side effects failed
              if (!sideEffectResult.success && sideEffectResult.criticalErrors.length > 0) {
                toast.warning("Transaction Submitted", {
                  description: "Transaction was submitted, but some updates are pending. Please refresh the page.",
                });
              }
            } catch (error) {
              // Side effect execution failed completely
              txLogger.txError(config.definition.txType, error);
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
            apiResponse: txResult.apiResponse,
          });
        },
        onError: (error) => {
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
