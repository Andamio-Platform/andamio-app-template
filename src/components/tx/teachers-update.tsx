/**
 * TeachersUpdate Transaction Component (V2 - Gateway Auto-Confirmation)
 *
 * UI for adding or removing teachers from a course.
 * Uses COURSE_OWNER_TEACHERS_MANAGE transaction with gateway auto-confirmation.
 *
 * @see ~/hooks/use-transaction.ts
 * @see ~/hooks/use-tx-stream.ts
 */

"use client";

import React, { useState } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
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
import { AndamioText } from "~/components/andamio/andamio-text";
import { TeacherIcon, AddIcon, DeleteIcon, AlertIcon, LoadingIcon, SuccessIcon } from "~/components/icons";
import { AliasListInput } from "./alias-list-input";
import { toast } from "sonner";
import { TRANSACTION_UI } from "~/config/transaction-ui";

export interface TeachersUpdateProps {
  /**
   * Course NFT Policy ID
   */
  courseId: string;

  /**
   * Current teachers (for display)
   */
  currentTeachers?: string[];

  /**
   * Callback fired when teachers are successfully updated
   */
  onSuccess?: () => void | Promise<void>;
}

/**
 * TeachersUpdate - UI for adding/removing teachers from a course (V2)
 *
 * @example
 * ```tsx
 * <TeachersUpdate
 *   courseId="abc123..."
 *   currentTeachers={["alice", "bob"]}
 *   onSuccess={() => refetchCourse()}
 * />
 * ```
 */
export function TeachersUpdate({
  courseId,
  currentTeachers = [],
  onSuccess,
}: TeachersUpdateProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const [teacherAliases, setTeacherAliases] = useState<string[]>([]);
  const [action, setAction] = useState<"add" | "remove">("add");

  // Watch for gateway confirmation after TX submission
  const { status: txStatus, isSuccess: txConfirmed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
          console.log("[TeachersUpdate] TX confirmed and DB updated by gateway");

          const actionText = action === "add" ? "added to" : "removed from";
          toast.success("Teachers Updated!", {
            description: `Teachers ${actionText} course`,
          });

          // Clear input
          setTeacherAliases([]);

          // Call callback
          void onSuccess?.();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Update Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    }
  );

  const ui = TRANSACTION_UI.COURSE_OWNER_TEACHERS_MANAGE;

  const handleUpdateTeachers = async () => {
    if (!user?.accessTokenAlias || teacherAliases.length === 0) {
      return;
    }

    // Build params based on action - API uses separate arrays for add/remove
    const teachers_to_add = action === "add" ? teacherAliases : [];
    const teachers_to_remove = action === "remove" ? teacherAliases : [];

    await execute({
      txType: "COURSE_OWNER_TEACHERS_MANAGE",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
        teachers_to_add,
        teachers_to_remove,
      },
      onSuccess: async (txResult) => {
        console.log("[TeachersUpdate] TX submitted successfully!", txResult);
      },
      onError: (txError) => {
        console.error("[TeachersUpdate] Error:", txError);
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasTeachers = teacherAliases.length > 0;
  const canSubmit = hasAccessToken && hasTeachers;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <TeacherIcon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>{ui.title}</AndamioCardTitle>
            <AndamioCardDescription>
              Add or remove teachers from this course
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Current Teachers */}
        {currentTeachers.length > 0 && (
          <div className="space-y-2">
            <AndamioText variant="small" className="text-xs font-medium uppercase tracking-wide">
              Current Teachers
            </AndamioText>
            <div className="flex flex-wrap gap-2">
              {currentTeachers.map((teacher) => (
                <AndamioBadge key={teacher} variant="secondary" className="text-xs font-mono">
                  {teacher}
                </AndamioBadge>
              ))}
            </div>
          </div>
        )}

        {/* Action Toggle */}
        <div className="flex gap-2">
          <AndamioButton
            variant={action === "add" ? "default" : "outline"}
            size="sm"
            onClick={() => setAction("add")}
            disabled={state !== "idle" && state !== "error"}
          >
            <AddIcon className="h-4 w-4 mr-1" />
            Add
          </AndamioButton>
          <AndamioButton
            variant={action === "remove" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setAction("remove")}
            disabled={state !== "idle" && state !== "error"}
          >
            <DeleteIcon className="h-4 w-4 mr-1" />
            Remove
          </AndamioButton>
        </div>

        {/* Teacher Input */}
        <AliasListInput
          value={teacherAliases}
          onChange={setTeacherAliases}
          label={action === "add" ? "Teachers to Add" : "Teachers to Remove"}
          placeholder="Enter teacher alias"
          disabled={state !== "idle" && state !== "error"}
          excludeAliases={currentTeachers}
          helperText={
            action === "add"
              ? "Each alias is verified on-chain before being added."
              : "Each alias is verified on-chain before being removed."
          }
        />

        {/* Warning for remove */}
        {action === "remove" && (
          <div className="flex items-start gap-2 rounded-md border border-muted-foreground/30 bg-muted/10 p-3">
            <AlertIcon className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
            <AndamioText variant="small" className="text-xs text-muted-foreground">
              Removing teachers will revoke their ability to manage modules and assess assignments.
            </AndamioText>
          </div>
        )}

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
                <AndamioText variant="small" className="text-xs text-muted-foreground">
                  This usually takes 20–60 seconds.
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
                  Teachers Updated!
                </AndamioText>
                <AndamioText variant="small" className="text-xs">
                  {action === "add" ? "Teachers added to" : "Teachers removed from"} course.
                </AndamioText>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {state !== "success" && !txConfirmed && (
          <TransactionButton
            txState={state}
            onClick={handleUpdateTeachers}
            disabled={!canSubmit}
            stateText={{
              idle: action === "add" ? "Add Teachers" : "Remove Teachers",
              fetching: "Preparing Transaction...",
              signing: "Sign in Wallet",
              submitting: "Updating on Blockchain...",
            }}
            className="w-full"
          />
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
