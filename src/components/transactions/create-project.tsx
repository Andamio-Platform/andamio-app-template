/**
 * CreateProject Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for creating a new Andamio Project on-chain.
 * Uses INSTANCE_PROJECT_CREATE transaction with gateway auto-confirmation.
 *
 * ## TX Lifecycle
 *
 * 1. User enters title, managers, deposit, and prerequisites
 * 2. `useTransaction` builds, signs, submits, and registers TX
 * 3. `useTxWatcher` polls gateway for confirmation status
 * 4. When status is "updated", gateway has completed DB updates
 * 5. UI shows success and calls onSuccess callback
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-watcher.ts
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useTransaction } from "~/hooks/use-transaction";
import { useTxWatcher } from "~/hooks/use-tx-watcher";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { CoursePrereqsSelector, type CoursePrereq } from "./course-prereqs-selector";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ProjectIcon, ManagerIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface CreateProjectProps {
  /**
   * Callback fired when project is successfully created
   * @param projectNftPolicyId - The project NFT policy ID returned by the API
   */
  onSuccess?: (projectNftPolicyId: string) => void | Promise<void>;
}

/**
 * CreateProject - Full UI for creating a project on-chain (V2)
 *
 * Uses useTransaction with gateway auto-confirmation.
 *
 * @example
 * ```tsx
 * <CreateProject onSuccess={(policyId) => router.push(`/studio/project/${policyId}`)} />
 * ```
 */
export function CreateProject({ onSuccess }: CreateProjectProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useTransaction();

  const [initiatorData, setInitiatorData] = useState<{ used_addresses: string[]; change_address: string } | null>(null);
  const [title, setTitle] = useState("");
  const [additionalManagers, setAdditionalManagers] = useState("");
  const [depositLovelace, setDepositLovelace] = useState("5000000"); // 5 ADA default
  const [coursePrereqs, setCoursePrereqs] = useState<CoursePrereq[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          console.log("[CreateProject] TX confirmed and DB updated by gateway");

          toast.success("Project Created!", {
            description: `"${title.trim()}" is now live on-chain`,
          });

          // Call parent callback with the project ID
          if (projectId) {
            void onSuccess?.(projectId);
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Project Creation Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // Fetch wallet addresses when wallet is connected
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!wallet || !connected) {
        setInitiatorData(null);
        return;
      }

      try {
        const usedAddresses = await wallet.getUsedAddresses();
        const changeAddress = await wallet.getChangeAddress();
        setInitiatorData({
          used_addresses: usedAddresses,
          change_address: changeAddress,
        });
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
        setInitiatorData(null);
      }
    };

    void fetchWalletData();
  }, [wallet, connected]);

  const ui = TRANSACTION_UI.INSTANCE_PROJECT_CREATE;

  const handleCreateProject = async () => {
    if (!user?.accessTokenAlias || !initiatorData || !title.trim()) {
      return;
    }

    // Parse additional managers (comma-separated)
    const managersList = additionalManagers
      .split(",")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    // Parse deposit
    const lovelaceAmount = parseInt(depositLovelace, 10) || 5000000;

    await execute({
      txType: "INSTANCE_PROJECT_CREATE",
      params: {
        alias: user.accessTokenAlias,
        managers: managersList.length > 0 ? managersList : [user.accessTokenAlias],
        course_prereqs: coursePrereqs,
        initiator_data: initiatorData,
      },
      metadata: {
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        console.log("[CreateProject] TX submitted successfully!", txResult);

        // Extract project_id from the API response for later use
        const extractedProjectId = txResult.apiResponse?.project_id as string | undefined;
        if (extractedProjectId) {
          setProjectId(extractedProjectId);
        }
      },
      onError: (txError) => {
        console.error("[CreateProject] Error:", txError);
      },
    });
  };

  // Check requirements
  const hasAccessToken = !!user?.accessTokenAlias;
  const hasInitiatorData = !!initiatorData;
  const hasTitle = title.trim().length > 0;
  const canCreate = hasAccessToken && hasInitiatorData && hasTitle;

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <ProjectIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Mint a Project NFT to start managing contributors on-chain
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Requirements Check */}
        {!hasAccessToken && (
          <AndamioAlert variant="destructive">
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertDescription>
              You need an Access Token to create a project. Mint one first!
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {hasAccessToken && !hasInitiatorData && (
          <AndamioAlert>
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertDescription>
              Loading wallet data... Please ensure your wallet is connected.
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Project Creator Info */}
        {hasAccessToken && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ManagerIcon className="h-4 w-4" />
            <span>Creating as</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {user.accessTokenAlias}
            </code>
          </div>
        )}

        {/* Project Title Input */}
        {hasAccessToken && hasInitiatorData && (
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">
              Project Title <span className="text-destructive">*</span>
            </AndamioLabel>
            <AndamioInput
              id="title"
              type="text"
              placeholder="Cardano Developer Bounty Program"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={state !== "idle" && state !== "error"}
              maxLength={200}
            />
            <AndamioText variant="small" className="text-xs">
              Give your project a descriptive title. You can update this later.
            </AndamioText>
          </div>
        )}

        {/* Additional Managers Input */}
        {hasAccessToken && hasInitiatorData && (
          <div className="space-y-2">
            <AndamioLabel htmlFor="managers">Additional Managers (Optional)</AndamioLabel>
            <AndamioInput
              id="managers"
              type="text"
              placeholder="manager1, manager2"
              value={additionalManagers}
              onChange={(e) => setAdditionalManagers(e.target.value)}
              disabled={state !== "idle" && state !== "error"}
            />
            <AndamioText variant="small" className="text-xs">
              Enter access token aliases of additional managers, separated by commas.
            </AndamioText>
          </div>
        )}

        {/* Deposit Amount Input */}
        {hasAccessToken && hasInitiatorData && (
          <div className="space-y-2">
            <AndamioLabel htmlFor="deposit">Contributor Deposit (Lovelace)</AndamioLabel>
            <AndamioInput
              id="deposit"
              type="number"
              placeholder="5000000"
              value={depositLovelace}
              onChange={(e) => setDepositLovelace(e.target.value)}
              disabled={state !== "idle" && state !== "error"}
              min={1000000}
            />
            <AndamioText variant="small" className="text-xs">
              Required deposit for contributors (1 ADA = 1,000,000 lovelace).
            </AndamioText>
          </div>
        )}

        {/* Course Prerequisites Selector */}
        {hasAccessToken && hasInitiatorData && (
          <CoursePrereqsSelector
            value={coursePrereqs}
            onChange={setCoursePrereqs}
            disabled={state !== "idle" && state !== "error"}
          />
        )}

        {/* Transaction Status - Only show during processing, not for final success */}
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
                  Project Created!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  &quot;{title}&quot; is now live on-chain.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Create Button - Hide after success */}
        {state !== "success" && !txConfirmed && canCreate && (
          <TransactionButton
            txState={state}
            onClick={handleCreateProject}
            disabled={!canCreate}
            stateText={{
              idle: ui.buttonText,
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Creating on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
