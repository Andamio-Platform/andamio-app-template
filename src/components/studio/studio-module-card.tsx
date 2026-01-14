"use client";

import Link from "next/link";
import { SuccessIcon, PendingIcon, NeutralIcon, NextIcon, DeleteIcon } from "~/components/icons";
import { type CourseModuleResponse } from "@andamio/db-api-types";
import { AndamioCard } from "~/components/andamio/andamio-card";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { cn } from "~/lib/utils";

// =============================================================================
// Module Status Configuration
// =============================================================================

type ModuleStatus = CourseModuleResponse["status"] | "APPROVED" | "ARCHIVED" | "BACKLOG" | "DEPRECATED";

interface StatusConfig {
  icon: typeof SuccessIcon;
  iconColor: string;
  label: string;
  textColor: string;
}

const STATUS_CONFIG: Record<ModuleStatus, StatusConfig> = {
  ON_CHAIN: {
    icon: SuccessIcon,
    iconColor: "text-success",
    label: "On-Chain",
    textColor: "text-success",
  },
  PENDING_TX: {
    icon: PendingIcon,
    iconColor: "text-info animate-pulse",
    label: "Pending...",
    textColor: "text-info",
  },
  APPROVED: {
    icon: NeutralIcon,
    iconColor: "text-warning fill-warning",
    label: "Ready to Mint",
    textColor: "text-warning",
  },
  DRAFT: {
    icon: NeutralIcon,
    iconColor: "text-muted-foreground",
    label: "Draft",
    textColor: "text-muted-foreground",
  },
  ARCHIVED: {
    icon: NeutralIcon,
    iconColor: "text-muted-foreground/50",
    label: "Archived",
    textColor: "text-muted-foreground/50",
  },
  BACKLOG: {
    icon: NeutralIcon,
    iconColor: "text-muted-foreground",
    label: "Backlog",
    textColor: "text-muted-foreground",
  },
  DEPRECATED: {
    icon: NeutralIcon,
    iconColor: "text-destructive/50",
    label: "Deprecated",
    textColor: "text-destructive/50",
  },
};

function getStatusConfig(status: string): StatusConfig {
  return STATUS_CONFIG[status as ModuleStatus] ?? STATUS_CONFIG.DRAFT;
}

// =============================================================================
// Module Status Icon
// =============================================================================

function ModuleStatusIcon({ status }: { status: string }) {
  const config = getStatusConfig(status);
  const Icon = config.icon;
  return <Icon className={cn("h-4 w-4", config.iconColor)} />;
}

// =============================================================================
// Module Status Text
// =============================================================================

function ModuleStatusText({ status }: { status: string }) {
  const config = getStatusConfig(status);
  return (
    <span className={cn("text-sm font-medium", config.textColor)}>
      {config.label}
    </span>
  );
}

// =============================================================================
// Studio Module Card
// =============================================================================

export interface StudioModuleCardProps {
  courseModule: CourseModuleResponse;
  courseNftPolicyId: string;
  /** Show the module status text */
  showStatus?: boolean;
  /** Show the module description */
  showDescription?: boolean;
  /** Show the SLT count */
  showSltCount?: boolean;
  /** Callback for deleting the module (only shown for DRAFT modules) */
  onDelete?: () => void;
  /** Whether delete is in progress */
  isDeleting?: boolean;
}

export function StudioModuleCard({
  courseModule,
  courseNftPolicyId,
  showStatus = true,
  showDescription = true,
  showSltCount = true,
  onDelete,
  isDeleting = false,
}: StudioModuleCardProps) {
  const sltCount = courseModule.slts?.length ?? 0;
  // Cast status to string to handle extended statuses like APPROVED
  const status = courseModule.status as string;
  // Only allow delete for DRAFT modules (not minted or pending)
  const canDelete = onDelete && status === "DRAFT";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.();
  };

  return (
    <Link
      href={`/studio/course/${courseNftPolicyId}/${courseModule.module_code}`}
      className="group block"
    >
      <AndamioCard className="p-5 transition-all duration-200 hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Module Info */}
          <div className="flex-1 min-w-0">
            {/* Module Code & Status Icon */}
            <div className="flex items-center gap-2 mb-1">
              <ModuleStatusIcon status={status} />
              <span className="text-xs font-mono text-primary/70 bg-primary/5 px-2 py-0.5 rounded">
                {courseModule.module_code}
              </span>
            </div>

            {/* Title */}
            <div className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {courseModule.title ?? "Untitled Module"}
            </div>

            {/* Description */}
            {showDescription && courseModule.description && (
              <AndamioText variant="muted" className="text-sm mt-1 line-clamp-2">
                {courseModule.description}
              </AndamioText>
            )}
          </div>

          {/* Right: Status & Metadata */}
          <div className="flex items-center gap-4 flex-shrink-0">
            {/* SLT Count */}
            {showSltCount && sltCount > 0 && (
              <AndamioText variant="small" className="text-muted-foreground whitespace-nowrap">
                {sltCount} SLT{sltCount !== 1 ? "s" : ""}
              </AndamioText>
            )}

            {/* Status Text */}
            {showStatus && (
              <>
                <span className="text-muted-foreground/30">·</span>
                <ModuleStatusText status={status} />
              </>
            )}

            {/* Delete Button - Only for DRAFT modules */}
            {canDelete && (
              <AndamioButton
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <DeleteIcon className="h-4 w-4" />
              </AndamioButton>
            )}

            {/* Arrow */}
            <NextIcon className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
          </div>
        </div>
      </AndamioCard>
    </Link>
  );
}

// Export sub-components for flexibility
export { ModuleStatusIcon, ModuleStatusText, getStatusConfig };
