"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SparkleIcon, CredentialIcon, SLTIcon, CopyIcon } from "~/components/icons";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip, WizardStepHighlight } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { AndamioInput } from "~/components/andamio/andamio-input";
import { AndamioTextarea } from "~/components/andamio/andamio-textarea";
import { AndamioLabel } from "~/components/andamio/andamio-label";
import { AndamioCard, AndamioCardContent } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogHeader,
  AndamioDialogTitle,
  AndamioDialogDescription,
  AndamioDialogFooter,
} from "~/components/andamio/andamio-dialog";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useCreateCourseModule, useUpdateCourseModule, useCourseModules } from "~/hooks/api/use-course-module";
import { useCreateSLT } from "~/hooks/api/use-slt";
import { useCreateLesson } from "~/hooks/api/use-lesson";
import type { WizardStepConfig } from "../types";

interface StepCredentialProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepCredential({ config, direction }: StepCredentialProps) {
  const { data, goNext, canGoPrevious, goPrevious, refetchData, courseNftPolicyId, moduleCode, isNewModule, onModuleCreated } = useWizard();
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  const [title, setTitle] = useState(data.courseModule?.title ?? "");
  const [description, setDescription] = useState(data.courseModule?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  // Use hooks for API calls
  const createModule = useCreateCourseModule();
  const updateModule = useUpdateCourseModule();
  const createSLT = useCreateSLT();
  const createLesson = useCreateLesson();

  // Duplicate module state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateModuleCode, setDuplicateModuleCode] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const router = useRouter();

  // For new modules, fetch existing modules to generate a unique code
  const { data: existingModules = [] } = useCourseModules(courseNftPolicyId);

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

  // Module code state - for new modules, generate a default; for existing, use current value
  const [editableModuleCode, setEditableModuleCode] = useState(() => {
    if (isNewModule) {
      return ""; // Will be set once existingModules loads
    }
    return moduleCode ?? "";
  });

  // Update the generated code when existingModules loads (for new modules)
  React.useEffect(() => {
    if (isNewModule && existingModules.length >= 0 && !editableModuleCode) {
      setEditableModuleCode(generateModuleCode());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNewModule, existingModules]);

  // Check if module code already exists
  const moduleCodeExists = existingModules.some(
    (m) => m.module_code === editableModuleCode && m.module_code !== moduleCode
  );

  // Check if duplicate module code already exists
  const duplicateCodeExists = existingModules.some(
    (m) => m.module_code === duplicateModuleCode
  );

  // Check if module is locked (approved or on-chain)
  const moduleStatus = data.courseModule?.status;
  const isModuleLocked = moduleStatus === "APPROVED" || moduleStatus === "ON_CHAIN" || moduleStatus === "PENDING_TX";

  const hasChanges =
    title !== (data.courseModule?.title ?? "") ||
    description !== (data.courseModule?.description ?? "");

  const canProceed = title.trim().length > 0 && editableModuleCode.trim().length > 0 && !moduleCodeExists;
  const isSaving = createModule.isPending || updateModule.isPending;

  /**
   * Create a new module (for new module mode)
   */
  const handleCreateModule = async () => {
    if (!isAuthenticated || !canProceed) return;

    setError(null);

    try {
      await createModule.mutateAsync({
        course_nft_policy_id: courseNftPolicyId,
        module_code: editableModuleCode.trim(),
        title,
        description,
      });

      // Use onModuleCreated for smooth transition without full page refresh
      // This updates state, URL (silently), refetches data, and navigates to SLTs step
      await onModuleCreated(editableModuleCode.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create module");
    }
  };

  /**
   * Update existing module
   */
  const handleUpdateModule = async () => {
    if (!isAuthenticated || !canProceed || !moduleCode) return;

    setError(null);

    try {
      await updateModule.mutateAsync({
        courseNftPolicyId,
        moduleCode,
        data: { title, description },
      });

      await refetchData();
      goNext();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  };

  /**
   * Duplicate module with all its content
   */
  const handleDuplicateModule = async () => {
    if (!isAuthenticated || !duplicateModuleCode.trim() || duplicateCodeExists) return;

    setIsDuplicating(true);
    setError(null);

    try {
      const newCode = duplicateModuleCode.trim();

      // 1. Create new module with DRAFT status
      await createModule.mutateAsync({
        course_nft_policy_id: courseNftPolicyId,
        module_code: newCode,
        title: `${title} (Copy)`,
        description,
      });

      // 2. Copy SLTs (if any) - must be done sequentially to maintain order
      if (data.slts.length > 0) {
        for (const slt of data.slts) {
          await createSLT.mutateAsync({
            courseNftPolicyId,
            moduleCode: newCode,
            moduleIndex: slt.module_index,
            sltText: slt.slt_text,
          });
        }
      }

      // 3. Copy assignment (if exists) - use direct API call
      if (data.assignment) {
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/assignment/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              policy_id: courseNftPolicyId,
              module_code: newCode,
              title: data.assignment.title,
              content_json: data.assignment.content_json,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to copy assignment: ${response.statusText}`);
        }
      }

      // 4. Copy lessons (if any)
      if (data.lessons.length > 0) {
        for (const lesson of data.lessons) {
          await createLesson.mutateAsync({
            courseNftPolicyId,
            moduleCode: newCode,
            moduleIndex: lesson.module_index,
            title: lesson.title,
            contentJson: lesson.content_json as object | undefined,
          });
        }
      }

      // 5. Copy introduction (if exists) - use direct API call
      if (data.introduction) {
        const response = await authenticatedFetch(
          `/api/gateway/api/v2/course/teacher/introduction/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              policy_id: courseNftPolicyId,
              module_code: newCode,
              title: data.introduction.title,
              content_json: data.introduction.content_json,
            }),
          }
        );
        if (!response.ok) {
          throw new Error(`Failed to copy introduction: ${response.statusText}`);
        }
      }

      // Close dialog and navigate to new module
      setShowDuplicateDialog(false);
      setDuplicateModuleCode("");
      router.push(`/studio/course/${courseNftPolicyId}/${newCode}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate module");
    } finally {
      setIsDuplicating(false);
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
          <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
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
              <AndamioLabel htmlFor="moduleCode">
                Module Code <span className="text-destructive">*</span>
              </AndamioLabel>
              <div className="flex items-center gap-2">
                <AndamioInput
                  id="moduleCode"
                  value={editableModuleCode}
                  onChange={(e) => setEditableModuleCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                  placeholder="e.g., 101"
                  maxLength={20}
                  className="font-mono w-32"
                  disabled={isModuleLocked || !isNewModule}
                />
                {!isNewModule && (
                  <AndamioButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDuplicateModuleCode(generateModuleCode());
                      setShowDuplicateDialog(true);
                    }}
                    title="Duplicate this module with a new code"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </AndamioButton>
                )}
              </div>
              {moduleCodeExists && (
                <AndamioText variant="small" className="text-destructive text-xs">
                  This code already exists
                </AndamioText>
              )}
              {!isNewModule && !isModuleLocked && (
                <AndamioText variant="small" className="text-xs">
                  Code cannot be changed — duplicate instead
                </AndamioText>
              )}
              {isModuleLocked && (
                <AndamioText variant="small" className="text-xs">
                  Module is approved — duplicate to make changes
                </AndamioText>
              )}
            </div>
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

      {/* Duplicate Module Dialog */}
      <AndamioDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AndamioDialogContent>
          <AndamioDialogHeader>
            <AndamioDialogTitle>Duplicate Module</AndamioDialogTitle>
            <AndamioDialogDescription>
              Create a copy of this module with all its content (SLTs, assignment, lessons, introduction).
              The new module will start as a Draft.
            </AndamioDialogDescription>
          </AndamioDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <AndamioLabel htmlFor="duplicateCode">New Module Code</AndamioLabel>
              <AndamioInput
                id="duplicateCode"
                value={duplicateModuleCode}
                onChange={(e) => setDuplicateModuleCode(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                placeholder="e.g., 102"
                maxLength={20}
                className="font-mono"
              />
              {duplicateCodeExists && (
                <AndamioText variant="small" className="text-destructive text-xs">
                  This code already exists
                </AndamioText>
              )}
            </div>

            <div className="rounded-lg border bg-muted/50 p-3 space-y-1">
              <AndamioText variant="small" className="font-medium">Will be copied:</AndamioText>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                <li>• Module title: &quot;{title} (Copy)&quot;</li>
                <li>• {data.slts.length} SLT{data.slts.length !== 1 ? "s" : ""}</li>
                <li>• {data.assignment ? "Assignment" : "No assignment"}</li>
                <li>• {data.lessons.length} lesson{data.lessons.length !== 1 ? "s" : ""}</li>
                <li>• {data.introduction ? "Introduction" : "No introduction"}</li>
              </ul>
            </div>
          </div>

          <AndamioDialogFooter>
            <AndamioButton
              variant="outline"
              onClick={() => {
                setShowDuplicateDialog(false);
                setDuplicateModuleCode("");
              }}
              disabled={isDuplicating}
            >
              Cancel
            </AndamioButton>
            <AndamioButton
              onClick={handleDuplicateModule}
              disabled={!duplicateModuleCode.trim() || duplicateCodeExists || isDuplicating}
              isLoading={isDuplicating}
            >
              <CopyIcon className="h-4 w-4 mr-2" />
              Duplicate Module
            </AndamioButton>
          </AndamioDialogFooter>
        </AndamioDialogContent>
      </AndamioDialog>
    </WizardStep>
  );
}
