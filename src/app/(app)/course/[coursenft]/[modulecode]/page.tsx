"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { env } from "~/env";
import { useAndamioAuth } from "~/hooks/use-andamio-auth";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioTable, AndamioTableBody, AndamioTableCell, AndamioTableHead, AndamioTableHeader, AndamioTableRow } from "~/components/andamio/andamio-table";
import { AndamioPageHeader, AndamioSectionHeader, AndamioTableContainer } from "~/components/andamio";
import { AlertCircle, BookOpen, Settings, FileText, Blocks, CheckCircle } from "lucide-react";
import { type CourseModuleOutput, type CourseOutput, type ListSLTsOutput, type ListLessonsOutput } from "@andamio/db-api";
import { useCourse } from "~/hooks/use-andamioscan";
import { type AndamioscanModule } from "~/lib/andamioscan";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";

/**
 * Public page displaying module details with SLTs and lessons
 *
 * API Endpoints:
 * - POST /course-modules/get (body: { course_nft_policy_id, module_code })
 * - POST /slts/list (body: { course_nft_policy_id, module_code })
 * - POST /lessons/list (body: { course_nft_policy_id, module_code })
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 */


// Combined SLT + Lesson type
type CombinedSLTLesson = {
  module_index: number;
  slt_text: string;
  slt_id: string;
  lesson?: {
    title: string | null;
    description: string | null;
    image_url: string | null;
    video_url: string | null;
    live: boolean | null;
  };
};

interface SLTLessonTableProps {
  data: CombinedSLTLesson[];
  courseNftPolicyId: string;
  moduleCode: string;
  onChainModule?: AndamioscanModule | null;
}

function SLTLessonTable({ data, courseNftPolicyId, moduleCode, onChainModule }: SLTLessonTableProps) {
  // Build set of on-chain SLT texts for quick lookup
  const onChainSltTexts = new Set(onChainModule?.slts ?? []);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md">
        <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          No learning targets defined for this module.
        </p>
      </div>
    );
  }

  return (
    <AndamioTableContainer>
      <AndamioTable>
        <AndamioTableHeader>
          <AndamioTableRow>
            <AndamioTableHead className="w-20">Index</AndamioTableHead>
            <AndamioTableHead>Learning Target</AndamioTableHead>
            <AndamioTableHead>Lesson Title</AndamioTableHead>
            <AndamioTableHead>Description</AndamioTableHead>
            <AndamioTableHead className="w-32">Media</AndamioTableHead>
            <AndamioTableHead className="w-24">Status</AndamioTableHead>
          </AndamioTableRow>
        </AndamioTableHeader>
        <AndamioTableBody>
          {data.map((item) => {
            const isOnChain = onChainSltTexts.has(item.slt_text);
            return (
              <AndamioTableRow key={item.module_index}>
                <AndamioTableCell className="font-mono text-xs">
                  <div className="flex items-center gap-1.5">
                    <AndamioBadge variant="outline">{item.module_index}</AndamioBadge>
                    {isOnChain && (
                      <span title="Verified on-chain">
                        <CheckCircle className="h-3.5 w-3.5 text-success" />
                      </span>
                    )}
                  </div>
                </AndamioTableCell>
                <AndamioTableCell className="font-medium">
                  {item.slt_text}
                </AndamioTableCell>
                <AndamioTableCell className="font-medium">
                  {item.lesson ? (
                    <Link
                      href={`/course/${courseNftPolicyId}/${moduleCode}/${item.module_index}`}
                      className="hover:underline text-primary"
                    >
                      {item.lesson.title ?? `Lesson ${item.module_index}`}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground italic">No lesson yet</span>
                  )}
                </AndamioTableCell>
                <AndamioTableCell>
                  {item.lesson?.description ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </AndamioTableCell>
                <AndamioTableCell>
                  {item.lesson ? (
                    <div className="flex gap-1">
                      {item.lesson.image_url && (
                        <AndamioBadge variant="outline">Image</AndamioBadge>
                      )}
                      {item.lesson.video_url && (
                        <AndamioBadge variant="outline">Video</AndamioBadge>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </AndamioTableCell>
                <AndamioTableCell>
                  {item.lesson ? (
                    item.lesson.live ? (
                      <AndamioBadge variant="default">Live</AndamioBadge>
                    ) : (
                      <AndamioBadge variant="secondary">Draft</AndamioBadge>
                    )
                  ) : (
                    <AndamioBadge variant="outline">No Lesson</AndamioBadge>
                  )}
                </AndamioTableCell>
              </AndamioTableRow>
            );
          })}
        </AndamioTableBody>
      </AndamioTable>
    </AndamioTableContainer>
  );
}

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
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/courses/get`,
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
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course-modules/get`,
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
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/slts/list`,
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
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/list`,
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
    return (
      <div className="space-y-6">
        <div>
          <AndamioSkeleton className="h-9 w-64 mb-2" />
          <AndamioSkeleton className="h-5 w-96" />
        </div>

        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <AndamioSkeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !courseModule) {
    return (
      <div className="space-y-6">
        <AndamioPageHeader title="Module Not Found" />

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>
            {error ?? "Module not found"}
          </AndamioAlertDescription>
        </AndamioAlert>
      </div>
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
        <p className="text-muted-foreground">
          The learning targets below define what you will learn in this module. Each target is paired with a lesson to guide your learning journey.
        </p>
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
        <p className="text-sm text-muted-foreground">
          Complete the assignment to demonstrate your understanding of this module&apos;s learning targets.
        </p>
      </div>
    </div>
  );
}
