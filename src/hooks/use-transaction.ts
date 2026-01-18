/**
 * useTransaction Hook
 *
 * Core hook for handling Cardano transaction lifecycle:
 * 1. Fetch unsigned CBOR from transaction API endpoint
 * 2. Sign transaction with user's wallet
 * 3. Submit signed transaction to blockchain
 * 4. Handle confirmation and callbacks
 *
 * Supports the unified gateway API backend:
 * - gateway: Unified Andamio API Gateway (consolidates all services)
 *
 * Will be extracted to @andamio/transactions package.
 */

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { env } from "~/env";
import { txLogger } from "~/lib/tx-logger";
import { getTransactionExplorerUrl, type CardanoNetwork } from "~/lib/constants";
import type {
  TransactionConfig,
  TransactionState,
  TransactionResult,
  UnsignedTxResponse,
} from "~/types/transaction";

// Feature flag for transaction API readiness
const TX_API_ENABLED = true;

export function useTransaction<TParams = unknown>() {
  const { wallet, connected } = useWallet();
  const [state, setState] = useState<TransactionState>("idle");
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (config: TransactionConfig<TParams>) => {
      if (!TX_API_ENABLED) {
        const err = "Transaction building is temporarily unavailable.";
        setError(err);
        setState("error");
        config.onError?.(new Error(err));
        return;
      }

      if (!connected || !wallet) {
        const err = "Wallet not connected";
        setError(err);
        setState("error");
        config.onError?.(new Error(err));
        return;
      }

      try {
        // Reset state
        setError(null);
        setResult(null);

        // Step 1: Fetch unsigned CBOR from transaction API
        setState("fetching");
        config.onStateChange?.("fetching");

        const txType = config.txType ?? config.endpoint;
        const method = config.method ?? "POST";
        const apiBackend = config.apiBackend ?? "gateway";

        // Build URL based on API backend
        let url = `/api/${apiBackend}${config.endpoint}`;
        const fetchOptions: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (method === "GET") {
          const queryParams = new URLSearchParams(
            config.params as Record<string, string>
          );
          url = `${url}?${queryParams.toString()}`;
        } else {
          fetchOptions.body = JSON.stringify(config.params);
        }

        // Log the build request
        txLogger.buildRequest(txType, url, method, config.params);

        const apiResponse = await fetch(url, fetchOptions);

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          let errorDetails: string;
          try {
            // Try to parse as JSON to get more details
            const errorJson = JSON.parse(errorText) as { error?: string; details?: string; message?: string };
            errorDetails = errorJson.details ?? errorJson.message ?? errorJson.error ?? errorText;
          } catch {
            errorDetails = errorText;
          }
          txLogger.buildResult(txType, false, { status: apiResponse.status, error: errorDetails });
          throw new Error(`Transaction API error: ${apiResponse.status} - ${errorDetails}`);
        }

        const unsignedTx = (await apiResponse.json()) as UnsignedTxResponse;

        // V2 API uses unsigned_tx, legacy uses unsignedTxCBOR
        const unsignedCbor = unsignedTx.unsigned_tx ?? unsignedTx.unsignedTxCBOR;
        if (!unsignedCbor) {
          console.error("[Transaction API] Missing CBOR in response. Response keys:", Object.keys(unsignedTx));
          txLogger.buildResult(txType, false, { error: "No CBOR in response", response: unsignedTx });
          throw new Error(`No CBOR returned from transaction API. Response: ${JSON.stringify(unsignedTx)}`);
        }

        txLogger.buildResult(txType, true, unsignedTx);

        // Step 2: Sign transaction with wallet
        setState("signing");
        config.onStateChange?.("signing");

        const signedTx = await wallet.signTx(unsignedCbor, config.partialSign);

        // Step 3: Submit to blockchain
        setState("submitting");
        config.onStateChange?.("submitting");

        const txHash = await wallet.submitTx(signedTx);
        console.log("[Transaction] ✓ Submitted successfully. TxHash:", txHash);

        // Step 4: Success!
        setState("success");
        config.onStateChange?.("success");

        const explorerUrl = getExplorerUrl(txHash);
        txLogger.txSubmitted(txType, txHash, explorerUrl);

        const txResult: TransactionResult = {
          txHash,
          success: true,
          blockchainExplorerUrl: explorerUrl,
          apiResponse: unsignedTx as unknown as Record<string, unknown>,
        };

        setResult(txResult);

        // Call success callback
        await config.onSuccess?.(txResult);
      } catch (err) {
        console.error("[Transaction] ✗ Transaction failed:", err);
        txLogger.txError(config.txType ?? config.endpoint, err);

        const errorMessage = err instanceof Error ? err.message : "Transaction failed";
        console.error("[Transaction] Error message:", errorMessage);

        setError(errorMessage);
        setState("error");
        config.onStateChange?.("error");

        const txResult: TransactionResult = {
          success: false,
          error: errorMessage,
        };

        setResult(txResult);
        config.onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    },
    [connected, wallet]
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
  }, []);

  return {
    state,
    result,
    error,
    execute,
    reset,
    isIdle: state === "idle",
    isFetching: state === "fetching",
    isSigning: state === "signing",
    isSubmitting: state === "submitting",
    isConfirming: state === "confirming",
    isSuccess: state === "success",
    isError: state === "error",
    isLoading: state === "fetching" || state === "signing" || state === "submitting" || state === "confirming",
  };
}

/**
 * Get Cardano explorer URL for a transaction hash
 */
function getExplorerUrl(txHash: string): string {
  const network = (env.NEXT_PUBLIC_CARDANO_NETWORK ?? "preprod") satisfies CardanoNetwork;
  return getTransactionExplorerUrl(txHash, network);
}
