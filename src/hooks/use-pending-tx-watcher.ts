/**
 * Pending Transaction Watcher Hook
 *
 * Monitors pending blockchain transactions and executes onConfirmation side effects
 * when transactions are confirmed on-chain.
 *
 * This is a temporary client-side solution. In production, this functionality
 * should be moved to a backend monitoring service for better reliability.
 *
 * Features:
 * - Automatic polling of blockchain for transaction confirmations
 * - Execution of onConfirmation side effects from transaction definitions
 * - Status updates via API after confirmation
 * - Error handling and retry logic
 * - Configurable polling interval
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useAndamioAuth } from "./use-andamio-auth";
import { env } from "~/env";
import {
  checkTransactionsBatch,
  extractOnChainData,
  type TransactionConfirmation,
} from "~/lib/cardano-indexer";
import type { CourseModuleOutput } from "@andamio-platform/db-api";

/**
 * Pending transaction to monitor
 */
export interface PendingTransaction {
  /** Unique identifier for this pending transaction */
  id: string;
  /** Transaction hash on the blockchain */
  txHash: string;
  /** Type of entity (module, assignment, task, etc.) */
  entityType: "module" | "assignment" | "task" | "assignment-commitment" | "task-commitment";
  /** Entity identifier (e.g., moduleCode) */
  entityId: string;
  /** Additional context needed for updates */
  context: {
    courseNftPolicyId?: string;
    moduleCode?: string;
    assignmentId?: string;
    taskId?: string;
    learnerId?: string;
    contributorId?: string;
  };
  /** Timestamp when transaction was submitted */
  submittedAt: Date;
}

export interface PendingTxWatcherConfig {
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollInterval?: number;
  /** Enable/disable the watcher */
  enabled?: boolean;
  /** Max retries for failed API calls */
  maxRetries?: number;
  /** Callback when transaction is confirmed */
  onConfirmation?: (tx: PendingTransaction, confirmation: TransactionConfirmation) => void;
  /** Callback when confirmation processing fails */
  onError?: (tx: PendingTransaction, error: Error) => void;
}

/**
 * Hook for monitoring pending transactions
 *
 * Usage:
 * ```tsx
 * const { pendingTransactions, addPendingTx, removePendingTx } = usePendingTxWatcher({
 *   pollInterval: 30000, // 30 seconds
 *   onConfirmation: (tx) => {
 *     console.log("Transaction confirmed:", tx.txHash);
 *     router.refresh(); // Refresh page data
 *   },
 * });
 *
 * // After submitting a transaction
 * addPendingTx({
 *   id: `module-${moduleCode}`,
 *   txHash: "abc123...",
 *   entityType: "module",
 *   entityId: moduleCode,
 *   context: { courseNftPolicyId, moduleCode },
 *   submittedAt: new Date(),
 * });
 * ```
 */
