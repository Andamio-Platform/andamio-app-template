/**
 * BlacklistManage Transaction Component (V2)
 *
 * UI for adding or removing contributors from a project's blacklist.
 * Uses PROJECT_OWNER_BLACKLIST_MANAGE transaction definition - purely on-chain, no side effects.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/owner/blacklist-manage.ts
 */

"use client";

import React, { useState } from "react";
import { PROJECT_OWNER_BLACKLIST_MANAGE } from "@andamio/transactions";
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { BlockIcon, AddIcon, DeleteIcon, AlertIcon } from "~/components/icons";
import { toast } from "sonner";

export interface BlacklistManageProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Current blacklisted aliases (for display)
   */
  currentBlacklist?: string[];

  /**
   * Callback fired when blacklist is successfully updated
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * BlacklistManage - UI for adding/removing contributors from project blacklist (V2)
 *
 * @example
 * ```tsx
 * <BlacklistManage
 *   projectNftPolicyId="abc123..."
 *   currentBlacklist={["badactor1", "badactor2"]}
 *   onSuccess={() => refetchProject()}
 * />
 * ```
 */
export function BlacklistManage({
  projectNftPolicyId,
  currentBlacklist = [],
  onSuccess,
}: BlacklistManageProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [aliasInput, setAliasInput] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");

  const handleUpdateBlacklist = async () => {
    if (!user?.accessTokenAlias || !aliasInput.trim()) {
      return;
    }

    // Parse aliases (comma-separated)
    const aliases = aliasInput
      .split(",")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    if (aliases.length === 0) {
      toast.error("No aliases specified");
      return;
    }

    // Build params based on action
    const aliases_to_add = action === "add" ? aliases : [];
    const aliases_to_remove = action === "remove" ? aliases : [];

    await execute({
      definition: PROJECT_OWNER_BLACKLIST_MANAGE,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        aliases_to_add,
        aliases_to_remove,
      },
      onSuccess: async (txResult) => {
        console.log("[BlacklistManage] Success!", txResult);

        // Show success toast
        const actionText = action === "add" ? "added to" : "removed from";
        toast.success("Blacklist Updated!", {
          description: `${aliases.join(", ")} ${actionText} blacklist`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Clear input
        setAliasInput("");

        // Call callback
        await onSuccess?.();
      },
      onError: (txError) => {
        console.error("[BlacklistManage] Error:", txError);
        toast.error("Update Failed", {
          description: txError.message || "Failed to update blacklist",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasAliases = aliasInput.trim().length > 0;
  const canSubmit = hasAccessToken && hasAliases;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
            <BlockIcon className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Manage Contributor Blacklist</AndamioCardTitle>
            <AndamioCardDescription>
              Block or unblock contributors from this project
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Current Blacklist */}
        {currentBlacklist.length > 0 && (
          <div className="space-y-2">
            <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide">
              Currently Blacklisted
            </AndamioText>
            <div className="flex flex-wrap gap-2">
              {currentBlacklist.map((alias) => (
                <AndamioBadge key={alias} variant="destructive" className="text-xs font-mono">
                  {alias}
                </AndamioBadge>
              ))}
            </div>
          </div>
        )}

        {/* Action Toggle */}
        <div className="flex gap-2">
          <AndamioButton
            variant={action === "add" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setAction("add")}
            disabled={state !== "idle" && state !== "error"}
          >
            <AddIcon className="h-4 w-4 mr-1" />
            Blacklist
          </AndamioButton>
          <AndamioButton
            variant={action === "remove" ? "default" : "outline"}
            size="sm"
            onClick={() => setAction("remove")}
            disabled={state !== "idle" && state !== "error"}
          >
            <DeleteIcon className="h-4 w-4 mr-1" />
            Unblock
          </AndamioButton>
        </div>

        {/* Alias Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="aliases">
            {action === "add" ? "Contributors to Blacklist" : "Contributors to Unblock"}
          </AndamioLabel>
          <AndamioInput
            id="aliases"
            type="text"
            placeholder="badactor1, badactor2"
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
          />
          <AndamioText variant="small" className="text-xs">
            Enter access token aliases, separated by commas
          </AndamioText>
        </div>

        {/* Warning for blacklist */}
        {action === "add" && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
            <AndamioText variant="small" className="text-xs text-destructive-foreground">
              Blacklisted contributors cannot enroll, commit to tasks, or receive rewards from this project.
            </AndamioText>
          </div>
        )}

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => reset()}
            messages={{
              success: `Contributors ${action === "add" ? "blacklisted" : "unblocked"} successfully!`,
            }}
          />
        )}

        {/* Submit Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleUpdateBlacklist}
            disabled={!canSubmit}
            stateText={{
              idle: action === "add" ? "Blacklist Contributors" : "Unblock Contributors",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Updating on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
