import * as React from "react";
import { cn } from "~/lib/utils";
import { AndamioText } from "./andamio-text";

interface AndamioPageHeaderProps {
  /**
   * Page title (h1)
   */
  title: string;
  /**
   * Optional page description
   */
  description?: string;
  /**
   * Optional action element (button, link, etc.) displayed on the right
   */
  action?: React.ReactNode;
  /**
   * Optional badge or indicator displayed next to the title
   */
  badge?: React.ReactNode;
  /**
   * Additional className for the container
   */
  className?: string;
  /**
   * Center the header text (useful for landing pages)
   */
  centered?: boolean;
}

/**
 * AndamioPageHeader - Responsive page header component
 *
 * Provides consistent, responsive page headers across the application.
 * Handles title, description, badges, and action buttons with proper
 * stacking behavior on mobile devices.
 *
 * @example
 * ```tsx
 * // Basic usage
 * <AndamioPageHeader
 *   title="Dashboard"
 *   description="Welcome to your personalized dashboard"
 * />
 *
 * // With action button
 * <AndamioPageHeader
 *   title="Courses"
 *   description="Manage your courses"
 *   action={<Button>Create Course</Button>}
 * />
 *
 * // Centered (for landing pages)
 * <AndamioPageHeader
 *   title="Welcome"
 *   description="Start your learning journey"
 *   centered
 * />
 * ```
 */
export function AndamioPageHeader({
  title,
  description,
  action,
  badge,
  className,
  centered = false,
}: AndamioPageHeaderProps) {
  if (centered) {
    return (
      <div className={cn("text-center max-w-3xl mx-auto space-y-2 sm:space-y-4 px-4 sm:px-0", className)}>
        <h1>{title}</h1>
        {description && (
          <AndamioText variant="lead">
            {description}
          </AndamioText>
        )}
        {action && (
          <div className="pt-2 sm:pt-4">
            {action}
          </div>
        )}
      </div>
    );
  }

  // Layout with action: flex container that stacks on mobile
  if (action) {
    return (
      <div className={cn("flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4", className)}>
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1>{title}</h1>
            {badge}
          </div>
          {description && (
            <AndamioText variant="small">
              {description}
            </AndamioText>
          )}
        </div>
        <div className="shrink-0">
          {action}
        </div>
      </div>
    );
  }

  // Simple layout without action
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <h1>{title}</h1>
        {badge}
      </div>
      {description && (
        <AndamioText variant="small">
          {description}
        </AndamioText>
      )}
    </div>
  );
}
