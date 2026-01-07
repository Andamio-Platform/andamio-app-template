/**
 * CreateProject Transaction Component (V2)
 *
 * UI for creating a new Andamio Project on-chain.
 * Uses INSTANCE_PROJECT_CREATE transaction definition from @andamio/transactions.
 *
 * @see packages/andamio-transactions/src/definitions/v2/instance/project-create.ts
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { INSTANCE_PROJECT_CREATE } from "@andamio/transactions";
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
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ProjectIcon, ManagerIcon, AlertIcon } from "~/components/icons";
import { toast } from "sonner";

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
 * Uses INSTANCE_PROJECT_CREATE transaction definition with automatic side effects.
 *
 * @example
 * ```tsx
 * <CreateProject onSuccess={(policyId) => router.push(`/studio/project/${policyId}`)} />
 * ```
 */
export function CreateProject({ onSuccess }: CreateProjectProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [initiatorData, setInitiatorData] = useState<{ used_addresses: string[]; change_address: string } | null>(null);
  const [title, setTitle] = useState("");
  const [additionalManagers, setAdditionalManagers] = useState("");
  const [depositLovelace, setDepositLovelace] = useState("5000000"); // 5 ADA default

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
      definition: INSTANCE_PROJECT_CREATE,
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        managers: managersList.length > 0 ? managersList : [user.accessTokenAlias],
        course_prereqs: [], // No prerequisites by default
        deposit_value: {
          lovelace: lovelaceAmount,
          native_assets: [],
        },
        initiator_data: initiatorData,
        // Side effect params
        title: title.trim(),
        // project_nft_policy_id will be extracted from API response (project_id)
      },
      onSuccess: async (txResult) => {
        console.log("[CreateProject] Success!", txResult);

        // Extract project_id from the V2 API response
        const apiResponse = txResult.apiResponse;
        const extractedProjectId = apiResponse?.project_id as string | undefined;

        // Show success toast
        toast.success("Project Created!", {
          description: `"${title.trim()}" has been created on-chain`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Call the parent's onSuccess callback with the projectNftPolicyId
        if (extractedProjectId) {
          await onSuccess?.(extractedProjectId);
        }
      },
      onError: (txError) => {
        console.error("[CreateProject] Error:", txError);

        // Show error toast
        toast.error("Project Creation Failed", {
          description: txError.message || "Failed to create project",
        });
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
            <AndamioCardTitle>Create Project On-Chain</AndamioCardTitle>
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

        {/* Transaction Status - Always show when not idle */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => {
              reset();
            }}
            messages={{
              success: "Your project has been created on-chain!",
            }}
          />
        )}

        {/* Create Button - Hide after success */}
        {state !== "success" && canCreate && (
          <TransactionButton
            txState={state}
            onClick={handleCreateProject}
            disabled={!canCreate}
            stateText={{
              idle: "Create Project",
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
