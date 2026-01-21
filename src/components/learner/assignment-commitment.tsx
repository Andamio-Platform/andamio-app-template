"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/use-success-notification";
import { useTransaction } from "~/hooks/use-transaction";
import { useTxWatcher } from "~/hooks/use-tx-watcher";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentEditor } from "~/components/editor";
import { TransactionButton } from "~/components/transactions/transaction-button";
import { ContentDisplay } from "~/components/content-display";
import { CredentialClaim } from "~/components/transactions/credential-claim";
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
  sltHash: string | null; // Module hash (64-char hex) - required for on-chain transactions
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

// Response from /course/shared/assignment-commitment/get
// API uses network_* prefixed fields
interface CommitmentApiResponse {
  policy_id: string;
  module_code: string;
  assignment_code: string;
  access_token_alias: string;
  network_status: string;
  network_evidence: Record<string, unknown> | null;
  network_evidence_hash: string | null;
  pending_tx_hash: string | null;
}

// Internal commitment state (normalized from API response)
interface Commitment {
  policyId: string;
  moduleCode: string;
  assignmentCode: string;
  accessTokenAlias: string;
  networkStatus: string;
  networkEvidence: Record<string, unknown> | null;
  networkEvidenceHash: string | null;
  pendingTxHash: string | null;
}

