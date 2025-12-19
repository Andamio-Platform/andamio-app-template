"use client";

import React, { useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useStudioHeader } from "~/components/layout/studio-header";
import { useModuleWizardData } from "~/hooks/use-module-wizard-data";
import { useWizardNavigation, STEP_ORDER } from "~/hooks/use-wizard-navigation";
import { RequireCourseAccess } from "~/components/auth/require-course-access";
import {
  StudioOutlinePanel,
  MODULE_WIZARD_STEPS,
  type OutlineStep,
} from "~/components/studio/studio-outline-panel";
import { StudioEditorPane, StudioActionBar } from "~/components/studio/studio-editor-pane";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "~/components/andamio/andamio-resizable";
import {
  AndamioButton,
  AndamioBadge,
  AndamioSkeleton,
  AndamioAlert,
  AndamioAlertDescription,
} from "~/components/andamio";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type { CourseModuleOutput, CourseOutput } from "@andamio/db-api";

// Import wizard step components
import { StepBlueprint } from "~/components/studio/wizard/steps/step-blueprint";
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

  // Handle header updates when data loads
  const handleDataLoaded = useCallback(
    (course: CourseOutput | null, courseModule: CourseModuleOutput | null) => {
      if (isNewModule) {
        setBreadcrumbs([
          { label: "Course Studio", href: "/studio/course" },
          { label: course?.title ?? "Course", href: `/studio/course/${courseNftPolicyId}` },
          { label: "New Module" },
        ]);
        setTitle("New Module");
      } else {
        setBreadcrumbs([
          { label: "Course Studio", href: "/studio/course" },
          { label: course?.title ?? "Course", href: `/studio/course/${courseNftPolicyId}` },
          { label: courseModule?.title ?? moduleCode },
        ]);
        setTitle(courseModule?.title ?? "Module");
        if (courseModule?.status) {
          setStatus(courseModule.status, courseModule.status === "ON_CHAIN" ? "default" : "secondary");
        }
      }
    },
    [courseNftPolicyId, isNewModule, moduleCode, setBreadcrumbs, setTitle, setStatus]
  );

  // Data fetching hook
  const { data, completion, refetchData } = useModuleWizardData({
    courseNftPolicyId,
    moduleCode,
    isNewModule,
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
      courseNftPolicyId,
      moduleCode,
      isNewModule,
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
      courseNftPolicyId,
      moduleCode,
      isNewModule,
    ]
  );

  // Update header actions when module data changes
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        {data.courseModule?.status === "ON_CHAIN" && (
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
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              View On-Chain
            </a>
          </AndamioButton>
        )}
      </div>
    );
  }, [setActions, data.courseModule, courseNftPolicyId]);

  // Loading state
  if (data.isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="space-y-3">
          <AndamioSkeleton className="h-8 w-48" />
          <AndamioSkeleton className="h-64 w-[600px]" />
        </div>
      </div>
    );
  }

  // Error state
  if (data.error) {
    return (
      <StudioEditorPane padding="normal">
        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
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
          <StudioEditorPane
            padding="tight"
            header={
              <div className="flex items-center justify-between px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{currentConfig.title}</span>
                  {data.courseModule?.module_code && (
                    <AndamioBadge variant="outline" className="text-[10px] font-mono">
                      {data.courseModule.module_code}
                    </AndamioBadge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <AndamioButton
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={goPrevious}
                    disabled={!canGoPrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </AndamioButton>
                  <span className="text-xs text-muted-foreground min-w-[40px] text-center">
                    {currentIndex + 1}/{STEP_ORDER.length}
                  </span>
                  <AndamioButton
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={goNext}
                    disabled={!canGoNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </AndamioButton>
                </div>
              </div>
            }
            footer={
              <StudioActionBar align="between">
                <AndamioButton
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={goPrevious}
                  disabled={!canGoPrevious}
                >
                  <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                  Previous
                </AndamioButton>
                <AndamioButton
                  size="sm"
                  className="h-7 text-xs"
                  onClick={goNext}
                  disabled={!canGoNext}
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5 ml-1" />
                </AndamioButton>
              </StudioActionBar>
            }
          >
            <AnimatePresence mode="wait" custom={direction}>
              {currentStep === "blueprint" && (
                <StepBlueprint key="blueprint" config={currentConfig} direction={direction} />
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
          </StudioEditorPane>
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
    >
      <ModuleWizardContent
        courseNftPolicyId={courseNftPolicyId}
        moduleCode={moduleCode}
        isNewModule={isNewModule}
      />
    </RequireCourseAccess>
  );
}
