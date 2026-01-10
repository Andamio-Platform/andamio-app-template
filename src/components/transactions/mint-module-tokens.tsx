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

import React, { useMemo } from "react";
import { COURSE_TEACHER_MODULES_MANAGE, computeSltHash } from "@andamio/transactions";
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

  // Compute module hashes for display
  const moduleHashes = useMemo(() => {
    return courseModules.map((courseModule) => {
      try {
        const sltTexts = courseModule.slts?.map((slt) => slt.slt_text) ?? [];
        return {
          moduleCode: courseModule.module_code,
          hash: computeSltHash(sltTexts),
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
  }, [courseModules]);

  const handleMintModules = async () => {
    if (!user?.accessTokenAlias || courseModules.length === 0) {
      return;
    }

    // Format modules for the V2 API - each module needs slts and access control fields
    const modules_to_mint = courseModules
      .filter((cm) => cm.slts && cm.slts.length > 0)
      .map((courseModule) => ({
        slts: courseModule.slts?.map((slt) => slt.slt_text) ?? [],
        allowed_course_state_ids: [] as string[], // Minting policy IDs for course states that can access this module
        prereq_slt_hashes: [] as string[], // Prerequisite SLT hashes (64 char hex)
      }));

    await execute({
      definition: COURSE_TEACHER_MODULES_MANAGE,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        course_id: courseNftPolicyId,
        modules_to_mint,
        modules_to_update: [],
        modules_to_burn: [],
      },
      onSuccess: async (txResult) => {
        console.log("[MintModuleTokens] Success!", txResult);

        const moduleCount = courseModules.length;
        toast.success("Modules Minted!", {
          description: `${moduleCount} module${moduleCount > 1 ? "s" : ""} minted on-chain`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

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
          <div className="space-y-2">
            <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide">
              Modules to Mint ({courseModules.length})
            </AndamioText>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {moduleHashes.map(({ moduleCode, hash, sltCount }) => (
                <div
                  key={moduleCode}
                  className="flex items-center justify-between rounded-md border p-2 bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <ModuleIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{moduleCode}</span>
                    <AndamioBadge variant="outline" className="text-xs">
                      {sltCount} SLT{sltCount !== 1 ? "s" : ""}
                    </AndamioBadge>
                  </div>
                  {hash && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TransactionIcon className="h-3 w-3" />
                      <code className="font-mono">{hash.slice(0, 8)}...</code>
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
            <AndamioText className="font-medium">Tamper-Evident Design</AndamioText>
          </div>
          <AndamioText variant="small" className="text-xs">
            Token names are hashes of SLT content, cryptographically proving the learning outcomes.
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
