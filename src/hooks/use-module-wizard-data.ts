"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { env } from "~/env";
import type {
  CourseModuleOutput,
  CourseOutput,
  ListSLTsOutput,
  AssignmentOutput,
  IntroductionOutput,
  ListLessonsOutput,
} from "@andamio/db-api";
import type { WizardData, StepCompletion } from "~/components/studio/wizard/types";

interface UseModuleWizardDataProps {
  courseNftPolicyId: string;
  moduleCode: string;
  isNewModule: boolean;
  onDataLoaded?: (course: CourseOutput | null, courseModule: CourseModuleOutput | null) => void;
}

interface UseModuleWizardDataReturn {
  data: WizardData;
  completion: StepCompletion;
  refetchData: () => Promise<void>;
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
