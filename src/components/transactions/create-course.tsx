/**
 * CreateCourse Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for creating a new Andamio Course on-chain.
 * Uses INSTANCE_COURSE_CREATE transaction with gateway auto-confirmation.
 *
 * ## TX Lifecycle
 *
 * 1. User enters title and optional teachers, clicks "Create Course"
 * 2. `useSimpleTransaction` builds, signs, submits, and registers TX
 * 3. `useTxWatcher` polls gateway for confirmation status
 * 4. When status is "updated", gateway has completed DB updates
 * 5. UI shows success and calls onSuccess callback
 *
 * @see ~/hooks/use-simple-transaction.ts
 * @see ~/hooks/use-tx-watcher.ts
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CourseIcon, TeacherIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface CreateCourseProps {
  /**
   * Callback fired when course is successfully created
   * @param courseNftPolicyId - The course NFT policy ID returned by the API
   */
  onSuccess?: (courseNftPolicyId: string) => void | Promise<void>;
}

/**
 * CreateCourse - Full UI for creating a course on-chain (V2)
 *
 * Uses useSimpleTransaction with gateway auto-confirmation.
 *
 * @example
 * ```tsx
 * <CreateCourse onSuccess={(policyId) => router.push(`/studio/course/${policyId}`)} />
 * ```
 */
export function CreateCourse({ onSuccess }: CreateCourseProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useSimpleTransaction();

  const [initiatorData, setInitiatorData] = useState<{ used_addresses: string[]; change_address: string } | null>(null);
  const [title, setTitle] = useState("");
  const [additionalTeachers, setAdditionalTeachers] = useState("");
  const [courseId, setCourseId] = useState<string | null>(null);

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          console.log("[CreateCourse] TX confirmed and DB updated by gateway");

          toast.success("Course Created!", {
            description: `"${title.trim()}" is now live on-chain`,
          });

          // Call parent callback with the course ID
          if (courseId) {
            void onSuccess?.(courseId);
          }
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Course Creation Failed", {
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

  const ui = TRANSACTION_UI.INSTANCE_COURSE_CREATE;

  const handleCreateCourse = async () => {
    if (!user?.accessTokenAlias || !initiatorData || !title.trim()) {
      return;
    }

    // Parse additional teachers (comma-separated)
    const teachersList = additionalTeachers
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // Always include the creator as a teacher
    const allTeachers = [user.accessTokenAlias, ...teachersList.filter((t) => t !== user.accessTokenAlias)];

    await execute({
      txType: "INSTANCE_COURSE_CREATE",
      params: {
        alias: user.accessTokenAlias,
        teachers: allTeachers,
        initiator_data: initiatorData,
      },
      metadata: {
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        console.log("[CreateCourse] TX submitted successfully!", txResult);

        // Extract course_id from the API response for later use
        const extractedCourseId = txResult.apiResponse?.course_id as string | undefined;
        if (extractedCourseId) {
          setCourseId(extractedCourseId);
        }
      },
      onError: (txError) => {
        console.error("[CreateCourse] Error:", txError);
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
            <CourseIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Mint a Course NFT to start managing learners on-chain
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
              You need an Access Token to create a course. Mint one first!
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

        {/* Course Creator Info */}
        {hasAccessToken && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TeacherIcon className="h-4 w-4" />
            <span>Creating as</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {user.accessTokenAlias}
            </code>
          </div>
        )}

        {/* Course Title Input */}
        {hasAccessToken && hasInitiatorData && (
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">
              Course Title <span className="text-destructive">*</span>
            </AndamioLabel>
            <AndamioInput
              id="title"
              type="text"
              placeholder="Introduction to Cardano Development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={state !== "idle" && state !== "error"}
              maxLength={200}
            />
            <AndamioText variant="small" className="text-xs">
              Give your course a descriptive title. You can update this later.
            </AndamioText>
          </div>
        )}

        {/* Additional Teachers Input */}
        {hasAccessToken && hasInitiatorData && (
          <div className="space-y-2">
            <AndamioLabel htmlFor="teachers">Additional Teachers (Optional)</AndamioLabel>
            <AndamioInput
              id="teachers"
              type="text"
              placeholder="teacher1, teacher2"
              value={additionalTeachers}
              onChange={(e) => setAdditionalTeachers(e.target.value)}
              disabled={state !== "idle" && state !== "error"}
            />
            <AndamioText variant="small" className="text-xs">
              Enter access token aliases of additional teachers, separated by commas. You are automatically included.
            </AndamioText>
          </div>
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
                  Course Created!
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
            onClick={handleCreateCourse}
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
