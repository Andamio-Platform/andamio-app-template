"use client";

import React from "react";
import Link from "next/link";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCardIconHeader } from "~/components/andamio/andamio-card-icon-header";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import {
  TeacherIcon,
  RefreshIcon,
  AlertIcon,
  SuccessIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { useTeacherAssignmentCommitments } from "~/hooks/api";

interface PendingReviewsSummaryProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * Pending Reviews Summary Card
 *
 * Displays a summary of assignments awaiting teacher review.
 * Shows on the dashboard for users who teach courses.
 *
 * Uses the merged teacher commitments endpoint for pending assessment data.
 *
 * UX States:
 * - Loading: Skeleton cards
 * - Empty: Informative "All caught up!" message
 * - Error: Inline alert with retry button
 */
export function PendingReviewsSummary({ accessTokenAlias }: PendingReviewsSummaryProps) {
  const { data: pendingAssessments, isLoading, error, refetch } = useTeacherAssignmentCommitments();

  // No access token - don't show this component
  if (!accessTokenAlias) {
    return null;
  }

  // Loading state - skeleton cards
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={TeacherIcon} title="Pending Reviews" />
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
          {/* Skeleton cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-md bg-muted/30">
              <AndamioSkeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <AndamioSkeleton className="h-4 w-32" />
                <AndamioSkeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Error state - inline alert with retry
  if (error) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader icon={TeacherIcon} title="Pending Reviews" />
            <AndamioButton variant="ghost" size="icon-sm" onClick={() => refetch()}>
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-2">
              <AlertIcon className="h-5 w-5 text-destructive" />
            </div>
            <AndamioText variant="small" className="font-medium text-destructive">
              Failed to load pending reviews
            </AndamioText>
            <AndamioText variant="small" className="text-xs mt-1 max-w-[200px]">
              {error.message}
            </AndamioText>
            <AndamioButton variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              <RefreshIcon className="mr-2 h-3 w-3" />
              Retry
            </AndamioButton>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Empty state - all caught up
  if (!pendingAssessments || pendingAssessments.length === 0) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader icon={TeacherIcon} title="Pending Reviews" />
            <AndamioButton variant="ghost" size="icon-sm" onClick={() => refetch()}>
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mb-2">
              <SuccessIcon className="h-5 w-5 text-primary" />
            </div>
            <AndamioText variant="small" className="font-medium">
              All caught up!
            </AndamioText>
            <AndamioText variant="small" className="text-xs mt-1 text-muted-foreground">
              No pending assignment reviews at this time
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Group by course
  const byCourse = pendingAssessments.reduce((acc, assessment) => {
    const existing = acc.get(assessment.courseId);
    if (existing) {
      existing.count++;
    } else {
      acc.set(assessment.courseId, { courseId: assessment.courseId, count: 1 });
    }
    return acc;
  }, new Map<string, { courseId: string; count: number }>());

  const courseGroups = Array.from(byCourse.values());

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader icon={TeacherIcon} title="Pending Reviews" />
          <div className="flex items-center gap-2">
            <AndamioBadge variant="secondary" className="text-xs">
              {pendingAssessments.length} pending
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={() => refetch()}>
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-3">
        {/* Summary stat */}
        <div className="flex items-center gap-2 bg-muted/10 rounded-lg px-3 py-2">
          <TeacherIcon className="h-4 w-4 text-muted-foreground" />
          <div>
            <AndamioText className="text-lg font-semibold">{pendingAssessments.length}</AndamioText>
            <AndamioText variant="small" className="text-xs">
              {pendingAssessments.length === 1 ? "Assignment" : "Assignments"} awaiting review
            </AndamioText>
          </div>
        </div>

        {/* Course list */}
        <div className="space-y-1.5">
          {courseGroups.slice(0, 3).map((group) => (
            <Link
              key={group.courseId}
              href={`/studio/course/${group.courseId}/teacher`}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <TeacherIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <code className="text-xs font-mono truncate">
                  {group.courseId.slice(0, 16)}...
                </code>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <AndamioBadge variant="secondary" className="text-xs">
                  {group.count} pending
                </AndamioBadge>
                <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
          {courseGroups.length > 3 && (
            <AndamioText variant="small" className="text-xs text-center pt-1">
              +{courseGroups.length - 3} more courses
            </AndamioText>
          )}
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
