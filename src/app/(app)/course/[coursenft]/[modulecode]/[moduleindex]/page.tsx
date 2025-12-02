"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { env } from "~/env";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioButton } from "~/components/andamio/andamio-button";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AlertCircle, ArrowLeft, BookOpen, Image as ImageIcon, Video } from "lucide-react";
import { type LessonWithSLTOutput } from "@andamio/db-api";
import { RenderEditor } from "~/components/editor";
import type { JSONContent } from "@tiptap/core";

/**
 * Public page displaying lesson content
 *
 * API Endpoint: GET /lessons/{courseNftPolicyId}/{moduleCode}/{moduleIndex} (public)
 * Type Reference: See API-TYPE-REFERENCE.md in @andamio/db-api
 *
 * Note: Lessons are optional content tied to SLTs. If no lesson exists,
 * this page will show "Lesson not found" message.
 */

/**
 * Ensures content is in valid Tiptap JSON format
 * Tiptap expects: { type: "doc", content: [...] }
 */
function ensureTiptapFormat(content: Record<string, unknown> | null): JSONContent | null {
  if (!content) return null;

  // If it already has the doc structure, return as is
  if (content.type === "doc") {
    return content as JSONContent;
  }

  // If it's just raw content, wrap it in a doc
  return {
    type: "doc",
    content: Array.isArray(content) ? content as JSONContent[] : [content as JSONContent],
  };
}

export default function LessonDetailPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;
  const moduleIndex = parseInt(params.moduleindex as string);

  const [lesson, setLesson] = useState<LessonWithSLTOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLesson = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/lessons/${courseNftPolicyId}/${moduleCode}/${moduleIndex}`
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
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </AndamioButton>
        </Link>

        <div>
          <h1 className="text-3xl font-bold">Lesson Not Found</h1>
        </div>

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
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <Link href={`/course/${courseNftPolicyId}/${moduleCode}`}>
          <AndamioButton variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Module
          </AndamioButton>
        </Link>
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
          <h1 className="text-4xl font-bold">
            {lesson.title ?? `Lesson ${lesson.slt_index}`}
          </h1>
          {lesson.description && (
            <p className="text-xl text-muted-foreground mt-2">
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
                <div className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  <AndamioCardTitle className="text-lg">Video</AndamioCardTitle>
                </div>
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
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  <AndamioCardTitle className="text-lg">Image</AndamioCardTitle>
                </div>
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
      {lesson.content_json && (() => {
        const formattedContent = ensureTiptapFormat(lesson.content_json);
        return (
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Lesson Content</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              {formattedContent ? (
                <RenderEditor content={formattedContent} />
              ) : (
                <p className="text-muted-foreground italic">Unable to parse lesson content</p>
              )}

              
            </AndamioCardContent>
          </AndamioCard>
        );
      })()}

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
