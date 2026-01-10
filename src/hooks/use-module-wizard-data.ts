"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { env } from "~/env";
import type {
  CourseModuleResponse,
  CourseResponse,
  SLTListResponse,
  AssignmentResponse,
  IntroductionResponse,
  LessonListResponse,
} from "@andamio/db-api-types";
import type { WizardData, StepCompletion } from "~/components/studio/wizard/types";

interface UseModuleWizardDataProps {
  courseNftPolicyId: string;
  moduleCode: string;
  isNewModule: boolean;
  onDataLoaded?: (course: CourseResponse | null, courseModule: CourseModuleResponse | null) => void;
}

interface UseModuleWizardDataReturn {
  data: WizardData;
  completion: StepCompletion;
  refetchData: (moduleCodeOverride?: string) => Promise<void>;
  updateSlts: (slts: WizardData["slts"]) => void;
}

/**
 * Hook for fetching and managing module wizard data
 *
 * Handles all API calls for the module wizard:
 * - Course details
 * - Module details
 * - SLTs, Assignment, Introduction, Lessons
 */
export function useModuleWizardData({
  courseNftPolicyId,
  moduleCode,
  isNewModule,
  onDataLoaded,
}: UseModuleWizardDataProps): UseModuleWizardDataReturn {
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

  // Track if initial load has completed to avoid showing loading screen on refetch
  const hasLoadedRef = useRef(false);

  /**
   * Fetch all wizard data
   * @param moduleCodeOverride - Optional module code to use instead of the prop (used after creating a new module)
   */
  const fetchWizardData = useCallback(async (moduleCodeOverride?: string) => {
    const effectiveModuleCode = moduleCodeOverride ?? moduleCode;
    const isNewModuleFetch = isNewModule && !moduleCodeOverride;

    if (isNewModuleFetch) {
      // For new modules, just fetch course info
      // Go API: GET /course/public/course/get/{policy_id}
      try {
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/course/get/${courseNftPolicyId}`
        );
        const course = courseResponse.ok
          ? ((await courseResponse.json()) as CourseResponse)
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

        hasLoadedRef.current = true;
        onDataLoaded?.(course, null);
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

    // Only show loading state on initial load, not on refetch
    if (!hasLoadedRef.current) {
      setData((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      // Fetch course - Go API: GET /course/public/course/get/{policy_id}
      const courseResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/course/get/${courseNftPolicyId}`
      );
      const course = courseResponse.ok
        ? ((await courseResponse.json()) as CourseResponse)
        : null;

      // Fetch module - Go API: GET /course/public/course-module/get/{policy_id}/{module_code}
      const moduleResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/course-module/get/${courseNftPolicyId}/${effectiveModuleCode}`
      );
      const courseModule = moduleResponse.ok
        ? ((await moduleResponse.json()) as CourseModuleResponse)
        : null;

      // Fetch SLTs - Go API: GET /course/public/slts/list/{policy_id}/{module_code}
      const sltsResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/slts/list/${courseNftPolicyId}/${effectiveModuleCode}`
      );
      const slts = sltsResponse.ok
        ? ((await sltsResponse.json()) as SLTListResponse)
        : [];

      // Fetch assignment - Go API: GET /course/public/assignment/get/{policy_id}/{module_code}
      const assignmentResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/assignment/get/${courseNftPolicyId}/${effectiveModuleCode}`
      );
      const assignment = assignmentResponse.ok
        ? ((await assignmentResponse.json()) as AssignmentResponse)
        : null;

      // Fetch introduction - Go API: GET /course/public/introduction/get/{policy_id}/{module_code}
      const introResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/introduction/get/${courseNftPolicyId}/${effectiveModuleCode}`
      );
      const introduction = introResponse.ok
        ? ((await introResponse.json()) as IntroductionResponse)
        : null;

      // Fetch lessons - Go API: GET /course/public/lessons/list/{policy_id}/{module_code}
      const lessonsResponse = await fetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/lessons/list/${courseNftPolicyId}/${effectiveModuleCode}`
      );
      const lessons = lessonsResponse.ok
        ? ((await lessonsResponse.json()) as LessonListResponse)
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

      hasLoadedRef.current = true;
      onDataLoaded?.(course, courseModule);
    } catch (err) {
      console.error("Error fetching data:", err);
      setData((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to load",
      }));
    }
  }, [courseNftPolicyId, moduleCode, isNewModule, onDataLoaded]);

  // Fetch data on mount
  useEffect(() => {
    void fetchWizardData();
  }, [fetchWizardData]);

  /**
   * Update SLTs without triggering loading state
   * Used for optimistic updates from step-slts
   */
  const updateSlts = useCallback((slts: WizardData["slts"]) => {
    setData((prev) => ({ ...prev, slts }));
  }, []);

  /**
   * Calculate step completion based on data
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
      lessons: true, // Optional step
      introduction: hasIntroduction,
      review: hasTitle && hasSLTs && hasAssignment && hasIntroduction,
    };
  }, [data]);

  return {
    data,
    completion,
    refetchData: fetchWizardData,
    updateSlts,
  };
}
