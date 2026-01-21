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
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
  const assignmentCode = `${moduleCode}-ASSIGNMENT`;

  const [title, setTitle] = useState(assignment?.title ?? "Module Assignment");
  const [content, setContent] = useState<JSONContent | null>(
    assignment?.content_json ? (assignment.content_json as JSONContent) : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const titleChanged = title !== (assignment?.title ?? "Module Assignment");
    const contentChanged = JSON.stringify(content) !== JSON.stringify(assignment?.content_json ?? null);
    setHasUnsavedChanges(titleChanged || contentChanged);
  }, [title, content, assignment]);

  const handleSave = async () => {
    if (!isAuthenticated) return;

    setIsSaving(true);
    setError(null);

    try {
      if (assignment) {
        // Go API: POST /course/teacher/assignment/update
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/assignment/update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_id: courseNftPolicyId,
              course_module_code: moduleCode,
              assignment_code: assignmentCode,
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
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/assignment/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_id: courseNftPolicyId,
              course_module_code: moduleCode,
              assignment_code: assignmentCode,
              title,
              content_json: content,
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json() as { message?: string };
          throw new Error(errorData.message ?? "Failed to create assignment");
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

  const canProceed = !!data.assignment || (title.trim().length > 0);

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
                key={slt.module_index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-2 rounded-lg bg-muted/50"
              >
                <VerifiedIcon className="h-4 w-4 text-success mt-0.5 shrink-0" />
                <span className="text-sm">{slt.slt_text}</span>
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
        canSkip={!!data.assignment}
        skipLabel="Skip to Introduction"
        onSkip={() => goToStep("introduction")}
        isLoading={isSaving}
      />
    </WizardStep>
  );
}
