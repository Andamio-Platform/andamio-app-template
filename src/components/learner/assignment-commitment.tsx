"use client";

import React, { useState, useEffect } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useSuccessNotification } from "~/hooks/ui/use-success-notification";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import {
  useAssignmentCommitment,
  useSubmitEvidence,
} from "~/hooks/api/course";
import { useCourse } from "~/hooks/api/course/use-course";
import { isJSONContent } from "~/hooks/api/course/use-course-module";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentDisplay } from "~/components/content-display";
import { CredentialClaim } from "~/components/tx/credential-claim";
import { hashNormalizedContent } from "~/lib/hashing";
import type { JSONContent } from "@tiptap/core";
import {
  AlertIcon,
  SuccessIcon,
  PendingIcon,
  LoadingIcon,
} from "~/components/icons";
import {
  TxConfirmationProgress,
  TxConfirmationSuccess,
  EvidenceHashDisplay,
  EvidenceEditorSection,
  UpdateTxStatusSection,
  UpdateEvidenceActions,
} from "./assignment-commitment-shared";

/**
 * Assignment Commitment Component
 *
 * Allows learners to:
 * - Create assignment commitments
 * - Update their evidence/work
 * - Track their progress
 * - Delete commitments
 */

interface AssignmentCommitmentProps {
  assignmentTitle?: string;
  courseId: string;
  moduleCode: string;
  sltHash: string | null;
}

