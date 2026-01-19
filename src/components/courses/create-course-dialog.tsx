"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@meshsdk/react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSimpleTransaction } from "~/hooks/use-simple-transaction";
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
import {
  ProvisioningOverlay,
  useProvisioningState,
  type ProvisioningConfig,
} from "~/components/provisioning";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AddIcon, SparkleIcon, CourseIcon, ExternalLinkIcon, AlertIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

/**
 * CreateCourseDialog - Elegant bottom drawer for minting a Course NFT
 *
 * The Course NFT is the foundation of your Andamio app. This component
 * guides users through the minting process with clear explanation.
 *
 * After transaction submission, transforms to show a provisioning overlay
 * that tracks blockchain confirmation and redirects to Course Studio.
 *
 * ## Manual Registration Workaround
 *
 * After TX confirms on-chain, calls `POST /api/v2/course/owner/course/register`
 * to register the course in the database. This is needed because the TX State
 * Machine auto-registration fails (401 - background poller runs without user JWT).
 *
 * This workaround is temporary. Once DB API team implements gateway-level auth
 * for `/course/gateway/course/register`, auto-registration will work and this
 * workaround can be removed.
 */
export function CreateCourseDialog() {
  const { user, authenticatedFetch } = useAndamioAuth();
  const { wallet, connected } = useWallet();
  const { state, result, error, execute, reset } = useSimpleTransaction();

  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [initiatorData, setInitiatorData] = useState<{
    used_addresses: string[];
    change_address: string;
  } | null>(null);

  // Provisioning state for tracking blockchain confirmation
  const [provisioningConfig, setProvisioningConfig] = useState<ProvisioningConfig | null>(null);
  // Store course metadata for manual registration after TX confirms
  const [courseMetadata, setCourseMetadata] = useState<{
    policyId: string;
    code: string;
    title: string;
  } | null>(null);

  const {
    currentStep,
    errorMessage: provisioningError,
    startProvisioning,
    navigateToEntity,
    isProvisioning,
  } = useProvisioningState(
    provisioningConfig
      ? {
          ...provisioningConfig,
          onReady: () => {
            // Wrap async registration in void to satisfy callback signature
            void (async () => {
            // Manual registration workaround: Call registration endpoint after TX confirms
            // This is needed because TX State Machine auto-registration fails (401 - no user JWT)
            if (courseMetadata) {
              try {
                console.log("[CreateCourse] Registering course with DB...", courseMetadata);
                const regResponse = await authenticatedFetch(
                  "/api/gateway/api/v2/course/owner/course/register",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      policy_id: courseMetadata.policyId,
                      code: courseMetadata.code,
                      title: courseMetadata.title,
                    }),
                  }
                );

                if (regResponse.ok) {
                  console.log("[CreateCourse] Course registered successfully!");
                  toast.success("Course Ready!", {
                    description: `"${courseMetadata.title}" is now live and registered`,
                  });
                } else {
                  const errorText = await regResponse.text();
                  console.error("[CreateCourse] Registration failed:", errorText);
                  // Still show partial success - course is on-chain even if DB registration failed
                  toast.warning("Course Created (Registration Pending)", {
                    description: `Course is on-chain but DB registration may need manual sync`,
                  });
                }
              } catch (err) {
                console.error("[CreateCourse] Registration error:", err);
                toast.warning("Course Created (Registration Pending)", {
                  description: `Course is on-chain but DB registration may need manual sync`,
                });
              }
            } else {
              // Fallback if metadata not available
              toast.success("Course Ready!", {
                description: `"${provisioningConfig.title}" has been confirmed on-chain`,
              });
            }
            })();
          },
        }
      : null
  );

  // Start provisioning when config is set
  useEffect(() => {
    if (provisioningConfig && !isProvisioning) {
      startProvisioning();
    }
  }, [provisioningConfig, isProvisioning, startProvisioning]);

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

    await execute({
      txType: "INSTANCE_COURSE_CREATE",
      params: {
        // Transaction API params (snake_case per V2 API)
        alias: user.accessTokenAlias,
        teachers: [user.accessTokenAlias],
        initiator_data: initiatorData,
      },
      // Pass metadata for gateway auto-registration (code + title required)
      metadata: {
        code: code.trim(),
        title: title.trim(),
      },
      onSuccess: async (txResult) => {
        // Extract course_id from the V2 API response
        const courseNftPolicyId = txResult.apiResponse?.course_id as string | undefined;
        const txHash = txResult.txHash;

        if (courseNftPolicyId && txHash) {
          // Store metadata for manual registration after TX confirms
          setCourseMetadata({
            policyId: courseNftPolicyId,
            code: code.trim(),
            title: title.trim(),
          });

          // Set up provisioning config to show the overlay
          setProvisioningConfig({
            entityType: "course",
            entityId: courseNftPolicyId,
            txHash,
            title: title.trim(),
            successRedirectPath: `/studio/course/${courseNftPolicyId}`,
            explorerUrl: txResult.blockchainExplorerUrl,
            autoRedirect: true,
            autoRedirectDelay: 3000, // Increased delay to allow registration to complete
          });
        } else {
          // Fallback: If no courseNftPolicyId, show success and close
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
          setOpen(false);
          setTitle("");
          reset();
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
    // Don't allow closing during provisioning
    if (isProvisioning && !newOpen) {
      return;
    }

    setOpen(newOpen);
    if (!newOpen) {
      setCode("");
      setTitle("");
      setProvisioningConfig(null);
      setCourseMetadata(null);
      reset();
    }
  };

  // Requirements
  const hasAccessToken = !!user?.accessTokenAlias;
  const hasInitiatorData = !!initiatorData;
  const hasCode = code.trim().length > 0;
  const hasTitle = title.trim().length > 0;
  const canCreate = hasAccessToken && hasInitiatorData && hasCode && hasTitle;

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
          {/* Show provisioning overlay when in provisioning state */}
          {isProvisioning && provisioningConfig ? (
            <ProvisioningOverlay
              {...provisioningConfig}
              currentStep={currentStep}
              errorMessage={provisioningError ?? undefined}
              onNavigate={navigateToEntity}
            />
          ) : (
            /* Normal form state */
            <>
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
                {hasAccessToken && hasInitiatorData && state !== "success" && (
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
                {hasAccessToken && hasInitiatorData && state !== "success" && (
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
                {state !== "idle" && (
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

                {/* Learn More Links */}
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
                      idle: ui.buttonText,
                      fetching: "Preparing...",
                      signing: "Sign in Wallet",
                      submitting: "Minting...",
                    }}
                  />
                )}
              </AndamioDrawerFooter>
            </>
          )}
        </div>
      </AndamioDrawerContent>
    </AndamioDrawer>
  );
}
