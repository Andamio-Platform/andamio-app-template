"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { useCourse, useCourseModules, useStudentCourses, type CourseModule } from "~/hooks/api";
import { useStudentAssignmentCommitments, getModuleCommitmentStatus, groupCommitmentsByModule, type StudentCommitmentSummary } from "~/hooks/api/course/use-student-assignment-commitments";
import { useTransaction } from "~/hooks/tx/use-transaction";
import { useTxStream } from "~/hooks/tx/use-tx-stream";
import { TransactionButton } from "~/components/tx/transaction-button";
import { TransactionStatus } from "~/components/tx/transaction-status";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioCardLoading } from "~/components/andamio/andamio-loading";
import { AndamioText } from "~/components/andamio/andamio-text";
import { CommitmentStatusBadge } from "~/components/courses/commitment-status-badge";
import { toast } from "sonner";
import {
  SuccessIcon,
  OnChainIcon,
  ModuleIcon,
  CourseIcon,
  LoadingIcon,
  NextIcon,
} from "~/components/icons";

/**
 * User Course Status Component
 *
 * Displays the authenticated learner's enrollment status in a course.
 * Uses the V2 merged API endpoints.
 *
 * Note: Detailed per-module progress is not available in V2 API.
 * This component shows enrollment and completion status only.
 */

interface UserCourseStatusProps {
  courseNftPolicyId: string;
}