export function AssignmentCommitment({
  assignmentCode: _assignmentCode,
  assignmentTitle,
  courseNftPolicyId,
  moduleCode,
  sltHash,
}: AssignmentCommitmentProps) {
  const { isAuthenticated, authenticatedFetch, user } = useAndamioAuth();
  const { isSuccess: showSuccess, message: successMessage, showSuccess: triggerSuccess } = useSuccessNotification();

  // V2 Transaction hooks
  const commitTx = useTransaction();
  const updateTx = useTransaction();

  // Watch for gateway confirmation after commit TX submission
  const { status: commitTxStatus, isSuccess: commitTxConfirmed } = useTxWatcher(
    commitTx.result?.requiresDBUpdate ? commitTx.result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          triggerSuccess("Assignment committed to blockchain!");
          void fetchCommitment();
        } else if (status.state === "failed" || status.state === "expired") {
          setError(status.last_error ?? "Transaction failed. Please try again.");
        }
      },
    }
  );

  // Watch for gateway confirmation after update TX submission
  const { status: updateTxStatus, isSuccess: updateTxConfirmed } = useTxWatcher(
    updateTx.result?.requiresDBUpdate ? updateTx.result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          triggerSuccess("Assignment updated on blockchain!");
          void fetchCommitment();
        } else if (status.state === "failed" || status.state === "expired") {
          setError(status.last_error ?? "Transaction failed. Please try again.");
        }
      },
    }
  );

  // TODO: Implement proper on-chain student state hook using V2 merged API
  // For now, these features are disabled until we have the equivalent endpoint
  // The original useCourseStudent returned { current: string, completed: string[], currentContent: string }
  const onChainLoading = false;

  // Check if user has a current commitment for THIS module on-chain
  // TODO: Re-enable when V2 student state endpoint is available
  const hasOnChainCommitment = false;

  // Check if user has already completed THIS module on-chain
  // TODO: Re-enable when V2 student state endpoint is available
  const hasCompletedOnChain = false;

  // Stub refetch function
  const refetchOnChain = async () => { /* No-op until V2 endpoint is available */ };

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
    if (!isAuthenticated || !user?.accessTokenAlias) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the student endpoint to get commitment for this specific module
      // POST /course/student/assignment-commitment/get
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/student/assignment-commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            module_code: moduleCode,
            access_token_alias: user.accessTokenAlias,
          }),
        }
      );

      // 404 means no commitment yet
      if (response.status === 404) {
        setCommitment(null);
        return;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("Failed to fetch commitment:", response.status, errorBody);
        throw new Error(`Failed to fetch commitment: ${response.status}`);
      }

      const apiResponse = (await response.json()) as CommitmentApiResponse;
      console.log("[AssignmentCommitment] API response:", apiResponse);

      // Transform snake_case API response to camelCase
      const existingCommitment: Commitment = {
        policyId: apiResponse.policy_id,
        moduleCode: apiResponse.module_code,
        assignmentCode: apiResponse.assignment_code,
        accessTokenAlias: apiResponse.access_token_alias,
        networkStatus: apiResponse.network_status,
        networkEvidence: apiResponse.network_evidence,
        networkEvidenceHash: apiResponse.network_evidence_hash,
        pendingTxHash: apiResponse.pending_tx_hash,
      };

      setCommitment(existingCommitment);

      // Set local UI status based on commitment network status
      if (existingCommitment.networkStatus === "PENDING_APPROVAL") {
        setPrivateStatus("COMMITMENT");
      } else if (existingCommitment.networkStatus?.includes("PENDING")) {
        setPrivateStatus("COMMITMENT");
      } else {
        setPrivateStatus("IN_PROGRESS");
      }

      // Set local evidence content if evidence exists
      if (existingCommitment.networkEvidence) {
        // Evidence is already a JSON object from the API
        setLocalEvidenceContent(existingCommitment.networkEvidence as JSONContent);
      }
    } catch (err) {
      console.error("Error fetching commitment:", err);
      setError(err instanceof Error ? err.message : "Failed to load commitment");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authenticatedFetch, user?.accessTokenAlias, courseNftPolicyId, moduleCode]);

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
      // API: POST /course/student/assignment-commitment/update-evidence
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/student/assignment-commitment/update-evidence`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            module_code: moduleCode,
            access_token_alias: user.accessTokenAlias,
            evidence: localEvidenceContent,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to update evidence");
      }

      // Refetch commitment to get updated data
      void fetchCommitment();
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
      // API: POST /course/student/assignment-commitment/delete
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/student/assignment-commitment/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            module_code: moduleCode,
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

  if (!sltHash) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>This module is not yet available on-chain</AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <AndamioAlert>
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertDescription>
              The instructor needs to mint this module on-chain before you can submit your assignment.
            </AndamioAlertDescription>
          </AndamioAlert>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  if (isLoading || onChainLoading) {
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

        {/* Check if already completed on-chain */}
        {hasCompletedOnChain ? (
          <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-success/10 border-success/20">
            <SuccessIcon className="h-12 w-12 text-success mb-4" />
            <AndamioText className="font-medium mb-2">Module Completed</AndamioText>
            <AndamioText variant="small" className="text-muted-foreground">
              You have successfully completed this module on-chain.
            </AndamioText>
          </div>
        ) : commitment?.networkStatus === "ASSIGNMENT_ACCEPTED" ? (
          // Assignment accepted - show credential claim
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-success/10 border-success/20">
              <SuccessIcon className="h-8 w-8 text-success shrink-0" />
              <div>
                <AndamioText className="font-medium">Assignment Accepted!</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your teacher has approved your work. You can now claim your credential.
                </AndamioText>
              </div>
            </div>

            {/* Show submitted evidence */}
            {commitment.networkEvidence && (
              <div className="space-y-2">
                <AndamioLabel>Your Approved Evidence</AndamioLabel>
                <ContentDisplay
                  content={commitment.networkEvidence as JSONContent}
                  variant="muted"
                />
              </div>
            )}

            <AndamioSeparator />

            {/* Credential Claim Component */}
            <CredentialClaim
              courseNftPolicyId={courseNftPolicyId}
              moduleCode={moduleCode}
              moduleTitle={assignmentTitle}
              onSuccess={() => {
                // Refresh data after claiming
                void fetchCommitment();
                void refetchOnChain();
              }}
            />
          </div>
        ) : hasOnChainCommitment && !commitment ? (
          // On-chain commitment exists but no database record - allow sync
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-warning/10 border-warning/20">
              <AlertIcon className="h-8 w-8 text-warning shrink-0" />
              <div>
                <AndamioText className="font-medium">Sync Required</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your assignment is on-chain but not synced to the database. Add your evidence below to enable teacher review.
                </AndamioText>
              </div>
            </div>

            {/* Display on-chain evidence hash - disabled until V2 student state endpoint is available */}
            {/* TODO: Re-enable when V2 endpoint provides currentContent */}

            <AndamioSeparator />

            {/* Evidence Editor for Sync */}
            <div className="space-y-2">
              <AndamioLabel>Your Evidence</AndamioLabel>
              <AndamioText variant="small" className="text-xs mb-2">
                Enter the same evidence you submitted on-chain. The hash must match for verification.
              </AndamioText>
              <div className="border border-foreground/30 dark:border-muted-foreground rounded-md overflow-hidden">
                <ContentEditor
                  content={localEvidenceContent}
                  onContentChange={handleEvidenceContentChange}
                  minHeight="200px"
                  placeholder="Enter your assignment evidence to sync with the database..."
                />
              </div>
              {localEvidenceContent && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>Hash:</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded">{hashNormalizedContent(localEvidenceContent)}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <AndamioButton
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetchOnChain();
                  void fetchCommitment();
                }}
              >
                Refresh Status
              </AndamioButton>
              <AndamioSaveButton
                onClick={async () => {
                  if (!user?.accessTokenAlias || !localEvidenceContent) return;

                  setIsSaving(true);
                  setError(null);

                  try {
                    // Step 1: Create the commitment record
                    // API: POST /course/student/assignment-commitment/create
                    const createResponse = await authenticatedFetch(
                      `/api/gateway/api/v2/course/student/assignment-commitment/create`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          course_id: courseNftPolicyId,
                          module_code: moduleCode,
                          status: "PENDING_APPROVAL", // On-chain commitment means it's pending review
                        }),
                      }
                    );

                    // If create fails with conflict (409), record might already exist - continue to update
                    if (!createResponse.ok && createResponse.status !== 409) {
                      const errorData = (await createResponse.json()) as { message?: string };
                      throw new Error(errorData.message ?? "Failed to create commitment record");
                    }

                    // Step 2: Update the evidence
                    // API: POST /course/student/assignment-commitment/update-evidence
                    const updateResponse = await authenticatedFetch(
                      `/api/gateway/api/v2/course/student/assignment-commitment/update-evidence`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          course_id: courseNftPolicyId,
                          module_code: moduleCode,
                          access_token_alias: user.accessTokenAlias,
                          evidence: localEvidenceContent,
                        }),
                      }
                    );

                    if (!updateResponse.ok) {
                      const errorData = (await updateResponse.json()) as { message?: string };
                      throw new Error(errorData.message ?? "Failed to update evidence");
                    }

                    triggerSuccess("Evidence synced successfully!");
                    void fetchCommitment();
                  } catch (err) {
                    console.error("Error syncing evidence:", err);
                    setError(err instanceof Error ? err.message : "Failed to sync evidence");
                  } finally {
                    setIsSaving(false);
                  }
                }}
                isSaving={isSaving}
                disabled={!localEvidenceContent}
                label="Sync Evidence to Database"
                savingLabel="Syncing..."
              />
            </div>
          </div>
        ) : !commitment && !hasStarted ? (
          // No commitment yet - show start option
          <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
            <LessonIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <AndamioText variant="small" className="mb-4">
              You haven&apos;t started this assignment yet
            </AndamioText>
            <AndamioButton variant="default" onClick={handleStartAssignment}>
              <AddIcon className="h-4 w-4 mr-2" />
              Start Assignment
            </AndamioButton>
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
                <div className="border border-foreground/30 dark:border-muted-foreground rounded-md overflow-hidden">
                  <ContentEditor
                    content={localEvidenceContent}
                    onContentChange={handleEvidenceContentChange}
                    minHeight="200px"
                    placeholder="Write your assignment evidence..."
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <AndamioLabel>Locked Evidence</AndamioLabel>
                {evidenceContent && (
                  <ContentDisplay content={evidenceContent} variant="muted" />
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>Hash:</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded">{evidenceHash}</span>
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

            {/* Submit to Blockchain Transaction (V2) */}
            {showSubmitTx && user?.accessTokenAlias && evidenceHash && sltHash && (
              <>
                <AndamioSeparator />
                <div className="space-y-3">
                  {/* Transaction Status */}
                  {commitTx.state !== "idle" && !commitTxConfirmed && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <LoadingIcon className="h-5 w-5 animate-spin text-info" />
                        <div className="flex-1">
                          <AndamioText className="font-medium">
                            {commitTx.state === "fetching" && "Preparing transaction..."}
                            {commitTx.state === "signing" && "Please sign in your wallet..."}
                            {commitTx.state === "submitting" && "Submitting to blockchain..."}
                            {commitTx.state === "success" && "Waiting for confirmation..."}
                          </AndamioText>
                          {commitTx.state === "success" && commitTxStatus && (
                            <AndamioText variant="small" className="text-xs">
                              {commitTxStatus.state === "pending" && "Waiting for block confirmation"}
                              {commitTxStatus.state === "confirmed" && "Processing database updates"}
                            </AndamioText>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success State */}
                  {commitTxConfirmed && (
                    <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                      <div className="flex items-center gap-3">
                        <SuccessIcon className="h-5 w-5 text-success" />
                        <AndamioText className="font-medium text-success">
                          Assignment submitted successfully!
                        </AndamioText>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {commitTx.state === "error" && (
                    <AndamioAlert variant="destructive">
                      <AlertIcon className="h-4 w-4" />
                      <AndamioAlertDescription>
                        {commitTx.error?.message ?? "Transaction failed"}
                      </AndamioAlertDescription>
                    </AndamioAlert>
                  )}

                  {/* Submit Button */}
                  {!commitTxConfirmed && (
                    <TransactionButton
                      txState={commitTx.state}
                      onClick={async () => {
                        await commitTx.execute({
                          txType: "COURSE_STUDENT_ASSIGNMENT_COMMIT",
                          params: {
                            alias: user.accessTokenAlias!,
                            course_id: courseNftPolicyId,
                            slt_hash: sltHash,
                            assignment_info: evidenceHash,
                          },
                          onSuccess: () => {
                            setShowSubmitTx(false);
                            setHasUnsavedChanges(false);
                          },
                          onError: (err) => {
                            setError(err.message);
                          },
                        });
                      }}
                      stateText={{
                        idle: "Commit Assignment",
                        fetching: "Preparing...",
                        signing: "Sign in Wallet",
                        submitting: "Submitting...",
                      }}
                      className="w-full"
                    />
                  )}
                </div>
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
                  {commitment?.networkStatus && (
                    <AndamioBadge>{commitment.networkStatus}</AndamioBadge>
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
                    This is the evidence you submitted for review.
                  </AndamioText>
                  <ContentDisplay
                    content={commitment.networkEvidence as JSONContent}
                    variant="muted"
                  />
                  {commitment.networkEvidenceHash && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span>Hash:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">{commitment.networkEvidenceHash.slice(0, 16)}...</span>
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

            {/* Submit to Blockchain Transaction (V2) */}
            {showSubmitTx && user?.accessTokenAlias && sltHash && localEvidenceContent && (
              <>
                <AndamioSeparator />
                <div className="space-y-3">
                  {/* Transaction Status */}
                  {commitTx.state !== "idle" && !commitTxConfirmed && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <LoadingIcon className="h-5 w-5 animate-spin text-info" />
                        <div className="flex-1">
                          <AndamioText className="font-medium">
                            {commitTx.state === "fetching" && "Preparing transaction..."}
                            {commitTx.state === "signing" && "Please sign in your wallet..."}
                            {commitTx.state === "submitting" && "Submitting to blockchain..."}
                            {commitTx.state === "success" && "Waiting for confirmation..."}
                          </AndamioText>
                          {commitTx.state === "success" && commitTxStatus && (
                            <AndamioText variant="small" className="text-xs">
                              {commitTxStatus.state === "pending" && "Waiting for block confirmation"}
                              {commitTxStatus.state === "confirmed" && "Processing database updates"}
                            </AndamioText>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success State */}
                  {commitTxConfirmed && (
                    <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                      <div className="flex items-center gap-3">
                        <SuccessIcon className="h-5 w-5 text-success" />
                        <AndamioText className="font-medium text-success">
                          Assignment submitted successfully!
                        </AndamioText>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {commitTx.state === "error" && (
                    <AndamioAlert variant="destructive">
                      <AlertIcon className="h-4 w-4" />
                      <AndamioAlertDescription>
                        {commitTx.error?.message ?? "Transaction failed"}
                      </AndamioAlertDescription>
                    </AndamioAlert>
                  )}

                  {/* Submit Button */}
                  {!commitTxConfirmed && (
                    <TransactionButton
                      txState={commitTx.state}
                      onClick={async () => {
                        const contentHash = hashNormalizedContent(localEvidenceContent);
                        await commitTx.execute({
                          txType: "COURSE_STUDENT_ASSIGNMENT_COMMIT",
                          params: {
                            alias: user.accessTokenAlias!,
                            course_id: courseNftPolicyId,
                            slt_hash: sltHash,
                            assignment_info: contentHash,
                          },
                          onSuccess: () => {
                            setShowSubmitTx(false);
                          },
                          onError: (err) => {
                            setError(err.message);
                          },
                        });
                      }}
                      stateText={{
                        idle: "Submit Assignment",
                        fetching: "Preparing...",
                        signing: "Sign in Wallet",
                        submitting: "Submitting...",
                      }}
                      className="w-full"
                    />
                  )}
                </div>
              </>
            )}

            {/* COURSE_STUDENT_ASSIGNMENT_UPDATE Transaction (V2) - Show when commitment is on-chain (PENDING_APPROVAL) */}
            {commitment && user?.accessTokenAlias && localEvidenceContent &&
             commitment.networkStatus === "PENDING_APPROVAL" && (
              <>
                <AndamioSeparator />
                <div className="space-y-3">
                  <AndamioLabel className="text-sm font-medium">Update Your Submission</AndamioLabel>
                  <AndamioText variant="small" className="text-xs">
                    Your assignment is on-chain. You can update your evidence if needed.
                  </AndamioText>

                  {/* Transaction Status */}
                  {updateTx.state !== "idle" && !updateTxConfirmed && (
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <div className="flex items-center gap-3">
                        <LoadingIcon className="h-5 w-5 animate-spin text-info" />
                        <div className="flex-1">
                          <AndamioText className="font-medium">
                            {updateTx.state === "fetching" && "Preparing update..."}
                            {updateTx.state === "signing" && "Please sign in your wallet..."}
                            {updateTx.state === "submitting" && "Submitting update..."}
                            {updateTx.state === "success" && "Waiting for confirmation..."}
                          </AndamioText>
                          {updateTx.state === "success" && updateTxStatus && (
                            <AndamioText variant="small" className="text-xs">
                              {updateTxStatus.state === "pending" && "Waiting for block confirmation"}
                              {updateTxStatus.state === "confirmed" && "Processing database updates"}
                            </AndamioText>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Success State */}
                  {updateTxConfirmed && (
                    <div className="rounded-lg border border-success/30 bg-success/5 p-4">
                      <div className="flex items-center gap-3">
                        <SuccessIcon className="h-5 w-5 text-success" />
                        <AndamioText className="font-medium text-success">
                          Assignment updated successfully!
                        </AndamioText>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {updateTx.state === "error" && (
                    <AndamioAlert variant="destructive">
                      <AlertIcon className="h-4 w-4" />
                      <AndamioAlertDescription>
                        {updateTx.error?.message ?? "Update failed"}
                      </AndamioAlertDescription>
                    </AndamioAlert>
                  )}

                  {/* Update Button */}
                  {!updateTxConfirmed && (
                    <TransactionButton
                      txState={updateTx.state}
                      onClick={async () => {
                        const contentHash = hashNormalizedContent(localEvidenceContent);
                        await updateTx.execute({
                          txType: "COURSE_STUDENT_ASSIGNMENT_UPDATE",
                          params: {
                            alias: user.accessTokenAlias!,
                            course_id: courseNftPolicyId,
                            assignment_info: contentHash,
                          },
                          onError: (err) => {
                            setError(err.message);
                          },
                        });
                      }}
                      stateText={{
                        idle: "Update Assignment",
                        fetching: "Preparing...",
                        signing: "Sign in Wallet",
                        submitting: "Updating...",
                      }}
                      className="w-full"
                    />
                  )}
                </div>
              </>
            )}

            {/* TODO: Withdrawal is not supported via COURSE_STUDENT_ASSIGNMENT_UPDATE in V2.
                Students can only update evidence or claim credentials. If withdrawal is needed,
                a separate mechanism would be required. */}
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
