/**
 * AndamioTransaction Component
 *
 * Generic transaction component that works with any AndamioTransactionDefinition.
 * Automatically renders UI metadata and handles the transaction flow.
 *
 * This component is the key bridge between @andamio/transactions definitions
 * and the T3 App UX.
 */

"use client";

import React from "react";
import type { AndamioTransactionDefinition } from "@andamio/transactions";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useTransaction } from "~/hooks/use-transaction";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";

export interface AndamioTransactionProps<TInput = Record<string, unknown>> {
  /**
   * Transaction definition from @andamio/transactions
   */
  definition: AndamioTransactionDefinition;

  /**
   * Input data for building the transaction
   * Should match the definition's inputSchema
   */
  inputs: TInput;

  /**
   * Optional custom title (overrides definition.ui.title)
   */
  title?: string;

  /**
   * Optional custom description (overrides definition.ui.description)
   */
  description?: string | string[];

  /**
   * Optional icon to display in card header
   */
  icon?: React.ReactNode;

  /**
   * Whether to show the card wrapper
   * Default: true
   */
  showCard?: boolean;

  /**
   * Callback fired when transaction is successful
   */
  onSuccess?: (result: { txHash?: string; blockchainExplorerUrl?: string }) => void | Promise<void>;

  /**
   * Callback fired when transaction fails
   */
  onError?: (error: Error) => void;

  /**
   * Require wallet connection (show message if not connected)
   * Default: true
   */
  requireAuth?: boolean;

  /**
   * Additional requirements check (e.g., access token, specific role)
   */
  requirements?: {
    check: boolean;
    failureMessage: string;
    failureAction?: React.ReactNode;
  };
}

/**
 * AndamioTransaction - Generic transaction component
 *
 * @example
 * ```tsx
 * import { MINT_MODULE_TOKENS } from "@andamio/transactions";
 *
 * <AndamioTransaction
 *   definition={MINT_MODULE_TOKENS}
 *   inputs={{
 *     userAccessTokenUnit: "abc123...",
 *     courseNftPolicyId: "policy123...",
 *     moduleInfos: JSON.stringify([{ moduleCode: "M1", moduleTitle: "Intro" }])
 *   }}
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function AndamioTransaction<TInput = Record<string, unknown>>({
  definition,
  inputs,
  title,
  description,
  icon,
  showCard = true,
  onSuccess,
  onError,
  requireAuth = true,
  requirements,
}: AndamioTransactionProps<TInput>) {
  const { isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const handleExecute = async () => {
    // Check requirements first
    if (requirements && !requirements.check) {
      toast.error("Requirements Not Met", {
        description: requirements.failureMessage,
      });
      return;
    }

    // Validate inputs when user attempts execution (not on render)
    let validatedInputs: Record<string, string>;
    try {
      validatedInputs = definition.buildTxConfig.inputSchema.parse(inputs) as Record<string, string>;
    } catch (err) {
      console.error("[AndamioTransaction] Input validation failed:", err);
      toast.error("Invalid Inputs", {
        description: "The transaction inputs are not valid. Please check all required fields.",
      });
      return;
    }

    await execute({
      endpoint: definition.buildTxConfig.builder.endpoint!,
      method: "GET", // NBA endpoints use GET with query params
      params: validatedInputs,
      onSuccess: async (txResult) => {
        console.log(`[${definition.txType}] Success!`, txResult);

        // Show success toast
        toast.success(definition.ui.successInfo, {
          description: definition.ui.title,
          action:
            txResult.txHash && txResult.blockchainExplorerUrl
              ? {
                  label: "View Transaction",
                  onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
                }
              : undefined,
        });

        // Call parent callback
        await onSuccess?.(txResult);
      },
      onError: (txError) => {
        console.error(`[${definition.txType}] Error:`, txError);

        // Show error toast
        toast.error("Transaction Failed", {
          description: txError.message || `Failed to execute ${definition.ui.title}`,
        });

        // Call parent callback
        onError?.(txError);
      },
    });
  };

  // Determine if we should show requirements failure
  const showRequirementsFailure = requirements && !requirements.check;

  // Determine title and description
  const displayTitle = title ?? definition.ui.title;
  const displayDescription = Array.isArray(description)
    ? description
    : description
      ? [description]
      : definition.ui.description;

  // Render content
  const content = (
    <>
      {/* Transaction Status - Show when not idle */}
      {state !== "idle" && (
        <TransactionStatus
          state={state}
          result={result}
          error={error}
          onRetry={() => {
            reset();
          }}
          messages={{
            success: definition.ui.successInfo,
          }}
        />
      )}

      {/* Transaction Button - Hide after success */}
      {state !== "success" && (
        <div className="space-y-3">
          <TransactionButton
            txState={state}
            onClick={handleExecute}
            disabled={showRequirementsFailure}
            stateText={{
              idle: definition.ui.buttonText,
            }}
            className="w-full"
          />

          {/* Documentation Link */}
          {state === "idle" && definition.ui.footerLink && (
            <div className="flex justify-center">
              <AndamioButton
                variant="link"
                size="sm"
                onClick={() => window.open(definition.ui.footerLink, "_blank")}
                rightIcon={<ExternalLink className="h-3 w-3" />}
              >
                {definition.ui.footerLinkText ?? "Documentation"}
              </AndamioButton>
            </div>
          )}
        </div>
      )}

      {/* Cost Estimation - Show when idle */}
      {state === "idle" && definition.buildTxConfig.estimatedCost && (
        <div className="rounded-md border border-muted bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            <strong>Estimated Cost:</strong>{" "}
            {(definition.buildTxConfig.estimatedCost.txFee / 1_000_000).toFixed(2)} ADA
            {definition.buildTxConfig.estimatedCost.minDeposit &&
              ` + ${(definition.buildTxConfig.estimatedCost.minDeposit / 1_000_000).toFixed(2)} ADA deposit`}
          </p>
        </div>
      )}
    </>
  );

  // Handle auth requirements
  if (requireAuth && !isAuthenticated) {
    if (!showCard) return null;
    return (
      <AndamioCard>
        <AndamioCardHeader>
          {icon && <div className="mb-2">{icon}</div>}
          <AndamioCardTitle>{displayTitle}</AndamioCardTitle>
          <AndamioCardDescription>Connect your wallet to continue</AndamioCardDescription>
        </AndamioCardHeader>
      </AndamioCard>
    );
  }

  // Handle custom requirements
  if (showRequirementsFailure) {
    if (!showCard) return null;
    return (
      <AndamioCard>
        <AndamioCardHeader>
          {icon && <div className="mb-2">{icon}</div>}
          <AndamioCardTitle>{displayTitle}</AndamioCardTitle>
          <AndamioCardDescription>{requirements.failureMessage}</AndamioCardDescription>
        </AndamioCardHeader>
        {requirements.failureAction && (
          <AndamioCardContent>{requirements.failureAction}</AndamioCardContent>
        )}
      </AndamioCard>
    );
  }

  // Render with or without card
  if (!showCard) {
    return <div className="space-y-4">{content}</div>;
  }

  return (
    <AndamioCard>
      <AndamioCardHeader>
        {icon && <div className="mb-2">{icon}</div>}
        <AndamioCardTitle>{displayTitle}</AndamioCardTitle>
        <AndamioCardDescription>
          {displayDescription.map((desc, idx) => (
            <p key={idx} className={idx > 0 ? "mt-2" : ""}>
              {desc}
            </p>
          ))}
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">{content}</AndamioCardContent>
    </AndamioCard>
  );
}
