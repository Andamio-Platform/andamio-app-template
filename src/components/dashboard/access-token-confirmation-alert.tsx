"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { LoadingIcon, SuccessIcon, WarningIcon, ExternalLinkIcon } from "~/components/icons";
import { usePendingTxContext } from "~/components/pending-tx-watcher";
import { getTransactionExplorerUrl } from "~/lib/constants";
import { UI_TIMEOUTS } from "~/lib/constants";

type ConfirmationState = "pending" | "long-wait" | "success" | "hidden";

interface AccessTokenConfirmationAlertProps {
  /** Callback when confirmation flow completes (after success delay) */
  onComplete?: () => void;
}

/**
 * AccessTokenConfirmationAlert
 *
 * Shows blockchain confirmation status for access token minting.
 * Displays warning after 2 minutes if still pending, transitions to success
 * state for 3 seconds when confirmed.
 */
export function AccessTokenConfirmationAlert({ onComplete }: AccessTokenConfirmationAlertProps) {
  const { pendingTransactions } = usePendingTxContext();

  // Find pending access token transaction
  const pendingAccessTokenTx = pendingTransactions.find(
    (tx) => tx.entityType === "access-token"
  );

  const [confirmationState, setConfirmationState] = useState<ConfirmationState>(
    pendingAccessTokenTx ? "pending" : "hidden"
  );
  const [wasConfirmed, setWasConfirmed] = useState(false);

  // Track when transaction was submitted for long-wait detection
  const submittedAt = pendingAccessTokenTx?.submittedAt;

  // Handle state transitions based on pending transaction
  useEffect(() => {
    if (!pendingAccessTokenTx && !wasConfirmed) {
      // No pending transaction and wasn't just confirmed - hide
      setConfirmationState("hidden");
      return;
    }

    if (pendingAccessTokenTx) {
      // Transaction is pending - show pending or long-wait state
      setConfirmationState((prev) =>
        prev === "success" ? prev : prev === "long-wait" ? "long-wait" : "pending"
      );
      setWasConfirmed(false);
    } else if (confirmationState === "pending" || confirmationState === "long-wait") {
      // Transaction was pending but now removed = confirmed
      setConfirmationState("success");
      setWasConfirmed(true);
    }
  }, [pendingAccessTokenTx, confirmationState, wasConfirmed]);

  // Handle success state timeout
  useEffect(() => {
    if (confirmationState !== "success") return;

    const timeout = setTimeout(() => {
      setConfirmationState("hidden");
      setWasConfirmed(false);
      onComplete?.();
    }, UI_TIMEOUTS.SUCCESS_TRANSITION);

    return () => clearTimeout(timeout);
  }, [confirmationState, onComplete]);

  // Check for long wait (>2 minutes)
  useEffect(() => {
    if (confirmationState !== "pending" || !submittedAt) return;

    const checkLongWait = () => {
      const elapsed = Date.now() - new Date(submittedAt).getTime();
      if (elapsed >= UI_TIMEOUTS.LONG_WAIT_WARNING) {
        setConfirmationState("long-wait");
      }
    };

    // Check immediately
    checkLongWait();

    // Check every 10 seconds
    const interval = setInterval(checkLongWait, 10000);

    return () => clearInterval(interval);
  }, [confirmationState, submittedAt]);

  // Don't render if hidden
  if (confirmationState === "hidden") {
    return null;
  }

  const txHash = pendingAccessTokenTx?.txHash;
  const explorerUrl = txHash ? getTransactionExplorerUrl(txHash) : null;

  // Render based on state
  if (confirmationState === "success") {
    return (
      <Alert className="border-success/20 bg-success/10 text-success">
        <SuccessIcon className="h-4 w-4" />
        <AlertTitle>Token Confirmed!</AlertTitle>
        <AlertDescription className="text-success/90">
          Your access token has been confirmed on the Cardano blockchain.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-info/20 bg-info/10 text-info">
      <LoadingIcon className="h-4 w-4 animate-spin" />
      <AlertTitle>Waiting for Blockchain Confirmation</AlertTitle>
      <AlertDescription className="space-y-2 text-info/90">
        <p>
          Your access token minting transaction has been submitted and is awaiting confirmation on the Cardano blockchain.
        </p>

        {confirmationState === "long-wait" && (
          <div className="flex items-center gap-2 text-warning">
            <WarningIcon className="h-4 w-4 shrink-0" />
            <span>
              Taking longer than expected. The blockchain may be congested. Your transaction is still being processed.
            </span>
          </div>
        )}

        {explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-info hover:underline"
          >
            View transaction on Cardanoscan
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        )}
      </AlertDescription>
    </Alert>
  );
}
