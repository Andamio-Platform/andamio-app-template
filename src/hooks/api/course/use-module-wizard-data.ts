"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import type {
  CourseModuleResponse,
  CourseModuleListResponse,
  CourseResponse,
  SLTListResponse,
  AssignmentResponse,
  IntroductionResponse,
  LessonListResponse,
} from "~/types/generated";
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
  const { authenticatedFetch } = useAndamioAuth();

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
      // Go API: GET /course/user/course/get/{policy_id}
      try {
        const courseResponse = await fetch(
          `/api/gateway/api/v2/course/user/course/get/${courseNftPolicyId}`
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
      // Fetch course - Go API: GET /course/user/course/get/{policy_id}
      const courseResponse = await fetch(
        `/api/gateway/api/v2/course/user/course/get/${courseNftPolicyId}`
      );
      const course = courseResponse.ok
        ? ((await courseResponse.json()) as CourseResponse)
        : null;

      // Go API: POST /course/teacher/course-modules/list
      // Teacher endpoint - returns ALL modules including drafts
      const modulesResponse = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/course-modules/list`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ course_id: courseNftPolicyId }),
        }
      );
      let modules: CourseModuleListResponse = [];
      if (modulesResponse.ok) {
        const result = await modulesResponse.json() as { data?: CourseModuleListResponse } | CourseModuleListResponse;
        // Handle both wrapped { data: [...] } and raw array formats
        modules = Array.isArray(result) ? result : (result.data ?? []);
      }
      // Find the merged module item and extract its content with slt_hash
      const mergedModuleItem = modules.find((m) => m.content?.course_module_code === effectiveModuleCode);
      const courseModule = mergedModuleItem?.content
        ? { ...mergedModuleItem.content, slt_hash: mergedModuleItem.slt_hash }
        : null;

      // Fetch SLTs - Go API: GET /course/user/slts/{course_id}/{course_module_code}
      const sltsResponse = await fetch(
        `/api/gateway/api/v2/course/user/slts/${courseNftPolicyId}/${effectiveModuleCode}`
      );
      const slts = sltsResponse.ok
        ? ((await sltsResponse.json()) as SLTListResponse)
        : [];

      // Try embedded assignment from courseModule first, then fall back to dedicated endpoint
      let assignment: AssignmentResponse | null = (courseModule?.assignment as AssignmentResponse | undefined) ?? null;
      console.log("[useModuleWizardData] Assignment from courseModule:", {
        hasAssignment: !!assignment,
        title: assignment?.title,
        hasContentJson: !!assignment?.content_json,
      });

      // If embedded assignment is empty, fetch from dedicated endpoint
      if (!assignment?.title) {
        const assignmentResponse = await fetch(
          `/api/gateway/api/v2/course/user/assignment/${courseNftPolicyId}/${effectiveModuleCode}`
        );
        if (assignmentResponse.ok) {
          const assignmentResult = await assignmentResponse.json() as AssignmentResponse | null;
          if (assignmentResult && typeof assignmentResult === "object" && "title" in assignmentResult) {
            assignment = assignmentResult;
            console.log("[useModuleWizardData] Assignment from dedicated endpoint:", {
              hasAssignment: !!assignment,
              title: assignment?.title,
            });
          }
        }
      }

      // Introduction data is embedded in the module response (courseModule.introduction)
      // Use it from there instead of a separate fetch
      const introduction: IntroductionResponse | null = (courseModule?.introduction as IntroductionResponse | undefined) ?? null;
      console.log("[useModuleWizardData] Introduction from module:", {
        hasIntroduction: !!introduction,
        title: introduction?.title,
      });

      // Extract lessons from SLTs - each SLT may have an embedded lesson
      const lessons: LessonListResponse = slts
        .filter((slt) => slt.lesson?.title)
        .map((slt) => ({
          ...slt.lesson!,
          slt_index: slt.slt_index,
        }));
      console.log("[useModuleWizardData] Lessons extracted from SLTs:", {
        totalSlts: slts.length,
        lessonsFound: lessons.length,
      });

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
  }, [courseNftPolicyId, moduleCode, isNewModule, onDataLoaded, authenticatedFetch]);

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
   * Note: We check for actual saved content (title with value) rather than just truthy objects
   * because the API may return empty/partial objects before content is saved
   */
  const completion = useMemo<StepCompletion>(() => {
    const hasTitle = !!data.courseModule?.title?.trim();
    const hasSLTs = data.slts.length > 0;
    // Assignment must have a saved title to be considered complete
    const hasAssignment = !!(data.assignment && typeof data.assignment.title === "string" && data.assignment.title.trim().length > 0);
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
