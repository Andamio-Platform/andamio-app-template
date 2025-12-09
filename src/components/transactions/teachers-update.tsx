/**
 * TeachersUpdate Transaction Component (V2)
 *
 * UI for adding or removing teachers from a course.
 * Uses the V2 transaction definition - purely on-chain, no side effects.
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
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { Users, Plus, Minus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { v2 } from "@andamio/transactions";
import { env } from "~/env";
import { buildAccessTokenUnit } from "~/lib/access-token-utils";

export interface TeachersUpdateProps {
  /**
   * Course NFT Policy ID
   */
  courseNftPolicyId: string;

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
 *   courseNftPolicyId="abc123..."
 *   currentTeachers={["alice", "bob"]}
 *   onSuccess={() => refetchCourse()}
 * />
 * ```
 */
export function TeachersUpdate({
  courseNftPolicyId,
  currentTeachers = [],
  onSuccess,
}: TeachersUpdateProps) {
  const { user, isAuthenticated } = useAndamioAuth();
  const { state, result, error, execute, reset } = useAndamioTransaction();

  const [teacherInput, setTeacherInput] = useState("");
  const [action, setAction] = useState<"add" | "remove">("add");

  const handleUpdateTeachers = async () => {
    if (!user?.accessTokenAlias || !teacherInput.trim()) {
      return;
    }

    // Parse teacher aliases (comma-separated)
    const teacherAliases = teacherInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (teacherAliases.length === 0) {
      toast.error("No teachers specified");
      return;
    }

    // Build user access token
    const userAccessToken = buildAccessTokenUnit(
      user.accessTokenAlias,
      env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID
    );

    // Build teacher tokens array (JSON string of full access token units)
    const teacherTokens = teacherAliases.map((alias) =>
      buildAccessTokenUnit(alias, env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID)
    );

    await execute({
      definition: v2.COURSE_ADMIN_TEACHERS_UPDATE,
      params: {
        user_access_token: userAccessToken,
        policy: courseNftPolicyId,
        teacher_tokens: JSON.stringify(teacherTokens),
        action,
      },
      onSuccess: async (txResult) => {
        console.log("[TeachersUpdate] Success!", txResult);

        // Show success toast
        const actionText = action === "add" ? "added to" : "removed from";
        toast.success("Teachers Updated!", {
          description: `${teacherAliases.join(", ")} ${actionText} course`,
          action: txResult.blockchainExplorerUrl
            ? {
                label: "View Transaction",
                onClick: () => window.open(txResult.blockchainExplorerUrl, "_blank"),
              }
            : undefined,
        });

        // Clear input
        setTeacherInput("");

        // Call callback
        await onSuccess?.();
      },
      onError: (txError) => {
        console.error("[TeachersUpdate] Error:", txError);
        toast.error("Update Failed", {
          description: txError.message || "Failed to update teachers",
        });
      },
    });
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  const hasAccessToken = !!user.accessTokenAlias;
  const hasTeachers = teacherInput.trim().length > 0;
  const canSubmit = hasAccessToken && hasTeachers;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <AndamioCardTitle>Manage Teachers</AndamioCardTitle>
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
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current Teachers
            </p>
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
            <Plus className="h-4 w-4 mr-1" />
            Add
          </AndamioButton>
          <AndamioButton
            variant={action === "remove" ? "destructive" : "outline"}
            size="sm"
            onClick={() => setAction("remove")}
            disabled={state !== "idle" && state !== "error"}
          >
            <Minus className="h-4 w-4 mr-1" />
            Remove
          </AndamioButton>
        </div>

        {/* Teacher Input */}
        <div className="space-y-2">
          <AndamioLabel htmlFor="teachers">
            {action === "add" ? "Teachers to Add" : "Teachers to Remove"}
          </AndamioLabel>
          <AndamioInput
            id="teachers"
            type="text"
            placeholder="alice, bob, carol"
            value={teacherInput}
            onChange={(e) => setTeacherInput(e.target.value)}
            disabled={state !== "idle" && state !== "error"}
          />
          <p className="text-xs text-muted-foreground">
            Enter access token aliases, separated by commas
          </p>
        </div>

        {/* Warning for remove */}
        {action === "remove" && (
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 p-3">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
            <p className="text-xs text-warning-foreground">
              Removing teachers will revoke their ability to manage modules and assess assignments.
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
              success: `Teachers ${action === "add" ? "added" : "removed"} successfully!`,
            }}
          />
        )}

        {/* Submit Button */}
        {state !== "success" && (
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
