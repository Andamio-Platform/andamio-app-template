"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VerifiedIcon, AlertIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioSaveButton } from "~/components/andamio/andamio-save-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle, AndamioCardDescription } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { ContentEditor } from "~/components/editor";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type { WizardStepConfig } from "../types";
import type { JSONContent } from "@tiptap/core";

interface StepAssignmentProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepAssignment({ config, direction }: StepAssignmentProps) {
  const {
    data,
    goNext,
    goPrevious,
    goToStep,
    canGoPrevious,
    refetchData,
    courseNftPolicyId,
    moduleCode,
  } = useWizard();
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const assignment = data.assignment;
  const slts = data.slts;

  const [title, setTitle] = useState(assignment?.title ?? "Module Assignment");
  const [content, setContent] = useState<JSONContent | null>(
    assignment?.contentJson ? (assignment.contentJson as JSONContent) : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track if we've done initial sync to avoid overwriting user edits
  const [hasInitializedFromAssignment, setHasInitializedFromAssignment] = useState(false);

  // Sync local state when assignment data loads from API (after refetch or initial load)
  // This handles the case where assignment is null initially, then data arrives from refetch
  useEffect(() => {
    // Debug logging to trace assignment data
    console.log("[StepAssignment] assignment changed:", {
      hasAssignment: !!assignment,
      title: assignment?.title,
      hasContentJson: !!assignment?.contentJson,
      hasInitializedFromAssignment,
    });

    // Only sync if:
    // 1. We have assignment data with a title (from DB)
    // 2. We haven't already initialized OR the user hasn't made changes
    if (assignment?.title && !hasInitializedFromAssignment) {
      setTitle(assignment.title);
      if (assignment.contentJson) {
        setContent(assignment.contentJson as JSONContent);
      }
      setHasInitializedFromAssignment(true);
      console.log("[StepAssignment] Synced state from assignment:", assignment.title);
    }
  }, [assignment, hasInitializedFromAssignment]);

  // Track unsaved changes
  useEffect(() => {
    const titleChanged = title !== (assignment?.title ?? "Module Assignment");
    const contentChanged = JSON.stringify(content) !== JSON.stringify(assignment?.contentJson ?? null);
    setHasUnsavedChanges(titleChanged || contentChanged);
  }, [title, content, assignment]);

  // Check if assignment actually exists in the database (has a saved title)
  // The API may return an empty/partial object even when no assignment record exists
  const assignmentExistsInDb = !!(
    assignment &&
    (
      typeof assignment.id === "number" ||
      (typeof assignment.title === "string" && assignment.title.trim().length > 0)
    )
  );

  const handleSave = async () => {
    if (!isAuthenticated) return;

    setIsSaving(true);
    setError(null);

    try {
      if (assignmentExistsInDb) {
        // Go API: POST /course/teacher/assignment/update
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/assignment/update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_id: courseNftPolicyId,
              course_module_code: moduleCode,
              title,
              content_json: content,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update assignment");
        }
      } else {
        // Go API: POST /course/teacher/assignment/create
        // CreateAssignmentV2Request: content_json, course_id, course_module_code, title, etc.
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/assignment/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_id: courseNftPolicyId,
              course_module_code: moduleCode,
              title,
              content_json: content,
            }),
          }
        );

        if (!response.ok) {
          // Handle 409 Conflict: assignment already exists, refetch and retry with update
          if (response.status === 409) {
            console.log("[StepAssignment] 409 Conflict: assignment exists, refetching and retrying with update");
            await refetchData();
            // After refetch, the assignment should now be available - retry as update
            const updateResponse = await authenticatedFetch(
              `/api/gateway/api/v2/course/teacher/assignment/update`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  course_id: courseNftPolicyId,
                  course_module_code: moduleCode,
                  title,
                  content_json: content,
                }),
              }
            );
            if (!updateResponse.ok) {
              throw new Error("Failed to update assignment");
            }
          } else {
            const errorData = await response.json() as { message?: string };
            throw new Error(errorData.message ?? "Failed to create assignment");
          }
        }
      }

      await refetchData();
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save assignment");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    if (hasUnsavedChanges) {
      await handleSave();
    }
    goNext();
  };

  const canProceed = assignmentExistsInDb || (title.trim().length > 0);

  return (
    <WizardStep config={config} direction={direction}>
      {/* SLT checklist for reference */}
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardTitle className="text-base">Learning Targets to Assess</AndamioCardTitle>
          <AndamioCardDescription>
            Your assignment should test these skills
          </AndamioCardDescription>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="space-y-2">
            {slts.map((slt, index) => (
              <motion.div
                key={slt.moduleIndex ?? (index + 1)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
              >
                <VerifiedIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">{slt.sltText}</span>
              </motion.div>
            ))}
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Assignment editor */}
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <AndamioCardTitle className="text-base">Assignment Content</AndamioCardTitle>
              <AndamioCardDescription>
                What will learners do to demonstrate mastery?
              </AndamioCardDescription>
            </div>
            {hasUnsavedChanges && (
              <AndamioSaveButton
                variant="outline"
                onClick={handleSave}
                isSaving={isSaving}
                compact
              />
            )}
          </div>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="space-y-2">
            <AndamioInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Assignment title"
              className="font-medium"
            />
          </div>

          <div className="min-h-[300px] border rounded-lg overflow-hidden w-full min-w-0">
            <ContentEditor
              content={content}
              onContentChange={setContent}
              minHeight="300px"
            />
          </div>
        </AndamioCardContent>
      </AndamioCard>

      <WizardStepTip>
        <strong>A great assignment is specific.</strong> Instead of &quot;Write about
        smart contracts&quot;, try &quot;Deploy a smart contract that accepts a deposit
        and refunds it after 24 hours. Submit the transaction hash and explain
        your code.&quot;
      </WizardStepTip>

      {error && (
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>{error}</AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Navigation */}
      <WizardNavigation
        onPrevious={goPrevious}
        onNext={handleContinue}
        canGoPrevious={canGoPrevious}
        canGoNext={canProceed}
        nextLabel="Add Lessons"
        canSkip={assignmentExistsInDb}
        skipLabel="Skip to Introduction"
        onSkip={() => goToStep("introduction")}
        isLoading={isSaving}
      />
    </WizardStep>
  );
}
