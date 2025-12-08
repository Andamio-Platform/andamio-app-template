/**
 * EnrollInCourse Component
 *
 * UI for enrolling in a course (minting local state NFT).
 * This transaction creates the learner's course state on-chain.
 */

"use client";

import React from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useTransaction } from "~/hooks/use-transaction";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { MintAccessToken } from "./mint-access-token";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { GraduationCap } from "lucide-react";
import { env } from "~/env";
import { buildAccessTokenUnit } from "~/lib/access-token-utils";
import { toast } from "sonner";
import type { EnrollInCourseParams } from "~/types/transaction";

export interface EnrollInCourseProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Course title for display
   */
  courseTitle?: string;

  /**
   * Callback fired when enrollment is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * EnrollInCourse - Transaction UI for enrolling in a course
 *
 * @example
 * ```tsx
 * <EnrollInCourse
 *   courseNftPolicyId="abc123..."
 *   courseTitle="Introduction to Blockchain"
 *   onSuccess={() => router.refresh()}
 * />
 * ```
 */
export function EnrollInCourse({
  courseNftPolicyId,
  courseTitle,
  onSuccess,
}: EnrollInCourseProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction<EnrollInCourseParams>();

  const handleEnroll = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    // Build the full access token unit (policy ID + hex-encoded name)
    // The alias is stored in plain text, but Andamioscan expects the full asset unit
    const userAccessToken = buildAccessTokenUnit(
      user.accessTokenAlias,
      env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID
    );

    console.log("[EnrollInCourse] User Access Token:", userAccessToken);
    console.log("[EnrollInCourse] Alias:", user.accessTokenAlias);

    await execute({
      endpoint: "/tx/student/mint-local-state",
      method: "GET",
      params: {
        user_access_token: userAccessToken,
        policy: courseNftPolicyId,
      },
      onSuccess: async (result) => {
        console.log("[EnrollInCourse] Success!", result);

        // Show success toast with transaction hash
        toast.success("Successfully Enrolled!", {
          description: courseTitle
            ? `You're now enrolled in ${courseTitle}`
            : "You're now enrolled in this course",
          action: result.txHash && result.blockchainExplorerUrl ? {
            label: "View Transaction",
            onClick: () => window.open(result.blockchainExplorerUrl, "_blank"),
          } : undefined,
        });

        // Call the parent's onSuccess callback
        await onSuccess?.();
      },
      onError: (error) => {
        console.error("[EnrollInCourse] Error:", error);

        // Show error toast
        toast.error("Enrollment Failed", {
          description: error.message || "Failed to enroll in course",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            <AndamioCardTitle>Enroll in Course</AndamioCardTitle>
          </div>
          <AndamioCardDescription>
            Connect your wallet to enroll in this course
          </AndamioCardDescription>
        </AndamioCardHeader>
      </AndamioCard>
    );
  }

  if (!user.accessTokenAlias) {
    return (
      <div className="space-y-4">
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <AndamioCardTitle>Enroll in Course</AndamioCardTitle>
            </div>
            <AndamioCardDescription>
              You need an access token to enroll in courses. Please mint one first.
            </AndamioCardDescription>
          </AndamioCardHeader>
        </AndamioCard>
        <MintAccessToken onSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          <AndamioCardTitle>Enroll in Course</AndamioCardTitle>
        </div>
        <AndamioCardDescription>
          {courseTitle
            ? `Begin your learning journey in ${courseTitle}`
            : "Mint your course local state NFT to begin"}
        </AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
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
              success: `You are now enrolled in ${courseTitle ?? "this course"}! Your course local state has been created on-chain.`,
            }}
          />
        )}

        {/* Enroll Button - Hide after success */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleEnroll}
            stateText={{
              idle: "Enroll in Course",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Enrolling on Blockchain...",
            }}
            className="w-full"
          />
        )}

        {/* Info Text */}
        {state === "idle" && (
          <div className="rounded-md border border-info bg-info/10 p-3">
            <p className="text-sm text-info">
              Enrollment mints a course local state NFT to your wallet, tracking your progress on-chain.
            </p>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
