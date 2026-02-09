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
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioDialog,
  AndamioDialogContent,
  AndamioDialogHeader,
  AndamioDialogTitle,
  AndamioDialogDescription,
  AndamioDialogFooter,
} from "~/components/andamio/andamio-dialog";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCreateCourseModule, useUpdateCourseModule, useTeacherCourseModules } from "~/hooks/api/course/use-course-module";
import { useSaveModuleDraft } from "~/hooks/api/course/use-save-module-draft";
import type { WizardStepConfig } from "../types";
import type { ModuleDraft } from "~/stores/module-draft-store";


interface StepCredentialProps {
  config: WizardStepConfig;
  direction: number;
}

export function StepCredential({ config, direction }: StepCredentialProps) {
  const { data, goNext, canGoPrevious, goPrevious, refetchData, courseId, moduleCode, isNewModule, onModuleCreated } = useWizard();
  const { isAuthenticated } = useAndamioAuth();

  const [title, setTitle] = useState(
    typeof data.courseModule?.title === "string" ? data.courseModule.title : ""
  );
  const [description, setDescription] = useState(
    typeof data.courseModule?.description === "string" ? data.courseModule.description : ""
  );
  const [error, setError] = useState<string | null>(null);

  // Use hooks for API calls
  const createModule = useCreateCourseModule();
  const updateModule = useUpdateCourseModule();
  const saveModuleDraft = useSaveModuleDraft();

  // Duplicate module state
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [duplicateModuleCode, setDuplicateModuleCode] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const router = useRouter();

  // For new modules, fetch existing modules to generate a unique code (use teacher endpoint to see drafts)
  const { data: existingModules = [] } = useTeacherCourseModules(courseId);

  /**
   * Generate a unique module code based on existing modules
   */
  const generateModuleCode = () => {
    const numericCodes = existingModules
      .map((m) => parseInt(m.moduleCode ?? "", 10))
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
    (m) => m.moduleCode === editableModuleCode && m.moduleCode !== moduleCode
  );

  // Check if duplicate module code already exists
  const duplicateCodeExists = existingModules.some(
    (m) => m.moduleCode === duplicateModuleCode
  );

  // Check if module is locked (approved or on-chain)
  const moduleStatus = data.courseModule?.status;
  const isModuleLocked = moduleStatus === "approved" || moduleStatus === "active" || moduleStatus === "pending_tx";

  const hasChanges =
    title !== (typeof data.courseModule?.title === "string" ? data.courseModule.title : "") ||
    description !== (typeof data.courseModule?.description === "string" ? data.courseModule.description : "");

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
        courseId: courseId,
        moduleCode: editableModuleCode.trim(),
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
        courseId: courseId,
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
   *
   * Uses the aggregate-update endpoint to copy all content in a single request
   * after creating the new module shell.
   */
  const handleDuplicateModule = async () => {
    if (!isAuthenticated || !duplicateModuleCode.trim() || duplicateCodeExists) return;

    setIsDuplicating(true);
    setError(null);

    try {
      const newCode = duplicateModuleCode.trim();

      // 1. Create new module with DRAFT status
      await createModule.mutateAsync({
        courseId: courseId,
        moduleCode: newCode,
        title: `${title} (Copy)`,
        description,
      });

      // 2. Use aggregate-update to copy all content in a single request
      const draft: ModuleDraft = {
        courseId: courseId,
        moduleCode: newCode,
        title: `${title} (Copy)`,
        description,
        slts: data.slts.map((slt, idx) => ({
          _localId: `dup-slt-${idx}`,
          sltText: slt.sltText ?? "",
          moduleIndex: slt.moduleIndex ?? idx + 1,
          _isNew: true,
        })),
        assignment: data.assignment ? {
          title: data.assignment.title ?? "",
          description: data.assignment.description,
          contentJson: data.assignment.contentJson,
          imageUrl: data.assignment.imageUrl,
          videoUrl: data.assignment.videoUrl,
          _isNew: true,
        } : null,
        introduction: data.introduction ? {
          title: data.introduction.title ?? "",
          description: data.introduction.description,
          contentJson: data.introduction.contentJson,
          imageUrl: data.introduction.imageUrl,
          videoUrl: data.introduction.videoUrl,
          _isNew: true,
        } : null,
        lessons: new Map(
          data.lessons.map((lesson) => [
            lesson.sltIndex ?? 1,
            {
              title: lesson.title ?? "",
              description: lesson.description,
              contentJson: lesson.contentJson,
              sltIndex: lesson.sltIndex ?? 1,
              imageUrl: lesson.imageUrl,
              videoUrl: lesson.videoUrl,
              _isNew: true,
            },
          ])
        ),
      };

      const result = await saveModuleDraft.mutateAsync(draft);
      if (!result.success) {
        throw new Error(result.error ?? "Failed to copy module content");
      }

      // Close dialog and navigate to new module
      setShowDuplicateDialog(false);
      setDuplicateModuleCode("");
      router.push(`/studio/course/${courseId}/${newCode}`);
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
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              >
                <SparkleIcon className="h-4 w-4 text-primary-foreground" />
              </motion.div>
            </div>
          </motion.div>

          {/* Explanation */}
          <div className="space-y-3">
            <AndamioHeading level={3} size="lg">
              One Module = One Verifiable Credential
            </AndamioHeading>
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
