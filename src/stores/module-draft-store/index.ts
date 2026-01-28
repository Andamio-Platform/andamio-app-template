/**
 * Module Draft Store
 *
 * Zustand store for managing local draft state of a course module.
 * Provides optimistic updates with save-on-step-change pattern.
 *
 * Architecture:
 * - serverState: Snapshot from last fetch/save (source of truth for dirty checking)
 * - draft: Local edits (optimistic updates)
 * - isDirty: Computed from comparing draft vs serverState
 *
 * @example
 * ```tsx
 * const { draft, addSlt, isDirty, save } = useModuleDraftStore();
 *
 * // Optimistic update - instant UI feedback
 * addSlt("Explain smart contract execution");
 *
 * // Save when navigating to next step
 * if (isDirty) {
 *   await save();
 * }
 * ```
 */

import { create } from "zustand";
import type { JSONContent } from "@tiptap/core";
import type {
  ModuleDraft,
  SLTDraft,
  AssignmentDraft,
  IntroDraft,
  LessonDraft,
  SaveModuleDraftResult,
} from "./types";
import { generateLocalId } from "./types";
import type { CourseModule, SLT, Assignment, Introduction, Lesson } from "~/hooks/api/course/use-course-module";

// =============================================================================
// Store State Interface
// =============================================================================

interface ModuleDraftState {
  // Identity
  courseId: string | null;
  moduleCode: string | null;
  isNewModule: boolean;

  // Server state (snapshot from last fetch/save)
  serverState: CourseModule | null;

  // Draft state (local edits - optimistic)
  draft: ModuleDraft | null;

  // Status
  isDirty: boolean;
  isSaving: boolean;
  lastError: string | null;
  lastSaveResult: SaveModuleDraftResult | null;

  // Save function (injected from hook layer)
  _saveFn: ((draft: ModuleDraft) => Promise<SaveModuleDraftResult>) | null;
}

// =============================================================================
// Store Actions Interface
// =============================================================================

interface ModuleDraftActions {
  // Initialize from server data
  init: (
    courseId: string,
    moduleCode: string,
    courseModule: CourseModule | null,
    isNewModule: boolean
  ) => void;

  // Set the save function (called from hook layer)
  setSaveFn: (fn: (draft: ModuleDraft) => Promise<SaveModuleDraftResult>) => void;

  // Optimistic update actions
  setMetadata: (title: string, description?: string) => void;
  addSlt: (text: string) => void;
  updateSlt: (moduleIndex: number, text: string) => void;
  deleteSlt: (moduleIndex: number) => void;
  reorderSlts: (newOrder: number[]) => void;
  setAssignment: (data: Omit<AssignmentDraft, "_isModified" | "_isNew"> | null) => void;
  setIntroduction: (data: Omit<IntroDraft, "_isModified" | "_isNew"> | null) => void;
  setLesson: (sltIndex: number, data: Omit<LessonDraft, "_isModified" | "_isNew" | "sltIndex"> | null) => void;

  // Persistence
  save: () => Promise<boolean>;
  discard: () => void;

  // Reset store
  reset: () => void;
}

type ModuleDraftStore = ModuleDraftState & ModuleDraftActions;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Convert server SLT to draft SLT
 */
function serverSltToDraft(slt: SLT): SLTDraft {
  return {
    id: slt.id,
    _localId: generateLocalId("slt"),
    sltText: slt.sltText ?? "",
    moduleIndex: slt.moduleIndex ?? 1,
    _isModified: false,
    _isNew: false,
    _isDeleted: false,
  };
}

/**
 * Convert server Lesson to draft Lesson
 */
function serverLessonToDraft(lesson: Lesson): LessonDraft {
  return {
    id: lesson.id,
    title: lesson.title ?? "",
    description: lesson.description,
    contentJson: lesson.contentJson as JSONContent | null | undefined,
    sltIndex: lesson.sltIndex ?? 1,
    imageUrl: lesson.imageUrl,
    videoUrl: lesson.videoUrl,
    _isModified: false,
    _isNew: false,
  };
}

