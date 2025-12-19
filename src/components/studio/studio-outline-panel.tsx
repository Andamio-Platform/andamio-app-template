"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  FileText,
  Target,
  ClipboardCheck,
  BookOpen,
  Presentation,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
  Circle,
  CheckCircle,
} from "lucide-react";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioScrollArea } from "~/components/andamio/andamio-scroll-area";
import { cn } from "~/lib/utils";
import type { IconComponent } from "~/types/ui";

export interface OutlineStep {
  /** Unique identifier for the step (used in URL) */
  id: string;
  /** Display label */
  label: string;
  /** Icon to display */
  icon: IconComponent;
  /** Whether step is completed */
  isComplete?: boolean;
  /** Number of items (e.g., "3 SLTs") */
  count?: number;
  /** Whether step is currently active */
  isActive?: boolean;
  /** Whether step is locked (can't be clicked) */
  isLocked?: boolean;
}

interface StudioOutlinePanelProps {
  /** Steps to display in the outline */
  steps: OutlineStep[];
  /** Callback when step is clicked */
  onStepClick?: (stepId: string) => void;
  /** Whether panel is collapsed to icons only */
  isCollapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
  /** URL parameter name for step (defaults to "step") */
  stepParam?: string;
  /** Title for the outline panel */
  title?: string;
}

/**
 * Default wizard steps for module editing
 */
export const MODULE_WIZARD_STEPS: Omit<OutlineStep, "isComplete" | "count" | "isActive">[] = [
  { id: "blueprint", label: "Blueprint", icon: FileText },
  { id: "slts", label: "Learning Targets", icon: Target },
  { id: "assignment", label: "Assignment", icon: ClipboardCheck },
  { id: "lessons", label: "Lessons", icon: BookOpen },
  { id: "introduction", label: "Introduction", icon: Presentation },
  { id: "review", label: "Review", icon: CheckCircle2 },
];

/**
 * Collapsible outline panel for studio pages
 * Shows wizard steps/sections with completion status
 * Click to navigate (URL-based)
 */
export function StudioOutlinePanel({
  steps,
  onStepClick,
  isCollapsed = false,
  onCollapsedChange,
  stepParam = "step",
  title = "Outline",
}: StudioOutlinePanelProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStep = searchParams.get(stepParam);

  const handleStepClick = (stepId: string) => {
    if (onStepClick) {
      onStepClick(stepId);
    } else {
      // Default: update URL param
      const params = new URLSearchParams(searchParams.toString());
      params.set(stepParam, stepId);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-muted/30">
      {/* Header with collapse toggle */}
      <div
        className={cn(
          "flex items-center justify-between border-b border-border px-3 py-2",
          isCollapsed && "justify-center px-2"
        )}
      >
        {!isCollapsed && (
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
        )}
        {onCollapsedChange && (
          <AndamioButton
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => onCollapsedChange(!isCollapsed)}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-3.5 w-3.5" />
            ) : (
              <PanelLeftClose className="h-3.5 w-3.5" />
            )}
          </AndamioButton>
        )}
      </div>

      {/* Steps list */}
      <AndamioScrollArea className="flex-1">
        <div className={cn("py-2", isCollapsed ? "px-2" : "px-2")}>
          {steps.map((step, index) => {
            const isActive = step.isActive ?? currentStep === step.id;
            const Icon = step.icon;

            return (
              <button
                key={step.id}
                onClick={() => !step.isLocked && handleStepClick(step.id)}
                disabled={step.isLocked}
                className={cn(
                  "w-full flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  isActive && "bg-accent text-accent-foreground",
                  step.isLocked && "opacity-50 cursor-not-allowed",
                  isCollapsed && "justify-center px-0"
                )}
              >
                {/* Completion indicator */}
                <div className="relative flex-shrink-0">
                  {step.isComplete ? (
                    <CheckCircle className="h-4 w-4 text-success" />
                  ) : isActive ? (
                    <Circle className="h-4 w-4 fill-primary text-primary" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                {/* Step content */}
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-sm truncate",
                          isActive ? "font-medium" : "font-normal"
                        )}
                      >
                        {step.label}
                      </span>
                      {step.count !== undefined && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          ({step.count})
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Icon on right when expanded, centered when collapsed */}
                {!isCollapsed && (
                  <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </AndamioScrollArea>

      {/* Footer with progress summary */}
      {!isCollapsed && (
        <div className="border-t border-border px-3 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>
              {steps.filter((s) => s.isComplete).length}/{steps.length}
            </span>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-300"
              style={{
                width: `${(steps.filter((s) => s.isComplete).length / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
