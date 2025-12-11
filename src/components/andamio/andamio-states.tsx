/**
 * Andamio State Display Components
 *
 * Reusable components for loading, error, and empty states.
 * Eliminates repeated state UI patterns across pages.
 *
 * @example
 * ```tsx
 * if (isLoading) return <LoadingState />;
 * if (error) return <ErrorState message={error} onRetry={refetch} />;
 * if (items.length === 0) return <EmptyState title="No items" />;
 * ```
 */

"use client";

import React from "react";
import { AlertCircle, Inbox, Loader2, RefreshCw } from "lucide-react";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "./andamio-alert";
import { AndamioButton } from "./andamio-button";
import { AndamioSkeleton } from "./andamio-skeleton";
import type { IconComponent } from "~/types/ui";

/**
 * LoadingState - Skeleton loading placeholder
 */
export interface LoadingStateProps {
  /**
   * Number of skeleton rows to show
   * @default 5
   */
  rows?: number;
  /**
   * Show a header skeleton
   * @default true
   */
  showHeader?: boolean;
  /**
   * Custom className for the container
   */
  className?: string;
  /**
   * Variant: "card" shows card-like skeletons, "list" shows list items
   * @default "list"
   */
  variant?: "list" | "card" | "minimal";
}

export function LoadingState({
  rows = 5,
  showHeader = true,
  className,
  variant = "list",
}: LoadingStateProps) {
  if (variant === "minimal") {
    return (
      <div className={`flex items-center justify-center py-8 ${className ?? ""}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (variant === "card") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className ?? ""}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <AndamioSkeleton className="h-5 w-3/4" />
            <AndamioSkeleton className="h-4 w-full" />
            <AndamioSkeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className ?? ""}`}>
      {showHeader && (
        <>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
        </>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <AndamioSkeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

/**
 * ErrorState - Error alert with optional retry
 */
export interface ErrorStateProps {
  /**
   * Error message to display
   */
  message: string;
  /**
   * Error title
   * @default "Error"
   */
  title?: string;
  /**
   * Callback for retry button
   */
  onRetry?: () => void;
  /**
   * Text for retry button
   * @default "Try Again"
   */
  retryLabel?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Icon to display
   * @default AlertCircle
   */
  icon?: IconComponent;
}

export function ErrorState({
  message,
  title = "Error",
  onRetry,
  retryLabel = "Try Again",
  className,
  icon: IconProp,
}: ErrorStateProps) {
  const Icon: IconComponent = IconProp ?? AlertCircle;
  return (
    <div className={`space-y-4 ${className ?? ""}`}>
      <AndamioAlert variant="destructive">
        <Icon className="h-4 w-4" />
        <AndamioAlertTitle>{title}</AndamioAlertTitle>
        <AndamioAlertDescription>{message}</AndamioAlertDescription>
      </AndamioAlert>
      {onRetry && (
        <AndamioButton variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {retryLabel}
        </AndamioButton>
      )}
    </div>
  );
}

/**
 * EmptyState - Placeholder for empty lists/data
 */
export interface EmptyStateProps {
  /**
   * Title text
   * @default "No items found"
   */
  title?: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Icon to display
   * @default Inbox
   */
  icon?: IconComponent;
  /**
   * Action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Custom className
   */
  className?: string;
}

export function EmptyState({
  title = "No items found",
  description,
  icon: IconProp,
  action,
  className,
}: EmptyStateProps) {
  const Icon: IconComponent = IconProp ?? Inbox;
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center border rounded-md ${className ?? ""}`}
    >
      <Icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      )}
      {action && (
        <AndamioButton onClick={action.onClick}>{action.label}</AndamioButton>
      )}
    </div>
  );
}

/**
 * NotFoundState - 404-style not found display
 */
export interface NotFoundStateProps {
  /**
   * What was not found
   * @default "Item"
   */
  itemType?: string;
  /**
   * Navigation action
   */
  backAction?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Custom className
   */
  className?: string;
}

export function NotFoundState({
  itemType = "Item",
  backAction,
  className,
}: NotFoundStateProps) {
  const NotFoundIcon: IconComponent = AlertCircle;
  return (
    <EmptyState
      title={`${itemType} not found`}
      description={`The ${itemType.toLowerCase()} you're looking for doesn't exist or has been removed.`}
      icon={NotFoundIcon}
      action={backAction}
      className={className}
    />
  );
}

/**
 * AuthRequiredState - Prompt for authentication
 */
export interface AuthRequiredStateProps {
  /**
   * Feature that requires auth
   */
  feature?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Children to render (e.g., auth button)
   */
  children?: React.ReactNode;
}

export function AuthRequiredState({
  feature = "this feature",
  className,
  children,
}: AuthRequiredStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-12 text-center border rounded-md ${className ?? ""}`}
    >
      <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-1">Authentication Required</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">
        Connect your wallet to access {feature}.
      </p>
      {children}
    </div>
  );
}
