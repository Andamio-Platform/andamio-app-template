"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxWatcher } from "~/hooks/tx/use-tx-watcher";
import { AndamioButton } from "~/components/andamio/andamio-button";
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

// Response from /course/student/assignment-commitment/get (V2 Merged API)
// Returns merged on-chain + DB data with source indicator
// NOTE: API returns FLAT structure (like teacher hooks), not nested content
interface CommitmentApiResponse {
  data?: {
    course_id?: string;
    course_module_code?: string;
    slt_hash?: string;
    // On-chain fields (flat)
    on_chain_status?: string;
    on_chain_content?: string; // Hex-encoded evidence hash from chain
    // Off-chain fields (flat, not nested in content)
    commitment_status?: string;
    evidence?: Record<string, unknown>;
    assignment_evidence_hash?: string;
    // Legacy: some endpoints may still nest these in content
    content?: {
      commitment_status?: string;
      evidence?: Record<string, unknown>;
      assignment_evidence_hash?: string;
    };
    source?: "merged" | "chain_only" | "db_only";
  };
  warning?: string;
}

// Internal commitment state (normalized from API response)
interface Commitment {
  courseId: string;
  moduleCode: string;
  sltHash: string | null;
  onChainStatus: string | null;
  onChainContent: string | null; // Evidence hash from chain
  networkStatus: string; // From content.commitment_status or inferred
  networkEvidence: Record<string, unknown> | null; // From content.evidence
  networkEvidenceHash: string | null; // From content.assignment_evidence_hash
  source: "merged" | "chain_only" | "db_only";
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
        // "updated" means Gateway has confirmed TX AND updated DB
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
        // "updated" means Gateway has confirmed TX AND updated DB
        if (status.state === "updated") {
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

  // Check if user has already completed THIS module on-chain
  // Note: hasOnChainCommitment is now handled by the merged API (source: "chain_only")
  const hasCompletedOnChain = !!(
    onChainStudent?.completed &&
    sltHash &&
    onChainStudent.completed.includes(sltHash)
  );

  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [evidenceContent, setEvidenceContent] = useState<JSONContent | null>(null);

  // Form state - privateStatus value tracked for future UI use, currently only setPrivateStatus is called
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_privateStatus, setPrivateStatus] = useState<string>("NOT_STARTED");

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

