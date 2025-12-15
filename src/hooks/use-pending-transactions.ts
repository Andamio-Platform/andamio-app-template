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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/transaction/pending-transactions`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch pending transactions");
      }

      const data = (await response.json()) as PendingTransaction[];
      setPendingTxs(data);
    } catch (err) {
      console.error("Error fetching pending transactions:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
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
