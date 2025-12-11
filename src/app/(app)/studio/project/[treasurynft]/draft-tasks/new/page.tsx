"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAuthButton } from "~/components/auth/andamio-auth-button";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { ContentEditor } from "~/components/editor";
import { AlertCircle, ArrowLeft, Plus, Save, X } from "lucide-react";
import type { JSONContent } from "@tiptap/core";
import { AndamioPageHeader } from "~/components/andamio";

interface ApiError {
  message?: string;
}

/**
 * Create New Task Page
 *
 * API Endpoint: POST /tasks/create (protected)
 */
export default function NewTaskPage() {
  const params = useParams();
  const router = useRouter();
  const treasuryNftPolicyId = params.treasurynft as string;
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lovelace, setLovelace] = useState("1000000"); // Default 1 ADA
  const [expirationTime, setExpirationTime] = useState("");
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([""]);
  const [numAllowedCommitments, setNumAllowedCommitments] = useState(1);

  // Content state for editor
  const [contentJson, setContentJson] = useState<JSONContent | null>(null);

  const handleContentChange = (content: JSONContent) => {
    setContentJson(content);
  };

  // Save state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Acceptance criteria handlers
  const addCriterion = () => {
    setAcceptanceCriteria([...acceptanceCriteria, ""]);
  };

  const updateCriterion = (index: number, value: string) => {
    const updated = [...acceptanceCriteria];
    updated[index] = value;
    setAcceptanceCriteria(updated);
  };

  const removeCriterion = (index: number) => {
    if (acceptanceCriteria.length > 1) {
      setAcceptanceCriteria(acceptanceCriteria.filter((_, i) => i !== index));
    }
  };

  // Calculate ADA from lovelace
  const adaValue = (parseInt(lovelace) || 0) / 1_000_000;

  // Form validation
  const isValid =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    parseInt(lovelace) >= 1000000 &&
    expirationTime.trim().length > 0 &&
    acceptanceCriteria.filter((c) => c.trim().length > 0).length > 0;

  const handleCreate = async () => {
    if (!isAuthenticated || !isValid) return;

    setIsSaving(true);
    setError(null);

    try {
      // Filter out empty acceptance criteria
      const validCriteria = acceptanceCriteria.filter((c) => c.trim().length > 0);

      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/tasks/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            treasury_nft_policy_id: treasuryNftPolicyId,
            title: title.trim(),
            description: description.trim(),
            lovelace: lovelace,
            expiration_time: expirationTime,
            acceptance_criteria: validCriteria,
            num_allowed_commitments: numAllowedCommitments,
            content_json: contentJson,
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as ApiError;
        throw new Error(errorData.message ?? "Failed to create task");
      }

      // Redirect to draft tasks list
      router.push(`/studio/project/${treasuryNftPolicyId}/draft-tasks`);
    } catch (err) {
      console.error("Error creating task:", err);
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSaving(false);
    }
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tasks
          </AndamioButton>
        </Link>

        <AndamioPageHeader
          title="Create Task"
          description="Connect your wallet to create tasks"
        />

        <div className="max-w-md">
          <AndamioAuthButton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tasks
          </AndamioButton>
        </Link>
        <AndamioBadge variant="secondary">Draft</AndamioBadge>
      </div>

      <AndamioPageHeader
        title="Create New Task"
        description="Define a new task for contributors"
      />

      {/* Error Message */}
      {error && (
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Task Form */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Task Details</AndamioCardTitle>
          <AndamioCardDescription>
            Fill in the task information. Task will be saved as a draft.
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">Title *</AndamioLabel>
            <AndamioInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="description">Description *</AndamioLabel>
            <AndamioTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the task"
              maxLength={360}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">{description.length}/360 characters</p>
          </div>

          {/* Rich Content */}
          <div className="space-y-2">
            <AndamioLabel>Detailed Content (Optional)</AndamioLabel>
            <p className="text-xs text-muted-foreground mb-2">
              Add detailed instructions, examples, or resources for the task
            </p>
            <ContentEditor
              content={contentJson}
              onContentChange={handleContentChange}
              minHeight="200px"
              placeholder="Add detailed task instructions..."
            />
          </div>

          {/* Reward (Lovelace) */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="lovelace">Reward Amount (ADA) *</AndamioLabel>
            <div className="flex items-center gap-2">
              <AndamioInput
                id="lovelace"
                type="number"
                value={adaValue}
                onChange={(e) => {
                  const ada = parseFloat(e.target.value) || 0;
                  setLovelace(Math.floor(ada * 1_000_000).toString());
                }}
                min={1}
                step={0.1}
              />
              <span className="text-sm text-muted-foreground">ADA</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum 1 ADA ({lovelace} lovelace)
            </p>
          </div>

          {/* Expiration Time */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="expiration">Expiration Time (POSIX Timestamp) *</AndamioLabel>
            <AndamioInput
              id="expiration"
              value={expirationTime}
              onChange={(e) => setExpirationTime(e.target.value)}
              placeholder="e.g., 1735689600000"
            />
            <p className="text-xs text-muted-foreground">
              POSIX timestamp in milliseconds. Current time: {Date.now()}
            </p>
          </div>

          {/* Number of Commitments */}
          <div className="space-y-2">
            <AndamioLabel htmlFor="commitments">Number of Allowed Commitments</AndamioLabel>
            <AndamioInput
              id="commitments"
              type="number"
              value={numAllowedCommitments}
              onChange={(e) => setNumAllowedCommitments(parseInt(e.target.value) || 1)}
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              How many contributors can commit to this task
            </p>
          </div>

          {/* Acceptance Criteria */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <AndamioLabel>Acceptance Criteria *</AndamioLabel>
              <AndamioButton variant="outline" size="sm" onClick={addCriterion}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </AndamioButton>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Define what contributors must deliver to complete the task
            </p>
            <div className="space-y-2">
              {acceptanceCriteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2">
                  <AndamioInput
                    value={criterion}
                    onChange={(e) => updateCriterion(index, e.target.value)}
                    placeholder={`Criterion ${index + 1}`}
                  />
                  {acceptanceCriteria.length > 1 && (
                    <AndamioButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCriterion(index)}
                    >
                      <X className="h-4 w-4" />
                    </AndamioButton>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Link href={`/studio/project/${treasuryNftPolicyId}/draft-tasks`}>
              <AndamioButton variant="outline">Cancel</AndamioButton>
            </Link>
            <AndamioButton onClick={handleCreate} disabled={isSaving || !isValid}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Creating..." : "Create Task"}
            </AndamioButton>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
