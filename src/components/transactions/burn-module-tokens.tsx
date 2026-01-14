/**
 * BurnModuleTokens Transaction Component
 *
 * Teacher UI for burning (removing) course module tokens.
 * Uses COURSE_TEACHER_MODULES_MANAGE transaction definition from @andamio/transactions.
 *
 * @see packages/andamio-transactions/src/definitions/v2/course/teacher/modules-manage.ts
 */

"use client";

import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { COURSE_TEACHER_MODULES_MANAGE } from "@andamio/transactions";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useAndamioTransaction } from "~/hooks/use-andamio-transaction";
import { courseModuleKeys } from "~/hooks/api/use-course-module";
import { env } from "~/env";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { DeleteIcon, ModuleIcon, AlertIcon, CloseIcon } from "~/components/icons";
import { toast } from "sonner";

export interface ModuleToBurn {
  /** Module code (for display) */
  moduleCode: string;
  /** Module title (for display) */
  title: string | null;
  /** On-chain hash (token name) - this is what gets sent to the transaction */
  onChainHash: string;
  /** Number of SLTs (for display) */
  sltCount: number;
}

export interface BurnModuleTokensProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Array of modules selected for burning
   */
  modulesToBurn: ModuleToBurn[];

  /**
   * Callback to clear selection
   */
  onClearSelection: () => void;

  /**
   * Callback fired when burning is successful
   */
  onSuccess?: () => void | Promise<void>;

  /**
   * Callback fired when burning fails
   */
  onError?: (error: Error) => void;
}

/**
 * BurnModuleTokens - Teacher UI for burning module tokens
 *
 * Allows teachers to permanently remove module tokens from the blockchain.
 * This is a destructive operation and cannot be undone.
 */
export function BurnModuleTokens({
  courseNftPolicyId,
  modulesToBurn,
  onClearSelection,
  onSuccess,
  onError,
}: BurnModuleTokensProps) {
  const { user, isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();
  const queryClient = useQueryClient();

  /**
   * Update burned modules to DRAFT status in the database.
   * Called after the burn transaction is successfully submitted.
   */
  const revertModulesToDraft = async (modules: ModuleToBurn[]) => {
    const results = await Promise.allSettled(
      modules.map(async (m) => {
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/teacher/course-module/update-status`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              policy_id: courseNftPolicyId,
              module_code: m.moduleCode,
              status: "DRAFT",
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to update ${m.moduleCode} to DRAFT`);
        }

        return m.moduleCode;
      })
    );

    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length > 0) {
      console.warn("[BurnModuleTokens] Some modules failed to revert to DRAFT:", failed);
    }

    // Invalidate React Query cache to trigger refetch
    await queryClient.invalidateQueries({
      queryKey: courseModuleKeys.list(courseNftPolicyId),
    });

    return results;
  };

  const handleBurnModules = async () => {
    if (!user?.accessTokenAlias || modulesToBurn.length === 0) {
      return;
    }

    // Extract the on-chain hashes for burning
    const hashesToBurn = modulesToBurn.map((m) => m.onChainHash);

    const txRequest = {
      alias: user.accessTokenAlias,
      course_id: courseNftPolicyId,
      modules_to_mint: [],
      modules_to_update: [],
      modules_to_burn: hashesToBurn,
    };

    await execute({
      definition: COURSE_TEACHER_MODULES_MANAGE,
      params: txRequest,
      onSuccess: async (txResult) => {
        console.log("[BurnModuleTokens] Success!", txResult);

        const moduleCount = modulesToBurn.length;

        toast.success("Burn Transaction Submitted!", {
          description: `${moduleCount} module${moduleCount > 1 ? "s" : ""} burned - updating database`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Revert burned modules to DRAFT status in database
        await revertModulesToDraft(modulesToBurn);

        // Clear selection and refresh data
        onClearSelection();
        await onSuccess?.();
      },
      onError: (txError) => {
        console.error("[BurnModuleTokens] Error:", txError);
        toast.error("Burn Failed", {
          description: txError.message || "Failed to burn module tokens",
        });
        onError?.(txError);
      },
    });
  };

  if (!isAuthenticated || !user || modulesToBurn.length === 0) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;

  return (
    <AndamioCard className="border-destructive/30 bg-destructive/5">
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <DeleteIcon className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AndamioCardTitle className="text-destructive">Burn Module Tokens</AndamioCardTitle>
              <AndamioCardDescription>
                Permanently remove selected modules from the blockchain
              </AndamioCardDescription>
            </div>
          </div>
          <AndamioButton
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-muted-foreground hover:text-foreground"
          >
            <CloseIcon className="h-4 w-4 mr-1" />
            Clear
          </AndamioButton>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Warning */}
        <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
          <div className="text-xs">
            <AndamioText variant="small" className="font-medium text-destructive">
              This action cannot be undone
            </AndamioText>
            <AndamioText variant="small">
              Burning removes the module tokens from the blockchain permanently.
              Students who have earned these credentials will no longer be able to verify them on-chain.
            </AndamioText>
          </div>
        </div>

        {/* Selected Modules */}
        <div className="space-y-3">
          <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide text-destructive">
            Selected for Removal ({modulesToBurn.length})
          </AndamioText>
          <div className="space-y-2">
            {modulesToBurn.map((m) => (
              <div
                key={m.onChainHash}
                className="rounded-md border border-destructive/20 p-3 bg-background/50 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <ModuleIcon className="h-4 w-4 text-destructive" />
                  <span className="text-sm font-medium">{m.moduleCode}</span>
                  {m.title && (
                    <span className="text-sm text-muted-foreground">— {m.title}</span>
                  )}
                  <AndamioBadge variant="outline" className="text-xs ml-auto">
                    {m.sltCount} SLT{m.sltCount !== 1 ? "s" : ""}
                  </AndamioBadge>
                </div>
                <code className="block text-[10px] font-mono text-muted-foreground break-all">
                  {m.onChainHash}
                </code>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => reset()}
            messages={{
              success: `${modulesToBurn.length} module${modulesToBurn.length > 1 ? "s" : ""} burned successfully!`,
            }}
          />
        )}

        {/* Burn Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleBurnModules}
            disabled={!hasAccessToken}
            variant="destructive"
            stateText={{
              idle: `Burn ${modulesToBurn.length} Module${modulesToBurn.length > 1 ? "s" : ""}`,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Burning on Blockchain...",
            }}
            className="w-full"
          />
        )}

        {/* Requirement check */}
        {!hasAccessToken && (
          <AndamioText variant="small" className="text-xs text-center">
            You need an access token to burn module tokens.
          </AndamioText>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
