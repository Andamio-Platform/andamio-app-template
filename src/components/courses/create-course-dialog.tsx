"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";
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
import { TransactionButton } from "~/components/tx/transaction-button";
import { TransactionStatus } from "~/components/tx/transaction-status";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  AddIcon,
  SparkleIcon,
  CourseIcon,
  ExternalLinkIcon,
  AlertIcon,
  LoadingIcon,
} from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import { useInvalidateTeacherCourses } from "~/hooks/api/course/use-course-teacher";
import { useRegisterCourse, useUpdateCourse } from "~/hooks/api/course/use-course-owner";

/**
 * CreateCourseDialog - Elegant bottom drawer for minting a Course NFT
 *
 * The Course NFT is the foundation of your Andamio app. This component
 * guides users through the minting process with clear explanation.
 *
 * ## Flow
 * 1. User enters code + title, clicks "Mint Course NFT"
 * 2. TX builds, signs, submits → useTxWatcher polls for confirmation
 * 3. On confirmation → register course in DB → invalidate cache
 * 4. Close drawer → course appears in list → toast with "Open Course" action
 *
 * No page redirect, no wallet disconnect. Clean and elegant.
 */
export function CreateCourseDialog() {
  const router = useRouter();
  const { user } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useTransaction();
  const invalidateTeacherCourses = useInvalidateTeacherCourses();
  const registerCourse = useRegisterCourse();
  const updateCourse = useUpdateCourse();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [initiatorData, setInitiatorData] = useState<{
    used_addresses: string[];
    change_address: string;
  } | null>(null);

  // Store course metadata for registration after TX confirms
  // Use BOTH state (for UI) and ref (for callback access without stale closure)
  const [courseMetadata, setCourseMetadata] = useState<{
    policyId: string;
    code: string;
    title: string;
  } | null>(null);
  const courseMetadataRef = useRef<typeof courseMetadata>(null);

  // Keep ref in sync with state
  useEffect(() => {
    courseMetadataRef.current = courseMetadata;
  }, [courseMetadata]);

  // Track if we've already handled confirmation (prevent double-registration)
  const hasRegisteredRef = useRef(false);

  // Watch for TX confirmation
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // Wrap async handler to satisfy void return type
        void (async () => {
        // Use ref to get current metadata (avoids stale closure)
        const metadata = courseMetadataRef.current;

        // Handle both "confirmed" and "updated" states
        if (
          (status.state === "confirmed" || status.state === "updated") &&
          !hasRegisteredRef.current &&
          metadata
        ) {
          hasRegisteredRef.current = true;

          // Register course in DB using hooks
          let registrationSucceeded = false;
          try {
            console.log("[CreateCourse] Registering course with DB...", metadata);
            await registerCourse.mutateAsync({
              courseId: metadata.policyId,
              title: metadata.title,
            });
            console.log("[CreateCourse] Course registered successfully!");
            registrationSucceeded = true;
          } catch (err) {
            // Check if it's a 409 conflict (course already exists from indexer)
            const error = err as Error & { status?: number };
            if (error.status === 409) {
              console.log("[CreateCourse] Course exists, updating with title...");
              try {
                await updateCourse.mutateAsync({
                  courseId: metadata.policyId,
                  data: { title: metadata.title },
                });
                console.log("[CreateCourse] Course title updated successfully!");
                registrationSucceeded = true;
              } catch (updateErr) {
                console.error("[CreateCourse] Update failed:", updateErr);
              }
            } else {
              console.error("[CreateCourse] Registration failed:", err);
            }
          }

          // Invalidate cache so course appears in list
          await invalidateTeacherCourses();

          // Close drawer
          setOpen(false);

          // Show success toast with action to open course
          const courseTitle = metadata.title;
          const courseId = metadata.policyId;

          if (registrationSucceeded) {
            toast.success("Course Created!", {
              description: `"${courseTitle}" is now live`,
              action: {
                label: "Open Course",
                onClick: () => router.push(`/studio/course/${courseId}`),
              },
            });
          } else {
            toast.warning("Course Created (Registration Pending)", {
              description: "Course is on-chain. It may take a moment to appear.",
              action: {
                label: "View On-Chain",
                onClick: () =>
                  window.open(
                    `https://preprod.cardanoscan.io/token/${courseId}`,
                    "_blank"
                  ),
              },
            });
          }

          // Reset form state
          setCode("");
          setTitle("");
          setCourseMetadata(null);
          hasRegisteredRef.current = false;
          reset();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Course Creation Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
        })();
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
    if (!user?.accessTokenAlias || !initiatorData || !code.trim() || !title.trim()) {
      return;
    }

    // Reset registration flag for new attempt
    hasRegisteredRef.current = false;

    await execute({
      txType: "INSTANCE_COURSE_CREATE",
      params: {
        alias: user.accessTokenAlias,
        teachers: [user.accessTokenAlias],
        initiator_data: initiatorData,
      },
      metadata: {
        code: code.trim(),
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        const courseNftPolicyId = txResult.apiResponse?.course_id as string | undefined;

        if (courseNftPolicyId) {
          // Store metadata for registration after TX confirms
          setCourseMetadata({
            policyId: courseNftPolicyId,
            code: code.trim(),
            title: title.trim(),
          });
        }
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
    // Don't allow closing while TX is in progress
    if (!newOpen && state !== "idle" && state !== "error" && state !== "success") {
      return;
    }

    setOpen(newOpen);
    if (!newOpen) {
      setCode("");
      setTitle("");
      setCourseMetadata(null);
      hasRegisteredRef.current = false;
      reset();
    }
  };

  // Requirements
  const hasAccessToken = !!user?.accessTokenAlias;
  const hasInitiatorData = !!initiatorData;
  const hasCode = code.trim().length > 0;
  const hasTitle = title.trim().length > 0;
  const canCreate = hasAccessToken && hasInitiatorData && hasCode && hasTitle;

  // Determine if we're waiting for confirmation
  const isWaitingForConfirmation = state === "success" && result?.requiresDBUpdate && !txConfirmed;

  return (
    <AndamioDrawer open={open} onOpenChange={handleOpenChange}>
      <AndamioDrawerTrigger asChild>
        <AndamioButton>
          <AddIcon className="mr-2 h-4 w-4" />
          Create Course
        </AndamioButton>
      </AndamioDrawerTrigger>
      <AndamioDrawerContent>
        <div className="mx-auto w-full max-w-lg">
          <AndamioDrawerHeader className="text-left">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <SparkleIcon className="h-5 w-5 text-primary" />
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

            {/* Course Code Input */}
            {hasAccessToken && hasInitiatorData && !isWaitingForConfirmation && (
              <div className="space-y-2">
                <AndamioLabel htmlFor="course-code" className="text-base">
                  Course Code <span className="text-destructive">*</span>
                </AndamioLabel>
                <AndamioInput
                  id="course-code"
                  placeholder="CARDANO-101"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={state !== "idle" && state !== "error"}
                  className="h-12 text-base font-mono"
                  maxLength={50}
                  autoFocus
                />
                <AndamioText variant="small">
                  A unique identifier for your course (e.g., MATH-101, INTRO-BLOCKCHAIN)
                </AndamioText>
              </div>
            )}

            {/* Title Input */}
            {hasAccessToken && hasInitiatorData && !isWaitingForConfirmation && (
              <div className="space-y-2">
                <AndamioLabel htmlFor="course-title" className="text-base">
                  Course Title <span className="text-destructive">*</span>
                </AndamioLabel>
                <AndamioInput
                  id="course-title"
                  placeholder="Introduction to Cardano Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={state !== "idle" && state !== "error"}
                  className="h-12 text-base"
                  maxLength={200}
                />
                <AndamioText variant="small">
                  The display name shown to learners. You can change this later.
                </AndamioText>
              </div>
            )}

            {/* Transaction Status */}
            {state !== "idle" && !isWaitingForConfirmation && (
              <TransactionStatus
                state={state}
                result={result}
                error={error?.message ?? null}
                onRetry={() => reset()}
                messages={{
                  success: ui.successInfo,
                }}
              />
            )}

            {/* Waiting for Confirmation */}
            {isWaitingForConfirmation && (
              <div className="rounded-lg border bg-muted/30 p-6 text-center">
                <LoadingIcon className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <AndamioText className="font-medium mb-1">
                  Confirming on blockchain...
                </AndamioText>
                <AndamioText variant="small">
                  {txStatus?.state === "pending" && "Waiting for block confirmation"}
                  {txStatus?.state === "confirmed" && "Registering course..."}
                  {!txStatus && "Registering transaction..."}
                </AndamioText>
                {courseMetadata && (
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <AndamioText variant="small" className="text-muted-foreground">
                      Creating &quot;{courseMetadata.title}&quot;
                    </AndamioText>
                  </div>
                )}
              </div>
            )}

            {/* Learn More Links */}
            {!isWaitingForConfirmation && (
              <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-muted/30 p-4">
                <AndamioText variant="small" className="font-medium text-foreground">
                  Want to learn more?
                </AndamioText>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://docs.andamio.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <CourseIcon className="h-4 w-4" />
                    Documentation
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                  <a
                    href="https://app.andamio.io/courses/andamio-101"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <SparkleIcon className="h-4 w-4" />
                    Andamio 101 Course
                    <ExternalLinkIcon className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>

          <AndamioDrawerFooter className="flex-row gap-3 pt-6">
            {!isWaitingForConfirmation && (
              <>
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
                      idle: ui.buttonText,
                      fetching: "Preparing...",
                      signing: "Sign in Wallet",
                      submitting: "Minting...",
                    }}
                  />
                )}
              </>
            )}
          </AndamioDrawerFooter>
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}
