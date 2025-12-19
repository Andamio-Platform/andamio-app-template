"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useStudioHeader } from "~/components/layout/studio-header";
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
  Save,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import type {
  CourseModuleOutput,
  CourseOutput,
  ListSLTsOutput,
  AssignmentOutput,
  IntroductionOutput,
  ListLessonsOutput,
} from "@andamio/db-api";

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
  type WizardData,
  type StepCompletion,
} from "~/components/studio/wizard/types";

const STEP_ORDER: WizardStepId[] = [
  "blueprint",
  "slts",
  "assignment",
  "lessons",
  "introduction",
  "review",
];

/**
 * Studio Module Edit Page - Dense split-pane layout with wizard
 * Left: Step outline with completion status
 * Right: Step content editor
 */
export default function StudioModuleEditPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const isNewModule = moduleCode === "new";
  const { isAuthenticated, authenticatedFetch } = useAndamioAuth();

  // Update studio header
  const { setBreadcrumbs, setTitle, setStatus, setActions } = useStudioHeader();

  // Current step from URL
  const urlStep = searchParams.get("step") as WizardStepId | null;
  const [currentStep, setCurrentStep] = useState<WizardStepId>(
    urlStep && STEP_ORDER.includes(urlStep) ? urlStep : "blueprint"
  );
  const [direction, setDirection] = useState(0);

  // Panel state
  const [isOutlineCollapsed, setIsOutlineCollapsed] = useState(false);

  // Data state
  const [data, setData] = useState<WizardData>({
    course: null,
    courseModule: null,
    slts: [],
    assignment: null,
    introduction: null,
    lessons: [],
    isLoading: true,
    error: null,
  });

  /**
   * Fetch all wizard data
   */
  const fetchWizardData = useCallback(async () => {
    if (isNewModule) {
      // For new modules, just fetch course info
      try {
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
          }
        );
        const course = courseResponse.ok
          ? ((await courseResponse.json()) as CourseOutput)
          : null;

        setData({
          course,
          courseModule: null,
          slts: [],
          assignment: null,
          introduction: null,
          lessons: [],
          isLoading: false,
          error: null,
        });

        // Update header
        setBreadcrumbs([
          { label: "Course Studio", href: "/studio/course" },
          { label: course?.title ?? "Course", href: `/studio/course/${courseNftPolicyId}` },
          { label: "New Module" },
        ]);
        setTitle("New Module");
      } catch (err) {
        console.error("Error fetching course:", err);
        setData((prev) => ({
          ...prev,
          isLoading: false,
          error: err instanceof Error ? err.message : "Failed to load",
        }));
      }
      return;
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch course
      const courseResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
        }
      );
      const course = courseResponse.ok
        ? ((await courseResponse.json()) as CourseOutput)
        : null;

      // Fetch module
      const moduleResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
      );
      const courseModule = moduleResponse.ok
        ? ((await moduleResponse.json()) as CourseModuleOutput)
        : null;

      // Fetch SLTs
      const sltsResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
      );
      const slts = sltsResponse.ok
        ? ((await sltsResponse.json()) as ListSLTsOutput)
        : [];

      // Fetch assignment
      const assignmentResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            assignment_code: `${moduleCode}-ASSIGNMENT`,
          }),
        }
      );
      const assignment = assignmentResponse.ok
        ? ((await assignmentResponse.json()) as AssignmentOutput)
        : null;

      // Fetch introduction
      const introResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/introduction/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
      );
      const introduction = introResponse.ok
        ? ((await introResponse.json()) as IntroductionOutput)
        : null;

      // Fetch lessons
      const lessonsResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lesson/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
          }),
        }
      );
      const lessons = lessonsResponse.ok
        ? ((await lessonsResponse.json()) as ListLessonsOutput)
        : [];

      setData({
        course,
        courseModule,
        slts,
        assignment,
        introduction,
        lessons,
        isLoading: false,
        error: null,
      });

      // Update header
      setBreadcrumbs([
        { label: "Course Studio", href: "/studio/course" },
        { label: course?.title ?? "Course", href: `/studio/course/${courseNftPolicyId}` },
        { label: courseModule?.title ?? moduleCode },
      ]);
      setTitle(courseModule?.title ?? "Module");
      if (courseModule?.status) {
        setStatus(courseModule.status, courseModule.status === "ON_CHAIN" ? "default" : "secondary");
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load",
      }));
    }
  }, [courseNftPolicyId, moduleCode, isNewModule, setBreadcrumbs, setTitle, setStatus]);

  useEffect(() => {
    void fetchWizardData();
  }, [fetchWizardData]);

  /**
   * Calculate step completion
   */
  const completion = useMemo<StepCompletion>(() => {
    const hasTitle = !!data.courseModule?.title?.trim();
    const hasSLTs = data.slts.length > 0;
    const hasAssignment = !!data.assignment;
    const hasIntroduction = !!data.introduction;

    return {
      blueprint: hasTitle,
      slts: hasSLTs,
      assignment: hasAssignment,
      lessons: true,
      introduction: hasIntroduction,
      review: hasTitle && hasSLTs && hasAssignment && hasIntroduction,
    };
  }, [data]);

  /**
   * Check if step is unlocked
   */
  const isStepUnlocked = useCallback(
    (step: WizardStepId): boolean => {
      switch (step) {
        case "blueprint":
          return true;
        case "slts":
          return completion.blueprint;
        case "assignment":
          return completion.slts;
        case "lessons":
          return completion.slts;
        case "introduction":
          return completion.assignment;
        case "review":
          return completion.introduction;
        default:
          return false;
      }
    },
    [completion]
  );

  /**
   * Navigate to step
   */
  const goToStep = useCallback(
    (step: WizardStepId) => {
      if (!isStepUnlocked(step)) return;

      const currentIndex = STEP_ORDER.indexOf(currentStep);
      const targetIndex = STEP_ORDER.indexOf(step);
      setDirection(targetIndex > currentIndex ? 1 : -1);
      setCurrentStep(step);

      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [currentStep, isStepUnlocked, pathname, router, searchParams]
  );

  const goNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1]!;
      if (isStepUnlocked(nextStep)) {
        goToStep(nextStep);
      }
    }
  }, [currentStep, goToStep, isStepUnlocked]);

  const goPrevious = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      goToStep(STEP_ORDER[currentIndex - 1]!);
    }
  }, [currentStep, goToStep]);

  const getStepStatus = useCallback(
    (step: WizardStepId) => {
      if (step === currentStep) return "current";
      if (completion[step]) return "completed";
      if (isStepUnlocked(step)) return "available";
      return "locked";
    },
    [currentStep, completion, isStepUnlocked]
  );

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const canGoNext = currentIndex < STEP_ORDER.length - 1 && isStepUnlocked(STEP_ORDER[currentIndex + 1]!);
  const canGoPrevious = currentIndex > 0;

  // Build outline steps
  const outlineSteps: OutlineStep[] = MODULE_WIZARD_STEPS.map((step) => ({
    ...step,
    isComplete: completion[step.id as WizardStepId],
    isActive: currentStep === step.id,
    isLocked: !isStepUnlocked(step.id as WizardStepId),
    count: step.id === "slts" ? data.slts.length : step.id === "lessons" ? data.lessons.length : undefined,
  }));

  // Wizard context
  const contextValue: WizardContextValue = {
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
    refetchData: fetchWizardData,
    courseNftPolicyId,
    moduleCode,
    isNewModule,
  };

  // Update header actions
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
