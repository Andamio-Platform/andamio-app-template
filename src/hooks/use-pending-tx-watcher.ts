/**
 * Pending Transaction Watcher Hook
 *
 * Monitors pending blockchain transactions and executes onConfirmation side effects
 * when transactions are confirmed on-chain.
 *
 * This is a temporary client-side solution. In production, this functionality
 * should be moved to a backend monitoring service for better reliability.
 *
 * ## Features
 * - Automatic polling of blockchain for transaction confirmations
 * - Execution of onConfirmation side effects from transaction definitions
 * - Status updates via API after confirmation
 * - Error handling and retry logic
 * - Configurable polling interval
 *
 * ## Unconfirmed Transaction Clearing
 * When a transaction is confirmed, this hook automatically:
 * 1. Processes entity-specific side effects (module status, etc.)
 * 2. Calls `PATCH /user/unconfirmed-tx` with `null` to clear the user's pending tx
 * 3. Removes the transaction from the watch list
 *
 * This works in tandem with `useAndamioTransaction` which sets the unconfirmedTx
 * when a transaction is submitted.
 *
 * @see useAndamioTransaction - Sets unconfirmedTx on submission
 * @see andamio-db-api/src/routers/user.ts - API endpoint documentation
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useAndamioAuth } from "./use-andamio-auth";
import { env } from "~/env";
import { txLogger } from "~/lib/tx-logger";
import { pendingTxLogger } from "~/lib/debug-logger";
import {
  checkTransactionsBatch,
  extractOnChainData,
  type TransactionConfirmation,
} from "~/lib/cardano-indexer";
import type { CourseModuleOutput } from "@andamio/db-api";

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
    pendingTxLogger.info(`Added to watch list: ${tx.txHash} (${tx.entityType})`);
  }, []);

  /**
   * Remove a transaction from the watch list
   */
  const removePendingTx = useCallback((id: string) => {
    setPendingTransactions((prev) => prev.filter((tx) => tx.id !== id));
    retryCountRef.current.delete(id);
    pendingTxLogger.info(`Removed from watch list: ${id}`);
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
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/confirm-transaction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            tx_hash: tx.txHash,
            module_hash: moduleHash ?? undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(`Failed to update module status: ${error.message ?? response.statusText}`);
      }

      const updatedModule = (await response.json()) as CourseModuleOutput;
      pendingTxLogger.info(`Module status updated to ON_CHAIN:`, updatedModule);

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
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/confirm-transaction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: tx.entityId,
            tx_hash: tx.txHash,
            network_evidence_hash: networkEvidenceHash ?? undefined,
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
      pendingTxLogger.info(`Assignment commitment status updated:`, updatedCommitment);

      return updatedCommitment;
    },
    [authenticatedFetch]
  );

  /**
   * Process a confirmed transaction
   */
  const processConfirmedTransaction = useCallback(
    async (tx: PendingTransaction, confirmation: TransactionConfirmation) => {
      pendingTxLogger.info(`Processing confirmed transaction: ${tx.txHash}`);

      try {
        // Extract on-chain data
        const onChainData = await extractOnChainData(tx.txHash);
        pendingTxLogger.debug(`Extracted on-chain data:`, onChainData);

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

        // Clear user's unconfirmedTx now that it's confirmed
        const clearUrl = `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/user/update-unconfirmed-tx`;
        const clearBody = { tx_hash: null };
        txLogger.sideEffectRequest("onConfirmation", "Clear User Unconfirmed Tx", "POST", clearUrl, clearBody);
        try {
          const clearResponse = await authenticatedFetch(clearUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(clearBody),
          });
          if (clearResponse.ok) {
            const responseData = (await clearResponse.json()) as Record<string, unknown>;
            txLogger.sideEffectResult("onConfirmation", "Clear User Unconfirmed Tx", true, responseData);
          } else {
            txLogger.sideEffectResult("onConfirmation", "Clear User Unconfirmed Tx", false, undefined, await clearResponse.text());
          }
        } catch (clearError) {
          txLogger.sideEffectResult("onConfirmation", "Clear User Unconfirmed Tx", false, undefined, clearError);
          // Non-critical - continue with confirmation processing
        }

        // Remove from watch list
        removePendingTx(tx.id);

        // Call success callback
        onConfirmation?.(tx, confirmation);

        pendingTxLogger.info(`Successfully processed ${tx.txHash}`);
      } catch (error) {
        pendingTxLogger.error(`Failed to process ${tx.txHash}:`, error);

        // Check retry count
        const retries = retryCountRef.current.get(tx.id) ?? 0;
        if (retries < maxRetries) {
          retryCountRef.current.set(tx.id, retries + 1);
          pendingTxLogger.info(`Will retry ${tx.id} (attempt ${retries + 1}/${maxRetries})`);
        } else {
          pendingTxLogger.error(`Max retries reached for ${tx.id}, removing from watch list`);
          removePendingTx(tx.id);
          onError?.(tx, error instanceof Error ? error : new Error(String(error)));
        }
      }
    },
    [processConfirmedModule, processConfirmedAssignmentCommitment, removePendingTx, maxRetries, onConfirmation, onError, authenticatedFetch]
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
      pendingTxLogger.debug(`Checking ${pendingTransactions.length} pending transactions...`);

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
            pendingTxLogger.info(`Transaction confirmed: ${tx.txHash} (${confirmation.confirmations} confirmations)`);
            await processConfirmedTransaction(tx, confirmation);
          } else {
            pendingTxLogger.debug(`Transaction not yet confirmed: ${tx.txHash}`);
          }
        } catch (error) {
          pendingTxLogger.error(`Error processing ${tx.txHash}:`, error);
          // Continue checking other transactions
        }
      }
    } catch (error) {
      pendingTxLogger.error("Failed to check transactions batch:", error);
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
      pendingTxLogger.debug("Loading pending transactions from database...");

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

      pendingTxLogger.info(`Loaded ${transactions.length} pending transactions from database`);

      // Merge with existing transactions (database is source of truth)
      setPendingTransactions((prev) => {
        // Create a map of database transactions by id
        const dbTxMap = new Map(transactions.map((tx) => [tx.id, tx]));

        // Keep any local transactions not in database
        const localOnly = prev.filter((tx) => !dbTxMap.has(tx.id));

        // Combine database transactions with local-only transactions
        const merged = [...transactions, ...localOnly];

        pendingTxLogger.debug(`Merged state: ${transactions.length} from DB, ${localOnly.length} local-only`);

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
        pendingTxLogger.info(`Loaded ${transactions.length} pending transactions from storage`);
      }
    } catch (error) {
      pendingTxLogger.error("Failed to load pending transactions from storage:", error);
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