/**
 * Convert server Assignment to draft Assignment
 */
function serverAssignmentToDraft(assignment: Assignment): AssignmentDraft {
  return {
    id: assignment.id,
    title: assignment.title ?? "",
    description: assignment.description,
    contentJson: assignment.contentJson as JSONContent | null | undefined,
    imageUrl: assignment.imageUrl,
    videoUrl: assignment.videoUrl,
    _isModified: false,
    _isNew: false,
  };
}

/**
 * Convert server Introduction to draft Introduction
 */
function serverIntroToDraft(intro: Introduction): IntroDraft {
  return {
    id: intro.id,
    title: intro.title ?? "",
    description: intro.description,
    contentJson: intro.contentJson as JSONContent | null | undefined,
    imageUrl: intro.imageUrl,
    videoUrl: intro.videoUrl,
    _isModified: false,
    _isNew: false,
  };
}

/**
 * Create a draft from server CourseModule
 */
function createDraftFromServer(courseId: string, moduleCode: string, courseModule: CourseModule | null): ModuleDraft {
  const lessons = new Map<number, LessonDraft>();

  // Extract lessons from SLTs (they may have embedded lessons)
  if (courseModule?.slts) {
    courseModule.slts.forEach((slt) => {
      if (slt.lesson) {
        const sltIndex = slt.lesson.sltIndex ?? slt.moduleIndex ?? 1;
        lessons.set(sltIndex, serverLessonToDraft(slt.lesson));
      }
    });
  }

  return {
    courseId,
    moduleCode,
    title: courseModule?.title ?? "",
    description: courseModule?.description,
    imageUrl: courseModule?.imageUrl,
    videoUrl: courseModule?.videoUrl,
    slts: (courseModule?.slts ?? []).map(serverSltToDraft),
    assignment: courseModule?.assignment ? serverAssignmentToDraft(courseModule.assignment) : null,
    introduction: courseModule?.introduction ? serverIntroToDraft(courseModule.introduction) : null,
    lessons,
  };
}

/**
 * Check if draft is dirty (has changes from server state)
 */
