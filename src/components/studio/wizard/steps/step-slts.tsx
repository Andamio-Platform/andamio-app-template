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
import type { WizardStepConfig } from "../types";
import type { SLTListResponse } from "~/types/generated";
import { AndamioInput } from "~/components/andamio";

interface StepSLTsProps {
  config: WizardStepConfig;
  direction: number;
}

type SLT = SLTListResponse[number];

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
  const { authenticatedFetch, isAuthenticated } = useAndamioAuth();
  const inputId = useId();

  // Check if SLTs are locked (module is approved or on-chain)
  const moduleStatus = data.courseModule?.module_status;
  const isLocked = moduleStatus === "APPROVED" || moduleStatus === "ON_CHAIN" || moduleStatus === "PENDING_TX";

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
    const nextIndex = localSlts.length > 0
      ? Math.max(...localSlts.map((s) => s.index ?? 0)) + 1
      : 1;
    const opId = `create-${nextIndex}`;

    // Optimistic update - compute the list we'll set
    // Note: course_module_code and course_id are not on the SLT response type
    // (they're sent separately in the API request), so we don't include them here
    const optimisticSlt: LocalSLT = {
      index: nextIndex,
      slt_text: text,
      _localId: generateLocalId(),
    };
    const optimisticList = [...localSlts, optimisticSlt];
    setLocalSlts(optimisticList);
    setNewSltText("");
    setError(null);
    addPendingOp(opId);

    try {
      // Go API: POST /course/teacher/slt/create
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slt_text: text,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "Failed to create");
      }

      // Sync to context - the optimistic item is already correct
      await response.json();
      updateSlts(optimisticList);
    } catch (err) {
      // Rollback optimistic update using stable _localId
      setLocalSlts((prev) => prev.filter((s) => s._localId !== optimisticSlt._localId));
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, newSltText, localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, updateSlts]);

  /**
   * Update SLT with optimistic update
   */
  const handleUpdate = useCallback(async (slt: LocalSLT) => {
    if (!isAuthenticated || !editingText.trim()) return;

    const text = editingText.trim();
    const opId = `update-${slt.index}`;

    // Compute the optimistic list and set it
    const updatedList = localSlts.map((s) => s.index === slt.index ? { ...s, slt_text: text } : s);
    setLocalSlts(updatedList);
    setEditingIndex(null);
    setEditingText("");
    setError(null);
    addPendingOp(opId);

    try {
      // Go API: POST /course/teacher/slt/update
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            index: slt.index,
            slt_text: text,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update");
      // Sync to context so sidebar count updates
      updateSlts(updatedList);
    } catch (err) {
      // Rollback
      setLocalSlts((prev) =>
        prev.map((s) => s.index === slt.index ? slt : s)
      );
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, editingText, localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, updateSlts]);

  /**
   * Delete SLT with optimistic update and re-index remaining SLTs
   */
  const handleDelete = useCallback(async (slt: LocalSLT) => {
    if (!isAuthenticated) return;

    const opId = `delete-${slt._localId}`;

    // Remove SLT and re-index remaining ones sequentially
    const filteredList = localSlts
      .filter((s) => s._localId !== slt._localId)
      .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
      .map((s, idx) => ({ ...s, index: idx + 1 }));

    setLocalSlts(filteredList);
    setError(null);
    addPendingOp(opId);

    try {
      // Step 1: Delete the SLT
      const deleteResponse = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slt/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            index: slt.index,
          }),
        }
      );

      if (!deleteResponse.ok) throw new Error("Failed to delete");

      // Step 2: Re-index remaining SLTs if there are any
      if (filteredList.length > 0) {
        // Build mapping: index (current in DB) -> new_index (target)
        const reorderData = filteredList.map((s) => ({
          index: localSlts.find((orig) => orig._localId === s._localId)?.index ?? s.index,
          new_index: s.index,
        })).filter((item) => item.index !== item.new_index);

        if (reorderData.length > 0) {
          const reorderResponse = await authenticatedFetch(
            `/api/gateway/api/v2/course/teacher/slts/batch-reorder`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                course_id: courseNftPolicyId,
                course_module_code: moduleCode,
                slts: reorderData,
              }),
            }
          );

          if (!reorderResponse.ok) {
            console.warn("Failed to re-index SLTs after delete, but delete succeeded");
          }
        }
      }

      // Sync to context so sidebar count updates
      updateSlts(filteredList);
    } catch (err) {
      // Rollback - restore the deleted SLT
      setLocalSlts((prev) => {
        const newList = [...prev, slt].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        return newList;
      });
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, updateSlts]);

  const startEditing = (slt: SLT) => {
    setEditingIndex(slt.index ?? null);
    setEditingText(slt.slt_text ?? "");
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

    // Reorder the array
    const reorderedArray = arrayMove(localSlts, oldArrayIndex, newArrayIndex);

    // Build the mapping for the API: index (current) -> new_index (target)
    const reorderData = reorderedArray.map((slt, idx) => ({
      index: slt.index,     // Current index in DB
      new_index: idx + 1,   // Target sequential index
    })).filter((item) => item.index !== item.new_index);

    // Update local state with new sequential indexes
    const reorderedSlts = reorderedArray.map((slt, idx) => ({
      ...slt,
      index: idx + 1,
    }));
    setLocalSlts(reorderedSlts);

    // Only call API if there are actual changes
    if (reorderData.length === 0) {
      updateSlts(reorderedSlts);
      return;
    }

    try {
      // Go API: POST /course/teacher/slts/batch-reorder
      const response = await authenticatedFetch(
        `/api/gateway/api/v2/course/teacher/slts/batch-reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseNftPolicyId,
            course_module_code: moduleCode,
            slts: reorderData,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to reorder");
      // Sync to context
      updateSlts(reorderedSlts);
    } catch (err) {
      // Rollback on error
      setLocalSlts(localSlts);
      setError(err instanceof Error ? err.message : "Failed to reorder");
    }
  }, [localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, updateSlts]);

  const isPending = pendingOps.size > 0;

  return (
    <WizardStep config={config} direction={direction}>
      <div className="space-y-6">
        {/* Input Section or Locked Notice */}
        {isLocked ? (
          <div className="rounded-lg border-2 border-warning/30 bg-warning/5 p-4">
            <div className="flex items-center gap-3 text-warning">
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
                    isEditing={editingIndex === slt.index}
                    isUpdating={pendingOps.has(`update-${slt.index}`)}
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

      {/* SLT Reference: <module-code>.<index> */}
      <span className="flex-shrink-0 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono font-medium">
        {moduleCode}.{slt.index}
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
            {slt.slt_text}
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
