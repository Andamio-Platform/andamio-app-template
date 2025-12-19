/**
 * EnrollInCourse Transaction Component (V2)
 *
 * Elegant UI for enrolling in a course. Supports two modes:
 * 1. Simple enrollment - just create the course state token
 * 2. Combined enrollment with initial commitment (V2 recommended)
 */

"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useAndamioTransaction } from "~/hooks/use-andamio-transaction";
import { TransactionButton } from "./transaction-button";
import { TransactionStatus } from "./transaction-status";
import { MintAccessToken } from "./mint-access-token";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { GraduationCap, BookOpen, Hash } from "lucide-react";
import { toast } from "sonner";
import { v2, computeAssignmentInfoHash } from "@andamio/transactions";
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
   * Module code for initial commitment (optional for V2 combined enroll+commit)
   */
  moduleCode?: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Module SLT hash (64-char Blake2b-256 hash) - required if moduleCode is provided
   * Use computeSltHash() from @andamio/transactions to compute this
   */
  sltHash?: string;

  /**
   * Initial evidence content (Tiptap JSON) - required if moduleCode is provided
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
 * Supports two modes:
 * 1. Simple enrollment (no moduleCode/evidence): Creates course state token only
 * 2. Combined enrollment (with moduleCode + evidence): V2 recommended flow that
 *    combines enrollment with initial assignment submission
 *
 * @example
 * // Simple enrollment
 * <EnrollInCourse
 *   courseNftPolicyId="abc123..."
 *   courseTitle="Introduction to Blockchain"
 *   onSuccess={() => router.refresh()}
 * />
 *
 * @example
 * // Combined enrollment with initial commitment (V2)
 * <EnrollInCourse
 *   courseNftPolicyId="abc123..."
 *   courseTitle="Introduction to Blockchain"
 *   moduleCode="MODULE_1"
 *   moduleTitle="Getting Started"
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
  const router = useRouter();
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);

  // Determine if we're using combined mode (with initial commitment)
  // Requires moduleCode, sltHash, and evidence
  const isCombinedMode = Boolean(moduleCode && sltHash && evidence && Object.keys(evidence).length > 0);

  // Compute evidence hash for display (only in combined mode)
  const computedHash = useMemo(() => {
    if (!isCombinedMode || !evidence) return null;
    try {
      return computeAssignmentInfoHash(evidence);
    } catch {
      return null;
    }
  }, [evidence, isCombinedMode]);

  const handleEnroll = async () => {
    if (!user?.accessTokenAlias) {
      return;
    }

    if (isCombinedMode && evidence && moduleCode && sltHash) {
      // V2 Combined mode: Enrollment with initial assignment commitment
      const hash = computeAssignmentInfoHash(evidence);
      setEvidenceHash(hash);

      await execute({
        definition: v2.COURSE_STUDENT_ENROLL,
        params: {
          // Transaction API params
          alias: user.accessTokenAlias,
          courseId: courseNftPolicyId,
          commitData: {
            sltHash: sltHash,
            assignmentInfo: hash,
          },
          // Side effect params
          moduleCode,
          networkEvidence: evidence,
          networkEvidenceHash: hash,
        },
        onSuccess: async (txResult) => {
          console.log("[EnrollInCourse] Combined mode success!", txResult);

          toast.success("Successfully Enrolled!", {
            description: `You're now enrolled and your first submission is recorded`,
            action: txResult.blockchainExplorerUrl
              ? {
                  label: "View Transaction",
                  onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
                }
              : undefined,
          });

          await onSuccess?.();
        },
        onError: (txError) => {
          console.error("[EnrollInCourse] Error:", txError);
          toast.error("Enrollment Failed", {
            description: txError.message || "Failed to enroll in course",
          });
        },
      });
    } else {
      // Simple mode: Just enrollment (no initial commitment)
      await execute({
        definition: v2.COURSE_STUDENT_ENROLL,
        params: {
          // Transaction API params
          alias: user.accessTokenAlias,
          courseId: courseNftPolicyId,
          // No commitData for simple enrollment
        },
        onSuccess: async (txResult) => {
          console.log("[EnrollInCourse] Simple mode success!", txResult);

          toast.success("Successfully Enrolled!", {
            description: courseTitle
              ? `You're now enrolled in ${courseTitle}`
              : "You're now enrolled in this course",
            action: txResult.blockchainExplorerUrl
              ? {
                  label: "View Transaction",
                  onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
                }
              : undefined,
          });

          await onSuccess?.();
        },
        onError: (txError) => {
          console.error("[EnrollInCourse] Error:", txError);
          toast.error("Enrollment Failed", {
            description: txError.message || "Failed to enroll in course",
          });
        },
      });
    }
  };

  // Not authenticated - show connect prompt
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

  // No access token - show mint prompt
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
        <MintAccessToken onSuccess={() => router.refresh()} />
      </div>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Enroll in Course</AndamioCardTitle>
            <AndamioCardDescription>
              {courseTitle
                ? `Begin your learning journey in ${courseTitle}`
                : "Mint your course state to begin learning"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Initial Commitment Info (only in combined mode) */}
        {isCombinedMode && moduleCode && (
          <div className="flex flex-wrap items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              Starting with: {moduleTitle ?? moduleCode}
            </AndamioBadge>
          </div>
        )}

        {/* What Happens */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <AndamioText className="font-medium">What happens:</AndamioText>
          <AndamioText variant="small" className="text-xs">
            {isCombinedMode
              ? "A course state token is minted to your wallet and your first submission is recorded on-chain."
              : "A course state token is minted to your wallet, enabling you to submit assignments and track progress."}
          </AndamioText>
          {isCombinedMode && computedHash && (
            <div className="flex items-center gap-2 pt-2 border-t text-xs text-muted-foreground">
              <Hash className="h-3 w-3 shrink-0" />
              <code className="font-mono text-primary">{computedHash.slice(0, 24)}...</code>
            </div>
          )}
        </div>

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => reset()}
            messages={{
              success: isCombinedMode && evidenceHash
                ? `Enrolled with submission hash ${evidenceHash.slice(0, 16)}...`
                : `You are now enrolled in ${courseTitle ?? "this course"}!`,
            }}
          />
        )}

        {/* Enroll Button */}
        {state !== "success" && (
          <TransactionButton
            txState={state}
            onClick={handleEnroll}
            stateText={{
              idle: isCombinedMode ? "Enroll & Submit" : "Enroll in Course",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Enrolling on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
