/**
 * @deprecated V1 PATTERN - Will be replaced by pending-tx-list.tsx
 *
 * This component is part of the V1 pending TX system which uses client-side
 * Koios polling. The V2 TX State Machine handles confirmation server-side.
 *
 * This file will be removed in a future release.
 *
 * @see ~/hooks/tx/use-tx-watcher.ts - V2 pattern
 * @see ~/components/tx/ - V2 transaction components
 *
 * ---
 * Original description:
 *
 * PendingTxPopover Component
 *
 * Displays a popover in the bottom right corner showing all pending transactions
 * being monitored by the pending transaction watcher.
 */

"use client";

import React, { useState } from "react";
import { usePendingTxContext } from "./pending-tx-watcher";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/andamio/andamio-popover";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { PendingIcon, ExternalLinkIcon, RefreshIcon, CloseIcon } from "~/components/icons";
import { cn } from "~/lib/utils";

/**
 * Format time since transaction submission
 */
function formatTimeSince(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Get entity type display name
 */
function getEntityTypeLabel(entityType: string): string {
  const labels: Record<string, string> = {
    module: "Module",
    assignment: "Assignment",
    task: "Task",
    "assignment-commitment": "Assignment Commitment",
    "task-commitment": "Task Commitment",
  };
  return labels[entityType] ?? entityType;
}

/**
 * Get blockchain explorer URL for transaction
 */
function getExplorerUrl(txHash: string): string {
  // TODO: Make this configurable (mainnet/preprod/preview)
  return `https://cardanoscan.io/transaction/${txHash}`;
}

/**
 * Truncate transaction hash for display
 */
function truncateTxHash(txHash: string | undefined | null, length = 12): string {
  if (!txHash) return "—";
  if (txHash.length <= length) return txHash;
  const start = Math.floor(length / 2);
  const end = Math.floor(length / 2);
  return `${txHash.slice(0, start)}...${txHash.slice(-end)}`;
}

export interface PendingTxPopoverProps {
  /** Optional className for positioning/styling */
  className?: string;
}

/**
 * Popover component showing pending transactions
 *
 * Automatically appears in the bottom right corner when there are pending transactions.
 */
export function PendingTxPopover({ className }: PendingTxPopoverProps) {
  const { pendingTransactions, removePendingTx, isChecking, checkNow } = usePendingTxContext();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render if no pending transactions
  if (pendingTransactions.length === 0) {
    return null;
  }

  const handleCheckNow = async () => {
    await checkNow();
  };

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        className
      )}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <AndamioButton
            variant="default"
            size="lg"
            className="relative h-14 w-14 rounded-full shadow-lg hover:shadow-xl"
          >
            {/* Animated pulse effect */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-20" />
            </span>

            {/* Icon and badge */}
            <div className="relative flex items-center justify-center">
              <PendingIcon className={cn("h-6 w-6", isChecking && "animate-pulse")} />
              <AndamioBadge
                variant="destructive"
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {pendingTransactions.length}
              </AndamioBadge>
            </div>
          </AndamioButton>
        </PopoverTrigger>

        <PopoverContent
          className="w-96 p-0"
          align="end"
          side="top"
          sideOffset={8}
        >
          <AndamioCard className="border-0 shadow-none">
            <AndamioCardHeader className="border-b">
              <div className="flex items-center justify-between">
                <AndamioCardTitle className="text-lg">
                  Pending Transactions
                </AndamioCardTitle>
                <div className="flex items-center gap-2">
                  <AndamioButton
                    variant="ghost"
                    size="sm"
                    onClick={handleCheckNow}
                    disabled={isChecking}
                  >
                    <RefreshIcon
                      className={cn(
                        "h-4 w-4",
                        isChecking && "animate-spin"
                      )}
                    />
                  </AndamioButton>
                </div>
              </div>
              <AndamioText variant="small" className="text-xs">
                {isChecking
                  ? "Checking blockchain for confirmations..."
                  : `Monitoring ${pendingTransactions.length} transaction${pendingTransactions.length !== 1 ? "s" : ""}`}
              </AndamioText>
            </AndamioCardHeader>

            <AndamioCardContent className="max-h-96 overflow-y-auto p-0">
              <div className="divide-y">
                {pendingTransactions.map((tx, index) => (
                  <div key={tx.txHash ?? tx.id ?? `pending-${index}`} className="group relative p-4 transition-colors hover:bg-muted/50">
                    {/* Entity Type Badge */}
                    <div className="mb-2 flex items-center justify-between">
                      <AndamioBadge variant="outline" className="text-xs">
                        {getEntityTypeLabel(tx.entityType)}
                      </AndamioBadge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeSince(tx.submittedAt)}
                      </span>
                    </div>

                    {/* Entity ID */}
                    <div className="mb-2">
                      <AndamioText variant="small" className="font-medium text-foreground">{tx.entityId}</AndamioText>
                      {tx.context?.courseNftPolicyId && (
                        <AndamioText variant="small" className="text-xs">
                          Course: {truncateTxHash(tx.context.courseNftPolicyId, 16)}
                        </AndamioText>
                      )}
                    </div>

                    {/* Transaction Hash */}
                    <div className="flex items-center gap-2">
                      <code className="flex-1 truncate rounded bg-muted px-2 py-1 text-xs font-mono">
                        {truncateTxHash(tx.txHash, 20)}
                      </code>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        {tx.txHash && (
                          <AndamioButton
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => window.open(getExplorerUrl(tx.txHash), "_blank")}
                            title="View on blockchain explorer"
                          >
                            <ExternalLinkIcon className="h-3.5 w-3.5" />
                          </AndamioButton>
                        )}
                        <AndamioButton
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => removePendingTx(tx.id)}
                          title="Remove from watch list"
                        >
                          <CloseIcon className="h-3.5 w-3.5" />
                        </AndamioButton>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-muted" />
                        <span>Awaiting confirmation</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AndamioCardContent>

            {/* Footer */}
            <div className="border-t bg-muted/30 p-3 text-center text-xs text-muted-foreground">
              Transactions are checked automatically every 30 seconds
            </div>
          </AndamioCard>
        </PopoverContent>
      </Popover>
    </div>
  );
}
