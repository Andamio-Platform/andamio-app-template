"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import {
  AndamioPageHeader,
  AndamioSectionHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
} from "~/components/andamio";
import { Settings, FileText, Blocks } from "lucide-react";
import { type CourseModuleOutput, type CourseOutput, type ListSLTsOutput, type ListLessonsOutput } from "@andamio/db-api";
import { AndamioText } from "~/components/andamio/andamio-text";
import { useCourse } from "~/hooks/use-andamioscan";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { SLTLessonTable, type CombinedSLTLesson } from "~/components/courses/slt-lesson-table";

/**
 * Public page displaying module details with SLTs and lessons
 *
 * API Endpoints:
 * - POST /course-modules/get (body: { course_nft_policy_id, module_code })
 * - POST /slts/list (body: { course_nft_policy_id, module_code })
 * - POST /lessons/list (body: { course_nft_policy_id, module_code })
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */

export default function ModuleLessonsPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const { isAuthenticated } = useAndamioAuth();

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleOutput | null>(null);
  const [combinedData, setCombinedData] = useState<CombinedSLTLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch on-chain course data to check SLT status
  const { data: onChainCourse } = useCourse(courseNftPolicyId);

  // Find matching on-chain module by SLT content overlap
  const onChainModule = React.useMemo(() => {
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

  useEffect(() => {
    const fetchModuleAndLessons = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details for breadcrumb (POST with body)
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ course_nft_policy_id: courseNftPolicyId }),
          }
        );

        if (courseResponse.ok) {
          const courseData = (await courseResponse.json()) as CourseOutput;
          setCourse(courseData);
        }

        // Fetch course module details (POST with body)
        const moduleResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-module/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
            }),
          }
        );

        if (!moduleResponse.ok) {
          throw new Error(`Failed to fetch course module: ${moduleResponse.statusText}`);
        }

        const moduleData = (await moduleResponse.json()) as CourseModuleOutput;
        setCourseModule(moduleData);

        // Fetch SLTs for the module (POST with body)
        const sltsResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slt/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
            }),
          }
        );

        if (!sltsResponse.ok) {
          throw new Error(`Failed to fetch SLTs: ${sltsResponse.statusText}`);
        }

        const sltsData = (await sltsResponse.json()) as ListSLTsOutput;

        // Fetch module lessons (POST with body)
        const lessonsResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lesson/list`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
            }),
          }
        );

        if (!lessonsResponse.ok) {
          throw new Error(`Failed to fetch lessons: ${lessonsResponse.statusText}`);
        }

        const lessonsData = (await lessonsResponse.json()) as ListLessonsOutput;

        // Combine SLTs and Lessons
        const combined: CombinedSLTLesson[] = sltsData.map((slt) => {
          const lesson = lessonsData.find((l) => l.slt_index === slt.module_index);
          return {
            module_index: slt.module_index,
            slt_text: slt.slt_text,
            slt_id: slt.id,
            lesson: lesson
              ? {
                  title: lesson.title,
                  description: lesson.description,
                  image_url: lesson.image_url,
                  video_url: lesson.video_url,
                  live: lesson.live,
                }
              : undefined,
          };
        });

        setCombinedData(combined);
      } catch (err) {
        console.error("Error fetching module and lessons:", err);
        setError(err instanceof Error ? err.message : "Failed to load module");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchModuleAndLessons();
  }, [courseNftPolicyId, moduleCode]);

  // Loading state
  if (isLoading) {
    return <AndamioPageLoading variant="detail" />;
  }

  // Error state
  if (error || !courseModule) {
    return (
      <AndamioNotFoundCard
        title="Module Not Found"
        message={error ?? "Module not found"}
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
                <Settings className="h-4 w-4 mr-2" />
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
              <Blocks className="h-3 w-3 mr-1" />
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
                <FileText className="h-4 w-4 mr-2" />
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
