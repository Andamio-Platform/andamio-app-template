"use client";

import React from "react";
import { usePendingTransactions } from "~/hooks/use-pending-transactions";
import {
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
  AndamioText,
} from "~/components/andamio";
import { Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

/**
 * PendingTxIndicator - A subtle, animated indicator for pending transactions
 *
 * Shows in the status bar when there are blockchain transactions awaiting confirmation.
 * Simple, elegant, and non-intrusive.
 */
export function PendingTxIndicator() {
  const { count, hasPending, pendingTxs } = usePendingTransactions({
    pollInterval: 30000, // Check every 30 seconds
  });

  // Don't render anything if no pending transactions
  if (!hasPending) {
    return null;
  }

  // Get a summary of what's pending
  const getSummary = () => {
    if (count === 1) {
      const tx = pendingTxs[0];
      const typeLabel = tx?.entity_type?.replace(/-/g, " ") ?? "transaction";
      return `1 ${typeLabel} pending`;
    }
    return `${count} transactions pending`;
  };

  return (
    <>
      <div className="hidden sm:block h-4 w-px bg-border flex-shrink-0" />
      <AndamioTooltip>
        <AndamioTooltipTrigger asChild>
          <div className="flex items-center gap-1.5 cursor-default">
            {/* Animated spinner */}
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary flex-shrink-0" />

            {/* Count badge with pulse animation */}
            <div className="relative">
              <span
                className={cn(
                  "text-xs font-medium text-primary tabular-nums",
                  count > 0 && "animate-pulse"
                )}
              >
                {count}
              </span>
              {/* Subtle glow effect */}
              <span className="absolute inset-0 animate-ping text-xs font-medium text-primary opacity-30">
                {count}
              </span>
            </div>

            <span className="hidden md:inline text-xs text-muted-foreground">
              pending
            </span>
          </div>
        </AndamioTooltipTrigger>
        <AndamioTooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <AndamioText className="font-medium">{getSummary()}</AndamioText>
            <AndamioText variant="small" className="text-xs">
              Awaiting blockchain confirmation. This usually takes 20-60 seconds.
            </AndamioText>
          </div>
        </AndamioTooltipContent>
      </AndamioTooltip>
    </>
  );
}
