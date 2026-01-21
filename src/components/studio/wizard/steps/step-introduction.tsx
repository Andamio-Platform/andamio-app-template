"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertIcon, TipIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip, WizardStepHighlight } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioSaveButton } from "~/components/andamio/andamio-save-button";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle, AndamioCardDescription } from "~/components/andamio/andamio-card";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentEditor } from "~/components/editor";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import type { WizardStepConfig } from "../types";
import type { JSONContent } from "@tiptap/core";

interface StepIntroductionProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepIntroduction({ config, direction }: StepIntroductionProps) {
  const {
    data,
    goNext,
    goPrevious,
    canGoPrevious,
    refetchData,
    courseNftPolicyId,
    moduleCode,
  } = useWizard();
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const introduction = data.introduction;
  const slts = data.slts;
  const moduleTitle = data.courseModule?.title ?? "";

  const [title, setTitle] = useState(introduction?.title ?? `Welcome to ${moduleTitle}`);
  const [content, setContent] = useState<JSONContent | null>(
    introduction?.content_json ? (introduction.content_json as JSONContent) : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track unsaved changes
  useEffect(() => {
    const titleChanged = title !== (introduction?.title ?? `Welcome to ${moduleTitle}`);
    const contentChanged = JSON.stringify(content) !== JSON.stringify(introduction?.content_json ?? null);
    setHasUnsavedChanges(titleChanged || contentChanged);
  }, [title, content, introduction, moduleTitle]);

  const handleSave = async () => {
    if (!isAuthenticated) return;

    setIsSaving(true);
    setError(null);

    try {
      if (introduction) {
        // Go API: POST /course/teacher/introduction/update
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/introduction/update`,
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
          throw new Error("Failed to update introduction");
        }
      } else {
        // Go API: POST /course/teacher/introduction/create
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/introduction/create`,
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
          const errorData = await response.json() as { message?: string };
          throw new Error(errorData.message ?? "Failed to create introduction");
        }
      }

      await refetchData();
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save introduction");
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

  const canProceed = !!data.introduction || title.trim().length > 0;

  // Generate introduction suggestions based on SLTs
  const generateSuggestion = () => {
    if (slts.length === 0) return null;

    const sltList = slts.map((slt) => `• ${slt.slt_text}`).join("\n");
    return `In this module, you'll learn to:\n\n${sltList}\n\nBy the end, you'll have completed an assignment that demonstrates your mastery of these skills.`;
  };

  const suggestion = generateSuggestion();

  return (
    <WizardStep config={config} direction={direction}>
      {/* Backwards design payoff */}
      <WizardStepHighlight>
        <div className="flex items-start gap-4">
          <motion.div
            initial={{ rotate: -10, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", damping: 10 }}
          >
            <TipIcon className="h-8 w-8 text-warning" />
          </motion.div>
          <div>
            <h3 className="font-semibold mb-1">The Backwards Design Payoff</h3>
            <AndamioText variant="small">
              Now that you know exactly what learners will achieve ({slts.length} SLTs)
              and how they&apos;ll prove it (the assignment), writing the introduction
              is easy. You already know the whole story!
            </AndamioText>
          </div>
        </div>
      </WizardStepHighlight>

      {/* Introduction editor */}
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <AndamioCardTitle className="text-base">Module Introduction</AndamioCardTitle>
              <AndamioCardDescription>
                Set the stage for learners
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
              placeholder="Introduction title"
              className="font-medium"
            />
          </div>

          <div className="min-h-[300px] border rounded-lg overflow-hidden">
            <ContentEditor
              content={content}
              onContentChange={setContent}
              minHeight="300px"
            />
          </div>
        </AndamioCardContent>
      </AndamioCard>

      {/* Suggestion */}
      {suggestion && !content && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-muted/50 rounded-lg border border-dashed"
        >
          <AndamioText variant="small" className="text-xs font-medium mb-2">
            Not sure where to start? Here&apos;s a template:
          </AndamioText>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
            {suggestion}
          </pre>
        </motion.div>
      )}

      <WizardStepTip>
        <strong>Keep it welcoming.</strong> The introduction sets the tone. Tell learners
        what they&apos;ll accomplish, why it matters, and what to expect. You&apos;ve already
        defined the &quot;what&quot; — now add the &quot;why&quot; and &quot;how.&quot;
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
        nextLabel="Review & Approve"
        isLoading={isSaving}
      />
    </WizardStep>
  );
}
