"use client";

import React, { useState, useCallback, useId } from "react";
import { DeleteIcon, EditIcon, CompletedIcon, CloseIcon, AlertIcon, LoadingIcon, AddIcon, SLTIcon, DragHandleIcon, LockedIcon } from "~/components/icons";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useWizard } from "../module-wizard";
import { WizardStep } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import {
  useCreateSLT,
  useUpdateSLT,
  useDeleteSLT,
  useReorderSLT,
} from "~/hooks/api/course/use-slt";
import type { SLT } from "~/hooks/api";
import type { WizardStepConfig } from "../types";
import { AndamioInput } from "~/components/andamio";

interface StepSLTsProps {
  config: WizardStepConfig;
  direction: number;
}

// Local SLT with stable ID for React keys (index changes during reorder/delete)
type LocalSLT = SLT & { _localId: string };

// Generate a stable local ID for an SLT
let localIdCounter = 0;
const generateLocalId = () => `slt-${Date.now()}-${++localIdCounter}`;

// Convert API SLTs to local SLTs with stable IDs
const toLocalSlts = (slts: SLT[]): LocalSLT[] =>
  slts.map((slt) => ({ ...slt, _localId: generateLocalId() }));

/**
 * StepSLTs - Define learning targets with "I can..." statements
 *
 * Uses optimistic updates for instant feedback.
 * Simple CSS transitions for performance.
 */
