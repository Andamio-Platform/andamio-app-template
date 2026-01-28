/**
 * AndamioEmptyState - Reusable empty state display
 *
 * Provides consistent empty state UI across the application.
 * Used when there's no data to display (empty lists, no results, etc.)
 *
 * Usage:
 * import { AndamioEmptyState } from "~/components/andamio";
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <AndamioEmptyState
 *   icon={BookOpen}
 *   title="No courses found"
 * />
 *
 * // With description and action
 * <AndamioEmptyState
 *   icon={BookOpen}
 *   title="No courses yet"
 *   description="Browse courses and commit to assignments to see them here."
 *   action={<AndamioButton>Browse Courses</AndamioButton>}
 * />
 *
 * // Custom icon size
 * <AndamioEmptyState
 *   icon={FileText}
 *   iconSize="sm"
 *   title="No documents"
 * />
 * ```
 */

import * as React from "react";
import { cn } from "~/lib/utils";
import type { IconComponent } from "~/types/ui";
import { AndamioText } from "./andamio-text";

export interface AndamioEmptyStateProps {
  /**
   * Lucide icon component to display
   */
  icon: IconComponent;
  /**
   * Main title text
   */
  title: string;
  /**
   * Optional description text
   */
  description?: string;
  /**
   * Optional action element (button, link)
   */
  action?: React.ReactNode;
  /**
   * Icon size variant
   * @default "lg"
   */
  iconSize?: "sm" | "md" | "lg";
  /**
   * Additional className for the container
   */
  className?: string;
}

const iconSizeClasses = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-12 w-12",
};

export function AndamioEmptyState({
  icon: Icon,
  title,
  description,
  action,
  iconSize = "lg",
  className,
}: AndamioEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon
          className={cn(
            "text-muted-foreground",
            iconSizeClasses[iconSize]
          )}
        />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <AndamioText variant="muted" className="max-w-sm mb-6">
          {description}
        </AndamioText>
      )}
      {action}
    </div>
  );
}
