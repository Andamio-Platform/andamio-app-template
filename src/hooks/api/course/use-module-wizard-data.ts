"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useCourse, type Course } from "./use-course";
import { useTeacherCourseModules, type CourseModule, type SLT } from "./use-course-module";
import { useSLTs } from "./use-slt";
import { useAssignment } from "./use-assignment";
import type { WizardData, StepCompletion } from "~/components/studio/wizard/types";

interface UseModuleWizardDataProps {
  courseNftPolicyId: string;
  moduleCode: string;
  isNewModule: boolean;
  onDataLoaded?: (course: Course | null, courseModule: CourseModule | null) => void;
}

interface UseModuleWizardDataReturn {
  data: WizardData;
  completion: StepCompletion;
  refetchData: (moduleCodeOverride?: string) => Promise<void>;
  updateSlts: (slts: SLT[]) => void;
}

/**
 * Hook for fetching and managing module wizard data
 *
 * Composes existing React Query hooks for caching benefits while
 * handling wizard-specific concerns:
 * - Module code override for smooth transitions after creation
 * - Step completion calculation
 * - Derived data (lessons from SLTs, introduction from module)
 */
export function useModuleWizardData({
  courseNftPolicyId,
  moduleCode,
  isNewModule,
  onDataLoaded,
}: UseModuleWizardDataProps): UseModuleWizardDataReturn {
  // Track effective module code (supports override after creation)
  const [effectiveModuleCode, setEffectiveModuleCode] = useState(moduleCode);
  const effectiveIsNewModule = isNewModule && effectiveModuleCode === moduleCode;

  // Use ref for callback to prevent dependency loop
  const onDataLoadedRef = useRef(onDataLoaded);
  onDataLoadedRef.current = onDataLoaded;

  // Track if we've notified onDataLoaded to avoid duplicate calls
  const hasNotifiedRef = useRef(false);

  // Local SLT state for optimistic updates (synced from React Query)
  const [optimisticSlts, setOptimisticSlts] = useState<SLT[] | null>(null);

  // ==========================================================================
  // Compose existing hooks
  // ==========================================================================

  // Course data (always fetch)
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(courseNftPolicyId);

  // Teacher modules (to find specific module including drafts)
  const {
    data: teacherModules,
    isLoading: modulesLoading,
    error: modulesError,
    refetch: refetchModules,
  } = useTeacherCourseModules(courseNftPolicyId);

  // SLTs for the module (skip if new module with no code yet)
  const {
    data: sltsFromQuery,
    isLoading: sltsLoading,
    error: sltsError,
    refetch: refetchSlts,
  } = useSLTs(
    effectiveIsNewModule ? undefined : courseNftPolicyId,
    effectiveIsNewModule ? undefined : effectiveModuleCode
  );

  // Assignment for the module (skip if new module)
  const {
    data: assignment,
    isLoading: assignmentLoading,
    error: assignmentError,
    refetch: refetchAssignment,
  } = useAssignment(
    effectiveIsNewModule ? undefined : courseNftPolicyId,
    effectiveIsNewModule ? undefined : effectiveModuleCode
  );

  // ==========================================================================
  // Derived data
  // ==========================================================================

  // Find specific module from teacher modules list
  const courseModule = useMemo(() => {
    if (effectiveIsNewModule || !teacherModules) return null;
    return teacherModules.find((m) => m.moduleCode === effectiveModuleCode) ?? null;
  }, [teacherModules, effectiveModuleCode, effectiveIsNewModule]);

  // Use optimistic SLTs if set, otherwise use query data
  const slts = optimisticSlts ?? sltsFromQuery ?? [];

  // Clear optimistic SLTs when query data updates (sync complete)
  useEffect(() => {
    if (sltsFromQuery && optimisticSlts) {
      setOptimisticSlts(null);
    }
  }, [sltsFromQuery, optimisticSlts]);

  // Derive lessons from SLTs (each SLT may have an embedded lesson)
  const lessons = useMemo(() => {
    return slts
      .filter((slt) => slt.lesson?.title)
      .map((slt) => slt.lesson!);
  }, [slts]);

  // Introduction is embedded in the course module
  const introduction = courseModule?.introduction ?? null;

  // ==========================================================================
  // Loading and error states
  // ==========================================================================

  const isLoading = effectiveIsNewModule
    ? courseLoading
    : courseLoading || modulesLoading || sltsLoading || assignmentLoading;

  const error = courseError?.message
    ?? modulesError?.message
    ?? sltsError?.message
    ?? assignmentError?.message
    ?? null;

  // ==========================================================================
  // Build WizardData
  // ==========================================================================

  const data: WizardData = useMemo(
    () => ({
      course: course ?? null,
      courseModule,
      slts,
      assignment: assignment ?? null,
      introduction,
      lessons,
      isLoading,
      error,
    }),
    [course, courseModule, slts, assignment, introduction, lessons, isLoading, error]
  );

  // ==========================================================================
  // Notify onDataLoaded when data is ready
  // ==========================================================================

  useEffect(() => {
    if (!isLoading && !hasNotifiedRef.current) {
      hasNotifiedRef.current = true;
      onDataLoadedRef.current?.(course ?? null, courseModule);
    }
  }, [isLoading, course, courseModule]);

  // Reset notification flag when module code changes
  useEffect(() => {
    hasNotifiedRef.current = false;
  }, [effectiveModuleCode]);

  // ==========================================================================
  // Calculate step completion
  // ==========================================================================

  const completion = useMemo<StepCompletion>(() => {
    const hasTitle = !!courseModule?.title?.trim();
    const hasSLTs = slts.length > 0;
    // Assignment must have a saved title to be considered complete
    const hasAssignment = !!(
      assignment &&
      typeof assignment.title === "string" &&
      assignment.title.trim().length > 0
    );
    const hasIntroduction = !!introduction;

    return {
      credential: hasTitle,
      slts: hasSLTs,
      assignment: hasAssignment,
      lessons: true, // Optional step
      introduction: hasIntroduction,
      review: hasTitle && hasSLTs && hasAssignment && hasIntroduction,
    };
  }, [courseModule, slts, assignment, introduction]);

  // ==========================================================================
  // Refetch function (supports module code override for creation flow)
  // ==========================================================================

  const refetchData = useCallback(
    async (moduleCodeOverride?: string) => {
      if (moduleCodeOverride) {
        // Update effective module code - hooks will automatically refetch
        setEffectiveModuleCode(moduleCodeOverride);
        hasNotifiedRef.current = false;
      }

      // Trigger refetch of all queries
      await Promise.all([
        refetchModules(),
        refetchSlts(),
        refetchAssignment(),
      ]);
    },
    [refetchModules, refetchSlts, refetchAssignment]
  );

  // ==========================================================================
  // Optimistic SLT update (for immediate UI feedback)
  // ==========================================================================

  const updateSlts = useCallback((newSlts: SLT[]) => {
    setOptimisticSlts(newSlts);
  }, []);

  return {
    data,
    completion,
    refetchData,
    updateSlts,
  };
}
