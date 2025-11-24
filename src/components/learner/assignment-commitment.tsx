"use client";

import React, { useState, useEffect } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import { ContentEditor, useAndamioEditor, AndamioFixedToolbar, RenderEditor } from "~/components/editor";
import { useFullscreenEditor } from "~/components/editor/hooks/use-fullscreen-editor";
import { FullscreenEditorWrapper } from "~/components/editor/components/FullscreenEditorWrapper";
import { AndamioTransaction } from "~/components/transactions/andamio-transaction";
import { ContentDisplay } from "~/components/content-display";
import {
  COMMIT_TO_ASSIGNMENT,
  UPDATE_ASSIGNMENT,
  LEAVE_ASSIGNMENT,
} from "@andamio/transactions";
import { hashNormalizedContent } from "~/lib/hashing";
import type { JSONContent } from "@tiptap/core";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Save,
  Trash2,
  Plus,
  Send
} from "lucide-react";

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
 * - POST /assignment-commitments (protected)
 * - PATCH /assignment-commitments/{courseNftPolicyId}/{moduleCode}/{assignmentCode}/{accessTokenAlias}/evidence (protected)
 * - DELETE /assignment-commitments/{courseNftPolicyId}/{moduleCode}/{assignmentCode}/{accessTokenAlias} (protected)
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
//   { value: "PENDING_TX_LEAVE_ASSIGNMENT", label: "Leaving (Pending TX)" },
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
  assignmentId,
  assignmentCode,
  assignmentTitle,
  courseNftPolicyId,
  moduleCode,
}: AssignmentCommitmentProps) {
  const { isAuthenticated, authenticatedFetch, user } = useAndamioAuth();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showSubmitTx, setShowSubmitTx] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [evidenceHash, setEvidenceHash] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [evidenceContent, setEvidenceContent] = useState<JSONContent | null>(null);

  // Form state
  const [privateStatus, setPrivateStatus] = useState<string>("NOT_STARTED");

  // Tiptap editor for evidence
  const editor = useAndamioEditor({
    content: "",
    onUpdate: ({ editor }) => {
      // Track unsaved changes when user types
      if (editor.getText().trim()) {
        setHasUnsavedChanges(true);
      }
    },
  });

  // Full-screen state
  const { isFullscreen, toggleFullscreen, exitFullscreen } =
    useFullscreenEditor();

  // Warn user before leaving if they have unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && !commitment) {
        e.preventDefault();
        e.returnValue = "You have unsaved evidence. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, commitment]);

  // Check if commitment exists
  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchCommitment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all commitments for this course
        const response = await authenticatedFetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/learner/course/${courseNftPolicyId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch commitments");
        }

        const commitments = (await response.json()) as Commitment[];

        console.log("[AssignmentCommitment] Searching for assignmentCode:", assignmentCode);
        console.log("[AssignmentCommitment] Fetched commitments:", commitments);
        console.log("[AssignmentCommitment] Commitment assignmentCodes:", commitments.map(c => ({
          assignmentCode: c.assignment.assignmentCode,
          moduleCode: c.assignment.module.moduleCode
        })));

        const existingCommitment = commitments.find((c) => c.assignment.assignmentCode === assignmentCode);
        console.log("[AssignmentCommitment] Found commitment:", existingCommitment);

        if (existingCommitment) {
          console.log("[AssignmentCommitment] Network Evidence:", existingCommitment.networkEvidence);
          console.log("[AssignmentCommitment] Network Evidence Type:", typeof existingCommitment.networkEvidence);
          console.log("[AssignmentCommitment] Network Status:", existingCommitment.networkStatus);

          setCommitment(existingCommitment);
          // Set local UI status based on network status
          if (existingCommitment.networkStatus === "ASSIGNMENT_ACCEPTED" || existingCommitment.networkStatus === "CREDENTIAL_CLAIMED") {
            setPrivateStatus("COMPLETE");
          } else if (existingCommitment.networkStatus === "PENDING_APPROVAL" || existingCommitment.networkStatus.startsWith("PENDING_TX_")) {
            setPrivateStatus("COMMITMENT");
          }
          // Set editor content if evidence exists
          if (existingCommitment.networkEvidence && editor) {
            // Handle different evidence formats
            let content;
            if (typeof existingCommitment.networkEvidence === "string") {
              try {
                // Try to parse as JSON first
                const parsed = JSON.parse(existingCommitment.networkEvidence);
                // If it has a 'type' property, it's likely Tiptap JSON
                if (parsed && typeof parsed === "object" && "type" in parsed) {
                  content = parsed;
                } else {
                  // Not Tiptap JSON, treat as plain string
                  content = existingCommitment.networkEvidence;
                }
              } catch {
                // Not valid JSON, treat as plain string (HTML or text)
                content = existingCommitment.networkEvidence;
              }
            } else {
              // Already an object
              content = existingCommitment.networkEvidence;
            }
            editor.commands.setContent(content);
          }
        }
      } catch (err) {
        console.error("Error fetching commitment:", err);
        setError(err instanceof Error ? err.message : "Failed to load commitment");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCommitment();
  }, [isAuthenticated, authenticatedFetch, assignmentCode, courseNftPolicyId, editor]);

  const handleStartAssignment = () => {
    setHasStarted(true);
    setError(null);
  };

  const handleLockEvidence = () => {
    if (!editor) return;
    const content = editor.getJSON();
    if (!content) return;

    const hash = hashNormalizedContent(content);
    setEvidenceHash(hash);
    setEvidenceContent(content);
    setIsLocked(true);
    setHasUnsavedChanges(false);
    setSuccess("Evidence locked! You can now submit to the blockchain.");
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUnlockEvidence = () => {
    setIsLocked(false);
    setEvidenceHash(null);
    setShowSubmitTx(false);
  };

  const handleUpdateEvidence = async () => {
    if (!commitment || !user?.accessTokenAlias || !editor) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Get Tiptap JSON (not HTML) for consistent storage
      const evidenceContent = editor.getJSON();
      // Calculate hash from normalized content
      const evidenceHash = hashNormalizedContent(evidenceContent);

      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/${courseNftPolicyId}/${moduleCode}/${commitment.assignment.assignmentCode}/${user.accessTokenAlias}/evidence`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            networkEvidence: evidenceContent, // Send as JSON object, not stringified
            networkEvidenceHash: evidenceHash,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to update evidence");
      }

      const updatedCommitment = (await response.json()) as Commitment;
      setCommitment(updatedCommitment);
      setSuccess("Draft saved successfully!");
      setTimeout(() => setSuccess(null), 3000);
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
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/${courseNftPolicyId}/${moduleCode}/${commitment.assignment.assignmentCode}/${user.accessTokenAlias}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to delete commitment");
      }

      setCommitment(null);
      setPrivateStatus("NOT_STARTED");
      editor?.commands.clearContent();
      setSuccess("Commitment deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
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
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
            <AlertCircle className="h-4 w-4" />
            <AndamioAlertDescription>{error}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {success && (
          <AndamioAlert>
            <CheckCircle className="h-4 w-4" />
            <AndamioAlertDescription>{success}</AndamioAlertDescription>
          </AndamioAlert>
        )}

        {!commitment && !hasStarted ? (
          // No commitment yet - show start option
          <div className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                You haven&apos;t started this assignment yet
              </p>
              <AndamioButton onClick={handleStartAssignment}>
                <Plus className="h-4 w-4 mr-2" />
                Start Assignment
              </AndamioButton>
            </div>
          </div>
        ) : !commitment && hasStarted ? (
          // Started locally but not committed to blockchain yet
          <div className="space-y-4">
            {/* Warning banner */}
            <AndamioAlert>
              <AlertCircle className="h-4 w-4" />
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
                <p className="text-xs text-muted-foreground mb-2">
                  Write your evidence below. When finished, lock it to generate a hash for submission.
                </p>
                <FullscreenEditorWrapper
                  isFullscreen={isFullscreen}
                  onExitFullscreen={exitFullscreen}
                  editor={editor}
                  toolbar={
                    <AndamioFixedToolbar
                      editor={editor}
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={toggleFullscreen}
                    />
                  }
                >
                  {!isFullscreen && (
                    <AndamioFixedToolbar
                      editor={editor}
                      isFullscreen={isFullscreen}
                      onToggleFullscreen={toggleFullscreen}
                    />
                  )}
                  <ContentEditor
                    editor={editor}
                    height="200px"
                    isFullscreen={isFullscreen}
                  />
                </FullscreenEditorWrapper>
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
                  editor?.commands.clearContent();
                }}
              >
                Cancel
              </AndamioButton>
              {!isLocked ? (
                <AndamioButton
                  onClick={handleLockEvidence}
                  disabled={!editor?.getText().trim()}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Lock Evidence
                </AndamioButton>
              ) : (
                <>
                  <AndamioButton variant="outline" onClick={handleUnlockEvidence}>
                    Edit Evidence
                  </AndamioButton>
                  <AndamioButton onClick={() => setShowSubmitTx(true)}>
                    <Send className="h-4 w-4 mr-2" />
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
                  definition={COMMIT_TO_ASSIGNMENT}
                  inputs={{
                    // txParams (for NBA transaction builder)
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
                    setSuccess("Assignment submitted to blockchain!");
                    // Refresh commitment data
                    window.location.reload();
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
                <p className="text-sm font-medium">Status</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <AndamioBadge variant="outline">{privateStatus}</AndamioBadge>
                  {commitment?.networkStatus !== "AWAITING_EVIDENCE" && (
                    <AndamioBadge>{commitment?.networkStatus}</AndamioBadge>
                  )}
                </div>
              </div>
              <AndamioConfirmDialog
                trigger={
                  <AndamioButton variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
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
                  <p className="text-xs text-muted-foreground mb-2">
                    This is the evidence you submitted on-chain for review.
                  </p>
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
                  <AlertCircle className="h-4 w-4" />
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
              <p className="text-xs text-muted-foreground mb-2">
                Edit your evidence below and save as a draft, or submit updates to the blockchain.
              </p>
              <FullscreenEditorWrapper
                isFullscreen={isFullscreen}
                onExitFullscreen={exitFullscreen}
                editor={editor}
                toolbar={
                  <AndamioFixedToolbar
                    editor={editor}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                  />
                }
              >
                {!isFullscreen && (
                  <AndamioFixedToolbar
                    editor={editor}
                    isFullscreen={isFullscreen}
                    onToggleFullscreen={toggleFullscreen}
                  />
                )}
                <ContentEditor
                  editor={editor}
                  height="200px"
                  isFullscreen={isFullscreen}
                />
              </FullscreenEditorWrapper>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <AndamioButton
                variant="outline"
                onClick={handleUpdateEvidence}
                disabled={isSaving || !editor?.getText().trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </AndamioButton>
              <AndamioButton
                onClick={() => setShowSubmitTx(true)}
                disabled={!editor?.getText().trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                Update on Blockchain
              </AndamioButton>
            </div>

            {/* Submit to Blockchain Transaction */}
            {showSubmitTx && user?.accessTokenAlias && (
              <>
                <AndamioSeparator />
                <AndamioTransaction
                  definition={COMMIT_TO_ASSIGNMENT}
                  inputs={{
                    // txParams (for NBA transaction builder)
                    user_access_token: `${env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}323232${stringToHex(user.accessTokenAlias)}`,
                    policy: courseNftPolicyId,
                    assignment_code: assignmentCode,
                    assignment_info: editor?.getJSON() ? hashNormalizedContent(editor.getJSON()) : "",
                    // sideEffectParams (for db-api)
                    moduleCode: moduleCode,
                    accessTokenAlias: user.accessTokenAlias,
                    assignmentEvidence: editor?.getJSON() ?? {},
                  }}
                  onSuccess={() => {
                    setShowSubmitTx(false);
                    setSuccess("Assignment submitted to blockchain!");
                    // Refresh commitment data
                    window.location.reload();
                  }}
                  onError={(err) => {
                    setError(err.message);
                  }}
                />
              </>
            )}

            {/* UPDATE_ASSIGNMENT Transaction - Show when PENDING_APPROVAL or ASSIGNMENT_DENIED */}
            {commitment && user?.accessTokenAlias &&
             (commitment.networkStatus === "PENDING_APPROVAL" || commitment.networkStatus === "ASSIGNMENT_DENIED") && (
              <>
                <AndamioSeparator />
                <div className="space-y-2">
                  <AndamioLabel className="text-sm font-medium">Update Your Submission</AndamioLabel>
                  <p className="text-xs text-muted-foreground">
                    {commitment.networkStatus === "ASSIGNMENT_DENIED"
                      ? "Your assignment was denied. You can update your evidence and resubmit for review."
                      : "Your assignment is pending review. You can update your evidence if needed."}
                  </p>
                  <AndamioTransaction
                    definition={UPDATE_ASSIGNMENT}
                    inputs={{
                      user_access_token: `${env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}323232${stringToHex(user.accessTokenAlias)}`,
                      policy: courseNftPolicyId,
                      assignment_info: editor?.getJSON() ? hashNormalizedContent(editor.getJSON()) : "",
                    }}
                    showCard={false}
                    onSuccess={() => {
                      setSuccess("Assignment updated on blockchain!");
                      window.location.reload();
                    }}
                    onError={(err) => {
                      setError(err.message);
                    }}
                  />
                </div>
              </>
            )}

            {/* LEAVE_ASSIGNMENT Transaction - Show as withdrawal option */}
            {commitment && user?.accessTokenAlias && commitment.networkStatus !== "ASSIGNMENT_ACCEPTED" && (
              <>
                <AndamioSeparator />
                <div className="space-y-2">
                  <AndamioLabel className="text-sm font-medium text-destructive">Withdraw from Assignment</AndamioLabel>
                  <p className="text-xs text-muted-foreground">
                    Remove your commitment to this assignment. You can recommit later if needed.
                  </p>
                  <AndamioTransaction
                    definition={LEAVE_ASSIGNMENT}
                    inputs={{
                      user_access_token: `${env.NEXT_PUBLIC_ACCESS_TOKEN_POLICY_ID}323232${stringToHex(user.accessTokenAlias)}`,
                      policy: courseNftPolicyId,
                      moduleCode: moduleCode,
                      student_alias: user.accessTokenAlias,
                    }}
                    showCard={false}
                    onSuccess={() => {
                      setSuccess("You've withdrawn from this assignment.");
                      window.location.reload();
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
