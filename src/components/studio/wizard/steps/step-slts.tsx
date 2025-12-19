"use client";

import React, { useState, useCallback, useId } from "react";
import { Trash2, Pencil, Check, X, AlertCircle, Loader2 } from "lucide-react";
import { useWizard } from "../module-wizard";
import { WizardStep, WizardStepTip } from "../wizard-step";
import { WizardNavigation } from "../wizard-navigation";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { AndamioText } from "~/components/andamio/andamio-text";
import { cn } from "~/lib/utils";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { env } from "~/env";
import type { WizardStepConfig } from "../types";
import type { ListSLTsOutput } from "@andamio/db-api";

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
    refetchData,
    courseNftPolicyId,
    moduleCode,
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

    // Optimistic update
    const optimisticSlt: SLT = {
      id: `temp-${nextIndex}`,
      module_index: nextIndex,
      slt_text: text,
    };
    setLocalSlts((prev) => [...prev, optimisticSlt]);
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

      // Sync with server
      await refetchData();
    } catch (err) {
      // Rollback optimistic update
      setLocalSlts((prev) => prev.filter((s) => s.id !== optimisticSlt.id));
      setError(err instanceof Error ? err.message : "Failed to create");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, newSltText, localSlts, authenticatedFetch, courseNftPolicyId, moduleCode, refetchData]);

  /**
   * Update SLT with optimistic update
   */
  const handleUpdate = useCallback(async (slt: SLT) => {
    if (!isAuthenticated || !editingText.trim()) return;

    const text = editingText.trim();
    const opId = `update-${slt.module_index}`;

    // Optimistic update
    setLocalSlts((prev) =>
      prev.map((s) => s.module_index === slt.module_index ? { ...s, slt_text: text } : s)
    );
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

      await refetchData();
    } catch (err) {
      // Rollback
      setLocalSlts((prev) =>
        prev.map((s) => s.module_index === slt.module_index ? slt : s)
      );
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      removePendingOp(opId);
    }
  }, [isAuthenticated, editingText, authenticatedFetch, courseNftPolicyId, moduleCode, refetchData]);

  /**
   * Delete SLT with optimistic update
   */
  const handleDelete = useCallback(async (slt: SLT) => {
    if (!isAuthenticated) return;

    const opId = `delete-${slt.module_index}`;

    // Optimistic update
    setLocalSlts((prev) => prev.filter((s) => s.module_index !== slt.module_index));
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

      await refetchData();
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
  }, [isAuthenticated, authenticatedFetch, courseNftPolicyId, moduleCode, refetchData]);

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

  const isPending = pendingOps.size > 0;

  return (
    <WizardStep config={config} direction={direction}>
      <div className="space-y-8">
        {/* Introduction */}
        <div className="space-y-2">
          <AndamioText variant="lead">
            Define what learners will be able to do after completing this module.
          </AndamioText>
          <AndamioText variant="small">
            Each learning target becomes a credential that learners can earn.
          </AndamioText>
        </div>

        {/* Input section */}
        <div className="space-y-4">
          <label htmlFor={inputId} className="block text-sm font-medium">
            Add a Learning Target
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                I can
              </span>
              <Input
                id={inputId}
                value={newSltText}
                onChange={(e) => setNewSltText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="explain how blockchain validates transactions..."
                className="h-14 pl-16 text-base"
                disabled={isPending}
              />
            </div>
            <Button
              onClick={() => void handleCreate()}
              disabled={!newSltText.trim() || isPending}
              className="h-14 px-6"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
            </Button>
          </div>
        </div>

        {/* SLT List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Learning Targets
            </h3>
            {localSlts.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {localSlts.length} target{localSlts.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {localSlts.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed rounded-xl">
              <AndamioText variant="muted">No learning targets yet</AndamioText>
              <AndamioText variant="small" className="text-muted-foreground/70 mt-1">
                Add your first &quot;I can...&quot; statement above
              </AndamioText>
            </div>
          ) : (
            <div className="space-y-2">
              {localSlts.map((slt, index) => {
                const isEditing = editingIndex === slt.module_index;
                const opId = `update-${slt.module_index}`;
                const isUpdating = pendingOps.has(opId);

                return (
                  <div
                    key={slt.module_index}
                    className={cn(
                      "group flex items-start gap-4 p-4 rounded-xl border bg-card transition-colors duration-150",
                      isEditing && "ring-2 ring-primary/20 border-primary/30"
                    )}
                  >
                    {/* Index badge */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </div>

                    {/* Content */}
                    {isEditing ? (
                      <div className="flex-1 flex items-center gap-2">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            I can
                          </span>
                          <Input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="pl-14"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") void handleUpdate(slt);
                              if (e.key === "Escape") cancelEditing();
                            }}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => void handleUpdate(slt)}
                          disabled={!editingText.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0 py-1">
                          <AndamioText className={cn(
                            "leading-relaxed",
                            isUpdating && "opacity-50"
                          )}>
                            <span className="text-muted-foreground">I can </span>
                            {slt.slt_text}
                          </AndamioText>
                        </div>
                        <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEditing(slt)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => void handleDelete(slt)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <WizardStepTip>
          <strong>Good learning targets are specific and measurable.</strong>{" "}
          Focus on observable actions: &quot;explain&quot;, &quot;build&quot;, &quot;analyze&quot;, or &quot;demonstrate&quot;.
        </WizardStepTip>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <AndamioText variant="small" className="text-destructive">{error}</AndamioText>
          </div>
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
