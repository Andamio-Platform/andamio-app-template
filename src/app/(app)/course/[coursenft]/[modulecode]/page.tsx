"use client";

import React, { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
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
import { useCourse as useOnChainCourse } from "~/hooks/use-andamioscan";
import { useCourse, useCourseModule, useSLTs, useLessons } from "~/hooks/api";
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
  const { data: course } = useCourse(courseNftPolicyId);
  const {
    data: courseModule,
    isLoading: moduleLoading,
    error: moduleError,
  } = useCourseModule(courseNftPolicyId, moduleCode);
  const { data: slts, isLoading: sltsLoading } = useSLTs(courseNftPolicyId, moduleCode);
  const { data: lessons, isLoading: lessonsLoading } = useLessons(courseNftPolicyId, moduleCode);

  // Fetch on-chain course data to check SLT status
  const { data: onChainCourse } = useOnChainCourse(courseNftPolicyId);

  // Combine SLTs and Lessons - derived from query data
  const combinedData = useMemo<CombinedSLTLesson[]>(() => {
    if (!slts) return [];

    return slts.map((slt) => {
      const lesson = lessons?.find((l) => l.module_index === slt.module_index);
      return {
        module_index: slt.module_index,
        slt_text: slt.slt_text,
        slt_id: `slt-${slt.module_index}`,
        lesson: lesson
          ? {
              title: lesson.title ?? null,
              description: lesson.description ?? null,
              image_url: lesson.image_url ?? null,
              video_url: lesson.video_url ?? null,
              live: lesson.live ?? null,
            }
          : undefined,
      };
    });
  }, [slts, lessons]);

  // Find matching on-chain module by SLT content overlap
  const onChainModule = useMemo(() => {
    if (!onChainCourse || combinedData.length === 0) return null;

    const dbSltTexts = new Set(combinedData.map((s) => s.slt_text));

    for (const mod of onChainCourse.modules) {
      const onChainTexts = new Set(mod.slts);
      // Check if there's significant overlap
      const intersection = [...dbSltTexts].filter((t) => onChainTexts.has(t));
      if (intersection.length > 0 && intersection.length >= mod.slts.length * 0.5) {
        return mod;
      }
    }

    return null;
  }, [onChainCourse, combinedData]);

  // Combined loading state
  const isLoading = moduleLoading || sltsLoading || lessonsLoading;

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
          course={{ nftPolicyId: courseNftPolicyId, title: course.title }}
          courseModule={{ code: courseModule.module_code, title: courseModule.title }}
          currentPage="module"
        />
      )}

      <AndamioPageHeader
        title={courseModule.title}
        description={courseModule.description ?? undefined}
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
          {courseModule.module_code}
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
        <AndamioSectionHeader
          title="Module Assignment"
          action={
            <Link href={`/course/${courseNftPolicyId}/${moduleCode}/assignment`}>
              <AndamioButton>
                <LessonIcon className="h-4 w-4 mr-2" />
                View Assignment
              </AndamioButton>
            </Link>
          }
        />
        <AndamioText variant="small">
          Complete the assignment to demonstrate your understanding of this module&apos;s learning targets.
        </AndamioText>
      </div>
    </div>
  );
}
