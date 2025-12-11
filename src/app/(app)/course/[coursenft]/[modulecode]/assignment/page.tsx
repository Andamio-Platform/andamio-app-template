"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { env } from "~/env";
import { ContentViewer } from "~/components/editor";
import { AndamioAlert, AndamioAlertDescription, AndamioAlertTitle } from "~/components/andamio/andamio-alert";
import { AndamioBadge } from "~/components/andamio/andamio-badge";
import { AndamioSkeleton } from "~/components/andamio/andamio-skeleton";
import { AndamioCard, AndamioCardContent, AndamioCardDescription, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioSeparator } from "~/components/andamio/andamio-separator";
import { AndamioPageHeader } from "~/components/andamio";
import { AlertCircle } from "lucide-react";
import { AssignmentCommitment } from "~/components/learner/assignment-commitment";
import { CourseBreadcrumb } from "~/components/courses/course-breadcrumb";
import { type CourseOutput, type CourseModuleOutput } from "@andamio/db-api";
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

  const [course, setCourse] = useState<CourseOutput | null>(null);
  const [courseModule, setCourseModule] = useState<CourseModuleOutput | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssignment = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch course details for breadcrumb
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

        // Fetch module details for breadcrumb
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

        if (moduleResponse.ok) {
          const moduleData = (await moduleResponse.json()) as CourseModuleOutput;
          setCourseModule(moduleData);
        }

        // Fetch assignment details
        const response = await fetch(
          `${env.NEXT_PUBLIC_ANDAMIO_API_URL}/assignments/get`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              course_nft_policy_id: courseNftPolicyId,
              module_code: moduleCode,
            }),
          }
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
    return (
      <div className="space-y-6">
        <AndamioSkeleton className="h-8 w-32" />
        <AndamioSkeleton className="h-96 w-full" />
      </div>
    );
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

        <AndamioAlert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AndamioAlertTitle>Error</AndamioAlertTitle>
          <AndamioAlertDescription>{error ?? "Assignment not found"}</AndamioAlertDescription>
        </AndamioAlert>
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
                  <p className="text-sm flex-1">{slt.sltText}</p>
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
                <p className="text-sm font-medium mb-2">Image</p>
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
                <p className="text-sm font-medium mb-2">Video</p>
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
