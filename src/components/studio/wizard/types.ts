import { createContext } from "react";
import type { IconComponent } from "~/types/ui";
import type { CourseModuleOutput, CourseOutput, ListSLTsOutput, AssignmentOutput, IntroductionOutput, ListLessonsOutput } from "@andamio/db-api";

/**
 * Wizard step identifiers
 */
export type WizardStepId =
  | "blueprint"
  | "slts"
  | "assignment"
  | "lessons"
  | "introduction"
  | "review";

/**
 * Step status for visual display
 */
export type StepStatus = "locked" | "available" | "current" | "completed";

/**
 * Configuration for each wizard step
 */
export interface WizardStepConfig {
  id: WizardStepId;
  title: string;
  subtitle: string;
  description: string;
  icon: IconComponent;
  optional?: boolean;
}

/**
 * Step completion state
 */
export interface StepCompletion {
  blueprint: boolean;
  slts: boolean;
  assignment: boolean;
  lessons: boolean;
  introduction: boolean;
  review: boolean;
}

/**
 * Data loaded for the wizard
 */
export interface WizardData {
  course: CourseOutput | null;
  courseModule: CourseModuleOutput | null;
  slts: ListSLTsOutput;
  assignment: AssignmentOutput | null;
  introduction: IntroductionOutput | null;
  lessons: ListLessonsOutput;
  isLoading: boolean;
  error: string | null;
}

/**
 * Wizard context value
 */
export interface WizardContextValue {
  // Navigation
  currentStep: WizardStepId;
  goToStep: (step: WizardStepId) => void;
  goNext: () => void;
  goPrevious: () => void;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Step status
  getStepStatus: (step: WizardStepId) => StepStatus;
  isStepUnlocked: (step: WizardStepId) => boolean;
  completion: StepCompletion;

  // Data
  data: WizardData;
  refetchData: () => Promise<void>;

  // Course identifiers
  courseNftPolicyId: string;
  moduleCode: string;

  // Creation mode
  isNewModule: boolean;
}

/**
 * Wizard Context - shared between ModuleWizard and StudioModuleEditPage
 */
export const WizardContext = createContext<WizardContextValue | null>(null);

/**
 * Props for step components
 */
export interface WizardStepProps {
  onComplete?: () => void;
  onSkip?: () => void;
}

/**
 * Animation variants for Framer Motion
 *
 * Uses simple, fast transitions for high performance.
 * Avoid spring animations that feel sluggish.
 */
export const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 20 : -20,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 20 : -20,
    opacity: 0,
  }),
};

export const stepTransition = {
  duration: 0.15,
  ease: "easeOut",
};

/**
 * Completion animation for checkmarks
 */
export const checkmarkVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      duration: 0.15,
      ease: "easeOut",
    },
  },
};

/**
 * Progress bar animation
 */
export const progressVariants = {
  initial: { width: "0%" },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  }),
};
