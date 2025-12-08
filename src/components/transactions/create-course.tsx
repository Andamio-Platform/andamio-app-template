/**
 * CreateCourse Transaction Component
 *
 * UI for creating a new Andamio Course on-chain.
 * Creates a Course NFT that represents ownership and enables on-chain course management.
 */

"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { BookOpen, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { env } from "~/env";
import type { CreateCourseParams } from "~/types/transaction";

export interface CreateCourseProps {
  /**
   * Callback fired when course is successfully created
   */
  onSuccess?: (txHash: string) => void | Promise<void>;
}

/**
 * CreateCourse - Full UI for creating a course on-chain
 *
 * @example
 * ```tsx
 * <CreateCourse onSuccess={(txHash) => router.push(`/studio/course/${txHash}`)} />
 * ```
 */
export function CreateCourse({ onSuccess }: CreateCourseProps) {
  const { user, isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useTransaction<CreateCourseParams>();

  const [walletData, setWalletData] = useState<{ usedAddresses: string[]; changeAddress: string } | null>(null);
  const [title, setTitle] = useState("");
  const [additionalTeachers, setAdditionalTeachers] = useState("");

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
      endpoint: "/tx/v2/admin/course/create",
      method: "POST",
      params: {
        walletData,
        alias: user.accessTokenAlias,
        teachers: allTeachers,
      },
      txType: "CREATE_COURSE",
      onSuccess: async (txResult) => {
        console.log("[CreateCourse] Success!", txResult);

        // Extract courseId from the API response
        const courseId = txResult.apiResponse?.courseId as string | undefined;

        if (!courseId) {
          console.error("[CreateCourse] No courseId in API response:", txResult.apiResponse);
          toast.warning("Course Created", {
            description: "Transaction submitted but course ID not received. Please refresh.",
          });
          return;
        }

        console.log("[CreateCourse] Course ID from API:", courseId);

        // Save course to database with the title and courseId (policy ID)
        try {
          const response = await authenticatedFetch(
            `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/create-on-submit`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                title: title.trim(),
                course_nft_policy_id: courseId,
              }),
            }
          );

          if (response.ok) {
            console.log("[CreateCourse] Course saved to database with policy ID:", courseId);
          } else {
            console.error("[CreateCourse] Failed to save course to database:", await response.text());
          }
        } catch (dbError) {
          console.error("[CreateCourse] Error saving course to database:", dbError);
          // Don't fail the transaction if database update fails
        }

        // Show success toast
        toast.success("Course Created!", {
          description: `"${title.trim()}" has been created on-chain`,
          action:
            txResult.txHash && txResult.blockchainExplorerUrl
              ? {
                  label: "View Transaction",
                  onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
                }
              : undefined,
        });

        // Call the parent's onSuccess callback with the courseId (policy ID)
        if (courseId) {
          await onSuccess?.(courseId);
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
    <AndamioCard className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Create Course On-Chain</AndamioCardTitle>
            <AndamioCardDescription>
              Mint a Course NFT to manage your course on the Cardano blockchain
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
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-sm font-medium">Course Creator</p>
                <p className="text-sm text-muted-foreground">
                  You will be creating this course as{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-primary font-mono">
                    {user.accessTokenAlias}
                  </code>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <AndamioBadge variant="secondary" className="text-xs">
                    Course NFT Owner
                  </AndamioBadge>
                  <AndamioBadge variant="secondary" className="text-xs">
                    Primary Teacher
                  </AndamioBadge>
                </div>
              </div>
            </div>
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
