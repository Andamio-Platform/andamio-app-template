/**
 * CreateCourse Transaction Component (V2)
 *
 * UI for creating a new Andamio Course on-chain.
 * Uses the V2 transaction definition with automatic side effect handling.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
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
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { BookOpen, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { v2 } from "@andamio/transactions";

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
 * Uses COURSE_ADMIN_CREATE transaction definition with automatic side effects.
 *
 * @example
 * ```tsx
 * <CreateCourse onSuccess={(policyId) => router.push(`/studio/course/${policyId}`)} />
 * ```
 */
export function CreateCourse({ onSuccess }: CreateCourseProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [walletData, setWalletData] = useState<{ usedAddresses: string[]; changeAddress: string } | null>(null);
  const [title, setTitle] = useState("");
  const [additionalTeachers, setAdditionalTeachers] = useState("");
  const [courseNftPolicyId, setCourseNftPolicyId] = useState<string | null>(null);

  // Fetch wallet addresses when wallet is connected
  useEffect(() => {
    const fetchWalletData = async () => {
      if (!wallet || !connected) {
        setWalletData(null);
        return;
      }

      try {
        const usedAddresses = await wallet.getUsedAddresses();
        const changeAddress = await wallet.getChangeAddress();
        setWalletData({
          usedAddresses,
          changeAddress,
        });
      } catch (err) {
        console.error("Failed to fetch wallet data:", err);
        setWalletData(null);
      }
    };

    void fetchWalletData();
  }, [wallet, connected]);

  const handleCreateCourse = async () => {
    if (!user?.accessTokenAlias || !walletData || !title.trim()) {
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
      definition: v2.COURSE_ADMIN_CREATE,
      params: {
        // Transaction API params
        walletData,
        alias: user.accessTokenAlias,
        teachers: allTeachers,
        // Side effect params - courseNftPolicyId will be added after API response
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        console.log("[CreateCourse] Success!", txResult);

        // Extract courseId from the API response
        const apiResponse = result?.apiResponse;
        const extractedCourseId = apiResponse?.courseId as string | undefined;

        if (extractedCourseId) {
          setCourseNftPolicyId(extractedCourseId);
        }

        // Show success toast
        toast.success("Course Created!", {
          description: `"${title.trim()}" has been created on-chain`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Call the parent's onSuccess callback with the courseNftPolicyId
        if (extractedCourseId) {
          await onSuccess?.(extractedCourseId);
        }
      },
      onError: (txError) => {
        console.error("[CreateCourse] Error:", txError);

        // Show error toast
        toast.error("Course Creation Failed", {
          description: txError.message || "Failed to create course",
        });
      },
    });
  };

  // Check requirements
  const hasAccessToken = !!user?.accessTokenAlias;
  const hasWalletData = !!walletData;
  const hasTitle = title.trim().length > 0;
  const canCreate = hasAccessToken && hasWalletData && hasTitle;

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Create Course On-Chain</AndamioCardTitle>
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
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertDescription>
              You need an Access Token to create a course. Mint one first!
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {hasAccessToken && !hasWalletData && (
          <AndamioAlert>
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertDescription>
              Loading wallet data... Please ensure your wallet is connected.
            </AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Course Creator Info */}
        {hasAccessToken && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>Creating as</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {user.accessTokenAlias}
            </code>
          </div>
        )}

        {/* Course Title Input */}
        {hasAccessToken && hasWalletData && (
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
            <p className="text-xs text-muted-foreground">
              Give your course a descriptive title. You can update this later.
            </p>
          </div>
        )}

        {/* Additional Teachers Input */}
        {hasAccessToken && hasWalletData && (
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
            <p className="text-xs text-muted-foreground">
              Enter access token aliases of additional teachers, separated by commas. You are automatically included.
            </p>
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
              success: "Your course has been created on-chain!",
            }}
          />
        )}

        {/* Create Button - Hide after success */}
        {state !== "success" && canCreate && (
          <TransactionButton
            txState={state}
            onClick={handleCreateCourse}
            disabled={!canCreate}
            stateText={{
              idle: "Create Course",
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
