"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioPageHeader, AndamioSectionHeader } from "~/components/andamio";
import { AlertCircle, BookOpen } from "lucide-react";
import { type LessonWithSLTOutput, type CourseOutput, type CourseModuleOutput } from "@andamio/db-api";
import { ContentViewer } from "~/components/editor";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import type { JSONContent } from "@tiptap/core";

/**
 * Public page displaying lesson content
 *
 * API Endpoint: POST /lessons/get (body: { course_nft_policy_id, module_code, slt_index })
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 *
 * Note: Lessons are optional content tied to SLTs. If no lesson exists,
 * this page will show "Lesson not found" message.
 */

export default function LessonDetailPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const moduleIndex = parseInt(params.moduleindex as string);

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleOutput | null>(null);
  const [lesson, setLesson] = useState<LessonWithSLTOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details for breadcrumb
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

        // Fetch module details for breadcrumb
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

        if (moduleResponse.ok) {
          const moduleData = (await moduleResponse.json()) as CourseModuleOutput;
          setCourseModule(moduleData);
        }

        // Fetch lesson details
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lesson/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
              module_index: moduleIndex,
            }),
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Lesson not found");
          }
          throw new Error(`Failed to fetch lesson: ${response.statusText}`);
        }

        const data = (await response.json()) as LessonWithSLTOutput;
        setLesson(data);
      } catch (err) {
        console.error("Error fetching lesson:", err);
        setError(err instanceof Error ? err.message : "Failed to load lesson");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchLesson();
  }, [courseNftPolicyId, moduleCode, moduleIndex]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <AndamioSkeleton className="h-8 w-32" />
        <AndamioSkeleton className="h-12 w-full" />
        <AndamioSkeleton className="h-64 w-full" />
      </div>
    );
  }

  // Error state
  if (error || !lesson) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        {course && courseModule && (
          <CourseBreadcrumb
            mode="public"
            course={{ nftPolicyId: courseNftPolicyId, title: course.title }}
            courseModule={{ code: courseModule.module_code, title: courseModule.title }}
            lesson={{ index: moduleIndex }}
            currentPage="lesson"
          />
        )}

        <AndamioPageHeader title="Lesson Not Found" />

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>
            {error ?? "Lesson not found"}
          </AndamioAlertDescription>
        </AndamioAlert>

        {!error && (
          <AndamioCard>
            <AndamioCardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  This learning target doesn&apos;t have a lesson yet.
                </p>
              </div>
            </AndamioCardContent>
          </AndamioCard>
        )}
      </div>
    );
  }

  // Lesson display
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      {course && courseModule && (
        <CourseBreadcrumb
          mode="public"
          course={{ nftPolicyId: courseNftPolicyId, title: course.title }}
          courseModule={{ code: courseModule.module_code, title: courseModule.title }}
          lesson={{ index: lesson.slt_index, title: lesson.title ?? undefined }}
          currentPage="lesson"
        />
      )}

      {/* Header with status badge */}
      <div className="flex items-center justify-end">
        {lesson.live !== null && (
          <AndamioBadge variant={lesson.live ? "default" : "secondary"}>
            {lesson.live ? "Live" : "Draft"}
          </AndamioBadge>
        )}
      </div>

      {/* Student Learning Target */}
      <AndamioCard>
        <AndamioCardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <AndamioCardDescription>Learning Target #{lesson.slt_index}</AndamioCardDescription>
              <AndamioCardTitle>{lesson.slt_text}</AndamioCardTitle>
            </div>
          </div>
        </AndamioCardHeader>
      </AndamioCard>

      {/* Lesson Title and Description */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {lesson.title ?? `Lesson ${lesson.slt_index}`}
          </h1>
          {lesson.description && (
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mt-2">
              {lesson.description}
            </p>
          )}
        </div>
      </div>

      {/* Media Section */}
      {(lesson.image_url || lesson.video_url) && (
        <div className="space-y-4">
          {/* Video */}
          {lesson.video_url && (
            <AndamioCard>
              <AndamioCardHeader>
                <AndamioSectionHeader title="Video" />
              </AndamioCardHeader>
              <AndamioCardContent>
                <div className="aspect-video w-full">
                  <iframe
                    src={lesson.video_url}
                    className="w-full h-full rounded-md"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </AndamioCardContent>
            </AndamioCard>
          )}

          {/* Image */}
          {lesson.image_url && (
            <AndamioCard>
              <AndamioCardHeader>
                <AndamioSectionHeader title="Image" />
              </AndamioCardHeader>
              <AndamioCardContent>
                <div className="relative w-full aspect-video">
                  <Image
                    src={lesson.image_url}
                    alt={lesson.title ?? "Lesson image"}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
              </AndamioCardContent>
            </AndamioCard>
          )}
        </div>
      )}

      {/* Lesson Content */}
      {lesson.content_json && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Lesson Content</AndamioCardTitle>
          </AndamioCardHeader>
          <AndamioCardContent>
            <ContentViewer
              content={lesson.content_json as JSONContent}
              emptyContent={
                <p className="text-muted-foreground italic">Unable to parse lesson content</p>
              }
            />
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Empty content state */}
      {!lesson.content_json && !lesson.image_url && !lesson.video_url && (
        <AndamioCard>
          <AndamioCardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                No content has been added to this lesson yet.
              </p>
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
