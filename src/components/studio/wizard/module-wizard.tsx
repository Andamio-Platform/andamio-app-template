"use client";

import React, { useContext, useState, useCallback, useMemo, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { WizardStepper, WIZARD_STEPS } from "./wizard-stepper";
import { WizardHeader } from "./wizard-navigation";
import { AndamioStudioLoading } from "~/components/andamio/andamio-loading";
import {
  WizardContext,
  type WizardStepId,
  type StepStatus,
  type StepCompletion,
  type WizardData,
  type WizardContextValue,
} from "./types";
import type {
  CourseModuleOutput,
  CourseOutput,
  ListSLTsOutput,
  AssignmentOutput,
  IntroductionOutput,
  ListLessonsOutput,
} from "@andamio/db-api";

// Step components (will be created next)
import { StepCredential } from "./steps/step-credential";
import { StepSLTs } from "./steps/step-slts";
import { StepAssignment } from "./steps/step-assignment";
import { StepLessons } from "./steps/step-lessons";
import { StepIntroduction } from "./steps/step-introduction";
import { StepReview } from "./steps/step-review";

/**
 * Hook to access wizard context
 */
export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error("useWizard must be used within ModuleWizard or WizardContext.Provider");
  }
  return context;
}

/**
 * Step order for navigation
 */
const STEP_ORDER: WizardStepId[] = [
  "credential",
  "slts",
  "assignment",
  "lessons",
  "introduction",
  "review",
];

interface ModuleWizardProps {
  courseNftPolicyId: string;
  moduleCode: string;
  course: CourseOutput | null;
  courseModule: CourseModuleOutput | null;
  onExitWizard: () => void;
  isNewModule?: boolean;
}

/**
 * ModuleWizard - Main wizard container
 *
 * Orchestrates the backwards design flow:
 * Credential → SLTs → Assignment → Lessons → Introduction → Review
 */
export function ModuleWizard({
  courseNftPolicyId,
  moduleCode,
  course,
  courseModule,
  onExitWizard,
  isNewModule = false,
}: ModuleWizardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { authenticatedFetch: _authenticatedFetch } = useAndamioAuth();

  // Current step from URL or default
  const urlStep = searchParams.get("step") as WizardStepId | null;
  const [currentStep, setCurrentStep] = useState<WizardStepId>(
    urlStep && STEP_ORDER.includes(urlStep) ? urlStep : "credential"
  );
  const [direction, setDirection] = useState(0);

  // Data state
  const [data, setData] = useState<WizardData>({
    course,
    courseModule,
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
    // For new modules, no data to fetch - just set loading to false
    if (isNewModule) {
      setData((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    setData((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
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

      // Refetch module for latest status
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
      const updatedModule = moduleResponse.ok
        ? ((await moduleResponse.json()) as CourseModuleOutput)
        : courseModule;

      setData({
        course,
        courseModule: updatedModule,
        slts,
        assignment,
        introduction,
        lessons,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      console.error("Error fetching wizard data:", err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load data",
      }));
    }
  }, [courseNftPolicyId, moduleCode, course, courseModule, isNewModule]);

  // Initial data fetch
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
      credential: hasTitle,
      slts: hasSLTs,
      assignment: hasAssignment,
      lessons: true, // Always optional/completable
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
        case "credential":
          return true;
        case "slts":
          return completion.credential;
        case "assignment":
          return completion.slts;
        case "lessons":
          return completion.slts; // Can create lessons once SLTs exist
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
   * Get step status for visual display
   */
  const getStepStatus = useCallback(
    (step: WizardStepId): StepStatus => {
      if (step === currentStep) return "current";
      if (completion[step]) return "completed";
      if (isStepUnlocked(step)) return "available";
      return "locked";
    },
    [currentStep, completion, isStepUnlocked]
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

      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", step);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [currentStep, isStepUnlocked, pathname, router, searchParams]
  );

  /**
   * Navigate to next step
   */
  const goNext = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex < STEP_ORDER.length - 1) {
      const nextStep = STEP_ORDER[currentIndex + 1]!;
      if (isStepUnlocked(nextStep)) {
        goToStep(nextStep);
      }
    }
  }, [currentStep, goToStep, isStepUnlocked]);

  /**
   * Navigate to previous step
   */
  const goPrevious = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1]!;
      goToStep(prevStep);
    }
  }, [currentStep, goToStep]);

  const currentIndex = STEP_ORDER.indexOf(currentStep);
  const canGoNext = currentIndex < STEP_ORDER.length - 1 && isStepUnlocked(STEP_ORDER[currentIndex + 1]!);
  const canGoPrevious = currentIndex > 0;

  /**
   * Update SLTs without triggering loading state
   * Used for optimistic updates from StepSLTs
   */
  const updateSlts = useCallback((slts: WizardData["slts"]) => {
    setData((prev) => ({ ...prev, slts }));
  }, []);

  /**
   * Context value
   */
  const contextValue = useMemo<WizardContextValue>(
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
      refetchData: fetchWizardData,
      updateSlts,
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
      fetchWizardData,
      updateSlts,
      courseNftPolicyId,
      moduleCode,
      isNewModule,
    ]
  );

  // Loading state
  if (data.isLoading) {
    return <AndamioStudioLoading variant="split-pane" />;
  }

  const currentConfig = WIZARD_STEPS.find((s) => s.id === currentStep)!;

  return (
    <WizardContext.Provider value={contextValue}>
      <div className="space-y-6">
        {/* Header with exit button */}
        <WizardHeader
          moduleTitle={data.courseModule?.title ?? undefined}
          onExitWizard={onExitWizard}
        />

        {/* Main wizard layout */}
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Stepper */}
          <WizardStepper
            currentStep={currentStep}
            getStepStatus={getStepStatus}
            onStepClick={goToStep}
          />

          {/* Step content */}
          <div className="min-h-[500px]">
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
        </div>
      </div>
    </WizardContext.Provider>
  );
}
