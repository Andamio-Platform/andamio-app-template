"use client";

import React from "react";
import { useCourse } from "~/hooks/use-andamioscan";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardDescription,
  AndamioCardHeader,
  AndamioCardTitle,
  AndamioBadge,
  AndamioSkeleton,
  AndamioAlert,
  AndamioAlertDescription,
  AndamioTooltip,
  AndamioTooltipContent,
  AndamioTooltipTrigger,
} from "~/components/andamio";
import {
  CheckCircle,
  AlertCircle,
  Blocks,
} from "lucide-react";
import { type AndamioscanModule } from "~/lib/andamioscan";
import { AndamioText } from "~/components/andamio/andamio-text";

// =============================================================================
// Types
// =============================================================================

interface OnChainSltsViewerProps {
  courseNftPolicyId: string;
  moduleHash?: string;
  /** If true, shows compact inline view */
  compact?: boolean;
}

interface OnChainModuleCardProps {
  module: AndamioscanModule;
  compact?: boolean;
}

// =============================================================================
// Components
// =============================================================================

/**
 * Card displaying a single on-chain module's SLTs
 */
function OnChainModuleCard({ module, compact = false }: OnChainModuleCardProps) {
  const truncatedHash = `${module.assignment_id.slice(0, 8)}...${module.assignment_id.slice(-8)}`;

  if (compact) {
    return (
      <div className="rounded-lg border bg-muted/30 p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/10">
              <Blocks className="h-3.5 w-3.5 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">On-chain</span>
          </div>
          <code className="text-xs font-mono text-muted-foreground">{truncatedHash}</code>
        </div>
        <ul className="space-y-1.5">
          {module.slts.map((slt, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <AndamioBadge variant="outline" className="shrink-0 text-xs">
                {index + 1}
              </AndamioBadge>
              <span>{slt}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
              <Blocks className="h-5 w-5 text-success" />
            </div>
            <div>
              <AndamioCardTitle className="text-base">On-Chain Learning Targets</AndamioCardTitle>
              <AndamioCardDescription>
                Verified on the Cardano blockchain
              </AndamioCardDescription>
            </div>
          </div>
          <AndamioTooltip>
            <AndamioTooltipTrigger asChild>
              <AndamioBadge variant="outline" className="font-mono text-xs cursor-help">
                {truncatedHash}
              </AndamioBadge>
            </AndamioTooltipTrigger>
            <AndamioTooltipContent>
              <p>Module Hash: {module.assignment_id}</p>
            </AndamioTooltipContent>
          </AndamioTooltip>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent>
        <div className="space-y-3">
          {module.slts.map((slt, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border bg-background"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/10 text-sm font-medium text-success">
                {index + 1}
              </div>
              <div className="flex-1 pt-1">
                <AndamioText className="text-sm">{slt}</AndamioText>
              </div>
              <CheckCircle className="h-4 w-4 shrink-0 text-success mt-1" />
            </div>
          ))}
        </div>

        {/* Module metadata */}
        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div>
            <span className="font-medium">Created by:</span> {module.created_by}
          </div>
          {module.prerequisites.length > 0 && (
            <div>
              <span className="font-medium">Prerequisites:</span>{" "}
              {module.prerequisites.map((p, i) => (
                <code key={i} className="bg-muted px-1 rounded ml-1">
                  {p.slice(0, 8)}...
                </code>
              ))}
            </div>
          )}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}

/**
 * Viewer component for on-chain SLTs
 *
 * Shows SLTs that are minted on the Cardano blockchain for a course.
 * Can display all modules or a specific module by hash.
 */
export function OnChainSltsViewer({
  courseNftPolicyId,
  moduleHash,
  compact = false,
}: OnChainSltsViewerProps) {
  const { data: course, isLoading, error } = useCourse(courseNftPolicyId);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        {compact ? (
          <AndamioSkeleton className="h-24 w-full" />
        ) : (
          <AndamioSkeleton className="h-48 w-full" />
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioAlert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AndamioAlertDescription>
          Failed to load on-chain data: {error.message}
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // No course on-chain
  if (!course) {
    return (
      <AndamioAlert>
        <Blocks className="h-4 w-4" />
        <AndamioAlertDescription>
          This course is not yet registered on the blockchain.
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // No modules on-chain
  if (course.modules.length === 0) {
    return (
      <AndamioAlert>
        <Blocks className="h-4 w-4" />
        <AndamioAlertDescription>
          No modules have been minted on-chain for this course yet.
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  // Filter to specific module if hash provided
  const modulesToShow = moduleHash
    ? course.modules.filter((m) => m.assignment_id === moduleHash)
    : course.modules;

  if (moduleHash && modulesToShow.length === 0) {
    return (
      <AndamioAlert>
        <Blocks className="h-4 w-4" />
        <AndamioAlertDescription>
          Module not found on-chain. The SLTs may not have been minted yet.
        </AndamioAlertDescription>
      </AndamioAlert>
    );
  }

  return (
    <div className="space-y-4">
      {modulesToShow.map((module) => (
        <OnChainModuleCard
          key={module.assignment_id}
          module={module}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Summary badge showing on-chain SLT count for a course
 */
export function OnChainSltsBadge({
  courseNftPolicyId,
}: {
  courseNftPolicyId: string;
}) {
  const { data: course, isLoading } = useCourse(courseNftPolicyId);

  if (isLoading) {
    return <AndamioSkeleton className="h-5 w-24" />;
  }

  if (!course || course.modules.length === 0) {
    return null;
  }

  const totalSlts = course.modules.reduce((sum, m) => sum + m.slts.length, 0);

  return (
    <AndamioTooltip>
      <AndamioTooltipTrigger asChild>
        <AndamioBadge variant="outline" className="text-success border-success">
          <Blocks className="h-3 w-3 mr-1" />
          {totalSlts} on-chain
        </AndamioBadge>
      </AndamioTooltipTrigger>
      <AndamioTooltipContent>
        <p>
          {course.modules.length} modules with {totalSlts} SLTs verified on Cardano
        </p>
      </AndamioTooltipContent>
    </AndamioTooltip>
  );
}