    // slt_hash is required for on-chain lookup
    if (!sltHash) {
      console.log("[AssignmentCommitment] No sltHash available, skipping commitment fetch");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // V2 Merged API: Returns merged on-chain + DB data
      // POST /course/student/assignment-commitment/get
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/student/assignment-commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            slt_hash: sltHash,  // Required for on-chain lookup
            course_module_code: moduleCode,  // Optional for DB enrichment
          }),
        }
      );

      // 404 means no commitment (neither on-chain nor DB)
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

      const data = apiResponse.data;
      if (!data) {
        setCommitment(null);
        return;
      }

      // Transform V2 merged response to internal state
      // source: "merged" = both on-chain and DB, "chain_only" = on-chain only, "db_only" = pending
      // NOTE: API may return flat structure OR nested content - check both
      const evidence = data.evidence ?? data.content?.evidence;
      const commitmentStatus = data.commitment_status ?? data.content?.commitment_status;
      const evidenceHash = data.assignment_evidence_hash ?? data.content?.assignment_evidence_hash;
      // Narrow source to valid union values
      const source = data.source === "chain_only" || data.source === "db_only" ? data.source : "merged";

      const existingCommitment: Commitment = {
        courseId: data.course_id ?? courseNftPolicyId,
        moduleCode: data.course_module_code ?? moduleCode,
        sltHash: data.slt_hash ?? null,
        onChainStatus: data.on_chain_status ?? null,
        onChainContent: data.on_chain_content ?? null,
        networkStatus: commitmentStatus ?? data.on_chain_status ?? "PENDING_APPROVAL",
        networkEvidence: evidence ?? null,
        networkEvidenceHash: evidenceHash ?? data.on_chain_content ?? null,
        source,
      };

      setCommitment(existingCommitment);

      // Log source for debugging
      if (data.source === "chain_only") {
        console.log("[AssignmentCommitment] On-chain commitment found, no DB content yet");
      }

      // Set local UI status based on commitment network status
      if (existingCommitment.networkStatus === "PENDING_APPROVAL" || existingCommitment.networkStatus === "ON_CHAIN") {
        setPrivateStatus("COMMITMENT");
      } else if (existingCommitment.networkStatus?.includes("PENDING")) {
        setPrivateStatus("COMMITMENT");
      } else {
        setPrivateStatus("IN_PROGRESS");
      }

      // Set local evidence content if evidence exists (only when source is "merged" or "db_only")
      if (existingCommitment.networkEvidence) {
        setLocalEvidenceContent(existingCommitment.networkEvidence as JSONContent);
      }
    } catch (err) {
      console.error("Error fetching commitment:", err);
      setError(err instanceof Error ? err.message : "Failed to load commitment");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authenticatedFetch, user?.accessTokenAlias, courseNftPolicyId, moduleCode, sltHash]);

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
        ) : commitment?.source === "chain_only" ? (
          // On-chain commitment exists but no database content - use UPDATE TX to sync
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-secondary/10 border-secondary/30">
              <AlertIcon className="h-8 w-8 text-secondary shrink-0" />
              <div>
                <AndamioText className="font-medium">Evidence Update Required</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your assignment commitment is on-chain but evidence is missing from the database. Update your evidence to enable teacher review.
                </AndamioText>
              </div>
            </div>

            {/* Display on-chain evidence hash for reference */}
            {commitment.onChainContent && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <AndamioLabel className="text-xs">Current On-Chain Evidence Hash</AndamioLabel>
                <code className="block mt-1 text-xs font-mono break-all text-muted-foreground">
                  {commitment.onChainContent}
                </code>
                <AndamioText variant="small" className="mt-2 text-xs">
                  This will be updated with your new evidence hash.
                </AndamioText>
              </div>
            )}

            <AndamioSeparator />

            {/* Evidence Editor */}
            <div className="space-y-2">
              <AndamioLabel>Your Evidence</AndamioLabel>
              <AndamioText variant="small" className="text-xs mb-2">
                Enter your assignment evidence. This will update both the on-chain record and the database.
              </AndamioText>
              <div className="border border-foreground/30 dark:border-muted-foreground rounded-md overflow-hidden">
                <ContentEditor
                  content={localEvidenceContent}
                  onContentChange={handleEvidenceContentChange}
                  minHeight="200px"
                  placeholder="Enter your assignment evidence..."
                />
              </div>
              {localEvidenceContent && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>New Hash:</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded">{hashNormalizedContent(localEvidenceContent)}</span>
                </div>
              )}
            </div>

            {/* Transaction Status - Only show during processing */}
            {updateTx.state !== "idle" && updateTx.state !== "success" && (
              <TransactionStatus
                state={updateTx.state}
                result={updateTx.result}
                error={updateTx.error?.message ?? null}
                onRetry={() => updateTx.reset()}
                messages={{
                  success: "Transaction submitted! Waiting for confirmation...",
                }}
              />
            )}

            {/* Gateway Confirmation Status - Show after TX submitted */}
            {updateTx.state === "success" && updateTx.result?.requiresDBUpdate && !updateTxConfirmed && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <LoadingIcon className="h-5 w-5 animate-spin text-secondary" />
                  <div className="flex-1">
                    <AndamioText className="font-medium">Confirming on blockchain...</AndamioText>
                    <AndamioText variant="small" className="text-xs">
                      {updateTxStatus?.state === "pending" && "Waiting for block confirmation"}
                      {updateTxStatus?.state === "confirmed" && "Processing database updates"}
                      {!updateTxStatus && "Registering transaction..."}
                    </AndamioText>
                  </div>
                </div>
              </div>
            )}

            {/* Success State */}
            {updateTxConfirmed && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <SuccessIcon className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <AndamioText className="font-medium text-primary">
                      Evidence updated successfully!
                    </AndamioText>
                    <AndamioText variant="small" className="text-xs">
                      Your assignment is now pending teacher review.
                    </AndamioText>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {updateTx.state === "idle" && !updateTxConfirmed && (
              <div className="flex justify-end gap-2">
                <AndamioButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void fetchCommitment();
                  }}
                >
                  Refresh Status
                </AndamioButton>
                {user?.accessTokenAlias && localEvidenceContent && (
                  <TransactionButton
                    txState={updateTx.state}
                    onClick={async () => {
                      const newEvidenceHash = hashNormalizedContent(localEvidenceContent);
                      await updateTx.execute({
                        txType: "COURSE_STUDENT_ASSIGNMENT_UPDATE",
                        params: {
                          alias: user.accessTokenAlias!,
                          course_id: courseNftPolicyId,
                          assignment_info: newEvidenceHash,
                        },
                        onSuccess: async (result) => {
                          setHasUnsavedChanges(false);

                          // Save evidence content to database (upsert)
                          try {
                            const submitResponse = await authenticatedFetch(
                              `/api/gateway/api/v2/course/student/commitment/submit`,
                              {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  course_id: courseNftPolicyId,
                                  slt_hash: sltHash, // Required - replaces course_module_code
                                  evidence: localEvidenceContent,
                                  evidence_hash: newEvidenceHash,
                                  pending_tx_hash: result.txHash,
                                }),
                              }
                            );

                            if (!submitResponse.ok) {
                              console.error("[AssignmentCommitment] Failed to save evidence to DB:", await submitResponse.text());
                            } else {
                              console.log("[AssignmentCommitment] Evidence saved to database");
                            }
                          } catch (err) {
                            console.error("[AssignmentCommitment] Error saving evidence to DB:", err);
                          }
                        },
                        onError: (err) => {
                          setError(err.message);
                        },
                      });
                    }}
                    stateText={{
                      idle: "Update Evidence",
                      fetching: "Preparing...",
                      signing: "Sign in Wallet",
                      submitting: "Submitting...",
                    }}
                  />
                )}
              </div>
            )}
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
                              onSuccess: async (result) => {
                                setHasUnsavedChanges(false);

                                // Save evidence content to database
                                // The hash is on-chain, but the actual JSON content needs to be stored for teacher review
                                if (evidenceContent) {
                                  try {
                                    const submitResponse = await authenticatedFetch(
                                      `/api/gateway/api/v2/course/student/commitment/submit`,
                                      {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          course_id: courseNftPolicyId,
                                          slt_hash: sltHash, // Required - replaces course_module_code
                                          evidence: evidenceContent,
                                          evidence_hash: evidenceHash,
                                          pending_tx_hash: result.txHash,
                                        }),
                                      }
                                    );

                                    if (!submitResponse.ok) {
                                      console.error("[AssignmentCommitment] Failed to save evidence to DB:", await submitResponse.text());
                                      // Don't throw - TX succeeded, evidence save is secondary
                                    } else {
                                      console.log("[AssignmentCommitment] Evidence saved to database");
                                    }
                                  } catch (err) {
                                    console.error("[AssignmentCommitment] Error saving evidence to DB:", err);
                                    // Don't throw - TX succeeded, evidence save is secondary
                                  }
                                }
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
