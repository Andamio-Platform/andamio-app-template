/**
 * ManagersManage Transaction Component (V2)
 *
 * UI for adding or removing managers from a project.
 * Uses PROJECT_OWNER_MANAGERS_MANAGE transaction definition - purely on-chain, no side effects.
 *
 * @see packages/andamio-transactions/src/definitions/v2/project/owner/managers-manage.ts
 */

"use client";

import React, { useState } from "react";
import { PROJECT_OWNER_MANAGERS_MANAGE } from "@andamio/transactions";
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
import { ManagerIcon, AddIcon, DeleteIcon, AlertIcon } from "~/components/icons";
import { toast } from "sonner";

export interface ManagersManageProps {
  /**
   * Project NFT Policy ID
   */
  projectNftPolicyId: string;

  /**
   * Current managers (for display)
   */
  currentManagers?: string[];

  /**
   * Callback fired when managers are successfully updated
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * ManagersManage - UI for adding/removing managers from a project (V2)
 *
 * @example
 * ```tsx
 * <ManagersManage
 *   projectNftPolicyId="abc123..."
 *   currentManagers={["alice", "bob"]}
 *   onSuccess={() => refetchProject()}
 * />
 * ```
 */
export function ManagersManage({
  projectNftPolicyId,
  currentManagers = [],
  onSuccess,
}: ManagersManageProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [managerInput, setManagerInput] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");

  const handleUpdateManagers = async () => {
    if (!user?.accessTokenAlias || !managerInput.trim()) {
      return;
    }

    // Parse manager aliases (comma-separated)
    const managerAliases = managerInput
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    if (managerAliases.length === 0) {
      toast.error("No managers specified");
      return;
    }

    // Build params based on action - API uses separate arrays for add/remove
    const managers_to_add = action === "add" ? managerAliases : [];
    const managers_to_remove = action === "remove" ? managerAliases : [];

    await execute({
      definition: PROJECT_OWNER_MANAGERS_MANAGE,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        managers_to_add,
        managers_to_remove,
      },
      onSuccess: async (txResult) => {
        console.log("[ManagersManage] Success!", txResult);

        // Show success toast
        const actionText = action === "add" ? "added to" : "removed from";
        toast.success("Managers Updated!", {
          description: `${managerAliases.join(", ")} ${actionText} project`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Clear input
        setManagerInput("");

        // Call callback
        await onSuccess?.();
      },
      onError: (txError) => {
        console.error("[ManagersManage] Error:", txError);
        toast.error("Update Failed", {
          description: txError.message || "Failed to update managers",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasManagers = managerInput.trim().length > 0;
  const canSubmit = hasAccessToken && hasManagers;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ManagerIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Manage Project Managers</AndamioCardTitle>
            <AndamioCardDescription>
              Add or remove managers from this project
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Current Managers */}
        {currentManagers.length > 0 && (
          <div className="space-y-2">
            <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide">
              Current Managers
            </AndamioText>
            <div className="flex flex-wrap gap-2">
              {currentManagers.map((manager) => (
                <AndamioBadge key={manager} variant="secondary" className="text-xs font-mono">
                  {manager}
                </AndamioBadge>
              ))}
            </div>
          </div>
        )}

        {/* Action Toggle */}
        <div className="flex gap-2">
          <AndamioButton
            variant={action === "add" ? "default" : "outline"}
            size="sm"
            onClick={() => setAction("add")}
            disabled={state !== "idle" && state !== "error"}
          >
            <AddIcon className="h-4 w-4 mr-1" />
            Add
          </AndamioButton>
          <AndamioButton
            variant={action === "remove" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setAction("remove")}
            disabled={state !== "idle" && state !== "error"}
          >
            <DeleteIcon className="h-4 w-4 mr-1" />
            Remove
          </AndamioButton>
        </div>

        {/* Manager Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="managers">
            {action === "add" ? "Managers to Add" : "Managers to Remove"}
          </AndamioLabel>
          <AndamioInput
            id="managers"
            type="text"
            placeholder="alice, bob, carol"
            value={managerInput}
            onChange={(e) => setManagerInput(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
          />
          <AndamioText variant="small" className="text-xs">
            Enter access token aliases, separated by commas
          </AndamioText>
        </div>

        {/* Warning for remove */}
        {action === "remove" && (
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <AndamioText variant="small" className="text-xs text-warning-foreground">
              Removing managers will revoke their ability to manage tasks and assess submissions.
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
              success: `Managers ${action === "add" ? "added" : "removed"} successfully!`,
            }}
          />
        )}

        {/* Submit Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleUpdateManagers}
            disabled={!canSubmit}
            stateText={{
              idle: action === "add" ? "Add Managers" : "Remove Managers",
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
