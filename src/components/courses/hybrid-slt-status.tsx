"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useHybridSlts, type HybridSLT } from "~/hooks/use-hybrid-slts";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioBadge,
  AndamioButton,
  AndamioSkeleton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioTable,
  AndamioTableBody,
  AndamioTableCell,
  AndamioTableHead,
  AndamioTableHeader,
  AndamioTableRow,
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
  AndamioDrawer,
  AndamioDrawerClose,
  AndamioDrawerContent,
  AndamioDrawerDescription,
  AndamioDrawerFooter,
  AndamioDrawerHeader,
  AndamioDrawerTitle,
  AndamioDrawerTrigger,
  AndamioInput,
  AndamioLabel,
} from "~/components/andamio";
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Blocks,
  Database,
  Download,
  Loader2,
  Link as LinkIcon,
} from "lucide-react";
import { toast } from "sonner";

// =============================================================================
// Types
// =============================================================================

interface HybridSLTStatusProps {
  courseNftPolicyId: string;
  moduleCode: string;
  moduleHash?: string;
  onRefresh?: () => void;
}

interface SLTRowProps {
  slt: HybridSLT;
  courseNftPolicyId: string;
  moduleCode: string;
  onImportSuccess: () => void;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Status indicator for a single SLT
 */
function SLTStatusIcon({ slt }: { slt: HybridSLT }) {
  if (slt.inDb && slt.onChain) {
    return (
      <AndamioTooltip>
        <AndamioTooltipTrigger asChild>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-3.5 w-3.5 text-success" />
          </div>
        </AndamioTooltipTrigger>
        <AndamioTooltipContent>
          <p>Synced: In DB and on-chain</p>
        </AndamioTooltipContent>
      </AndamioTooltip>
    );
  }

  if (slt.inDb && !slt.onChain) {
    return (
      <AndamioTooltip>
        <AndamioTooltipTrigger asChild>
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-info/10">
            <Database className="h-3.5 w-3.5 text-info" />
          </div>
        </AndamioTooltipTrigger>
        <AndamioTooltipContent>
          <p>DB Only: Not yet minted on-chain</p>
        </AndamioTooltipContent>
      </AndamioTooltip>
    );
  }

  return (
    <AndamioTooltip>
      <AndamioTooltipTrigger asChild>
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-warning/10">
          <Blocks className="h-3.5 w-3.5 text-warning" />
        </div>
      </AndamioTooltipTrigger>
      <AndamioTooltipContent>
        <p>On-chain Only: Not in database</p>
      </AndamioTooltipContent>
    </AndamioTooltip>
  );
}

/**
 * Import drawer for on-chain-only SLTs
 */
function ImportSLTDrawer({
  slt,
  courseNftPolicyId,
  moduleCode,
  onSuccess,
}: {
  slt: HybridSLT;
  courseNftPolicyId: string;
  moduleCode: string;
  onSuccess: () => void;
}) {
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();
  const [open, setOpen] = useState(false);
  const [moduleIndex, setModuleIndex] = useState(slt.moduleIndex);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImport = async () => {
    if (!isAuthenticated) {
      toast.error("Authentication required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: moduleIndex,
            slt_text: slt.text,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to import SLT");
      }

      toast.success("SLT Imported!", {
        description: "The on-chain SLT has been added to your database.",
      });

      setOpen(false);
      onSuccess();
    } catch (err) {
      console.error("Error importing SLT:", err);
      toast.error("Import Failed", {
        description: err instanceof Error ? err.message : "Failed to import SLT",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AndamioDrawer open={open} onOpenChange={setOpen}>
      <AndamioDrawerTrigger asChild>
        <AndamioButton variant="outline" size="sm">
          <Download className="h-3 w-3 mr-1" />
          Import
        </AndamioButton>
      </AndamioDrawerTrigger>
      <AndamioDrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <AndamioDrawerHeader className="text-left">
            <AndamioDrawerTitle>Import On-Chain SLT</AndamioDrawerTitle>
            <AndamioDrawerDescription>
              This Student Learning Target exists on the blockchain but not in your
              database. Import it to manage it in the studio.
            </AndamioDrawerDescription>
          </AndamioDrawerHeader>

          <div className="space-y-4 px-4">
            {/* SLT Text Preview */}
            <div className="rounded-lg border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Learning Target</p>
              <p className="text-sm">{slt.text}</p>
            </div>

            {/* Module Index Input */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="import-index">Module Index</AndamioLabel>
              <AndamioInput
                id="import-index"
                type="number"
                min={0}
                max={25}
                value={moduleIndex}
                onChange={(e) => setModuleIndex(parseInt(e.target.value) || 0)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                The index determines the order of SLTs in the module (0-25).
              </p>
            </div>
          </div>

          <AndamioDrawerFooter className="flex-row gap-3 pt-6">
            <AndamioDrawerClose asChild>
              <AndamioButton variant="outline" className="flex-1" disabled={isSubmitting}>
                Cancel
              </AndamioButton>
            </AndamioDrawerClose>
            <AndamioButton
              className="flex-1"
              onClick={handleImport}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Import SLT
                </>
              )}
            </AndamioButton>
          </AndamioDrawerFooter>
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}

/**
 * Single SLT row with status and actions
 */
function SLTRow({ slt, courseNftPolicyId, moduleCode, onImportSuccess }: SLTRowProps) {
  return (
    <AndamioTableRow>
      <AndamioTableCell className="w-12">
        <SLTStatusIcon slt={slt} />
      </AndamioTableCell>
      <AndamioTableCell className="font-mono text-xs w-16">
        <AndamioBadge variant="outline">{slt.moduleIndex}</AndamioBadge>
      </AndamioTableCell>
      <AndamioTableCell className="font-medium">
        <span className={!slt.inDb ? "text-muted-foreground" : ""}>
          {slt.text}
        </span>
      </AndamioTableCell>
      <AndamioTableCell className="text-right w-32">
        {slt.inDb ? (
          <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/${slt.moduleIndex}`}>
            <AndamioButton variant="ghost" size="sm">
              Edit
            </AndamioButton>
          </Link>
        ) : (
          <ImportSLTDrawer
            slt={slt}
            courseNftPolicyId={courseNftPolicyId}
            moduleCode={moduleCode}
            onSuccess={onImportSuccess}
          />
        )}
      </AndamioTableCell>
    </AndamioTableRow>
  );
}

/**
 * Main component showing hybrid SLT status for a module
 */
export function HybridSLTStatus({
  courseNftPolicyId,
  moduleCode,
  moduleHash,
  onRefresh,
}: HybridSLTStatusProps) {
  const {
    hybridSlts,
    onChainModule,
    isLoading,
    error,
    refetch,
    dbOnlyCount,
    onChainOnlyCount,
    syncedCount,
  } = useHybridSlts(courseNftPolicyId, moduleCode, moduleHash);

  const handleRefresh = () => {
    refetch();
    onRefresh?.();
  };

  const totalCount = hybridSlts.length;
  const hasOnChainData = onChainModule !== null;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <LinkIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <AndamioCardTitle>On-Chain SLT Status</AndamioCardTitle>
              <AndamioCardDescription>
                Comparison of database and blockchain SLTs
              </AndamioCardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoading && totalCount > 0 && (
              <div className="flex gap-2">
                {syncedCount > 0 && (
                  <AndamioBadge variant="default" className="bg-success text-success-foreground">
                    {syncedCount} synced
                  </AndamioBadge>
                )}
                {dbOnlyCount > 0 && (
                  <AndamioTooltip>
                    <AndamioTooltipTrigger asChild>
                      <AndamioBadge variant="outline" className="text-info border-info">
                        <Database className="h-3 w-3 mr-1" />
                        {dbOnlyCount} DB only
                      </AndamioBadge>
                    </AndamioTooltipTrigger>
                    <AndamioTooltipContent>
                      <p>SLTs in database but not on-chain</p>
                    </AndamioTooltipContent>
                  </AndamioTooltip>
                )}
                {onChainOnlyCount > 0 && (
                  <AndamioTooltip>
                    <AndamioTooltipTrigger asChild>
                      <AndamioBadge variant="outline" className="text-warning border-warning">
                        <Blocks className="h-3 w-3 mr-1" />
                        {onChainOnlyCount} on-chain only
                      </AndamioBadge>
                    </AndamioTooltipTrigger>
                    <AndamioTooltipContent>
                      <p>SLTs on blockchain but not in database</p>
                    </AndamioTooltipContent>
                  </AndamioTooltip>
                )}
              </div>
            )}
            <AndamioButton
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>

      <AndamioCardContent>
        {/* Loading state */}
        {isLoading && hybridSlts.length === 0 && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <AndamioSkeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}

        {/* Error state */}
        {error && (
          <AndamioAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertDescription>
              Failed to fetch data: {error.message}
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* On-chain module info */}
        {hasOnChainData && onChainModule && (
          <div className="mb-4 rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">On-Chain Module Hash</p>
                <code className="text-xs font-mono">
                  {onChainModule.assignment_id.slice(0, 16)}...
                </code>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Created By</p>
                <span className="text-sm">{onChainModule.created_by}</span>
              </div>
            </div>
            {onChainModule.prerequisites.length > 0 && (
              <div className="mt-2 pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-1">Prerequisites</p>
                <div className="flex flex-wrap gap-1">
                  {onChainModule.prerequisites.map((prereq, i) => (
                    <code key={i} className="text-xs bg-muted px-1 rounded">
                      {prereq.slice(0, 8)}...
                    </code>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No on-chain data message */}
        {!isLoading && !hasOnChainData && hybridSlts.length > 0 && (
          <AndamioAlert className="mb-4">
            <Blocks className="h-4 w-4" />
            <AndamioAlertDescription>
              No matching on-chain module found. SLTs will appear on-chain after minting.
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Empty state */}
        {!isLoading && hybridSlts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <LinkIcon className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-sm text-muted-foreground">
              No SLTs found in database or on-chain.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add SLTs in the database to get started.
            </p>
          </div>
        )}

        {/* SLT table */}
        {hybridSlts.length > 0 && (
          <div className="border rounded-md">
            <AndamioTable>
              <AndamioTableHeader>
                <AndamioTableRow>
                  <AndamioTableHead className="w-12">Status</AndamioTableHead>
                  <AndamioTableHead className="w-16">Index</AndamioTableHead>
                  <AndamioTableHead>Learning Target</AndamioTableHead>
                  <AndamioTableHead className="w-32 text-right">Actions</AndamioTableHead>
                </AndamioTableRow>
              </AndamioTableHeader>
              <AndamioTableBody>
                {hybridSlts.map((slt) => (
                  <SLTRow
                    key={slt.id}
                    slt={slt}
                    courseNftPolicyId={courseNftPolicyId}
                    moduleCode={moduleCode}
                    onImportSuccess={handleRefresh}
                  />
                ))}
              </AndamioTableBody>
            </AndamioTable>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-3 w-3 text-success" />
            </div>
            <span>Synced (DB + On-chain)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-info/10">
              <Database className="h-3 w-3 text-info" />
            </div>
            <span>DB Only</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-warning/10">
              <Blocks className="h-3 w-3 text-warning" />
            </div>
            <span>On-chain Only</span>
          </div>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
