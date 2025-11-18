"use client";

import React, { useState, useEffect } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioConfirmDialog } from "~/components/andamio/andamio-confirm-dialog";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  Loader2,
  Save,
  Trash2,
  Plus
} from "lucide-react";

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
 * - PATCH /assignment-commitments/{id}/evidence (protected)
 * - DELETE /assignment-commitments/{id} (protected)
 */

interface AssignmentCommitmentProps {
  assignmentId: string;
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
  assignmentId: string;
  learnerId: string;
  privateStatus: string;
  networkStatus: string;
  networkEvidence: unknown;
  networkEvidenceHash: string | null;
  favorite: boolean;
  archived: boolean;
}

export function AssignmentCommitment({
  assignmentId,
  assignmentTitle,
  courseNftPolicyId,
  moduleCode: _moduleCode,
}: AssignmentCommitmentProps) {
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();
  const [commitment, setCommitment] = useState<Commitment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [privateStatus, setPrivateStatus] = useState<string>("NOT_STARTED");
  const [networkEvidence, setNetworkEvidence] = useState("");

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
        const existingCommitment = commitments.find((c) => c.assignmentId === assignmentId);

        if (existingCommitment) {
          setCommitment(existingCommitment);
          setPrivateStatus(existingCommitment.privateStatus);
          setNetworkEvidence(
            typeof existingCommitment.networkEvidence === "string"
              ? existingCommitment.networkEvidence
              : JSON.stringify(existingCommitment.networkEvidence, null, 2)
          );
        }
      } catch (err) {
        console.error("Error fetching commitment:", err);
        setError(err instanceof Error ? err.message : "Failed to load commitment");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCommitment();
  }, [isAuthenticated, authenticatedFetch, assignmentId, courseNftPolicyId]);

  const handleCreateCommitment = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignmentId,
            privateStatus: privateStatus || "NOT_STARTED",
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message?: string };
        throw new Error(errorData.message ?? "Failed to create commitment");
      }

      const newCommitment = (await response.json()) as Commitment;
      setCommitment(newCommitment);
      setSuccess("Commitment created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error creating commitment:", err);
      setError(err instanceof Error ? err.message : "Failed to create commitment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateEvidence = async () => {
    if (!commitment) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Calculate a simple hash for the evidence
      const evidenceHash = `hash-${Date.now()}`;

      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/${commitment.id}/evidence`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            networkEvidence: networkEvidence || "{}",
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
      setSuccess("Evidence updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating evidence:", err);
      setError(err instanceof Error ? err.message : "Failed to update evidence");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCommitment = async () => {
    if (!commitment) return;

    setIsDeleting(true);
    setError(null);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment-commitments/${commitment.id}`,
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
      setNetworkEvidence("");
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

        {!commitment ? (
          // No commitment yet - show create option
          <div className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                You haven&apos;t started this assignment yet
              </p>
              <AndamioButton onClick={handleCreateCommitment} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Start Assignment
                  </>
                )}
              </AndamioButton>
            </div>
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
                  <AndamioBadge variant="outline">{commitment.privateStatus}</AndamioBadge>
                  {commitment.networkStatus !== "AWAITING_EVIDENCE" && (
                    <AndamioBadge>{commitment.networkStatus}</AndamioBadge>
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

            {/* Network Evidence (Public Submission) */}
            <div className="space-y-2">
              <AndamioLabel htmlFor="networkEvidence">Submission Evidence</AndamioLabel>
              <AndamioTextarea
                id="networkEvidence"
                placeholder="Add links to your work, proof of completion, or other evidence..."
                value={networkEvidence}
                onChange={(e) => setNetworkEvidence(e.target.value)}
                rows={6}
              />
              <p className="text-xs text-muted-foreground">
                This evidence will be submitted on-chain for review
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-2">
              <AndamioButton
                onClick={handleUpdateEvidence}
                disabled={isSaving || !networkEvidence.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Update Evidence
                  </>
                )}
              </AndamioButton>
            </div>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
