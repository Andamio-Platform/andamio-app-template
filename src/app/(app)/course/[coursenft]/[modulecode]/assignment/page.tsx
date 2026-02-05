"use client";

import React, { useMemo } from "react";
import { useCourseParams } from "~/hooks/use-course-params";
import { ContentViewer } from "~/components/editor";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioAlert, AndamioAlertDescription } from "~/components/andamio/andamio-alert";
import {
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
} from "~/components/andamio";
import { AssignmentCommitment } from "~/components/learner/assignment-commitment";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { useCourse, useCourseModule, useSLTs, useAssignment, type SLT } from "~/hooks/api";
import { computeSltHash } from "@andamio/core/hashing";
import { AlertIcon, SuccessIcon } from "~/components/icons";

/**
 * Learner-facing assignment view page
 *
 * Shows assignment details and allows learners to:
 * - View assignment content
 * - Create commitments
 * - Submit evidence
 * - Track progress
 *
 * Uses React Query hooks for cached, deduplicated data fetching.
 */

export default function LearnerAssignmentPage() {
  const { courseNftPolicyId, moduleCode: moduleCodeParam } = useCourseParams();
  const moduleCode = moduleCodeParam!;

  // React Query hooks - data is cached and shared across components
  const { data: course } = useCourse(courseNftPolicyId);
  const { data: courseModule } = useCourseModule(courseNftPolicyId, moduleCode);
  const { data: slts } = useSLTs(courseNftPolicyId, moduleCode);
  const {
    data: assignment,
    isLoading,
    error: assignmentError,
  } = useAssignment(courseNftPolicyId, moduleCode);

  const error = assignmentError?.message ?? null;

  // Compute sltHash from fetched SLTs
  const computedSltHash = useMemo(() => {
    if (slts && slts.length > 0) {
      // API v2.0.0+: moduleIndex is 1-based
      const sltTexts = [...slts]
        .sort((a, b) => (a.moduleIndex ?? 0) - (b.moduleIndex ?? 0))
        .map((slt) => slt.sltText ?? "");
      return computeSltHash(sltTexts);
    }
    return null;
  }, [slts]);

  // Match on-chain module hash from course hook data (no direct Andamioscan call)
  const onChainModuleHash = useMemo(() => {
    if (!computedSltHash || !course?.modules) return null;
    const matchingModule = course.modules.find(
      (m) => m.sltHash === computedSltHash
    );
    return matchingModule?.sltHash ?? null;
  }, [computedSltHash, course?.modules]);

  // Determine the sltHash to use:
  // 1. On-chain hash (authoritative, from course hook) - if verified to match
  // 2. Database slt_hash (if available)
  // 3. Computed hash (fallback)
  const dbSltHash = courseModule?.sltHash ?? null;
  const sltHash = onChainModuleHash ?? dbSltHash ?? computedSltHash;

  // Check for hash mismatch between computed and on-chain
  const hashMismatch = useMemo(() => {
    if (onChainModuleHash && computedSltHash && onChainModuleHash !== computedSltHash) {
      return { computed: computedSltHash, onChain: onChainModuleHash };
    }
    return null;
  }, [onChainModuleHash, computedSltHash]);

  // Prepare sorted SLTs for rendering
  const sortedSlts: SLT[] = slts
    ? [...slts].sort((a, b) => (a.moduleIndex ?? 0) - (b.moduleIndex ?? 0))
    : ([] as SLT[]);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="content" />;
  }

  // Error state
  if (error || !assignment) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {course && courseModule && (
          <CourseBreadcrumb
            mode="public"
            course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
            courseModule={{ code: courseModule.moduleCode ?? "", title: courseModule.title ?? "Module" }}
            currentPage="assignment"
          />
        )}

        <AndamioNotFoundCard
          title="Assignment Not Found"
          message={error ?? "No assignment found for this module"}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && courseModule && (
        <CourseBreadcrumb
          mode="public"
          course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
          courseModule={{ code: courseModule.moduleCode ?? "", title: courseModule.title ?? "Module" }}
          currentPage="assignment"
        />
      )}

      <AndamioPageHeader
        title={assignment.title ?? "Assignment"}
        description={undefined}
      />

      <div className="flex items-center gap-2">
        <AndamioBadge variant="outline" className="font-mono text-xs">
          {moduleCode}
        </AndamioBadge>
        {assignment.isLive ? (
          <AndamioBadge>Live</AndamioBadge>
        ) : (
          <AndamioBadge variant="secondary">Draft</AndamioBadge>
        )}
      </div>

      {sortedSlts.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Learning Targets</AndamioCardTitle>
            <AndamioCardDescription>
              This assignment covers {sortedSlts.length} Student Learning Target{sortedSlts.length !== 1 ? 's' : ''}
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="space-y-2">
              {sortedSlts.map((slt) => (
                <div key={`slt-${slt.moduleIndex ?? 0}`} className="flex items-start gap-3 p-3 border rounded-md">
                  <AndamioBadge variant="outline" className="mt-0.5">
                    {slt.moduleIndex ?? 0}
                  </AndamioBadge>
                  <AndamioText variant="small" className="flex-1 text-foreground">{slt.sltText ?? ""}</AndamioText>
                </div>
              ))}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Assignment Content */}
      {!!assignment.contentJson && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Assignment Details</AndamioCardTitle>
            <AndamioCardDescription>Read the full assignment below</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <ContentViewer content={assignment.contentJson} />
          </AndamioCardContent>
        </AndamioCard>
      )}

      <AndamioSeparator />

      {/* Hash Verification Status */}
      {hashMismatch && (
        <AndamioAlert variant="destructive">
          <AlertIcon className="h-4 w-4" />
          <AndamioAlertDescription>
            <div className="space-y-2">
              <AndamioText className="font-medium">SLT Hash Mismatch Detected</AndamioText>
              <AndamioText variant="small">The on-chain module hash does not match the computed hash from database SLTs. This may indicate the SLTs were modified after minting.</AndamioText>
              <div className="text-xs font-mono space-y-1 mt-2">
                <div><span className="text-muted-foreground">On-chain:</span> {hashMismatch.onChain}</div>
                <div><span className="text-muted-foreground">Computed:</span> {hashMismatch.computed}</div>
              </div>
            </div>
          </AndamioAlertDescription>
        </AndamioAlert>
      )}

      {onChainModuleHash && !hashMismatch && (
        <AndamioAlert>
          <SuccessIcon className="h-4 w-4 text-primary" />
          <AndamioAlertDescription>
            <span className="font-medium">Module verified on-chain</span>
            <span className="ml-2 text-xs font-mono text-muted-foreground">
              {onChainModuleHash.slice(0, 16)}...
            </span>
          </AndamioAlertDescription>
        </AndamioAlert>
      )}

      {/* Assignment Commitment Component */}
      <AssignmentCommitment
        assignmentTitle={assignment.title}
        courseNftPolicyId={courseNftPolicyId}
        moduleCode={moduleCode}
        sltHash={sltHash}
      />
    </div>
  );
}
