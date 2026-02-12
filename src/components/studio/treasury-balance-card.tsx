"use client";

import React from "react";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { TreasuryIcon } from "~/components/icons";
import { formatLovelace } from "~/lib/cardano-utils";
import type { TreasuryFunding } from "~/hooks/api/project/use-project";
import { cn } from "~/lib/utils";

export interface TreasuryBalanceCardProps {
  treasuryFundings: TreasuryFunding[];
  treasuryAddress?: string;
  /** API-computed treasury balance (preferred over summing fundings) */
  treasuryBalance?: number;
  className?: string;
}

export function TreasuryBalanceCard({
  treasuryFundings,
  treasuryAddress,
  treasuryBalance,
  className,
}: TreasuryBalanceCardProps) {
  // Use API's treasury_balance if available, otherwise fall back to summing fundings
  const totalLovelace = treasuryBalance ?? treasuryFundings.reduce(
    (sum, f) => sum + (f.lovelaceAmount ?? 0),
    0,
  );

  return (
    <AndamioCard className={cn("", className)}>
      <AndamioCardHeader className="pb-3">
        <AndamioCardTitle className="text-base flex items-center gap-2">
          <TreasuryIcon className="h-4 w-4" />
          Treasury Balance
        </AndamioCardTitle>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-3">
        {totalLovelace === 0 && treasuryFundings.length === 0 ? (
          <AndamioText variant="muted">No funds yet</AndamioText>
        ) : (
          <div className="text-3xl font-bold">
            {formatLovelace(totalLovelace)}
          </div>
        )}
        {treasuryAddress && (
          <div className="pt-2 border-t">
            <AndamioText variant="small" className="text-muted-foreground">
              Treasury address
            </AndamioText>
            <AndamioText
              variant="small"
              className="font-mono break-all"
            >
              {treasuryAddress.slice(0, 20)}...{treasuryAddress.slice(-12)}
            </AndamioText>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
