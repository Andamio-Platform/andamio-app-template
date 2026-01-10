/**
 * usePendingTransactions Hook
 *
 * Simple hook to poll for pending transactions and provide a count.
 * Designed to be lightweight and used in the status bar.
 */

import { useState, useEffect, useCallback } from "react";
import { useAndamioAuth } from "~/contexts/andamio-auth-context";
import { env } from "~/env";

export interface PendingTransaction {
  id: string;
  tx_hash: string;
  entity_type: string;
  entity_id: string;
  submitted_at: string;
}

interface UsePendingTransactionsOptions {
  /** Polling interval in milliseconds. Default: 30000 (30 seconds) */
  pollInterval?: number;
  /** Whether to enable polling. Default: true */
  enabled?: boolean;
}

export function usePendingTransactions(options: UsePendingTransactionsOptions = {}) {
  const { pollInterval = 30000, enabled = true } = options;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [pendingTxs, setPendingTxs] = useState<PendingTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingTransactions = useCallback(async () => {
    if (!isAuthenticated) {
      setPendingTxs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Go API: GET /user/pending-transactions
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user/pending-transactions`
      );

      // Handle 404/empty as "no pending transactions" - not an error
      if (response.status === 404 || response.status === 204) {
        setPendingTxs([]);
        return;
      }

      if (!response.ok) {
        // Only log error for unexpected failures, not for empty states
        console.warn("Pending transactions endpoint returned:", response.status);
        setPendingTxs([]);
        return;
      }

      const data = (await response.json()) as PendingTransaction[];
      setPendingTxs(data ?? []);
    } catch (err) {
      // Silently handle fetch errors - pending tx display is non-critical
      // Only log in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.debug("Pending transactions fetch:", err instanceof Error ? err.message : "Unknown error");
      }
      setPendingTxs([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authenticatedFetch]);

  // Initial fetch and polling
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      setPendingTxs([]);
      return;
    }

    // Initial fetch
    void fetchPendingTransactions();

    // Set up polling
    const interval = setInterval(() => {
      void fetchPendingTransactions();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [enabled, isAuthenticated, pollInterval, fetchPendingTransactions]);

  return {
    pendingTxs,
    count: pendingTxs.length,
    hasPending: pendingTxs.length > 0,
    isLoading,
    error,
    refresh: fetchPendingTransactions,
  };
}
