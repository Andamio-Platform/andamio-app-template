/**
 * EnrollInCourse Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for enrolling in a course with an initial assignment commitment.
 * In V2 protocol, enrollment requires committing to a module with evidence.
 *
 * Uses COURSE_STUDENT_ASSIGNMENT_COMMIT which handles both:
 * - First-time enrollment (mints course-state token)
 * - Initial assignment commitment (records evidence on-chain)
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-watcher.ts
 */

"use client";

import React, { useState, useMemo } from "react";
import { computeAssignmentInfoHash } from "@andamio/core/hashing";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";
import { useInvalidateStudentCourses } from "~/hooks/api";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { MintAccessTokenSimple } from "./mint-access-token-simple";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { LearnerIcon, CourseIcon, TransactionIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";
import type { JSONContent } from "@tiptap/core";

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
   * Module code for initial commitment (required in V2 for transaction)
   */
  moduleCode?: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Module SLT hash (64-char Blake2b-256 hash) - required for on-chain commitment
   * Use computeSltHashDefinite() from @andamio/transactions to compute this
   */
  sltHash?: string;

  /**
   * Initial evidence content (Tiptap JSON) - required for enrollment
   */
  evidence?: JSONContent;

  /**
   * Callback fired when enrollment is successful
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * EnrollInCourse - Transaction UI for enrolling in a course (V2)
 *
 * In V2, enrollment requires an initial module commitment with evidence.
 * This creates the course-state token AND records the first submission on-chain.
 *
 * If moduleCode, sltHash, or evidence are not provided, shows a message
 * indicating that the user needs to select a module to enroll.
 *
 * @example
 * <EnrollInCourse
 *   courseNftPolicyId="abc123..."
 *   courseTitle="Introduction to Blockchain"
 *   moduleCode="MODULE_1"
 *   moduleTitle="Getting Started"
 *   sltHash={computeSltHashDefinite(module.slts)}
 *   evidence={editorContent}
 *   onSuccess={() => router.refresh()}
 * />
 */
export function EnrollInCourse({
  courseNftPolicyId,
  courseTitle,
  moduleCode,
  moduleTitle,
  sltHash,
  evidence,
  onSuccess,
}: EnrollInCourseProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();
  const invalidateStudentCourses = useInvalidateStudentCourses();
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxWatcher(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "confirmed" || status.state === "updated") {
          console.log("[EnrollInCourse] TX confirmed and DB updated by gateway");

          // Invalidate student courses cache so dashboard updates automatically
          void invalidateStudentCourses();

          toast.success("Successfully Enrolled!", {
            description: `You're now enrolled in ${courseTitle ?? "this course"}`,
          });

          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Enrollment Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  // Check if we have valid evidence content
  const hasValidEvidence = evidence && Object.keys(evidence).length > 0;

  // Check if we have all required data for enrollment
  const hasRequiredData = Boolean(moduleCode && sltHash && hasValidEvidence);

  // Compute evidence hash for display
  const computedHash = useMemo(() => {
    if (!hasValidEvidence || !evidence) return null;
    try {
      return computeAssignmentInfoHash(evidence);
    } catch {
      return null;
    }
  }, [evidence, hasValidEvidence]);

  const ui = TRANSACTION_UI.COURSE_STUDENT_ASSIGNMENT_COMMIT;

  const handleEnroll = async () => {
    if (!user?.accessTokenAlias || !hasRequiredData || !evidence || !moduleCode || !sltHash) {
      return;
    }

    // Compute evidence hash
    const hash = computeAssignmentInfoHash(evidence);
    setEvidenceHash(hash);

    await execute({
      txType: "COURSE_STUDENT_ASSIGNMENT_COMMIT",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseNftPolicyId,
        slt_hash: sltHash,
        assignment_info: hash,
      },
      onSuccess: async (txResult) => {
        console.log("[EnrollInCourse] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[EnrollInCourse] Error:", txError);
      },
    });
  };

  // Not authenticated - show connect prompt
  if (!isAuthenticated || !user) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <LearnerIcon className="h-5 w-5" />
            <AndamioCardTitle>Enroll in Course</AndamioCardTitle>
          </div>
          <AndamioCardDescription>
            Connect your wallet to enroll in this course
          </AndamioCardDescription>
        </AndamioCardHeader>
      </AndamioCard>
    );
  }

  // No access token - show mint prompt
  if (!user.accessTokenAlias) {
    return (
      <div className="space-y-4">
        <AndamioCard>
          <AndamioCardHeader>
            <div className="flex items-center gap-2">
              <LearnerIcon className="h-5 w-5" />
              <AndamioCardTitle>Enroll in Course</AndamioCardTitle>
            </div>
            <AndamioCardDescription>
              You need an access token to enroll in courses. Please mint one first.
            </AndamioCardDescription>
          </AndamioCardHeader>
        </AndamioCard>
        <MintAccessTokenSimple />
      </div>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <LearnerIcon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              {courseTitle
                ? `Begin your learning journey in ${courseTitle}`
                : "Mint your course state to begin learning"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {hasRequiredData ? (
          <>
            {/* Initial Commitment Info */}
            <div className="flex flex-wrap items-center gap-2">
              <AndamioBadge variant="secondary" className="text-xs">
                <CourseIcon className="h-3 w-3 mr-1" />
                Starting with: {moduleTitle ?? moduleCode}
              </AndamioBadge>
            </div>

            {/* What Happens */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <AndamioText className="font-medium">What happens:</AndamioText>
              <AndamioText variant="small" className="text-xs">
                A course state token is minted to your wallet and your first submission is recorded on-chain.
              </AndamioText>
              {computedHash && (
                <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
                  <TransactionIcon className="h-3 w-3 shrink-0" />
                  <code className="font-mono text-primary">{computedHash.slice(0, 24)}...</code>
                </div>
              )}
            </div>

            {/* Transaction Status - Only show during processing */}
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
                  <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
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
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <AndamioText className="font-medium text-primary">
                      Successfully Enrolled!
                    </AndamioText>
                    <AndamioText variant="small" className="text-xs">
                      {evidenceHash
                        ? `Your submission hash: ${evidenceHash.slice(0, 16)}...`
                        : `You are now enrolled in ${courseTitle ?? "this course"}`}
                    </AndamioText>
                  </div>
                </div>
              </div>
            )}

            {/* Enroll Button */}
            {state !== "success" && !txConfirmed && (
              <TransactionButton
                txState={state}
                onClick={handleEnroll}
                stateText={{
                  idle: ui.buttonText,
                  fetching: "Preparing Transaction...",
                  signing: "Sign in Wallet",
                  submitting: "Enrolling on Blockchain...",
                }}
                className="w-full"
              />
            )}
          </>
        ) : (
          /* Missing Data - Show guidance */
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <AndamioText className="font-medium">Select a Module to Begin</AndamioText>
            <AndamioText variant="small" className="text-xs">
              To enroll in this course, select a module and provide your initial evidence submission.
              This creates your course state token and records your first assignment on-chain.
            </AndamioText>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