function checkIsDirty(draft: ModuleDraft | null, serverState: CourseModule | null): boolean {
  if (!draft) return false;

  // For new modules, always dirty if we have any content
  if (!serverState) {
    return draft.title.trim().length > 0 || draft.slts.length > 0;
  }

  // Check metadata changes
  if (draft.title !== (serverState.title ?? "")) return true;
  if (draft.description !== (serverState.description ?? undefined)) return true;

  // Check SLT changes
  const serverSlts = serverState.slts ?? [];
  if (draft.slts.length !== serverSlts.length) return true;
  if (draft.slts.some((slt) => slt._isModified || slt._isNew || slt._isDeleted)) return true;

  // Check assignment changes
  if (draft._deleteAssignment) return true;
  const hasServerAssignment = !!serverState.assignment;
  const hasDraftAssignment = !!draft.assignment;
  if (hasServerAssignment !== hasDraftAssignment) return true;
  if (draft.assignment?._isModified || draft.assignment?._isNew) return true;

  // Check introduction changes
  if (draft._deleteIntroduction) return true;
  const hasServerIntro = !!serverState.introduction;
  const hasDraftIntro = !!draft.introduction;
  if (hasServerIntro !== hasDraftIntro) return true;
  if (draft.introduction?._isModified || draft.introduction?._isNew) return true;

  // Check lesson changes
  if (draft.lessons.size > 0) {
    for (const lesson of draft.lessons.values()) {
      if (lesson._isModified || lesson._isNew) return true;
    }
  }

  return false;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState: ModuleDraftState = {
  courseId: null,
  moduleCode: null,
  isNewModule: false,
  serverState: null,
  draft: null,
  isDirty: false,
  isSaving: false,
  lastError: null,
  lastSaveResult: null,
  _saveFn: null,
};

// =============================================================================
// Store Implementation
// =============================================================================

export const useModuleDraftStore = create<ModuleDraftStore>((set, get) => ({
  ...initialState,

  // ---------------------------------------------------------------------------
  // Initialize
  // ---------------------------------------------------------------------------

  init: (courseId, moduleCode, courseModule, isNewModule) => {
    const draft = createDraftFromServer(courseId, moduleCode, courseModule);

    set({
      courseId,
      moduleCode,
      isNewModule,
      serverState: courseModule,
      draft,
      isDirty: false,
      lastError: null,
      lastSaveResult: null,
    });
  },

  setSaveFn: (fn) => {
    set({ _saveFn: fn });
  },

  // ---------------------------------------------------------------------------
  // Metadata Updates
  // ---------------------------------------------------------------------------

  setMetadata: (title, description) => {
    const { draft, serverState } = get();
    if (!draft) return;

    const newDraft = {
      ...draft,
      title,
      description,
    };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  // ---------------------------------------------------------------------------
  // SLT Updates
  // ---------------------------------------------------------------------------

  addSlt: (text) => {
    const { draft, serverState } = get();
    if (!draft) return;

    const nextIndex = draft.slts.length + 1;
    const newSlt: SLTDraft = {
      _localId: generateLocalId("slt"),
      sltText: text,
      moduleIndex: nextIndex,
      _isNew: true,
      _isModified: false,
      _isDeleted: false,
    };

    const newDraft = {
      ...draft,
      slts: [...draft.slts, newSlt],
    };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  updateSlt: (moduleIndex, text) => {
    const { draft, serverState } = get();
    if (!draft) return;

    const newSlts = draft.slts.map((slt) =>
      slt.moduleIndex === moduleIndex
        ? { ...slt, sltText: text, _isModified: !slt._isNew }
        : slt
    );

    const newDraft = { ...draft, slts: newSlts };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  deleteSlt: (moduleIndex) => {
    const { draft, serverState } = get();
    if (!draft) return;

    // Mark as deleted if it exists on server, otherwise remove entirely
    const newSlts = draft.slts
      .map((slt) => {
        if (slt.moduleIndex !== moduleIndex) return slt;
        // If it's new (not on server), remove it entirely
        if (slt._isNew) return null;
        // Otherwise mark for deletion
        return { ...slt, _isDeleted: true };
      })
      .filter((slt): slt is SLTDraft => slt !== null)
      // Re-index remaining non-deleted SLTs
      .reduce<SLTDraft[]>((acc, slt) => {
        if (slt._isDeleted) {
          acc.push(slt);
        } else {
          acc.push({ ...slt, moduleIndex: acc.filter((s) => !s._isDeleted).length + 1 });
        }
        return acc;
      }, []);

    const newDraft = { ...draft, slts: newSlts };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  reorderSlts: (newOrder) => {
    const { draft, serverState } = get();
    if (!draft) return;

    // newOrder is array of current moduleIndex values in desired order
    // e.g., [3, 1, 2] means: put item at index 3 first, then 1, then 2
    const sltMap = new Map(draft.slts.map((slt) => [slt.moduleIndex, slt]));
    const reorderedSlts: SLTDraft[] = [];

    newOrder.forEach((oldIndex, newIndex) => {
      const slt = sltMap.get(oldIndex);
      if (slt) {
        reorderedSlts.push({
          ...slt,
          moduleIndex: newIndex + 1,
          _isModified: !slt._isNew, // Mark as modified if not new
        });
      }
    });

    const newDraft: ModuleDraft = { ...draft, slts: reorderedSlts };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  // ---------------------------------------------------------------------------
  // Assignment Updates
  // ---------------------------------------------------------------------------

  setAssignment: (data) => {
    const { draft, serverState } = get();
    if (!draft) return;

    let newAssignment: AssignmentDraft | null = null;
    let deleteAssignment = false;

    if (data !== null) {
      const existingAssignment = draft.assignment;
      const isNew = !existingAssignment?.id && !serverState?.assignment;

      newAssignment = {
        ...data,
        _isNew: isNew,
        _isModified: !isNew,
      };
    } else {
      // data is null - check if server had assignment (need to delete)
      if (serverState?.assignment) {
        deleteAssignment = true;
      }
    }

    const newDraft = {
      ...draft,
      assignment: newAssignment,
      _deleteAssignment: deleteAssignment,
    };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  // ---------------------------------------------------------------------------
  // Introduction Updates
  // ---------------------------------------------------------------------------

  setIntroduction: (data) => {
    const { draft, serverState } = get();
    if (!draft) return;

    let newIntro: IntroDraft | null = null;
    let deleteIntroduction = false;

    if (data !== null) {
      const existingIntro = draft.introduction;
      const isNew = !existingIntro?.id && !serverState?.introduction;

      newIntro = {
        ...data,
        _isNew: isNew,
        _isModified: !isNew,
      };
    } else {
      // data is null - check if server had introduction (need to delete)
      if (serverState?.introduction) {
        deleteIntroduction = true;
      }
    }

    const newDraft = {
      ...draft,
      introduction: newIntro,
      _deleteIntroduction: deleteIntroduction,
    };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  // ---------------------------------------------------------------------------
  // Lesson Updates
  // ---------------------------------------------------------------------------

  setLesson: (sltIndex, data) => {
    const { draft, serverState } = get();
    if (!draft) return;

    const newLessons = new Map(draft.lessons);

    if (data === null) {
      // Delete lesson
      newLessons.delete(sltIndex);
    } else {
      const existingLesson = draft.lessons.get(sltIndex);
      const isNew = !existingLesson?.id;

      newLessons.set(sltIndex, {
        ...data,
        sltIndex,
        _isNew: isNew,
        _isModified: !isNew,
      });
    }

    const newDraft = { ...draft, lessons: newLessons };

    set({
      draft: newDraft,
      isDirty: checkIsDirty(newDraft, serverState),
    });
  },

  // ---------------------------------------------------------------------------
  // Persistence
  // ---------------------------------------------------------------------------

  save: async () => {
    const { draft, isDirty, _saveFn } = get();

    if (!draft || !isDirty) {
      return true; // Nothing to save
    }

    if (!_saveFn) {
      set({ lastError: "Save function not configured" });
      return false;
    }

    set({ isSaving: true, lastError: null });

    try {
      const result = await _saveFn(draft);

      if (result.success) {
        // After successful save, the draft becomes the new server state
        // The hook layer should refetch and call init() again
        set({
          isSaving: false,
          lastSaveResult: result,
          // Note: isDirty will be recalculated when init() is called after refetch
        });
        return true;
      } else {
        set({
          isSaving: false,
          lastError: result.error ?? "Save failed",
          lastSaveResult: result,
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Save failed";
      set({
        isSaving: false,
        lastError: errorMessage,
        lastSaveResult: { success: false, error: errorMessage },
      });
      return false;
    }
  },

  discard: () => {
    const { courseId, moduleCode, serverState } = get();

    if (!courseId || !moduleCode) return;

    // Reset draft to server state
    const draft = createDraftFromServer(courseId, moduleCode, serverState);

    set({
      draft,
      isDirty: false,
      lastError: null,
    });
  },

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  reset: () => {
    set(initialState);
  },
}));

// =============================================================================
// Selectors (for performance optimization)
// =============================================================================

export const selectDraft = (state: ModuleDraftStore) => state.draft;
export const selectIsDirty = (state: ModuleDraftStore) => state.isDirty;
export const selectIsSaving = (state: ModuleDraftStore) => state.isSaving;
export const selectLastError = (state: ModuleDraftStore) => state.lastError;
export const selectSlts = (state: ModuleDraftStore) => state.draft?.slts ?? [];
export const selectAssignment = (state: ModuleDraftStore) => state.draft?.assignment ?? null;
export const selectIntroduction = (state: ModuleDraftStore) => state.draft?.introduction ?? null;
export const selectLessons = (state: ModuleDraftStore) => state.draft?.lessons ?? new Map();

// Re-export types
export type { ModuleDraft, SLTDraft, AssignmentDraft, IntroDraft, LessonDraft, SaveModuleDraftResult };
export { generateLocalId } from "./types";
