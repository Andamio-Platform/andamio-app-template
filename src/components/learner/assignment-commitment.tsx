"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
import { env } from "~/env";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentEditor } from "~/components/editor";
import { AndamioTransaction } from "~/components/transactions/andamio-transaction";
import { ContentDisplay } from "~/components/content-display";
import {
  COURSE_STUDENT_ASSIGNMENT_COMMIT,
  COURSE_STUDENT_ASSIGNMENT_UPDATE,
} from "@andamio/transactions";
import { hashNormalizedContent } from "~/lib/hashing";
import type { JSONContent } from "@tiptap/core";
import {
  AlertIcon,
  SuccessIcon,
  PendingIcon,
  LessonIcon,
  LoadingIcon,
  DeleteIcon,
  AddIcon,
  SendIcon,
} from "~/components/icons";
import { AndamioSaveButton } from "~/components/andamio/andamio-save-button";

/** Convert string to hex encoding */
function stringToHex(str: string): string {
  return Buffer.from(str, "utf-8").toString("hex");
}

/**
 * Assignment Commitment Component
 *
 * Allows learners to:
 * - Create assignment commitments
 * - Update their evidence/work
 * - Track their progress
 * - Delete commitments
 *
 * API Endpoints:
 * - POST /course/student/assignment-commitment/create (protected)
 * - POST /course/student/assignment-commitment/update-evidence (protected)
 * - POST /course/student/assignment-commitment/delete (protected)
 */

interface AssignmentCommitmentProps {
  assignmentId: string;
  assignmentCode: string;
  assignmentTitle: string;
  courseNftPolicyId: string;
  moduleCode: string;
}

// Status constants commented out - not currently used but kept for future reference
// const PRIVATE_STATUSES = [
//   { value: "NOT_STARTED", label: "Not Started" },
//   { value: "SAVE_FOR_LATER", label: "Save for Later" },
//   { value: "IN_PROGRESS", label: "In Progress" },
//   { value: "COMPLETE", label: "Complete" },
//   { value: "COMMITMENT", label: "Ready to Commit" },
//   { value: "NETWORK_READY", label: "Network Ready" },
// ] as const;

// const NETWORK_STATUSES = [
//   { value: "AWAITING_EVIDENCE", label: "Awaiting Evidence" },
//   { value: "PENDING_TX_COMMITMENT_MADE", label: "Commitment Made (Pending TX)" },
//   { value: "PENDING_TX_ADD_INFO", label: "Adding Info (Pending TX)" },
//   { value: "PENDING_APPROVAL", label: "Pending Approval" },
//   { value: "PENDING_TX_ASSIGNMENT_ACCEPTED", label: "Accepted (Pending TX)" },
//   { value: "ASSIGNMENT_ACCEPTED", label: "Assignment Accepted" },
//   { value: "PENDING_TX_ASSIGNMENT_DENIED", label: "Denied (Pending TX)" },
//   { value: "ASSIGNMENT_DENIED", label: "Assignment Denied" },
//   { value: "PENDING_TX_CLAIM_CREDENTIAL", label: "Claiming Credential (Pending TX)" },
//   { value: "CREDENTIAL_CLAIMED", label: "Credential Claimed" },
//   { value: "PENDING_TX_COURSE_STUDENT_ASSIGNMENT_UPDATE", label: "Leaving (Pending TX)" },
//   { value: "ASSIGNMENT_LEFT", label: "Assignment Left" },
// ] as const;

interface Commitment {
  id: string;
  learnerAccessTokenAlias: string;
  networkStatus: string;
  networkEvidence: unknown;
  networkEvidenceHash: string | null;
  pendingTxHash: string | null;
  assignment: {
    assignmentCode: string;
    title: string;
    module: {
      moduleCode: string;
    };
  };
}