export function StepSLTs({ config, direction }: StepSLTsProps) {
  const {
    data,
    goNext,
    goPrevious,
    canGoPrevious,
    courseNftPolicyId,
    moduleCode,
    updateSlts,
  } = useWizard();
  const { isAuthenticated } = useAndamioAuth();
  const inputId = useId();

  // Use SLT mutation hooks (handles cache invalidation automatically)
  const createSLT = useCreateSLT();
  const updateSLT = useUpdateSLT();
  const deleteSLT = useDeleteSLT();
  const reorderSLT = useReorderSLT();

  // Check if SLTs are locked (module is approved or on-chain)
  const moduleStatus = data.courseModule?.status;
  const isLocked = moduleStatus === "approved" || moduleStatus === "active" || moduleStatus === "pending_tx";

  // Local state for optimistic updates - use LocalSLT with stable IDs
  const [localSlts, setLocalSlts] = useState<LocalSLT[]>(() => toLocalSlts(data.slts));
  const [newSltText, setNewSltText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Sync local state when data changes from server
  React.useEffect(() => {
    setLocalSlts(toLocalSlts(data.slts));
  }, [data.slts]);

  const canProceed = localSlts.length > 0;

  // Track pending operation
  const addPendingOp = (id: string) => setPendingOps((s) => new Set(s).add(id));
  const removePendingOp = (id: string) => setPendingOps((s) => { const n = new Set(s); n.delete(id); return n; });

  /**
   * Create new SLT with optimistic update
   */
  const handleCreate = useCallback(async () => {
    if (!isAuthenticated || !newSltText.trim()) return;

    const text = newSltText.trim();
    // API v2.0.0+: moduleIndex is 1-based (new item gets next sequential index)
    const nextSltIndex = localSlts.length + 1;
    const opId = `create-${nextSltIndex}`;

    // Optimistic update - compute the list we'll set
    const optimisticSlt: LocalSLT = {
      moduleIndex: nextSltIndex,
      sltText: text,
      _localId: generateLocalId(),
    };
    const optimisticList = [...localSlts, optimisticSlt];
    setLocalSlts(optimisticList);
    setNewSltText("");
    setError(null);
    addPendingOp(opId);

    try {
      // Use the hook - it handles cache invalidation automatically
      await createSLT.mutateAsync({
        courseId: courseNftPolicyId,
        moduleCode,
        sltText: text,
      });

      // Sync to context so wizard stepper updates
      updateSlts(optimisticList);
    } catch (err) {
      // Rollback optimistic update using stable _localId
      setLocalSlts((prev) => prev.filter((s) => s._localId !== optimisticSlt._localId));
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, newSltText, localSlts, courseNftPolicyId, moduleCode, updateSlts, createSLT]);

  /**
   * Update SLT with optimistic update
   */
  const handleUpdate = useCallback(async (slt: LocalSLT) => {
    if (!isAuthenticated || !editingText.trim()) return;

    const text = editingText.trim();
    const opId = `update-${slt.moduleIndex}`;
    // API v2.0.0+: moduleIndex is already 1-based, no conversion needed
    const sltIndex = slt.moduleIndex ?? 1;

    // Compute the optimistic list and set it
    const updatedList = localSlts.map((s) => s.moduleIndex === slt.moduleIndex ? { ...s, sltText: text } : s);
    setLocalSlts(updatedList);
    setEditingIndex(null);
    setEditingText("");
    setError(null);
    addPendingOp(opId);

    try {
      // Use the hook - it handles cache invalidation automatically
      // API v2.0.0+: moduleIndex is 1-based
      await updateSLT.mutateAsync({
        courseId: courseNftPolicyId,
        moduleCode,
        sltIndex,
        sltText: text,
      });

      // Sync to context so wizard stepper updates
      updateSlts(updatedList);
    } catch (err) {
      // Rollback
      setLocalSlts((prev) =>
        prev.map((s) => s.moduleIndex === slt.moduleIndex ? slt : s)
      );
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, editingText, localSlts, courseNftPolicyId, moduleCode, updateSlts, updateSLT]);

  /**
   * Delete SLT with optimistic update and re-index remaining SLTs
   */
  const handleDelete = useCallback(async (slt: LocalSLT) => {
    if (!isAuthenticated) return;

    const opId = `delete-${slt._localId}`;
    // API v2.0.0+: moduleIndex is already 1-based, no conversion needed
    const sltIndex = slt.moduleIndex ?? 1;

    // Remove SLT and re-index remaining ones sequentially (1-based for API v2.0.0+)
    const filteredList = localSlts
      .filter((s) => s._localId !== slt._localId)
      .sort((a, b) => (a.moduleIndex ?? 1) - (b.moduleIndex ?? 1))
      .map((s, idx) => ({ ...s, moduleIndex: idx + 1 }));

    setLocalSlts(filteredList);
    setError(null);
    addPendingOp(opId);

    try {
      // Use the hook - it handles cache invalidation automatically
      // API v2.0.0+: moduleIndex is 1-based
      await deleteSLT.mutateAsync({
        courseId: courseNftPolicyId,
        moduleCode,
        sltIndex,
      });

      // Note: Re-indexing remaining SLTs after delete
      // The API may handle this automatically, or indices may have gaps.
      // If gaps occur, refetching from API will get correct indices.

      // Sync to context so wizard stepper updates
      updateSlts(filteredList);
    } catch (err) {
      // Rollback - restore the deleted SLT
      setLocalSlts((prev) => {
        const newList = [...prev, slt].sort((a, b) => (a.moduleIndex ?? 1) - (b.moduleIndex ?? 1));
        return newList;
      });
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, localSlts, courseNftPolicyId, moduleCode, updateSlts, deleteSLT]);

  const startEditing = (slt: SLT) => {
    setEditingIndex(slt.moduleIndex ?? null);
    setEditingText(slt.sltText ?? "");
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newSltText.trim()) {
      void handleCreate();
    }
  };

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle drag end - reorder SLTs and persist to database
   */
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Find items by _localId (stable identifier for DnD)
    const oldArrayIndex = localSlts.findIndex((s) => s._localId === active.id);
    const newArrayIndex = localSlts.findIndex((s) => s._localId === over.id);
    if (oldArrayIndex === -1 || newArrayIndex === -1) return;

    if (oldArrayIndex === newArrayIndex) return;

    // Reorder the array locally
    const reorderedArray = arrayMove(localSlts, oldArrayIndex, newArrayIndex);

    // Update local state with new 1-based indexes (API v2.0.0+)
    const reorderedSlts = reorderedArray.map((slt, idx) => ({
      ...slt,
      moduleIndex: idx + 1,
    }));
    setLocalSlts(reorderedSlts);

    // Build the list of current indices in the new order for the batch API
    // API v2.0.0+: batch reorder endpoint takes array of current indices in desired order
    const sltIndices = reorderedArray.map((slt) => slt.moduleIndex ?? 1);

    try {
      // Use the hook - it handles cache invalidation automatically
      // API v2.0.0+: batch endpoint with slt_indices array
      await reorderSLT.mutateAsync({
        courseId: courseNftPolicyId,
        moduleCode,
        sltIndices,
      });

      // Sync to context
      updateSlts(reorderedSlts);
    } catch (err) {
      // Rollback on error
      setLocalSlts(localSlts);
      setError(err instanceof Error ? err.message : "Failed to reorder");
    }
  }, [localSlts, courseNftPolicyId, moduleCode, updateSlts, reorderSLT]);

  const isPending = pendingOps.size > 0;

  return (
    <WizardStep config={config} direction={direction}>
      <div className="space-y-6">
        {/* Input Section or Locked Notice */}
        {isLocked ? (
          <div className="rounded-lg border-2 border-muted-foreground/30 bg-muted/5 p-4">
            <div className="flex items-center gap-3 text-muted-foreground">
              <LockedIcon className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Learning Targets are locked</p>
                <p className="text-sm text-muted-foreground">
                  SLTs cannot be modified after a module is approved. Return the module to Draft status to make changes.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border-2 border-border p-4">
            <div className="flex items-center gap-3">
              <AndamioInput
                id={inputId}
                value={newSltText}
                onChange={(e) => setNewSltText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Explain how smart contracts execute on-chain"
                className="h-12 flex-1 text-base px-4"
                disabled={isPending}
              />
              <Button
                onClick={() => void handleCreate()}
                disabled={!newSltText.trim() || isPending}
                className="h-11 px-5"
              >
                {isPending ? (
                  <LoadingIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <AddIcon className="h-4 w-4 mr-2" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertIcon className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* SLT List */}
        {localSlts.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <SLTIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Add your first learning target above
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(e: DragEndEvent) => void handleDragEnd(e)}
          >
            <SortableContext
              items={localSlts.map((s) => s._localId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localSlts.map((slt) => (
                  <SortableSltItem
                    key={slt._localId}
                    slt={slt}
                    moduleCode={moduleCode}
                    isEditing={editingIndex === slt.moduleIndex}
                    isUpdating={pendingOps.has(`update-${slt.moduleIndex}`)}
                    isLocked={isLocked}
                    editingText={editingText}
                    onEditingTextChange={setEditingText}
                    onStartEditing={() => startEditing(slt)}
                    onCancelEditing={cancelEditing}
                    onUpdate={() => void handleUpdate(slt)}
                    onDelete={() => void handleDelete(slt)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <WizardNavigation
        onPrevious={goPrevious}
        onNext={goNext}
        canGoPrevious={canGoPrevious}
        canGoNext={canProceed}
        nextLabel="Design the Assignment"
      />
    </WizardStep>
  );
}

/**
 * Sortable SLT Item Component
 */
interface SortableSltItemProps {
  slt: LocalSLT;
  moduleCode: string;
  isEditing: boolean;
  isUpdating: boolean;
  isLocked: boolean;
  editingText: string;
  onEditingTextChange: (text: string) => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

function SortableSltItem({
  slt,
  moduleCode,
  isEditing,
  isUpdating,
  isLocked,
  editingText,
  onEditingTextChange,
  onStartEditing,
  onCancelEditing,
  onUpdate,
  onDelete,
}: SortableSltItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slt._localId, disabled: isLocked });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-150",
        isDragging
          ? "border-primary bg-primary/5 shadow-lg z-50"
          : isEditing
            ? "border-primary bg-primary/5"
            : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
      )}
    >
      {/* Drag handle - hidden when locked */}
      {!isLocked && (
        <button
          type="button"
          className={cn(
            "flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground transition-colors",
            isDragging && "cursor-grabbing"
          )}
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon className="h-4 w-4" />
        </button>
      )}

      {/* SLT Reference: <module-code>.<moduleIndex> (API v2.0.0+: already 1-based) */}
      <span className="flex-shrink-0 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono font-medium">
        {moduleCode}.{slt.moduleIndex ?? 1}
      </span>

      {/* Content */}
      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <AndamioInput
            value={editingText}
            onChange={(e) => onEditingTextChange(e.target.value)}
            className="h-9 flex-1"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onUpdate();
              if (e.key === "Escape") onCancelEditing();
            }}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={onUpdate}
            disabled={!editingText.trim()}
            className="h-8 w-8 text-primary hover:text-primary"
          >
            <CompletedIcon className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCancelEditing}
            className="h-8 w-8"
          >
            <CloseIcon className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <span className={cn(
            "flex-1 text-sm",
            isUpdating && "opacity-50"
          )}>
            {slt.sltText}
          </span>
          {/* Edit/Delete buttons - hidden when locked */}
          {!isLocked && (
            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="ghost"
                onClick={onStartEditing}
                className="h-7 w-7"
              >
                <EditIcon className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={onDelete}
                className="h-7 w-7 hover:text-destructive"
              >
                <DeleteIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
