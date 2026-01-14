"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useCourseStudent, useCourse as useOnChainCourse } from "~/hooks/use-andamioscan";
import { useCourse, useCourseModules } from "~/hooks/api";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioCardLoading } from "~/components/andamio/andamio-loading";
import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { AndamioText } from "~/components/andamio/andamio-text";
import {
  SuccessIcon,
  PendingIcon,
  OnChainIcon,
  ModuleIcon,
} from "~/components/icons";

/**
 * User Course Status Component
 *
 * Displays the authenticated learner's on-chain progress in a course.
 * Uses Andamioscan API for real-time blockchain data.
 *
 * Data Sources:
 * - Andamioscan: GET /v2/courses/{course_id}/students/{alias}/status
 * - Andamioscan: GET /v2/courses/{course_id}/details (for module mapping)
 * - Database: Course modules (for module code/title display)
 */

interface UserCourseStatusProps {
  courseNftPolicyId: string;
}

export function UserCourseStatus({ courseNftPolicyId }: UserCourseStatusProps) {
  const { isAuthenticated, user } = useAndamioAuth();

  // Fetch on-chain student status from Andamioscan
  const {
    data: studentStatus,
    isLoading: studentLoading,
    refetch: refetchStudent,
  } = useCourseStudent(courseNftPolicyId, user?.accessTokenAlias ?? undefined);

  // Fetch on-chain course data for module hash mapping
  const { data: onChainCourse, isLoading: courseLoading } = useOnChainCourse(courseNftPolicyId);

  // Fetch database course for title
  const { data: dbCourse } = useCourse(courseNftPolicyId);

  // Fetch database modules for module code/title mapping
  const { data: dbModules } = useCourseModules(courseNftPolicyId);

  // Map module hashes to module codes for display
  const moduleHashToInfo = useMemo(() => {
    const map = new Map<string, { code: string; title: string }>();
    if (!onChainCourse || !dbModules) return map;

    // For each on-chain module, try to find matching DB module by SLT overlap
    for (const onChainModule of onChainCourse.modules) {
      const onChainSlts = new Set(onChainModule.slts);

      for (const dbModule of dbModules) {
        const dbSltTexts = new Set(dbModule.slts.map((s) => s.slt_text));
        const intersection = [...dbSltTexts].filter((t) => onChainSlts.has(t));

        // Match if significant overlap
        if (intersection.length > 0 && intersection.length >= onChainModule.slts.length * 0.5) {
          map.set(onChainModule.assignment_id, {
            code: dbModule.module_code,
            title: dbModule.title,
          });
          break;
        }
      }
    }

    return map;
  }, [onChainCourse, dbModules]);

  // Get module info by hash
  const getModuleInfo = (hash: unknown) => {
    // Handle case where hash might be an object with assignment_id
    const hashStr = typeof hash === "string"
      ? hash
      : (hash as { assignment_id?: string })?.assignment_id ?? String(hash);
    return moduleHashToInfo.get(hashStr) ?? { code: hashStr.slice(0, 8) + "...", title: "Module" };
  };

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = studentLoading || courseLoading;

  if (isLoading) {
    return <AndamioCardLoading title="Your Progress" lines={3} />;
  }

  // If not enrolled (no student status), don't show anything
  // Enrollment happens implicitly when submitting first assignment commitment
  if (!studentStatus) {
    return null;
  }

  // Calculate progress - use database modules count for total
  const totalModules = dbModules?.length ?? 0;
  const completedCount = studentStatus.completed.length;
  const hasCurrentCommitment = studentStatus.current !== null;
  const progress = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

  // Get current commitment info
  const currentModuleInfo = hasCurrentCommitment
    ? getModuleInfo(studentStatus.current!)
    : null;

  return (
    <AndamioCard>
      <AndamioCardHeader>
        <div className="flex items-center gap-2">
          <OnChainIcon className="h-5 w-5 text-success" />
          <div>
            <AndamioCardTitle>Your Progress</AndamioCardTitle>
            <AndamioCardDescription>
              On-chain enrollment in {dbCourse?.title ?? "this course"}
            </AndamioCardDescription>
          </div>
        </div>
      </AndamioCardHeader>
      <AndamioCardContent className="space-y-4">
        {/* Overall Progress */}
        {totalModules > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Completion</span>
              <span className="text-muted-foreground">
                {completedCount} / {totalModules} modules
              </span>
            </div>
            <AndamioProgress value={progress} className="h-2" />
            <AndamioText variant="small" className="text-xs">
              {Math.round(progress)}% complete
            </AndamioText>
          </div>
        )}

        {/* Current Commitment (Pending Assessment) */}
        {hasCurrentCommitment && currentModuleInfo && (
          <div className="p-3 border rounded-md bg-info/10 border-info/20">
            <div className="flex items-center gap-2 mb-2">
              <PendingIcon className="h-4 w-4 text-info" />
              <AndamioText className="text-sm font-medium">Pending Assessment</AndamioText>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <AndamioBadge variant="outline" className="font-mono text-xs">
                  {currentModuleInfo.code}
                </AndamioBadge>
                <AndamioText variant="small" className="mt-1">
                  {currentModuleInfo.title}
                </AndamioText>
              </div>
              <Link href={`/course/${courseNftPolicyId}/${currentModuleInfo.code}/assignment`}>
                <AndamioButton size="sm" variant="outline">
                  View
                </AndamioButton>
              </Link>
            </div>
            <AndamioText variant="small" className="text-xs mt-2 text-muted-foreground">
              Your assignment is awaiting teacher review
            </AndamioText>
          </div>
        )}

        {/* Completed Modules */}
        {studentStatus.completed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SuccessIcon className="h-4 w-4 text-success" />
              <AndamioText className="text-sm font-medium">
                Completed ({studentStatus.completed.length})
              </AndamioText>
            </div>
            <div className="flex flex-wrap gap-2">
              {studentStatus.completed.map((hash) => {
                const info = getModuleInfo(hash);
                return (
                  <Link
                    key={hash}
                    href={`/course/${courseNftPolicyId}/${info.code}`}
                  >
                    <AndamioBadge
                      variant="outline"
                      className="font-mono text-xs hover:bg-accent cursor-pointer"
                    >
                      <SuccessIcon className="h-3 w-3 mr-1 text-success" />
                      {info.code}
                    </AndamioBadge>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Not started state */}
        {!hasCurrentCommitment && studentStatus.completed.length === 0 && (
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <ModuleIcon className="h-4 w-4 text-muted-foreground" />
            <AndamioText variant="small">
              You&apos;re enrolled! Start by completing your first module assignment.
            </AndamioText>
          </div>
        )}

        {/* Refresh button */}
        <div className="pt-2 border-t">
          <AndamioButton
            size="sm"
            variant="ghost"
            onClick={() => refetchStudent()}
            className="text-xs"
          >
            Refresh status
          </AndamioButton>
        </div>
      </AndamioCardContent>
    </AndamioCard>
  );
}
