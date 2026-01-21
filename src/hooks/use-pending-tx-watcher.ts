/**
 * Pending Transaction Watcher Hook
 *
 * Monitors pending blockchain transactions and executes onConfirmation side effects
 * when transactions are confirmed on-chain.
 *
 * This is a client-side solution using localStorage for persistence.
 *
 * ## Features
 * - Automatic polling of blockchain for transaction confirmations
 * - Execution of onConfirmation side effects from transaction definitions
 * - Error handling and retry logic
 * - Configurable polling interval
 * - localStorage persistence across page reloads
 *
 * ## Transaction Flow
 * When a transaction is confirmed, this hook automatically:
 * 1. Processes entity-specific side effects (module status, etc.)
 * 2. Removes the transaction from the watch list
 * 3. Calls the onConfirmation callback
 *
 * @see useAndamioTransaction - Sets pending tx on submission
 */

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAndamioAuth } from "./use-andamio-auth";
import { pendingTxLogger } from "~/lib/debug-logger";
import {
  checkTransactionsBatch,
  extractOnChainData,
  type TransactionConfirmation,
} from "~/lib/cardano-indexer";
// TX State Machine response type
interface TxRegistrationResult {
  tx_hash: string;
  state: string;
}

/**
 * Pending transaction to monitor
 */
export interface PendingTransaction {
  /** Unique identifier for this pending transaction */
  id: string;
  /** Transaction hash on the blockchain */
  txHash: string;
  /** Type of entity (module, assignment, task, course, project, access-token, etc.) */
  entityType: "module" | "assignment" | "task" | "assignment-commitment" | "task-commitment" | "course" | "project" | "access-token";
  /** Entity identifier (e.g., moduleCode, courseNftPolicyId, treasuryNftPolicyId) */
  entityId: string;
  /** Additional context needed for updates */
  context: {
    courseNftPolicyId?: string;
    treasuryNftPolicyId?: string;
    moduleCode?: string;
    assignmentId?: string;
    taskId?: string;
    learnerId?: string;
    contributorId?: string;
    /** Title for display purposes (courses, projects) */
    title?: string;
  };
  /** Timestamp when transaction was submitted */
  submittedAt: Date;
  /** Optional polling interval override in milliseconds (default uses global config) */
  pollingInterval?: number;
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
   *
   * Uses TX State Machine: Register the confirmed TX with the Gateway,
   * which automatically handles DB updates when TX is verified on-chain.
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

      // TX State Machine: POST /api/v2/tx/register
      // Register TX with Gateway - it handles confirmation and DB updates automatically
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/tx/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_hash: tx.txHash,
            tx_type: "module_mint",
            instance_id: courseNftPolicyId,
            metadata: {
              course_id: courseNftPolicyId,
              course_module_code: moduleCode,
              module_hash: moduleHash ?? undefined,
            },
          }),
        }
      );

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(`Failed to register module TX: ${error.message ?? response.statusText}`);
      }

      const registrationResult = (await response.json()) as TxRegistrationResult;
      pendingTxLogger.info(`Module TX registered, state: ${registrationResult.state}`);

      return registrationResult;
    },
    [authenticatedFetch]
  );

  /**
   * Process a confirmed assignment commitment transaction
   *
   * Uses TX State Machine: Register the confirmed TX with the Gateway,
   * which automatically handles DB updates when TX is verified on-chain.
   */
  const processConfirmedAssignmentCommitment = useCallback(
    async (tx: PendingTransaction) => {
      const { courseNftPolicyId, moduleCode } = tx.context;
      if (!courseNftPolicyId || !moduleCode) {
        throw new Error("Missing courseNftPolicyId or moduleCode in context");
      }

      // TX State Machine: POST /api/v2/tx/register
      // Register TX with Gateway - it handles confirmation and DB updates automatically
      // See: TX_STATE_MACHINE_TRACKER.md section 3.4 (Assignment Commit)
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/tx/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tx_hash: tx.txHash,
            tx_type: "assignment_submit",
            instance_id: courseNftPolicyId,
            metadata: {
              course_id: courseNftPolicyId,
              course_module_code: moduleCode,
              access_token_alias: tx.entityId, // entityId is the student's alias
            },
          }),
        }
      );

      if (!response.ok) {
        const error = (await response.json()) as { message?: string };
        throw new Error(`Failed to register assignment commitment TX: ${error.message ?? response.statusText}`);
      }

      const registrationResult = (await response.json()) as TxRegistrationResult;
      pendingTxLogger.info(`Assignment commitment TX registered:`, registrationResult);

      return registrationResult;
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
            await processConfirmedAssignmentCommitment(tx);
            break;

          case "course":
            // Course entities are created via side effect when tx is submitted.
            // Confirmation just triggers UI update and redirect (handled by useProvisioningState).
            pendingTxLogger.info(`Course confirmed: ${tx.entityId} (${tx.context.title ?? "Untitled"})`);
            break;

          case "project":
            // Project entities are created via side effect when tx is submitted.
            // Confirmation just triggers UI update and redirect (handled by useProvisioningState).
            pendingTxLogger.info(`Project confirmed: ${tx.entityId} (${tx.context.title ?? "Untitled"})`);
            break;

          case "access-token":
            // Access token minting confirmed. The alias was already saved to DB on submission.
            // Confirmation just triggers UI update (dashboard will refresh).
            pendingTxLogger.info(`Access token confirmed: ${tx.entityId}`);
            break;

          // TODO: Add handlers for other entity types
          case "assignment":
          case "task":
          case "task-commitment":
            console.warn(`[PendingTx] Handler not implemented for ${tx.entityType}`);
        }

        // NOTE: POST /user/unconfirmed-tx endpoint was removed from API
        // Pending transaction state is now managed entirely client-side

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
   * Calculate the effective polling interval
   * Uses the minimum interval among all pending transactions, or global default
   */
  const effectivePollInterval = useMemo(() => {
    if (pendingTransactions.length === 0) {
      return pollInterval;
    }
    const intervals = pendingTransactions
      .map((tx) => tx.pollingInterval)
      .filter((interval): interval is number => interval !== undefined && interval > 0);

    if (intervals.length === 0) {
      return pollInterval;
    }
    return Math.min(pollInterval, ...intervals);
  }, [pendingTransactions, pollInterval]);

  /**
   * Start polling
   */
  useEffect(() => {
    // Need both: pending transactions to check AND jwt to authenticate API calls
    if (!enabled || pendingTransactions.length === 0 || !jwt) {
      return;
    }

    // Initial check
    void checkPendingTransactions();

    // Set up polling with effective interval
    pollTimeoutRef.current = setInterval(() => {
      void checkPendingTransactions();
    }, effectivePollInterval);

    return () => {
      if (pollTimeoutRef.current) {
        clearInterval(pollTimeoutRef.current);
        pollTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pendingTransactions.length, effectivePollInterval, jwt]); // Include jwt to re-trigger when auth is ready

  // NOTE: loadPendingTransactionsFromDatabase was removed - API endpoint no longer exists
  // Pending transactions are now tracked entirely client-side via localStorage

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
