/**
 * useTransaction Hook
 *
 * Core hook for handling Cardano transaction lifecycle:
 * 1. Fetch unsigned CBOR from NBA endpoint
 * 2. Sign transaction with user's wallet
 * 3. Submit signed transaction to blockchain
 * 4. Handle confirmation and callbacks
 *
 * Will be extracted to @andamio/transactions package.
 */

import { useState, useCallback } from "react";
import { useWallet } from "@meshsdk/react";
import { env } from "~/env";
import type {
  TransactionConfig,
  TransactionState,
  TransactionResult,
  UnsignedTxResponse,
} from "~/types/transaction";

export function useTransaction<TParams = unknown>() {
  const { wallet, connected } = useWallet();
  const [state, setState] = useState<TransactionState>("idle");
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (config: TransactionConfig<TParams>) => {
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

        // Step 1: Fetch unsigned CBOR from NBA
        setState("fetching");
        config.onStateChange?.("fetching");

        console.log(`[Transaction] Fetching unsigned CBOR from ${config.endpoint}`);

        // Determine HTTP method (default to POST for backwards compatibility)
        const method = config.method ?? "POST";

        // Build URL and fetch options based on method
        let url = `/api/nba${config.endpoint}`;
        const fetchOptions: RequestInit = {
          method,
          headers: {
            "Content-Type": "application/json",
          },
        };

        if (method === "GET") {
          // For GET requests, convert params to query string
          const queryParams = new URLSearchParams(
            config.params as Record<string, string>
          );
          url = `${url}?${queryParams.toString()}`;
          console.log(`[Transaction] GET request to: ${url}`);
        } else {
          // For POST requests, send params as JSON body
          fetchOptions.body = JSON.stringify(config.params);
          console.log(`[Transaction] POST request with body:`, config.params);
        }

        const nbaResponse = await fetch(url, fetchOptions);

        if (!nbaResponse.ok) {
          const errorText = await nbaResponse.text();
          console.error(`[Transaction] NBA error response:`, errorText);
          throw new Error(`NBA API error: ${nbaResponse.status} ${nbaResponse.statusText}`);
        }

        const unsignedTx = (await nbaResponse.json()) as UnsignedTxResponse;
        console.log("[Transaction] NBA response:", unsignedTx);

        if (!unsignedTx.unsignedTxCBOR) {
          console.error("[Transaction] No CBOR in response. Full response:", JSON.stringify(unsignedTx, null, 2));
          throw new Error("No CBOR returned from NBA");
        }

        console.log("[Transaction] Unsigned CBOR received:", unsignedTx.unsignedTxCBOR.substring(0, 100) + "...");

        // Step 2: Sign transaction with wallet
        setState("signing");
        config.onStateChange?.("signing");

        console.log("[Transaction] Requesting wallet signature...");

        const signedTx = await wallet.signTx(unsignedTx.unsignedTxCBOR);

        console.log("[Transaction] Transaction signed");

        // Step 3: Submit to blockchain
        setState("submitting");
        config.onStateChange?.("submitting");

        console.log("[Transaction] Submitting to blockchain...");

        const txHash = await wallet.submitTx(signedTx);

        console.log(`[Transaction] Submitted! Tx Hash: ${txHash}`);

        // Step 4: Success!
        setState("success");
        config.onStateChange?.("success");

        const txResult: TransactionResult = {
          txHash,
          success: true,
          blockchainExplorerUrl: getExplorerUrl(txHash),
        };

        setResult(txResult);

        // Call success callback
        await config.onSuccess?.(txResult);

        console.log("[Transaction] Transaction completed successfully");
      } catch (err) {
        console.error("[Transaction] Error:", err);

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
