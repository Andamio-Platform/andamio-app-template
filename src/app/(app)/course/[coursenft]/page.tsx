"use client";

import React from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  AndamioSectionHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import { CourseIcon, OnChainIcon, SLTIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { UserCourseStatus } from "~/components/learner/user-course-status";
import { OnChainSltsBadge } from "~/components/courses/on-chain-slts-viewer";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { CourseModuleCard } from "~/components/courses/course-module-card";
import { useCourse, useCourseModules, useTeacherCourseModules } from "~/hooks/api";

/**
 * Public page displaying course details and module list with SLT counts
 *
 * REFACTORED to use React Query hooks for:
 * - Automatic caching (data shared across child pages)
 * - Request deduplication (multiple components = 1 request)
 * - Background refetching (stale data refreshed automatically)
 *
 * API Endpoints (via React Query):
 * - POST /course/get - Course details (cached by courseNftPolicyId)
 * - POST /course-module/list - Modules with SLTs (cached by courseNftPolicyId)
 */

export default function CourseDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const courseNftPolicyId = params.coursenft as string;
  const isTeacherPreview = searchParams.get("preview") === "teacher";

  // React Query hooks - automatically cached and deduplicated
  // useCourse returns merged data with both on-chain and off-chain content
  const {
    data: course,
    isLoading: courseLoading,
    error: courseError,
  } = useCourse(courseNftPolicyId);

  const {
    data: modules,
    isLoading: modulesLoading,
    error: modulesError,
  } = useCourseModules(courseNftPolicyId);

  const {
    data: teacherModules,
    isLoading: teacherModulesLoading,
    error: teacherModulesError,
  } = useTeacherCourseModules(courseNftPolicyId);

  const resolvedModules = isTeacherPreview
    ? (teacherModules?.length ? teacherModules : modules ?? [])
    : modules ?? [];

  const resolvedModulesLoading = isTeacherPreview
    ? (modulesLoading || teacherModulesLoading)
    : modulesLoading;

  const resolvedModulesError = isTeacherPreview
    ? (modulesError ?? teacherModulesError)
    : modulesError;

  // Combined loading state
  const isLoading = courseLoading || resolvedModulesLoading;
  const error = courseError ?? resolvedModulesError;

  // Get on-chain modules from the merged course data
  const onChainModules = course?.modules ?? [];

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !course) {
    return (
      <AndamioNotFoundCard
        title="Course Not Found"
        message={error?.message ?? "Course not found"}
      />
    );
  }

  // Flattened course data from hook - direct access to fields
  const courseTitle = course.title ?? "Course";
  const courseDescription = course.description;

  // Empty modules state
  const moduleList = resolvedModules;
  if (moduleList.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{courseTitle}</h1>
          {courseDescription && (
            <AndamioText variant="lead">{courseDescription}</AndamioText>
          )}
        </div>
        <AndamioEmptyState
          icon={CourseIcon}
          title="No modules found for this course"
          className="border rounded-md"
        />
      </div>
    );
  }

  // Build map of on-chain SLTs per module by matching SLT text content
  // onChainModules contains on-chain data with onChainSlts (string hashes/IDs)
  const getOnChainStatus = (moduleSlts: Array<{ sltText?: string }>) => {
    if (onChainModules.length === 0) return { onChainSlts: new Set<string>(), moduleHash: null };

    const dbSltTexts = new Set(moduleSlts.map((s) => s.sltText).filter((t): t is string => !!t));

    for (const mod of onChainModules) {
      // Use onChainSlts from the flattened module (from chain data)
      const modSlts = mod.onChainSlts ?? [];
      const onChainTexts = new Set(modSlts);
      const intersection = [...dbSltTexts].filter((t) => onChainTexts.has(t));
      if (intersection.length > 0 && modSlts.length > 0 && intersection.length >= modSlts.length * 0.5) {
        return { onChainSlts: onChainTexts, moduleHash: mod.sltHash ?? null };
      }
    }

    return { onChainSlts: new Set<string>(), moduleHash: null };
  };

  // Calculate total SLT count
  const totalSlts = moduleList.reduce((sum, m) => sum + (m.slts?.length ?? 0), 0);

  // Course and modules display
  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <CourseBreadcrumb
        mode="public"
        course={{ nftPolicyId: courseNftPolicyId, title: courseTitle }}
        currentPage="course"
      />

      {/* Course Header */}
      <div>
        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">{courseTitle}</h1>
          <OnChainSltsBadge courseNftPolicyId={courseNftPolicyId} />
        </div>
        {courseDescription && (
          <AndamioText variant="lead">{courseDescription}</AndamioText>
        )}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CourseIcon className="h-4 w-4 shrink-0" />
            <span>{moduleList.length} {moduleList.length === 1 ? "Module" : "Modules"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <SLTIcon className="h-4 w-4 shrink-0" />
            <span>{totalSlts} Learning {totalSlts === 1 ? "Target" : "Targets"}</span>
          </div>
        </div>
      </div>

      {/* User Course Status */}
      <UserCourseStatus courseNftPolicyId={courseNftPolicyId} />

      {/* Course Learning Journey - SLTs as the Story */}
      <div className="space-y-6">
        <div>
          <AndamioSectionHeader title="Your Learning Journey" />
          <AndamioText variant="muted" className="mt-2">
            This course is structured around specific learning targets. Complete each module to master these skills.
          </AndamioText>
        </div>

        {/* Module Cards with SLTs */}
        <div className="space-y-4">
          {moduleList.map((courseModule, moduleIndex) => {
            const { onChainSlts, moduleHash } = getOnChainStatus(courseModule.slts ?? []);
            const hasOnChain = moduleHash !== null;
            // Filter and map SLTs to ensure valid sltText values
            const validSlts = (courseModule.slts ?? [])
              .filter((s) => !!s.sltText)
              .map((s) => ({ sltText: s.sltText! }));

            return (
              <CourseModuleCard
                key={courseModule.moduleCode}
                moduleCode={courseModule.moduleCode ?? ""}
                title={courseModule.title ?? "Untitled Module"}
                index={moduleIndex + 1}
                slts={validSlts}
                onChainSlts={onChainSlts}
                isOnChain={hasOnChain}
                courseNftPolicyId={courseNftPolicyId}
              />
            );
          })}
        </div>
      </div>

      {/* On-Chain Verified SLTs - Additional Detail Section */}
      {onChainModules.length > 0 && (
        <div className="space-y-4 border-t pt-8">
          <div className="flex items-center gap-2">
            <OnChainIcon className="h-5 w-5 text-success" />
            <h2 className="text-xl font-semibold">Blockchain Verification</h2>
          </div>
          <AndamioText variant="small">
            This course has {onChainModules.length} {onChainModules.length === 1 ? "module" : "modules"} with learning targets verified on the Cardano blockchain.
          </AndamioText>
        </div>
      )}
    </div>
  );
}
