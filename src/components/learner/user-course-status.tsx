"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { useCourseStudent, useCourse as useOnChainCourse, useCompletedCourses } from "~/hooks/use-andamioscan";
import { useCourse, useCourseModules } from "~/hooks/api";
import { env } from "~/env";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioCardLoading } from "~/components/andamio/andamio-loading";
import { AndamioProgress } from "~/components/andamio/andamio-progress";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CredentialClaim } from "~/components/transactions/credential-claim";
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

// Response from /course/shared/assignment-commitment/get
interface CommitmentApiResponse {
  policy_id: string;
  module_code: string;
  assignment_code: string;
  access_token_alias: string;
  network_status: string;
  network_evidence: Record<string, unknown> | null;
  network_evidence_hash: string | null;
  pending_tx_hash: string | null;
}

export function UserCourseStatus({ courseNftPolicyId }: UserCourseStatusProps) {
  const { isAuthenticated, user, authenticatedFetch } = useAndamioAuth();

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

  // Fetch user's completed courses to check if course credential has been claimed
  const { data: completedCourses, refetch: refetchCompletedCourses } = useCompletedCourses(user?.accessTokenAlias ?? undefined);

  // State for current commitment database status
  const [commitmentStatus, setCommitmentStatus] = useState<string | null>(null);
  const [isLoadingCommitment, setIsLoadingCommitment] = useState(false);

  // State for early credential claim expansion
  const [showEarlyClaim, setShowEarlyClaim] = useState(false);

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

  // Fetch commitment status from database when there's a current on-chain commitment
  const fetchCommitmentStatus = useCallback(async (moduleCode: string) => {
    if (!isAuthenticated || !user?.accessTokenAlias) return;

    setIsLoadingCommitment(true);
    try {
      const response = await authenticatedFetch(
        `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/shared/assignment-commitment/get`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            policy_id: courseNftPolicyId,
            module_code: moduleCode,
            access_token_alias: user.accessTokenAlias,
          }),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as CommitmentApiResponse;
        setCommitmentStatus(data.network_status);
      } else {
        setCommitmentStatus(null);
      }
    } catch {
      setCommitmentStatus(null);
    } finally {
      setIsLoadingCommitment(false);
    }
  }, [isAuthenticated, authenticatedFetch, user?.accessTokenAlias, courseNftPolicyId]);

  // Get module info by hash
  const getModuleInfo = (hash: unknown) => {
    // Handle case where hash might be an object with assignment_id
    const hashStr = typeof hash === "string"
      ? hash
      : (hash as { assignment_id?: string })?.assignment_id ?? String(hash);
    return moduleHashToInfo.get(hashStr) ?? { code: hashStr.slice(0, 8) + "...", title: "Module" };
  };

  // Effect to fetch commitment status when there's a current on-chain commitment
  useEffect(() => {
    const currentHash = studentStatus?.current;
    if (currentHash && moduleHashToInfo.size > 0) {
      const moduleInfo = moduleHashToInfo.get(currentHash);
      if (moduleInfo) {
        void fetchCommitmentStatus(moduleInfo.code);
      }
    } else {
      setCommitmentStatus(null);
    }
  }, [studentStatus, moduleHashToInfo, fetchCommitmentStatus]);

  // Check if assignment is accepted and user can claim credential
  const canClaimCredential = commitmentStatus === "ASSIGNMENT_ACCEPTED";

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = studentLoading || courseLoading || isLoadingCommitment;

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

  // Check if student can claim course completion credential
  // Note: We use DB module count (totalModules) for consistency with the progress UI,
  // not on-chain module count which may include legacy/removed modules
  const hasCompletedAllModules = totalModules > 0 && completedCount >= totalModules;
  const hasCourseCredential = completedCourses?.some(c => c.course_id === courseNftPolicyId) ?? false;

  // Can claim if: completed all modules, no pending assignments, hasn't claimed yet
  const canClaimCourseCredential = hasCompletedAllModules && !hasCourseCredential && !hasCurrentCommitment;

  // Can claim early if: has some completions, no pending, hasn't claimed, but NOT 100%
  const canClaimEarly = !hasCompletedAllModules && completedCount > 0 && !hasCourseCredential && !hasCurrentCommitment;

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

        {/* Current Commitment - Show Credential Claim if accepted, otherwise Pending Assessment */}
        {hasCurrentCommitment && currentModuleInfo && (
          canClaimCredential ? (
            // Assignment accepted - show credential claim
            <div className="space-y-3">
              <div className="p-3 border rounded-md bg-success/10 border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <SuccessIcon className="h-4 w-4 text-success" />
                  <AndamioText className="text-sm font-medium">Assignment Accepted!</AndamioText>
                </div>
                <div className="flex items-center gap-2">
                  <AndamioBadge variant="outline" className="font-mono text-xs">
                    {currentModuleInfo.code}
                  </AndamioBadge>
                  <AndamioText variant="small">
                    {currentModuleInfo.title}
                  </AndamioText>
                </div>
                <AndamioText variant="small" className="text-xs mt-2 text-muted-foreground">
                  Your teacher has approved your work. Claim your credential below!
                </AndamioText>
              </div>
              <CredentialClaim
                courseNftPolicyId={courseNftPolicyId}
                moduleCode={currentModuleInfo.code}
                moduleTitle={currentModuleInfo.title}
                courseTitle={dbCourse?.title}
                onSuccess={() => {
                  void refetchStudent();
                  setCommitmentStatus(null);
                }}
              />
            </div>
          ) : (
            // Pending assessment
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
          )
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

            {/* Early credential claim option - understated */}
            {canClaimEarly && (
              <div className="pt-2">
                {!showEarlyClaim ? (
                  <button
                    onClick={() => setShowEarlyClaim(true)}
                    className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                  >
                    Ready to move on? Claim credential now →
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-dashed">
                    <div className="flex items-center justify-between">
                      <AndamioText variant="small" className="text-muted-foreground">
                        Claim your credential for completed modules
                      </AndamioText>
                      <button
                        onClick={() => setShowEarlyClaim(false)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Cancel
                      </button>
                    </div>
                    <CredentialClaim
                      courseNftPolicyId={courseNftPolicyId}
                      moduleCode="PARTIAL_COMPLETION"
                      moduleTitle={`${completedCount} of ${totalModules} modules`}
                      courseTitle={dbCourse?.title}
                      onSuccess={() => {
                        void refetchStudent();
                        void refetchCompletedCourses();
                        setShowEarlyClaim(false);
                      }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Course Completion Credential Claim - Full celebration for 100% */}
        {canClaimCourseCredential && (
          <div className="space-y-3">
            <div className="p-3 border rounded-md bg-success/10 border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <SuccessIcon className="h-4 w-4 text-success" />
                <AndamioText className="text-sm font-medium">Course Complete!</AndamioText>
              </div>
              <AndamioText variant="small" className="text-muted-foreground">
                You&apos;ve completed all modules. Claim your course credential to finalize your achievement on-chain.
              </AndamioText>
            </div>
            <CredentialClaim
              courseNftPolicyId={courseNftPolicyId}
              moduleCode="COURSE_COMPLETION"
              moduleTitle="Course Completion"
              courseTitle={dbCourse?.title}
              onSuccess={() => {
                void refetchStudent();
                void refetchCompletedCourses();
              }}
            />
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
