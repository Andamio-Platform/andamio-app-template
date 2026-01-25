"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/auth/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioPageHeader,
  AndamioSectionHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
} from "~/components/andamio";
import { SettingsIcon, LessonIcon, OnChainIcon } from "~/components/icons";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourse, useCourseModule, useSLTs } from "~/hooks/api";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { SLTLessonTable, type CombinedSLTLesson } from "~/components/courses/slt-lesson-table";

/**
 * Public page displaying module details with SLTs and lessons
 *
 * Uses React Query for cached, deduplicated data fetching:
 * - useCourse: Course details for breadcrumb
 * - useCourseModule: Module details
 * - useSLTs: Student Learning Targets
 * - useLessons: Lesson content
 *
 * Benefits: Automatic caching, background refetching, request deduplication
 */

export default function ModuleLessonsPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated } = useAndamioAuth();

  // React Query hooks - data is cached and shared across components
  // useCourse returns merged data with both on-chain and off-chain content
  const { data: course } = useCourse(courseNftPolicyId);
  const {
    data: courseModule,
    isLoading: moduleLoading,
    error: moduleError,
  } = useCourseModule(courseNftPolicyId, moduleCode);
  const { data: slts, isLoading: sltsLoading } = useSLTs(courseNftPolicyId, moduleCode);

  // Get on-chain modules from the merged course data - memoized to stabilize reference
  const onChainModules = useMemo(() => course?.modules ?? [], [course?.modules]);

  // Combine SLTs and Lessons - derived from query data
  // Note: In the new API, lessons are nested inside SLTs
  const combinedData = useMemo<CombinedSLTLesson[]>(() => {
    if (!slts) return [];

    return slts.map((slt) => {
      // SLT and Lesson use camelCase (transformed from API)
      const lesson = slt.lesson;
      return {
        module_index: slt.moduleIndex ?? 1,
        slt_text: slt.sltText ?? "",
        slt_id: `slt-${slt.moduleIndex}`,
        lesson: lesson
          ? {
              title: typeof lesson.title === "string" ? lesson.title : null,
              description: typeof lesson.description === "string" ? lesson.description : null,
              image_url: typeof lesson.imageUrl === "string" ? lesson.imageUrl : null,
              video_url: typeof lesson.videoUrl === "string" ? lesson.videoUrl : null,
              live: lesson.isLive ?? null,
            }
          : undefined,
      };
    });
  }, [slts]);

  // Find matching on-chain module by SLT content overlap
  // Note: onChainSlts contains SLT hashes/IDs from the chain
  const onChainModule = useMemo(() => {
    if (onChainModules.length === 0 || combinedData.length === 0) return null;

    const dbSltTexts = new Set(combinedData.map((s) => s.slt_text));

    for (const mod of onChainModules) {
      const modSlts = mod.onChainSlts ?? [];
      const onChainTexts = new Set(modSlts);
      // Check if there's significant overlap (comparing texts with chain data)
      const intersection = [...dbSltTexts].filter((t) => onChainTexts.has(t));
      if (intersection.length > 0 && modSlts.length > 0 && intersection.length >= modSlts.length * 0.5) {
        return mod;
      }
    }

    return null;
  }, [onChainModules, combinedData]);

  // Combined loading state
  const isLoading = moduleLoading || sltsLoading;

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (moduleError || !courseModule) {
    return (
      <AndamioNotFoundCard
        title="Module Not Found"
        message={moduleError?.message ?? "Module not found"}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && (
        <CourseBreadcrumb
          mode="public"
          course={{ nftPolicyId: courseNftPolicyId, title: course.title ?? "Course" }}
          courseModule={{ code: courseModule.moduleCode ?? "", title: courseModule.title ?? "Module" }}
          currentPage="module"
        />
      )}

      <AndamioPageHeader
        title={courseModule.title ?? "Module"}
        description={typeof courseModule.description === "string" ? courseModule.description : undefined}
        action={
          isAuthenticated ? (
            <Link href={`/studio/course/${courseNftPolicyId}/${moduleCode}/slts`}>
              <AndamioButton variant="outline">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Manage SLTs
              </AndamioButton>
            </Link>
          ) : undefined
        }
      />
      <div className="flex gap-2">
        <AndamioBadge variant="outline" className="font-mono text-xs">
          {courseModule.moduleCode}
        </AndamioBadge>
        <AndamioBadge variant="outline">{courseModule.status}</AndamioBadge>
      </div>

      {/* Student Learning Targets & Lessons Combined */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AndamioSectionHeader title="Student Learning Targets & Lessons" />
          {onChainModule && (
            <AndamioBadge variant="outline" className="text-success border-success">
              <OnChainIcon className="h-3 w-3 mr-1" />
              On-chain
            </AndamioBadge>
          )}
        </div>
        <AndamioText variant="muted">
          The learning targets below define what you will learn in this module. Each target is paired with a lesson to guide your learning journey.
        </AndamioText>
        <SLTLessonTable
          data={combinedData}
          courseNftPolicyId={courseNftPolicyId}
          moduleCode={moduleCode}
          onChainModule={onChainModule}
        />
      </div>

      {/* Module Assignment */}
      <div className="space-y-4">
        <AndamioSectionHeader title="Module Assignment" />
        <AndamioText variant="small">
          Complete the assignment to demonstrate your understanding of this module&apos;s learning targets.
        </AndamioText>
        <div className="flex justify-center pt-4">
          <Link href={`/course/${courseNftPolicyId}/${moduleCode}/assignment`}>
            <AndamioButton size="lg">
              <LessonIcon className="h-4 w-4 mr-2" />
              View Assignment
            </AndamioButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