export function AssignmentCommitment({
  assignmentCode,
  assignmentTitle,
  courseNftPolicyId,
  moduleCode,
}: AssignmentCommitmentProps) {
  const { isAuthenticated, authenticatedFetch, user } = useAndamioAuth();
  const { isSuccess: showSuccess, message: successMessage, showSuccess: triggerSuccess } = useSuccessNotification();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitTx, setShowSubmitTx] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [evidenceContent, setEvidenceContent] = useState<JSONContent | null>(null);

  // Form state
  const [privateStatus, setPrivateStatus] = useState<string>("NOT_STARTED");

  // Evidence content state
  const [localEvidenceContent, setLocalEvidenceContent] = useState<JSONContent | null>(null);

  const handleEvidenceContentChange = (content: JSONContent) => {
    setLocalEvidenceContent(content);
    setHasUnsavedChanges(true);
  };

  // Warn user before leaving if they have unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !commitment) {
        e.preventDefault();
        const message = "You have unsaved evidence. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
      return undefined;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, commitment]);

  // Refetchable commitment loader
  const fetchCommitment = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Go API: POST /course/student/assignment-commitment/list
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/student/assignment-commitment/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch commitments");
      }

      const commitments = (await response.json()) as Commitment[];

      const existingCommitment = commitments.find((c) => c.assignment.assignmentCode === assignmentCode);

      if (existingCommitment) {
        setCommitment(existingCommitment);
        // Set local UI status based on network status
        if (existingCommitment.networkStatus === "ASSIGNMENT_ACCEPTED" || existingCommitment.networkStatus === "CREDENTIAL_CLAIMED") {
          setPrivateStatus("COMPLETE");
        } else if (existingCommitment.networkStatus === "PENDING_APPROVAL" || existingCommitment.networkStatus.startsWith("PENDING_TX_")) {
          setPrivateStatus("COMMITMENT");
        }
        // Set local evidence content if evidence exists
        if (existingCommitment.networkEvidence) {
          // Handle different evidence formats
          let content: JSONContent | null = null;
          if (typeof existingCommitment.networkEvidence === "string") {
            try {
              // Try to parse as JSON first
              const parsed = JSON.parse(existingCommitment.networkEvidence) as unknown;
              // If it has a 'type' property, it's likely Tiptap JSON
              if (parsed && typeof parsed === "object" && "type" in parsed) {
                content = parsed as JSONContent;
              } else {
                // Not Tiptap JSON, treat as plain string - wrap in Tiptap structure
                content = null;
              }
            } catch {
              // Not valid JSON, treat as plain string (HTML or text)
              content = null;
            }
          } else {
            // Already an object
            content = existingCommitment.networkEvidence as JSONContent;
          }
          setLocalEvidenceContent(content);
        }
      } else {
        setCommitment(null);
      }
    } catch (err) {
      console.error("Error fetching commitment:", err);
      setError(err instanceof Error ? err.message : "Failed to load commitment");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authenticatedFetch, assignmentCode, courseNftPolicyId]);

  // Initial fetch on mount
  useEffect(() => {
    void fetchCommitment();
  }, [fetchCommitment]);

  const handleStartAssignment = () => {
    setHasStarted(true);
    setError(null);
  };

  const handleLockEvidence = () => {
    if (!localEvidenceContent) return;

    const hash = hashNormalizedContent(localEvidenceContent);
    setEvidenceHash(hash);
    setEvidenceContent(localEvidenceContent);
    setIsLocked(true);
    setHasUnsavedChanges(false);
    triggerSuccess("Evidence locked! You can now submit to the blockchain.");
  };

  const handleUnlockEvidence = () => {
    setIsLocked(false);
    setEvidenceHash(null);
    setShowSubmitTx(false);
  };

  const handleUpdateEvidence = async () => {
    if (!commitment || !user?.accessTokenAlias || !localEvidenceContent) return;

    setIsSaving(true);
    setError(null);

    try {
      // Calculate hash from normalized content
      const evidenceHash = hashNormalizedContent(localEvidenceContent);

      // Go API: POST /course/student/assignment-commitment/update-evidence
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/student/assignment-commitment/update-evidence`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            assignment_code: commitment.assignment.assignmentCode,
            access_token_alias: user.accessTokenAlias,
            network_evidence: localEvidenceContent, // Send as JSON object, not stringified
            network_evidence_hash: evidenceHash,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to update evidence");
      }

      const updatedCommitment = (await response.json()) as Commitment;
      setCommitment(updatedCommitment);
      triggerSuccess("Draft saved successfully!");
    } catch (err) {
      console.error("Error updating evidence:", err);
      setError(err instanceof Error ? err.message : "Failed to update evidence");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCommitment = async () => {
    if (!commitment || !user?.accessTokenAlias) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Go API: POST /course/student/assignment-commitment/delete
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/student/assignment-commitment/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            assignment_code: commitment.assignment.assignmentCode,
            access_token_alias: user.accessTokenAlias,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to delete commitment");
      }

      setCommitment(null);
      setPrivateStatus("NOT_STARTED");
      setLocalEvidenceContent(null);
      triggerSuccess("Commitment deleted successfully!");
    } catch (err) {
      console.error("Error deleting commitment:", err);
      setError(err instanceof Error ? err.message : "Failed to delete commitment");
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>Connect your wallet to start this assignment</AndamioCardDescription>
        </AndamioCardHeader>
      </AndamioCard>
    );
  }

  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>Loading your progress...</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardTitle>Your Progress</AndamioCardTitle>
        <AndamioCardDescription>Track and submit your work for &quot;{assignmentTitle}&quot;</AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {error && (
          <AndamioAlert variant="destructive">
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertDescription>{error}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {showSuccess && (
          <AndamioAlert>
            <SuccessIcon className="h-4 w-4" />
            <AndamioAlertDescription>{successMessage}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {!commitment && !hasStarted ? (
          // No commitment yet - show start option
          <div className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <LessonIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <AndamioText variant="small" className="mb-4">
                You haven&apos;t started this assignment yet
              </AndamioText>
              <AndamioButton onClick={handleStartAssignment}>
                <AddIcon className="h-4 w-4 mr-2" />
                Start Assignment
              </AndamioButton>
            </div>
          </div>
        ) : !commitment && hasStarted ? (
          // Started locally but not committed to blockchain yet
          <div className="space-y-4">
            {/* Warning banner */}
            <AndamioAlert>
              <AlertIcon className="h-4 w-4" />
              <AndamioAlertDescription>
                {isLocked
                  ? "Your evidence is locked. Review it below and submit to the blockchain."
                  : "Your work is not saved until you submit to the blockchain. Lock your evidence when ready."}
              </AndamioAlertDescription>
            </AndamioAlert>

            {/* Network Evidence Editor or Locked View */}
            {!isLocked ? (
              <div className="space-y-2">
                <AndamioLabel>Your Evidence</AndamioLabel>
                <AndamioText variant="small" className="text-xs mb-2">
                  Write your evidence below. When finished, lock it to generate a hash for submission.
                </AndamioText>
                <ContentEditor
                  content={localEvidenceContent}
                  onContentChange={handleEvidenceContentChange}
                  minHeight="200px"
                  placeholder="Write your assignment evidence..."
                />
              </div>
            ) : (
              <div className="space-y-2">
                <AndamioLabel>Locked Evidence</AndamioLabel>
                {evidenceContent && (
                  <ContentDisplay content={evidenceContent} variant="muted" />
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>Hash:</span>
                  <code className="bg-muted px-2 py-1 rounded">{evidenceHash}</code>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <AndamioButton
                variant="outline"
                onClick={() => {
                  setHasStarted(false);
                  setHasUnsavedChanges(false);
                  setIsLocked(false);
                  setEvidenceHash(null);
                  setLocalEvidenceContent(null);
                }}
              >
                Cancel
              </AndamioButton>
              {!isLocked ? (
                <AndamioButton
                  onClick={handleLockEvidence}
                  disabled={!localEvidenceContent}
                >
                  <SuccessIcon className="h-4 w-4 mr-2" />
                  Lock Evidence
                </AndamioButton>
              ) : (
                <>
                  <AndamioButton variant="outline" onClick={handleUnlockEvidence}>
                    Edit Evidence
                  </AndamioButton>
                  <AndamioButton onClick={() => setShowSubmitTx(true)}>
                    <SendIcon className="h-4 w-4 mr-2" />
                    Submit to Blockchain
                  </AndamioButton>
                </>
              )}
            </div>

            {/* Submit to Blockchain Transaction */}
            {showSubmitTx && user?.accessTokenAlias && evidenceHash && (
              <>
                <AndamioSeparator />
                <AndamioTransaction
                  definition={COURSE_STUDENT_ASSIGNMENT_COMMIT}
                  inputs={{
                    // txParams (for Andamioscan transaction builder)
                    user_access_token: `${env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}323232${stringToHex(user.accessTokenAlias)}`,
                    policy: courseNftPolicyId,
                    assignment_code: assignmentCode,
                    assignment_info: evidenceHash, // Hash, not full content
                    // sideEffectParams (for db-api)
                    moduleCode: moduleCode,
                    accessTokenAlias: user.accessTokenAlias,
                    assignmentEvidence: evidenceContent, // Full Tiptap JSON content for database
                  }}
                  onSuccess={() => {
                    setShowSubmitTx(false);
                    setHasUnsavedChanges(false);
                    triggerSuccess("Assignment submitted to blockchain!");
                    // Refresh commitment data
                    void fetchCommitment();
                  }}
                  onError={(err) => {
                    setError(err.message);
                  }}
                />
              </>
            )}
          </div>
        ) : (
          // Commitment exists - show edit/update options
          <div className="space-y-4">
            {/* Status Display */}
            <div className="flex items-center justify-between">
              <div>
                <AndamioText variant="small" className="font-medium text-foreground">Status</AndamioText>
                <div className="flex items-center gap-2 mt-1">
                  <PendingIcon className="h-4 w-4 text-muted-foreground" />
                  <AndamioBadge variant="outline">{privateStatus}</AndamioBadge>
                  {commitment?.networkStatus !== "AWAITING_EVIDENCE" && (
                    <AndamioBadge>{commitment?.networkStatus}</AndamioBadge>
                  )}
                </div>
              </div>
              <AndamioConfirmDialog
                trigger={
                  <AndamioButton variant="destructive" size="sm" disabled={isDeleting}>
                    <DeleteIcon className="h-4 w-4 mr-2" />
                    Delete
                  </AndamioButton>
                }
                title="Delete Commitment"
                description="Are you sure you want to delete this assignment commitment? This action cannot be undone."
                confirmText="Delete Commitment"
                variant="destructive"
                onConfirm={handleDeleteCommitment}
                isLoading={isDeleting}
              />
            </div>

            <AndamioSeparator />

            {/* Submitted Evidence (Read-Only Display) */}
            <div className="space-y-2">
              <AndamioLabel>Your Submitted Evidence</AndamioLabel>
              {commitment?.networkEvidence ? (
                <>
                  <AndamioText variant="small" className="text-xs mb-2">
                    This is the evidence you submitted on-chain for review.
                  </AndamioText>
                  <ContentDisplay
                    content={commitment.networkEvidence as string | JSONContent}
                    variant="muted"
                  />
                  {commitment.networkEvidenceHash && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span>Hash:</span>
                      <code className="bg-muted px-2 py-1 rounded">{commitment.networkEvidenceHash}</code>
                    </div>
                  )}
                </>
              ) : (
                <AndamioAlert>
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>
                    No evidence submitted yet. Add your evidence below and submit to the blockchain.
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}
            </div>

            <AndamioSeparator />

            {/* Update Evidence Section */}
            <div className="space-y-2">
              <AndamioLabel>Update Your Evidence</AndamioLabel>
              <AndamioText variant="small" className="text-xs mb-2">
                Edit your evidence below and save as a draft, or submit updates to the blockchain.
              </AndamioText>
              <ContentEditor
                content={localEvidenceContent}
                onContentChange={handleEvidenceContentChange}
                minHeight="200px"
                placeholder="Update your assignment evidence..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <AndamioSaveButton
                variant="outline"
                onClick={handleUpdateEvidence}
                isSaving={isSaving}
                disabled={!localEvidenceContent}
                label="Save Draft"
                savingLabel="Saving..."
              />
              <AndamioButton
                onClick={() => setShowSubmitTx(true)}
                disabled={!localEvidenceContent}
              >
                <SendIcon className="h-4 w-4 mr-2" />
                Update on Blockchain
              </AndamioButton>
            </div>

            {/* Submit to Blockchain Transaction */}
            {showSubmitTx && user?.accessTokenAlias && (
              <>
                <AndamioSeparator />
                <AndamioTransaction
                  definition={COURSE_STUDENT_ASSIGNMENT_COMMIT}
                  inputs={{
                    // txParams (for Andamioscan transaction builder)
                    user_access_token: `${env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}323232${stringToHex(user.accessTokenAlias)}`,
                    policy: courseNftPolicyId,
                    assignment_code: assignmentCode,
                    assignment_info: localEvidenceContent ? hashNormalizedContent(localEvidenceContent) : "",
                    // sideEffectParams (for db-api)
                    moduleCode: moduleCode,
                    accessTokenAlias: user.accessTokenAlias,
                    assignmentEvidence: localEvidenceContent ?? {},
                  }}
                  onSuccess={() => {
                    setShowSubmitTx(false);
                    triggerSuccess("Assignment submitted to blockchain!");
                    // Refresh commitment data
                    void fetchCommitment();
                  }}
                  onError={(err) => {
                    setError(err.message);
                  }}
                />
              </>
            )}

            {/* COURSE_STUDENT_ASSIGNMENT_UPDATE Transaction - Show when PENDING_APPROVAL or ASSIGNMENT_DENIED */}
            {commitment && user?.accessTokenAlias &&
             (commitment.networkStatus === "PENDING_APPROVAL" || commitment.networkStatus === "ASSIGNMENT_DENIED") && (
              <>
                <AndamioSeparator />
                <div className="space-y-2">
                  <AndamioLabel className="text-sm font-medium">Update Your Submission</AndamioLabel>
                  <AndamioText variant="small" className="text-xs">
                    {commitment.networkStatus === "ASSIGNMENT_DENIED"
                      ? "Your assignment was denied. You can update your evidence and resubmit for review."
                      : "Your assignment is pending review. You can update your evidence if needed."}
                  </AndamioText>
                  <AndamioTransaction
                    definition={COURSE_STUDENT_ASSIGNMENT_UPDATE}
                    inputs={{
                      user_access_token: `${env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}323232${stringToHex(user.accessTokenAlias)}`,
                      policy: courseNftPolicyId,
                      assignment_info: localEvidenceContent ? hashNormalizedContent(localEvidenceContent) : "",
                    }}
                    showCard={false}
                    onSuccess={() => {
                      triggerSuccess("Assignment updated on blockchain!");
                      void fetchCommitment();
                    }}
                    onError={(err) => {
                      setError(err.message);
                    }}
                  />
                </div>
              </>
            )}

            {/* COURSE_STUDENT_ASSIGNMENT_UPDATE Transaction - Show as withdrawal option */}
            {commitment && user?.accessTokenAlias && commitment.networkStatus !== "ASSIGNMENT_ACCEPTED" && (
              <>
                <AndamioSeparator />
                <div className="space-y-2">
                  <AndamioLabel className="text-sm font-medium text-destructive">Withdraw from Assignment</AndamioLabel>
                  <AndamioText variant="small" className="text-xs">
                    Remove your commitment to this assignment. You can recommit later if needed.
                  </AndamioText>
                  <AndamioTransaction
                    definition={COURSE_STUDENT_ASSIGNMENT_UPDATE}
                    inputs={{
                      user_access_token: `${env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}323232${stringToHex(user.accessTokenAlias)}`,
                      policy: courseNftPolicyId,
                      moduleCode: moduleCode,
                      student_alias: user.accessTokenAlias,
                    }}
                    showCard={false}
                    onSuccess={() => {
                      triggerSuccess("You've withdrawn from this assignment.");
                      void fetchCommitment();
                    }}
                    onError={(err) => {
                      setError(err.message);
                    }}
                  />
                </div>
              </>
            )}
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
