/**
 * TransactionStatus Component
 *
 * Displays transaction progress and results.
 * Shows tx hash, blockchain explorer link, and error messages.
 *
 * Will be extracted to @andamio/transactions package.
 */

import React from "react";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import type { TransactionResult, TransactionState } from "~/types/transaction";

export interface TransactionStatusProps {
  /**
   * Current transaction state
   */
  state: TransactionState;

  /**
   * Transaction result (if completed)
   */
  result?: TransactionResult | null;

  /**
   * Error message (if failed)
   */
  error?: string | null;

  /**
   * Optional callback to retry transaction
   */
  onRetry?: () => void;

  /**
   * Optional custom messages for each state
   */
  messages?: Partial<Record<TransactionState, string>>;
}

const DEFAULT_MESSAGES: Record<TransactionState, string> = {
  idle: "",
  fetching: "Preparing your transaction...",
  signing: "Please sign the transaction in your wallet",
  submitting: "Submitting transaction to the blockchain...",
  confirming: "Waiting for blockchain confirmation...",
  success: "Transaction submitted successfully!",
  error: "Transaction failed",
};

/**
 * TransactionStatus - Display transaction progress and results
 *
 * @example
 * ```tsx
 * const { state, result, error } = useTransaction();
 *
 * <TransactionStatus
 *   state={state}
 *   result={result}
 *   error={error}
 *   onRetry={() => execute({ ... })}
 * />
 * ```
 */
export function TransactionStatus({
  state,
  result,
  error,
  onRetry,
  messages = {},
}: TransactionStatusProps) {
  // Don't render anything if idle
  if (state === "idle") {
    return null;
  }

  const text = { ...DEFAULT_MESSAGES, ...messages };

  // Success state
  if (state === "success" && result?.success) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/5 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div className="flex-1 space-y-2">
            <AndamioText variant="small" className="font-medium text-foreground">{text.success}</AndamioText>
            {result.txHash && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <code className="font-mono">{result.txHash.slice(0, 16)}...{result.txHash.slice(-8)}</code>
                {result.blockchainExplorerUrl && (
                  <a
                    href={result.blockchainExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1 space-y-2">
            <AndamioText variant="small" className="font-medium text-foreground">{error ?? text.error}</AndamioText>
            {onRetry && (
              <AndamioButton
                variant="link"
                size="sm"
                onClick={onRetry}
                className="h-auto p-0 text-xs"
              >
                Try again
              </AndamioButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading states (fetching, signing, submitting, confirming)
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <div>
          <AndamioText variant="small" className="font-medium text-foreground">{text[state]}</AndamioText>
          {state === "signing" && (
            <AndamioText variant="small" className="text-xs">Check your wallet</AndamioText>
          )}
        </div>
      </div>
    </div>
  );
}
