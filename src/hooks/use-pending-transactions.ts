/**
 * usePendingTransactions Hook
 *
 * Simple hook to provide pending transaction count.
 * Designed to be lightweight and used in the status bar.
 *
 * NOTE: The backend endpoint GET /user/pending-transactions was removed.
 * This hook now returns empty state. Pending transaction tracking is handled
 * entirely client-side via usePendingTxWatcher and localStorage.
 *
 * @deprecated This hook no longer polls an API. Consider using usePendingTxWatcher directly.
 */

import { useState, useCallback } from "react";

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

export function usePendingTransactions(_options: UsePendingTransactionsOptions = {}) {
  // API endpoint was removed - return empty state
  // Pending transactions are now tracked client-side only via usePendingTxWatcher
  const [pendingTxs] = useState<PendingTransaction[]>([]);

  const refresh = useCallback(async () => {
    // No-op: API endpoint no longer exists
  }, []);

  return {
    pendingTxs,
    count: pendingTxs.length,
    hasPending: pendingTxs.length > 0,
    isLoading: false,
    error: null,
    refresh,
  };
}
