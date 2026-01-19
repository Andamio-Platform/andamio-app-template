/**
 * MintModuleTokens Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * Teacher UI for minting/updating course module tokens.
 * Uses COURSE_TEACHER_MODULES_MANAGE transaction with gateway auto-confirmation.
 * V2 uses batch operations for multiple modules in a single transaction.
 *
 * Module token names are Blake2b-256 hashes of the SLT content,
 * creating tamper-evident on-chain credentials.
 *
 * @see ~/hooks/use-simple-transaction.ts
 * @see ~/hooks/use-tx-watcher.ts
 */

"use client";

import React, { useMemo, useCallback } from "react";
import { computeSltHashDefinite } from "~/lib/utils/slt-hash";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSimpleTransaction } from "~/hooks/use-simple-transaction";
import { useTxWatcher } from "~/hooks/use-tx-watcher";
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
import { TokenIcon, TransactionIcon, ModuleIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import type { CourseModuleListResponse } from "~/types/generated";

export interface MintModuleTokensProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Array of modules with SLT data from the database API
   * Should come from the `/courses/{courseNftPolicyId}/course-modules` endpoint
   */
  courseModules: CourseModuleListResponse;

  /**
   * Callback fired when minting is successful
   */
  onSuccess?: () => void | Promise<void>;

  /**
   * Callback fired when minting fails
   */
  onError?: (error: Error) => void;
}

