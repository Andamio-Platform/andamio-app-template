"use client";

import React, { useState, useEffect } from "react";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Separator } from "~/components/ui/separator";
import { ConfirmDialog } from "~/components/ui/confirm-dialog";
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

const PRIVATE_STATUSES = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "SAVE_FOR_LATER", label: "Save for Later" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETE", label: "Complete" },
  { value: "COMMITMENT", label: "Ready to Commit" },
  { value: "NETWORK_READY", label: "Network Ready" },
] as const;

const NETWORK_STATUSES = [
  { value: "AWAITING_EVIDENCE", label: "Awaiting Evidence" },
  { value: "PENDING_TX_COMMITMENT_MADE", label: "Commitment Made (Pending TX)" },
  { value: "PENDING_TX_ADD_INFO", label: "Adding Info (Pending TX)" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
  { value: "PENDING_TX_ASSIGNMENT_ACCEPTED", label: "Accepted (Pending TX)" },
  { value: "ASSIGNMENT_ACCEPTED", label: "Assignment Accepted" },
  { value: "PENDING_TX_ASSIGNMENT_DENIED", label: "Denied (Pending TX)" },
  { value: "ASSIGNMENT_DENIED", label: "Assignment Denied" },
  { value: "PENDING_TX_CLAIM_CREDENTIAL", label: "Claiming Credential (Pending TX)" },
  { value: "CREDENTIAL_CLAIMED", label: "Credential Claimed" },
  { value: "PENDING_TX_LEAVE_ASSIGNMENT", label: "Leaving (Pending TX)" },
  { value: "ASSIGNMENT_LEFT", label: "Assignment Left" },
] as const;

interface Commitment {
  id: string;
  assignmentId: string;
  learnerId: string;
  privateStatus: string;
  privateEvidence: any;
  networkStatus: string;
  networkEvidence: any;
  networkEvidenceHash: string | null;
  favorite: boolean;
  archived: boolean;
}

export function AssignmentCommitment({
  assignmentId,
  assignmentTitle,
  courseNftPolicyId,
  moduleCode,
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
  const [privateEvidence, setPrivateEvidence] = useState("");
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
          setPrivateEvidence(
            typeof existingCommitment.privateEvidence === "string"
              ? existingCommitment.privateEvidence
              : JSON.stringify(existingCommitment.privateEvidence, null, 2)
          );
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
            privateEvidence: privateEvidence || undefined,
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
      setPrivateEvidence("");
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
      <Card>
        <CardHeader>
          <CardTitle>Assignment Progress</CardTitle>
          <CardDescription>Connect your wallet to start this assignment</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Assignment Progress</CardTitle>
          <CardDescription>Loading your progress...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Progress</CardTitle>
        <CardDescription>Track and submit your work for "{assignmentTitle}"</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {!commitment ? (
          // No commitment yet - show create option
          <div className="space-y-4">
            <div className="text-center py-8 border-2 border-dashed rounded-lg">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                You haven't started this assignment yet
              </p>
              <Button onClick={handleCreateCommitment} disabled={isSaving}>
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
              </Button>
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
                  <Badge variant="outline">{commitment.privateStatus}</Badge>
                  {commitment.networkStatus !== "AWAITING_EVIDENCE" && (
                    <Badge>{commitment.networkStatus}</Badge>
                  )}
                </div>
              </div>
              <ConfirmDialog
                trigger={
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                }
                title="Delete Commitment"
                description="Are you sure you want to delete this assignment commitment? This action cannot be undone."
                confirmText="Delete Commitment"
                variant="destructive"
                onConfirm={handleDeleteCommitment}
                isLoading={isDeleting}
              />
            </div>

            <Separator />

            {/* Private Evidence (Notes) */}
            <div className="space-y-2">
              <Label htmlFor="privateEvidence">Your Notes (Private)</Label>
              <Textarea
                id="privateEvidence"
                placeholder="Keep track of your thoughts, progress, and notes here..."
                value={privateEvidence}
                onChange={(e) => setPrivateEvidence(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                These notes are private and only visible to you
              </p>
            </div>

            {/* Network Evidence (Public Submission) */}
            <div className="space-y-2">
              <Label htmlFor="networkEvidence">Submission Evidence</Label>
              <Textarea
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
              <Button
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
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
