/**
 * Event-Based Transaction Confirmation Hook
 *
 * Uses Andamioscan Events API to check for transaction confirmation.
 * This is more reliable than Koios polling for Andamio-specific transactions.
 *
 * Currently only implements task submit confirmation.
 * Additional event types will be added after team alignment on the pattern.
 *
 * @see .claude/skills/project-manager/ANDAMIOSCAN-EVENTS-CONFIRMATION.md
 */

import { useState, useCallback } from "react";
import {
  getTaskSubmitEvent,
  waitForEventConfirmation,
  type AndamioscanTaskSubmitEvent,
} from "~/lib/andamioscan";

export type EventConfirmationStatus = "idle" | "checking" | "confirmed" | "not_found" | "error";

export interface UseEventConfirmationResult<T> {
  /** Current status */
  status: EventConfirmationStatus;
  /** Event data if confirmed */
  event: T | null;
  /** Error message if failed */
  error: string | null;
  /** Check for confirmation once */
  checkOnce: () => Promise<T | null>;
  /** Poll until confirmed or timeout */
  waitForConfirmation: (options?: {
    maxAttempts?: number;
    intervalMs?: number;
  }) => Promise<T | null>;
  /** Reset state */
  reset: () => void;
}

/**
 * Hook for checking task submit event confirmation
 *
 * @example
 * ```tsx
 * const { status, event, checkOnce } = useTaskSubmitConfirmation(txHash);
 *
 * // Check once
 * const result = await checkOnce();
 * if (result) {
 *   console.log("Confirmed at slot:", result.slot);
 * }
 * ```
 */
export function useTaskSubmitConfirmation(
  txHash: string | null
): UseEventConfirmationResult<AndamioscanTaskSubmitEvent> {
  const [status, setStatus] = useState<EventConfirmationStatus>("idle");
  const [event, setEvent] = useState<AndamioscanTaskSubmitEvent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkOnce = useCallback(async () => {
    if (!txHash) {
      setError("No transaction hash provided");
      return null;
    }

    setStatus("checking");
    setError(null);

    try {
      const result = await getTaskSubmitEvent(txHash);
      if (result) {
        setStatus("confirmed");
        setEvent(result);
        return result;
      } else {
        setStatus("not_found");
        return null;
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Unknown error");
      return null;
    }
  }, [txHash]);

  const waitForConfirmation = useCallback(
    async (options?: { maxAttempts?: number; intervalMs?: number }) => {
      if (!txHash) {
        setError("No transaction hash provided");
        return null;
      }

      setStatus("checking");
      setError(null);

      try {
        const result = await waitForEventConfirmation(
          "PROJECT_CONTRIBUTOR_TASK_ACTION",
          txHash,
          options
        );
        if (result) {
          setStatus("confirmed");
          setEvent(result as AndamioscanTaskSubmitEvent);
          return result as AndamioscanTaskSubmitEvent;
        } else {
          setStatus("not_found");
          return null;
        }
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Unknown error");
        return null;
      }
    },
    [txHash]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setEvent(null);
    setError(null);
  }, []);

  return { status, event, error, checkOnce, waitForConfirmation, reset };
}
