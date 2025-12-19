"use client";

import React from "react";
import {
  AndamioCard,
  AndamioCardContent,
  AndamioCardHeader,
  AndamioCardTitle,
} from "~/components/andamio/andamio-card";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  Database,
  BookOpen,
  Award,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useUserGlobalState } from "~/hooks/use-andamioscan";
import Link from "next/link";

interface OnChainStatusProps {
  accessTokenAlias: string | null | undefined;
}

/**
 * On-Chain Status Card
 *
 * Displays the user's on-chain state from Andamioscan:
 * - Enrolled courses
 * - Earned credentials
 * - Links to course detail pages
 */
export function OnChainStatus({ accessTokenAlias }: OnChainStatusProps) {
  const { data: userState, isLoading, error, refetch } = useUserGlobalState(
    accessTokenAlias ?? undefined
  );

  // No access token - show prompt to mint
  if (!accessTokenAlias) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <AndamioCardTitle className="text-base">On-Chain Data</AndamioCardTitle>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <AndamioText variant="small" className="font-medium">
              Mint Access Token
            </AndamioText>
            <AndamioText variant="small" className="text-xs mt-1 max-w-[200px]">
              Mint your access token to view your on-chain learning data
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <AndamioCardTitle className="text-base">On-Chain Data</AndamioCardTitle>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <AndamioText variant="small" className="mt-2">
              Loading blockchain data...
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Error state
  if (error) {
    return (
      <AndamioCard>
        <AndamioCardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-muted-foreground" />
              <AndamioCardTitle className="text-base">On-Chain Data</AndamioCardTitle>
            </div>
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </AndamioButton>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-3">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <AndamioText variant="small" className="font-medium text-destructive">
              Failed to load data
            </AndamioText>
            <AndamioText variant="small" className="text-xs mt-1 max-w-[200px]">
              {error.message}
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Calculate stats
  const enrolledCourses = userState?.courses.filter((c) => c.is_enrolled) ?? [];
  const totalCredentials = userState?.courses.reduce(
    (sum, c) => sum + c.credentials.length,
    0
  ) ?? 0;

  return (
    <AndamioCard>
      <AndamioCardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-muted-foreground" />
            <AndamioCardTitle className="text-base">On-Chain Data</AndamioCardTitle>
          </div>
          <div className="flex items-center gap-2">
            <AndamioBadge variant="outline" className="text-xs">
              <CheckCircle2 className="mr-1 h-3 w-3 text-success" />
              Live
            </AndamioBadge>
            <AndamioButton variant="ghost" size="icon-sm" onClick={refetch}>
              <RefreshCw className="h-4 w-4" />
            </AndamioButton>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <BookOpen className="h-4 w-4 text-info" />
            <div>
              <AndamioText className="text-lg font-semibold">{enrolledCourses.length}</AndamioText>
              <AndamioText variant="small" className="text-xs">
                {enrolledCourses.length === 1 ? "Course" : "Courses"}
              </AndamioText>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
            <Award className="h-4 w-4 text-warning" />
            <div>
              <AndamioText className="text-lg font-semibold">{totalCredentials}</AndamioText>
              <AndamioText variant="small" className="text-xs">
                {totalCredentials === 1 ? "Credential" : "Credentials"}
              </AndamioText>
            </div>
          </div>
        </div>

        {/* Enrolled Courses List */}
        {enrolledCourses.length > 0 ? (
          <div className="space-y-2">
            <AndamioText variant="overline">
              Active Enrollments
            </AndamioText>
            <div className="space-y-1.5">
              {enrolledCourses.slice(0, 3).map((course) => (
                <Link
                  key={course.course_id}
                  href={`/course/${course.course_id}`}
                  className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <code className="text-xs font-mono truncate">
                      {course.course_id.slice(0, 16)}...
                    </code>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {course.credentials.length > 0 && (
                      <AndamioBadge variant="secondary" className="text-xs">
                        <Award className="mr-1 h-3 w-3" />
                        {course.credentials.length}
                      </AndamioBadge>
                    )}
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
              {enrolledCourses.length > 3 && (
                <AndamioText variant="small" className="text-xs text-center pt-1">
                  +{enrolledCourses.length - 3} more courses
                </AndamioText>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-3">
            <AndamioText variant="small">
              No course enrollments yet
            </AndamioText>
            <Link
              href="/course"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Browse courses →
            </Link>
          </div>
        )}

        {/* Credentials Summary */}
        {totalCredentials > 0 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <AndamioText variant="small" className="text-xs">
                {totalCredentials} credential{totalCredentials !== 1 ? "s" : ""} earned on-chain
              </AndamioText>
              <AndamioBadge variant="outline" className="text-xs text-success">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Verified
              </AndamioBadge>
            </div>
          </div>
        )}
      </AndamioCardContent>
    </AndamioCard>
  );
}