export function usePendingTxWatcher(config: PendingTxWatcherConfig = {}) {
  const {
    pollInterval = 30000, // 30 seconds default
    enabled = true,
    maxRetries = 3,
    onConfirmation,
    onError,
  } = config;

  const { authenticatedFetch, jwt } = useAndamioAuth();
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef<Map<string, number>>(new Map());

  /**
   * Add a transaction to the watch list
   */
  const addPendingTx = useCallback((tx: PendingTransaction) => {
    setPendingTransactions((prev) => {
      // Avoid duplicates
      if (prev.some((t) => t.id === tx.id)) {
        return prev;
      }
      return [...prev, tx];
    });
    retryCountRef.current.set(tx.id, 0);
    console.log(`[PendingTx] Added to watch list: ${tx.txHash} (${tx.entityType})`);
  }, []);

  /**
   * Remove a transaction from the watch list
   */
  const removePendingTx = useCallback((id: string) => {
    setPendingTransactions((prev) => prev.filter((tx) => tx.id !== id));
    retryCountRef.current.delete(id);
    console.log(`[PendingTx] Removed from watch list: ${id}`);
  }, []);

  /**
   * Process a confirmed module transaction
   */
  const processConfirmedModule = useCallback(
    async (tx: PendingTransaction, onChainData: Record<string, unknown>) => {
      const { courseNftPolicyId, moduleCode } = tx.context;
      if (!courseNftPolicyId || !moduleCode) {
        throw new Error("Missing courseNftPolicyId or moduleCode in context");
      }

      // Extract moduleHash from on-chain data
      // For module minting, the moduleHash is typically the first minted asset's name
      const mints = onChainData.mints as Array<{ assetName: string }> | undefined;
      const moduleHash = mints?.[0]?.assetName;

      if (!moduleHash) {
        console.warn(`[PendingTx] No moduleHash found in on-chain data for ${tx.txHash}`);
      }

      // Confirm blockchain transaction and update module status to ON_CHAIN
      // This uses a special endpoint that bypasses PENDING_TX protection with blockchain proof
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/${courseNftPolicyId}/${moduleCode}/confirm-transaction`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseNftPolicyId,
            moduleCode,
            txHash: tx.txHash,
            moduleHash: moduleHash ?? undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(`Failed to update module status: ${error.message ?? response.statusText}`);
      }

      const updatedModule = (await response.json()) as CourseModuleOutput;
      console.log(`[PendingTx] Module status updated to ON_CHAIN:`, updatedModule);

      return updatedModule;
    },
    [authenticatedFetch]
  );

  /**
   * Process a confirmed assignment commitment transaction
   */
  const processConfirmedAssignmentCommitment = useCallback(
    async (tx: PendingTransaction, onChainData: Record<string, unknown>) => {
      const { learnerId, assignmentId } = tx.context;
      if (!learnerId || !assignmentId) {
        throw new Error("Missing learnerId or assignmentId in context");
      }

      // Extract networkEvidenceHash from on-chain data if available
      const networkEvidenceHash = onChainData.dataHash as string | undefined;

      // Confirm blockchain transaction and update assignment commitment status
      // This uses a special endpoint that bypasses PENDING_TX protection with blockchain proof
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/${tx.entityId}/confirm-transaction`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: tx.entityId,
            txHash: tx.txHash,
            networkEvidenceHash: networkEvidenceHash ?? undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(`Failed to update assignment commitment status: ${error.message ?? response.statusText}`);
      }

      const updatedCommitment = (await response.json()) as {
        id: string;
        assignmentId: string;
        learnerId: string;
        networkStatus: string;
      };
      console.log(`[PendingTx] Assignment commitment status updated:`, updatedCommitment);

      return updatedCommitment;
    },
    [authenticatedFetch]
  );

  /**
   * Process a confirmed transaction
   */
  const processConfirmedTransaction = useCallback(
    async (tx: PendingTransaction, confirmation: TransactionConfirmation) => {
      console.log(`[PendingTx] Processing confirmed transaction: ${tx.txHash}`);

      try {
        // Extract on-chain data
        const onChainData = await extractOnChainData(tx.txHash);
        console.log(`[PendingTx] Extracted on-chain data:`, onChainData);

        // Process based on entity type
        switch (tx.entityType) {
          case "module":
            await processConfirmedModule(tx, onChainData);
            break;

          case "assignment-commitment":
            await processConfirmedAssignmentCommitment(tx, onChainData);
            break;

          // TODO: Add handlers for other entity types
          case "assignment":
          case "task":
          case "task-commitment":
            console.warn(`[PendingTx] Handler not implemented for ${tx.entityType}`);
        }

        // Remove from watch list
        removePendingTx(tx.id);

        // Call success callback
        onConfirmation?.(tx, confirmation);

        console.log(`[PendingTx] Successfully processed ${tx.txHash}`);
      } catch (error) {
        console.error(`[PendingTx] Failed to process ${tx.txHash}:`, error);

        // Check retry count
        const retries = retryCountRef.current.get(tx.id) ?? 0;
        if (retries < maxRetries) {
          retryCountRef.current.set(tx.id, retries + 1);
          console.log(`[PendingTx] Will retry ${tx.id} (attempt ${retries + 1}/${maxRetries})`);
        } else {
          console.error(`[PendingTx] Max retries reached for ${tx.id}, removing from watch list`);
          removePendingTx(tx.id);
          onError?.(tx, error instanceof Error ? error : new Error(String(error)));
        }
      }
    },
    [processConfirmedModule, processConfirmedAssignmentCommitment, removePendingTx, maxRetries, onConfirmation, onError]
  );

  /**
   * Check all pending transactions
   */
  const checkPendingTransactions = useCallback(async () => {
    if (pendingTransactions.length === 0 || !jwt) {
      return;
    }

    setIsChecking(true);

    try {
      console.log(`[PendingTx] Checking ${pendingTransactions.length} pending transactions...`);

      // Use batch endpoint to check all transactions in a single API call
      const txHashes = pendingTransactions.map((tx) => tx.txHash);
      const confirmations = await checkTransactionsBatch(txHashes);

      // Process each confirmation result
      for (let i = 0; i < pendingTransactions.length; i++) {
        const tx = pendingTransactions[i];
        const confirmation = confirmations[i];

        if (!tx || !confirmation) continue;

        try {
          if (confirmation.confirmed) {
            console.log(`[PendingTx] Transaction confirmed: ${tx.txHash} (${confirmation.confirmations} confirmations)`);
            await processConfirmedTransaction(tx, confirmation);
          } else {
            console.log(`[PendingTx] Transaction not yet confirmed: ${tx.txHash}`);
          }
        } catch (error) {
          console.error(`[PendingTx] Error processing ${tx.txHash}:`, error);
          // Continue checking other transactions
        }
      }
    } catch (error) {
      console.error("[PendingTx] Failed to check transactions batch:", error);
    } finally {
      setIsChecking(false);
    }
  }, [pendingTransactions, jwt, processConfirmedTransaction]);

  /**
   * Start polling
   */
  useEffect(() => {
    if (!enabled || pendingTransactions.length === 0) {
      return;
    }

    // Initial check
    void checkPendingTransactions();

    // Set up polling
    pollTimeoutRef.current = setInterval(() => {
      void checkPendingTransactions();
    }, pollInterval);

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pendingTransactions.length, pollInterval]); // Don't include checkPendingTransactions to avoid infinite loop

  /**
   * Load pending transactions from database
   */
  const loadPendingTransactionsFromDatabase = useCallback(async () => {
    if (!jwt) {
      return;
    }

    try {
      console.log("[PendingTx] Loading pending transactions from database...");

      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/pending-transactions`
      );

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(`Failed to load pending transactions: ${error.message ?? response.statusText}`);
      }

      const dbTransactions = (await response.json()) as PendingTransaction[];

      // Convert date strings back to Date objects
      const transactions = dbTransactions.map((tx) => ({
        ...tx,
        submittedAt: new Date(tx.submittedAt),
      }));

      console.log(`[PendingTx] Loaded ${transactions.length} pending transactions from database`);

      // Merge with existing transactions (database is source of truth)
      setPendingTransactions((prev) => {
        // Create a map of database transactions by id
        const dbTxMap = new Map(transactions.map((tx) => [tx.id, tx]));

        // Keep any local transactions not in database
        const localOnly = prev.filter((tx) => !dbTxMap.has(tx.id));

        // Combine database transactions with local-only transactions
        const merged = [...transactions, ...localOnly];

        console.log(`[PendingTx] Merged state: ${transactions.length} from DB, ${localOnly.length} local-only`);

        return merged;
      });
    } catch (error) {
      console.error("[PendingTx] Failed to load pending transactions from database:", error);
    }
  }, [jwt, authenticatedFetch]);

  /**
   * Load pending transactions from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("andamio-pending-transactions");
      if (stored) {
        const parsed = JSON.parse(stored) as PendingTransaction[];
        // Convert date strings back to Date objects
        const transactions = parsed.map((tx) => ({
          ...tx,
          submittedAt: new Date(tx.submittedAt),
        }));
        setPendingTransactions(transactions);
        console.log(`[PendingTx] Loaded ${transactions.length} pending transactions from storage`);
      }
    } catch (error) {
      console.error("[PendingTx] Failed to load pending transactions from storage:", error);
    }
  }, []);

  /**
   * Load pending transactions from database when authenticated
   */
  useEffect(() => {
    if (jwt) {
      void loadPendingTransactionsFromDatabase();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jwt]); // Only run when jwt changes, not when function reference changes

  /**
   * Save pending transactions to localStorage
   */
  useEffect(() => {
    try {
      localStorage.setItem("andamio-pending-transactions", JSON.stringify(pendingTransactions));
    } catch (error) {
      console.error("[PendingTx] Failed to save pending transactions to storage:", error);
    }
  }, [pendingTransactions]);

  return {
    pendingTransactions,
    addPendingTx,
    removePendingTx,
    isChecking,
    checkNow: checkPendingTransactions,
  };
}