/**
 * MintModuleTokens - Teacher UI for minting module tokens (V2)
 *
 * V2 uses batch operations - multiple modules can be minted in a single transaction.
 * Module token names are computed as Blake2b-256 hashes of the SLT content.
 *
 * @example
 * ```tsx
 * const courseModules: CourseModuleListResponse = await fetch(
 *   `${API_URL}/courses/${courseNftPolicyId}/course-modules`
 * ).then(r => r.json());
 *
 * <MintModuleTokens
 *   courseNftPolicyId="abc123..."
 *   courseModules={courseModules}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function MintModuleTokens({
  courseNftPolicyId,
  courseModules,
  onSuccess,
  onError,
}: MintModuleTokensProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useSimpleTransaction();

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          console.log("[MintModuleTokens] TX confirmed and DB updated by gateway");

          const moduleCount = courseModules.length;
          toast.success("Module Tokens Minted!", {
            description: `${moduleCount} module${moduleCount > 1 ? "s" : ""} minted successfully`,
          });

          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Minting Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
          onError?.(new Error(status.last_error ?? "Unknown error"));
        }
      },
    }
  );

  // Helper to get sorted SLT texts (by module_index for consistent ordering)
  const getSortedSltTexts = useCallback((slts: typeof courseModules[0]["slts"]) => {
    if (!slts || slts.length === 0) return [];
    // Sort by module_index to ensure consistent hash computation
    return [...slts]
      .sort((a, b) => a.module_index - b.module_index)
      .map((slt) => slt.slt_text);
  }, []);

  // Compute module hashes for display
  const moduleHashes = useMemo(() => {
    return courseModules.map((courseModule) => {
      try {
        const sltTexts = getSortedSltTexts(courseModule.slts);
        return {
          moduleCode: courseModule.module_code,
          hash: computeSltHashDefinite(sltTexts),
          sltCount: sltTexts.length,
        };
      } catch {
        return {
          moduleCode: courseModule.module_code,
          hash: null,
          sltCount: 0,
        };
      }
    });
  }, [courseModules, getSortedSltTexts]);

  const ui = TRANSACTION_UI.COURSE_TEACHER_MODULES_MANAGE;

  const handleMintModules = async () => {
    if (!user?.accessTokenAlias || courseModules.length === 0) {
      return;
    }

    // Prepare module data for both API request and side effects
    const modulesWithData = courseModules
      .filter((cm) => cm.slts && cm.slts.length > 0)
      .map((courseModule) => {
        const slts = getSortedSltTexts(courseModule.slts);
        const hash = computeSltHashDefinite(slts);
        return {
          moduleCode: courseModule.module_code,
          slts,
          hash,
        };
      });

    const modules_to_mint = modulesWithData.map((m) => ({
      slts: m.slts,
      allowed_student_state_ids: [] as string[],
      prereq_slt_hashes: [] as string[],
    }));

    await execute({
      txType: "COURSE_TEACHER_MODULES_MANAGE",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseNftPolicyId,
        modules_to_add: modules_to_mint,
        modules_to_update: [],
        modules_to_remove: [],
      },
      onSuccess: async (txResult) => {
        console.log("[MintModuleTokens] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[MintModuleTokens] Error:", txError);
        onError?.(txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasModules = courseModules.length > 0;
  const canMint = hasAccessToken && hasModules;

  // Check if any modules are missing SLTs
  const modulesWithoutSlts = courseModules.filter(
    (courseModule) => !courseModule.slts || courseModule.slts.length === 0
  );

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <TokenIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Create on-chain credentials for your course modules
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Modules to Mint */}
        {hasModules && (
          <div className="space-y-3">
            <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide">
              Modules to Mint ({courseModules.length})
            </AndamioText>
            <div className="space-y-3">
              {moduleHashes.map(({ moduleCode, hash, sltCount }) => (
                <div
                  key={moduleCode}
                  className="rounded-md border p-3 bg-muted/30 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{moduleCode}</span>
                    <AndamioBadge variant="outline" className="text-xs">
                      {sltCount} SLT{sltCount !== 1 ? "s" : ""}
                    </AndamioBadge>
                  </div>
                  {hash && (
                    <div className="space-y-1">
                      <AndamioText variant="small" className="text-[10px] text-muted-foreground">
                        Token Name (SLT Hash)
                      </AndamioText>
                      <code className="block text-xs font-mono text-foreground bg-background/50 px-2 py-1 rounded border break-all">
                        {hash}
                      </code>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning for modules without SLTs */}
        {modulesWithoutSlts.length > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <div className="text-xs">
              <AndamioText variant="small" className="font-medium text-warning-foreground">Some modules have no SLTs</AndamioText>
              <AndamioText variant="small">
                {modulesWithoutSlts.map((m) => m.module_code).join(", ")} need Student Learning Targets before minting.
              </AndamioText>
            </div>
          </div>
        )}

        {/* Hash Explanation */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <TransactionIcon className="h-4 w-4 text-primary" />
            <AndamioText className="font-medium">Token Name = On-Chain Identifier</AndamioText>
          </div>
          <AndamioText variant="small" className="text-xs leading-relaxed">
            Each module&apos;s token name is a Blake2b-256 hash of its SLT content. This hash becomes the unique on-chain identifier for the credential — if the learning outcomes change, the hash changes, creating tamper-evident proof of what was taught.
          </AndamioText>
        </div>

        {/* Transaction Status - Only show during processing */}
        {state !== "idle" && !txConfirmed && (
          <TransactionStatus
            state={state}
            result={result}
            error={error?.message ?? null}
            onRetry={() => reset()}
            messages={{
              success: "Transaction submitted! Waiting for confirmation...",
            }}
          />
        )}

        {/* Gateway Confirmation Status */}
        {state === "success" && result?.requiresDBUpdate && !txConfirmed && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <LoadingIcon className="h-5 w-5 animate-spin text-info" />
              <div className="flex-1">
                <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Processing database updates"}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {txConfirmed && (
          <div className="rounded-lg border border-success/30 bg-success/5 p-4">
            <div className="flex items-center gap-3">
              <SuccessIcon className="h-5 w-5 text-success" />
              <div className="flex-1">
                <AndamioText className="font-medium text-success">
                  Module Tokens Minted!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {courseModules.length} module{courseModules.length > 1 ? "s" : ""} minted successfully.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Mint Button */}
        {state !== "success" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleMintModules}
            disabled={!canMint || modulesWithoutSlts.length > 0}
            stateText={{
              idle: `Mint ${courseModules.length} Module${courseModules.length > 1 ? "s" : ""}`,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Minting on Blockchain...",
            }}
            className="w-full"
          />
        )}

        {/* Requirement check */}
        {!hasAccessToken && (
          <AndamioText variant="small" className="text-xs text-center">
            You need an access token to mint module tokens.
          </AndamioText>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
