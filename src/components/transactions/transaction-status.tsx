/**
 * TransactionStatus Component
 *
 * Displays transaction progress and results.
 * Shows tx hash, blockchain explorer link, and error messages.
 *
 * Will be extracted to @andamio/transactions package.
 */

import React from "react";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { CheckCircle2, XCircle, ExternalLink, Loader2 } from "lucide-react";
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
      <AndamioAlert className="border-success bg-success/10">
        <CheckCircle2 className="h-4 w-4 text-success" />
        <AndamioAlertTitle className="text-success">Transaction Submitted!</AndamioAlertTitle>
        <AndamioAlertDescription className="space-y-3">
          <p className="text-success">{text.success}</p>
          {result.txHash && (
            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Transaction Hash</p>
                <code className="block rounded-md border bg-muted px-3 py-2 text-xs font-mono break-all text-foreground">
                  {result.txHash}
                </code>
              </div>
              {result.blockchainExplorerUrl && (
                <AndamioButton
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full"
                  rightIcon={<ExternalLink className="h-3 w-3" />}
                >
                  <a
                    href={result.blockchainExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on Cardano Explorer
                  </a>
                </AndamioButton>
              )}
            </div>
          )}
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // Error state
  if (state === "error") {
    return (
      <AndamioAlert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AndamioAlertTitle>Transaction Failed</AndamioAlertTitle>
        <AndamioAlertDescription className="space-y-2">
          <p>{error ?? text.error}</p>
          {onRetry && (
            <AndamioButton
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="mt-2"
            >
              Try Again
            </AndamioButton>
          )}
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // Loading states (fetching, signing, submitting, confirming)
  return (
    <AndamioAlert className="border-info bg-info/10">
      <Loader2 className="h-4 w-4 animate-spin text-info" />
      <AndamioAlertTitle className="text-info">
        {state === "fetching" && "Preparing Transaction"}
        {state === "signing" && "Waiting for Signature"}
        {state === "submitting" && "Submitting Transaction"}
        {state === "confirming" && "Confirming Transaction"}
      </AndamioAlertTitle>
      <AndamioAlertDescription>
        <p>{text[state]}</p>
        {state === "signing" && (
          <p className="mt-2 text-sm text-muted-foreground">
            Check your wallet for a signature request
          </p>
        )}
      </AndamioAlertDescription>
    </AndamioAlert>
  );
}
