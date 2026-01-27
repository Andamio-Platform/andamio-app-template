"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentEditor } from "~/components/editor";
import { TransactionButton } from "~/components/tx/transaction-button";
import { TransactionStatus } from "~/components/tx/transaction-status";
import { ContentDisplay } from "~/components/content-display";
import { CredentialClaim } from "~/components/tx/credential-claim";
import { hashNormalizedContent } from "~/lib/hashing";
import { getCourseStudent, type AndamioscanStudent } from "~/lib/andamioscan-events";
import type { JSONContent } from "@tiptap/core";
import {
  AlertIcon,
  SuccessIcon,
  PendingIcon,
  LoadingIcon,
  ExternalLinkIcon,
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
  assignmentTitle?: string;
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
// Note: API v2.0.0 removed assignment_code - use course_id + module_code instead
interface CommitmentApiResponse {
  policy_id: string;
  module_code: string;
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
  accessTokenAlias: string;
  networkStatus: string;
  networkEvidence: Record<string, unknown> | null;
  networkEvidenceHash: string | null;
  pendingTxHash: string | null;
}

export function AssignmentCommitment({
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
        if (status.state === "confirmed" || status.state === "updated") {
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
        if (status.state === "confirmed" || status.state === "updated") {
          triggerSuccess("Assignment updated on blockchain!");
          void fetchCommitment();
        } else if (status.state === "failed" || status.state === "expired") {
          setError(status.last_error ?? "Transaction failed. Please try again.");
        }
      },
    }
  );

  // On-chain student state (from Andamioscan)
  const [onChainStudent, setOnChainStudent] = useState<AndamioscanStudent | null>(null);
  const [onChainLoading, setOnChainLoading] = useState(true);

  // Fetch on-chain student state
  const refetchOnChain = useCallback(async () => {
    if (!user?.accessTokenAlias || !courseNftPolicyId) {
      setOnChainLoading(false);
      return;
    }

    setOnChainLoading(true);
    try {
      const studentState = await getCourseStudent(courseNftPolicyId, user.accessTokenAlias);
      console.log("[AssignmentCommitment] On-chain student state:", studentState);
      setOnChainStudent(studentState);
    } catch (err) {
      console.warn("[AssignmentCommitment] Failed to fetch on-chain state:", err);
      setOnChainStudent(null);
    } finally {
      setOnChainLoading(false);
    }
  }, [courseNftPolicyId, user?.accessTokenAlias]);

  // Fetch on-chain state on mount
  useEffect(() => {
    void refetchOnChain();
  }, [refetchOnChain]);

  // Check if user has a current commitment for THIS module on-chain
  // The on-chain "current" field is the assignment_id (slt_hash) of the active assignment
  const hasOnChainCommitment = !!(
    onChainStudent?.current &&
    sltHash &&
    onChainStudent.current === sltHash
  );

  // Check if user has already completed THIS module on-chain
  const hasCompletedOnChain = !!(
    onChainStudent?.completed &&
    sltHash &&
    onChainStudent.completed.includes(sltHash)
  );

  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      // Note: API v2.0.0 removed assignment_code - use course_id + module_code instead
      const existingCommitment: Commitment = {
        policyId: apiResponse.policy_id,
        moduleCode: apiResponse.module_code,
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
          <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-primary/10 border-primary/20">
            <SuccessIcon className="h-12 w-12 text-primary mb-4" />
            <AndamioText className="font-medium mb-2">Module Completed</AndamioText>
            <AndamioText variant="small" className="text-muted-foreground">
              You have successfully completed this module on-chain.
            </AndamioText>
          </div>
        ) : commitment?.networkStatus === "ASSIGNMENT_ACCEPTED" ? (
          // Assignment accepted - show credential claim
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-primary/10 border-primary/20">
              <SuccessIcon className="h-8 w-8 text-primary shrink-0" />
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
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-muted/10 border-muted-foreground/20">
              <AlertIcon className="h-8 w-8 text-muted-foreground shrink-0" />
              <div>
                <AndamioText className="font-medium">Sync Required</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your assignment is on-chain but not synced to the database. Add your evidence below to enable teacher review.
                </AndamioText>
              </div>
            </div>

            {/* Display on-chain evidence hash for verification */}
            {onChainStudent?.currentContent && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <AndamioLabel className="text-xs">On-Chain Evidence Hash</AndamioLabel>
                <code className="block mt-1 text-xs font-mono break-all text-muted-foreground">
                  {onChainStudent.currentContent}
                </code>
                <AndamioText variant="small" className="mt-2 text-xs">
                  Your evidence below must produce a matching hash to verify authenticity.
                </AndamioText>
              </div>
            )}

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
        ) : !commitment ? (
          // No commitment yet - show editor immediately
          <div className="space-y-4">
            {/* Network Evidence Editor or Locked View */}
            {!isLocked ? (
              <div className="space-y-2">
                <AndamioLabel>Your Evidence</AndamioLabel>
                <AndamioText variant="small" className="text-xs mb-2">
                  Write your evidence below. When finished, lock it to generate a hash for blockchain submission.
                </AndamioText>
                <div className="border border-foreground/30 dark:border-muted-foreground rounded-md overflow-hidden">
                  <ContentEditor
                    content={localEvidenceContent}
                    onContentChange={handleEvidenceContentChange}
                    minHeight="200px"
                    placeholder="Write your assignment evidence..."
                  />
                </div>
                {/* Lock Evidence Button */}
                <div className="flex justify-end pt-2">
                  <AndamioButton
                    onClick={handleLockEvidence}
                    disabled={!localEvidenceContent}
                  >
                    <SuccessIcon className="h-4 w-4 mr-2" />
                    Lock Evidence
                  </AndamioButton>
                </div>
              </div>
            ) : (
              // Evidence is locked - show hash and TX submission together
              <div className="space-y-4">
                <div className="space-y-2">
                  <AndamioLabel>Locked Evidence</AndamioLabel>
                  {evidenceContent && (
                    <ContentDisplay content={evidenceContent} variant="muted" />
                  )}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                    <span>Evidence Hash:</span>
                    <span className="font-mono bg-muted px-2 py-1 rounded">{evidenceHash}</span>
                  </div>
                </div>

                <AndamioSeparator />

                {/* Submit to Blockchain Transaction (V2) - shown immediately when locked */}
                <div className="space-y-3">
                  {/* Transaction Status - Only show during initial processing */}
                  {commitTx.state !== "idle" && commitTx.state !== "success" && (
                    <TransactionStatus
                      state={commitTx.state}
                      result={commitTx.result}
                      error={commitTx.error?.message ?? null}
                      onRetry={() => commitTx.reset()}
                      messages={{
                        success: "Transaction submitted! Waiting for confirmation...",
                      }}
                    />
                  )}

                  {/* Gateway Confirmation Status - Show after TX submitted */}
                  {commitTx.state === "success" && commitTx.result?.requiresDBUpdate && !commitTxConfirmed && (
                    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
                        <div className="flex-1">
                          <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                          <AndamioText variant="small" className="text-xs">
                            {commitTxStatus?.state === "pending" && "Waiting for block confirmation"}
                            {commitTxStatus?.state === "confirmed" && "Processing database updates"}
                            {!commitTxStatus && "Registering transaction..."}
                          </AndamioText>
                        </div>
                      </div>
                      {/* Show TX hash and explorer link */}
                      {commitTx.result?.txHash && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="font-mono bg-muted px-2 py-1 rounded">
                            {commitTx.result.txHash.slice(0, 16)}...{commitTx.result.txHash.slice(-8)}
                          </code>
                          {commitTx.result.blockchainExplorerUrl && (
                            <a
                              href={commitTx.result.blockchainExplorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary hover:underline"
                            >
                              View <ExternalLinkIcon className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Success State - Gateway confirmed */}
                  {commitTxConfirmed && (
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                      <div className="flex items-center gap-3">
                        <SuccessIcon className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                          <AndamioText className="font-medium text-primary">
                            Assignment submitted successfully!
                          </AndamioText>
                          <AndamioText variant="small" className="text-xs">
                            Your assignment is now pending teacher review.
                          </AndamioText>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Hide during TX processing */}
                  {commitTx.state === "idle" && !commitTxConfirmed && (
                    <div className="flex justify-end gap-2">
                      <AndamioButton variant="outline" onClick={handleUnlockEvidence}>
                        Edit Evidence
                      </AndamioButton>
                      {user?.accessTokenAlias && sltHash && evidenceHash && (
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
                                setHasUnsavedChanges(false);
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
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Commitment exists - show read-only evidence and status
          <div className="space-y-4">
            {/* Status Banner */}
            {commitment?.networkStatus === "PENDING_APPROVAL" && (
              <div className="rounded-lg border bg-secondary/10 border-secondary/30 p-4">
                <div className="flex items-center gap-3">
                  <PendingIcon className="h-5 w-5 text-secondary shrink-0" />
                  <div>
                    <AndamioText className="font-medium">Pending Teacher Review</AndamioText>
                    <AndamioText variant="small" className="text-xs">
                      Your assignment has been submitted and is awaiting review by your teacher.
                    </AndamioText>
                  </div>
                </div>
              </div>
            )}

            {/* Submitted Evidence (Read-Only Display) */}
            <div className="space-y-2">
              <AndamioLabel>Your Submitted Evidence</AndamioLabel>
              {commitment?.networkEvidence ? (
                <>
                  <ContentDisplay
                    content={commitment.networkEvidence as JSONContent}
                    variant="muted"
                  />
                  {commitment.networkEvidenceHash && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                      <span>Evidence Hash:</span>
                      <span className="font-mono bg-muted px-2 py-1 rounded">{commitment.networkEvidenceHash.slice(0, 16)}...</span>
                    </div>
                  )}
                </>
              ) : (
                <AndamioAlert>
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>
                    No evidence content available.
                  </AndamioAlertDescription>
                </AndamioAlert>
              )}
            </div>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
