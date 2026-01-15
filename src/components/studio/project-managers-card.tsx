"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useOwnedProjects, useManagingProjects } from "~/hooks/use-andamioscan";
import { env } from "~/env";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  ManagerIcon,
  OnChainIcon,
  RefreshIcon,
  SuccessIcon,
  AlertIcon,
  DatabaseIcon,
} from "~/components/icons";
import { toast } from "sonner";
import { cn } from "~/lib/utils";

export interface ProjectManagersCardProps {
  projectId: string;
  className?: string;
}

interface SyncManagersResponse {
  project_id: string;
  managers_synced: string[];
  success: boolean;
}

/**
 * Card showing project admin and managers from on-chain data
 * with ability to sync to database
 */
export function ProjectManagersCard({
  projectId,
  className,
}: ProjectManagersCardProps) {
  const { user, authenticatedFetch } = useAndamioAuth();
  const alias = user?.accessTokenAlias ?? undefined;

  // Get on-chain projects where user is owner
  const {
    data: ownedProjects,
    isLoading: isLoadingOwned,
    refetch: refetchOwned,
  } = useOwnedProjects(alias);

  // Get on-chain projects where user is manager
  const {
    data: managingProjects,
    isLoading: isLoadingManaging,
    refetch: refetchManaging,
  } = useManagingProjects(alias);

  const [isSyncing, setIsSyncing] = useState(false);
  const [dbManagers, setDbManagers] = useState<string[] | null>(null);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);

  // Find this specific project in owned or managing lists
  const ownedProject = ownedProjects?.find(
    (p) => p.project_id === projectId
  );
  const managingProject = managingProjects?.find(
    (p) => p.project_id === projectId
  );
  const onChainProject = ownedProject ?? managingProject;

  const onChainAdmin = onChainProject?.admin ?? null;
  const onChainManagers = onChainProject?.managers ?? [];

  const isLoading = isLoadingOwned || isLoadingManaging;

  const handleSyncManagers = async () => {
    setIsSyncing(true);
    setLastSyncSuccess(null);

    try {
      // V2 API: POST /project-v2/admin/managers/sync
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/project-v2/admin/managers/sync`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project_id: projectId }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to sync managers");
      }

      const result = (await response.json()) as SyncManagersResponse;
      setDbManagers(result.managers_synced);
      setLastSyncSuccess(result.success);

      toast.success("Managers Synced", {
        description: `${result.managers_synced.length} manager(s) synced from on-chain data`,
      });

      // Refresh on-chain data to ensure we're showing latest
      void refetchOwned();
      void refetchManaging();
    } catch (err) {
      console.error("Error syncing managers:", err);
      setLastSyncSuccess(false);
      toast.error("Sync Failed", {
        description: err instanceof Error ? err.message : "Failed to sync managers",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Compare on-chain and DB managers
  const managersMatch =
    dbManagers !== null &&
    onChainManagers.length === dbManagers.length &&
    onChainManagers.every((m) => dbManagers.includes(m));

  return (
    <AndamioCard className={cn("", className)}>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardTitle className="text-base flex items-center gap-2">
            <ManagerIcon className="h-4 w-4" />
            Project Team
          </AndamioCardTitle>
          <AndamioButton
            variant="outline"
            size="sm"
            onClick={handleSyncManagers}
            disabled={isSyncing || isLoading}
            className="h-7 text-xs"
          >
            {isSyncing ? (
              <>
                <RefreshIcon className="h-3 w-3 mr-1 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshIcon className="h-3 w-3 mr-1" />
                Sync from Chain
              </>
            )}
          </AndamioButton>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* On-Chain Admin */}
        {onChainAdmin && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <OnChainIcon className="h-3.5 w-3.5 text-primary" />
              <AndamioText variant="small" className="font-medium">
                On-Chain Admin (Owner)
              </AndamioText>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <AndamioBadge variant="default" className="font-mono text-xs">
                {onChainAdmin}
              </AndamioBadge>
            </div>
          </div>
        )}

        {/* On-Chain Managers */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <OnChainIcon className="h-3.5 w-3.5 text-primary" />
            <AndamioText variant="small" className="font-medium">
              On-Chain Managers
            </AndamioText>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {isLoading ? (
              <>
                <AndamioSkeleton className="h-6 w-20" />
                <AndamioSkeleton className="h-6 w-16" />
              </>
            ) : !onChainProject ? (
              <AndamioText variant="small" className="text-muted-foreground">
                Project not found on-chain (may still be syncing)
              </AndamioText>
            ) : onChainManagers.length === 0 ? (
              <AndamioText variant="small" className="text-muted-foreground">
                No managers found on-chain
              </AndamioText>
            ) : (
              onChainManagers.map((manager) => (
                <AndamioBadge
                  key={manager}
                  variant="secondary"
                  className="font-mono text-xs"
                >
                  {manager}
                </AndamioBadge>
              ))
            )}
          </div>
        </div>

        {/* Database Managers (only shown after sync) */}
        {dbManagers !== null && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <DatabaseIcon className="h-3.5 w-3.5 text-info" />
              <AndamioText variant="small" className="font-medium">
                Database Managers
              </AndamioText>
              {lastSyncSuccess !== null && (
                managersMatch ? (
                  <AndamioBadge variant="outline" className="h-5 text-[10px] bg-success/10 border-success/30 text-success">
                    <SuccessIcon className="h-2.5 w-2.5 mr-0.5" />
                    In Sync
                  </AndamioBadge>
                ) : (
                  <AndamioBadge variant="outline" className="h-5 text-[10px] bg-warning/10 border-warning/30 text-warning">
                    <AlertIcon className="h-2.5 w-2.5 mr-0.5" />
                    Mismatch
                  </AndamioBadge>
                )
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {dbManagers.length === 0 ? (
                <AndamioText variant="small" className="text-muted-foreground">
                  No managers in database
                </AndamioText>
              ) : (
                dbManagers.map((manager) => (
                  <AndamioBadge
                    key={manager}
                    variant="outline"
                    className={cn(
                      "font-mono text-xs",
                      onChainManagers.includes(manager)
                        ? "bg-success/10 border-success/30"
                        : "bg-warning/10 border-warning/30"
                    )}
                  >
                    {manager}
                  </AndamioBadge>
                ))
              )}
            </div>
          </div>
        )}

        {/* Sync hint when DB managers not yet loaded */}
        {dbManagers === null && !isLoading && (
          <AndamioText variant="small" className="text-muted-foreground">
            Click &quot;Sync from Chain&quot; to sync managers to the database.
            This grants them permission to create and manage tasks.
          </AndamioText>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
