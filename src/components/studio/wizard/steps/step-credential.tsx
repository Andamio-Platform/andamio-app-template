"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SparkleIcon, CredentialIcon, SLTIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip, WizardStepHighlight } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import type { WizardStepConfig } from "../types";
import type { CourseModuleListResponse } from "@andamio/db-api-types";

interface StepCredentialProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepCredential({ config, direction }: StepCredentialProps) {
  const { data, goNext, canGoPrevious, goPrevious, refetchData, courseNftPolicyId, moduleCode, isNewModule, onModuleCreated } = useWizard();
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();

  const [title, setTitle] = useState(data.courseModule?.title ?? "");
  const [description, setDescription] = useState(data.courseModule?.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For new modules, we need to fetch existing modules to generate a unique code
  const [existingModules, setExistingModules] = useState<CourseModuleListResponse>([]);

  useEffect(() => {
    if (isNewModule) {
      // Go API: GET /course/public/course-modules/list/{policy_id}
      void fetch(`${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/course-modules/list/${courseNftPolicyId}`)
        .then((res) => res.ok ? res.json() as Promise<CourseModuleListResponse> : [])
        .then(setExistingModules)
        .catch(() => setExistingModules([]));
    }
  }, [isNewModule, courseNftPolicyId]);

  /**
   * Generate a unique module code based on existing modules
   */
  const generateModuleCode = () => {
    const numericCodes = existingModules
      .map((m) => parseInt(m.module_code, 10))
      .filter((n) => !isNaN(n));
    const nextNumber = numericCodes.length > 0 ? Math.max(...numericCodes) + 1 : 101;
    return String(nextNumber);
  };

  const hasChanges =
    title !== (data.courseModule?.title ?? "") ||
    description !== (data.courseModule?.description ?? "");

  const canProceed = title.trim().length > 0;

  /**
   * Create a new module (for new module mode)
   */
  const handleCreateModule = async () => {
    if (!isAuthenticated || !canProceed) return;

    setIsSaving(true);
    setError(null);

    try {
      const newModuleCode = generateModuleCode();

      // Go API: POST /course/teacher/course-module/create
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/teacher/course-module/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: newModuleCode,
            title,
            description,
            status: "DRAFT",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to create module");
      }

      // Use onModuleCreated for smooth transition without full page refresh
      // This updates state, URL (silently), refetches data, and navigates to SLTs step
      await onModuleCreated(newModuleCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Update existing module
   */
  const handleUpdateModule = async () => {
    if (!isAuthenticated || !canProceed) return;

    setIsSaving(true);
    setError(null);

    try {
      // Go API: POST /course/teacher/course-module/update
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/teacher/course-module/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            title,
            description,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save module");
      }

      await refetchData();
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    if (isNewModule) {
      await handleCreateModule();
    } else if (hasChanges) {
      await handleUpdateModule();
    } else {
      goNext();
    }
  };

  return (
    <WizardStep config={config} direction={direction}>
      {/* Philosophy explanation */}
      <WizardStepHighlight>
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Credential visualization */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="shrink-0"
          >
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <CredentialIcon className="h-12 w-12 text-primary-foreground" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-success flex items-center justify-center"
              >
                <SparkleIcon className="h-4 w-4 text-success-foreground" />
              </motion.div>
            </div>
          </motion.div>

          {/* Explanation */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">
              One Module = One Verifiable Credential
            </h3>
            <AndamioText variant="small" className="leading-relaxed">
              Each module you create becomes a{" "}
              <span className="font-medium text-foreground">
                blockchain-verified credential
              </span>{" "}
              that learners can earn and prove. The credential&apos;s value comes from
              its <span className="font-medium text-foreground">Student Learning Targets (SLTs)</span> —
              the specific skills and knowledge learners will demonstrate.
            </AndamioText>
            <div className="flex items-center gap-2 text-sm">
              <SLTIcon className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                We&apos;ll define SLTs in the next step
              </span>
            </div>
          </div>
        </div>
      </WizardStepHighlight>

      {/* Module form */}
      <AndamioCard>
        <AndamioCardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <AndamioLabel htmlFor="title">
              Module Title <span className="text-destructive">*</span>
            </AndamioLabel>
            <AndamioInput
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Smart Contracts"
              maxLength={200}
              className="text-lg"
            />
            <AndamioText variant="small" className="text-xs">
              Choose a title that captures what learners will achieve
            </AndamioText>
          </div>

          <div className="space-y-2">
            <AndamioLabel htmlFor="description">Description</AndamioLabel>
            <AndamioTextarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief overview of this module's learning journey..."
              rows={3}
            />
          </div>

          {!isNewModule && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {moduleCode}
              </span>
              <span>Module Code</span>
            </div>
          )}
        </AndamioCardContent>
      </AndamioCard>

      <WizardStepTip>
        <strong>Backwards Design:</strong> We&apos;re starting with the end in mind.
        First, you&apos;ll define what learners will achieve (SLTs), then how they&apos;ll
        prove it (assignment), then supporting content, and finally the introduction.
        It&apos;s not backwards — it&apos;s brilliant.
      </WizardStepTip>

      {error && (
        <div className="text-sm text-destructive">{error}</div>
      )}

      {/* Navigation */}
      <WizardNavigation
        onPrevious={goPrevious}
        onNext={handleContinue}
        canGoPrevious={canGoPrevious}
        canGoNext={canProceed}
        nextLabel={isNewModule ? "Create Module" : "Define Learning Targets"}
        isLoading={isSaving}
      />
    </WizardStep>
  );
}
