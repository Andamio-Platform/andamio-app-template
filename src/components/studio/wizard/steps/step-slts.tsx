"use client";

import React, { useState, useCallback, useId } from "react";
import { DeleteIcon, EditIcon, CompletedIcon, CloseIcon, AlertIcon, LoadingIcon, AddIcon, SLTIcon, DragHandleIcon } from "~/components/icons";
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
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import type { WizardStepConfig } from "../types";
import type { ListSLTsOutput } from "@andamio/db-api";
import { AndamioInput } from "~/components/andamio";

interface StepSLTsProps {
  config: WizardStepConfig;
  direction: number;
}

type SLT = ListSLTsOutput[number];

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

  // Local state for optimistic updates
  const [localSlts, setLocalSlts] = useState<SLT[]>(data.slts);
  const [newSltText, setNewSltText] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [pendingOps, setPendingOps] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Sync local state when data changes from server
  React.useEffect(() => {
    setLocalSlts(data.slts);
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
      ? Math.max(...localSlts.map((s) => s.module_index)) + 1
      : 1;
    const opId = `create-${nextIndex}`;

    // Optimistic update - compute the list we'll set
    const optimisticSlt: SLT = {
      id: `temp-${nextIndex}`,
      module_index: nextIndex,
      slt_text: text,
    };
    const optimisticList = [...localSlts, optimisticSlt];
    setLocalSlts(optimisticList);
    setNewSltText("");
    setError(null);
    addPendingOp(opId);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: nextIndex,
            slt_text: text,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json() as { message?: string };
        throw new Error(errorData.message ?? "Failed to create");
      }

      // Update optimistic item with real ID from server and sync to context
      const result = await response.json() as { id: string };
      const finalList = optimisticList.map((s) => s.id === optimisticSlt.id ? { ...s, id: result.id } : s);
      setLocalSlts(finalList);
      updateSlts(finalList);
    } catch (err) {
      // Rollback optimistic update
      setLocalSlts((prev) => prev.filter((s) => s.id !== optimisticSlt.id));
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, newSltText, localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, updateSlts]);

  /**
   * Update SLT with optimistic update
   */
  const handleUpdate = useCallback(async (slt: SLT) => {
    if (!isAuthenticated || !editingText.trim()) return;

    const text = editingText.trim();
    const opId = `update-${slt.module_index}`;

    // Compute the optimistic list and set it
    const updatedList = localSlts.map((s) => s.module_index === slt.module_index ? { ...s, slt_text: text } : s);
    setLocalSlts(updatedList);
    setEditingIndex(null);
    setEditingText("");
    setError(null);
    addPendingOp(opId);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/update`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: slt.module_index,
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
        prev.map((s) => s.module_index === slt.module_index ? slt : s)
      );
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, editingText, localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, updateSlts]);

  /**
   * Delete SLT with optimistic update
   */
  const handleDelete = useCallback(async (slt: SLT) => {
    if (!isAuthenticated) return;

    const opId = `delete-${slt.module_index}`;

    // Compute the optimistic list and set it
    const filteredList = localSlts.filter((s) => s.module_index !== slt.module_index);
    setLocalSlts(filteredList);
    setError(null);
    addPendingOp(opId);

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            module_index: slt.module_index,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to delete");
      // Sync to context so sidebar count updates
      updateSlts(filteredList);
    } catch (err) {
      // Rollback
      setLocalSlts((prev) => {
        const newList = [...prev, slt].sort((a, b) => a.module_index - b.module_index);
        return newList;
      });
      setError(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, updateSlts]);

  const startEditing = (slt: SLT) => {
    setEditingIndex(slt.module_index);
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
   * Handle drag end - reorder SLTs
   */
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localSlts.findIndex((s) => s.id === active.id);
    const newIndex = localSlts.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Optimistic update
    const reorderedSlts = arrayMove(localSlts, oldIndex, newIndex);
    setLocalSlts(reorderedSlts);

    // Build the new order mapping
    const reorderData = reorderedSlts.map((slt, idx) => ({
      id: slt.id,
      module_index: idx + 1,
    }));

    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/reorder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_nft_policy_id: courseNftPolicyId,
            module_code: moduleCode,
            order: reorderData,
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
        {/* Input Section */}
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
              items={localSlts.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localSlts.map((slt) => (
                  <SortableSltItem
                    key={slt.id}
                    slt={slt}
                    moduleCode={moduleCode}
                    isEditing={editingIndex === slt.module_index}
                    isUpdating={pendingOps.has(`update-${slt.module_index}`)}
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
  slt: SLT;
  moduleCode: string;
  isEditing: boolean;
  isUpdating: boolean;
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
  } = useSortable({ id: slt.id });

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
      {/* Drag handle */}
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

      {/* SLT Reference: <module-code>.<module-index> */}
      <span className="flex-shrink-0 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono font-medium">
        {moduleCode}.{slt.module_index}
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
        </>
      )}
    </div>
  );
}
