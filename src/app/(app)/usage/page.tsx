"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AndamioPageHeader,
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioText,
  AndamioStatCard,
  AndamioProgress,
  AndamioErrorAlert,
  AndamioPageLoading,
  AndamioSeparator,
  AndamioButton,
} from "~/components/andamio";
import { ChartIcon, HistoryIcon } from "~/components/icons";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { RequireAuth } from "~/components/auth/require-auth";
import type { DeveloperUsageResponse } from "~/types/generated";
import { getErrorMessage, parseApiError } from "~/lib/api-utils";

const USAGE_ENDPOINT = "/api/gateway/api/v1/user/usage";

function formatDate(value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatNumber(value?: number) {
  if (value === undefined || value === null) return "—";
  return new Intl.NumberFormat().format(value);
}

function toPercent(consumed: number, limit: number) {
  if (!limit || limit <= 0) return 0;
  return Math.min(100, Math.round((consumed / limit) * 100));
}

export default function UsageDashboardPage() {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [usage, setUsage] = useState<DeveloperUsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticatedFetch(USAGE_ENDPOINT);
      if (!response.ok) {
        const apiError = await parseApiError(response);
        throw new Error(apiError.message ?? "Failed to load usage");
      }
      const data = (await response.json()) as DeveloperUsageResponse;
      setUsage(data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load usage"));
    } finally {
      setIsLoading(false);
    }
  }, [authenticatedFetch, isAuthenticated]);

  useEffect(() => {
    void fetchUsage();
  }, [fetchUsage]);

  const usageSummary = useMemo(() => {
    const dailyConsumed = usage?.daily_quota_consumed ?? 0;
    const dailyLimit = usage?.daily_quota_limit ?? 0;
    const dailyRemaining = usage?.remaining_daily ?? Math.max(dailyLimit - dailyConsumed, 0);

    const monthlyConsumed = usage?.monthly_quota_consumed ?? 0;
    const monthlyLimit = usage?.monthly_quota_limit ?? 0;
    const monthlyRemaining = usage?.remaining_monthly ?? Math.max(monthlyLimit - monthlyConsumed, 0);

    return {
      dailyConsumed,
      dailyLimit,
      dailyRemaining,
      monthlyConsumed,
      monthlyLimit,
      monthlyRemaining,
      dailyPercent: toPercent(dailyConsumed, dailyLimit),
      monthlyPercent: toPercent(monthlyConsumed, monthlyLimit),
    };
  }, [usage]);

  const rateWindows = usage?.rate_limit_windows ?? [];

  return (
    <RequireAuth
      title="Usage Dashboard"
      description="Connect your wallet to view your API allowance"
    >
      <div className="space-y-8">
        <AndamioPageHeader
          title="Usage Dashboard"
          description="Track your API allowance, limits, and renewal window"
          action={(
            <AndamioButton
              variant="outline"
              onClick={() => void fetchUsage()}
              disabled={isLoading}
            >
              Refresh
            </AndamioButton>
          )}
        />

        {isLoading && !usage ? (
          <AndamioPageLoading variant="detail" />
        ) : (
          <div className="space-y-6">
            {error && <AndamioErrorAlert error={error} />}

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <AndamioStatCard
                icon={ChartIcon}
                value={formatNumber(usageSummary.dailyConsumed)}
                label="Daily usage"
                iconColor="primary"
              />
              <AndamioStatCard
                icon={ChartIcon}
                value={formatNumber(usageSummary.dailyRemaining)}
                label="Daily remaining"
                iconColor="info"
              />
              <AndamioStatCard
                icon={ChartIcon}
                value={formatNumber(usageSummary.monthlyConsumed)}
                label="Monthly usage"
                iconColor="primary"
              />
              <AndamioStatCard
                icon={ChartIcon}
                value={formatNumber(usageSummary.monthlyRemaining)}
                label="Monthly remaining"
                iconColor="info"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <AndamioCard>
                <AndamioCardHeader>
                  <AndamioCardTitle>Daily quota</AndamioCardTitle>
                  <AndamioCardDescription>
                    {formatNumber(usageSummary.dailyConsumed)} of {formatNumber(usageSummary.dailyLimit)} requests
                  </AndamioCardDescription>
                </AndamioCardHeader>
                <AndamioCardContent className="space-y-3">
                  <AndamioProgress value={usageSummary.dailyPercent} />
                  <AndamioText variant="small" className="text-muted-foreground">
                    {usageSummary.dailyPercent}% used today
                  </AndamioText>
                </AndamioCardContent>
              </AndamioCard>

              <AndamioCard>
                <AndamioCardHeader>
                  <AndamioCardTitle>Monthly quota</AndamioCardTitle>
                  <AndamioCardDescription>
                    {formatNumber(usageSummary.monthlyConsumed)} of {formatNumber(usageSummary.monthlyLimit)} requests
                  </AndamioCardDescription>
                </AndamioCardHeader>
                <AndamioCardContent className="space-y-3">
                  <AndamioProgress value={usageSummary.monthlyPercent} />
                  <AndamioText variant="small" className="text-muted-foreground">
                    {usageSummary.monthlyPercent}% used this month
                  </AndamioText>
                </AndamioCardContent>
              </AndamioCard>
            </div>

            <AndamioCard>
              <AndamioCardHeader>
                <AndamioCardTitle>Plan details</AndamioCardTitle>
                <AndamioCardDescription>Subscription tier and rate limits</AndamioCardDescription>
              </AndamioCardHeader>
              <AndamioCardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <AndamioText variant="small" className="text-muted-foreground">
                      Subscription tier
                    </AndamioText>
                    <AndamioText>{usage?.subscription_tier ?? "—"}</AndamioText>
                  </div>
                  <div className="space-y-1">
                    <AndamioText variant="small" className="text-muted-foreground">
                      Expires
                    </AndamioText>
                    <AndamioText>{formatDate(usage?.expiration)}</AndamioText>
                  </div>
                </div>

                <AndamioSeparator />

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HistoryIcon className="h-4 w-4 text-muted-foreground" />
                    <AndamioText className="font-medium">Rate limit windows</AndamioText>
                  </div>
                  {rateWindows.length === 0 ? (
                    <AndamioText variant="small" className="text-muted-foreground">
                      No rate limit windows available for this tier.
                    </AndamioText>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {rateWindows.map((window) => (
                        <div
                          key={window}
                          className="rounded-md border border-border/60 bg-muted/40 px-3 py-2"
                        >
                          <AndamioText variant="small">{window}</AndamioText>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </AndamioCardContent>
            </AndamioCard>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
