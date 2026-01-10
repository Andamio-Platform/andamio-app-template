"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { ContentViewer } from "~/components/editor";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import {
  AndamioPageHeader,
  AndamioPageLoading,
  AndamioNotFoundCard,
} from "~/components/andamio";
import { AssignmentCommitment } from "~/components/learner/assignment-commitment";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { type CourseResponse, type CourseModuleResponse } from "@andamio/db-api-types";
import type { JSONContent } from "@tiptap/core";

/**
 * Learner-facing assignment view page
 *
 * Shows assignment details and allows learners to:
 * - View assignment content
 * - Create commitments
 * - Submit evidence
 * - Track progress
 *
 * API Endpoints:
 * - GET /assignments/{courseNftPolicyId}/{moduleCode} (public)
 */

interface Assignment {
  id: string;
  assignmentCode: string;
  title: string;
  description: string | null;
  contentJson: Record<string, unknown> | null;
  imageUrl: string | null;
  videoUrl: string | null;
  live: boolean | null;
  slts: Array<{
    id: string;
    moduleIndex: number;
    sltText: string;
  }>;
}

export default function LearnerAssignmentPage() {
  const params = useParams();
  const courseNftPolicyId = params.coursenft as string;
  const moduleCode = params.modulecode as string;

  const [course, setCourse] = useState<CourseResponse | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleResponse | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Go API: GET /course/public/course/get/{policy_id}
        const courseResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/course/get/${courseNftPolicyId}`
        );

        if (courseResponse.ok) {
          const courseData = (await courseResponse.json()) as CourseResponse;
          setCourse(courseData);
        }

        // Go API: GET /course/public/course-module/get/{policy_id}/{module_code}
        const moduleResponse = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/course-module/get/${courseNftPolicyId}/${moduleCode}`
        );

        if (moduleResponse.ok) {
          const moduleData = (await moduleResponse.json()) as CourseModuleResponse;
          setCourseModule(moduleData);
        }

        // Go API: GET /course/public/assignment/get/{policy_id}/{module_code}
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/course/public/assignment/get/${courseNftPolicyId}/${moduleCode}`
        );

        if (response.status === 404) {
          setError("No assignment found for this module");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch assignment");
        }

        const data = (await response.json()) as Assignment;
        setAssignment(data);
      } catch (err) {
        console.error("Error fetching assignment:", err);
        setError(err instanceof Error ? err.message : "Failed to load assignment");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAssignment();
  }, [courseNftPolicyId, moduleCode]);

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
            course={{ nftPolicyId: courseNftPolicyId, title: course.title }}
            courseModule={{ code: courseModule.module_code, title: courseModule.title }}
            currentPage="assignment"
          />
        )}

        <AndamioNotFoundCard
          title="Assignment Not Found"
          message={error ?? "Assignment not found"}
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
          course={{ nftPolicyId: courseNftPolicyId, title: course.title }}
          courseModule={{ code: courseModule.module_code, title: courseModule.title }}
          currentPage="assignment"
        />
      )}

      <AndamioPageHeader
        title={assignment.title}
        description={assignment.description ?? undefined}
      />

      <div className="flex items-center gap-2">
        <AndamioBadge variant="outline" className="font-mono text-xs">
          {assignment.assignmentCode}
        </AndamioBadge>
        {assignment.live ? (
          <AndamioBadge>Live</AndamioBadge>
        ) : (
          <AndamioBadge variant="secondary">Draft</AndamioBadge>
        )}
      </div>

      {/* Linked SLTs */}
      {assignment.slts && assignment.slts.length > 0 && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Learning Targets</AndamioCardTitle>
            <AndamioCardDescription>
              This assignment covers {assignment.slts.length} Student Learning Target{assignment.slts.length !== 1 ? 's' : ''}
            </AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <div className="space-y-2">
              {assignment.slts.map((slt) => (
                <div key={slt.id} className="flex items-start gap-3 p-3 border rounded-md">
                  <AndamioBadge variant="outline" className="mt-0.5">
                    {slt.moduleIndex}
                  </AndamioBadge>
                  <AndamioText variant="small" className="flex-1 text-foreground">{slt.sltText}</AndamioText>
                </div>
              ))}
            </div>
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Assignment Content */}
      {assignment.contentJson && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Assignment Details</AndamioCardTitle>
            <AndamioCardDescription>Read the full assignment below</AndamioCardDescription>
          </AndamioCardHeader>
          <AndamioCardContent>
            <ContentViewer content={assignment.contentJson as JSONContent} />
          </AndamioCardContent>
        </AndamioCard>
      )}

      {/* Media */}
      {(assignment.imageUrl || assignment.videoUrl) && (
        <AndamioCard>
          <AndamioCardHeader>
            <AndamioCardTitle>Assignment Media</AndamioCardTitle>
          </AndamioCardHeader>
          <AndamioCardContent className="space-y-4">
            {assignment.imageUrl && (
              <div>
                <AndamioText variant="small" className="font-medium text-foreground mb-2">Image</AndamioText>
                <a
                  href={assignment.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {assignment.imageUrl}
                </a>
              </div>
            )}
            {assignment.videoUrl && (
              <div>
                <AndamioText variant="small" className="font-medium text-foreground mb-2">Video</AndamioText>
                <a
                  href={assignment.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  {assignment.videoUrl}
                </a>
              </div>
            )}
          </AndamioCardContent>
        </AndamioCard>
      )}

      <AndamioSeparator />

      {/* Assignment Commitment Component */}
      <AssignmentCommitment
        assignmentId={assignment.id}
        assignmentCode={assignment.assignmentCode}
        assignmentTitle={assignment.title}
        courseNftPolicyId={courseNftPolicyId}
        moduleCode={moduleCode}
      />
    </div>
  );
}
