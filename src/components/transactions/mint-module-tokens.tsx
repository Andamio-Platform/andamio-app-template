/**
 * MintModuleTokens Transaction Component (V2)
 *
 * Teacher UI for minting/updating course module tokens.
 * Uses COURSE_TEACHER_MODULES_MANAGE transaction definition from @andamio/transactions.
 * V2 uses batch operations for multiple modules in a single transaction.
 *
 * Module token names are Blake2b-256 hashes of the SLT content,
 * creating tamper-evident on-chain credentials.
 *
 * @see packages/andamio-transactions/src/definitions/v2/course/teacher/modules-manage.ts
 */

"use client";

import React, { useMemo, useCallback } from "react";
import { COURSE_TEACHER_MODULES_MANAGE, computeSltHashDefinite } from "@andamio/transactions";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useAndamioTransaction } from "~/hooks/use-andamio-transaction";
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
import { TokenIcon, TransactionIcon, ModuleIcon, AlertIcon } from "~/components/icons";
import { toast } from "sonner";
import type { CourseModuleListResponse } from "@andamio/db-api-types";

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
  const { state, result, error, execute, reset } = useAndamioTransaction();

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

    const moduleCodes = modulesWithData.map((m) => m.moduleCode);
    const modules_to_mint = modulesWithData.map((m) => ({
      slts: m.slts,
      allowed_course_state_ids: [] as string[],
      prereq_slt_hashes: [] as string[],
    }));

    const txRequest = {
      alias: user.accessTokenAlias,
      course_id: courseNftPolicyId,
      modules_to_mint,
      modules_to_update: [],
      modules_to_burn: [],
    };

    await execute({
      definition: COURSE_TEACHER_MODULES_MANAGE,
      params: txRequest,
      onSuccess: async (txResult) => {
        console.log("[MintModuleTokens] Success!", txResult);

        const moduleCount = moduleCodes.length;

        // Show initial success message
        toast.success("Transaction Submitted!", {
          description: `${moduleCount} module${moduleCount > 1 ? "s" : ""} minting - awaiting confirmation`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Note: PENDING_TX status is handled by transaction definition's onSubmit side effects
        // Confirmation is handled by onConfirmation side effects or external polling

        // Refresh data to show pending status
        await onSuccess?.();
      },
      onError: (txError) => {
        console.error("[MintModuleTokens] Error:", txError);
        toast.error("Minting Failed", {
          description: txError.message || "Failed to mint module tokens",
        });
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
            <AndamioCardTitle>Mint Module Tokens</AndamioCardTitle>
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

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => reset()}
            messages={{
              success: `${courseModules.length} module token${courseModules.length > 1 ? "s" : ""} minted successfully!`,
            }}
          />
        )}

        {/* Mint Button */}
        {state !== "success" && (
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
