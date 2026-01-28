/**
 * Integration hook connecting Zustand draft store with React Query
 *
 * This hook:
 * 1. Initializes the store from React Query data
 * 2. Injects the save function from useSaveModuleDraft
 * 3. Provides refetch capability after successful saves
 *
 * @example
 * ```tsx
 * function ModuleWizard({ courseId, moduleCode }: Props) {
 *   const {
 *     draft,
 *     isDirty,
 *     isSaving,
 *     addSlt,
 *     setAssignment,
 *     saveAndSync,
 *   } = useModuleDraft(courseId, moduleCode, false);
 *
 *   const handleStepChange = async () => {
 *     if (isDirty) {
 *       await saveAndSync();
 *     }
 *   };
 * }
 * ```
 */

import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useModuleDraftStore,
  selectDraft,
  selectIsDirty,
  selectIsSaving,
  selectLastError,
  selectSlts,
  selectAssignment,
  selectIntroduction,
  selectLessons,
} from "~/stores/module-draft-store";
import { useTeacherCourseModules, courseModuleKeys } from "~/hooks/api/course/use-course-module";
import { useSaveModuleDraft } from "~/hooks/api/course/use-save-module-draft";
import type { SaveModuleDraftResult } from "~/stores/module-draft-store";

interface UseModuleDraftOptions {
  /** Called when save succeeds */
  onSaveSuccess?: (result: SaveModuleDraftResult) => void;
  /** Called when save fails */
  onSaveError?: (error: string) => void;
}

export function useModuleDraft(
  courseId: string,
  moduleCode: string,
  isNewModule: boolean,
  options: UseModuleDraftOptions = {}
) {
  const queryClient = useQueryClient();

  // Store state and actions
  const store = useModuleDraftStore();
  const draft = useModuleDraftStore(selectDraft);
  const isDirty = useModuleDraftStore(selectIsDirty);
  const isSaving = useModuleDraftStore(selectIsSaving);
  const lastError = useModuleDraftStore(selectLastError);
  const slts = useModuleDraftStore(selectSlts);
  const assignment = useModuleDraftStore(selectAssignment);
  const introduction = useModuleDraftStore(selectIntroduction);
  const lessons = useModuleDraftStore(selectLessons);

  // React Query data
  const { data: modules, refetch: refetchModules } = useTeacherCourseModules(courseId);

  // Save mutation
  const saveModuleDraft = useSaveModuleDraft();

  // Track initialization to avoid re-initializing on every render
  const isInitializedRef = useRef(false);
  const lastModuleCodeRef = useRef<string | null>(null);

  // Find the specific module from the list
  const courseModule = modules?.find((m) => m.moduleCode === moduleCode) ?? null;

  // Initialize store when data is available
  useEffect(() => {
    // Skip if already initialized for this module
    if (isInitializedRef.current && lastModuleCodeRef.current === moduleCode) {
      return;
    }

    // For new modules, initialize immediately with empty state
    if (isNewModule) {
      store.init(courseId, moduleCode, null, true);
      isInitializedRef.current = true;
      lastModuleCodeRef.current = moduleCode;
      return;
    }

    // For existing modules, wait for data to load
    if (modules && courseModule) {
      store.init(courseId, moduleCode, courseModule, false);
      isInitializedRef.current = true;
      lastModuleCodeRef.current = moduleCode;
    }
  }, [courseId, moduleCode, isNewModule, modules, courseModule, store]);

  // Inject save function into store
  useEffect(() => {
    store.setSaveFn(saveModuleDraft.mutateAsync);
  }, [store, saveModuleDraft.mutateAsync]);

  // Reset initialization tracking when module changes
  useEffect(() => {
    if (lastModuleCodeRef.current !== moduleCode) {
      isInitializedRef.current = false;
    }
  }, [moduleCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Optionally reset store on unmount
      // store.reset();
    };
  }, []);

  /**
   * Save and sync with React Query
   *
   * This is the primary save function for components. It:
   * 1. Calls the store's save function
   * 2. Invalidates React Query cache
   * 3. Refetches fresh data
   * 4. Re-initializes the store with new server state
   */
  const saveAndSync = useCallback(async (): Promise<boolean> => {
    if (!isDirty) {
      return true; // Nothing to save
    }

    const success = await store.save();

    if (success) {
      // Invalidate and refetch
      await queryClient.invalidateQueries({
        queryKey: courseModuleKeys.teacherList(courseId),
      });

      // Refetch to get updated server state
      const { data: freshModules } = await refetchModules();
      const freshModule = freshModules?.find((m) => m.moduleCode === moduleCode) ?? null;

      // Re-initialize store with fresh server state
      if (freshModule) {
        store.init(courseId, moduleCode, freshModule, isNewModule);
      }

      options.onSaveSuccess?.(store.lastSaveResult!);
    } else {
      options.onSaveError?.(store.lastError ?? "Save failed");
    }

    return success;
  }, [
    isDirty,
    store,
    queryClient,
    courseId,
    refetchModules,
    moduleCode,
    isNewModule,
    options,
  ]);

  /**
   * Discard changes and reset to server state
   */
  const discardChanges = useCallback(() => {
    store.discard();
  }, [store]);

  return {
    // State
    draft,
    isDirty,
    isSaving,
    lastError,

    // Derived state
    slts,
    assignment,
    introduction,
    lessons,

    // Module context
    courseId,
    moduleCode,
    isNewModule,
    courseModule,

    // Metadata actions
    setMetadata: store.setMetadata,

    // SLT actions
    addSlt: store.addSlt,
    updateSlt: store.updateSlt,
    deleteSlt: store.deleteSlt,
    reorderSlts: store.reorderSlts,

    // Content actions
    setAssignment: store.setAssignment,
    setIntroduction: store.setIntroduction,
    setLesson: store.setLesson,

    // Persistence
    saveAndSync,
    discardChanges,

    // Raw store access (for advanced use cases)
    store,
  };
}
