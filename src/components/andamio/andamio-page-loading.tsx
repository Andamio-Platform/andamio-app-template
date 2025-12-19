/**
 * AndamioPageLoading - Reusable page loading skeleton
 *
 * Provides consistent loading states for pages with different layouts.
 * Extracted from common patterns across course pages.
 *
 * Usage:
 * import { AndamioPageLoading } from "~/components/andamio";
 *
 * @example
 * ```tsx
 * // Basic list page loading
 * <AndamioPageLoading variant="list" />
 *
 * // Detail page with header
 * <AndamioPageLoading variant="detail" />
 *
 * // Content page with large content area
 * <AndamioPageLoading variant="content" />
 *
 * // Custom number of list items
 * <AndamioPageLoading variant="list" itemCount={3} />
 * ```
 */

import * as React from "react";
import { AndamioSkeleton } from "./andamio-skeleton";
import { cn } from "~/lib/utils";

export interface AndamioPageLoadingProps {
  /**
   * Layout variant for the loading skeleton
   * - "list": Header + list of items (default)
   * - "detail": Large header + description + content area
   * - "content": Header + large content block
   * @default "list"
   */
  variant?: "list" | "detail" | "content";
  /**
   * Number of skeleton items in list variant
   * @default 5
   */
  itemCount?: number;
  /**
   * Additional className for the container
   */
  className?: string;
}

export function AndamioPageLoading({
  variant = "list",
  itemCount = 5,
  className,
}: AndamioPageLoadingProps) {
  if (variant === "detail") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Header */}
        <div>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
        </div>
        {/* List items */}
        <div className="space-y-2">
          {Array.from({ length: itemCount }).map((_, i) => (
            <AndamioSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === "content") {
    return (
      <div className={cn("space-y-6", className)}>
        {/* Breadcrumb placeholder */}
        <AndamioSkeleton className="h-8 w-32" />
        {/* Header */}
        <AndamioSkeleton className="h-12 w-full" />
        {/* Content area */}
        <AndamioSkeleton className="h-64 w-full" />
      </div>
    );
  }

  // Default: list variant
  return (
    <div className={cn("space-y-6", className)}>
      {/* Page header area */}
      <div>
        <AndamioSkeleton className="h-9 w-48 mb-2" />
        <AndamioSkeleton className="h-5 w-72" />
      </div>
      {/* List items */}
      <div className="space-y-2">
        {Array.from({ length: itemCount }).map((_, i) => (
          <AndamioSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
