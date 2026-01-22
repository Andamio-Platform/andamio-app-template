/**
 * ManagersManage Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for adding or removing managers from a project.
 * Uses PROJECT_OWNER_MANAGERS_MANAGE transaction with gateway auto-confirmation.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-watcher.ts
 */

"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useTransaction } from "~/hooks/use-transaction";
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ManagerIcon, AddIcon, DeleteIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

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
  const { state, result, error, execute, reset } = useTransaction();

  const [managerInput, setManagerInput] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "confirmed" || status.state === "updated") {
          console.log("[ManagersManage] TX confirmed and DB updated by gateway");

          const actionText = action === "add" ? "added to" : "removed from";
          toast.success("Managers Updated!", {
            description: `Managers ${actionText} project`,
          });

          // Clear input
          setManagerInput("");

          // Call callback
          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Update Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.PROJECT_OWNER_MANAGERS_MANAGE;

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
      txType: "PROJECT_OWNER_MANAGERS_MANAGE",
      params: {
        alias: user.accessTokenAlias,
        project_id: projectNftPolicyId,
        managers_to_add,
        managers_to_remove,
      },
      onSuccess: async (txResult) => {
        console.log("[ManagersManage] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[ManagersManage] Error:", txError);
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
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
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
                  Managers Updated!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {action === "add" ? "Managers added to" : "Managers removed from"} project.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {state !== "success" && !txConfirmed && (
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
