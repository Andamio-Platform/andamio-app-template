"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useStudioHeader } from "~/components/layout/studio-header";
import { useModuleWizardData } from "~/hooks/api/course/use-module-wizard-data";
import { useWizardNavigation, STEP_ORDER } from "~/hooks/ui/use-wizard-navigation";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import {
  StudioOutlinePanel,
  MODULE_WIZARD_STEPS,
  type OutlineStep,
} from "~/components/studio/studio-outline-panel";
import { StudioEditorPane } from "~/components/studio/studio-editor-pane";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/andamio/andamio-resizable";
import {
  AndamioButton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioScrollArea,
  AndamioStudioLoading,
} from "~/components/andamio";
import {
  AlertIcon,
  PreviousIcon,
  NextIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import type { CourseModuleResponse, CourseResponse } from "~/types/generated";

// Import wizard step components
import { StepCredential } from "~/components/studio/wizard/steps/step-credential";
import { StepSLTs } from "~/components/studio/wizard/steps/step-slts";
import { StepAssignment } from "~/components/studio/wizard/steps/step-assignment";
import { StepLessons } from "~/components/studio/wizard/steps/step-lessons";
import { StepIntroduction } from "~/components/studio/wizard/steps/step-introduction";
import { StepReview } from "~/components/studio/wizard/steps/step-review";
import { WIZARD_STEPS } from "~/components/studio/wizard/wizard-stepper";
import {
  WizardContext,
  type WizardStepId,
  type WizardContextValue,
} from "~/components/studio/wizard/types";
import { useState } from "react";

/**
 * Module Wizard Content - The main wizard UI
 *
 * This component is rendered only after RequireCourseAccess
 * verifies the user has owner or teacher access to the course.
 */
function ModuleWizardContent({
  courseNftPolicyId,
  moduleCode,
  isNewModule,
}: {
  courseNftPolicyId: string;
  moduleCode: string;
  isNewModule: boolean;
}) {
  const { setBreadcrumbs, setTitle, setStatus, setActions } = useStudioHeader();
  const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);

  // Track the created module code for smooth transitions after creation
  // This allows us to update the URL silently without triggering a full page refresh
  const [createdModuleCode, setCreatedModuleCode] = useState<string | null>(null);

  // The effective module code is the created one (if exists) or the URL param
  const effectiveModuleCode = createdModuleCode ?? moduleCode;
  const effectiveIsNewModule = isNewModule && !createdModuleCode;

  // Handle header updates when data loads
  const handleDataLoaded = useCallback(
    (course: CourseResponse | null, courseModule: CourseModuleResponse | null) => {
      const courseTitle = typeof course?.content?.title === "string" ? course.content.title : "Course";
      if (isNewModule) {
        setBreadcrumbs([
          { label: "Course Studio", href: "/studio/course" },
          { label: courseTitle, href: `/studio/course/${courseNftPolicyId}` },
          { label: "New Module" },
        ]);
        setTitle("New Module");
      } else {
        setBreadcrumbs([
          { label: "Course Studio", href: "/studio/course" },
          { label: courseTitle, href: `/studio/course/${courseNftPolicyId}` },
          { label: courseModule?.title ?? moduleCode },
        ]);
        setTitle(courseModule?.title ?? "Module");
        if (courseModule?.module_status) {
          setStatus(courseModule.module_status, courseModule.module_status === "ON_CHAIN" ? "default" : "secondary");
        }
      }
    },
    [courseNftPolicyId, isNewModule, moduleCode, setBreadcrumbs, setTitle, setStatus]
  );

  // Data fetching hook - uses effective values to support smooth transitions after module creation
  const { data, completion, refetchData, updateSlts } = useModuleWizardData({
    courseNftPolicyId,
    moduleCode: effectiveModuleCode,
    isNewModule: effectiveIsNewModule,
    onDataLoaded: handleDataLoaded,
  });

  // Navigation hook
  const {
    currentStep,
    direction,
    currentIndex,
    canGoNext,
    canGoPrevious,
    goToStep,
    goNext,
    goPrevious,
    getStepStatus,
    isStepUnlocked,
  } = useWizardNavigation({ completion });

  /**
   * Handle module creation - updates URL silently and refetches data
   * This prevents a full page refresh when transitioning from /new to the actual module code
   */
  const onModuleCreated = useCallback(
    async (newModuleCode: string) => {
      // Update state to track the created module
      setCreatedModuleCode(newModuleCode);

      // Update URL silently without triggering Next.js route change
      const newUrl = `/studio/course/${courseNftPolicyId}/${newModuleCode}?step=slts`;
      window.history.replaceState(null, "", newUrl);

      // Refetch data for the newly created module
      await refetchData(newModuleCode);

      // Navigate to SLTs step
      goToStep("slts");
    },
    [courseNftPolicyId, refetchData, goToStep]
  );

  // Build outline steps for the panel
  const outlineSteps: OutlineStep[] = useMemo(
    () =>
      MODULE_WIZARD_STEPS.map((step) => ({
        ...step,
        isComplete: completion[step.id as WizardStepId],
        isActive: currentStep === step.id,
        isLocked: !isStepUnlocked(step.id as WizardStepId),
        count: step.id === "slts" ? data.slts.length : step.id === "lessons" ? data.lessons.length : undefined,
      })),
    [completion, currentStep, isStepUnlocked, data.slts.length, data.lessons.length]
  );

  // Build wizard context
  const contextValue: WizardContextValue = useMemo(
    () => ({
      currentStep,
      goToStep,
      goNext,
      goPrevious,
      canGoNext,
      canGoPrevious,
      getStepStatus,
      isStepUnlocked,
      completion,
      data,
      refetchData,
      updateSlts,
      courseNftPolicyId,
      moduleCode: effectiveModuleCode,
      isNewModule: effectiveIsNewModule,
      createdModuleCode,
      onModuleCreated,
    }),
    [
      currentStep,
      goToStep,
      goNext,
      goPrevious,
      canGoNext,
      canGoPrevious,
      getStepStatus,
      isStepUnlocked,
      completion,
      data,
      refetchData,
      updateSlts,
      courseNftPolicyId,
      effectiveModuleCode,
      effectiveIsNewModule,
      createdModuleCode,
      onModuleCreated,
    ]
  );

  // Update header with contextual navigation actions
  useEffect(() => {
    const currentConfig = WIZARD_STEPS.find((s) => s.id === currentStep);
    setActions(
      <div className="flex items-center gap-2">
        {/* Step Navigation */}
        <div className="flex items-center gap-1 mr-2">
          <AndamioButton
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={goPrevious}
            disabled={!canGoPrevious}
          >
            <PreviousIcon className="h-4 w-4" />
          </AndamioButton>
          <span className="text-xs text-muted-foreground min-w-[60px] text-center">
            {currentConfig?.title ?? "Step"} ({currentIndex + 1}/{STEP_ORDER.length})
          </span>
          <AndamioButton
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={goNext}
            disabled={!canGoNext}
          >
            <NextIcon className="h-4 w-4" />
          </AndamioButton>
        </div>

        {/* On-Chain Link */}
        {data.courseModule?.module_status === "ON_CHAIN" && (
          <AndamioButton
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            asChild
          >
            <a
              href={`https://preprod.cardanoscan.io/token/${courseNftPolicyId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="h-3.5 w-3.5 mr-1" />
              View On-Chain
            </a>
          </AndamioButton>
        )}
      </div>
    );
  }, [setActions, data.courseModule, courseNftPolicyId, currentStep, currentIndex, canGoPrevious, canGoNext, goPrevious, goNext]);

  // Loading state
  if (data.isLoading) {
    return <AndamioStudioLoading variant="split-pane" />;
  }

  // Error state
  if (data.error) {
    return (
      <StudioEditorPane padding="normal">
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>{data.error}</AndamioAlertDescription>
        </AndamioAlert>
      </StudioEditorPane>
    );
  }

  const currentConfig = WIZARD_STEPS.find((s) => s.id === currentStep)!;

  return (
    <WizardContext.Provider value={contextValue}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel: Step Outline */}
        <ResizablePanel
          defaultSize={20}
          minSize={15}
          maxSize={30}
          collapsible
          collapsedSize={0}
          onCollapse={() => setIsOutlineCollapsed(true)}
          onExpand={() => setIsOutlineCollapsed(false)}
        >
          <StudioOutlinePanel
            steps={outlineSteps}
            onStepClick={(stepId) => goToStep(stepId as WizardStepId)}
            isCollapsed={isOutlineCollapsed}
            onCollapsedChange={setIsOutlineCollapsed}
            title="Module Steps"
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel: Step Content */}
        <ResizablePanel defaultSize={80}>
          <AndamioScrollArea className="h-full">
            <div className="p-4">
              <AnimatePresence mode="wait" custom={direction}>
              {currentStep === "credential" && (
                <StepCredential key="credential" config={currentConfig} direction={direction} />
              )}
              {currentStep === "slts" && (
                <StepSLTs key="slts" config={currentConfig} direction={direction} />
              )}
              {currentStep === "assignment" && (
                <StepAssignment key="assignment" config={currentConfig} direction={direction} />
              )}
              {currentStep === "lessons" && (
                <StepLessons key="lessons" config={currentConfig} direction={direction} />
              )}
              {currentStep === "introduction" && (
                <StepIntroduction key="introduction" config={currentConfig} direction={direction} />
              )}
              {currentStep === "review" && (
                <StepReview key="review" config={currentConfig} direction={direction} />
              )}
              </AnimatePresence>
            </div>
          </AndamioScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </WizardContext.Provider>
  );
}

/**
 * Studio Module Edit Page
 *
 * Dense split-pane layout with wizard for editing course modules.
 *
 * Authorization: Only accessible to users who are:
 * - Course owner (created the course)
 * - Course teacher (listed as contributor)
 */
export default function StudioModuleEditPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const isNewModule = moduleCode === "new";

  return (
    <RequireCourseAccess
      courseNftPolicyId={courseNftPolicyId}
      title="Edit Module"
      description="Connect your wallet to edit this course module"
      loadingVariant="studio-split"
    >
      <ModuleWizardContent
        courseNftPolicyId={courseNftPolicyId}
        moduleCode={moduleCode}
        isNewModule={isNewModule}
      />
    </RequireCourseAccess>
  );
}
