/**
 * MintModuleTokens Transaction Component (V2)
 *
 * Teacher UI for minting/updating course module tokens.
 * V2 uses batch operations for multiple modules in a single transaction.
 *
 * Module token names are Blake2b-256 hashes of the SLT content,
 * creating tamper-evident on-chain credentials.
 */

"use client";

import React, { useMemo } from "react";
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
import { Coins, Hash, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  v2,
  computeSltHash,
} from "@andamio/transactions";
import type { ListCourseModulesOutput } from "@andamio/db-api";

export interface MintModuleTokensProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Array of modules with SLT data from the database API
   * Should come from the `/courses/{courseNftPolicyId}/course-modules` endpoint
   */
  courseModules: ListCourseModulesOutput;

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
 * const courseModules: ListCourseModulesOutput = await fetch(
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

    // Format modules for the V2 API - each module needs slts, allowedStudents_V2, prerequisiteAssignments_V2
    const modulesToMint = courseModules
      .filter((cm) => cm.slts && cm.slts.length > 0)
      .map((courseModule) => ({
        slts: courseModule.slts?.map((slt) => slt.slt_text) ?? [],
        allowedStudents_V2: [] as string[], // Empty for now - can be configured per module
        prerequisiteAssignments_V2: [] as string[], // Empty for now - can be configured per module
      }));

    await execute({
      definition: v2.COURSE_TEACHER_MODULES_MANAGE,
      params: {
        alias: user.accessTokenAlias,
        courseId: courseNftPolicyId,
        modulesToMint,
        modulesToUpdate: [],
        modulesToBurn: [],
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
            <Coins className="h-5 w-5 text-primary" />
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Modules to Mint ({courseModules.length})
            </p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {moduleHashes.map(({ moduleCode, hash, sltCount }) => (
                <div
                  key={moduleCode}
                  className="flex items-center justify-between rounded-md border p-2 bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{moduleCode}</span>
                    <AndamioBadge variant="outline" className="text-xs">
                      {sltCount} SLT{sltCount !== 1 ? "s" : ""}
                    </AndamioBadge>
                  </div>
                  {hash && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
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
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <div className="text-xs">
              <p className="font-medium text-warning-foreground">Some modules have no SLTs</p>
              <p className="text-muted-foreground">
                {modulesWithoutSlts.map((m) => m.module_code).join(", ")} need Student Learning Targets before minting.
              </p>
            </div>
          </div>
        )}

        {/* Hash Explanation */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">Tamper-Evident Design</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Token names are hashes of SLT content, cryptographically proving the learning outcomes.
          </p>
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
          <p className="text-xs text-muted-foreground text-center">
            You need an access token to mint module tokens.
          </p>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
