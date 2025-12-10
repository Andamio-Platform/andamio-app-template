"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useAndamioTransaction } from "~/hooks/use-andamio-transaction";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import {
  AndamioAlert,
  AndamioAlertDescription,
  AndamioDrawer,
  AndamioDrawerClose,
  AndamioDrawerContent,
  AndamioDrawerDescription,
  AndamioDrawerFooter,
  AndamioDrawerHeader,
  AndamioDrawerTitle,
  AndamioDrawerTrigger,
} from "~/components/andamio";
import { TransactionButton } from "~/components/transactions/transaction-button";
import { TransactionStatus } from "~/components/transactions/transaction-status";
import { Plus, Sparkles, BookOpen, ExternalLink, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { v2 } from "@andamio/transactions";

/**
 * CreateCourseDialog - Elegant bottom drawer for minting a Course NFT
 *
 * The Course NFT is the foundation of your Andamio app. This component
 * guides users through the minting process with clear explanation.
 */
export function CreateCourseDialog() {
  const router = useRouter();
  const { user } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [walletData, setWalletData] = useState<{
    usedAddresses: string[];
    changeAddress: string;
  } | null>(null);

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
        setWalletData({ usedAddresses, changeAddress });
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

    await execute({
      definition: v2.COURSE_ADMIN_CREATE,
      params: {
        walletData,
        alias: user.accessTokenAlias,
        teachers: [user.accessTokenAlias],
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        const courseNftPolicyId = txResult.apiResponse?.courseId as string | undefined;

        toast.success("Course NFT Minted!", {
          description: `"${title.trim()}" is now on-chain`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () =>
                  window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Navigate to the new course
        if (courseNftPolicyId) {
          router.push(`/studio/course/${courseNftPolicyId}`);
        }

        // Close drawer and reset
        setOpen(false);
        setTitle("");
        reset();
      },
      onError: (txError) => {
        console.error("[CreateCourse] Error:", txError);
        toast.error("Minting Failed", {
          description: txError.message || "Failed to create course NFT",
        });
      },
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setTitle("");
      reset();
    }
  };

  // Requirements
  const hasAccessToken = !!user?.accessTokenAlias;
  const hasWalletData = !!walletData;
  const hasTitle = title.trim().length > 0;
  const canCreate = hasAccessToken && hasWalletData && hasTitle;

  return (
    <AndamioDrawer open={open} onOpenChange={handleOpenChange}>
      <AndamioDrawerTrigger asChild>
        <AndamioButton>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </AndamioButton>
      </AndamioDrawerTrigger>
      <AndamioDrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <AndamioDrawerHeader className="text-left">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <AndamioDrawerTitle className="text-xl">
                Mint Your Course NFT
              </AndamioDrawerTitle>
            </div>
            <AndamioDrawerDescription className="text-base leading-relaxed">
              Your Course NFT is the key to your custom app on Andamio. It
              establishes your course on the Cardano blockchain and enables you
              to manage learners, issue credentials, and build your educational
              experience.
            </AndamioDrawerDescription>
          </AndamioDrawerHeader>

          <div className="space-y-6 px-4">
            {/* Requirements Alert */}
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

            {/* Title Input */}
            {hasAccessToken && hasWalletData && state !== "success" && (
              <div className="space-y-3">
                <AndamioLabel htmlFor="course-title" className="text-base">
                  Course Title
                </AndamioLabel>
                <AndamioInput
                  id="course-title"
                  placeholder="Introduction to Cardano Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={state !== "idle" && state !== "error"}
                  className="h-12 text-base"
                  maxLength={200}
                  autoFocus
                />
                <p className="text-sm text-muted-foreground">
                  Don&apos;t worry, you can change this later. The course is
                  created on-chain once the transaction succeeds.
                </p>
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
                  success: "Your Course NFT has been minted on-chain!",
                }}
              />
            )}

            {/* Learn More Links */}
            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/30 p-4">
              <p className="text-sm font-medium text-foreground">
                Want to learn more?
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://docs.andamio.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <BookOpen className="h-4 w-4" />
                  Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://app.andamio.io/courses/andamio-101"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Sparkles className="h-4 w-4" />
                  Andamio 101 Course
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          <AndamioDrawerFooter className="flex-row gap-3 pt-6">
            <AndamioDrawerClose asChild>
              <AndamioButton
                variant="outline"
                className="flex-1"
                disabled={state !== "idle" && state !== "error" && state !== "success"}
              >
                Cancel
              </AndamioButton>
            </AndamioDrawerClose>
            {state !== "success" && (
              <TransactionButton
                txState={state}
                onClick={handleCreateCourse}
                disabled={!canCreate}
                className="flex-1"
                stateText={{
                  idle: "Mint Course NFT",
                  fetching: "Preparing...",
                  signing: "Sign in Wallet",
                  submitting: "Minting...",
                }}
              />
            )}
          </AndamioDrawerFooter>
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}
