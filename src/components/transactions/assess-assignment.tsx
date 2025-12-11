/**
 * AssessAssignment Transaction Component (V2)
 *
 * UI for teachers to assess (accept/deny) student assignment submissions.
 * Uses COURSE_TEACHER_ASSIGNMENTS_ASSESS transaction definition.
 */

"use client";

import React, { useState } from "react";
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
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { CheckCircle, XCircle, ClipboardCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { v2 } from "@andamio/transactions";

export interface AssessAssignmentProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

  /**
   * Student's access token alias
   */
  studentAlias: string;

  /**
   * Module code for the assignment
   */
  moduleCode: string;

  /**
   * Module title for display
   */
  moduleTitle?: string;

  /**
   * Callback fired when assessment is successful
   */
  onSuccess?: (result: "accept" | "refuse") => void | Promise<void>;
}

/**
 * AssessAssignment - Teacher UI for accepting/denying student submissions (V2)
 *
 * @example
 * ```tsx
 * <AssessAssignment
 *   courseNftPolicyId="abc123..."
 *   studentAlias="alice"
 *   moduleCode="MODULE_1"
 *   onSuccess={(result) => refetchCommitments()}
 * />
 * ```
 */
export function AssessAssignment({
  courseNftPolicyId,
  studentAlias,
  moduleCode,
  moduleTitle,
  onSuccess,
}: AssessAssignmentProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [assessmentResult, setAssessmentResult] = useState<"accept" | "refuse" | null>(null);

  const handleAssess = async (decision: "accept" | "refuse") => {
    if (!user?.accessTokenAlias) {
      return;
    }

    setAssessmentResult(decision);

    await execute({
      definition: v2.COURSE_TEACHER_ASSIGNMENTS_ASSESS,
      params: {
        // Transaction API params
        alias: user.accessTokenAlias,
        courseId: courseNftPolicyId,
        assignmentDecisions: [
          { alias: studentAlias, outcome: decision },
        ],
        // Side effect params
        moduleCode,
        studentAccessTokenAlias: studentAlias,
        assessmentResult: decision,
      },
      onSuccess: async (txResult) => {
        console.log("[AssessAssignment] Success!", txResult);

        // Show success toast
        const actionText = decision === "accept" ? "accepted" : "refused";
        toast.success(`Assignment ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}!`, {
          description: `${studentAlias}'s submission has been ${actionText}`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        await onSuccess?.(decision);
      },
      onError: (txError) => {
        console.error("[AssessAssignment] Error:", txError);
        setAssessmentResult(null);
        toast.error("Assessment Failed", {
          description: txError.message || "Failed to submit assessment",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ClipboardCheck className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Assess Submission</AndamioCardTitle>
            <AndamioCardDescription>
              Review and assess {studentAlias}&apos;s assignment
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Assignment Info */}
        <div className="flex flex-wrap items-center gap-2">
          <AndamioBadge variant="outline" className="text-xs font-mono">
            Student: {studentAlias}
          </AndamioBadge>
          <AndamioBadge variant="secondary" className="text-xs">
            {moduleTitle ?? moduleCode}
          </AndamioBadge>
        </div>

        {/* Warning about irreversibility */}
        <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
          <p className="text-xs text-warning-foreground">
            Assessment decisions are recorded on-chain and cannot be undone.
          </p>
        </div>

        {/* Transaction Status */}
        {state !== "idle" && (
          <TransactionStatus
            state={state}
            result={result}
            error={error}
            onRetry={() => {
              setAssessmentResult(null);
              reset();
            }}
            messages={{
              success: `Assignment ${assessmentResult === "accept" ? "accepted" : "refused"} successfully!`,
            }}
          />
        )}

        {/* Assessment Buttons */}
        {state === "idle" && hasAccessToken && (
          <div className="flex gap-3">
            <AndamioButton
              variant="default"
              className="flex-1"
              onClick={() => handleAssess("accept")}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept
            </AndamioButton>
            <AndamioButton
              variant="destructive"
              className="flex-1"
              onClick={() => handleAssess("refuse")}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Refuse
            </AndamioButton>
          </div>
        )}

        {/* In-progress state */}
        {state !== "idle" && state !== "success" && state !== "error" && (
          <TransactionButton
            txState={state}
            onClick={() => undefined}
            disabled
            stateText={{
              idle: assessmentResult === "accept" ? "Accept" : "Refuse",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Recording on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
