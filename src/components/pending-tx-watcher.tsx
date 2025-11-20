/**
 * PendingTxWatcher Component
 *
 * Global component that monitors pending blockchain transactions and automatically
 * updates entity status when transactions are confirmed.
 *
 * Add this component to your root layout to enable automatic transaction monitoring:
 *
 * ```tsx
 * // app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <PendingTxWatcher />
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */

"use client";

import React, { createContext, useContext, type ReactNode } from "react";
import { usePendingTxWatcher, type PendingTransaction } from "~/hooks/use-pending-tx-watcher";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { PendingTxPopover } from "./pending-tx-popover";

/**
 * Context for accessing pending transaction watcher from anywhere in the app
 */
interface PendingTxContextValue {
  pendingTransactions: PendingTransaction[];
  addPendingTx: (tx: PendingTransaction) => void;
  removePendingTx: (id: string) => void;
  isChecking: boolean;
  checkNow: () => Promise<void>;
}

const PendingTxContext = createContext<PendingTxContextValue | null>(null);

/**
 * Hook to access pending transaction watcher from any component
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { addPendingTx } = usePendingTxContext();
 *
 *   const handleTransactionSubmit = (txHash: string) => {
 *     addPendingTx({
 *       id: `module-${moduleCode}`,
 *       txHash,
 *       entityType: "module",
 *       entityId: moduleCode,
 *       context: { courseNftPolicyId, moduleCode },
 *       submittedAt: new Date(),
 *     });
 *   };
 * }
 * ```
 */
export function usePendingTxContext() {
  const context = useContext(PendingTxContext);
  if (!context) {
    throw new Error("usePendingTxContext must be used within PendingTxWatcher");
  }
  return context;
}

export interface PendingTxWatcherProps {
  /** Optional children to render (typically not used) */
  children?: ReactNode;
  /** Polling interval in milliseconds (default: 30000 = 30 seconds) */
  pollInterval?: number;
  /** Enable/disable the watcher (default: true) */
  enabled?: boolean;
}

/**
 * Global pending transaction watcher component
 *
 * Monitors pending transactions and shows toast notifications when transactions confirm.
 * Provides context for adding/removing pending transactions from anywhere in the app.
 */
export function PendingTxWatcher({
  children,
  pollInterval = 30000,
  enabled = true,
}: PendingTxWatcherProps) {
  const router = useRouter();

  const watcherState = usePendingTxWatcher({
    pollInterval,
    enabled,
    onConfirmation: (tx, confirmation) => {
      console.log(`[PendingTxWatcher] Transaction confirmed: ${tx.txHash}`);

      // Show success notification
      toast.success("Transaction Confirmed", {
        description: `Your ${tx.entityType} transaction has been confirmed on-chain with ${confirmation.confirmations} confirmations.`,
      });

      // Refresh the current page to show updated data
      router.refresh();
    },
    onError: (tx, error) => {
      console.error(`[PendingTxWatcher] Error processing transaction ${tx.txHash}:`, error);

      // Show error notification
      toast.error("Transaction Processing Failed", {
        description: `Failed to process confirmed transaction. Please refresh the page manually.`,
      });
    },
  });

  return (
    <PendingTxContext.Provider value={watcherState}>
      {children}
      {/* Popover showing pending transactions */}
      <PendingTxPopover />
    </PendingTxContext.Provider>
  );
}

/**
 * Hook to automatically add pending transaction after successful transaction submission
 *
 * Use this in transaction components to automatically track pending transactions:
 *
 * @example
 * ```tsx
 * function MintModuleTokens() {
 *   const { trackPendingTx } = useTrackPendingTx();
 *
 *   const handleSuccess = (result: { txHash: string }) => {
 *     trackPendingTx({
 *       id: `module-${moduleCode}`,
 *       txHash: result.txHash,
 *       entityType: "module",
 *       entityId: moduleCode,
 *       context: { courseNftPolicyId, moduleCode },
 *     });
 *   };
 * }
 * ```
 */
export function useTrackPendingTx() {
  const { addPendingTx } = usePendingTxContext();

  const trackPendingTx = (params: Omit<PendingTransaction, "submittedAt">) => {
    addPendingTx({
      ...params,
      submittedAt: new Date(),
    });
  };

  return { trackPendingTx };
}
