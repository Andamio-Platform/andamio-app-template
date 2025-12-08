/**
 * useTransaction Hook
 *
 * Core hook for handling Cardano transaction lifecycle:
 * 1. Fetch unsigned CBOR from Andamioscan endpoint
 * 2. Sign transaction with user's wallet
 * 3. Submit signed transaction to blockchain
 * 4. Handle confirmation and callbacks
 *
 * Will be extracted to @andamio/transactions package.
 *
 * TODO: Currently disabled while migrating from NBA to Andamioscan API.
 * Transaction building will be re-enabled once Andamioscan endpoints are ready.
 */

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { env } from "~/env";
import { txLogger } from "~/lib/tx-logger";
import type {
  TransactionConfig,
  TransactionState,
  TransactionResult,
  UnsignedTxResponse,
} from "~/types/transaction";

// Feature flag for Andamioscan API readiness
const ANDAMIOSCAN_TX_ENABLED = false;

export function useTransaction<TParams = unknown>() {
  const { wallet, connected } = useWallet();
  const [state, setState] = useState<TransactionState>("idle");
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (config: TransactionConfig<TParams>) => {
      // TODO: Remove this check when Andamioscan transaction building is ready
      if (!ANDAMIOSCAN_TX_ENABLED) {
        const err = "Transaction building is temporarily unavailable. Andamioscan integration coming soon.";
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

        // Step 1: Fetch unsigned CBOR from Andamioscan
        setState("fetching");
        config.onStateChange?.("fetching");

        const txType = config.txType ?? config.endpoint;
        const method = config.method ?? "POST";

        // Build URL and fetch options based on method
        let url = `/api/andamioscan${config.endpoint}`;
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

        const andamioscanResponse = await fetch(url, fetchOptions);

        if (!andamioscanResponse.ok) {
          const errorText = await andamioscanResponse.text();
          txLogger.buildResult(txType, false, { status: andamioscanResponse.status, error: errorText });
          throw new Error(`Andamioscan API error: ${andamioscanResponse.status} ${andamioscanResponse.statusText}`);
        }

        const unsignedTx = (await andamioscanResponse.json()) as UnsignedTxResponse;

        if (!unsignedTx.unsignedTxCBOR) {
          txLogger.buildResult(txType, false, { error: "No CBOR in response", response: unsignedTx });
          throw new Error("No CBOR returned from Andamioscan");
        }

        txLogger.buildResult(txType, true, unsignedTx);

        // Step 2: Sign transaction with wallet
        setState("signing");
        config.onStateChange?.("signing");

        const signedTx = await wallet.signTx(unsignedTx.unsignedTxCBOR);

        // Step 3: Submit to blockchain
        setState("submitting");
        config.onStateChange?.("submitting");

        const txHash = await wallet.submitTx(signedTx);

        // Step 4: Success!
        setState("success");
        config.onStateChange?.("success");

        const explorerUrl = getExplorerUrl(txHash);
        txLogger.txSubmitted(txType, txHash, explorerUrl);

        const txResult: TransactionResult = {
          txHash,
          success: true,
          blockchainExplorerUrl: explorerUrl,
        };

        setResult(txResult);

        // Call success callback
        await config.onSuccess?.(txResult);
      } catch (err) {
        txLogger.txError(config.txType ?? config.endpoint, err);

        const errorMessage = err instanceof Error ? err.message : "Transaction failed";

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
  // TODO: Determine network from env (mainnet vs preprod vs preview)
  const network = env.NEXT_PUBLIC_CARDANO_NETWORK ?? "preprod";

  if (network === "mainnet") {
    return `https://cardanoscan.io/transaction/${txHash}`;
  }

  return `https://preprod.cardanoscan.io/transaction/${txHash}`;
}
