"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import {
  AndamioPageLoading,
  AndamioNotFoundCard,
  AndamioEmptyState,
} from "~/components/andamio";
import { BookOpen } from "lucide-react";
import { type LessonWithSLTOutput, type CourseOutput, type CourseModuleOutput } from "@andamio/db-api";
import { AndamioText } from "~/components/andamio/andamio-text";
import { ContentViewer } from "~/components/editor";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { LessonMediaSection } from "~/components/courses/lesson-media-section";
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
    return <AndamioPageLoading variant="content" />;
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

        <AndamioNotFoundCard
          title="Lesson Not Found"
          message={error ?? "Lesson not found"}
        />

        {!error && (
          <AndamioCard>
            <AndamioCardContent className="pt-6">
              <AndamioEmptyState
                icon={BookOpen}
                title="This learning target doesn't have a lesson yet"
              />
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
            <AndamioText variant="lead" className="mt-2">
              {lesson.description}
            </AndamioText>
          )}
        </div>
      </div>

      {/* Media Section */}
      <LessonMediaSection
        videoUrl={lesson.video_url}
        imageUrl={lesson.image_url}
        imageAlt={lesson.title ?? "Lesson image"}
      />

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
                <AndamioText variant="muted" className="italic">Unable to parse lesson content</AndamioText>
              }
            />
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Empty content state */}
      {!lesson.content_json && !lesson.image_url && !lesson.video_url && (
        <AndamioCard>
          <AndamioCardContent className="pt-6">
            <AndamioEmptyState
              icon={BookOpen}
              title="No content has been added to this lesson yet"
            />
          </AndamioCardContent>
        </AndamioCard>
      )}
    </div>
  );
}