export function AssignmentCommitment({
  assignmentTitle,
  courseId,
  moduleCode,
  sltHash,
}: AssignmentCommitmentProps) {
  const { isAuthenticated, user } = useAndamioAuth();
  const { isSuccess: showSuccess, message: successMessage, showSuccess: triggerSuccess } = useSuccessNotification();

  // V2 Transaction hooks
  const commitTx = useTransaction();
  const updateTx = useTransaction();

  // Assignment commitment query hook
  const {
    data: commitment,
    isLoading,
    error: commitmentError,
    refetch: refetchCommitment,
  } = useAssignmentCommitment(courseId, moduleCode, sltHash);

  // Evidence submission mutation
  const submitEvidence = useSubmitEvidence();

  // TX error state
  const [txError, setTxError] = useState<string | null>(null);

  // Watch for gateway confirmation after commit TX
  const { status: commitTxStatus, isSuccess: commitTxConfirmed } = useTxStream(
    commitTx.result?.requiresDBUpdate ? commitTx.result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          triggerSuccess("Assignment committed to blockchain!");
          void refetchCommitment();
        } else if (status.state === "failed" || status.state === "expired") {
          setTxError(status.last_error ?? "Transaction failed. Please try again.");
        }
      },
    }
  );

  // Watch for gateway confirmation after update TX
  const { status: updateTxStatus, isSuccess: updateTxConfirmed } = useTxStream(
    updateTx.result?.requiresDBUpdate ? updateTx.result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          triggerSuccess("Assignment updated on blockchain!");
          void refetchCommitment();
        } else if (status.state === "failed" || status.state === "expired") {
          setTxError(status.last_error ?? "Transaction failed. Please try again.");
        }
      },
    }
  );

  // Course data for completion check
  const { data: courseData, refetch: refetchCourse } = useCourse(courseId);

  const hasCompletedOnChain = !!(
    user?.accessTokenAlias &&
    sltHash &&
    courseData?.pastStudents?.includes(user.accessTokenAlias)
  );

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [evidenceContent, setEvidenceContent] = useState<JSONContent | null>(null);
  const [localEvidenceContent, setLocalEvidenceContent] = useState<JSONContent | null>(null);

  const handleEvidenceContentChange = (content: JSONContent) => {
    setLocalEvidenceContent(content);
    setHasUnsavedChanges(true);
  };

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !commitment) {
        e.preventDefault();
        const message = "You have unsaved work. Are you sure you want to leave?";
        e.returnValue = message;
        return message;
      }
      return undefined;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, commitment]);

  // Initialize evidence content from commitment
  useEffect(() => {
    if (commitment?.networkEvidence && !localEvidenceContent) {
      const evidence = commitment.networkEvidence;
      if (isJSONContent(evidence)) {
        setLocalEvidenceContent(evidence);
      }
    }
  }, [commitment?.networkEvidence, localEvidenceContent]);

  const handleLockEvidence = () => {
    if (!localEvidenceContent) return;
    const hash = hashNormalizedContent(localEvidenceContent);
    setEvidenceHash(hash);
    setEvidenceContent(localEvidenceContent);
    setIsLocked(true);
    setHasUnsavedChanges(false);
    triggerSuccess("Your work is ready to submit. Review it below, then confirm.");
  };

  const handleUnlockEvidence = () => {
    setIsLocked(false);
    setEvidenceHash(null);
  };

  // Shared handler for update TX execution (used by revision + chain_only branches)
  const handleUpdateTxExecute = async (newEvidenceHash: string) => {
    if (!user?.accessTokenAlias || !localEvidenceContent) return;
    await updateTx.execute({
      txType: "COURSE_STUDENT_ASSIGNMENT_UPDATE",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseId,
        assignment_info: newEvidenceHash,
      },
      onSuccess: async (result) => {
        setHasUnsavedChanges(false);
        try {
          await submitEvidence.mutateAsync({
            courseId: courseId,
            sltHash: sltHash!,
            evidence: localEvidenceContent,
            evidenceHash: newEvidenceHash,
            pendingTxHash: result.txHash,
          });
        } catch (err) {
          console.error("[AssignmentCommitment] Error saving evidence to DB:", err);
        }
      },
      onError: (err) => setTxError(err.message),
    });
  };

  const displayError = txError ?? (commitmentError ? commitmentError.message : null);

  // --- Early returns ---

  if (!isAuthenticated) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Assignment Progress</AndamioCardTitle>
          <AndamioCardDescription>Connect your wallet to write and submit your work for this module</AndamioCardDescription>
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
              This module is being prepared by the instructor. You will be able to submit your work once setup is complete.
            </AndamioAlertDescription>
          </AndamioAlert>
        </AndamioCardContent>
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

  // --- Main render ---

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <AndamioCardTitle>Your Progress</AndamioCardTitle>
        <AndamioCardDescription>Track and submit your work for &quot;{assignmentTitle}&quot;</AndamioCardDescription>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {displayError && (
          <AndamioAlert variant="destructive">
            <AlertIcon className="h-4 w-4" />
            <AndamioAlertDescription>{displayError}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {showSuccess && (
          <AndamioAlert>
            <SuccessIcon className="h-4 w-4" />
            <AndamioAlertDescription>{successMessage}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {/* Top-level TX confirmation — persists across view transitions */}
        {((commitTx.state === "success" && commitTx.result?.requiresDBUpdate && !commitTxConfirmed) ||
          (updateTx.state === "success" && updateTx.result?.requiresDBUpdate && !updateTxConfirmed)) && (
          <TxConfirmationProgress
            txStatus={commitTxStatus ?? updateTxStatus}
            txHash={commitTx.result?.txHash ?? updateTx.result?.txHash}
            explorerUrl={commitTx.result?.blockchainExplorerUrl ?? updateTx.result?.blockchainExplorerUrl}
          />
        )}

        {(commitTxConfirmed || updateTxConfirmed) && (
          <TxConfirmationSuccess
            message={commitTxConfirmed ? "Assignment submitted successfully!" : "Evidence updated successfully!"}
          />
        )}

        {/* Branch: Module completed on-chain */}
        {hasCompletedOnChain ? (
          <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-primary/10 border-primary/20">
            <SuccessIcon className="h-12 w-12 text-primary mb-4" />
            <AndamioText className="font-medium mb-2">Module Completed</AndamioText>
            <AndamioText variant="small" className="text-muted-foreground">
              You have successfully completed this module on-chain.
            </AndamioText>
          </div>

        ) : commitment?.networkStatus === "ASSIGNMENT_ACCEPTED" ? (
          /* Branch: Assignment accepted — credential claim */
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
            {commitment.networkEvidence && (
              <div className="space-y-2">
                <AndamioLabel>Your Approved Work</AndamioLabel>
                <ContentDisplay content={commitment.networkEvidence} variant="muted" />
              </div>
            )}
            <AndamioSeparator />
            <CredentialClaim
              courseId={courseId}
              moduleCode={moduleCode}
              moduleTitle={assignmentTitle}
              onSuccess={() => {
                void refetchCommitment();
                void refetchCourse();
              }}
            />
          </div>

        ) : commitment?.networkStatus === "ASSIGNMENT_REFUSED" ? (
          /* Branch: Assignment refused — revision flow */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-destructive/10 border-destructive/30">
              <AlertIcon className="h-8 w-8 text-destructive shrink-0" />
              <div>
                <AndamioText className="font-medium">Needs Revision</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your instructor reviewed your submission and requested changes. Update your work below and resubmit.
                </AndamioText>
              </div>
            </div>
            {commitment.networkEvidence && (
              <div className="space-y-2">
                <AndamioLabel>Previous Submission (Refused)</AndamioLabel>
                <ContentDisplay content={commitment.networkEvidence} variant="muted" />
                {commitment.networkEvidenceHash && (
                  <EvidenceHashDisplay label="Previous Hash:" hash={commitment.networkEvidenceHash} />
                )}
              </div>
            )}
            <AndamioSeparator />
            <EvidenceEditorSection
              label="Revised Work"
              description="Edit your work below and resubmit."
              placeholder="Revise your assignment work..."
              content={localEvidenceContent}
              onContentChange={handleEvidenceContentChange}
            />
            <UpdateTxStatusSection
              txState={updateTx.state}
              txResult={updateTx.result}
              txError={updateTx.error?.message ?? null}
              txStatus={updateTxStatus}
              txConfirmed={updateTxConfirmed}
              onRetry={() => updateTx.reset()}
              successMessage="Revised work submitted successfully!"
            />
            <UpdateEvidenceActions
              txState={updateTx.state}
              txConfirmed={updateTxConfirmed}
              localEvidenceContent={localEvidenceContent}
              accessTokenAlias={user?.accessTokenAlias ?? null}
              courseId={courseId}
              sltHash={sltHash}
              onExecuteTx={handleUpdateTxExecute}
              onRefresh={() => void refetchCommitment()}
              submitLabel="Resubmit Work"
            />
          </div>

        ) : commitment?.source === "chain_only" ? (
          /* Branch: Chain-only — evidence update required */
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg bg-secondary/10 border-secondary/30">
              <AlertIcon className="h-8 w-8 text-secondary shrink-0" />
              <div>
                <AndamioText className="font-medium">Update Required</AndamioText>
                <AndamioText variant="small" className="text-muted-foreground">
                  Your assignment was submitted but the details need to be updated. Please re-enter your work below so your instructor can review it.
                </AndamioText>
              </div>
            </div>
            {commitment.onChainContent && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <AndamioLabel className="text-xs">Current Submission Hash</AndamioLabel>
                <code className="block mt-1 text-xs font-mono break-all text-muted-foreground">
                  {commitment.onChainContent}
                </code>
                <AndamioText variant="small" className="mt-2 text-xs">
                  This will be updated with your new submission.
                </AndamioText>
              </div>
            )}
            <AndamioSeparator />
            <EvidenceEditorSection
              label="Your Work"
              description="Enter your assignment work below. This will update your submission."
              placeholder="Enter your assignment work..."
              content={localEvidenceContent}
              onContentChange={handleEvidenceContentChange}
            />
            <UpdateTxStatusSection
              txState={updateTx.state}
              txResult={updateTx.result}
              txError={updateTx.error?.message ?? null}
              txStatus={updateTxStatus}
              txConfirmed={updateTxConfirmed}
              onRetry={() => updateTx.reset()}
              successMessage="Work updated successfully!"
            />
            <UpdateEvidenceActions
              txState={updateTx.state}
              txConfirmed={updateTxConfirmed}
              localEvidenceContent={localEvidenceContent}
              accessTokenAlias={user?.accessTokenAlias ?? null}
              courseId={courseId}
              sltHash={sltHash}
              onExecuteTx={handleUpdateTxExecute}
              onRefresh={() => void refetchCommitment()}
              submitLabel="Update Work"
            />
          </div>

        ) : !commitment ? (
          /* Branch: No commitment — new evidence flow */
          <div className="space-y-4">
            {!isLocked ? (
              <EvidenceEditorSection
                label="Your Work"
                description="Write your assignment work below. When you are ready, click Finalize to prepare it for submission."
                placeholder="Write your assignment work..."
                content={localEvidenceContent}
                onContentChange={handleEvidenceContentChange}
                onLock={handleLockEvidence}
                lockDisabled={!localEvidenceContent}
              />
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <AndamioLabel>Finalized Work</AndamioLabel>
                  {evidenceContent && (
                    <ContentDisplay content={evidenceContent} variant="muted" />
                  )}
                  {evidenceHash && (
                    <EvidenceHashDisplay label="Submission Hash:" hash={evidenceHash} truncate={false} />
                  )}
                </div>
                <AndamioSeparator />
                <div className="space-y-3">
                  <UpdateTxStatusSection
                    txState={commitTx.state}
                    txResult={commitTx.result}
                    txError={commitTx.error?.message ?? null}
                    txStatus={commitTxStatus}
                    txConfirmed={commitTxConfirmed}
                    onRetry={() => commitTx.reset()}
                    successMessage="Assignment submitted successfully!"
                  />
                  {commitTx.state === "idle" && !commitTxConfirmed && (
                    <div className="flex justify-end gap-2">
                      <AndamioButton variant="outline" onClick={handleUnlockEvidence}>
                        Edit Work
                      </AndamioButton>
                      {user?.accessTokenAlias && sltHash && evidenceHash && (
                        <UpdateEvidenceActions
                          txState={commitTx.state}
                          txConfirmed={commitTxConfirmed}
                          localEvidenceContent={evidenceContent}
                          accessTokenAlias={user.accessTokenAlias}
                          courseId={courseId}
                          sltHash={sltHash}
                          onExecuteTx={async (hash) => {
                            await commitTx.execute({
                              txType: "COURSE_STUDENT_ASSIGNMENT_COMMIT",
                              params: {
                                alias: user.accessTokenAlias!,
                                course_id: courseId,
                                slt_hash: sltHash,
                                assignment_info: hash,
                              },
                              onSuccess: async (result) => {
                                setHasUnsavedChanges(false);
                                if (evidenceContent) {
                                  try {
                                    await submitEvidence.mutateAsync({
                                      courseId: courseId,
                                      sltHash: sltHash,
                                      evidence: evidenceContent,
                                      evidenceHash: hash,
                                      pendingTxHash: result.txHash,
                                    });
                                  } catch (err) {
                                    console.error("[AssignmentCommitment] Error saving evidence to DB:", err);
                                  }
                                }
                              },
                              onError: (err) => setTxError(err.message),
                            });
                          }}
                          submitLabel="Submit Assignment"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        ) : (
          /* Branch: Existing commitment — read-only status */
          <div className="space-y-4">
            <CommitmentStatusBanner networkStatus={commitment.networkStatus} />
            <div className="space-y-2">
              <AndamioLabel>Your Submitted Work</AndamioLabel>
              {commitment.networkEvidence ? (
                <>
                  <ContentDisplay content={commitment.networkEvidence} variant="muted" />
                  {commitment.networkEvidenceHash && (
                    <EvidenceHashDisplay label="Submission Hash:" hash={commitment.networkEvidenceHash} />
                  )}
                </>
              ) : (
                <AndamioAlert>
                  <AlertIcon className="h-4 w-4" />
                  <AndamioAlertDescription>No submission content available.</AndamioAlertDescription>
                </AndamioAlert>
              )}
            </div>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}

// =============================================================================
// CommitmentStatusBanner — inline helper for the read-only branch
// =============================================================================

function CommitmentStatusBanner({ networkStatus }: { networkStatus: string }) {
  if (networkStatus === "PENDING_APPROVAL") {
    return (
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
    );
  }

  if (networkStatus === "PENDING_TX_COMMITMENT_MADE") {
    return (
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <LoadingIcon className="h-5 w-5 animate-spin text-secondary shrink-0" />
          <div>
            <AndamioText className="font-medium">Submitting to blockchain...</AndamioText>
            <AndamioText variant="small" className="text-xs">
              Your commitment transaction is being processed.
            </AndamioText>
          </div>
        </div>
      </div>
    );
  }

  if (networkStatus && networkStatus !== "ASSIGNMENT_ACCEPTED" && networkStatus !== "ASSIGNMENT_REFUSED") {
    return (
      <div className="rounded-lg border bg-secondary/10 border-secondary/30 p-4">
        <div className="flex items-center gap-3">
          <PendingIcon className="h-5 w-5 text-secondary shrink-0" />
          <div>
            <AndamioText className="font-medium">Assignment Submitted</AndamioText>
            <AndamioText variant="small" className="text-xs">
              Your assignment has been recorded and is being processed.
            </AndamioText>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
