"use client";

import { useMemo } from "react";
import Link from "next/link";
import { SuccessIcon, PendingIcon, NeutralIcon, NextIcon } from "~/components/icons";
import { type CourseModuleResponse } from "@andamio/db-api-types";
import { AndamioCard } from "~/components/andamio/andamio-card";
import { AndamioText } from "~/components/andamio/andamio-text";
import { cn } from "~/lib/utils";

// =============================================================================
// Wizard Steps Configuration
// =============================================================================

const WIZARD_STEPS = [
  { id: "credential", label: "Credential", required: true },
  { id: "slts", label: "SLTs", required: true },
  { id: "assignment", label: "Assignment", required: true },
  { id: "lessons", label: "Lessons", required: false },
  { id: "introduction", label: "Introduction", required: true },
  { id: "review", label: "Review", required: true },
] as const;

// =============================================================================
// Types
// =============================================================================

interface ModuleCompletion {
  credential: boolean;
  slts: boolean;
  assignment: boolean | null; // null = unknown
  lessons: boolean | null;
  introduction: boolean | null;
  review: boolean;
}

// =============================================================================
// Module Status Icon
// =============================================================================

function ModuleStatusIcon({ status }: { status: CourseModuleResponse["status"] }) {
  const config: Record<string, { icon: typeof SuccessIcon; color: string; label: string }> = {
    ON_CHAIN: { icon: SuccessIcon, color: "text-success", label: "On-Chain" },
    PENDING_TX: { icon: PendingIcon, color: "text-info animate-pulse", label: "Pending" },
    APPROVED: { icon: NeutralIcon, color: "text-warning fill-warning", label: "Ready" },
    DRAFT: { icon: NeutralIcon, color: "text-muted-foreground", label: "Draft" },
    ARCHIVED: { icon: NeutralIcon, color: "text-muted-foreground/50", label: "Archived" },
    BACKLOG: { icon: NeutralIcon, color: "text-muted-foreground", label: "Backlog" },
    DEPRECATED: { icon: NeutralIcon, color: "text-destructive/50", label: "Deprecated" },
  };

  const statusConfig = config[status] ?? { icon: NeutralIcon, color: "text-muted-foreground", label: "Draft" };
  const { icon: Icon, color } = statusConfig;
  return <Icon className={cn("h-4 w-4", color)} />;
}

// =============================================================================
// Module Progress Indicator
// =============================================================================

function ModuleProgressIndicator({
  completion,
  compact = false,
}: {
  completion: ModuleCompletion;
  compact?: boolean;
}) {
  // Calculate progress percentage (treat unknown as potentially complete)
  const totalRequired = WIZARD_STEPS.filter(s => s.required).length;
  const completedRequired = WIZARD_STEPS.filter(step => {
    if (!step.required) return false;
    return completion[step.id as keyof ModuleCompletion] === true;
  }).length;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {WIZARD_STEPS.map((step) => {
          const status = completion[step.id as keyof ModuleCompletion];
          return (
            <div
              key={step.id}
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                status === true && "bg-success",
                status === false && "bg-muted-foreground/30",
                status === null && "bg-muted-foreground/15"
              )}
              title={`${step.label}: ${status === true ? "Complete" : status === false ? "Incomplete" : "Unknown"}`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {WIZARD_STEPS.map((step, index) => {
          const status = completion[step.id as keyof ModuleCompletion];
          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  "h-2 w-2 rounded-full transition-colors",
                  status === true && "bg-success",
                  status === false && "bg-muted-foreground/40",
                  status === null && "bg-muted-foreground/20 ring-1 ring-muted-foreground/10"
                )}
                title={`${step.label}: ${status === true ? "Complete" : status === false ? "Incomplete" : "Unknown"}`}
              />
              {index < WIZARD_STEPS.length - 1 && (
                <div className={cn(
                  "h-px w-1.5 mx-0.5",
                  status === true ? "bg-success/50" : "bg-muted-foreground/20"
                )} />
              )}
            </div>
          );
        })}
      </div>
      <AndamioText variant="small" className="text-muted-foreground">
        {completedRequired}/{totalRequired}
      </AndamioText>
    </div>
  );
}

// =============================================================================
// Studio Module Card
// =============================================================================

export interface StudioModuleCardProps {
  courseModule: CourseModuleResponse;
  courseNftPolicyId: string;
  /** Show the 6-step wizard progress indicator */
  showProgress?: boolean;
  /** Show the module description */
  showDescription?: boolean;
  /** Show the SLT count */
  showSltCount?: boolean;
}

export function StudioModuleCard({
  courseModule,
  courseNftPolicyId,
  showProgress = true,
  showDescription = true,
  showSltCount = true,
}: StudioModuleCardProps) {
  // Calculate completion based on available data
  const completion: ModuleCompletion = useMemo(() => {
    const hasTitle = !!courseModule.title?.trim();
    const hasSLTs = (courseModule.slts?.length ?? 0) > 0;
    const isOnChain = courseModule.status === "ON_CHAIN";

    return {
      credential: hasTitle,
      slts: hasSLTs,
      // These require additional API calls - show as unknown for now
      // If module is ON_CHAIN, these were complete at some point
      assignment: isOnChain ? true : null,
      lessons: isOnChain ? true : null,
      introduction: isOnChain ? true : null,
      review: isOnChain,
    };
  }, [courseModule]);

  return (
    <Link
      href={`/studio/course/${courseNftPolicyId}/${courseModule.module_code}`}
      className="group block"
    >
      <AndamioCard className="p-5 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Module Info */}
          <div className="flex-1 min-w-0">
            {/* Module Code & Status */}
            <div className="flex items-center gap-2 mb-2">
              <ModuleStatusIcon status={courseModule.status} />
              <span className="text-xs font-mono text-primary/70 bg-primary/5 px-2 rounded">
                {courseModule.module_code}
              </span>
            {/* Title */}
            <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {courseModule.title ?? "Untitled Module"}
            </div>
            </div>


            {/* Description */}
            {showDescription && courseModule.description && (
              <AndamioText variant="muted" className="text-sm mt-1 mb-2 line-clamp-2">
                {courseModule.description}
              </AndamioText>
            )}

          </div>

          {/* Right: Arrow */}
            {/* Progress Indicator & SLT Count */}
            {(showProgress || showSltCount) && (
              <div className="flex items-center gap-4 mt-2">
                {showSltCount && courseModule.slts && courseModule.slts.length > 0 && (
                  <AndamioText variant="small" className="text-muted-foreground">
                    {courseModule.slts.length} SLT{courseModule.slts.length !== 1 ? "s" : ""}
                  </AndamioText>
                )}
                {showProgress && <ModuleProgressIndicator completion={completion} />}
              </div>
            )}
          <NextIcon className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 flex-shrink-0 mt-1" />
        </div>
      </AndamioCard>
    </Link>
  );
}

// Export sub-components for flexibility
export { ModuleStatusIcon, ModuleProgressIndicator, WIZARD_STEPS };
export type { ModuleCompletion };
