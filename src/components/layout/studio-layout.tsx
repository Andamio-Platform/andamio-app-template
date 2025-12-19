"use client";

import React, { useState, useCallback } from "react";
import {
  StudioHeader,
  StudioHeaderContext,
  type StudioHeaderContextValue,
} from "./studio-header";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface StudioLayoutProps {
  children: React.ReactNode;
  /** Initial breadcrumbs (can be updated by child pages) */
  initialBreadcrumbs?: BreadcrumbItem[];
  /** Initial title (can be updated by child pages) */
  initialTitle?: string;
  /** Initial status (can be updated by child pages) */
  initialStatus?: string;
  /** Initial status variant */
  initialStatusVariant?: "default" | "secondary" | "destructive" | "outline";
  /** Initial actions (can be updated by child pages) */
  initialActions?: React.ReactNode;
  /** Custom back URL */
  backUrl?: string;
  /** Custom back label */
  backLabel?: string;
}

/**
 * Focused full-screen layout for studio/content creation
 * - No global sidebar - maximum content density
 * - Compact header with context and actions
 * - Fills entire viewport with scrollable content area
 * - Context provider allows child pages to update header
 */
export function StudioLayout({
  children,
  initialBreadcrumbs,
  initialTitle,
  initialStatus,
  initialStatusVariant = "secondary",
  initialActions,
  backUrl,
  backLabel,
}: StudioLayoutProps) {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[] | undefined>(
    initialBreadcrumbs
  );
  const [title, setTitle] = useState<string | undefined>(initialTitle);
  const [status, setStatusState] = useState<string | undefined>(initialStatus);
  const [statusVariant, setStatusVariant] = useState<
    "default" | "secondary" | "destructive" | "outline"
  >(initialStatusVariant);
  const [actions, setActions] = useState<React.ReactNode>(initialActions);

  const setStatus = useCallback(
    (
      newStatus: string,
      variant: "default" | "secondary" | "destructive" | "outline" = "secondary"
    ) => {
      setStatusState(newStatus);
      setStatusVariant(variant);
    },
    []
  );

  const contextValue: StudioHeaderContextValue = {
    setBreadcrumbs,
    setTitle,
    setStatus,
    setActions,
  };

  return (
    <StudioHeaderContext.Provider value={contextValue}>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
        {/* Compact Studio Header */}
        <StudioHeader
          breadcrumbs={breadcrumbs}
          title={title}
          status={status}
          statusVariant={statusVariant}
          actions={actions}
          backUrl={backUrl}
          backLabel={backLabel}
        />

        {/* Content Area - Full width, no max-width constraint */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </StudioHeaderContext.Provider>
  );
}
