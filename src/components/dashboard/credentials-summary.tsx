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
  CredentialIcon,
  RefreshIcon,
  CourseIcon,
  ExternalLinkIcon,
} from "~/components/icons";
import { useStudentCourses, type StudentCourse } from "~/hooks/api";

interface CredentialsSummaryProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * Check if a course is completed
 */
function isCompleted(course: StudentCourse): boolean {
  return course.enrollmentStatus === "completed";
}

/**
 * Credentials Summary Card
 *
 * Displays a summary of credentials the user has earned (completed courses).
 * Shows on the dashboard for authenticated users.
 *
 * Uses the merged student courses endpoint and filters for completed courses.
 *
 * UX States:
 * - Loading: Skeleton cards
 * - Empty: Action-oriented with Browse Courses button
 * - Error: Silent fail (log only, show empty state)
 */
export function CredentialsSummary({ accessTokenAlias }: CredentialsSummaryProps) {
  const { data: allCourses, isLoading, error, refetch } = useStudentCourses();

  // Filter for completed courses (all modules finished)
  const completedCourses = React.useMemo(
    () => allCourses?.filter(isCompleted) ?? [],
    [allCourses]
  );

  // Log errors silently (per user preference)
  React.useEffect(() => {
    if (error) {
      console.error("[CredentialsSummary] Failed to load credentials:", error.message);
    }
  }, [error]);

  // No access token - don't show this component
  if (!accessTokenAlias) {
    return null;
  }

  // Loading state - skeleton cards
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <AndamioCardIconHeader icon={CredentialIcon} title="My Credentials" />
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-3">
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

  // Empty state or error (silent fail shows empty) - action-oriented
  if (!completedCourses || completedCourses.length === 0 || error) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <AndamioCardIconHeader icon={CredentialIcon} title="My Credentials" />
            {!error && (
              <AndamioButton variant="ghost" size="icon-sm" onClick={() => refetch()}>
                <RefreshIcon className="h-4 w-4" />
              </AndamioButton>
            )}
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
              <CredentialIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <AndamioText variant="small" className="font-medium">
              No credentials yet
            </AndamioText>
            <AndamioText variant="small" className="text-xs mt-1 text-muted-foreground max-w-[200px]">
              Complete a course to earn your first on-chain credential
            </AndamioText>
            <Link href="/course" className="mt-3">
              <AndamioButton size="sm">
                <CourseIcon className="mr-2 h-3 w-3" />
                Browse Courses
              </AndamioButton>
            </Link>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <AndamioCardIconHeader icon={CredentialIcon} title="My Credentials" />
          <div className="flex items-center gap-2">
            <AndamioBadge status="success" className="text-xs">
              {completedCourses.length} earned
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={() => refetch()}>
              <RefreshIcon className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-3">
        {/* Summary stat */}
        <div className="flex items-center gap-2 bg-success/10 rounded-lg px-3 py-2">
          <CredentialIcon className="h-4 w-4 text-success" />
          <div>
            <AndamioText className="text-lg font-semibold">{completedCourses.length}</AndamioText>
            <AndamioText variant="small" className="text-xs">
              {completedCourses.length === 1 ? "Credential" : "Credentials"} earned on-chain
            </AndamioText>
          </div>
        </div>

        {/* Credential list */}
        <div className="space-y-1.5">
          {completedCourses.slice(0, 3).map((course, index) => (
            <Link
              key={course.courseId ?? index}
              href={`/course/${course.courseId ?? ""}`}
              className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <CredentialIcon className="h-3.5 w-3.5 text-success shrink-0" />
                {course.title ? (
                  <span className="text-xs truncate">{course.title}</span>
                ) : (
                  <code className="text-xs font-mono truncate">
                    {course.courseId?.slice(0, 16) ?? "Unknown"}...
                  </code>
                )}
              </div>
              <ExternalLinkIcon className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </Link>
          ))}
          {completedCourses.length > 3 && (
            <AndamioText variant="small" className="text-xs text-center pt-1">
              +{completedCourses.length - 3} more credentials
            </AndamioText>
          )}
        </div>

        {/* View all link */}
        <div className="pt-2">
          <Link href="/credentials" className="block">
            <AndamioButton variant="outline" size="sm" className="w-full">
              <CredentialIcon className="mr-2 h-3 w-3" />
              View All Credentials
            </AndamioButton>
          </Link>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