export function UserCourseStatus({ courseNftPolicyId }: UserCourseStatusProps) {
  const { isAuthenticated } = useAndamioAuth();

  // Fetch merged course data
  const { data: course, isLoading: courseLoading } = useCourse(courseNftPolicyId);

  // Fetch database modules for count
  const { data: dbModules } = useCourseModules(courseNftPolicyId);

  // Fetch user's enrolled/completed courses
  const { data: studentCourses, isLoading: studentLoading, refetch: refetchStudent } = useStudentCourses();

  // Fetch student commitments for progress summary
  const { data: studentCommitments } = useStudentAssignmentCommitments(courseNftPolicyId);

  // Derive commitment progress stats
  const commitmentStats = useMemo(() => {
    if (!studentCommitments || studentCommitments.length === 0) return null;

    // Count unique modules with any commitment
    const modulesStarted = new Set(studentCommitments.map((c) => c.moduleCode)).size;
    const accepted = studentCommitments.filter(
      (c) => c.networkStatus === "ASSIGNMENT_ACCEPTED",
    ).length;
    const pendingReview = studentCommitments.filter(
      (c) => c.networkStatus === "PENDING_APPROVAL",
    ).length;

    return { modulesStarted, accepted, pendingReview };
  }, [studentCommitments]);

  // Group commitments by module code for the checklist
  const commitmentsByModule = useMemo(
    () => groupCommitmentsByModule(studentCommitments ?? [], courseNftPolicyId),
    [studentCommitments, courseNftPolicyId],
  );

  // Find this course in student's courses
  const studentCourseStatus = useMemo(() => {
    if (!studentCourses) return null;
    return studentCourses.find((c) => c.courseId === courseNftPolicyId);
  }, [studentCourses, courseNftPolicyId]);

  if (!isAuthenticated) {
    return null;
  }

  const isLoading = courseLoading || studentLoading;

  if (isLoading) {
    return <AndamioCardLoading title="Your Progress" lines={3} />;
  }

  // If not enrolled, show enrollment prompt
  if (!studentCourseStatus) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <CourseIcon className="h-5 w-5 text-muted-foreground" />
            <div>
              <AndamioCardTitle>Get Started</AndamioCardTitle>
              <AndamioCardDescription>
                Begin your learning journey in {course?.title ?? "this course"}
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent>
          <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
            <ModuleIcon className="h-4 w-4 text-muted-foreground" />
            <AndamioText variant="small">
              Commit to a module assignment to start tracking your progress.
            </AndamioText>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  const isCompleted = studentCourseStatus.enrollmentStatus === "completed";
  const totalModules = dbModules?.length ?? 0;
  const courseTitle = course?.title ?? "this course";

  // Completed state
  if (isCompleted) {
    return (
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-center gap-2">
            <SuccessIcon className="h-5 w-5 text-success" />
            <div>
              <AndamioCardTitle>Course Complete!</AndamioCardTitle>
              <AndamioCardDescription>
                You&apos;ve earned your credential for {courseTitle}
              </AndamioCardDescription>
            </div>
          </div>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-md bg-success/10 border-success/20">
            <div className="flex items-center gap-2">
              <OnChainIcon className="h-4 w-4 text-success" />
              <AndamioText className="text-sm font-medium">Credential Earned</AndamioText>
            </div>
            <AndamioBadge status="success">Verified</AndamioBadge>
          </div>

          {totalModules > 0 && (
            <AndamioText variant="small" className="text-muted-foreground">
              All {totalModules} modules completed
            </AndamioText>
          )}

          <Link href="/credentials">
            <AndamioButton variant="outline" size="sm">
              View All Credentials
            </AndamioButton>
          </Link>
        </AndamioCardContent>
      </AndamioCard>
    );
  }

  // Enrolled (in progress) state
  const accepted = commitmentStats?.accepted ?? 0;

  return (
    <AndamioCard>
      <AndamioCardContent className="p-4 space-y-3">
        {/* Module checklist */}
        {dbModules && dbModules.length > 0 && (
          <ul className="space-y-1">
            {dbModules.map((courseModule) => {
              const code = courseModule.moduleCode ?? "";
              const moduleCommitments = commitmentsByModule.get(code) ?? [];
              const status = getModuleCommitmentStatus(moduleCommitments);
              const isAccepted = status === "ASSIGNMENT_ACCEPTED";

              return (
                <li
                  key={code || courseModule.sltHash}
                  className="flex items-center justify-between gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                        isAccepted
                          ? "bg-success border-success text-success-foreground"
                          : status
                            ? "border-secondary bg-secondary/10"
                            : "border-border bg-background"
                      }`}
                    >
                      {isAccepted && <SuccessIcon className="h-3 w-3" />}
                    </div>
                    <span className="text-sm truncate">
                      <span className="font-mono text-xs text-muted-foreground mr-1.5">
                        {code}
                      </span>
                      {courseModule.title ?? "Untitled"}
                    </span>
                  </div>
                  <div className="shrink-0">
                    {status ? (
                      <CommitmentStatusBadge status={status} />
                    ) : (
                      <AndamioText variant="small" className="text-muted-foreground text-xs">
                        Not started
                      </AndamioText>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Summary + CTA */}
        {totalModules > 0 && (
          <CredentialClaimCTA
            courseNftPolicyId={courseNftPolicyId}
            courseTitle={courseTitle}
            accepted={accepted}
            totalModules={totalModules}
            dbModules={dbModules ?? []}
            commitmentsByModule={commitmentsByModule}
            onSuccess={() => void refetchStudent()}
          />
        )}

      </AndamioCardContent>
    </AndamioCard>
  );
}

// =============================================================================
// Credential Claim CTA - completion summary + claim or continue action
// =============================================================================

interface CredentialClaimCTAProps {
  courseNftPolicyId: string;
  courseTitle: string;
  accepted: number;
  totalModules: number;
  dbModules: CourseModule[];
  commitmentsByModule: Map<string, StudentCommitmentSummary[]>;
  onSuccess: () => void;
}

function CredentialClaimCTA({
  courseNftPolicyId,
  courseTitle,
  accepted,
  totalModules,
  dbModules,
  commitmentsByModule,
  onSuccess,
}: CredentialClaimCTAProps) {
  const { user } = useAndamioAuth();
  const { state, result, error, execute, reset } = useTransaction();

  const { status: txStatus, isSuccess: txConfirmed } = useTxStream(
    result?.requiresDBUpdate ? result.txHash : null,
    {
      onComplete: (status) => {
        if (status.state === "updated") {
          toast.success("Credentials Claimed!", {
            description: `You've earned your credentials for ${courseTitle}`,
          });
          onSuccess();
        } else if (status.state === "failed" || status.state === "expired") {
          toast.error("Claim Failed", {
            description: status.last_error ?? "Please try again or contact support.",
          });
        }
      },
    },
  );

  const allAccepted = accepted === totalModules;

  // Find the first module without an accepted assignment for the "continue" link
  const nextModuleCode = !allAccepted
    ? dbModules.find((m) => {
        const code = m.moduleCode ?? "";
        const commitments = commitmentsByModule.get(code) ?? [];
        const status = getModuleCommitmentStatus(commitments);
        return status !== "ASSIGNMENT_ACCEPTED";
      })?.moduleCode
    : null;

  const handleClaim = async () => {
    if (!user?.accessTokenAlias) return;

    await execute({
      txType: "COURSE_STUDENT_CREDENTIAL_CLAIM",
      params: {
        alias: user.accessTokenAlias,
        course_id: courseNftPolicyId,
      },
      onSuccess: async (txResult) => {
        console.log("[CredentialClaimCTA] TX submitted!", txResult);
      },
      onError: (txError) => {
        console.error("[CredentialClaimCTA] Error:", txError);
      },
    });
  };

  return (
    <div className="space-y-3 pt-3 border-t">
      {/* Context-aware summary */}
      {allAccepted ? (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3 space-y-1">
          <AndamioText variant="small" className="font-medium text-success">
            All assignments complete!
          </AndamioText>
          <AndamioText variant="small">
            Claim your {accepted === 1 ? "credential" : "credentials"} to mint a permanent, verifiable proof of achievement to your wallet.
          </AndamioText>
        </div>
      ) : (
        <AndamioText variant="small">
          <span className="font-semibold">{accepted}</span> of{" "}
          <span className="font-semibold">{totalModules}</span>{" "}
          {totalModules === 1 ? "assignment" : "assignments"} complete
        </AndamioText>
      )}

      {/* TX status feedback */}
      {state !== "idle" && !txConfirmed && (
        <TransactionStatus
          state={state}
          result={result}
          error={error?.message ?? null}
          onRetry={() => reset()}
          messages={{ success: "Transaction submitted! Waiting for confirmation..." }}
        />
      )}

      {/* Gateway confirmation progress */}
      {state === "success" && result?.requiresDBUpdate && !txConfirmed && (
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-3">
            <LoadingIcon className="h-4 w-4 animate-spin text-secondary" />
            <div className="flex-1">
              <AndamioText variant="small" className="font-medium">
                Confirming on blockchain...
              </AndamioText>
              <AndamioText variant="small" className="text-xs">
                {txStatus?.state === "pending" && "Waiting for block confirmation"}
                {txStatus?.state === "confirmed" && "Processing database updates"}
                {!txStatus && "Registering transaction..."}
              </AndamioText>
            </div>
          </div>
        </div>
      )}

      {/* Success state */}
      {txConfirmed && (
        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
          <div className="flex items-center gap-3">
            <SuccessIcon className="h-4 w-4 text-success" />
            <AndamioText variant="small" className="font-medium text-success">
              Credentials claimed! Your credential tokens have been minted to your wallet.
            </AndamioText>
          </div>
        </div>
      )}

      {/* CTA button */}
      {!txConfirmed && (
        <>
          {allAccepted ? (
            <TransactionButton
              txState={state}
              onClick={handleClaim}
              disabled={!user?.accessTokenAlias}
              stateText={{
                idle: `Claim ${accepted} ${accepted === 1 ? "Credential" : "Credentials"}`,
                fetching: "Preparing Claim...",
                signing: "Sign in Wallet",
                submitting: "Minting Credentials...",
              }}
              className="w-full"
            />
          ) : nextModuleCode ? (
            <Link href={`/course/${courseNftPolicyId}/${nextModuleCode}`}>
              <AndamioButton variant="outline" className="w-full">
                Continue with next module
                <NextIcon className="h-4 w-4 ml-2" />
              </AndamioButton>
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
